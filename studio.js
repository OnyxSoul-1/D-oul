(function(){
"use strict";

// ---------- encoding (UTF-8 safe, no deprecated escape/unescape) ----------
function toB64(str){
  var bytes = new TextEncoder().encode(str);
  var bin = "";
  for (var i=0;i<bytes.length;i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function fromB64(b64){
  var bin = atob(b64);
  var bytes = new Uint8Array(bin.length);
  for (var i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ---------- limits (Chrome reality) ----------
var BM_LIMIT = 60000;      // bookmark URL practical limit (~64KB, minus overhead)
var DATA_URL_LIMIT = 2000000; // ~2MB nav limit

// ---------- bookmarklet builders ----------
function bookmarkletNewTab(b64){
  // opens a new tab with the encoded page via blob (no document.write, no data-URL size cap)
  return "javascript:(function(){var b=atob('" + b64 + "');var a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);var s=new TextDecoder().decode(a);var u=URL.createObjectURL(new Blob([s],{type:'text/html;charset=utf-8'}));window.open(u,'_blank')})()";
}
function bookmarkletSameTab(b64){
  return "javascript:(function(){var b=atob('" + b64 + "');var a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);var s=new TextDecoder().decode(a);document.documentElement.innerHTML=s})()";
}

// ---------- UI wiring (works both as a panel and standalone) ----------
function boot(){
  var D = document;
  if (D.getElementById('__ds_panel')) { D.getElementById('__ds_panel').remove(); return; }

  var panel = D.createElement('div');
  panel.id = '__ds_panel';
  panel.style.cssText = 'position:fixed;top:16px;right:16px;width:520px;max-height:94vh;overflow:auto;background:#1e1e1e;color:#ccc;border:1px solid #007acc;border-radius:10px;padding:14px;z-index:2147483647;font:13px/1.5 Consolas,monospace;box-shadow:0 12px 40px rgba(0,0,0,.7)';

  var head = D.createElement('div');
  head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px';
  head.innerHTML = '<b style="color:#4ec9b0">D@%@$oul Studio</b>';
  var close = D.createElement('button');
  close.textContent = '✕';
  close.style.cssText = 'background:#333;color:#fff;border:0;border-radius:4px;cursor:pointer;padding:2px 8px';
  close.onclick = function(){ panel.remove(); };
  head.appendChild(close);
  panel.appendChild(head);

  var nm = D.createElement('input');
  nm.value = 'D@%@$oul'; nm.placeholder = 'Bookmark name';
  nm.style.cssText = 'width:100%;background:#111;color:#fff;border:1px solid #444;border-radius:6px;padding:6px;box-sizing:border-box;margin-bottom:6px';
  panel.appendChild(nm);

  var ht = D.createElement('textarea');
  ht.placeholder = 'Paste full HTML here...';
  ht.style.cssText = 'width:100%;height:150px;background:#111;color:#eee;border:1px solid #444;border-radius:6px;padding:6px;box-sizing:border-box';
  panel.appendChild(ht);

  var meter = D.createElement('div');
  meter.style.cssText = 'height:6px;background:#111;border-radius:3px;overflow:hidden;margin:4px 0';
  var bar = D.createElement('div');
  bar.style.cssText = 'height:100%;background:#4ec9b0;width:0;transition:.2s';
  meter.appendChild(bar);
  panel.appendChild(meter);
  var info = D.createElement('div');
  info.style.cssText = 'font-size:12px;color:#858585';
  panel.appendChild(info);

  var row = D.createElement('div');
  row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:8px 0';
  panel.appendChild(row);

  var out = D.createElement('textarea');
  out.readOnly = true; out.placeholder = 'data:text/html;charset=utf-8;base64,...';
  out.style.cssText = 'width:100%;height:90px;background:#111;color:#4ec9b0;border:1px solid #444;border-radius:6px;padding:6px;box-sizing:border-box';
  panel.appendChild(out);

  var dragZone = D.createElement('div');
  dragZone.style.marginTop = '8px';
  panel.appendChild(dragZone);

  var msg = D.createElement('div');
  msg.style.cssText = 'font-size:12px;color:#858585;margin-top:6px';
  panel.appendChild(msg);

  function setMsg(t, cls){ msg.textContent = t; msg.className = cls || ''; }

  function updateMeter(){
    var len = ht.value.length;
    var b64len = Math.ceil(new TextEncoder().encode(ht.value).length * 4 / 3);
    var pct = Math.min(100, b64len / BM_LIMIT * 100);
    bar.style.width = pct + '%';
    bar.style.background = pct > 90 ? '#f85149' : (pct > 70 ? '#f0c850' : '#4ec9b0');
    info.textContent = len + ' chars · b64 ' + b64len + ' b · bookmark budget ' + BM_LIMIT + ' b (' + Math.round(pct) + '%)';
    if (b64len > BM_LIMIT) info.className = 'err', info.textContent += ' — TOO LARGE for a bookmark';
    else if (pct > 70) info.className = 'warn';
    else info.className = '';
  }
  ht.addEventListener('input', updateMeter);

  function btn(txt, bg, fn){
    var b = D.createElement('button');
    b.textContent = txt;
    b.style.cssText = 'background:' + bg + ';color:#fff;border:0;border-radius:5px;padding:6px 10px;cursor:pointer;font-weight:600;font-family:inherit';
    b.onclick = fn;
    row.appendChild(b);
    return b;
  }

  btn('Convert', '#007acc', function(){
    out.value = 'data:text/html;charset=utf-8;base64,' + toB64(ht.value);
    if (out.value.length > DATA_URL_LIMIT) setMsg('data URL exceeds 2MB nav limit — Chrome will refuse to open it', 'err');
    else setMsg('data URL ready');
  });

  btn('Copy URL', '#b58900', function(){
    if (!out.value) { out.value = 'data:text/html;charset=utf-8;base64,' + toB64(ht.value); }
    out.select();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(out.value).then(function(){ setMsg('data URL copied'); },
        function(){ setMsg('clipboard blocked — select and copy manually', 'warn'); });
    } else {
      try { document.execCommand('copy'); setMsg('data URL copied'); }
      catch(e){ setMsg('clipboard blocked — select and copy manually', 'warn'); }
    }
  });

  btn('Test', '#2d8a4e', function(){
    if (!out.value) out.value = 'data:text/html;charset=utf-8;base64,' + toB64(ht.value);
    var f = D.createElement('iframe');
    f.setAttribute('sandbox', 'allow-scripts');
    f.style.cssText = 'position:fixed;bottom:16px;right:550px;width:420px;height:320px;border:1px solid #007acc;border-radius:8px;z-index:2147483647;background:#fff';
    f.src = out.value;
    D.body.appendChild(f);
    setMsg('preview opened (sandboxed)');
  });

  function makeBookmarklet(){
    if (!ht.value.trim()) { setMsg('paste some HTML first', 'err'); return null; }
    var b64 = toB64(ht.value);
    var useNewTab = D.getElementById('__ds_newtab') ? D.getElementById('__ds_newtab').checked : true;
    var bm = useNewTab ? bookmarkletNewTab(b64) : bookmarkletSameTab(b64);
    if (bm.length > BM_LIMIT) {
      setMsg('bookmarklet is ' + bm.length + ' b — exceeds ~64KB bookmark limit. Trim HTML or use Download.', 'err');
      return null;
    }
    return bm;
  }

  btn('⭐ Make Bookmark', '#8a2be2', function(){
    var bm = makeBookmarklet(); if (!bm) return;
    dragZone.innerHTML = '';
    var a = D.createElement('a');
    a.href = bm;
    a.textContent = nm.value || 'D@%@$oul';
    a.style.cssText = 'display:block;background:#4ec9b0;color:#111;padding:10px;border-radius:6px;text-align:center;font-weight:bold;cursor:grab;text-decoration:none;margin-bottom:6px';
    dragZone.appendChild(a);
    setMsg('drag the green link to your bookmarks bar');
  });

  btn('Copy Bookmark', '#8a2be2', function(){
    var bm = makeBookmarklet(); if (!bm) return;
    var ta = D.createElement('textarea');
    ta.value = bm;
    ta.style.cssText = 'position:fixed;left:-9999px';
    D.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); setMsg('bookmarklet copied — paste into a new bookmark URL'); }
    catch(e){ setMsg('copy blocked — select the textarea and copy manually', 'warn'); }
    ta.remove();
  });

  btn('Download', '#555', function(){
    var bl = new Blob([ht.value], {type:'text/html;charset=utf-8'});
    var a = D.createElement('a');
    a.href = URL.createObjectURL(bl);
    a.download = (nm.value || 'page') + '.html';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
  });

  // new-tab toggle
  var lbl = D.createElement('label');
  lbl.style.cssText = 'display:block;font-size:12px;margin:6px 0;color:#858585';
  var cb = D.createElement('input');
  cb.type = 'checkbox'; cb.id = '__ds_newtab'; cb.checked = true;
  lbl.appendChild(cb);
  lbl.appendChild(D.createTextNode(' bookmarklet opens in a new tab'));
  panel.appendChild(lbl);

  D.body.appendChild(panel);
  updateMeter();
  nm.focus();
}

// auto-boot when loaded as a script (bookmarklet or page)
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
