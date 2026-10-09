import re
import unicodedata
from typing import Tuple, Dict, Any, List
from rapidfuzz import fuzz

# Leetspeak / homoglyph substitution map
LEET_MAP = {
    '0': 'o',
    '1': 'l',
    '|': 'l',
    '!': 'i',
    '@': 'a',
    '$': 's',
    '5': 's',
    '3': 'e',
    '4': 'a',
    '8': 'b',
    'v': 'u',
}

SUSPICIOUS_NAME_EXTENSIONS = [
    'support', 'help', 'desk', 'service', 'care', 'official',
    'verify', 'verified', 'security', 'alert', 'login', 'portal',
    'claim', 'rewards', 'bonus', 'airdrop', 'promo', 'wallet', 'pay'
]

def normalize_text(text: str) -> str:
    """Normalize text: unicode NFKD, lowercase, collapse whitespace, strip accents."""
    if not text:
        return ""
    text = unicodedata.normalize('NFKD', text)
    # Remove diacritics
    text = "".join([c for c in text if not unicodedata.combining(c)])
    text = text.lower().strip()
    # Replace non-alphanumeric (except underscores and spaces) with space
    text = re.sub(r'[^a-z0-9_\s]', ' ', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def dehomoglyph(text: str) -> str:
    """Substitute common leetspeak characters to uncover disguised brand names."""
    norm = text.lower()
    for char, rep in LEET_MAP.items():
        norm = norm.replace(char, rep)
    return norm

def clean_alphanumeric(text: str) -> str:
    """Strip all punctuation and spaces for raw sequence matching."""
    return re.sub(r'[^a-z0-9]', '', text.lower())

def evaluate_name_similarity(brand_name: str, candidate_name: str, aliases: List[str] = None) -> Dict[str, Any]:
    """
    Compare candidate name (username, display name, or app name) against brand name and aliases.
    Returns:
    - score (0.0 to 30.0)
    - ratio (0 to 100)
    - match_type (exact, spacing_variant, substitution, token_overlap, partial, none)
    - details (list of explanation strings)
    """
    if not candidate_name or not brand_name:
        return {
            "score": 0.0,
            "ratio": 0.0,
            "match_type": "none",
            "details": ["No name provided for comparison."]
        }

    targets = [brand_name] + (aliases or [])
    best_ratio = 0.0
    best_score = 0.0
    best_type = "none"
    best_details = []

    cand_norm = normalize_text(candidate_name)
    cand_raw = clean_alphanumeric(candidate_name)
    cand_dehomo = clean_alphanumeric(dehomoglyph(candidate_name))

    for target in targets:
        target_norm = normalize_text(target)
        target_raw = clean_alphanumeric(target)

        if not target_raw:
            continue

        details = []

        # 1. Exact raw match (e.g., "ApexPay" vs "apexpay" or "apex_pay")
        if target_raw == cand_raw:
            score = 30.0
            ratio = 100.0
            match_type = "exact_normalized"
            details.append(f"Exact normalized name match with brand '{target}'.")
            return {
                "score": score,
                "ratio": ratio,
                "match_type": match_type,
                "details": details
            }

        # 2. Character substitution / Leetspeak match (e.g. "Ap3xPay" -> "apexpay")
        if target_raw == cand_dehomo:
            score = 28.5
            ratio = 98.0
            match_type = "character_substitution"
            details.append(f"Character substitution/leetspeak match with '{target}' (e.g. 0->o, 3->e, 1->l).")
            if score > best_score:
                best_score, best_ratio, best_type, best_details = score, ratio, match_type, details
            continue

        # 3. Brand name embedded with suspicious keywords (e.g. "apexpay_support_help")
        has_brand = target_raw in cand_raw or target_raw in cand_dehomo
        matched_keywords = [
            kw for kw in SUSPICIOUS_NAME_EXTENSIONS 
            if kw in cand_norm and kw not in target_norm
        ]

        if has_brand and matched_keywords:
            score = 27.0
            ratio = 92.0
            match_type = "brand_with_support_keyword"
            details.append(f"Brand name '{target}' combined with support/security keywords: {', '.join(matched_keywords)}.")
            if score > best_score:
                best_score, best_ratio, best_type, best_details = score, ratio, match_type, details
            continue

        # 4. Spacing or extra character variant (prefix/suffix insertion)
        # Check edit distance / fuzzy metrics
        fuzzy_ratio = fuzz.ratio(target_norm, cand_norm)
        token_sort = fuzz.token_sort_ratio(target_norm, cand_norm)
        partial = fuzz.partial_ratio(target_norm, cand_norm)

        # Composite ratio prioritizing token alignment and raw edit distance
        effective_ratio = max(fuzzy_ratio, token_sort, (partial * 0.85 if has_brand else partial * 0.6))

        # Check for slight typosquatting (1 or 2 edits away, e.g., "apexpayy" or "apexppay")
        len_diff = abs(len(cand_raw) - len(target_raw))
        if has_brand and len_diff <= 3:
            score = 26.0
            ratio = 90.0
            match_type = "extra_character_variation"
            details.append(f"Minor addition/typosquat variant of brand '{target}' ({len_diff} extra characters).")
        elif effective_ratio >= 85:
            score = round((effective_ratio / 100.0) * 30.0, 1)
            ratio = round(effective_ratio, 1)
            match_type = "high_fuzzy_similarity"
            details.append(f"High string similarity ({effective_ratio:.0f}%) to brand '{target}'.")
        elif effective_ratio >= 65:
            score = round((effective_ratio / 100.0) * 20.0, 1)
            ratio = round(effective_ratio, 1)
            match_type = "moderate_fuzzy_similarity"
            details.append(f"Moderate string similarity ({effective_ratio:.0f}%) to brand '{target}'.")
        else:
            score = round((effective_ratio / 100.0) * 10.0, 1)
            ratio = round(effective_ratio, 1)
            match_type = "low_similarity"
            details.append(f"Low string similarity ({effective_ratio:.0f}%) to brand '{target}'.")

        if score > best_score:
            best_score = score
            best_ratio = ratio
            best_type = match_type
            best_details = details

    return {
        "score": min(30.0, best_score),
        "ratio": min(100.0, best_ratio),
        "match_type": best_type,
        "details": best_details or [f"Candidate name compared against {len(targets)} brand aliases."]
    }
