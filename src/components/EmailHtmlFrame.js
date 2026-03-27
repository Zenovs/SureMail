import React, { useRef, useCallback } from 'react';

/**
 * Renders email HTML content in an isolated iframe so that any CSS
 * contained in the email (e.g. <style> tags, body rules) cannot leak
 * into the CoreMail UI.
 */
function EmailHtmlFrame({ html, fontFamily }) {
  const iframeRef = useRef(null);

  const font = fontFamily || 'Arial, sans-serif';

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
      const body = iframe.contentDocument?.body;
      if (body) {
        // Set height to fit content so no double scrollbar appears
        iframe.style.height = (body.scrollHeight + 32) + 'px';
      }
    } catch {
      // Cross-origin guard (shouldn't happen with srcdoc but be safe)
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
