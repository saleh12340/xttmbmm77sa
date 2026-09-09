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

  try {
    new MutationObserver(function () {
      document.querySelectorAll('canvas').forEach(rememberCanvas);
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (_) {}

  function canvasBase64(canvas) {
    var dataUrl = canvas.toDataURL('image/png');
    var comma = dataUrl.indexOf(',');
    return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
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
            var bytes = new Uint8Array(buffer);
            var binary = '';
            var chunk = 0x8000;
            for (var i = 0; i < bytes.length; i += chunk) {
              binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
            }
            android.shareImageToWhatsApp(btoa(binary), files[0].name || 'إيصال_بقالة_العزي.png', shareData.text || '', '');
            return;
          }
          return originalShare(shareData);
        });
      }
      return originalShare(shareData);
    };
  }

  // Save generated receipt/account PNG directly into the Android Pictures gallery.
  try {
    var originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (android && android.saveImage && this.download && /^data:image\/png/i.test(this.href || '')) {
        try {
          var comma = this.href.indexOf(',');
          var base64 = comma >= 0 ? this.href.slice(comma + 1) : this.href;
          android.saveImage(base64, this.download || 'إيصال_بقالة_العزي.png');
          return;
        } catch (_) {}
      }
      return originalAnchorClick.call(this);
    };
  } catch (_) {}

  // Replace the old browser window used by print/PDF with Android's native print framework.
  // Android's print dialog can send to a configured printer or choose "Save as PDF".
  window.open = function (url, target, features) {
    if (url === '' || url == null) {
      if (android && android.printHtml) {
        var html = '';
        var closed = false;
        return {
          document: {
            write: function (value) { html += String(value || ''); },
            close: function () {
              if (closed) return;
              closed = true;
              android.printHtml(html, 'بقالة العزي - فاتورة');
            }
          },
          focus: function () {},
          print: function () {
            if (!closed) {
              closed = true;
              android.printHtml(html, 'بقالة العزي - فاتورة');
            }
          },
          close: function () {}
        };
      }
      return originalOpen(url, target, features);
    }

    // WhatsApp: keep the operation native and avoid the browser/GitHub/Gemini route.
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
