/**
 * SpamFilter.js - Intelligenter Spam-Filter für CoreMail Desktop v1.14.0
 * 
 * Kategorien:
 * - werbung: Marketing-Mails, Newsletter (nicht gefährlich)
 * - spam: Unerwünschte Mails (nicht gefährlich)
 * - schaedlich: Phishing, verdächtige Links
 * - virus: Gefährliche Anhänge
 * - sicher: Normale E-Mail (kein Spam)
 */

// ============ KEYWORD-REGELN ============

const WERBUNG_KEYWORDS = [
  'angebot', 'rabatt', 'sale', 'newsletter', 'gutschein', 'aktion', 'sonderangebot',
  'exklusiv', 'limited offer', 'discount', 'promo', 'promotion', 'deal', 'coupon',
  'free shipping', 'kostenloser versand', 'black friday', 'cyber monday',
  'jetzt kaufen', 'buy now', 'shop now', 'unsubscribe', 'abbestellen',
  'nicht mehr erhalten', 'abmelden', 'opt-out', 'marketing', 'werbung',
  'sonderaktion', 'nur heute', 'letzte chance', 'gratis', 'kostenfrei',
  'percent off', '% rabatt', '% off', 'limited time', 'begrenzte zeit',
  'bestseller', 'neue kollektion', 'new collection', 'flash sale'
];

const WERBUNG_SENDER_PATTERNS = [
  'newsletter@', 'marketing@', 'noreply@', 'no-reply@', 'info@', 'news@',
  'promotions@', 'offers@', 'deals@', 'shop@', 'store@', 'sales@',
  'mailchimp.com', 'sendgrid.net', 'constantcontact.com', 'mailgun.org',
  'amazonses.com', 'campaign-archive.com', 'list-manage.com',
  'hubspot.com', 'mailerlite.com', 'klaviyo.com', 'sendinblue.com'
];

const SPAM_KEYWORDS = [
  'gewinnspiel', 'kredit', 'viagra', 'casino', 'lottery', 'lotterie',
  'millionär', 'millionaire', 'jackpot', 'gewinner', 'winner',
  'sofort geld', 'schnell geld', 'easy money', 'make money fast',
  'work from home', 'von zuhause arbeiten', 'reich werden', 'get rich',
  'bitcoin profit', 'crypto profit', 'investment opportunity',
  'nigerian prince', 'inheritance', 'erbschaft unbekannt',
  'enlarge', 'weight loss', 'abnehmen schnell', 'wundermittel',
  'miracle cure', 'anti-aging', 'supplements',
  'singles in deiner nähe', 'dating', 'hot singles',
  'congratulations you won', 'herzlichen glückwunsch sie haben gewonnen',
  'claim your prize', 'fordern sie ihren preis', 'urgent response needed',
  'dringende antwort erforderlich', 'act now', 'jetzt handeln',
  'free money', 'kostenloses geld', 'double your income',
  'guaranteed', 'garantiert', 'no risk', 'kein risiko',
  'cheap pills', 'pharmacy online', 'online apotheke billig'
];

const SPAM_DOMAINS = [
  '.xyz', '.top', '.click', '.loan', '.win', '.bid',
  '.racing', '.download', '.stream', '.gdn', '.review',
  '.science', '.party', '.accountant', '.cricket', '.date',
  '.faith', '.men', '.work', '.trade', '.webcam'
];

const PHISHING_KEYWORDS = [
  'passwort zurücksetzen', 'password reset', 'konto gesperrt', 'account suspended',
  'konto verifizieren', 'verify your account', 'bestätigen sie ihre identität',
  'confirm your identity', 'ungewöhnliche aktivität', 'unusual activity',
  'sicherheitswarnung', 'security alert', 'unauthorized access',
  'unautorisierter zugriff', 'ihre rechnung', 'your invoice',
  'zahlungsproblem', 'payment problem', 'kreditkarte abgelaufen',
  'card expired', 'sofort handeln', 'immediate action required',
  'konto wird geschlossen', 'account will be closed',
  'letzte warnung', 'final warning', 'verdächtige anmeldung',
  'suspicious login', 'klicken sie hier um zu bestätigen',
  'click here to confirm', 'update your payment', 'zahlungsmethode aktualisieren',
  'dhl paket', 'post paket', 'sendungsverfolgung', 'tracking number',
  'apple id gesperrt', 'paypal konto', 'amazon konto',
  'ihr paket wartet', 'package waiting', 'zoll gebühr', 'customs fee'
];

const PHISHING_URL_PATTERNS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd',
  'buff.ly', 'adf.ly', 'bc.vc', 'j.mp',
  // Suspicious patterns in URLs
  'login-', '-login', 'signin-', '-signin',
  'verify-', '-verify', 'secure-', '-secure',
  'update-', '-update', 'confirm-', '-confirm',
  'account-', 'banking-', 'paypal-', 'amazon-',
  '.tk', '.ml', '.ga', '.cf', '.gq'
];

const DANGEROUS_EXTENSIONS = [
  '.exe', '.scr', '.bat', '.cmd', '.vbs', '.js', '.jse', '.wsf', '.wsh',
  '.ps1', '.pif', '.com', '.msi', '.msp', '.mst', '.cpl', '.hta',
  '.inf', '.ins', '.isp', '.reg', '.rgs', '.sct', '.shb', '.shs',
  '.lnk', '.psc1', '.gadget'
];

const SUSPICIOUS_ARCHIVE_EXTENSIONS = [
  '.zip', '.rar', '.7z', '.tar', '.gz', '.iso', '.cab'
];

// ============ ANALYSE-FUNKTIONEN ============

/**
 * Berechne einen Score für eine E-Mail basierend auf verschiedenen Kriterien
 * @param {Object} email - E-Mail-Objekt mit from, subject, text/html, attachments
 * @param {Object} settings - Spam-Filter-Einstellungen
 * @returns {Object} { category, score, reasons, tags }
 */
export function analyzeEmail(email, settings = {}) {
  const sensitivity = settings.sensitivity || 'medium';
  const whitelist = (settings.whitelist || []).map(s => s.toLowerCase().trim());
  const blacklist = (settings.blacklist || []).map(s => s.toLowerCase().trim());
  
  const from = (email.from || '').toLowerCase();
  const subject = (email.subject || '').toLowerCase();
  const text = (email.text || email.preview || '').toLowerCase();
  const html = (email.html || '').toLowerCase();
  const content = `${subject} ${text} ${html}`;
  const attachments = email.attachments || [];
  
  // Check whitelist first - if sender is whitelisted, always safe
  if (whitelist.length > 0) {
    for (const trusted of whitelist) {
      if (trusted && from.includes(trusted)) {
        return { category: 'sicher', score: 0, reasons: ['Absender in Whitelist'], tags: [] };
      }
    }
  }
  
  // Check blacklist - if sender is blacklisted, mark as spam
  if (blacklist.length > 0) {
    for (const blocked of blacklist) {
      if (blocked && from.includes(blocked)) {
        return { category: 'spam', score: 100, reasons: ['Absender in Blacklist'], tags: ['🚫 Spam'] };
      }
    }
  }
  
  // Initialize scores
  let virusScore = 0;
  let schaedlichScore = 0;
  let spamScore = 0;
  let werbungScore = 0;
  const reasons = [];
  
  // ---- VIRUS CHECK: Dangerous attachments ----
  for (const att of attachments) {
    const filename = (att.filename || att.name || '').toLowerCase();
    for (const ext of DANGEROUS_EXTENSIONS) {
      if (filename.endsWith(ext)) {
        virusScore += 80;
        reasons.push(`Gefährlicher Anhang: ${filename}`);
      }
    }
    for (const ext of SUSPICIOUS_ARCHIVE_EXTENSIONS) {
      if (filename.endsWith(ext)) {
        virusScore += 15;
        reasons.push(`Verdächtiges Archiv: ${filename}`);
      }
    }
    // Double extension check (e.g., document.pdf.exe)
    const parts = filename.split('.');
    if (parts.length > 2) {
      const lastExt = '.' + parts[parts.length - 1];
      if (DANGEROUS_EXTENSIONS.includes(lastExt)) {
        virusScore += 90;
        reasons.push(`Doppelte Dateiendung: ${filename}`);
      }
    }
  }
  
  // ---- PHISHING/SCHÄDLICH CHECK ----
  let phishingHits = 0;
  for (const keyword of PHISHING_KEYWORDS) {
    if (content.includes(keyword)) {
      phishingHits++;
      if (phishingHits <= 3) {
        reasons.push(`Phishing-Keyword: "${keyword}"`);
      }
    }
  }
  schaedlichScore += phishingHits * 20;
  
  // Check for suspicious URLs in HTML
  let suspiciousUrlCount = 0;
  for (const pattern of PHISHING_URL_PATTERNS) {
    if (html.includes(pattern) || text.includes(pattern)) {
      suspiciousUrlCount++;
      if (suspiciousUrlCount <= 2) {
        reasons.push(`Verdächtiger Link: ${pattern}`);
      }
    }
  }
  schaedlichScore += suspiciousUrlCount * 15;
  
  // Check for mismatched display text and href in HTML
  const linkMismatchRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match;
  let mismatchCount = 0;
  while ((match = linkMismatchRegex.exec(html)) !== null) {
    const href = match[1].toLowerCase();
    const displayText = match[2].toLowerCase();
    // If display text looks like a URL but doesn't match href
    if (displayText.includes('http') && !href.includes(displayText.replace(/https?:\/\//, '').split('/')[0])) {
      mismatchCount++;
      if (mismatchCount === 1) {
        reasons.push('Link-Text stimmt nicht mit URL überein');
      }
    }
  }
  schaedlichScore += mismatchCount * 25;
  
  // ---- SPAM CHECK ----
  let spamHits = 0;
  for (const keyword of SPAM_KEYWORDS) {
    if (content.includes(keyword)) {
      spamHits++;
      if (spamHits <= 3) {
        reasons.push(`Spam-Keyword: "${keyword}"`);
      }
    }
  }
  spamScore += spamHits * 15;
  
  // Check sender domain
  const senderDomain = from.split('@')[1] || '';
  for (const domain of SPAM_DOMAINS) {
    if (senderDomain.endsWith(domain)) {
      spamScore += 30;
      reasons.push(`Verdächtige Domain: ${senderDomain}`);
      break;
    }
  }
  
  // Check for excessive caps in subject
  const originalSubject = email.subject || '';
  const capsRatio = (originalSubject.replace(/[^A-Z]/g, '').length) / Math.max(originalSubject.length, 1);
  if (capsRatio > 0.5 && originalSubject.length > 10) {
    spamScore += 15;
    reasons.push('Übermäßig viele Großbuchstaben im Betreff');
  }
  
  // Check for excessive exclamation/question marks
  const exclamationCount = (originalSubject.match(/[!?]{2,}/g) || []).length;
  if (exclamationCount > 0) {
    spamScore += 10 * exclamationCount;
    reasons.push('Übermäßige Satzzeichen im Betreff');
  }
  
  // ---- WERBUNG CHECK ----
  let werbungHits = 0;
  for (const keyword of WERBUNG_KEYWORDS) {
    if (content.includes(keyword)) {
      werbungHits++;
      if (werbungHits <= 3) {
        reasons.push(`Werbung-Keyword: "${keyword}"`);
      }
    }
  }
  werbungScore += werbungHits * 10;
  
  // Check sender patterns for marketing
  for (const pattern of WERBUNG_SENDER_PATTERNS) {
    if (from.includes(pattern)) {
      werbungScore += 25;
      reasons.push(`Marketing-Absender: ${pattern}`);
      break;
    }
  }
  
  // HTML-heavy with many images, little text (common in marketing mails)
  if (html) {
    const imgCount = (html.match(/<img/gi) || []).length;
    const textLength = text.length;
    if (imgCount > 3 && textLength < 200) {
      werbungScore += 15;
      reasons.push('Viele Bilder, wenig Text (typisch für Werbung)');
    }
  }
  
  // ---- SENSITIVITY ADJUSTMENT ----
  const sensitivityMultiplier = {
    'low': 0.7,
    'medium': 1.0,
    'high': 1.3
  }[sensitivity] || 1.0;
  
  virusScore = Math.round(virusScore * sensitivityMultiplier);
  schaedlichScore = Math.round(schaedlichScore * sensitivityMultiplier);
  spamScore = Math.round(spamScore * sensitivityMultiplier);
  werbungScore = Math.round(werbungScore * sensitivityMultiplier);
  
  // ---- THRESHOLD CHECK ----
  const VIRUS_THRESHOLD = 50;
  const SCHAEDLICH_THRESHOLD = 40;
  const SPAM_THRESHOLD = 35;
  const WERBUNG_THRESHOLD = 30;
  
  // Determine category (priority: Virus > Schädlich > Spam > Werbung > Sicher)
  const tags = [];
  let category = 'sicher';
  let maxScore = 0;
  
  if (virusScore >= VIRUS_THRESHOLD) {
    tags.push('🦠 Virus');
    category = 'virus';
    maxScore = virusScore;
  }
  
  if (schaedlichScore >= SCHAEDLICH_THRESHOLD) {
    tags.push('⚠️ Schädlich');
    if (category === 'sicher' || schaedlichScore > maxScore) {
      category = 'schaedlich';
      maxScore = schaedlichScore;
    }
  }
  
  if (spamScore >= SPAM_THRESHOLD) {
    tags.push('🚫 Spam');
    if (category === 'sicher') {
      category = 'spam';
      maxScore = spamScore;
    }
  }
  
  if (werbungScore >= WERBUNG_THRESHOLD) {
    tags.push('📢 Werbung');
    if (category === 'sicher') {
      category = 'werbung';
      maxScore = werbungScore;
    }
  }
  
  return {
    category,
    score: maxScore,
    scores: { virus: virusScore, schaedlich: schaedlichScore, spam: spamScore, werbung: werbungScore },
    reasons: reasons.slice(0, 5), // Max 5 reasons
    tags
  };
}

/**
 * Batch-Analyse für mehrere E-Mails
 * @param {Array} emails - Array von E-Mail-Objekten
 * @param {Object} settings - Spam-Filter-Einstellungen
 * @returns {Map} Map von uid -> Analyse-Ergebnis
 */
export function analyzeEmails(emails, settings = {}) {
  const results = new Map();
  for (const email of emails) {
    const uid = email.uid || email.id;
    if (uid) {
      results.set(uid, analyzeEmail(email, settings));
    }
  }
  return results;
}

/**
 * Lade Spam-Filter-Einstellungen aus localStorage
 */
export function getSpamFilterSettings() {
  try {
    const saved = localStorage.getItem('spamFilterSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading spam filter settings:', e);
  }
  return {
    enabled: true,
    sensitivity: 'medium',
    whitelist: [],
    blacklist: [],
    autoMoveToSpam: false,
    showTags: true
  };
}

/**
 * Speichere Spam-Filter-Einstellungen in localStorage
 */
export function saveSpamFilterSettings(settings) {
  try {
    localStorage.setItem('spamFilterSettings', JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving spam filter settings:', e);
  }
}

/**
 * Tag-Styling-Informationen für UI-Darstellung
 */
export const TAG_STYLES = {
  'werbung': {
    label: '📢 Werbung',
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/40',
    description: 'Marketing-Mail oder Newsletter'
  },
  'spam': {
    label: '🚫 Spam',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/40',
    description: 'Unerwünschte E-Mail'
  },
  'schaedlich': {
    label: '⚠️ Schädlich',
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    description: 'Möglicher Phishing-Versuch'
  },
  'virus': {
    label: '🦠 Virus',
    bgColor: 'bg-red-700/30',
    textColor: 'text-red-300',
    borderColor: 'border-red-700/50',
    description: 'Enthält möglicherweise gefährliche Dateien'
  },
  'sicher': {
    label: '✅ Sicher',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/40',
    description: 'Keine Bedrohung erkannt'
  },
  'whitelist': {
    label: '✅ Vertrauenswürdig',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/40',
    description: 'Manuell als vertrauenswürdig markiert'
  }
};

export default {
  analyzeEmail,
  analyzeEmails,
  getSpamFilterSettings,
  saveSpamFilterSettings,
  TAG_STYLES
};
