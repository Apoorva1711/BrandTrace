import re
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse

from app.schemas import (
    BrandInput, OfficialAssetInput, CandidateInput,
    MatchEvaluationResult, SignalBreakdown
)
from app.name_matcher import evaluate_name_similarity, normalize_text
from app.logo_matcher import evaluate_logo_similarity
from app.official_asset_checker import check_official_asset_exclusion, normalize_identifier

SUSPICIOUS_DESCRIPTION_PHRASES = [
    'customer support', 'official support', 'help desk', 'helpdesk', 'customer service',
    'verify account', 'verification portal', 'claim reward', 'claim your bonus',
    'connect wallet', 'airdrop bonus', 'free token', 'support agent', 'reset password',
    'kyc update', 'security alert', 'unauthorized access', '24/7 support', 'dm for help',
    'urgent assistance', 'giveaway', 'lottery winner', 'investment return'
]

URL_SHORTENERS = {'bit.ly', 'tinyurl.com', 't.co', 'rb.gy', 'cutt.ly', 'is.gd', 'ow.ly', 'buff.ly'}

def evaluate_candidate_threat(
    brand: BrandInput,
    official_assets: List[OfficialAssetInput],
    candidate: CandidateInput
) -> MatchEvaluationResult:
    """
    Main evaluation function for a single candidate against a target brand and its official assets.
    Returns explainable MatchEvaluationResult with point-by-point breakdown.
    """
    # Step 1: Check Official Asset Exclusion FIRST
    is_excluded, exclusion_reason = check_official_asset_exclusion(candidate, official_assets)
    if is_excluded:
        return MatchEvaluationResult(
            candidate_id=candidate.candidate_id,
            username_or_app_name=candidate.username_or_app_name,
            is_excluded=True,
            exclusion_reason=exclusion_reason,
            risk_score=0,
            risk_category="Low",
            signals=SignalBreakdown(),
            explanation=[f"Candidate excluded from active threats: {exclusion_reason}"],
            recommended_action="Excluded: Verified official brand asset. No investigation required."
        )

    explanation: List[str] = []

    # Signal 1: Name Similarity (Max 30 points)
    # Compare both username/appName and displayName if available
    name_res_1 = evaluate_name_similarity(brand.name, candidate.username_or_app_name, brand.aliases)
    name_res_2 = evaluate_name_similarity(brand.name, candidate.display_name or "", brand.aliases) if candidate.display_name else {"score": 0.0, "ratio": 0.0, "match_type": "none", "details": []}

    if name_res_2["score"] > name_res_1["score"]:
        primary_name_res = name_res_2
    else:
        primary_name_res = name_res_1

    name_score = primary_name_res["score"]
    explanation.extend(primary_name_res["details"])

    # Signal 2: Logo Perceptual Similarity (Max 25 points)
    # Strictly do NOT invent score if no image comparison
    logo_res = evaluate_logo_similarity(
        official_hash=brand.logo_hash,
        candidate_hash=candidate.avatar_hash
    )
    logo_score = logo_res["score"]
    if logo_res["evaluated"]:
        explanation.append(f"Logo analysis: {logo_res['details']} (+{logo_score:.1f} pts)")
    else:
        explanation.append("Logo analysis: Skipped (no candidate or official logo hash available).")

    # Signal 3: Publisher or Identity Mismatch (Max 20 points)
    publisher_score = 0.0
    publisher_eval = "verified_or_neutral"

    # Collect official publishers and trusted identities
    official_publishers = [
        normalize_identifier(a.publisher_name) for a in official_assets if a.publisher_name
    ]
    brand_norm_name = normalize_identifier(brand.name)
    brand_legal_name = normalize_identifier(brand.legal_name or "")

    if candidate.candidate_type == "app":
        cand_pub = normalize_identifier(candidate.publisher_name or "")
        if cand_pub:
            # If name similarity is moderate/high, but publisher is completely different
            is_official_pub = (cand_pub == brand_norm_name) or (brand_legal_name and cand_pub == brand_legal_name) or (cand_pub in official_publishers)
            if not is_official_pub:
                if name_score >= 18.0:
                    publisher_score = 20.0
                    publisher_eval = "unauthorized_third_party_publisher"
                    explanation.append(
                        f"Publisher mismatch: App mimics brand name but is published by untrusted developer '{candidate.publisher_name}' (+20.0 pts)."
                    )
                elif name_score >= 10.0:
                    publisher_score = 12.0
                    publisher_eval = "unverified_developer"
                    explanation.append(
                        f"Unverified developer: App resembles brand but publisher '{candidate.publisher_name}' does not match official entities (+12.0 pts)."
                    )
            else:
                publisher_eval = "trusted_publisher"
                explanation.append(f"Publisher matches trusted organization '{candidate.publisher_name}'.")
        else:
            publisher_eval = "missing_publisher_info"
            explanation.append("App publisher information not disclosed.")
    else:
        # Social Profile Identity context
        # If profile has high name similarity, check if it's an unverified fan/support account
        if name_score >= 20.0:
            if candidate.followers is not None and candidate.followers < 100:
                publisher_score = 8.0
                publisher_eval = "low_follower_brand_claim"
                explanation.append(f"Low follower count ({candidate.followers}) claiming brand identity (+8.0 pts).")
            else:
                publisher_eval = "unverified_social_profile"

    # Signal 4: Description and Contextual Indicators (Max 15 points)
    context_score = 0.0
    flagged_kws: List[str] = []
    desc_norm = normalize_text(candidate.description or "")
    if desc_norm:
        for phrase in SUSPICIOUS_DESCRIPTION_PHRASES:
            if phrase in desc_norm:
                flagged_kws.append(phrase)

        # Also check brand keywords if configured
        for kw in brand.keywords:
            kw_norm = normalize_text(kw)
            if kw_norm and kw_norm in desc_norm and kw_norm not in flagged_kws:
                flagged_kws.append(kw_norm)

        if flagged_kws:
            # 5 points per indicator phrase up to 15 max
            context_score = min(15.0, float(len(flagged_kws) * 5.0))
            explanation.append(
                f"Suspicious contextual keywords identified in profile description: {', '.join(flagged_kws[:4])} (+{context_score:.1f} pts)."
            )

    # Signal 5: External Link & Source Evidence (Max 10 points)
    ext_link_score = 0.0
    link_eval = "neutral"
    ext_url = candidate.external_url or ""
    if ext_url:
        try:
            parsed = urlparse(ext_url if ext_url.startswith("http") else f"https://{ext_url}")
            domain = parsed.netloc.lower()
            if domain.startswith("www."):
                domain = domain[4:]

            # Check if domain matches official trusted domains
            trusted_domains = [d.lower().strip() for d in brand.trusted_domains]
            if brand.website_url:
                trusted_domains.append(urlparse(brand.website_url).netloc.lower())

            if any(domain == td or domain.endswith("." + td) for td in trusted_domains if td):
                link_eval = "official_domain_match"
                explanation.append(f"External link points to verified trusted domain '{domain}'.")
            elif any(shortener in domain for shortener in URL_SHORTENERS):
                ext_link_score = 10.0
                link_eval = "suspicious_url_shortener"
                explanation.append(f"External link uses URL redirection/shortener service '{domain}' (+10.0 pts).")
            else:
                # Untrusted domain with brand name similarity
                if name_score >= 15.0:
                    ext_link_score = 8.0
                    link_eval = "untrusted_external_destination"
                    explanation.append(f"External link directs to unrecognized domain '{domain}' (+8.0 pts).")
                else:
                    ext_link_score = 4.0
                    link_eval = "third_party_link"
                    explanation.append(f"Profile references external destination '{domain}' (+4.0 pts).")
        except Exception:
            link_eval = "invalid_link_format"

    # Calculate Total Risk Score (0 - 100)
    raw_total = name_score + logo_score + publisher_score + context_score + ext_link_score
    total_score = int(min(100.0, max(0.0, round(raw_total))))

    # Determine Risk Category
    if total_score >= 80:
        category = "Critical"
        recommended_action = "Critical Risk: Immediate triage required. Inspect candidate domains and escalate for brand protection action."
    elif total_score >= 60:
        category = "High"
        recommended_action = "High Risk: Prioritize analyst review. Check impersonation intent and verify publisher authenticity."
    elif total_score >= 30:
        category = "Medium"
        recommended_action = "Medium Risk: Monitor account activity and inspect subsequent profile changes."
    else:
        category = "Low"
        recommended_action = "Low Risk: Benign or low-confidence candidate. Standard automated periodic scanning."

    signals = SignalBreakdown(
        name_similarity_score=round(name_score, 1),
        name_similarity_ratio=round(primary_name_res["ratio"], 1),
        name_match_type=primary_name_res["match_type"],
        logo_similarity_score=round(logo_score, 1),
        logo_evaluated=logo_res["evaluated"],
        logo_hash_distance=logo_res.get("distance"),
        publisher_mismatch_score=round(publisher_score, 1),
        publisher_evaluation=publisher_eval,
        context_indicators_score=round(context_score, 1),
        flagged_keywords=flagged_kws,
        external_link_score=round(ext_link_score, 1),
        link_evaluation=link_eval
    )

    return MatchEvaluationResult(
        candidate_id=candidate.candidate_id,
        username_or_app_name=candidate.username_or_app_name,
        is_excluded=False,
        exclusion_reason=None,
        risk_score=total_score,
        risk_category=category,
        signals=signals,
        explanation=explanation,
        recommended_action=recommended_action
    )
