import logging
import os
import sys
import time
import uuid
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from threading import Lock
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse

# Ensure backend module is resolvable
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.api.v1.router import api_router
from backend.api.v1.schemas import HealthResponse, MetricsResponse, ReadinessResponse
from backend.core.auth import get_auth_failure_counters
from backend.core.config import get_settings
from backend.db.firestore import get_db, init_db
from backend.services.catalog import catalog_service
from backend.services.recommendation import get_recommendation_artifact_status

settings = get_settings()
_rate_buckets: dict[str, deque[float]] = {}
_last_rate_bucket_prune = 0.0
logger = logging.getLogger('sonicstream.api')

_METRICS_MAX_PATHS = 200
_start_time = time.time()
_metrics_lock = Lock()
_metrics = {
    'total_requests': 0,
    'total_errors': 0,
    'status_code_counts': {},
    'method_counts': {},
    'path_counts': {},
    'latency_ms': deque(maxlen=2000),
}

if not logger.handlers:
    logging.basicConfig(
        level=os.environ.get('LOG_LEVEL', 'INFO').upper(),
        format='%(asctime)s %(levelname)s %(name)s %(message)s',
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)

ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '').split(',')
if not ALLOWED_ORIGINS or ALLOWED_ORIGINS == ['']:
    ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://sonicstream.vercel.app',
        'https://karthikeya2536-music-recommendation-system.hf.space',
        # Allow the deployed Hugging Face Space hostname as an origin so
        # browser fetches from the frontend can reach the API without CORS errors.
        'https://karthik3241-sonicstream.hf.space',
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


def _increment_counter(container: dict[str, int], key: str):
    container[key] = container.get(key, 0) + 1


def _record_metrics(method: str, path: str, status_code: int, duration_ms: float):
    with _metrics_lock:
        _metrics['total_requests'] += 1
        if status_code >= 400:
            _metrics['total_errors'] += 1

        _increment_counter(_metrics['status_code_counts'], str(status_code))
        _increment_counter(_metrics['method_counts'], method)

        if path in _metrics['path_counts'] or len(_metrics['path_counts']) < _METRICS_MAX_PATHS:
            _increment_counter(_metrics['path_counts'], path)

        _metrics['latency_ms'].append(duration_ms)


def _latency_snapshot() -> dict[str, float]:
    with _metrics_lock:
        samples = list(_metrics['latency_ms'])

    if not samples:
        return {'avg': 0.0, 'p95': 0.0, 'max': 0.0}

    avg = round(sum(samples) / len(samples), 2)
    ordered = sorted(samples)
    p95_index = max(0, int(len(ordered) * 0.95) - 1)
    p95 = round(ordered[p95_index], 2)
    maximum = round(ordered[-1], 2)
    return {'avg': avg, 'p95': p95, 'max': maximum}


def _error_payload(request: Request, code: str, message: str, details: Any = None) -> dict[str, Any]:
    request_id = getattr(request.state, 'request_id', 'n/a')
    payload: dict[str, Any] = {
        'error': {
            'code': code,
            'message': message,
            'request_id': request_id,
        }
    }
    if details is not None:
        payload['error']['details'] = details
    return payload


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, str) else 'Request failed'
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_payload(request, 'http_error', detail),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=_error_payload(request, 'validation_error', 'Validation failed', details=exc.errors()),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception('unhandled_exception request_id=%s path=%s', getattr(request.state, 'request_id', 'n/a'), request.url.path)
    return JSONResponse(
        status_code=500,
        content=_error_payload(request, 'internal_error', 'Internal server error'),
    )


@app.middleware('http')
async def request_trace_middleware(request: Request, call_next):
    request_id = request.headers.get('x-request-id', str(uuid.uuid4()))
    request.state.request_id = request_id
    start = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        client_ip = request.client.host if request.client else 'unknown'
        logger.exception(
            'request_failed request_id=%s method=%s path=%s ip=%s duration_ms=%s',
            request_id,
            request.method,
            request.url.path,
            client_ip,
            duration_ms,
        )
        _record_metrics(request.method, request.url.path, 500, duration_ms)
        raise

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    client_ip = request.client.host if request.client else 'unknown'
    logger.info(
        'request_complete request_id=%s method=%s path=%s status=%s ip=%s duration_ms=%s',
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        client_ip,
        duration_ms,
    )
    _record_metrics(request.method, request.url.path, response.status_code, duration_ms)
    response.headers['X-Request-ID'] = request_id
    return response


@app.middleware('http')
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    response.headers['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none'"

    forwarded_proto = request.headers.get('x-forwarded-proto', '')
    if request.url.scheme == 'https' or forwarded_proto == 'https':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    return response


def _prune_rate_buckets(now: float, window_seconds: int) -> None:
    global _last_rate_bucket_prune

    # Avoid expensive full scans on every request.
    if now - _last_rate_bucket_prune < max(1, window_seconds // 2):
        return

    stale_keys = []
    for key, bucket in _rate_buckets.items():
        while bucket and (now - bucket[0]) > window_seconds:
            bucket.popleft()
        if not bucket:
            stale_keys.append(key)

    for key in stale_keys:
        _rate_buckets.pop(key, None)

    # If still too many keys, evict oldest buckets first.
    max_keys = settings.RATE_LIMIT_BUCKET_MAX_KEYS
    if len(_rate_buckets) > max_keys:
        ranked = sorted(
            _rate_buckets.items(),
            key=lambda item: item[1][-1] if item[1] else 0,
        )
        excess = len(_rate_buckets) - max_keys
        for key, _ in ranked[:excess]:
            _rate_buckets.pop(key, None)

    _last_rate_bucket_prune = now


def _allow_request(key: str, max_requests: int, window_seconds: int) -> bool:
    now = time.time()
    _prune_rate_buckets(now, window_seconds)

    bucket = _rate_buckets.setdefault(key, deque())

    while bucket and (now - bucket[0]) > window_seconds:
        bucket.popleft()

    if len(bucket) >= max_requests:
        return False

    bucket.append(now)
    return True


@app.middleware('http')
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path

    if not path.startswith(settings.API_V1_STR):
        return await call_next(request)

    forwarded_for = request.headers.get('x-forwarded-for')
    if forwarded_for:
        client_ip = forwarded_for.split(',')[0].strip()
    else:
        client_ip = request.client.host if request.client else 'unknown'

    is_write = request.method.upper() in {'POST', 'PUT', 'PATCH', 'DELETE'}
    read_key = f'read:{client_ip}'
    write_key = f'write:{client_ip}'

    if not _allow_request(read_key, settings.RATE_LIMIT_READ_MAX, settings.RATE_LIMIT_WINDOW_SECONDS):
        response = JSONResponse(
            status_code=429,
            content=_error_payload(request, 'rate_limited', 'Too many requests'),
            headers={'Retry-After': str(settings.RATE_LIMIT_WINDOW_SECONDS)},
        )
        response.headers['X-Request-ID'] = getattr(request.state, 'request_id', 'n/a')
        return response

    if is_write and not _allow_request(write_key, settings.RATE_LIMIT_WRITE_MAX, settings.RATE_LIMIT_WINDOW_SECONDS):
        response = JSONResponse(
            status_code=429,
            content=_error_payload(request, 'rate_limited_write', 'Too many write requests'),
            headers={'Retry-After': str(settings.RATE_LIMIT_WINDOW_SECONDS)},
        )
        response.headers['X-Request-ID'] = getattr(request.state, 'request_id', 'n/a')
        return response

    return await call_next(request)


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get('/health', response_model=HealthResponse)
def health_check():
    return {
        'status': 'ok',
        'version': settings.VERSION,
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }


@app.get('/ready', response_model=ReadinessResponse)
def readiness_check():
    db_ready = get_db() is not None
    rec_status = get_recommendation_artifact_status()
    rec_ready = rec_status['embeddings_exists'] and rec_status['dataset_exists']

    checks = {
        'database': db_ready,
        'recommendation_artifacts': rec_ready,
    }

    payload = {
        'status': 'ready' if all(checks.values()) else 'degraded',
        'checks': checks,
        'details': {
            'recommendation': rec_status,
            'catalog_cache': catalog_service.get_cache_stats(),
        },
    }

    if all(checks.values()):
        return payload

    return JSONResponse(status_code=503, content=payload)


@app.get('/metrics', response_model=MetricsResponse)
def metrics_snapshot():
    with _metrics_lock:
        counters = {
            'total_requests': _metrics['total_requests'],
            'total_errors': _metrics['total_errors'],
            'status_code_counts': dict(_metrics['status_code_counts']),
            'method_counts': dict(_metrics['method_counts']),
            'path_counts': dict(_metrics['path_counts']),
            'auth_failures': get_auth_failure_counters(),
            'catalog_cache': catalog_service.get_cache_stats(),
            'rate_limit_bucket_keys': len(_rate_buckets),
            'sample_size': len(_metrics['latency_ms']),
        }

    return {
        'status': 'ok',
        'uptime_seconds': round(time.time() - _start_time, 2),
        'counters': counters,
        'latency_ms': _latency_snapshot(),
    }


def _prometheus_escape(value: str) -> str:
    return value.replace('\\', '\\\\').replace('"', '\\"')


@app.get('/metrics/prometheus')
def metrics_prometheus():
    with _metrics_lock:
        total_requests = _metrics['total_requests']
        total_errors = _metrics['total_errors']
        status_counts = dict(_metrics['status_code_counts'])
        method_counts = dict(_metrics['method_counts'])
        path_counts = dict(_metrics['path_counts'])

    lat = _latency_snapshot()
    auth_failures = get_auth_failure_counters()
    catalog_cache = catalog_service.get_cache_stats()
    uptime = round(time.time() - _start_time, 2)

    lines = [
        '# HELP sonicstream_uptime_seconds Process uptime in seconds',
        '# TYPE sonicstream_uptime_seconds gauge',
        f'sonicstream_uptime_seconds {uptime}',
        '# HELP sonicstream_http_requests_total Total HTTP requests seen by middleware',
        '# TYPE sonicstream_http_requests_total counter',
        f'sonicstream_http_requests_total {total_requests}',
        '# HELP sonicstream_http_errors_total Total HTTP responses with status >= 400',
        '# TYPE sonicstream_http_errors_total counter',
        f'sonicstream_http_errors_total {total_errors}',
        '# HELP sonicstream_http_request_latency_avg_ms Rolling average request latency in ms',
        '# TYPE sonicstream_http_request_latency_avg_ms gauge',
        f"sonicstream_http_request_latency_avg_ms {lat['avg']}",
        '# HELP sonicstream_http_request_latency_p95_ms Rolling p95 request latency in ms',
        '# TYPE sonicstream_http_request_latency_p95_ms gauge',
        f"sonicstream_http_request_latency_p95_ms {lat['p95']}",
        '# HELP sonicstream_http_request_latency_max_ms Rolling max request latency in ms',
        '# TYPE sonicstream_http_request_latency_max_ms gauge',
        f"sonicstream_http_request_latency_max_ms {lat['max']}",
        '# HELP sonicstream_catalog_cache_entries Catalog cache current entries',
        '# TYPE sonicstream_catalog_cache_entries gauge',
        f"sonicstream_catalog_cache_entries {catalog_cache['entries']}",
        '# HELP sonicstream_catalog_cache_hits Catalog cache hits',
        '# TYPE sonicstream_catalog_cache_hits counter',
        f"sonicstream_catalog_cache_hits {catalog_cache['hits']}",
        '# HELP sonicstream_catalog_cache_misses Catalog cache misses',
        '# TYPE sonicstream_catalog_cache_misses counter',
        f"sonicstream_catalog_cache_misses {catalog_cache['misses']}",
        '# HELP sonicstream_rate_limit_bucket_keys Current rate limiter bucket keys',
        '# TYPE sonicstream_rate_limit_bucket_keys gauge',
        f'sonicstream_rate_limit_bucket_keys {len(_rate_buckets)}',
    ]

    lines.append('# HELP sonicstream_http_status_total HTTP status code counts')
    lines.append('# TYPE sonicstream_http_status_total counter')
    for code, count in sorted(status_counts.items()):
        lines.append(f'sonicstream_http_status_total{{code="{_prometheus_escape(code)}"}} {count}')

    lines.append('# HELP sonicstream_http_method_total HTTP method counts')
    lines.append('# TYPE sonicstream_http_method_total counter')
    for method, count in sorted(method_counts.items()):
        lines.append(f'sonicstream_http_method_total{{method="{_prometheus_escape(method)}"}} {count}')

    lines.append('# HELP sonicstream_http_path_total HTTP path counts')
    lines.append('# TYPE sonicstream_http_path_total counter')
    for path, count in sorted(path_counts.items()):
        lines.append(f'sonicstream_http_path_total{{path="{_prometheus_escape(path)}"}} {count}')

    lines.append('# HELP sonicstream_auth_failures_total Auth failure counts by reason')
    lines.append('# TYPE sonicstream_auth_failures_total counter')
    for reason, count in sorted(auth_failures.items()):
        lines.append(f'sonicstream_auth_failures_total{{reason="{_prometheus_escape(reason)}"}} {count}')

    return PlainTextResponse('\n'.join(lines) + '\n', media_type='text/plain; version=0.0.4')


@app.get('/')
def read_root():
    return {'status': 'SonicStream API Running', 'version': settings.VERSION}


if __name__ == '__main__':
    import uvicorn

    port = int(os.environ.get('PORT', 8000))
    uvicorn.run('backend.main:app', host='0.0.0.0', port=port)
