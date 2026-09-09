(function () {
  'use strict';

  // Android bridge is installed by MainActivity before the web app loads.
  // On normal web/PWA builds, this script remains harmless.
  var android = window.AndroidAzizi;
  var originalOpen = window.open.bind(window);
  var originalShare = navigator.share ? navigator.share.bind(navigator) : null;
  var lastReceiptCanvas = null;

  function rememberCanvas(canvas) {
    if (canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0) {
      lastReceiptCanvas = canvas;
      window.__aziziLastReceiptCanvas = canvas;
    }
  }

  // Keep track of the receipt/account canvas rendered by the React UI.
  try {
    new MutationObserver(function () {
      document.querySelectorAll('canvas').forEach(rememberCanvas);
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (_) {}

  function sendImageToWhatsApp(canvas, text, filename, phone) {
    if (!android || !android.shareImageToWhatsApp || !canvas) return false;
    try {
      var dataUrl = canvas.toDataURL('image/png');
      var comma = dataUrl.indexOf(',');
      var base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
      android.shareImageToWhatsApp(base64, filename || 'إيصال_بقالة_العزي.png', text || '', phone || '');
      return true;
    } catch (e) {
      console.warn('Azizi native WhatsApp image share failed', e);
      return false;
    }
  }

  // Force image + text sharing to WhatsApp when a receipt canvas exists.
  if (originalShare) {
    navigator.share = function (shareData) {
      var files = shareData && shareData.files;
      if (files && files.length && files[0]) {
        return files[0].arrayBuffer().then(function (buffer) {
          if (android && android.shareImageToWhatsApp) {
            var bytes = new Uint8Array(buffer);
            var binary = '';
            var chunk = 0x8000;
            for (var i = 0; i < bytes.length; i += chunk) {
              binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
            }
            var base64 = btoa(binary);
            android.shareImageToWhatsApp(base64, files[0].name || 'إيصال_بقالة_العزي.png', shareData.text || '', '');
            return;
          }
          return originalShare(shareData);
        });
      }
      return originalShare(shareData);
    };
  }

  // Prevent print/PDF from opening an external browser, GitHub, Gemini, etc.
  // window.open('') is used by the app only for its internal print documents.
  window.open = function (url, target, features) {
    if (url === '' || url == null) {
      var frame = document.createElement('iframe');
      frame.style.position = 'fixed';
      frame.style.left = '-10000px';
      frame.style.top = '0';
      frame.style.width = '1px';
      frame.style.height = '1px';
      frame.setAttribute('aria-hidden', 'true');
      document.body.appendChild(frame);
      return frame.contentWindow;
    }

    // WhatsApp text links are also kept inside the Android app.
    if (typeof url === 'string' && /^https:\/\/(api\.whatsapp\.com|wa\.me)\//i.test(url)) {
      try {
        var parsed = new URL(url);
        var text = parsed.searchParams.get('text') || '';
        var phone = parsed.pathname.replace(/^\//, '');
        if (sendImageToWhatsApp(lastReceiptCanvas, text, 'إيصال_بقالة_العزي.png', phone)) return null;
        if (android && android.shareTextToWhatsApp) {
          android.shareTextToWhatsApp(text, phone);
          return null;
        }
      } catch (e) {
        console.warn('Azizi WhatsApp bridge failed', e);
      }
    }

    return originalOpen(url, target, features);
  };
})();
