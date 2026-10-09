from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class OfficialAssetInput(BaseModel):
    asset_type: str = Field(..., description="social_profile, mobile_app, domain, logo, trusted_publisher, brand_alias")
    identifier: str = Field("", description="handle, package_id, domain, etc.")
    url: Optional[str] = ""
    platform_or_store: Optional[str] = ""
    publisher_name: Optional[str] = ""

class BrandInput(BaseModel):
    name: str
    legal_name: Optional[str] = ""
    aliases: List[str] = Field(default_factory=list)
    website_url: Optional[str] = ""
    trusted_domains: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    logo_hash: Optional[str] = None

class CandidateInput(BaseModel):
    candidate_id: Optional[str] = None
    candidate_type: str = Field(..., description="'social' or 'app'")
    platform_or_store: Optional[str] = ""
    username_or_app_name: str
    display_name: Optional[str] = ""
    url: Optional[str] = ""
    external_url: Optional[str] = ""
    description: Optional[str] = ""
    publisher_name: Optional[str] = ""
    package_id: Optional[str] = ""
    avatar_hash: Optional[str] = None
    avatar_url: Optional[str] = None
    followers: Optional[int] = 0

class SignalBreakdown(BaseModel):
    name_similarity_score: float = Field(0.0, description="Up to 30 points")
    name_similarity_ratio: float = Field(0.0, description="Raw 0-100 similarity percentage")
    name_match_type: str = "none"
    logo_similarity_score: float = Field(0.0, description="Up to 25 points")
    logo_evaluated: bool = False
    logo_hash_distance: Optional[int] = None
    publisher_mismatch_score: float = Field(0.0, description="Up to 20 points")
    publisher_evaluation: str = "n/a"
    context_indicators_score: float = Field(0.0, description="Up to 15 points")
    flagged_keywords: List[str] = Field(default_factory=list)
    external_link_score: float = Field(0.0, description="Up to 10 points")
    link_evaluation: str = "none"

class MatchEvaluationResult(BaseModel):
    candidate_id: Optional[str] = None
    username_or_app_name: str
    is_excluded: bool = False
    exclusion_reason: Optional[str] = None
    risk_score: int = 0
    risk_category: str = "Low"  # Low (0-29), Medium (30-59), High (60-79), Critical (80-100)
    signals: SignalBreakdown
    explanation: List[str] = Field(default_factory=list)
    recommended_action: str = "No immediate threat detected. Standard periodic monitoring."

class MatchRequest(BaseModel):
    brand: BrandInput
    official_assets: List[OfficialAssetInput] = Field(default_factory=list)
    candidate: CandidateInput

class BatchMatchRequest(BaseModel):
    brand: BrandInput
    official_assets: List[OfficialAssetInput] = Field(default_factory=list)
    candidates: List[CandidateInput] = Field(default_factory=list)

class BatchMatchResponse(BaseModel):
    total_evaluated: int
    excluded_count: int
    findings_count: int
    results: List[MatchEvaluationResult]

class HealthStatus(BaseModel):
    status: str
    service: str
    version: str
