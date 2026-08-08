// Tests für die sicherheitskritischen pure Functions (lib/pure.js) — v7.0.
// Läuft mit dem eingebauten Node-Test-Runner: `npm test`
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compareVersions, isTrustedUpdateUrl, isSafePublicHttpsUrl, matchCondition, matchRule } = require('../lib/pure');

// ── compareVersions (Update-Pipeline) ────────────────────────────────────────
test('compareVersions: Grundfälle', () => {
  assert.equal(compareVersions('7.0.0', '6.14.0'), 1);
  assert.equal(compareVersions('6.14.0', '7.0.0'), -1);
  assert.equal(compareVersions('6.13.1', '6.13.1'), 0);
});

test('compareVersions: unterschiedliche Längen und zweistellige Teile', () => {
  assert.equal(compareVersions('6.13', '6.13.0'), 0);
  assert.equal(compareVersions('6.13.10', '6.13.9'), 1);
  assert.equal(compareVersions('10.0.0', '9.9.9'), 1);
});

// ── isTrustedUpdateUrl (Update-Sicherheit) ───────────────────────────────────
test('isTrustedUpdateUrl: akzeptiert nur offizielle Release-Quellen', () => {
  assert.equal(isTrustedUpdateUrl('https://github.com/Zenovs/coremail/releases/download/v7.0.0/x.AppImage'), true);
  assert.equal(isTrustedUpdateUrl('https://objects.githubusercontent.com/foo'), true);
  assert.equal(isTrustedUpdateUrl('https://release-assets.githubusercontent.com/foo'), true);
});

test('isTrustedUpdateUrl: lehnt fremde Repos, Hosts und Protokolle ab', () => {
  assert.equal(isTrustedUpdateUrl('https://github.com/attacker/repo/releases/x.AppImage'), false);
  assert.equal(isTrustedUpdateUrl('http://github.com/Zenovs/coremail/releases/x'), false);
  assert.equal(isTrustedUpdateUrl('https://evil.com/Zenovs/coremail/'), false);
  assert.equal(isTrustedUpdateUrl('https://github.com.evil.com/Zenovs/coremail/'), false);
  assert.equal(isTrustedUpdateUrl('not a url'), false);
  assert.equal(isTrustedUpdateUrl(null), false);
});

// ── isSafePublicHttpsUrl (SSRF-Schutz) ───────────────────────────────────────
test('isSafePublicHttpsUrl: öffentliche https-Hosts sind erlaubt', () => {
  assert.equal(isSafePublicHttpsUrl('https://example.com/unsubscribe?id=1'), true);
  assert.equal(isSafePublicHttpsUrl('https://8.8.8.8/x'), true);
});

test('isSafePublicHttpsUrl: private/lokale Ziele werden abgelehnt', () => {
  assert.equal(isSafePublicHttpsUrl('http://example.com/'), false);
  assert.equal(isSafePublicHttpsUrl('https://localhost/x'), false);
  assert.equal(isSafePublicHttpsUrl('https://intern.local/x'), false);
  assert.equal(isSafePublicHttpsUrl('https://127.0.0.1/x'), false);
  assert.equal(isSafePublicHttpsUrl('https://10.1.2.3/x'), false);
  assert.equal(isSafePublicHttpsUrl('https://172.16.0.1/x'), false);
  assert.equal(isSafePublicHttpsUrl('https://172.31.255.255/x'), false);
  assert.equal(isSafePublicHttpsUrl('https://192.168.1.1/x'), false);
  assert.equal(isSafePublicHttpsUrl('https://169.254.1.1/x'), false);
  assert.equal(isSafePublicHttpsUrl('https://100.64.0.1/x'), false);
  assert.equal(isSafePublicHttpsUrl('https://[::1]/x'), false);
  assert.equal(isSafePublicHttpsUrl('https://0.0.0.0/x'), false);
});

// ── matchCondition / matchRule (Mail-Regeln) ─────────────────────────────────
const mail = { from: 'Newsletter <news@shop.example>', to: 'dario@firma.ch', cc: 'team@firma.ch', subject: 'Grosse Sommer-Aktion' };

test('matchCondition: Felder und Operatoren', () => {
  assert.equal(matchCondition(mail, { field: 'from', op: 'contains', value: 'shop.example' }), true);
  assert.equal(matchCondition(mail, { field: 'subject', op: 'startsWith', value: 'grosse' }), true);
  assert.equal(matchCondition(mail, { field: 'subject', op: 'endsWith', value: 'aktion' }), true);
  assert.equal(matchCondition(mail, { field: 'to', op: 'contains', value: 'team@firma.ch' }), true); // to umfasst cc
  assert.equal(matchCondition(mail, { field: 'subject', op: 'equals', value: 'grosse sommer-aktion' }), true);
  assert.equal(matchCondition(mail, { field: 'from', op: 'contains', value: 'anders' }), false);
});

test('matchCondition: leere/kaputte Bedingungen greifen nie', () => {
  assert.equal(matchCondition(mail, { field: 'from', value: '' }), false);
  assert.equal(matchCondition(mail, { field: 'unbekannt', value: 'x' }), false);
  assert.equal(matchCondition(mail, null), false);
});

test('matchRule: matchAll-Semantik und Deaktivierung', () => {
  const c1 = { field: 'from', value: 'shop.example' };
  const c2 = { field: 'subject', value: 'aktion' };
  const cNo = { field: 'subject', value: 'rechnung' };
  assert.equal(matchRule(mail, { enabled: true, conditions: [c1, c2] }), true);           // AND (Default)
  assert.equal(matchRule(mail, { enabled: true, conditions: [c1, cNo] }), false);         // AND scheitert
  assert.equal(matchRule(mail, { enabled: true, matchAll: false, conditions: [cNo, c2] }), true); // OR
  assert.equal(matchRule(mail, { enabled: false, conditions: [c1] }), false);             // deaktiviert
  assert.equal(matchRule(mail, { enabled: true, conditions: [] }), false);                // leer greift nie
});
