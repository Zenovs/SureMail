import DOMPurify from 'dompurify';

// Zentraler HTML-Sanitizer für alle Stellen, die Mail-/Fremd-HTML in den
// (nicht-sandboxed) Haupt-Renderer einfügen — z.B. das Reply/Forward-Zitat im
// Editor oder die Compose-Vorschau. Ohne das würde `<img onerror=…>` /
// `<svg onload=…>` aus einer Mail beim Antworten Code im Renderer ausführen.
//
// Formatierung (Text, Listen, Links, Bilder, Tabellen, Inline-Styles) bleibt
// erhalten; entfernt werden Skripte, Event-Handler (on*), Formulare und
// aktive/interaktive Elemente.
export function sanitizeEmailHtml(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(String(dirty), {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'form', 'input', 'button', 'textarea', 'select'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onanimationstart', 'formaction'],
    ALLOW_DATA_ATTR: false
  });
}

export default sanitizeEmailHtml;
