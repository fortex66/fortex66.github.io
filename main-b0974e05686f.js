const projects = window.portfolioProjects || [];
const archive = document.querySelector("#project-archive");
const dialog = document.querySelector("#project-dialog");
const content = document.querySelector("#dialog-content");
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const flowMarkup = (flow) =>
  `<div class="system-flow">${flow.map((label, i) => `<span><small class="mono">0${i + 1}</small>${escapeHTML(label)}</span>`).join("")}</div>`;
let previousFocus;
function openProject(id) {
  const project = projects.find((p) => p.id === id);
  if (!project) return;
  previousFocus = document.activeElement;
  content.innerHTML = `<p class="eyebrow">${escapeHTML(project.label)}</p><h2 id="dialog-title">${escapeHTML(project.title)}</h2><p class="dialog-summary">${escapeHTML(project.summary)}</p>${flowMarkup(project.flow)}<p class="project-detail">${escapeHTML(project.details)}</p><dl class="project-facts"><div><dt>ROLE</dt><dd>${escapeHTML(project.role)}</dd></div><div><dt>TOOLS</dt><dd>${project.stack.map(escapeHTML).join(" · ")}</dd></div>${project.status ? `<div><dt>STATUS</dt><dd>${escapeHTML(project.status)}</dd></div>` : ""}</dl><div class="dialog-links">${(project.links || []).map((link) => `<a class="button button-dark" href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.label)} →</a>`).join("")}</div>`;
  dialog.showModal();
  window.dispatchEvent(new Event("world-overlay-open"));
  document.body.classList.add("dialog-open");
  dialog.querySelector(".dialog-close").focus();
}
function renderArchive(filter = "all") {
  const visible = projects.filter(
    (p) => filter === "all" || p.category === filter,
  );
  archive.innerHTML = visible
    .map(
      (p) =>
        `<button class="archive-item" type="button" data-project="${p.id}"><span class="archive-number mono">${String(projects.indexOf(p) + 1).padStart(2, "0")}</span><span class="archive-main"><strong>${escapeHTML(p.title)}</strong><span>${escapeHTML(p.summary)}</span></span><span class="archive-category mono">${escapeHTML(p.category.toUpperCase())}</span><span class="archive-arrow" aria-hidden="true">→</span></button>`,
    )
    .join("");
  document.querySelector("#filter-status").textContent =
    `${visible.length} projects shown`;
}
renderArchive();
document.querySelector("#project-count").textContent = `/ ${projects.length}`;
document.querySelector("#projects").addEventListener("click", (event) => {
  const button = event.target.closest("[data-project]");
  if (button) openProject(button.dataset.project);
});
document.querySelectorAll("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    renderArchive(button.dataset.filter);
  }),
);
dialog
  .querySelector(".dialog-close")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (
    event.target === dialog &&
    (event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom)
  )
    dialog.close();
});
dialog.addEventListener("close", () => {
  content.querySelectorAll("img").forEach((img) => img.removeAttribute("src"));
  document.body.classList.remove("dialog-open");
  previousFocus?.focus();
  window.dispatchEvent(new Event("world-overlay-close"));
});
// Accessible project archive, independent of the 3D renderer.
const library = document.querySelector('#library-dialog');
let libraryReturnFocus = null;
function selectLibrarySection(id) {
  if (!['identity', 'projects', 'experience', 'contact'].includes(id)) return;
  library.querySelectorAll('.library-body > section,.library-body > footer').forEach(section => section.hidden = section.id !== id);
  library.querySelectorAll('[data-library]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.library === id)));
  library.querySelector('.library-body').scrollTop = 0;
}
function openLibrary(id = 'projects') {
  selectLibrarySection(id);
  if (!library.open) { libraryReturnFocus = document.activeElement; library.showModal(); }
  library.querySelector(`[data-library="${id}"]`).focus();
  window.dispatchEvent(new Event('world-overlay-open'));
}
document.querySelectorAll('[data-open-library]').forEach(button => button.addEventListener('click', () => {
  openLibrary(button.dataset.openLibrary);
  if (button.dataset.openLibrary === 'projects') document.querySelector(`[data-filter="${button.dataset.category || 'all'}"]`).click();
}));
library.addEventListener('click', event => {
  const tab = event.target.closest('[data-library]');
  if (tab) selectLibrarySection(tab.dataset.library);
  if (event.target.closest('[data-return-world]')) library.close();
});
document.querySelector('#library-close').addEventListener('click', () => library.close());
library.addEventListener('close', () => {
  libraryReturnFocus?.focus({preventScroll:true});
  window.dispatchEvent(new Event('world-overlay-close'));
});
function followSectionHash() {
  const id = location.hash.slice(1);
  if (['identity','projects','experience','contact'].includes(id)) openLibrary(id);
}
window.addEventListener('hashchange', followSectionHash);
followSectionHash();

// One navigation model for wheel, touch, keyboard, the map, and 3D picking.
const chapters = [
  {kicker:'01 — INTRODUCTION', title:'Software.<br>With a real-world instinct.', summary:'I’m Eonsang. I develop software for machines, people, and the space between.', action:'Meet the engineer', section:'identity', date:'CURRENTLY AT', note:'SL Corporation', detail:'Production Engineering Center', category:'A PERSONAL PORTFOLIO', caption:'A story in seven scenes.'},
  {kicker:'02 — EXPERIENCE & EDUCATION', title:'Built on<br>the factory floor.', summary:'From Computer Science to industrial software. Now bringing that experience to manufacturing.', action:'Explore my experience', section:'experience', date:'2025.07 — PRESENT', note:'SL Corporation', detail:'Production Engineering Center', category:'THE PATH SO FAR', caption:'Three chapters. One continuous practice.'},
  {kicker:'03 — PLC AI STUDIO', title:'Make complex<br>logic understandable.', summary:'An AI workspace for PLC program analysis, deterministic checks, and human review.', action:'Explore the project', project:'plc-ai', date:'IN DEVELOPMENT', note:'PLC AI Studio', detail:'Python / PLC / Local LLM', category:'APPLIED AI FOR ENGINEERING', caption:'Illustrative program model · Engineers remain in control.'},
  {kicker:'04 — WATER TREATMENT SCADA', title:'The whole plant.<br>One clear view.', summary:'Live equipment data, alarms, and control, brought together in a web application.', action:'Explore the project', project:'water', date:'COLLABORATIVE PROJECT', note:'Water Treatment SCADA', detail:'React / Node.js / Modbus TCP', category:'INDUSTRIAL SOFTWARE, MADE VISIBLE', caption:'System architecture · Built with seonghyeon0312.'},
  {kicker:'05 — AUTOMATION & CONTROL', title:'Close to<br>the machine.', summary:'Embedded controllers, robotic integration, and production programs. Software tested against the physical world.', action:'Explore industrial work', section:'projects', filter:'industrial', date:'FIELD EXPERIENCE', note:'G90 · GV90 Programs', detail:'Equipment integration / Process engineering', category:'FROM CODE TO PRODUCTION', caption:'Industrial Embedded Controllers · Software architecture.'},
  {kicker:'06 — SELECTED PROJECTS', title:'Curiosity.<br>Put into practice.', summary:'Battery control, collaborative web apps, and local AI. Different problems, the same drive to build.', action:'View all 11 projects', section:'projects', date:'SELECTED WORK', note:'Beyond one discipline', detail:'Energy / Web / Industrial AI', category:'AN EXPANDING PRACTICE', caption:'Select a floating project to open its story.'},
  {kicker:'07 — CONTACT', title:'Good things start<br>with a conversation.', summary:'For conversations about software, automation, and the next idea worth building.', action:'Get in touch', section:'contact', date:'FIND ME ONLINE', note:'fortex66', detail:'GitHub / Tech blog / Email', category:'THE NEXT CHAPTER', caption:'Eonsang Son — Software engineer.'},
];
let chapterIndex = 0, overviewOpen = false;
const exhibit = document.querySelector('.exhibit');
const overview = document.querySelector('#overview');
const overviewToggle = document.querySelector('#overview-toggle');
const chapterAction = document.querySelector('#chapter-action');
function setOverview(open) {
  overviewOpen = open;
  overview.hidden = !open;
  exhibit.classList.toggle('is-overview', open);
  overviewToggle.setAttribute('aria-expanded', String(open));
  // Avoid hidden chapter actions remaining in keyboard navigation.
  document.querySelector('#chapter-copy').inert = open;
  window.dispatchEvent(new CustomEvent('portfolio-overview', {detail:open}));
  if (open) document.querySelector('#overview-close').focus();
  else overviewToggle.focus();
}
function navigateTo(index) {
  index = Math.max(0, Math.min(chapters.length-1, index));
  chapterIndex = index;
  if (overviewOpen) setOverview(false);
  const c = chapters[index];
  exhibit.dataset.chapter = index;
  document.querySelector('#chapter-kicker').textContent = c.kicker;
  document.querySelector('#chapter-title').innerHTML = c.title;
  document.querySelector('#chapter-summary').textContent = c.summary;
  chapterAction.innerHTML = `${c.action} <span>→</span>`;
  for (const [id,value] of [['chapter-date',c.date],['chapter-note-title',c.note],['chapter-note-detail',c.detail],['scene-category',c.category],['scene-caption',c.caption]]) document.getElementById(id).textContent = value;
  document.querySelectorAll('.chapter-dots button').forEach(b=>{
    if (+b.dataset.chapter === index) b.setAttribute('aria-current','step');
    else b.removeAttribute('aria-current');
  });
  document.querySelector('#previous-chapter').disabled = index === 0;
  document.querySelector('#next-chapter').disabled = index === chapters.length-1;
  document.querySelector('#chapter-status').textContent = `${c.kicker}: ${c.title.replace('<br>',' ')}`;
  window.dispatchEvent(new CustomEvent('portfolio-chapter', {detail:index}));
}
document.querySelectorAll('[data-chapter]').forEach(b=>{
  if (b.tagName === 'BUTTON') b.addEventListener('click',()=>navigateTo(+b.dataset.chapter));
});
chapterAction.addEventListener('click',()=>{
  const c=chapters[chapterIndex];
  if(c.project)openProject(c.project);
  else {openLibrary(c.section);if(c.section==='projects')document.querySelector(`[data-filter="${c.filter||'all'}"]`).click();}
});
document.querySelector('#previous-chapter').addEventListener('click',()=>navigateTo(chapterIndex-1));
document.querySelector('#next-chapter').addEventListener('click',()=>navigateTo(chapterIndex+1));
overviewToggle.addEventListener('click',()=>setOverview(!overviewOpen));
document.querySelector('#overview-close').addEventListener('click',()=>setOverview(false));
let wheelTotal=0,lastWheel=0;
window.addEventListener('wheel',e=>{
  if(document.querySelector('dialog[open]')||overviewOpen||e.ctrlKey)return;
  e.preventDefault();
  if(performance.now()-lastWheel<850)return;
  wheelTotal+=e.deltaY;
  if(Math.abs(wheelTotal)>45){navigateTo(chapterIndex+Math.sign(wheelTotal));wheelTotal=0;lastWheel=performance.now();}
},{passive:false});
window.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]'))return;
  if(e.key==='Escape'&&overviewOpen){setOverview(false);return;}
  if(overviewOpen||e.altKey||e.metaKey||e.ctrlKey)return;
  if(['ArrowRight','ArrowDown','PageDown','ArrowLeft','ArrowUp','PageUp','Home','End'].includes(e.key)){
    e.preventDefault();
    navigateTo(e.key==='Home'?0:e.key==='End'?6:chapterIndex+(['ArrowRight','ArrowDown','PageDown'].includes(e.key)?1:-1));
  }
});
const stage=document.querySelector('#scene-viewport');
let drag=null;
stage.addEventListener('pointerdown',e=>{if(e.button===0){drag={x:e.clientX,y:e.clientY,id:e.pointerId};stage.setPointerCapture(e.pointerId);stage.classList.add('is-dragging');}});
stage.addEventListener('pointerup',e=>{
  if(!drag)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  stage.classList.remove('is-dragging');
  if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
  if(Math.max(Math.abs(dx),Math.abs(dy))>45){
    if(!overviewOpen)navigateTo(chapterIndex+(Math.abs(dx)>Math.abs(dy)?-Math.sign(dx):-Math.sign(dy)));
  } else window.dispatchEvent(new CustomEvent('portfolio-pick',{detail:{x:e.clientX,y:e.clientY}}));
  drag=null;
});
stage.addEventListener('pointercancel',()=>{drag=null;stage.classList.remove('is-dragging');});
window.addEventListener('portfolio-project',e=>{chapterAction.focus();if(e.detail==='experience')openLibrary('experience');else openProject(e.detail);});
window.addEventListener('portfolio-select',e=>navigateTo(e.detail));
window.addEventListener('identity-scene-unavailable',()=>{
  stage.classList.add('scene-unavailable');stage.classList.remove('webgl-ready');
  document.querySelector('.scene-loading').hidden=true;
  document.querySelector('.scene-fallback').hidden=false;
  document.querySelector('#motion-toggle').hidden=true;
  document.querySelector('.explore-hint span:last-child').innerHTML='Explore the chapters<small>3D unavailable · All content is accessible.</small>';
});
setTimeout(()=>{if(!stage.classList.contains('webgl-ready'))window.dispatchEvent(new Event('identity-scene-unavailable'));},20000);
navigateTo(0);
