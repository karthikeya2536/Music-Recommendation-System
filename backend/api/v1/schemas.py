from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class TrackRecord(BaseModel):
    model_config = ConfigDict(extra='allow')


class TrackListResponse(BaseModel):
    tracks: list[TrackRecord] = Field(default_factory=list)


class RecommendationsResponse(BaseModel):
    recommendations: list[TrackRecord] = Field(default_factory=list)
    info: Optional[str] = None


class LibraryResponse(BaseModel):
    liked: list[str] = Field(default_factory=list)
    playlists: list[dict[str, Any]] = Field(default_factory=list)


class LikeActionResponse(BaseModel):
    status: str
    song_id: str
    action: str


class PlaylistResponse(BaseModel):
    status: str
    playlist: dict[str, Any]


class StatusResponse(BaseModel):
    status: str


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str


class ReadinessResponse(BaseModel):
    status: str
    checks: dict[str, bool]
    details: dict[str, Any] = Field(default_factory=dict)


class MetricsResponse(BaseModel):
    status: str
    uptime_seconds: float
    counters: dict[str, Any]
    latency_ms: dict[str, float]


class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str
    details: Optional[Any] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
