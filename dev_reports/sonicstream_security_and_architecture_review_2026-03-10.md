# Sonicstream Review: Improvements, Security Risks, and Better Architecture Options

Date: 2026-03-10  
Scope: `frontend`, `backend`, `recommendation_engine`, deployment/configuration files

## 1) Executive Summary

Sonicstream is a strong full-stack foundation with a polished UI, clear service layering, and an ML recommendation pipeline already integrated into product flows.  
The biggest risks are security and production hardening, not core product direction.

Top priorities:
1. Lock down secrets and credentials immediately.
2. Add real backend authorization checks (not only frontend route guards).
3. Add API hardening (validation, rate limits, abuse controls).
4. Stabilize recommendation/data flows (ID mapping, retraining/inference consistency).
5. Add CI tests and operational observability.

## 2) What Is Working Well

1. Clean separation of concerns:
- `frontend` (React + Zustand + Firebase Auth)
- `backend` (FastAPI endpoints/services)
- `recommendation_engine` (training + embeddings inference)

2. Good product UX direction:
- Rich home/search/player experience
- Protected routes and user library flows

3. Practical recommendation fallback:
- Cold-start behavior avoids empty screens

4. Deployment flexibility:
- Docker + Vercel-compatible API entry point

## 3) Security Vulnerabilities and How to Fix Them

## Critical (Fix Now)

1. Secret exposure risk in local config and service account handling
- Risk: Sensitive values are present in env files and a Firebase service account key exists in workspace.
- Impact: Account takeover, data access, abuse, billing risk.
- Fix:
  - Rotate all sensitive secrets immediately (Firebase service account, any server-side secrets, reCAPTCHA secret).
  - Never store service account JSON in repo/workspace for production flows.
  - Use platform secret managers only (Vercel/Cloud Run/GitHub Actions secrets).
  - Add automated secret scanning (e.g., Gitleaks/TruffleHog) in CI.

2. Backend trusts user-provided `user_id` without auth enforcement
- Risk: Client can read/modify another user's library/interactions by submitting a different `user_id`.
- Impact: Horizontal privilege escalation and data tampering.
- Fix:
  - Require Firebase ID token (or JWT) on all user-scoped endpoints.
  - Verify token on backend and derive `user_id` from token claims only.
  - Remove trust in body/query `user_id` where user context is required.

3. No abuse/rate protection on public endpoints
- Risk: Bot spam on `/interactions/track`, `/tracks/search`, `/recommend/{user_id}` and potential resource exhaustion.
- Impact: Increased cloud cost, degraded performance, denial of service patterns.
- Fix:
  - Add rate limiting per IP/user/token.
  - Add request size/time limits and standardized timeout handling.
  - Add basic bot protection on sensitive write endpoints.

## High

1. CORS and API hardening can be stricter
- Current CORS is better than wildcard, but write endpoints still need stronger auth + origin controls.
- Fix:
  - Keep a strict allowlist per environment.
  - Enforce HTTPS-only in production.
  - Add security headers middleware (HSTS, X-Content-Type-Options, etc.).

2. Firestore access model is unclear from server boundary
- Risk: If Firestore security rules are permissive, auth bypass becomes severe.
- Fix:
  - Audit Firestore rules for least privilege.
  - Ensure backend service account is only used server-side.
  - Restrict direct client writes unless strictly needed.

3. Third-party audio source dependency from client
- Risk: External API scraping/search in player can break and may introduce legal/compliance exposure.
- Fix:
  - Move content resolution server-side with caching and validation.
  - Prefer licensed/stable content APIs if production-scale.

## Medium

1. Input validation and schema hardening
- Fix:
  - Add stricter Pydantic constraints (length, regex, enums, min/max bounds).
  - Normalize and sanitize user-entered fields before persistence.

2. Missing audit logging and anomaly detection
- Fix:
  - Add structured logs for auth failures, access denials, and elevated error rates.
  - Add alerting for spikes in write endpoints.

## 4) Product and Engineering Improvements (Beyond Security)

## Architecture and Backend

1. Introduce service-level auth middleware:
- Central dependency to verify token and attach user context.

2. Normalize library/playlist data model:
- Keep one canonical storage pattern (document fields vs subcollections).
- Add migration script and backward compatibility guard.

3. API contract versioning and OpenAPI quality:
- Add explicit response models for all endpoints.
- Add error code taxonomy and consistent error payloads.

4. Add background jobs for ML sync:
- Replace ad-hoc sync trigger with scheduled, idempotent job.
- Maintain checkpoints for incremental interaction ingestion.

## Recommendation System

1. Improve ID mapping reliability:
- Current user/song index assumptions can drift.
- Add deterministic mapping table for songs and users with versioned snapshots.

2. Upgrade from single-stage ranking to 2-stage recommender:
- Stage 1: candidate retrieval (collab/content/popularity).
- Stage 2: reranker (context + personalization).
- Benefit: better quality and resilience at scale.

3. Add offline metrics and online guardrails:
- Precision@K, Recall@K, NDCG for offline.
- CTR, completion rate, skip rate for online.

4. Create model artifact registry:
- Track model version, embedding version, dataset version, and training timestamp.
- Prevent serving incompatible artifacts.

## Frontend

1. Move sensitive/fragile integrations away from browser where possible.
2. Add retry/backoff and better error states for data fetches.
3. Split `store` responsibilities (auth, player, library) to reduce coupling.
4. Add component and integration tests for critical flows (login, play, like, library sync).

## DevEx and Operations

1. CI pipeline:
- Lint + typecheck + tests + security scan on every PR.

2. Environment strategy:
- `.env.example` per app (frontend/backend) with required keys documented.

3. Observability:
- Error tracking (Sentry), API metrics, and dashboard for latency/error rates.

4. Repository hygiene:
- Keep generated artifacts and large files out git unless intentionally versioned.
- Consider Git LFS for large ML artifacts.

## 5) Is a Better Approach Available?

Yes, depending on your next goal.

## Option A: Keep Current Architecture, Harden It (Recommended near-term)

Best if you want fastest path to stable production.

Why this is good:
1. Low migration risk.
2. Preserves current UI/UX and ML work.
3. Most improvements are incremental and high-impact.

## Option B: Managed Backend-Centric Personalization

Shift more logic to backend jobs + managed data pipeline.

What changes:
1. Frontend becomes thinner.
2. Recommendation generation runs in scheduled pipelines.
3. API serves precomputed + on-demand reranked lists.

Tradeoff:
- Better reliability and scale, but more infra design upfront.

## Option C: Pure BaaS-First Simpler Stack (if speed > custom ML)

If focus is shipping product quickly with lower operational load:
1. Keep Firebase Auth/Firestore.
2. Use simpler heuristic recommenders + analytics-driven iteration.
3. Add ML later when usage scale justifies complexity.

Tradeoff:
- Faster shipping, lower ML sophistication initially.

## Recommended path for Sonicstream:
1. Do Option A immediately (security + reliability).
2. Evolve toward Option B once baseline is stable and usage grows.

## 6) 30-60-90 Day Action Plan

## First 30 Days (Security and Stability)

1. Rotate all secrets and enforce secret manager usage.
2. Add token verification middleware and remove trusted `user_id` inputs.
3. Add rate limiting and request validation hardening.
4. Audit Firestore rules and lock privileges.
5. Add CI checks: lint, typecheck, unit tests, secret scan.

## Days 31-60 (Data and Recommendation Robustness)

1. Standardize playlist/library schema.
2. Version model artifacts and mapping tables.
3. Add scheduled interaction sync + retrain workflow.
4. Build offline evaluation notebook/pipeline.

## Days 61-90 (Scale and Product Quality)

1. Implement 2-stage recommendation architecture.
2. Add observability dashboard + alerts.
3. Introduce A/B testing for recommendation changes.
4. Optimize player/content pipeline for reliability and compliance.

## 7) Quick Checklist

Security:
1. [ ] Rotate secrets
2. [ ] Enforce backend auth on all user data endpoints
3. [ ] Add rate limiting + bot control
4. [ ] Firestore rules audit completed

Engineering:
1. [ ] CI pipeline active
2. [ ] Unified data schema
3. [ ] Model/version governance in place
4. [ ] Monitoring + alerts configured

Product/ML:
1. [ ] Recommendation quality metrics tracked
2. [ ] Cold-start strategy improved
3. [ ] 2-stage recommender design drafted

---

If you want, next step I can generate:
1. A concrete security patch list by file (exact code edits).
2. A backend auth middleware implementation plan for FastAPI + Firebase token verification.
3. A step-by-step migration plan from current recommender to a 2-stage architecture.
