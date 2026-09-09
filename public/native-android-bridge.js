(function () {
  'use strict';

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

  function scanCanvases() {
    try { document.querySelectorAll('canvas').forEach(rememberCanvas); } catch (_) {}
  }
  try {
    new MutationObserver(scanCanvases).observe(document.documentElement, { childList: true, subtree: true });
    setInterval(scanCanvases, 500);
  } catch (_) {}

  function canvasBase64(canvas) {
    return canvas.toDataURL('image/png').split(',')[1];
  }

  function sendImageToWhatsApp(canvas, text, filename, phone) {
    if (!android || !android.shareImageToWhatsApp || !canvas) return false;
    try {
      android.shareImageToWhatsApp(canvasBase64(canvas), filename || 'إيصال_بقالة_العزي.png', text || '', phone || '');
      return true;
    } catch (e) {
      console.warn('Azizi native WhatsApp image share failed', e);
      return false;
    }
  }

  if (originalShare) {
    navigator.share = function (shareData) {
      var files = shareData && shareData.files;
      if (files && files.length && files[0]) {
        return files[0].arrayBuffer().then(function (buffer) {
          if (android && android.shareImageToWhatsApp) {
            var bytes = new Uint8Array(buffer), binary = '', chunk = 0x8000;
            for (var i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
            android.shareImageToWhatsApp(btoa(binary), files[0].name || 'إيصال_بقالة_العزي.png', shareData.text || '', '');
            return;
          }
          return originalShare(shareData);
        });
      }
      return originalShare(shareData);
    };
  }

  try {
    var originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (android && android.saveImage && this.download && /^data:image\/png/i.test(this.href || '')) {
        try {
          android.saveImage(this.href.split(',')[1], this.download || 'إيصال_بقالة_العزي.png');
          return;
        } catch (_) {}
      }
      return originalAnchorClick.call(this);
    };
  } catch (_) {}

  // Native Android contact picker. CustomerDialog registers __aziziOnContactPicked.
  window.__aziziPickContact = function () {
    if (android && android.pickContact) android.pickContact();
  };

  window.open = function (url, target, features) {
    if (url === '' || url == null) {
      if (android && (android.printBluetoothReceipt || android.printHtml)) {
        var html = '', closed = false;
        function submitPrint() {
          if (closed) return;
          closed = true;
          scanCanvases();
          if (/طباعة الفاتورة/.test(html) && android.printBluetoothReceipt && lastReceiptCanvas) {
            try { android.printBluetoothReceipt(canvasBase64(lastReceiptCanvas)); return; } catch (_) {}
          }
          if (android.printHtml) android.printHtml(html, 'بقالة العزي - مستند');
        }
        return { document: { write: function (v) { html += String(v || ''); }, close: submitPrint }, focus: function () {}, print: submitPrint, close: function () {} };
      }
      return originalOpen(url, target, features);
    }

    if (typeof url === 'string' && /^https:\/\/(api\.whatsapp\.com|wa\.me)\//i.test(url)) {
      try {
        scanCanvases();
        var parsed = new URL(url);
        var text = parsed.searchParams.get('text') || '';
        var phone = parsed.pathname.replace(/^\//, '');
        if (sendImageToWhatsApp(lastReceiptCanvas, text, 'إيصال_بقالة_العزي.png', phone)) return null;
        if (android && android.shareTextToWhatsApp) { android.shareTextToWhatsApp(text, phone); return null; }
      } catch (e) { console.warn('Azizi WhatsApp bridge failed', e); }
    }
    return originalOpen(url, target, features);
  };
})();
