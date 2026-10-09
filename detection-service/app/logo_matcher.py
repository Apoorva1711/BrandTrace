from typing import Dict, Any, Optional
import os

try:
    from PIL import Image
    import imagehash
    HAS_IMAGE_LIBS = True
except ImportError:
    HAS_IMAGE_LIBS = False

def compute_image_hash(image_path_or_file) -> Optional[str]:
    """Compute difference hash (dhash) for an image file."""
    if not HAS_IMAGE_LIBS:
        return None
    try:
        if isinstance(image_path_or_file, str) and os.path.exists(image_path_or_file):
            img = Image.open(image_path_or_file)
        else:
            img = Image.open(image_path_or_file)
        return str(imagehash.dhash(img))
    except Exception:
        return None

def evaluate_logo_similarity(
    official_hash: Optional[str],
    candidate_hash: Optional[str],
    official_image_path: Optional[str] = None,
    candidate_image_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compare perceptual hashes between official brand logo and candidate avatar/icon.
    Strictly follows requirement:
    - Never invent a score if an image/hash is missing.
    - Max score: 25.0 points.
    - Return algorithm name, hamming distance, score, and limitations.
    """
    # Attempt to compute hash from paths if hashes are missing
    if not official_hash and official_image_path:
        official_hash = compute_image_hash(official_image_path)
    if not candidate_hash and candidate_image_path:
        candidate_hash = compute_image_hash(candidate_image_path)

    if not official_hash or not candidate_hash:
        return {
            "score": 0.0,
            "evaluated": False,
            "distance": None,
            "algorithm": "dhash (64-bit difference hash)",
            "details": "Logo comparison not performed: missing official or candidate image/hash."
        }

    try:
        if HAS_IMAGE_LIBS:
            h1 = imagehash.hex_to_hash(official_hash)
            h2 = imagehash.hex_to_hash(candidate_hash)
            distance = h1 - h2
        else:
            # Fallback hamming distance calculation on hex strings
            b1 = bin(int(official_hash, 16))[2:].zfill(64)
            b2 = bin(int(candidate_hash, 16))[2:].zfill(64)
            distance = sum(c1 != c2 for c1, c2 in zip(b1, b2))

        # Distance interpretation for 64-bit dhash:
        # 0-4: near identical (25.0 pts)
        # 5-9: high perceptual similarity (18.0 pts)
        # 10-14: moderate visual similarity (10.0 pts)
        # 15+: distinct visuals (0.0 pts)
        if distance <= 4:
            score = 25.0
            verdict = f"Near-identical perceptual logo match (Hamming distance {distance} <= 4)."
        elif distance <= 9:
            score = 18.0
            verdict = f"High perceptual logo similarity detected (Hamming distance {distance} <= 9)."
        elif distance <= 14:
            score = 10.0
            verdict = f"Moderate visual resemblance to official logo (Hamming distance {distance} <= 14)."
        else:
            score = 0.0
            verdict = f"Visually distinct icon/logo (Hamming distance {distance} >= 15)."

        return {
            "score": score,
            "evaluated": True,
            "distance": int(distance),
            "algorithm": "dhash (64-bit difference hash)",
            "details": verdict
        }
    except Exception as e:
        return {
            "score": 0.0,
            "evaluated": False,
            "distance": None,
            "algorithm": "dhash",
            "details": f"Error parsing logo hash: {str(e)}"
        }
