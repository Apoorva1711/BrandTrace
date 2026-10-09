# BRANDTRACE Detection Methodology & Risk Scoring Engine

---

## 1. Executive Summary

Digital Risk Protection (DRP) solutions frequently suffer from two critical failures:
1. **Opaque Scoring:** Black-box machine learning models that generate probabilistic risk numbers without explainable evidence.
2. **False Positive Storms:** Flagging an organization's own marketing accounts or unrelated businesses simply because they share common English words.

BRANDTRACE implements an **explainable, deterministic, and auditable detection engine** combining RapidFuzz approximate string matching, homoglyph unmasking, perceptual image difference hashing (`dhash`), and an Official Asset Exclusion Gate.

---

## 2. Why Name Similarity Alone Is Insufficient

Relying exclusively on string distance yields unacceptable error rates:
- **Common Word Collisions:** A brand named "Apex" would falsely flag "Apex Mountain Gear", "Apex Precision CNC Tools", or "Apex School of Ballet".
- **Look-Alike Disguises (Typosquatting & Leetspeak):** Fraudulent accounts use substitutions (`0` for `O`, `3` for `E`, `1` for `L`) or spacing tricks that fool naive substring checks while appearing identical to human victims.
- **Benign Fan & Educational Accounts:** An account named `ApexPay Tutorials` may be a harmless user guide, whereas `ApexPay_Reward_Claim` with an unrecognized external shortener is an active credential phishing attack.

To address this, BRANDTRACE evaluates **contextual signals across five distinct vectors**.

---

## 3. The 100-Point Scoring Model

Every candidate is evaluated on a configurable 100-point scale. Missing signals do not increase risk:

$$\text{Total Risk Score} = S_{\text{name}} + S_{\text{logo}} + S_{\text{publisher}} + S_{\text{context}} + S_{\text{link}}$$

| Signal Dimension | Maximum Allocation | Detection Mechanism |
|---|---|---|
| **1. Name Similarity ($S_{\text{name}}$)** | **Up to 30 Points** | Normalized token matching, Levenshtein edit distance, homoglyph unmasking (`0->o`, `3->e`), and brand name embedded with high-risk extensions. |
| **2. Perceptual Logo Similarity ($S_{\text{logo}}$)** | **Up to 25 Points** | 64-bit difference hash (`dhash`). Hamming distance $\le 4 \implies 25$ pts; $\le 9 \implies 18$ pts; $\le 14 \implies 10$ pts. **Zero points allocated if image comparison is skipped.** |
| **3. Publisher / Identity Mismatch ($S_{\text{publisher}}$)** | **Up to 20 Points** | For mobile apps: Brand name in app title but publisher entity does not match registered developer (+20 pts). For social accounts: Sub-100 follower count claiming global brand (+8 pts). |
| **4. Contextual Indicators ($S_{\text{context}}$)** | **Up to 15 Points** | Scanning candidate biography or app description for social engineering terms (`support`, `verify account`, `reset password`, `connect wallet`, `airdrop bonus`). 5 pts per unique phrase up to 15 max. |
| **5. External Link Evidence ($S_{\text{link}}$)** | **Up to 10 Points** | Use of URL shorteners/redirectors (`bit.ly`, `tinyurl.com`, `rb.gy`) (+10 pts) or unrecognized external domains (+8 pts). Verified official domains receive 0 pts. |

### Severity Prioritization Bands
Scores serve as operational prioritization bands rather than calibrated probabilities:
- **Critical (80–100):** Immediate triage required. Multi-signal convergence (e.g. matching logo + phishing link + brand name).
- **High (60–79):** Priority review. Look-alike name combined with untrusted publisher or high-risk keywords.
- **Medium (30–59):** Monitoring queue. Look-alike business or fan page without clear malicious indicators.
- **Low (0–29):** Benign candidate or unrelated legitimate entity.

---

## 4. Official Asset Exclusion Gate

Before calculating threat scores, every candidate is passed through the **Official Asset Registry**:

1. **Exact Normalized URL:** If candidate URL matches a registered URL (ignoring trailing slashes, protocol cases, and `www.`), it is **immediately excluded**.
2. **Exact Social Handle:** If the candidate handle matches an official handle on the identical platform, it is **excluded**.
3. **Exact Mobile Package ID:** If the candidate bundle identifier matches the registered package ID on the identical store, it is **excluded**.
4. **Safety Rule:** A matching brand name or publisher name **alone is never sufficient to exclude an unknown profile**, ensuring unauthorized apps by third parties cannot bypass detection.

Excluded assets are logged in scan evidence with status `isExcluded: true`, preserving complete audit visibility without inflating active threat numbers.

---

## 5. False Positive Governance & Audit Trails

When an analyst declares a finding to be a **False Positive**:
1. The platform **requires a mandatory justification note** explaining why the candidate was deemed benign.
2. The finding status is updated to `False Positive`.
3. An immutable entry is saved in `InvestigationNote` containing:
   - Authenticated analyst identity and email.
   - Exact timestamp.
   - Previous status and new status.
   - Documented rationale.

---

## 6. Known Limitations & Disclosures

- **Perceptual Hashing:** `dhash` detects visual resemblance under minor compression or scaling, but severe cropping or color inversion can alter hamming distance.
- **Synthetic vs Live Crawling:** In accordance with platform terms and API rate limit constraints, external crawlers operate only when valid credentials (`TWITTER_BEARER_TOKEN`, `GOOGLE_PLAY_API_KEY`) are present. When unconfigured, BRANDTRACE operates on deterministic fixtures labeled **DEMO DATA** and clearly communicates adapter health in Settings.
