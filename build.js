/*
 * 십이지 도형 퍼즐(벡터) — 십장생플러스 브랜드 빌드
 * puzzle-source.html(벡터 엔진) + svg/*.svg(동물 아트워크) + supabase-config.json
 *   → index.html
 * 새 동물 SVG는 svg/<key>.svg 로 넣고 SVG_MAP 에 등록 후 `node build.js` 재실행.
 */
const fs = require("fs");
const path = require("path");
const DIR = __dirname;

const SRC = path.join(DIR, "puzzle-source.html");
const OUT = path.join(DIR, "index.html");
const CFG_PATH = path.join(DIR, "supabase-config.json");

const IG_URL = "https://www.instagram.com/tenlongevityplus/";
const IG_HANDLE = "tenlongevityplus";

// 동물 key → SVG 파일. (viewBox·도형은 SVG에서 자동 추출)
const SVG_MAP = {
  rooster: "rooster.svg",
  pig: "pig.svg",
  dog: "dog.svg",
};

// ---- SVG 파서: <path>/<circle>/<polygon>/<polyline>/<rect> → 엔진 shapes ----
function ptsToPath(pts, close) {
  const pairs = pts.trim().split(/\s+/).filter(Boolean);
  let d = "";
  pairs.forEach((p, i) => { d += (i === 0 ? "M" : "L") + p + " "; });
  return d.trim() + (close ? " Z" : "");
}
function parseSvg(svg) {
  const vb = svg.match(/viewBox="([\d.\s-]+)"/);
  const nums = vb[1].trim().split(/\s+/).map(Number);
  const W = nums[2], H = nums[3];
  // class → fill 매핑 (fill:none 포함)
  const styleBlock = (svg.match(/<style[^>]*>([\s\S]*?)<\/style>/) || [])[1] || "";
  const classFill = {};
  styleBlock.replace(/\.([\w-]+)\s*\{([^}]*)\}/g, (m, cls, body) => {
    const fm = body.match(/fill\s*:\s*([^;}]+)/);
    classFill[cls] = fm ? fm[1].trim() : null;
    return "";
  });
  function resolveFill(attrs) {
    const inline = (attrs.match(/fill="([^"]*)"/) || [])[1];
    if (inline) return inline;
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1];
    if (cls) for (const c of cls.split(/\s+/)) if (classFill[c] !== undefined) return classFill[c];
    return "#000000"; // SVG 기본 채움
  }
  const shapes = [];
  const re = /<(path|circle|polygon|polyline|rect)\b([^>]*?)\/?>/g;
  let m;
  while ((m = re.exec(svg))) {
    const tag = m[1], a = m[2];
    const fill = resolveFill(a);
    if (!fill || fill === "none") continue; // 장식용 stroke 도형 제외
    if (tag === "path") {
      const d = (a.match(/\bd="([^"]*)"/) || [])[1];
      if (d) shapes.push({ t: "path", d, fill });
    } else if (tag === "circle") {
      const cx = +(a.match(/\bcx="([^"]*)"/) || [])[1];
      const cy = +(a.match(/\bcy="([^"]*)"/) || [])[1];
      const r = +(a.match(/\br="([^"]*)"/) || [])[1];
      if (r) shapes.push({ t: "circle", cx, cy, r, fill });
    } else if (tag === "polygon" || tag === "polyline") {
      const pts = (a.match(/points="([^"]*)"/) || [])[1];
      if (pts) shapes.push({ t: "path", d: ptsToPath(pts, true), fill });
    } else if (tag === "rect") {
      const x = +((a.match(/\bx="([^"]*)"/) || [])[1] || 0);
      const y = +((a.match(/\by="([^"]*)"/) || [])[1] || 0);
      const w = +(a.match(/\bwidth="([^"]*)"/) || [])[1];
      const h = +(a.match(/\bheight="([^"]*)"/) || [])[1];
      if (w && h) shapes.push({ t: "path", d: `M${x},${y} H${x + w} V${y + h} H${x} Z`, fill });
    }
  }
  return { W, H, shapes };
}

// ---- 동물 데이터 주입 ----
let html = fs.readFileSync(SRC, "utf8");

const SHAPES = {};
Object.keys(SVG_MAP).forEach((key) => {
  const svg = fs.readFileSync(path.join(DIR, SVG_MAP[key]), "utf8");
  SHAPES[key] = parseSvg(svg);
  console.log(`  ${key}: ${SHAPES[key].shapes.length} shapes (viewBox ${SHAPES[key].W}x${SHAPES[key].H})`);
});

const arrStart = html.indexOf("const ANIMALS=[") + "const ANIMALS=".length;
const arrEnd = html.indexOf("]", arrStart); // shapes 제거된 소스라 최초 ']' = 배열 끝
const animals = JSON.parse(html.slice(arrStart, arrEnd + 1));
animals.forEach((a) => {
  if (SHAPES[a.key]) { a.W = SHAPES[a.key].W; a.H = SHAPES[a.key].H; a.shapes = SHAPES[a.key].shapes; }
});
html = html.slice(0, arrStart) + JSON.stringify(animals) + html.slice(arrEnd + 1);

// ---- 브랜드 / 인스타 / Supabase 주입 ----
let sbUrl = "", sbKey = "";
if (fs.existsSync(CFG_PATH)) {
  try { const c = JSON.parse(fs.readFileSync(CFG_PATH, "utf8")); sbUrl = c.url || ""; sbKey = c.anonKey || ""; }
  catch (e) { console.warn("supabase-config.json 파싱 실패:", e.message); }
}

const IG_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.86s0 3.6-.07 4.86c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.86.07s-3.6 0-4.86-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.26-.07-1.61-.07-4.86s.01-3.6.07-4.86c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5.01-4.74.07-.9.04-1.38.19-1.7.32-.43.16-.74.36-1.06.68-.32.32-.52.63-.68 1.06-.13.32-.28.8-.32 1.7C3.2 8.5 3.2 8.85 3.2 12s.01 3.5.07 4.74c.04.9.19 1.38.32 1.7.16.43.36.74.68 1.06.32.32.63.52 1.06.68.32.13.8.28 1.7.32 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c.9-.04 1.38-.19 1.7-.32.43-.16.74-.36 1.06-.68.32-.32.52-.63.68-1.06.13-.32.28-.8.32-1.7.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.04-.9-.19-1.38-.32-1.7a2.85 2.85 0 0 0-.68-1.06 2.85 2.85 0 0 0-1.06-.68c-.32-.13-.8-.28-1.7-.32C15.5 4.01 15.15 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 16.94 4.94 4.94 0 0 1 12 7.06Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.14-2.1a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"/></svg>';

const BRAND_CSS = `
<style id="sjs-brand">
:root{--sjs-blue:#004098;--sjs-gardenia:#F8DE05;--sjs-ivory:#F4EEDD;}
.sjs-brandbar{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--sjs-blue);color:var(--sjs-ivory);border-radius:14px;padding:11px 16px;margin-bottom:16px;flex-wrap:wrap}
.sjs-brandbar .bb-brand{display:flex;align-items:center;gap:9px}
.sjs-brandbar .bb-plus{color:var(--sjs-gardenia);display:inline-flex}
.sjs-brandbar .bb-name{display:flex;flex-direction:column;line-height:1.16}
.sjs-brandbar .bb-name strong{font-size:16px;font-family:var(--f-display,serif);letter-spacing:-.01em}
.sjs-brandbar .bb-name em{font-style:normal;font-size:11px;opacity:.82}
.sjs-brandbar .bb-count{text-align:right;line-height:1.15}
.sjs-brandbar .bb-count b{font-size:20px;color:var(--sjs-gardenia);font-variant-numeric:tabular-nums}
.sjs-brandbar .bb-count em{font-style:normal;display:block;font-size:10.5px;opacity:.82}
.sjs-followband{display:flex;align-items:center;justify-content:space-between;gap:14px;background:var(--sjs-blue);color:var(--sjs-ivory);border-radius:14px;padding:18px 22px;max-width:1120px;margin:22px auto 40px;flex-wrap:wrap}
.sjs-followband .fb-t strong{font-size:16px;font-family:var(--f-display,serif)}
.sjs-followband .fb-t p{margin:5px 0 0;font-size:12.5px;opacity:.85;max-width:54ch;line-height:1.6}
.sjs-ig{display:inline-flex;align-items:center;gap:8px;background:var(--sjs-gardenia);color:var(--sjs-blue);font-weight:700;padding:11px 18px;border-radius:999px;text-decoration:none;white-space:nowrap;border:0;cursor:pointer;font-size:14px;transition:transform .12s,box-shadow .12s}
.sjs-ig:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(248,222,5,.4)}
.wincard .sjs-ig{width:100%;justify-content:center;margin:2px 0 12px}
#sjsFree{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
#sjsFree .sjs-sw{display:inline-block;width:15px;height:15px;border-radius:4px;border:1px solid rgba(35,24,21,.15)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .sjs-brandbar,:root:not([data-theme="light"]) .sjs-followband{background:#06285c}}
:root[data-theme="dark"] .sjs-brandbar,:root[data-theme="dark"] .sjs-followband{background:#06285c}
:root[data-theme="light"] .sjs-brandbar,:root[data-theme="light"] .sjs-followband{background:var(--sjs-blue)}
@media(max-width:520px){.sjs-followband{flex-direction:column;text-align:center;align-items:stretch}.sjs-ig{justify-content:center}}
</style>`;

const BRANDBAR = `
  <div class="sjs-brandbar">
    <div class="bb-brand">
      <span class="bb-plus"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8z"/></svg></span>
      <span class="bb-name"><strong>십장생플러스</strong><em>십이지 · 오방색 도형 퍼즐</em></span>
    </div>
    <div class="bb-count"><b id="sjsPlayCount">–</b><em id="sjsPlayNote">개 완성됨</em></div>
  </div>`;

const WIN_IG = `  <a class="sjs-ig" href="${IG_URL}" target="_blank" rel="noopener">${IG_SVG}@${IG_HANDLE} 팔로우하고 이야기 더 보기</a>\n`;

const FOLLOWBAND = `<div class="sjs-followband">
  <div class="fb-t">
    <strong>십장생의 이야기가 계속됩니다</strong>
    <p>해·산·물·돌·구름·소나무·불로초·거북·학·사슴 — 십장생플러스가 전하는 열 가지 전통 상징 이야기를 인스타그램에서 만나보세요.</p>
  </div>
  <a class="sjs-ig" href="${IG_URL}" target="_blank" rel="noopener">${IG_SVG}@${IG_HANDLE} 팔로우</a>
</div>
`;

const INIT = `
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
(function(){
  var SB_URL=${JSON.stringify(sbUrl)}, SB_KEY=${JSON.stringify(sbKey)};
  var sb=null;
  if(SB_URL&&SB_KEY&&window.supabase){try{sb=window.supabase.createClient(SB_URL,SB_KEY);}catch(e){console.warn('supabase init',e);}}
  var LS='sjs_play_count';
  function lget(){try{return parseInt(localStorage.getItem(LS)||'0',10)||0;}catch(e){return 0;}}
  function lbump(){var n=lget()+1;try{localStorage.setItem(LS,String(n));}catch(e){}return n;}
  function fmt(n){try{return Number(n).toLocaleString('ko-KR');}catch(e){return n;}}
  function setCount(n){var el=document.getElementById('sjsPlayCount');if(el)el.textContent=fmt(n);}
  function note(t){var el=document.getElementById('sjsPlayNote');if(el)el.textContent=t;}
  function curAnimal(){try{return ANIMALS[idx].animal;}catch(e){return '';}}
  function curDiff(){try{return diff;}catch(e){return '';}}
  async function getCount(){
    if(sb){try{var r=await sb.rpc('get_play_count');if(!r.error)return Number(r.data)||0;}catch(e){}}
    return lget();
  }
  async function record(){
    if(sb){try{var r=await sb.rpc('record_play',{p_animal:curAnimal(),p_difficulty:curDiff()});if(!r.error)return Number(r.data)||0;}catch(e){}}
    return lbump();
  }
  if(!sb) note('개 완성됨 · 로컬 집계');
  getCount().then(setCount);
  if(typeof win==='function'){
    var _win=win;
    win=function(){ try{_win.apply(this,arguments);}catch(e){}
      record().then(setCount).catch(function(){}); };
  }
  // 도감 표기: 각 동물의 자유색(그림에 쓰인 색) 스와치 노출 — 주색(오방색)은 위 칩
  if(typeof renderMeta==='function'){
    var _rm=renderMeta;
    renderMeta=function(){ try{_rm.apply(this,arguments);}catch(e){}
      try{
        var z=ANIMALS[idx], el=document.getElementById('sjsFree');
        if(el&&z&&z.shapes){
          var seen={}, h='';
          z.shapes.forEach(function(s){ var f=(s.fill||'').toLowerCase();
            if(f&&f!=='none'&&!seen[f]){ seen[f]=1; h+='<i class="sjs-sw" title="'+s.fill+'" style="background:'+s.fill+'"></i>'; } });
          el.innerHTML=h||'<span style="color:var(--ink-faint)">—</span>';
        }
      }catch(e){}
    };
    try{ renderMeta(); }catch(e){}
  }
})();
</script>
`;

function must(anchor) { if (html.indexOf(anchor) === -1) throw new Error("앵커 없음: " + anchor.slice(0, 50)); }

const FONTS = 'family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700&display=swap">';
must(FONTS); html = html.replace(FONTS, FONTS + BRAND_CSS);
must('<div class="wrap">'); html = html.replace('<div class="wrap">', '<div class="wrap">' + BRANDBAR);
const WINROW = '  <div class="row">\n    <button class="btn" id="winAgain" type="button">다시 만들기</button>';
must(WINROW); html = html.replace(WINROW, WIN_IG + WINROW);
must('<div class="win" id="win">'); html = html.replace('<div class="win" id="win">', FOLLOWBAND + '\n<div class="win" id="win">');
must('</body></html>'); html = html.replace('</body></html>', INIT + '</body></html>');

fs.writeFileSync(OUT, html, "utf8");
console.log("index.html 생성 완료 (" + (html.length / 1024).toFixed(0) + " KB) · supabase=" + (sbUrl ? "설정됨" : "로컬폴백"));
