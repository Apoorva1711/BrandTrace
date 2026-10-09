import pytest
from app.schemas import BrandInput, OfficialAssetInput, CandidateInput
from app.name_matcher import evaluate_name_similarity, normalize_text
from app.logo_matcher import evaluate_logo_similarity
from app.official_asset_checker import check_official_asset_exclusion
from app.risk_scorer import evaluate_candidate_threat

@pytest.fixture
def sample_brand():
    return BrandInput(
        name="ApexPay",
        legal_name="ApexPay Technologies Inc.",
        aliases=["Apex Pay", "ApexPayments"],
        website_url="https://apexpay.example.com",
        trusted_domains=["apexpay.example.com", "apexpay-api.example.com"],
        keywords=["fintech", "payment", "wallet", "transfer"],
        logo_hash="e1a4b2c3d4e5f607"
    )

@pytest.fixture
def sample_official_assets():
    return [
        OfficialAssetInput(
            asset_type="official_social_profile",
            identifier="ApexPayOfficial",
            url="https://twitter.com/ApexPayOfficial",
            platform_or_store="Twitter",
            publisher_name="ApexPay Technologies Inc."
        ),
        OfficialAssetInput(
            asset_type="official_mobile_app",
            identifier="com.apexpay.mobile",
            url="https://play.google.com/store/apps/details?id=com.apexpay.mobile",
            platform_or_store="Google Play",
            publisher_name="ApexPay Technologies Inc."
        ),
        OfficialAssetInput(
            asset_type="domain",
            identifier="apexpay.example.com",
            url="https://apexpay.example.com",
            platform_or_store="Web"
        )
    ]

def test_name_spacing_variation():
    res = evaluate_name_similarity("ApexPay", "Apex Pay")
    assert res["score"] >= 25.0
    assert res["ratio"] >= 90.0

def test_name_character_substitution():
    # 3 -> e, 0 -> o
    res = evaluate_name_similarity("ApexPay", "Ap3xPay")
    assert res["score"] >= 25.0
    assert res["match_type"] == "character_substitution"

def test_name_extra_characters():
    res = evaluate_name_similarity("ApexPay", "ApexPayy")
    assert res["score"] >= 20.0
    assert res["match_type"] == "extra_character_variation"

def test_name_with_support_keyword():
    res = evaluate_name_similarity("ApexPay", "ApexPay_Support_Desk")
    assert res["score"] >= 25.0
    assert res["match_type"] == "brand_with_support_keyword"

def test_legitimate_unrelated_name():
    res = evaluate_name_similarity("ApexPay", "Evergreen Mountain Forestry")
    assert res["score"] < 10.0
    assert res["ratio"] < 40.0

def test_missing_candidate_fields():
    res = evaluate_name_similarity("ApexPay", "")
    assert res["score"] == 0.0
    assert res["ratio"] == 0.0

def test_missing_logo_images():
    res = evaluate_logo_similarity(official_hash="e1a4b2c3d4e5f607", candidate_hash=None)
    assert res["score"] == 0.0
    assert res["evaluated"] is False
    assert "missing" in res["details"].lower()

def test_matching_logo_hashes():
    # Identical hash => hamming distance 0
    res = evaluate_logo_similarity(official_hash="e1a4b2c3d4e5f607", candidate_hash="e1a4b2c3d4e5f607")
    assert res["score"] == 25.0
    assert res["evaluated"] is True
    assert res["distance"] == 0

def test_official_social_asset_exclusion(sample_brand, sample_official_assets):
    official_cand = CandidateInput(
        candidate_type="social",
        platform_or_store="Twitter",
        username_or_app_name="ApexPayOfficial",
        url="https://twitter.com/ApexPayOfficial"
    )
    is_excluded, reason = check_official_asset_exclusion(official_cand, sample_official_assets)
    assert is_excluded is True
    assert "Exact registered official social handle" in reason or "Exact match with registered official asset URL" in reason

def test_official_app_exclusion(sample_brand, sample_official_assets):
    official_app = CandidateInput(
        candidate_type="app",
        platform_or_store="Google Play",
        username_or_app_name="ApexPay Mobile",
        package_id="com.apexpay.mobile",
        url="https://play.google.com/store/apps/details?id=com.apexpay.mobile"
    )
    is_excluded, reason = check_official_asset_exclusion(official_app, sample_official_assets)
    assert is_excluded is True
    assert "registered official" in reason

def test_threat_scoring_critical_impersonator(sample_brand, sample_official_assets):
    threat_cand = CandidateInput(
        candidate_type="social",
        platform_or_store="Twitter",
        username_or_app_name="ApexPay_Support_Help",
        display_name="ApexPay Customer Support",
        description="Official support desk. Claim your bonus and reset password here.",
        external_url="https://bit.ly/apexpay-bonus",
        followers=12
    )
    result = evaluate_candidate_threat(sample_brand, sample_official_assets, threat_cand)
    assert result.is_excluded is False
    assert 60 <= result.risk_score <= 100
    assert result.risk_category in ["High", "Critical"]
    assert len(result.explanation) > 0
    assert result.signals.name_similarity_score > 0
    assert result.signals.context_indicators_score > 0
    assert result.signals.external_link_score > 0

def test_threat_scoring_unauthorized_app(sample_brand, sample_official_assets):
    fake_app = CandidateInput(
        candidate_type="app",
        platform_or_store="Google Play",
        username_or_app_name="ApexPay Fast Cash",
        package_id="com.scam.fastcash.apexpay",
        publisher_name="Unknown Shady Devs Ltd",
        description="Instant loan and payments. Enter wallet credentials.",
        external_url="http://untrusted-loans.xyz"
    )
    result = evaluate_candidate_threat(sample_brand, sample_official_assets, fake_app)
    assert result.is_excluded is False
    assert result.signals.publisher_mismatch_score > 0
    assert result.risk_score >= 50

def test_risk_score_bounds(sample_brand, sample_official_assets):
    # Test extreme candidates
    benign = CandidateInput(
        candidate_type="social",
        platform_or_store="LinkedIn",
        username_or_app_name="TotallyUnrelatedCorp",
        description="Enterprise industrial packaging systems."
    )
    res_benign = evaluate_candidate_threat(sample_brand, sample_official_assets, benign)
    assert 0 <= res_benign.risk_score <= 100
    assert res_benign.risk_category == "Low"
