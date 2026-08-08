// ─── Pure Functions (v7.0) ───────────────────────────────────────────────────
// Sicherheits- und logikkritische Funktionen ohne Electron-/IO-Abhängigkeit,
// aus main.js extrahiert, damit sie testbar sind (tests/pure.test.js).
// main.js bindet sie per require ein — Verhalten unverändert.

// Versionsvergleich für die Update-Pipeline: 1 (v1 neuer), -1 (älter), 0 (gleich)
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

// Update-Sicherheit: nur offizielle GitHub-Release-URLs des eigenen Repos
function isTrustedUpdateUrl(url) {
  try {
    const u = new URL(String(url));
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    const okHost = host === 'github.com' || host === 'objects.githubusercontent.com' || host === 'release-assets.githubusercontent.com';
    if (!okHost) return false;
    // github.com muss auf das offizielle Repo zeigen; die CDN-Hosts liefern nur Assets aus
    if (host === 'github.com' && !u.pathname.startsWith('/Zenovs/coremail/')) return false;
    return true;
  } catch (_) {
    return false;
  }
}

// SSRF-Schutz (Unsubscribe): nur öffentliche https-Hosts, keine privaten Bereiche
function isSafePublicHttpsUrl(rawUrl) {
  try {
    const u = new URL(String(rawUrl));
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false;
    // IPv6-Loopback / IPv4 in privaten Bereichen ablehnen
    if (host === '::1' || host.startsWith('[')) return false;
    const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (m) {
      const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
      if (a === 10 || a === 127 || a === 0 ||
          (a === 172 && b >= 16 && b <= 31) ||
          (a === 192 && b === 168) ||
          (a === 169 && b === 254) ||
          (a === 100 && b >= 64 && b <= 127)) return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

// Mail-Regeln: eine Bedingung gegen eine Mail prüfen
function matchCondition(email, condition) {
  const { field, op = 'contains', value = '' } = condition || {};
  if (!value) return false;
  let haystack = '';
  if (field === 'from')         haystack = (email.from || '');
  else if (field === 'to')      haystack = (email.to || '') + ' ' + (email.cc || '');
  else if (field === 'subject') haystack = (email.subject || '');
  else return false;
  const a = haystack.toLowerCase();
  const b = value.toLowerCase();
  switch (op) {
    case 'equals':     return a === b;
    case 'startsWith': return a.startsWith(b);
    case 'endsWith':   return a.endsWith(b);
    case 'contains':
    default:           return a.includes(b);
  }
}

// Mail-Regeln: greift die Regel auf diese Mail?
function matchRule(email, rule) {
  if (!rule.enabled) return false;
  const conds = Array.isArray(rule.conditions) ? rule.conditions : [];
  if (conds.length === 0) return false;
  if (rule.matchAll === false) return conds.some(c => matchCondition(email, c));
  return conds.every(c => matchCondition(email, c));
}

module.exports = { compareVersions, isTrustedUpdateUrl, isSafePublicHttpsUrl, matchCondition, matchRule };
