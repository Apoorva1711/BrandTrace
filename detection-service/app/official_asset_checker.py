import re
from urllib.parse import urlparse
from typing import List, Tuple, Optional
from app.schemas import OfficialAssetInput, CandidateInput

def normalize_url(url: Optional[str]) -> str:
    """Normalize a URL for strict comparison: lowercased domain, stripped query/hash, trimmed trailing slash."""
    if not url:
        return ""
    try:
        url = url.strip()
        if not (url.startswith("http://") or url.startswith("https://")):
            url = "https://" + url
        parsed = urlparse(url)
        netloc = parsed.netloc.lower()
        # strip www.
        if netloc.startswith("www."):
            netloc = netloc[4:]
        path = parsed.path.rstrip("/").lower()
        return f"{netloc}{path}"
    except Exception:
        return url.strip().lower().rstrip("/")

def normalize_identifier(identifier: Optional[str]) -> str:
    """Normalize username/package identifier (lowercase, strip @ and whitespace)."""
    if not identifier:
        return ""
    clean = identifier.strip().lower()
    if clean.startswith("@"):
        clean = clean[1:]
    return clean

def check_official_asset_exclusion(
    candidate: CandidateInput,
    official_assets: List[OfficialAssetInput]
) -> Tuple[bool, Optional[str]]:
    """
    Check if a candidate matches an officially registered brand asset.
    Returns:
    - (True, reason) if candidate matches an official asset (Excluded).
    - (False, None) if candidate is not official and should be scanned.
    
    Security Rules:
    - Exact registered URL match => Exclude.
    - Exact social handle on same platform => Exclude.
    - Exact package/bundle ID on same store with registered listing => Exclude.
    - Publisher or Brand Name ALONE is strictly NOT sufficient to exclude!
    """
    if not official_assets:
        return False, None

    cand_norm_url = normalize_url(candidate.url)
    cand_norm_id = normalize_identifier(candidate.username_or_app_name)
    cand_norm_pkg = normalize_identifier(candidate.package_id)
    cand_platform = (candidate.platform_or_store or "").strip().lower()

    for asset in official_assets:
        asset_norm_url = normalize_url(asset.url)
        asset_norm_id = normalize_identifier(asset.identifier)
        asset_platform = (asset.platform_or_store or "").strip().lower()

        # 1. Exact URL Match
        if cand_norm_url and asset_norm_url and cand_norm_url == asset_norm_url:
            return True, f"Exact match with registered official asset URL: {asset.url}"

        # 2. Social Handle on same platform
        if candidate.candidate_type == "social":
            if asset.asset_type in ["social_profile", "official_social_profile"]:
                if cand_platform and asset_platform and cand_platform == asset_platform:
                    if cand_norm_id and asset_norm_id and cand_norm_id == asset_norm_id:
                        return True, f"Exact registered official social handle '@{asset.identifier}' on platform '{asset.platform_or_store}'"

        # 3. Mobile App Package ID / Bundle ID match on same store
        if candidate.candidate_type == "app":
            if asset.asset_type in ["mobile_app", "official_mobile_app"]:
                # Check package ID match
                if cand_norm_pkg and asset_norm_id and cand_norm_pkg == asset_norm_id:
                    return True, f"Exact match with registered official app package ID: '{asset.identifier}'"
                # Check if asset.identifier is the package ID and store matches
                if cand_platform and asset_platform and cand_platform == asset_platform:
                    if cand_norm_pkg and cand_norm_pkg == asset_norm_id:
                        return True, f"Exact registered official application '{asset.identifier}' on store '{asset.platform_or_store}'"

    return False, None
