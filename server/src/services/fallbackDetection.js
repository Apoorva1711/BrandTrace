import { normalizeUrl, normalizeIdentifier } from '../utils/normalizers.js';

const LEET_MAP = {
  '0': 'o', '1': 'l', '|': 'l', '!': 'i', '@': 'a',
  '$': 's', '5': 's', '3': 'e', '4': 'a', '8': 'b', 'v': 'u'
};

const SUSPICIOUS_WORDS = [
  'support', 'help', 'desk', 'service', 'care', 'official',
  'verify', 'security', 'alert', 'login', 'claim', 'rewards',
  'bonus', 'airdrop', 'promo', 'wallet', 'pay', 'recovery',
  'password', 'account', 'urgent', 'assistance', 'giveaway'
];

function cleanAlpha(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function dehomoglyph(str) {
  let s = (str || '').toLowerCase();
  for (const [k, v] of Object.entries(LEET_MAP)) {
    s = s.split(k).join(v);
  }
  return s;
}

// Levenshtein similarity ratio (0 to 100)
function computeStringRatio(s1, s2) {
  if (!s1 || !s2) return 0;
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();
  if (a === b) return 100;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const dist = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, Math.round(((maxLen - dist) / maxLen) * 100));
}

export function evaluateCandidateThreatInJs(brand, officialAssets, candidate) {
  // 1. Official Asset Exclusion Check
  const candNormUrl = normalizeUrl(candidate.url);
  const candNormId = normalizeIdentifier(candidate.usernameOrAppName);
  const candNormPkg = normalizeIdentifier(candidate.packageId || '');
  const candPlatform = (candidate.platformOrStore || '').trim().toLowerCase();

  for (const asset of (officialAssets || [])) {
    const assetNormUrl = normalizeUrl(asset.url);
    const assetNormId = normalizeIdentifier(asset.identifier);
    const assetPlatform = (asset.platformOrStore || '').trim().toLowerCase();

    // Exact URL match
    if (candNormUrl && assetNormUrl && candNormUrl === assetNormUrl) {
      return {
        isExcluded: true,
        exclusionReason: `Exact match with registered official asset URL: ${asset.url}`,
        riskScore: 0,
        riskCategory: 'Low',
        signals: {},
        explanation: [`Candidate excluded from active threats: Registered official asset URL.`],
        recommendedAction: 'Excluded: Verified official brand asset. No investigation required.'
      };
    }

    // Social handle match
    if (candidate.candidateType === 'social') {
      if (candPlatform && assetPlatform && candPlatform === assetPlatform) {
        if (candNormId && assetNormId && candNormId === assetNormId) {
          return {
            isExcluded: true,
            exclusionReason: `Exact registered official social handle '@${asset.identifier}' on ${asset.platformOrStore}`,
            riskScore: 0,
            riskCategory: 'Low',
            signals: {},
            explanation: [`Candidate excluded from active threats: Registered official social profile.`],
            recommendedAction: 'Excluded: Verified official brand asset.'
          };
        }
      }
    }

    // Mobile App package ID match
    if (candidate.candidateType === 'app') {
      if (candNormPkg && assetNormId && candNormPkg === assetNormId) {
        return {
          isExcluded: true,
          exclusionReason: `Exact registered official app package identifier: '${asset.identifier}'`,
          riskScore: 0,
          riskCategory: 'Low',
          signals: {},
          explanation: [`Candidate excluded: Verified official app listing.`],
          recommendedAction: 'Excluded: Verified official application.'
        };
      }
    }
  }

  // 2. Risk scoring (explainable 100-point model)
  const explanation = [];
  const targets = [brand.name, ...(brand.aliases || [])];
  let bestNameScore = 0;
  let bestRatio = 0;
  let bestMatchType = 'none';

  const candRaw = cleanAlpha(candidate.usernameOrAppName);
  const candDehomo = cleanAlpha(dehomoglyph(candidate.usernameOrAppName));

  for (const target of targets) {
    const targetRaw = cleanAlpha(target);
    if (!targetRaw) continue;

    if (targetRaw === candRaw) {
      bestNameScore = 30.0;
      bestRatio = 100;
      bestMatchType = 'exact_normalized';
      explanation.push(`Exact normalized name match with brand '${target}'.`);
      break;
    }

    if (targetRaw === candDehomo) {
      if (28.5 > bestNameScore) {
        bestNameScore = 28.5;
        bestRatio = 98;
        bestMatchType = 'character_substitution';
        explanation.push(`Character substitution/leetspeak match with '${target}'.`);
      }
    }

    const hasBrand = candRaw.includes(targetRaw) || candDehomo.includes(targetRaw);
    if (hasBrand) {
      const matchedKws = SUSPICIOUS_WORDS.filter(w => (candidate.usernameOrAppName || '').toLowerCase().includes(w));
      const score = matchedKws.length > 0 ? 27.0 : 24.0;
      if (score > bestNameScore) {
        bestNameScore = score;
        bestRatio = 90;
        bestMatchType = matchedKws.length > 0 ? 'brand_with_support_keyword' : 'embedded_brand_name';
        explanation.push(matchedKws.length > 0
          ? `Brand name '${target}' combined with keywords: ${matchedKws.join(', ')}.`
          : `Brand name '${target}' embedded in candidate name.`
        );
      }
    }

    const simRatio = computeStringRatio(target, candidate.usernameOrAppName);
    if (simRatio > bestRatio) {
      bestRatio = simRatio;
      if (bestNameScore < 20) {
        bestNameScore = Math.round((simRatio / 100) * 30);
        bestMatchType = simRatio >= 85 ? 'high_fuzzy_similarity' : 'moderate_fuzzy_similarity';
      }
    }
  }

  // Logo similarity (Max 25 pts)
  let logoScore = 0;
  let logoEvaluated = false;
  let logoDistance = null;
  if (brand.logoHash && candidate.avatarHash) {
    logoEvaluated = true;
    // Calculate hex hamming distance
    let diffs = 0;
    const len = Math.min(brand.logoHash.length, candidate.avatarHash.length);
    for (let i = 0; i < len; i++) {
      if (brand.logoHash[i] !== candidate.avatarHash[i]) diffs++;
    }
    logoDistance = diffs;
    if (diffs <= 1) {
      logoScore = 25.0;
      explanation.push(`Perceptual logo hash match (distance ${diffs}). (+25.0 pts)`);
    } else if (diffs <= 3) {
      logoScore = 18.0;
      explanation.push(`High perceptual logo similarity (distance ${diffs}). (+18.0 pts)`);
    } else {
      explanation.push(`Distinct logo perceptual hash (distance ${diffs}).`);
    }
  } else {
    explanation.push('Logo analysis: Skipped (missing official or candidate logo hash).');
  }

  // Publisher Mismatch (Max 20 pts)
  let publisherScore = 0;
  let publisherEval = 'neutral';
  if (candidate.candidateType === 'app') {
    const pub = (candidate.publisherName || '').trim();
    const brandPub = (brand.name || '').toLowerCase();
    if (pub && bestNameScore >= 18.0 && !pub.toLowerCase().includes(brandPub)) {
      publisherScore = 20.0;
      publisherEval = 'unauthorized_developer';
      explanation.push(`Publisher mismatch: App imitates brand name but published by '${pub}'. (+20.0 pts)`);
    } else if (pub) {
      publisherEval = 'verified_or_neutral';
    }
  } else if (candidate.candidateType === 'social') {
    if (bestNameScore >= 20.0 && candidate.followers < 100) {
      publisherScore = 8.0;
      publisherEval = 'low_follower_brand_claim';
      explanation.push(`Low follower count (${candidate.followers}) claiming brand identity. (+8.0 pts)`);
    }
  }

  // Contextual Indicators (Max 15 pts)
  let contextScore = 0;
  const flaggedKws = [];
  const desc = (candidate.description || '').toLowerCase();
  for (const word of SUSPICIOUS_WORDS) {
    if (desc.includes(word)) {
      flaggedKws.push(word);
    }
  }
  if (flaggedKws.length > 0) {
    contextScore = Math.min(15.0, flaggedKws.length * 5.0);
    explanation.push(`Suspicious keywords identified in description: ${flaggedKws.slice(0, 4).join(', ')}. (+${contextScore} pts)`);
  }

  // External Link Evidence (Max 10 pts)
  let extLinkScore = 0;
  let linkEval = 'neutral';
  const ext = (candidate.externalUrl || '').toLowerCase();
  if (ext) {
    if (ext.includes('bit.ly') || ext.includes('tinyurl.com') || ext.includes('t.co') || ext.includes('rb.gy')) {
      extLinkScore = 10.0;
      linkEval = 'suspicious_shortener';
      explanation.push(`External link uses URL redirection/shortener service. (+10.0 pts)`);
    } else if (bestNameScore >= 15.0 && !ext.includes((brand.name || '').toLowerCase())) {
      extLinkScore = 8.0;
      linkEval = 'unrecognized_domain';
      explanation.push(`External link references unverified domain. (+8.0 pts)`);
    }
  }

  const rawTotal = bestNameScore + logoScore + publisherScore + contextScore + extLinkScore;
  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

  let category = 'Low';
  let recommendedAction = 'Low Risk: Benign or low-confidence candidate. Standard automated periodic scanning.';
  if (totalScore >= 80) {
    category = 'Critical';
    recommendedAction = 'Critical Risk: Immediate triage required. Inspect candidate domains and escalate for brand protection action.';
  } else if (totalScore >= 60) {
    category = 'High';
    recommendedAction = 'High Risk: Prioritize analyst review. Check impersonation intent and verify publisher authenticity.';
  } else if (totalScore >= 30) {
    category = 'Medium';
    recommendedAction = 'Medium Risk: Monitor account activity and inspect subsequent profile changes.';
  }

  return {
    isExcluded: false,
    exclusionReason: null,
    riskScore: totalScore,
    riskCategory: category,
    signals: {
      name_similarity_score: Math.round(bestNameScore),
      name_similarity_ratio: Math.round(bestRatio),
      name_match_type: bestMatchType,
      logo_similarity_score: Math.round(logoScore),
      logo_evaluated: logoEvaluated,
      logo_hash_distance: logoDistance,
      publisher_mismatch_score: Math.round(publisherScore),
      publisher_evaluation: publisherEval,
      context_indicators_score: Math.round(contextScore),
      flagged_keywords: flaggedKws,
      external_link_score: Math.round(extLinkScore),
      link_evaluation: linkEval
    },
    explanation,
    recommendedAction
  };
}
