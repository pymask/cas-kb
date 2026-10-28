

/* 公式 / 流程图 / 表格图片（由财政部原文 PDF 按字形墨迹裁切渲染，base64 内联） */
/* 浏览统计命名空间（提前声明，供早期调用的 recordVisit 使用，避免 TDZ） */
const _STAT_NS = 'cas-kb-2026';

/* ============ 访问密码门 ============
   静态密码：仅比对密码的 SHA-256 哈希，明文不出现在源码。
   改密码：把新密码用 sha256 算出的十六进制串替换 PW_HASH 即可。
   注：纯静态站点无法做到真·保密——懂技术者可用开发者工具跳过门或直取数据；
       本门用于拦住随手打开的路人。若要真保密请改用服务端鉴权。 */
const PW_HASH = "f109f5e6a616608d0df20ce95bd23c17608166dfc5e6eb4ac451abb86059e49f"; // 默认密码 lxnb（SHA-256）
const K256 = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
 0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
 0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
 0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
 0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
 0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
 0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
 0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function sha256Hex(s){
  function rotr(x,n){return (x>>>n)|(x<<(32-n));}
  function shr(x,n){return x>>>n;}
  var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var utf8=unescape(encodeURIComponent(s));
  var len=utf8.length;
  var words=[];
  for(var i=0;i<len;i++) words[i>>2] |= (utf8.charCodeAt(i)&0xff) << (24-(i&3)*8);
  words[len>>2] |= 0x80 << (24-(len&3)*8);
  words[(((len+8)>>6)<<4)+15] = len*8;
  var w=new Array(64);
  for(var i=0;i<words.length;i+=16){
    var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(var j=0;j<64;j++){
      if(j<16) w[j]=words[i+j]||0;
      else{ var v1=w[j-15],v2=w[j-2];
        w[j]=(rotr(v1,7)^rotr(v1,18)^shr(v1,3)) + w[j-16] + (rotr(v2,17)^rotr(v2,19)^shr(v2,10)) + w[j-7]; }
      var t1=h + (rotr(e,6)^rotr(e,11)^rotr(e,25)) + ((e&f)^((~e)&g)) + K[j] + w[j];
      var t2=(rotr(a,2)^rotr(a,13)^rotr(a,22)) + ((a&b)^(a&c)^(b&c));
      h=g;g=f;f=e;e=(d+t1)&0xffffffff;d=c;c=b;b=a;a=(t1+t2)&0xffffffff;
    }
    H[0]=(H[0]+a)&0xffffffff;H[1]=(H[1]+b)&0xffffffff;H[2]=(H[2]+c)&0xffffffff;H[3]=(H[3]+d)&0xffffffff;
    H[4]=(H[4]+e)&0xffffffff;H[5]=(H[5]+f)&0xffffffff;H[6]=(H[6]+g)&0xffffffff;H[7]=(H[7]+h)&0xffffffff;
  }
  var hex='';
  for(var i=0;i<8;i++) hex += ('00000000'+(H[i]>>>0).toString(16)).slice(-8);
  return hex;
}
(function gateInit(){
  const gate=document.getElementById('gate');
  const app=document.getElementById('app');
  const inp=document.getElementById('gpw');
  const err=document.getElementById('gerr');
  if(!gate||!app) return;
  function unlock(){ gate.style.display='none'; app.style.visibility='visible'; try{sessionStorage.setItem('kb_gate','1');}catch(e){} recordVisit(); }
  if(sessionStorage.getItem('kb_gate')==='1'){ unlock(); return; }
  function tryOpen(){
    const v=inp.value;
    if(!v){ err.textContent='请输入访问密码'; return; }
    const h=sha256Hex(v);
    if(h===getPwHash()){ unlock(); }
    else { err.textContent='密码错误，请重试'; inp.value=''; inp.focus(); }
  }
  document.getElementById('gbtn').addEventListener('click', tryOpen);
  inp.addEventListener('keydown', function(e){ if(e.key==='Enter') tryOpen(); });
  inp.focus();
})();

const S = {mode:'std', q:'', focus:null};   // focus: 当前浏览范围（文档名 或 科目名）

/* ============ 浏览历史栈（返回机制） ============ */
/* 每次"跳转"前记录当前位置与滚动偏移；点返回即可回到原处 */
let NAVSTACK = [];
let _navigating = false;   // 防止 pushState 与内部压栈互相触发

function snapScroll(){
  const c = document.getElementById('content');
  return c ? c.scrollTop : 0;
}
function mkState(extra){
  return Object.assign({
    mode: S.mode,
    focus: S.focus,
    q: S.q,
    scroll: snapScroll()
  }, extra || {});
}
/* 记录一条历史（在跳转前调用）。label 用于面包屑显示 */
function pushHist(label){
  NAVSTACK.push({ st: mkState(), label: label || (S.focus || '首页') });
  if(NAVSTACK.length > 60) NAVSTACK.shift();
  try{ history.pushState({ d: NAVSTACK.length }, '', '#'); }catch(e){}
  renderCrumb();
}
/* 回到某条历史快照 */
function restore(st){
  S.mode = st.mode; S.focus = st.focus; S.q = st.q || '';
  document.getElementById('q').value = S.q;
  syncSearchUI();
  setModeUIQuiet();
  if(S.q){ doSearch(true); }
  else if(S.mode==='subj'){
    if(S.focus && S.focus.startsWith('科目：')) showSubj(S.focus.slice(3), true);
    else { document.getElementById('content').innerHTML = subjWelcome(); }
  } else {
    if(S.focus) showDoc(S.focus, null, true);
    else document.getElementById('content').innerHTML = welcome();
  }
  const c = document.getElementById('content');
  if(c) c.scrollTop = st.scroll || 0;
  hlNav();
  renderCrumb();
}
function goBack(){
  if(!NAVSTACK.length) return;
  const prev = NAVSTACK.pop();
  _navigating = true;
  restore(prev.st);
  _navigating = false;
  try{ history.replaceState({ d: NAVSTACK.length }, '', '#'); }catch(e){}
  renderCrumb();
}
window.addEventListener('popstate', ()=>{ if(!_navigating && NAVSTACK.length) goBack(); });

/* 面包屑：显示 当前文档 › 章 › 条文 */
function renderCrumb(){
  const bar = document.getElementById('crumb');
  const path = document.getElementById('crumbpath');
  const back = document.getElementById('backBtn');
  if(!bar || !path) return;
  const canBack = NAVSTACK.length > 0;
  back.disabled = !canBack;
  back.style.opacity = canBack ? '1' : '.4';
  back.style.cursor = canBack ? 'pointer' : 'default';
  let html = '';
  if(S.q){
    html = '<b>搜索结果</b><i>›</i>“' + esc(S.q) + '”';
  } else if(S.mode==='subj'){
    html = '<a data-crumb="root">全部科目</a>';
    if(S.focus && S.focus.startsWith('科目：')) html += '<i>›</i><b>' + esc(S.focus) + '</b>';
  } else {
    html = '<a data-crumb="root">全部准则</a>';
    if(S.focus) html += '<i>›</i><b>' + esc(S.focus) + '</b>';
  }
  path.innerHTML = html;
  bar.classList.toggle('on', true);
}
document.getElementById('crumbpath').addEventListener('click', e=>{
  const a = e.target.closest('[data-crumb]');
  if(!a) return;
  pushHist(S.q ? '搜索结果' : (S.focus || '首页'));
  S.q=''; document.getElementById('q').value=''; syncSearchUI();
  S.focus = null;
  S.mode = (S.mode==='subj') ? 'subj' : 'std';
  setModeUIQuiet();
  document.getElementById('content').innerHTML = S.mode==='subj' ? subjWelcome() : welcome();
  hlNav(); renderCrumb(); updateMetabar();
});
document.getElementById('backBtn').addEventListener('click', goBack);
/* 键盘：Alt/⌘ + ← 也能返回 */
document.addEventListener('keydown', e=>{
  if(e.key==='ArrowLeft' && (e.altKey || e.metaKey)){ e.preventDefault(); goBack(); }
});

/* ============ 侧栏目录 ============ */
function renderNav(){
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  if(S.mode==='std') renderStd(nav); else renderSubj(nav);
}

/* ---- 按准则：文档 -> 章 -> 条（点击=整段连续渲染） ---- */
function renderStd(nav){
  TREE.forEach((kn, ki)=>{
    const tn = el('div','tn');
    const hd = el('div','hd');
    hd.innerHTML = `<span class="car">▼</span><span>${kn.kind}</span>`;
    hd.onclick = ()=>tn.classList.toggle('col');
    tn.appendChild(hd);
    const kid = el('div','kid');
    kn.docs.forEach(d=>{
      // 解释/问答无章节，文档默认展开
      const dt = el('div', kn.kind==='准则原文' ? 'tn col' : 'tn');
      const dh = el('div','hd');
      const dn = d.chapters.reduce((a,c)=>a+c.items.length,0);
      dh.innerHTML = `<span class="car">▼</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d.name)}</span><span class="dcount">${dn}</span>`;
      // 点文档标题 = 展开/收起 + 连续浏览整部
      dh.onclick = (e)=>{ e.stopPropagation(); dt.classList.toggle('col'); if(!dt.classList.contains('col')) showDoc(d.name, d.chapters[0] && d.chapters[0].items[0]); };
      dt.appendChild(dh);
      const dk = el('div','kid');
        d.chapters.forEach(ch=>{
        const ct = el('div', ch.name ? 'ch col' : 'ch');
        if(ch.name){
          const chh = el('div','hd');
          chh.innerHTML = `<span class="car">▼</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(ch.name)}</span><span class="dcount">${ch.items.length}</span>`;
          // 点章标题 = 展开 + 渲染整部并从该章首条开始阅读（跨章连续）
          chh.onclick = (e)=>{ e.stopPropagation(); ct.classList.toggle('col');
            if(!ct.classList.contains('col')) showDoc(d.name, ch.items[0]); };
          ct.appendChild(chh);
        }
        const ak = el('div','aki');
        ch.items.forEach(i=>{
          const a = el('a'); a.dataset.i=i;
          // 实施问答：目录标题用 AI 提炼的短摘要（qsum），悬停显示完整原文
          if(DATA[i].k==='实施问答'){
            a.classList.add('wide');
            a.textContent = DATA[i].qsum || DATA[i].no;
            if(DATA[i].q) a.title = DATA[i].q;
          }
          else a.textContent = shortLabel(DATA[i].no);
          // 点条号 = 渲染整部文档并滚动定位到该条（整部连续可读）
          a.onclick = (ev)=>{ ev.preventDefault(); showDoc(d.name, i); };
          ak.appendChild(a);
        });
        ct.appendChild(ak);
        dk.appendChild(ct);
      });
      dt.appendChild(dk);
      kid.appendChild(dt);
    });
    tn.appendChild(kid);
    nav.appendChild(tn);
  });
  hlNav();
}
function shortLabel(no){
  let m = no.match(/^第(.+?)条/); if(m) return '第'+m[1]+'条';
  m = no.match(/^([一二三四五六七八九十]+)、(.*)/);
  if(m) return m[1] + '、' + (m[2].length>12 ? m[2].slice(0,12)+'…' : m[2]);
  m = no.match(/^([一二三四五六七八九十]+)[、．]/); if(m) return m[1];
  return no.slice(0,10);
}

/* ---- 按科目 ---- */
function renderSubj(nav){
  SUBTREE.forEach(g=>{
    const st = el('div','scls col');
    const hd = el('div','hd');
    hd.innerHTML = `<span class="car">▼</span><span>${g.cls}类</span><span class="dcount">${g.items.length}</span>`;
    hd.onclick = ()=>st.classList.toggle('col');
    st.appendChild(hd);
    const sk = el('div','skid');
    g.items.forEach(s=>{
      const a = el('a'); a.dataset.sname = s.name;
      a.innerHTML = `<span class="code">${s.code||'—'}</span><span>${esc(s.name)}</span><span class="dcount">${(s.n||0)}</span>`;
      a.onclick = (ev)=>{ ev.preventDefault(); showSubj(s.name); };
      sk.appendChild(a);
    });
    st.appendChild(sk);
    nav.appendChild(st);
  });
  hlNav();
}

/* ============ 主区：连续文档渲染 ============ */
/* 文档名归一化查找：兼容 DATA.d（可能带"企业会计准则"前缀）与 TREE 文档名不一致 */
function findDoc(name){
  for(const k of TREE){
    for(const d of k.docs){ if(d.name===name) return d; }
  }
  // 容错：去掉/补上"企业会计准则"前缀，或用包含关系匹配
  const strip = s=>s.replace(/^企业会计准则/, '');
  const want = strip(name);
  for(const k of TREE){
    for(const d of k.docs){ if(strip(d.name)===want) return d; }
  }
  for(const k of TREE){
    for(const d of k.docs){ if(d.name.includes(want) || want.includes(d.name)) return d; }
  }
  return null;
}

/* 渲染整部文档（连续滚动），jumpTo 为要定位的记录下标 */
function showDoc(group, jumpTo, silent){
  const d = findDoc(group);
  if(!d){
    // 兜底：以该记录所在文档为准重新定位
    const r = (jumpTo!=null && DATA[jumpTo]) ? DATA[jumpTo] : null;
    const d2 = r ? findDoc(r.d) : null;
    if(d2){ group = d2.name; }
    else { document.getElementById('content').innerHTML =
      `<div class="empty">未找到文档「${esc(group)}」。</div>`; return; }
  }
  if(!silent) pushHist(S.focus || '首页');
  const doc = findDoc(group);
  const all = [];
  doc.chapters.forEach(c=>c.items.forEach(i=>all.push(i)));
  renderContinuous([{group:doc.name, doc:doc, items:all}], jumpTo);
  renderCrumb();
}

/* 渲染多段（科目视图用）：segs=[{group,doc,items,chapter?}] */
function renderContinuous(segs, jumpTo){
  const c = document.getElementById('content');
  S.focus = segs.map(s=>s.doc.name).join(' · ');
  let html = '';
  segs.forEach(seg=>{
    const r0 = DATA[seg.items[0]];
    // 文档大标题（每段都标注，便于滚动中辨识）
    html += docHead(seg.doc, r0);
    let curCh = null;
    let chCnt = 0;
    seg.items.forEach(i=>{
      const r = DATA[i];
      const ch = r.c || seg.chapter || '';
      if(ch && ch !== curCh){
        // 章计数：整部渲染时统计本章在这次渲染中的实际条数
        chCnt = seg.items.filter(j => (DATA[j].c || seg.chapter || '') === ch).length;
        html += `<div class="sec-h">${esc(ch)}<span class="cnt">${chCnt} 条</span></div>`;
        curCh = ch;
      }
      html += card(i, false);
    });
  });
  c.innerHTML = html;
  // 定位：靠前时用瞬时跳转，避免长距离平滑滚动
  if(jumpTo!=null){
    const t = document.getElementById('r'+jumpTo);
    if(t){ c.scrollTop = 0; void c.offsetHeight; t.scrollIntoView({block:'start'}); }
  } else {
    c.scrollTop = 0;
  }
  setupObserver();
  updateMetabar();
}

function docHead(d, r0){
  // 元数据取该文档任一条（同类文档元数据一致）
  const first = d.chapters.find(c=>c.items.length);
  const m = (first ? DATA[first.items[0]] : r0) || r0;
  return `<div class="doc-head">
    <div class="h">${esc(d.name)}</div>
    <div class="m">
      ${m && m.w?`<span><b>文号</b> ${esc(m.w)}</span>`:''}
      ${m && m.p?`<span><b>发布日期</b> ${esc(m.p)}</span>`:''}
      ${m && m.e?`<span><b>生效日期</b> ${esc(m.e)}</span>`:''}
      ${m && m.s?`<span><b>状态</b> ${esc(m.s)}</span>`:''}
      ${m && m.u?`<a class="src" href="${m.u}" target="_blank">官方原文 ↗</a>`:''}
    </div></div>`;
}

/* 把正文中出现的《准则名》转成站内跳转链接（用 data-ref 属性 + 事件委托，避免转义问题）
   若传入 terms（搜索词），再对非链接文本做高亮 */
function escAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function linkifyRefs(i, terms){
  const r = DATA[i];
  let t = esc(r.t);
  const seen = {};
  (r.refs||[]).forEach(name=>{
    if(seen[name]) return; seen[name]=1;
    let idPart = null;
    let m = name.match(/^企业会计准则(第\d+号)/);       // 第14号——收入
    if(m) idPart = m[1];
    else { m = name.match(/^企业会计准则(解释第\d+号)/); if(m) idPart = m[1]; }
    if(!idPart) return;
    const safe = idPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 仅把《…第N号…》中的"第N号"片段做成链接，其余《》内容保持原样（避免整段变成链接）
    const re = new RegExp('《([^》]{0,40}?)(' + safe + ')([^》]{0,60})》', 'g');
    const open = '<a class="ref" data-ref="' + escAttr(name) + '" title="跳转：' + escAttr(name) + '">';
    t = t.replace(re, function(mm, pre, mid, post){
      return '《' + pre + open + mid + '</a>' + post + '》';
    });
  });
  // 高亮：只处理不在标签内的文本段
  if(terms && terms.length){
    const parts = t.split(/(<[^>]+>)/);
    for(let k=0;k<parts.length;k++){
      if(parts[k] && parts[k][0] !== '<') parts[k] = hl(parts[k], terms);
    }
    t = parts.join('');
  }
  t = t.replace(/\$\$([A-Za-z0-9_]+)\$\$/g, function(_m, id){
    var d = MATHIMG[id];
    if(!d) return _m;
    var st = 'width:' + d[1] + 'em;height:auto;max-width:100%';
    var cls = d[3] ? 'mathimg inl' : 'mathimg';
    return '<img class="' + cls + '" style="' + st + '" src="' + d[0]
         + '" alt="原文公式或表格">';
  });
  return applyMathToHTML(t);
}

function card(i, active, terms){
  const r = DATA[i];
  const T = terms || [];
  const qb = r.q ? `<div class="qbox"><div class="qcap">问题（原文）</div>${applyMathToHTML(hl(r.q, T))}</div>` : '';
  const rel = (r.sub && r.sub.length) ? `<div class="rel"><span class="lb">相关科目（点击按科目查阅）</span>` +
      r.sub.slice(0,16).map(s=>`<a onclick="showSubj('${jsq(s)}')">${esc(s)}</a>`).join('') + `</div>` : '';
  // 涉及准则：站内跳转（一个问答/案例可引用多部准则）
  const refs = (r.refs && r.refs.length)
      ? `<div class="rel stdrow"><span class="lb">涉及准则（点击跳转）</span>` +
        r.refs.map(n=>`<a class="stdref" data-ref="${escAttr(n)}" title="${escAttr(n)}">${esc(shortRef(n))}</a>`).join('') +
        `</div>`
      : '';
  // 右上角来源标签：链接到财政部官方原文
  const badge = r.u
      ? `<a class="k" href="${esc(r.u)}" target="_blank" rel="noopener">${esc(r.k)}</a>`
      : `<span class="k">${esc(r.k)}</span>`;
  return `<div class="card${active?' act':''}" id="r${i}" data-i="${i}">
    <div class="chd"><span class="no">${hl(r.k==='实施问答' ? (r.qsum||r.no) : (r.no.length>60?r.no.slice(0,60)+'…':r.no), T)}</span>
      ${r.c?`<span class="ttl">${hl(r.c, T)}</span>`:''}
      ${badge}</div>
    <div class="bd">${r.review_note?`<div class="hub-note">${esc(r.review_note)} <a href="${escAttr(r.review_source)}" target="_blank" rel="noopener">实施通知</a></div>`:""}<div class="tag">${esc(r.s || "效力待核验")}</div>${qb}<div class="txt">${linkifyRefs(i, T)}</div>${rel}${refs}</div>
  </div>`;
}
/* 涉及准则的短标签：第14号——收入 → 第14号；解释第20号 → 解释20号 */
function shortRef(n){
  let m = n.match(/^企业会计准则(第\d+号)/); if(m) return m[1];
  m = n.match(/^企业会计准则(解释第\d+号)/); if(m) return m[1].replace('解释第','解释');
  m = n.match(/^企业会计准则——(.+)$/); if(m) return m[1];
  return n.replace(/^企业会计准则/, '');
}

/* ============ 搜索 ============
   目标：从"子串匹配"升级为"分词 + 字段加权 + 高亮"。
   - 分词：中文按字+双字滑窗切分，英文/数字按词切；支持引号精确短语
   - 加权：条号 > 章名 > 问答原文 > 正文 > 文档名 > 文号
   - 全部词命中才收录（AND），按得分降序
*/
let _sugIdx = -1;

/* 分词：返回词数组。支持 "精确短语" 语法 */
function tokenize(q){
  const terms = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m;
  while((m = re.exec(q)) !== null){
    if(m[1]) terms.push({ t: m[1].toLowerCase(), exact: 1 });
    else {
      const s = m[2].toLowerCase();
      // 含中文则拆 2 字词（更贴近检索习惯），否则整词
      if(/[\u4e00-\u9fa5]/.test(s)){
        if(s.length <= 2) terms.push({ t: s });
        else for(let i=0;i<s.length-1;i++) terms.push({ t: s.slice(i, i+2) });
      } else {
        terms.push({ t: s });
      }
    }
  }
  // 去重 + 去掉被更长词包含的短词
  const uniq = [];
  const seen = {};
  terms.forEach(x=>{ if(!seen[x.t]){ seen[x.t]=1; uniq.push(x); } });
  return uniq.length ? uniq : [{ t:(q||'').toLowerCase() }];
}

/* 字段权重表（sub=该条文关联的科目名，搜科目名时直接召回） */
const FW = {no:12, c:6, q:5, t:2, d:3, w:8, g:3, sub:7};

/* 单条记录打分。命中全部词返回 {score, hitFields}，否则 null */
function scoreRec(r, terms){
  let score = 0;
  const fields = {
    no: (r.no||'').toLowerCase(),
    c:  (r.c||'').toLowerCase(),
    q:  (r.q||'').toLowerCase(),
    t:  (r.t||'').toLowerCase(),
    d:  (r.d||'').toLowerCase(),
    w:  (r.w||'').toLowerCase(),
    g:  (r.g||'').toLowerCase(),
    sub:(r.sub||[]).join(' ').toLowerCase()
  };
  for(const tm of terms){
    let best = 0;
    for(const k in FW){
      const f = fields[k];
      if(!f) continue;
      if(f.includes(tm.t)){
        let s = FW[k];
        // 出现次数越多得分越高（封顶）
        let n = 0, pos = f.indexOf(tm.t);
        while(pos !== -1 && n < 6){ n++; pos = f.indexOf(tm.t, pos + tm.t.length); }
        s += n;
        // 词出现在字段开头（如条号、章名首部）额外加权
        if(f.startsWith(tm.t)) s += 4;
        if(s > best) best = s;
      }
    }
    if(!best) return null;      // 有一个词未命中 → 整条淘汰（AND 语义）
    score += best;
  }
  return { score: score };
}

/* 高亮：把命中词用 <span class="kw"> 包裹 */
function hl(str, terms){
  let out = esc(str);
  if(!terms.length) return out;
  // 按词长降序，避免短词先替换破坏长词
  const list = terms.map(x=>x.t).filter(Boolean).sort((a,b)=>b.length-a.length);
  const used = [];
  list.forEach(w=>{
    if(!w) return;
    const safe = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(' + safe + ')', 'gi');
    out = out.replace(re, function(mm){
      // 避免把已有标签内部再包一层
      used.push(w);
      return '<span class="kw">' + mm + '</span>';
    });
  });
  return out;
}

/* 计算命中集合（供搜索与联想共用） */
/* 科目命中：科目名与查询串互含，或查询分词全部出现在科目名中。
   返回 [{name, code, cls, items, sc}] 按相关度降序 */
function subjFind(q){
  const qq = (q||'').replace(/\s+/g,'');
  if(!qq) return [];
  const terms = tokenize(q).map(x=>x.t).filter(t=>t.length>=2);
  const out = [];
  SUBTREE.forEach(g=>g.items.forEach(s=>{
    const n = s.name;
    let sc = 0;
    if(n === qq) sc = 200;                                   // 完全同名
    else if(qq.length>=2 && n.includes(qq)) sc = 130;        // 科目名包含查询串
    else if(n.length>=3 && qq.includes(n)) sc = 110;         // 查询串包含科目名
    else if(terms.length>=2 && terms.every(t=>n.includes(t))) sc = 95; // 分词全含
    if(sc) out.push({name:n, code:s.code, cls:s.cls, items:(s.items||[]), sc:sc});
  }));
  return out.sort((a,b)=> b.sc - a.sc || a.name.localeCompare(b.name,'zh'));
}

function runSearch(q){
  const terms = tokenize(q);
  const sj = subjFind(q);
  // 科目桥梁：命中科目的关联条文获得加权；即使条文自身无词面命中也并入结果
  const boost = {};
  sj.forEach(s=>{ s.items.forEach(i=>{ boost[i] = Math.max(boost[i]||0, Math.round(s.sc*0.35)); }); });
  const hits = [];
  DATA.forEach((r,i)=>{
    const s = scoreRec(r, terms);
    if(s) hits.push({ i: i, score: s.score + (boost[i]||0) });
    else if(boost[i]) hits.push({ i: i, score: boost[i] });   // 经科目带入的关联条文
  });
  hits.sort((a,b)=> b.score - a.score || a.i - b.i);
  return { terms: terms, hits: hits, subj: sj };
}

/* 执行搜索并渲染结果 */
/* 科目命中卡片（搜索结果置顶 & 空结果建议共用） */
function subjCard(s, terms){
  return `<div class="sjhit" onclick="showSubj('${jsq(s.name)}')">
    <span class="nm">${hl(s.name, terms)}</span>
    ${s.code?`<span class="cd">${esc(s.code)}</span>`:''}
    <span class="cl">${esc(s.cls)}类</span>
    <span class="ct">关联 ${s.items.length} 条条文 →</span></div>`;
}
function doSearch(silent){
  const q = (S.q||'').trim();
  const c = document.getElementById('content');
  if(!q){ c.innerHTML = S.mode==='std'?welcome():subjWelcome(); updateMetabar(); renderCrumb(); return; }
  const { terms, hits, subj } = runSearch(q);
  if(!hits.length){
    // 条文零命中但科目命中：给出科目建议而不是死胡同
    if(subj.length){
      c.innerHTML = `<div class="empty">条文中未直接命中「${esc(q)}」，但找到相关会计科目：<br><br></div>` +
        subj.slice(0,6).map(s=>subjCard(s, terms)).join('') +
        `<div class="empty" style="margin-top:10px"><span style="color:var(--sub)">提示：点击科目可查看其关联的准则条文、解释与实施问答。</span></div>`;
    } else {
      c.innerHTML = `<div class="empty">没有找到与「${esc(q)}」相关的条文。<br><br>
        <span style="color:var(--sub)">建议：<br>
        · 减少关键词数量（多个词是「同时包含」的关系）<br>
        · 用双引号锁定精确短语，如 <b>"预期信用损失"</b><br>
        · 改用文号（财会〔2017〕7号）、准则编号（第14号）或科目名（使用权资产）</span></div>`;
    }
    updateMetabar(); renderCrumb(); return;
  }
  if(!silent) pushHist(S.q ? '搜索结果' : (S.focus || '首页'));

  const MAX = 80;
  const shown = hits.slice(0, MAX);
  let html = `<div class="stat">
    <span>共命中 <b>${hits.length}</b> 条${hits.length>MAX?`，按相关度显示前 ${MAX} 条`:''}</span>
    <span class="sorts">相关度优先</span></div>`;
  if(subj.length){
    html += `<div class="sg">相关会计科目（${subj.length}）</div>` +
      subj.slice(0,4).map(s=>subjCard(s, terms)).join('');
  }
  let curDoc = null;
  shown.forEach(h=>{
    const r = DATA[h.i];
    if(r.d !== curDoc){ html += `<div class="sec-h">${esc(r.d)}</div>`; curDoc = r.d; }
    html += card(h.i, false, terms);
  });
  if(hits.length>MAX) html += `<div class="empty">结果较多，仅显示相关度最高的 ${MAX} 条。请增加关键词缩小范围。</div>`;
  c.innerHTML = html;
  c.scrollTop = 0;
  setupObserver();
  updateMetabar();
  renderCrumb();
}

/* ---- 搜索联想下拉 ---- */
function syncSearchUI(){
  const el = document.getElementById('qclr');
  if(el) el.classList.toggle('on', !!document.getElementById('q').value);
}
function closeSug(){
  const b = document.getElementById('sugbox');
  if(b){ b.classList.remove('on'); b.innerHTML=''; }
  _sugIdx = -1;
}
/* 当前键盘选中的建议项下标（-1 表示未选中）；用数组缓存避免 blur 清 DOM 后丢失 */
let _sugItems = [];
function pickSug(i){
  const r = DATA[i];
  if(!r) return;
  pushHist('搜索结果');
  S.mode = 'std'; setModeUIQuiet();
  S.focus = r.g;
  closeSug(); _q.blur();
  showDoc(r.g, i, true);
  hlNav();
}
function buildSug(q){
  const box = document.getElementById('sugbox');
  if(!q || q.length < 1){ closeSug(); return; }
  const { terms, hits, subj } = runSearch(q);
  const sTop = (subj||[]).slice(0, 3);
  if(!hits.length && !sTop.length){ closeSug(); return; }
  const top = hits.slice(0, 12);
  _sugItems = top.map(h=>h.i);            // 缓存：下标 -> DATA 下标
  _sugTerms = terms;
  // 命中类型分组计数
  const kinds = {};
  hits.forEach(h=>{ const k = DATA[h.i].k; kinds[k]=(kinds[k]||0)+1; });
  let html = '';
  // 科目命中置顶：点击直达科目视图
  if(sTop.length){
    html += `<div class="sg-h">会计科目</div>`;
    sTop.forEach(s=>{
      html += `<div class="sg-i sg-subj" data-s="${esc(s.name)}">
        <span class="t">${hl(s.name, terms)}</span>
        <span class="m">${s.code?esc(s.code)+' · ':''}${esc(s.cls)}类 · ${s.items.length}条<span class="tagk">科目</span></span>
      </div>`;
    });
  }
  if(hits.length){
    html += `<div class="sg-h">共 ${hits.length} 条 · ` +
      Object.keys(kinds).map(k=>k+' '+kinds[k]).join(' · ') + '</div>';
  }
  top.forEach(h=>{
    const r = DATA[h.i];
    const label = r.c ? (r.c + ' · ' + r.no) : r.no;
    html += `<div class="sg-i" data-i="${h.i}">
      <span class="t">${hl(label, terms)}</span>
      <span class="m">${esc(shortDoc(r))}<span class="tagk">${esc(r.k)}</span></span>
    </div>`;
  });
  if(hits.length) html += `<div class="sg-i sg-all" data-all="1" style="justify-content:center;color:var(--brand);font-size:12.5px">
    查看全部 ${hits.length} 条结果 →</div>`;
  box.innerHTML = html;
  box.classList.add('on');
  _sugIdx = -1;
}
let _sugTerms = [];
/* 把选中项标出来（同时保留在 _sugItems 中，blur 后仍可回车） */
function sugNav(step){
  const items = [...document.querySelectorAll('#sugbox .sg-i[data-i]')];
  if(!items.length) return;
  _sugIdx = Math.max(0, Math.min(items.length-1, _sugIdx + step));
  items.forEach((el,k)=>el.classList.toggle('cur', k===_sugIdx));
  const cur = items[_sugIdx];
  if(cur) cur.scrollIntoView({block:'nearest'});
}
/* 取当前键盘选中项对应的 DATA 下标；未选中返回 null */
function sugPicked(){
  if(_sugIdx < 0 || _sugIdx >= _sugItems.length) return null;
  return _sugItems[_sugIdx];
}

/* ============ 科目视图 ============ */
function showSubj(name, silent){
  const s = SUBTREE.flatMap(g=>g.items).find(x=>x.name===name);
  const c = document.getElementById('content');
  if(!s){ c.innerHTML = `<div class="empty">未找到科目「${esc(name)}」。</div>`; return; }
  if(!silent) pushHist(S.focus || '首页');
  S.focus = '科目：'+name;
  const idx = s.items || [];
  const zz = idx.filter(i=>DATA[i].k==='准则原文');
  const js = idx.filter(i=>DATA[i].k==='准则解释');
  const wd = idx.filter(i=>DATA[i].k==='实施问答');
  const ca = idx.filter(i=>DATA[i].k==='应用案例');
  const stdSet = new Map();
  idx.forEach(i=>{ const g=DATA[i].g; const wn=(g.match(/第(\d+)号/)||[])[1]; if(wn && DATA[i].k!=='实施问答') stdSet.set(wn,g); });
  const stdChips = [...stdSet.entries()].sort((a,b)=>+a[0]-+b[0])
    .map(([wn,g])=>`<a onclick="jumpStd('${jsq(g)}')" title="${esc(g)}">准则第${wn}号</a>`).join('');
  const sec = (title, arr)=> arr.length ? `<div class="sg">${title}（${arr.length}）</div>` + arr.map(i=>{
      const r = DATA[i];
      return `<div class="sitem"><span class="g">${esc(shortDoc(r))}${r.c?' · '+esc(r.c):''}</span>
        <a onclick="showSubjItem(${i})">${esc(r.no.length>44?r.no.slice(0,44)+'…':r.no)}</a></div>`;
    }).join('') : '';
  c.innerHTML = `<div id="subjview">
    <div class="sh">科目：${esc(name)} ${s.code?`<span style="font-size:13px;color:var(--sub)">（${s.code}）</span>`:''}</div>
    <div class="sc">${esc(s.cls)}类科目 ｜ 共关联 ${idx.length} 条条文</div>
    <div class="subj-hint">
      <b>适用准则：</b>${stdChips || '—'}<br>
      <span style="color:var(--sub)">下列条目可直接点击查看原文；点击后将连续渲染其所在准则/章，可继续滚动浏览。</span>
    </div>
    ${sec('相关准则条文', zz)}
    ${sec('相关准则解释', js)}
    ${sec('相关实施问答', wd)}
    ${sec('相关应用案例', ca)}
    ${idx.length===0?`<div class="empty">本科目在本知识库收录范围内未直接出现。<br>建议通过左侧「按准则查询」核对相关准则及官方原文。</div>`:''}
  </div>`;
  c.scrollTop = 0;
  updateMetabar();
  hlNav();
  renderCrumb();
}
/* 从科目条目跳转到原文：渲染整部文档并滚动定位到该条 */
function showSubjItem(i){
  const r = DATA[i];
  pushHist(S.focus || '首页');
  showDoc(r.g, i, true);
}
function shortDoc(r){ return r.d.replace(/^企业会计准则/, '').replace(/^准则/, ''); }
function jumpStd(group){
  pushHist(S.focus || '首页');
  S.mode='std'; setModeUIQuiet();
  S.focus = group;
  showDoc(group, null, true);
  hlNav();
  // 移动端：确保抽屉收起；随后滚动到顶部
  const sd=document.getElementById('side'), sc=document.getElementById('scrim');
  if(sd) sd.classList.remove('open');
  if(sc) sc.classList.remove('on');
  document.body.style.overflow='';
  const c=document.getElementById('content'); if(c) c.scrollTop=0;
  renderCrumb();
}

/* ============ 滚动联动 ============ */
let _obs = null;
function setupObserver(){
  if(_obs) _obs.disconnect();
  const c = document.getElementById('content');
  _obs = new IntersectionObserver((entries)=>{
    // 取当前最靠上的可见条文
    let best = null;
    entries.forEach(en=>{ if(en.isIntersecting){ if(!best || en.target.offsetTop < best.offsetTop) best = en.target; } });
    if(best){
      const i = best.getAttribute('data-i');
      if(i!=null){ hlCard(+i); updateMetabar(+i); }
    }
  }, { root: c, rootMargin: '-10% 0px -70% 0px', threshold: 0 });
  document.querySelectorAll('#content .card[data-i]').forEach(el=>_obs.observe(el));
  // 滚动进度条
  c.onscroll = ()=>{ updateProgress(); };
}
function hlCard(i){
  document.querySelectorAll('#content .card.act').forEach(x=>x.classList.remove('act'));
  const cur = document.getElementById('r'+i); if(cur) cur.classList.add('act');
  // 侧栏高亮并滚入视野
  if(S.mode==='std'){
    document.querySelectorAll('#nav .aki a').forEach(a=>a.classList.toggle('act', a.dataset.i!=null && +a.dataset.i===i));
    const on = document.querySelector('#nav .aki a.act');
    if(on) scrollNavTo(on);
  }
}
function hlNav(){
  // 展开到当前 focus
  if(S.mode==='std' && S.focus){
    document.querySelectorAll('#nav .kid > .tn').forEach(dt=>{
      const nm = dt.querySelector('.hd span:nth-child(2)');
      if(nm && S.focus.split(' · ').includes(nm.textContent)) dt.classList.remove('col');
    });
  }
  if(S.mode==='subj' && S.focus && S.focus.startsWith('科目：')){
    const n = S.focus.slice(3);
    document.querySelectorAll('#nav .skid a').forEach(a=>a.classList.toggle('act', a.dataset.sname===n));
    const on = document.querySelector('#nav .skid a.act'); if(on) scrollNavTo(on);
  }
}
function scrollNavTo(a){
  const nav = document.getElementById('nav');
  const r = a.getBoundingClientRect(), nr = nav.getBoundingClientRect();
  if(r.top < nr.top+8 || r.bottom > nr.bottom-8){
    nav.scrollTop += (r.top - nr.top) - nav.clientHeight/2 + r.height/2;
  }
}

/* ============ 吸顶元数据条 ============ */
function updateMetabar(i){
  const bar = document.getElementById('metabar');
  if(S.mode==='subj' && !document.querySelector('#content .card')){
    // 科目首页：显示科目信息
    var name = (S.focus||'').replace('科目：','');
    const s = SUBTREE.flatMap(g=>g.items).find(x=>x.name===name);
    if(s){ bar.classList.add('on');
      mb('mb-doc', '科目 '+s.name+(s.code?'（'+s.code+'）':'')); mb('mb-w',''); mb('mb-p',''); mb('mb-e','');
      mb('mb-s', s.cls+'类'); mb('mb-c','关联 '+(s.n||0)+' 条'); 
      const u=document.getElementById('mb-u'); u.textContent=''; u.removeAttribute('href');
    } else bar.classList.remove('on');
    updateProgress(); return;
  }
  if(i==null){
    const first = document.querySelector('#content .card[data-i]');
    if(first) i = +first.getAttribute('data-i'); else { bar.classList.remove('on'); updateProgress(); return; }
  }
  const r = DATA[i];
  bar.classList.add('on');
  mb('mb-doc', r.d);
  mb('mb-w', r.w ? '文号 '+r.w : '');
  mb('mb-p', r.p ? '发布 '+r.p : '');
  mb('mb-e', r.e ? '生效 '+r.e : '');
  mb('mb-s', r.s || '');
  mb('mb-c', r.c || r.k);
  const u=document.getElementById('mb-u');
  if(r.u){ u.textContent='官方原文 ↗'; u.href=r.u; } else { u.textContent=''; u.removeAttribute('href'); }
  updateProgress();
}
function mb(id, t){ const e=document.getElementById(id); if(e){ e.textContent=t; e.style.display = t? '' : 'none'; } }
function updateProgress(){
  const c = document.getElementById('content'), b = document.getElementById('mb-bar');
  if(!b) return;
  const max = c.scrollHeight - c.clientHeight;
  b.style.width = (max>6 ? (c.scrollTop/max*100) : 0) + '%';
  const tt = document.getElementById('toTop');
  if(tt) tt.classList.toggle('on', c.scrollTop > 300);
}

/* ============ 模式 & 主题 ============ */
function setModeUI(){
  document.querySelectorAll('.mode').forEach(m=>m.classList.toggle('on', m.dataset.m===S.mode));
  renderNav();
}
/* 静默同步模式按钮高亮（不重绘目录，供历史恢复使用） */
function setModeUIQuiet(){
  document.querySelectorAll('.mode').forEach(m=>m.classList.toggle('on', m.dataset.m===S.mode));
  renderNav();
}
document.querySelectorAll('.mode').forEach(m=>{
  m.onclick = ()=>{
    if(m.dataset.m === S.mode) return;
    pushHist(S.focus || '首页');
    S.mode=m.dataset.m; S.focus=null; S.q='';
    document.getElementById('q').value=''; syncSearchUI();
    setModeUI();
    document.getElementById('content').innerHTML = S.mode==='std'?welcome():subjWelcome();
    updateMetabar(); renderCrumb();
  };
});
// 主题
function setTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.thbtn').forEach(b=>b.classList.toggle('on', b.dataset.th===t));
  try{ localStorage.setItem('kb-theme', t); }catch(e){}
}
document.querySelectorAll('.thbtn').forEach(b=>{ b.onclick = ()=>setTheme(b.dataset.th); });
try{ const t = localStorage.getItem('kb-theme'); if(t) setTheme(t); }catch(e){}

function welcome(){
  return `<div class="empty" style="padding-top:60px">
    <div style="font-size:17px;font-weight:700;color:var(--ink);margin-bottom:14px">企业会计准则知识库 · 全量版</div>
    <div style="line-height:2.1;text-align:left;display:inline-block">
    <span style="color:var(--sub)">本库整理部分财政部官方发布内容，覆盖范围仍需持续核验，按条文级结构化：</span><br>
    · <b>${STAT.kb} 条</b>准则原文（基本准则 + 第1—42号，含新旧版本）<br>
    · <b>${STAT.js} 条</b>准则解释（第1—20号）<br>
    · <b>${STAT.wd} 条</b>实施问答（24 个分类）<br>
    · <b>${STAT.ca} 条</b>应用案例（财政部官方发布）<br>
    · <b>${STAT.sb} 个</b>会计科目（资产/负债/共同/所有者权益/成本/损益）<br><br>
    <b>按准则查询</b>：点击准则 / 章 / 条，主区将连续渲染该范围全部条文，<b>滚轮向下即可持续阅读</b>，左侧目录会随滚动自动高亮。<br>
    <b>按会计科目查询</b>：切换左上角模式，查看某一科目适用的全部准则、条文、解释与案例，并附财政部官方原文链接。<br>
    <b>顶部元数据条</b>：随浏览内容自动显示文号 / 发布日期 / 生效日期 / 状态，并带阅读进度与「官方原文」链接。<br>
    <b>主题</b>：左上角可切换 浅色 / 羊皮纸 / 护眼绿 / 天蓝 / 黑夜。<br>
    <b>搜索</b>：顶部输入关键词、文号或科目名即可全局检索。</div></div>`;
}
function subjWelcome(){
  return `<div class="empty" style="padding-top:60px">
    <div style="font-size:17px;font-weight:700;color:var(--ink);margin-bottom:14px">按会计科目查询</div>
    <div style="line-height:2.1;text-align:left;display:inline-block">
    从左侧选择科目类别（资产 / 负债 / 共同 / 所有者权益 / 成本 / 损益），<br>
    共 <b>${STAT.sb}</b> 个会计科目，可查询已建立的条文关联；无关联不代表不适用。<br>
    点击具体科目，即可看到该科目涉及的适用准则、条文与官方原文超链接。<br>
    点击条目可跳转到原文并连续滚动浏览。</div></div>`;
}

/* ============ 工具 ============ */
function el(t, cls){ const e=document.createElement(t); if(cls)e.className=cls; return e; }
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function jsq(s){ return (s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

/* ============ 交互 ============ */
/* 正文内准则引用 / 涉及准则标签：统一事件委托跳转 */
document.getElementById('content').addEventListener('click', e=>{
  const a = e.target.closest('a.ref, a.stdref');
  if(a){ e.preventDefault(); const ref = a.getAttribute('data-ref'); if(ref) jumpStd(ref); }
});

/* ---- 搜索框：联想 + 键盘导航 ---- */
const _q = document.getElementById('q');
let _deb = null;
_q.addEventListener('input', e=>{
  S.q = e.target.value.trim();
  syncSearchUI();
  // 输入时只更新联想，不立刻重绘正文（避免闪烁）
  if(_deb) clearTimeout(_deb);
  _deb = setTimeout(()=>{ buildSug(S.q); }, 90);
});
_q.addEventListener('keydown', e=>{
  const box = document.getElementById('sugbox');
  const open = box && box.classList.contains('on');
  if(e.key === 'ArrowDown'){ e.preventDefault(); if(!open) buildSug(S.q); sugNav(1); return; }
  if(e.key === 'ArrowUp'){ e.preventDefault(); if(open) sugNav(-1); return; }
  if(e.key === 'Enter'){
    e.preventDefault();
    const i = sugPicked();               // 优先用键盘选中项（不依赖 DOM 是否已清）
    if(open && i != null){
      pickSug(i);
    } else {
      closeSug(); _q.blur();
      doSearch();          // 回车才正式搜索（带高亮）
    }
    return;
  }
  if(e.key === 'Escape'){ closeSug(); _q.blur(); }
});
_q.addEventListener('focus', ()=>{ if(S.q) buildSug(S.q); });
_q.addEventListener('blur', ()=>{ setTimeout(closeSug, 220); });

/* 联想项点击：科目→科目视图；条文→跳到该条 */
document.getElementById('sugbox').addEventListener('mousedown', e=>{
  const item = e.target.closest('.sg-i');
  if(!item) return;
  e.preventDefault();
  if(item.dataset.s){                       // 会计科目项
    const name = item.dataset.s;
    closeSug(); _q.blur();
    pushHist(S.focus || '首页');
    S.q = name; _q.value = name; syncSearchUI();
    showSubj(name);
    return;
  }
  if(item.dataset.all){
    closeSug(); _q.blur(); doSearch();
    return;
  }
  const i = +item.dataset.i;
  if(!isNaN(i)) pickSug(i);
});
/* 点空白处收起联想 */
document.addEventListener('click', e=>{
  if(!e.target.closest('#searchwrap')) closeSug();
});

document.getElementById('qclr').onclick = ()=>{
  S.q=''; _q.value=''; syncSearchUI(); closeSug();
  S.focus=null;
  document.getElementById('content').innerHTML = S.mode==='std'?welcome():subjWelcome();
  updateMetabar(); renderCrumb(); _q.focus();
};
document.getElementById('toTop').onclick = ()=>{ document.getElementById('content').scrollTop=0; };

/* ============ 更新检查 ============ */
async function loadUpdStatus(){
  const box = document.getElementById('updbody');
  if(!box) return;
  box.innerHTML = `<div style="padding:8px 0;color:var(--sub);font-size:13px">正在读取更新状态…</div>`;
  let up = null;
  try{
    const res = await fetch('update_status.json?t=' + Date.now(), {cache:'no-store'});
    if(res.ok) up = await res.json();
  }catch(err){ up = null; }
  renderUpd(box, up);
}
function renderUpd(box, up){
  const SNAP = '2026-09';
  const ago = (ts)=>{
    if(!ts) return '';
    const d = new Date(ts); if(isNaN(d)) return ts;
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if(days <= 0) return '今天';
    if(days === 1) return '昨天';
    if(days < 30) return days + ' 天前';
    return Math.floor(days/30) + ' 个月前';
  };
  let head = '';
  if(up && up.checked && (up.complete !== true || up.offline || up.err)){
    // 抓取不完整：不谎报"已是最新"
    head = `<div class="upd-hero warn">
      <div class="uh-t">本次检查不完整</div>
      <div class="uh-s">最近检查：${esc(up.checked)}（${ago(up.checked)}）</div>
    </div>`;
  } else if(up && up.checked){
    const hasNew = (up.new_std && up.new_std.length) || (up.new_interp && up.new_interp.length);
    head = `<div class="upd-hero${hasNew?' warn':''}">
      <div class="uh-t">${hasNew ? '发现官方新增内容' : '登记范围内未发现新增'}</div>
      <div class="uh-s">最近检查：${esc(up.checked)}（${ago(up.checked)}）</div>
    </div>`;
  } else {
    head = `<div class="upd-hero">
      <div class="uh-t">更新状态待生成</div>
      <div class="uh-s">自动化检查尚未运行或结果文件不可达</div>
    </div>`;
  }

  // 抓取不完整 / 出错时，给出明确提示
  let alertBox = '';
  if(up && up.err){
    alertBox = `<div class="upd-alert">
      <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M1 21h22L12 2zm12-3h-2v-2h2zm0-4h-2v-4h2z"/></svg>
      <span>${esc(up.err)}</span></div>`;
  }

  let body = `${head}${alertBox}
  <div class="upd-sec">
    <div class="us-h">当前知识库快照</div>
    <div class="us-grid">
      <div><b>${STAT.total}</b><span>收录条目</span></div>
      <div><b>${STAT.kb}</b><span>准则原文</span></div>
      <div><b>${STAT.js}</b><span>准则解释</span></div>
      <div><b>${STAT.wd}</b><span>实施问答</span></div>
      <div><b>${STAT.ca}</b><span>应用案例</span></div>
      <div><b>${STAT.sb}</b><span>会计科目</span></div>
    </div>
    <div class="us-note">基准：准则与解释收录至 <b>${SNAP}</b>。每次官方有新发布，下方同步更新。</div>
  </div>`;

  if(up && up.checked){
    const list = (arr, empty)=>{
      if(!arr || !arr.length) return `<div class="us-empty">${empty}</div>`;
      return `<div class="us-list">` + arr.slice(0,20).map(x=>{
        const title = typeof x === 'string' ? x : (x.title || x.name || '');
        const url = (typeof x === 'object' && x.url) ? x.url : '';
        return url
          ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(title)}<span class="ext">官方 ↗</span></a>`
          : `<span>${esc(title)}</span>`;
      }).join('') + `</div>`;
    };
    body += `<div class="upd-sec">
      <div class="us-h">官方新发布 · 准则 ${ (up.new_std||[]).length } 条</div>
      ${list(up.new_std, '未发现新增准则')}
      <div class="us-h" style="margin-top:14px">官方新发布 · 解释/通知 ${ (up.new_interp||[]).length } 条</div>
      ${list(up.new_interp, '未发现新增解释')}
      ${ (up.notices && up.notices.length) ? `<div class="us-h" style="margin-top:14px">公告与征求意见 ${up.notices.length} 条（信息性）</div>${list(up.notices,'')}` : '' }
    </div>`;
  }

  body += `<div class="upd-sec">
    <div class="us-h">核对方式</div>
    <div class="us-note" style="text-align:left;line-height:1.9">
      状态由 <b>GitHub Actions</b> 定时抓取财政部会计司官网生成（每 12 小时一次），
      结果写入本仓库 <code>update_status.json</code> 并在页面直接读取——<b>无需任何本地环境</b>。<br>
      浏览器因同源策略（CORS）无法直接抓取 <code>kjs.mof.gov.cn</code>，故采用服务端定时抓取 + 静态读取的方案。
    </div>
    <div class="upd-actions">
      <a class="upd-btn primary" href="https://kjs.mof.gov.cn/zt/kjzzss/" target="_blank" rel="noopener">
        前往财政部会计司官网核验 ↗</a>
      <a class="upd-btn" href="https://github.com/pymask/cas-kb/actions" target="_blank" rel="noopener">
        查看抓取任务记录 ↗</a>
      <a class="upd-btn" href="update_status.json" target="_blank" rel="noopener">查看状态数据</a>
      <button class="upd-btn" id="updrefresh">重新读取</button>
    </div>
    <div class="us-note" style="text-align:left;margin-top:10px">
      如发现官方新增内容，可通知我合并入库：抓取正文 → 重建结构化数据 → 重新部署，需核对处理结果。
    </div>
  </div>`;

  box.innerHTML = body;
  const rf = document.getElementById('updrefresh');
  if(rf) rf.onclick = ()=>{ loadUpdStatus(); };
}
document.getElementById('checkupd').onclick = ()=>{
  document.getElementById('updmodal').style.display='flex';
  loadUpdStatus();
};
document.getElementById('updclose').onclick = ()=>document.getElementById('updmodal').style.display='none';
document.getElementById('updmodal').onclick = (e)=>{ if(e.target.id==='updmodal') e.target.style.display='none'; };

/* ============ 移动端抽屉目录 ============ */
const _side = document.getElementById('side');
const _scrim = document.getElementById('scrim');
const _menuBtn = document.getElementById('menuBtn');
function openDrawer(){ _side.classList.add('open'); _scrim.classList.add('on'); document.body.style.overflow='hidden'; }
function closeDrawer(){ _side.classList.remove('open'); _scrim.classList.remove('on'); document.body.style.overflow=''; }
_menuBtn.onclick = ()=>{ _side.classList.contains('open') ? closeDrawer() : openDrawer(); };
_scrim.onclick = closeDrawer;
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeDrawer(); });
// 窄屏下点击目录项后自动收起抽屉（桌面端无影响）
document.getElementById('nav').addEventListener('click', e=>{
  if(!_side.classList.contains('open')) return;
  const a = e.target.closest('a');                  // 条文/科目条目
  const hd = e.target.closest('.hd');               // 准则/章折叠头
  if(a){ setTimeout(closeDrawer, 90); }
  else if(hd){ /* 仅展开折叠，不关闭 */ }
});
// 屏幕变宽时清掉抽屉态，避免残留遮罩
window.addEventListener('resize', ()=>{ if(window.innerWidth>900 && _side.classList.contains('open')) closeDrawer(); });

/* ============ 密码哈希读取（支持自主改密后本地持久化） ============ */
function getPwHash(){
  try{ const h=localStorage.getItem('kb_pw_hash'); if(h) return h; }catch(e){}
  return PW_HASH;
}

/* ============ 数学公式：识别并转为 KaTeX 优雅排版 ============ */
const _CJK = /[一-鿿㐀-䶿]/;
function _wrapTok(t){
  if(!t) return '';
  t = String(t).replace(/%/g,'\\%').replace(/％/g,'\\%');
  if(_CJK.test(t)) return '\\text{'+t+'}';
  return t;
}
const _OPS = new Set(['＝','＋','－','−','×','÷','±','≤','≥','≠','≈','√','∑','=','+','-','*','/','<','>']);
function _isOp(c){ return _OPS.has(c); }
function _isFormula(run){
  if(/[＝÷√∑±≤≥≠≈=<>]/.test(run)) return true;
  /* 纯英文连字符词组（Distance-to-Default）不是公式 */
  if(/^[A-Za-z][A-Za-z0-9\-_.]*$/.test(run) && !/[0-9]/.test(run)) return false;
  return (run.match(/[×＋－+\-*／/]/g)||[]).length >= 2;
}
function _toLatex(run){
  let raw=[], buf='';
  function flush(){ if(buf){ raw.push({t:'tok',v:buf}); buf=''; } }
  for(const ch of run){ if(_isOp(ch)){ flush(); raw.push({t:'op',v:ch}); } else buf+=ch; }
  flush();
  let items=[];
  for(let i=0;i<raw.length;i++){
    const it=raw[i];
    if(it.t==='op' && (it.v==='√'||it.v==='∑')){
      const nx=raw[i+1]; const arg = nx?nx.v:'';
      items.push({t:'raw', v: it.v==='√' ? '\\sqrt{'+_wrapTok(arg)+'}' : '\\sum '+_wrapTok(arg)});
      i++;
    } else items.push(it);
  }
  /* 归一化：补空项，保证「值 运算符 值 … 值」严格交替。
     原实现直接按 items 顺序入列，遇到首/尾或连续运算符时
     terms[k+1] 为 undefined，页面上会显示 "undefined" 字样 */
  let _seq=[], _wantVal=true;
  for(const it of items){
    const _op = (it.t==='op');
    if(_op && _wantVal) _seq.push({t:'tok', v:''});
    if(!_op && !_wantVal) _seq.push({t:'op', v:'×'});
    _seq.push(it);
    _wantVal = _op;
  }
  if(_wantVal) _seq.push({t:'tok', v:''});
  let terms=[], ops=[];
  for(const it of _seq){
    if(it.t==='tok') terms.push(_wrapTok(it.v));
    else if(it.t==='raw') terms.push(it.v);
    else ops.push(it.v);
  }
  let changed=true;
  while(changed){ changed=false;
    for(let k=0;k<ops.length;k++){
      if(ops[k]==='÷'||ops[k]==='/'){
        terms[k]='\\frac{'+terms[k]+'}{'+terms[k+1]+'}';
        terms.splice(k+1,1); ops.splice(k,1); changed=true; break;
      }
    }
  }
  let out=terms[0]||'';
  for(let k=0;k<ops.length;k++){
    const op=ops[k]; let s=op;
    if(op==='×'||op==='*') s='\\times ';
    else if(op==='＝'||op==='=') s='=';
    else if(op==='＋'||op==='+') s='+';
    else if(op==='－'||op==='-'||op==='−') s='-';
    else if(op==='±') s='\\pm ';
    else if(op==='≤') s='\\le ';
    else if(op==='≥') s='\\ge ';
    else if(op==='≠') s='\\ne ';
    else if(op==='≈') s='\\approx ';
    else if(op==='<') s='\\lt ';
    else if(op==='>') s='\\gt ';
    out += s + terms[k+1];
  }
  return out;
}
function formatMath(s){
  if(!s) return s;
  s = s.replace(/(\d)[ ,](\d)/g, '$1$2');
  const re = /[^，。；；、（）()《》「》：“”'"`\s]+/g;
  let out='', last=0, m;
  while((m=re.exec(s))){
    const run=m[0], start=m.index, end=m.index+run.length;
    out += s.slice(last, start);
    if(_isFormula(run)) out += '$'+_toLatex(run)+'$';
    else out += run;
    last=end;
  }
  out += s.slice(last);
  return out;
}
function applyMathToHTML(html){
  if(!html) return html;
  return html.replace(/(<[^>]+>)|([^<]+)/g, function(mm, tag, text){
    return tag ? tag : formatMath(text);
  });
}
function _typeset(root){
  if(!window.renderMathInElement) return;
  try{
    renderMathInElement(root, {
      delimiters:[{left:'$',right:'$',display:false},{left:'$$',right:'$$',display:true}],
      ignoredTags:['script','noscript','style','textarea','pre','code'],
      errorColor:'#c0392b', throwOnError:false
    });
  }catch(e){}
}
window.addEventListener('load', function(){ _typeset(document.getElementById('content')); });
(function(){
  const c=document.getElementById('content'); if(!c) return;
  let _t;
  const mo=new MutationObserver(function(){
    clearTimeout(_t);
    _t=setTimeout(function(){ mo.disconnect(); _typeset(c); mo.observe(c,{childList:true,subtree:true}); }, 60);
  });
  mo.observe(c, {childList:true, subtree:true});
})();

/* ============ 阅读设置：字体 / 字号 ============ */
const _DEF_FONT = '-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';
const _FONT_MAP = {
  'noto-sans':  {css:'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.0/index.css',  fam:"'Noto Sans SC'"},
  'noto-serif': {css:'https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc@5.0.0/index.css', fam:"'Noto Serif SC'"},
  'lxgw':       {css:'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css',       fam:"'LXGW WenKai'"}
};
const _loadedFonts = {};
function _loadFont(key){
  const f=_FONT_MAP[key]; if(!f || _loadedFonts[key]) return;
  const l=document.createElement('link'); l.rel='stylesheet'; l.href=f.css; l.crossOrigin='anonymous';
  document.head.appendChild(l); _loadedFonts[key]=1;
}
function applyFontPref(){
  let fam='default', sz='14';
  try{ fam=localStorage.getItem('kb_font')||'default'; sz=localStorage.getItem('kb_fs')||'14'; }catch(e){}
  const root=document.documentElement;
  root.style.setProperty('--fs', sz+'px');
  if(fam && _FONT_MAP[fam]){ _loadFont(fam); root.style.setProperty('--kb-font', _FONT_MAP[fam].fam+','+_DEF_FONT); }
  else root.style.setProperty('--kb-font', _DEF_FONT);
  const sf=document.getElementById('setFont'); if(sf) sf.value=fam;
  const rg=document.getElementById('setFs'); if(rg){ rg.value=+sz; const v=document.getElementById('setSzVal'); if(v) v.textContent=sz+'px'; }
}
(function setupFontUI(){
  const sb=document.getElementById('setbtn'), pn=document.getElementById('setpanel');
  if(sb&&pn){
    sb.addEventListener('click', function(e){ e.stopPropagation(); pn.style.display = (pn.style.display==='block')?'none':'block'; });
    document.addEventListener('click', function(e){ if(pn.style.display==='block' && !pn.contains(e.target) && e.target!==sb) pn.style.display='none'; });
  }
  const sf=document.getElementById('setFont');
  if(sf) sf.addEventListener('change', function(){ try{localStorage.setItem('kb_font', sf.value);}catch(e){} applyFontPref(); });
  const rg=document.getElementById('setFs');
  if(rg) rg.addEventListener('input', function(){ const v=rg.value; const sv=document.getElementById('setSzVal'); if(sv) sv.textContent=v+'px'; try{localStorage.setItem('kb_fs', v);}catch(e){} document.documentElement.style.setProperty('--fs', v+'px'); });
  const rs=document.getElementById('setReset');
  if(rs) rs.addEventListener('click', function(){ try{localStorage.removeItem('kb_font'); localStorage.removeItem('kb_fs');}catch(e){} applyFontPref(); });
})();
applyFontPref();

/* ============ 浏览统计：IP + 浏览量 + 新增判定 ============ */
/* 设计：本地优先（零网络依赖，保证一定可用）→ 远程增强（真实公网 IP + 全局计数，尽力而为） */
function _localVisitor(){
  let id=localStorage.getItem('kb_vid');
  if(!id){ id='v_'+Math.random().toString(36).slice(2)+Date.now().toString(36); try{localStorage.setItem('kb_vid', id);}catch(e){} }
  return id;
}
function _setStat(total, mine, isNew, online){
  const chip=document.getElementById('statTotal');
  if(chip) chip.textContent = online ? String(total) : ('本机 '+total);
  const c=document.getElementById('statChip');
  if(c){ if(isNew && online) c.classList.add('newip'); else c.classList.remove('newip'); }
  window.__visit = {total:total, mine:mine, isNew:isNew, online:online};
}
function showToast(msg, icon){
  const t=document.getElementById('toast'); if(!t) return;
  const im=t.querySelector('.tlogin'); if(im && icon) im.textContent=icon;
  const m=document.getElementById('toastMsg'); if(m) m.textContent=msg;
  t.classList.add('show');
  clearTimeout(window.__tt); window.__tt=setTimeout(function(){ t.classList.remove('show'); }, 6500);
}
async function _fetchJSON(url, ms){
  try{
    const ctrl=new AbortController();
    const t=setTimeout(function(){ ctrl.abort(); }, ms);
    const r=await fetch(url,{cache:'no-store',signal:ctrl.signal});
    clearTimeout(t);
    if(!r.ok) return null;
    return await r.json();
  }catch(e){ return null; }
}
async function recordVisit(){
  /* ---- 1) 本地统计（同步、零依赖，保证进入即生效）---- */
  _localVisitor();
  let mine=1, total=1, isNewLocal=false;
  try{
    mine=parseInt(localStorage.getItem('kb_mine')||'0',10)+1; localStorage.setItem('kb_mine', mine);
    total=parseInt(localStorage.getItem('kb_total')||'0',10)+1; localStorage.setItem('kb_total', total);
    isNewLocal=(mine===1);
  }catch(e){}
  _setStat(total, mine, false, false);
  showToast((isNewLocal?'🎉 欢迎首次访问本知识库！':'👋 欢迎回来！')+' 您已第 '+mine+' 次浏览本站（本机统计）。', isNewLocal?'🎉':'👋');


}

/* ============ 邮箱验证后自主改密 ============ */
(function setupPwModal(){
  const link=document.getElementById('forgotpw'); if(!link) return;
  const modal=document.getElementById('pwmodal');
  const nx=document.getElementById('pwm-next');
  function close(){
    modal.style.display='none';
    document.getElementById('pwm-set').style.display='none';
    document.getElementById('pwm-email-err').textContent='';
    document.getElementById('pwm-err').textContent='';
    nx.textContent='下一步'; nx.onclick=step1;
  }
  function step1(){
    const email=document.getElementById('pwm-email').value.trim().toLowerCase();
    if(email!=='dliuxiang@qq.com'){ document.getElementById('pwm-email-err').textContent='邮箱校验失败：未授权的邮箱'; return; }
    document.getElementById('pwm-set').style.display='block';
    nx.textContent='保存新密码'; nx.onclick=saveNewPw;
  }
  function saveNewPw(){
    const nw=document.getElementById('pwm-new').value, cf=document.getElementById('pwm-conf').value;
    if(!nw){ document.getElementById('pwm-err').textContent='请输入新密码'; return; }
    if(nw!==cf){ document.getElementById('pwm-err').textContent='两次输入的密码不一致'; return; }
    const h=sha256Hex(nw);
    try{ localStorage.setItem('kb_pw_hash', h); }catch(e){}
    modal.style.display='none';
    const gate=document.getElementById('gate'), app=document.getElementById('app');
    gate.style.display='none'; app.style.visibility='visible';
    try{ sessionStorage.setItem('kb_gate','1'); }catch(e){}
    showToast('✅ 密码已更新，下次请使用新密码进入。','✅');
  }
  link.addEventListener('click', function(){ modal.style.display='flex'; document.getElementById('pwm-email').focus(); });
  document.getElementById('pwm-cancel').addEventListener('click', close);
  nx.onclick=step1;
})();

renderNav();
document.getElementById('content').innerHTML = welcome();
