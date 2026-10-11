const projects = window.portfolioProjects || [];
// The employment/education periods are source-backed; project dates are not inferred.
const eras = [
  {id:'sl', title:'SL Corporation', period:'2025.07 — PRESENT', projects:['plc-ai','local-llm','g90','vision','process']},
  {id:'automation', title:'Industrial Automation Company', period:'2020–2023 / CONTRACT 2024', projects:['water','embedded','viewer']},
  {id:'undergraduate', title:'University Years', period:'2018.03 — 2025.02', projects:['battery','journey','smartfarm']}
];
const stops = eras.flatMap(era=>era.projects.map(id=>({...projects.find(p=>p.id===id),era:era.id,eraTitle:era.title,period:era.period}))).map((p,index)=>({...p,index}));
window.factoryStops = stops;
const portfolio=document.querySelector('#portfolio');
const dialog=document.querySelector('#project-dialog');
const content=document.querySelector('#dialog-content');
const card=document.querySelector('#station-card');
const slider=document.querySelector('#road-progress');
const markerContainer=document.querySelector('#overview-markers');
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let mode='road',progress=0,active=0,ready=false,returnFocus=null;
// The renderer supplies exact arc-length positions after constructing the road.
let positions=stops.map((_,i)=>i/(stops.length-1));
window.factoryState={mode,progress};
function openProject(id){
  const p=stops.find(p=>p.id===id);if(!p)return;
  returnFocus=document.activeElement;
  document.querySelector('#dialog-index').textContent=`PROJECT / ${String(p.index+1).padStart(2,'0')}`;
  content.innerHTML=`<p class="eyebrow">${escapeHTML(p.label)}</p><h2 id="dialog-title">${escapeHTML(p.title)}</h2><p class="dialog-summary">${escapeHTML(p.summary)}</p><div class="system-flow" aria-label="System architecture">${p.flow.map((label,i)=>`<div><small>0${i+1}</small><span>${escapeHTML(label)}</span></div>`).join('')}</div><p class="project-description">${escapeHTML(p.details)}</p><dl>${p.projectPeriod?`<div><dt>PROJECT PERIOD</dt><dd>${escapeHTML(p.projectPeriod)}${p.context?` · ${escapeHTML(p.context)}`:''}</dd></div>`:''}<div><dt>MY ROLE</dt><dd>${escapeHTML(p.role)}</dd></div><div><dt>TOOLS & TECHNOLOGIES</dt><dd>${p.stack.map(escapeHTML).join(' / ')}</dd></div>${p.status?`<div><dt>STATUS</dt><dd>${escapeHTML(p.status)}</dd></div>`:''}</dl><div class="project-links">${(p.links||[]).map(l=>`<a href="${escapeHTML(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(l.label)} →</a>`).join('')}</div>`;
  dialog.showModal();dialog.scrollTop=0;dialog.querySelector('.dialog-close').focus();
  window.dispatchEvent(new Event('factory-overlay'));
}
dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{returnFocus?.focus({preventScroll:true});window.dispatchEvent(new Event('factory-resume'));});
document.querySelector('#project-list').innerHTML=eras.map(era=>`<section class="career-projects" aria-label="${escapeHTML(era.title)}"><header class="era-heading"><h3>${escapeHTML(era.title)}</h3><span>${escapeHTML(era.period)}</span></header>${stops.filter(p=>p.era===era.id).map(p=>`<article class="project-row"><button class="project-name" data-project="${p.id}"><span class="list-number">${String(p.index+1).padStart(2,'0')}</span><h3>${escapeHTML(p.title)}</h3><span class="list-category">${escapeHTML(p.projectPeriod||p.category)}</span></button><button class="locate-project" data-stop="${p.index}" aria-label="Visit ${escapeHTML(p.title)} on the road"><span>On the road</span> →</button></article>`).join('')}</section>`).join('');
markerContainer.innerHTML=stops.map(p=>`<button class="map-marker" data-stop="${p.index}" aria-label="Visit ${escapeHTML(p.title)}"><span>${String(p.index+1).padStart(2,'0')}</span><strong>${escapeHTML(p.title)}</strong></button>`).join('');
document.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>openProject(b.dataset.project)));
function setMode(next,updateHash=true){
  if(!['road','overview','list','about'].includes(next))return;
  mode=next;portfolio.dataset.mode=mode;window.factoryState.mode=mode;
  document.querySelectorAll('.mode-nav [data-mode]').forEach(b=>{if(b.dataset.mode===mode)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  document.querySelector('#list-panel').hidden=mode!=='list';
  document.querySelector('#about-panel').hidden=mode!=='about';
  markerContainer.hidden=mode!=='overview'||!ready;
  card.hidden=mode!=='road';
  document.querySelector('.road-scrubber').hidden=mode!=='road';
  document.querySelector('#motion-toggle').hidden=!ready||!['road','overview'].includes(mode);
  document.querySelector('#interaction-hint').innerHTML=mode==='road'?'Scroll back through time <span>↓</span>':mode==='overview'?'Select a station to explore':'Eonsang Son / Selected work';
  document.body.classList.toggle('content-mode',mode==='list'||mode==='about');
  if(updateHash)history.replaceState(null,'','#'+mode);
  window.dispatchEvent(new CustomEvent('factory-mode',{detail:mode}));
}
function setProgress(value){
  progress=Math.max(0,Math.min(1,value));window.factoryState.progress=progress;
  slider.value=Math.round(progress*1000);
  const next=positions.reduce((best,p,i)=>Math.abs(p-progress)<Math.abs(positions[best]-progress)?i:best,0);
  active=next;
  const p=stops[active];
  card.dataset.project=p.id;
  document.querySelector('#station-number').textContent=String(active+1).padStart(2,'0');
  document.querySelector('#station-category').textContent=p.eraTitle;
  document.querySelector('#station-period').textContent=p.projectPeriod||p.period;
  document.querySelector('#station-title').textContent=p.title;
  document.querySelector('#road-position').textContent=`${String(active+1).padStart(2,'0')} / 11`;
  slider.setAttribute('aria-valuetext',`${Math.round(progress*100)}%, near ${p.title}`);
  window.dispatchEvent(new CustomEvent('factory-progress',{detail:progress}));
}
function visit(index){
  setProgress(positions[index]);
  window.dispatchEvent(new CustomEvent('factory-jump',{detail:positions[index]}));
  setMode('road');
  document.querySelector('#station-open').focus({preventScroll:true});
  document.querySelector('#road-status').textContent=`Station ${index+1}: ${stops[index].title}`;
}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
document.querySelectorAll('[data-stop]').forEach(b=>b.addEventListener('click',()=>visit(+b.dataset.stop)));
document.querySelector('#station-open').addEventListener('click',()=>openProject(stops[active].id));
document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();setMode('list');document.querySelector('#project-list').focus();});
slider.addEventListener('input',()=>setProgress(+slider.value/1000));
window.addEventListener('wheel',e=>{
  if(mode!=='road'||dialog.open||e.ctrlKey)return;
  e.preventDefault();
  // Continuous travel: no threshold, snap, chapter lock, or automatic cruise.
  const unit=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;
  setProgress(progress+e.deltaY*unit/13500);
},{passive:false});
window.addEventListener('keydown',e=>{
  if(dialog.open||e.ctrlKey||e.metaKey||e.altKey||e.target===slider)return;
  if(e.key==='Escape'&&mode!=='road'){setMode('road');document.querySelector('.mode-nav [data-mode="road"]').focus();return;}
  if(mode!=='road')return;
  const delta={ArrowDown:.012,ArrowRight:.012,ArrowUp:-.012,ArrowLeft:-.012,PageDown:.07,PageUp:-.07}[e.key];
  if(delta!==undefined||['Home','End'].includes(e.key)){e.preventDefault();setProgress(e.key==='Home'?0:e.key==='End'?1:progress+delta);}
  if(e.key==='Enter'&&e.target===document.body)openProject(stops[active].id);
});
const stage=document.querySelector('#scene-viewport');let drag=null;
stage.addEventListener('pointerdown',e=>{if(e.button!==0||!['road','overview'].includes(mode))return;drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:0};stage.setPointerCapture(e.pointerId);stage.classList.add('dragging');});
stage.addEventListener('pointermove',e=>{
  if(!drag||mode!=='road')return;
  const dx=drag.lastX-e.clientX,dy=drag.lastY-e.clientY;
  drag.moved+=Math.abs(dx)+Math.abs(dy);drag.lastX=e.clientX;drag.lastY=e.clientY;
  if(drag.moved>5)setProgress(progress+(Math.abs(dy)>=Math.abs(dx)?dy:dx)/Math.max(4500,innerHeight*7));
});
stage.addEventListener('pointerup',e=>{
  if(!drag)return;
  const distance=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);
  if(distance<7&&drag.moved<10)window.dispatchEvent(new CustomEvent('factory-pick',{detail:{x:e.clientX,y:e.clientY}}));
  drag=null;stage.classList.remove('dragging');if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
});
stage.addEventListener('pointercancel',()=>{drag=null;stage.classList.remove('dragging');});
window.addEventListener('factory-ready',e=>{ready=true;positions=e.detail.positions;setProgress(progress);setMode(mode,false);});
window.addEventListener('factory-visit',e=>visit(e.detail));
window.addEventListener('factory-open',e=>{document.querySelector('#station-open').focus();openProject(e.detail);});
window.addEventListener('factory-unavailable',()=>{
  ready=false;stage.classList.remove('webgl-ready');stage.classList.add('scene-unavailable');
  document.querySelector('.scene-loading').hidden=true;document.querySelector('.scene-fallback').hidden=false;
  markerContainer.hidden=true;document.querySelector('#motion-toggle').hidden=true;
  if(mode==='overview')setMode('list');
});
function followHash(){const id=location.hash.slice(1);setMode(['projects','list'].includes(id)?'list':['identity','experience','contact','about'].includes(id)?'about':id==='overview'?'overview':'road',false);}
window.addEventListener('hashchange',followHash);followHash();setProgress(0);
setTimeout(()=>{if(!ready)window.dispatchEvent(new Event('factory-unavailable'));},15000);
