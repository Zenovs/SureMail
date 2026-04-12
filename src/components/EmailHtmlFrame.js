import React, { useRef, useCallback } from 'react';

/**
 * Renders email HTML content in an isolated iframe so that any CSS
 * contained in the email (e.g. <style> tags, body rules) cannot leak
 * into the CoreMail UI.
 */
function EmailHtmlFrame({ html, fontFamily }) {
  const iframeRef = useRef(null);

  // Sanitize font to prevent CSS injection (strip everything after first semicolon/brace/quote)
  const font = (fontFamily || 'Arial, sans-serif').replace(/[;"'{}\\]/g, '');

  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  html, body {
    margin: 0;
    padding: 16px;
    font-family: ${font};
    word-break: break-word;
    overflow-x: hidden;
    background: white;
    color: #111;
  }
  img { max-width: 100%; height: auto; }
  a { color: #0891b2; }
  pre, code { white-space: pre-wrap; word-break: break-all; }
</style>
</head>
<body>${html}</body>
</html>`;

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      const body = doc?.body;
      if (body) {
        iframe.style.height = (body.scrollHeight + 32) + 'px';

        // Links im Browser öffnen statt im iframe navigieren
        body.querySelectorAll('a[href]').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href && window.electronAPI?.openExternal) {
              // Block javascript: and other dangerous protocols
              const proto = href.trim().toLowerCase().split(':')[0];
              if (['http', 'https', 'mailto'].includes(proto)) {
                window.electronAPI.openExternal(href);
              }
            }
          }, { once: true });
        });

        // Kontextmenü-Events an Electron weiterleiten (Kopieren etc.)
        body.addEventListener('contextmenu', (e) => {
          const selection = doc.getSelection()?.toString() || null;
          const linkEl = e.target.closest('a[href]');
          const customEvent = new CustomEvent('contextmenu', {
            bubbles: true, cancelable: true,
            detail: {
              selection,
              linkUrl: linkEl?.href || null,
              clientX: e.clientX,
              clientY: e.clientY
            }
          });
          window.dispatchEvent(customEvent);
        });
      }
    } catch {
      // Cross-origin guard
    }
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      title="E-Mail Inhalt"
      style={{
        width: '100%',
        border: 'none',
        minHeight: '200px',
        display: 'block',
        borderRadius: '8px',
        background: 'white',
      }}
      onLoad={handleLoad}
    />
  );
}

export default EmailHtmlFrame;
