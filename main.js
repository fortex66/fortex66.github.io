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
  content.innerHTML = `<p class="eyebrow">${escapeHTML(project.label)}</p><h2 id="dialog-title">${escapeHTML(project.title)}</h2><p class="dialog-summary">${escapeHTML(project.summary)}</p>${flowMarkup(project.flow)}<p class="project-detail">${escapeHTML(project.details)}</p><dl class="project-facts"><div><dt>ROLE</dt><dd>${escapeHTML(project.role)}</dd></div><div><dt>TOOLS</dt><dd>${project.stack.map(escapeHTML).join(" · ")}</dd></div>${project.status ? `<div><dt>STATUS</dt><dd>${escapeHTML(project.status)}</dd></div>` : ""}</dl><div class="dialog-links">${(project.links || []).map((link) => `<a class="button button-dark" href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.label)} ↗</a>`).join("")}</div>${project.demo ? '<div class="demo-area"><button type="button" class="demo-button text-link">기존 프로젝트 데모 보기 ↓</button><p class="demo-note">실제 프로젝트 기록 · 애니메이션 이미지가 로드됩니다.</p></div>' : ""}`;
  if (project.demo) {
    content.querySelector(".demo-button").addEventListener(
      "click",
      (event) => {
        const image = document.createElement("img");
        image.src = project.demo;
        image.alt = `${project.title} 프로젝트 실행 화면`;
        image.className = "project-demo";
        event.currentTarget.replaceWith(image);
      },
      { once: true },
    );
  }
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
        `<button class="archive-item" type="button" data-project="${p.id}"><span class="archive-number mono">${String(projects.indexOf(p) + 1).padStart(2, "0")}</span><span class="archive-main"><strong>${escapeHTML(p.title)}</strong><span>${escapeHTML(p.summary)}</span></span><span class="archive-category mono">${escapeHTML(p.category.toUpperCase())}</span><span class="archive-arrow" aria-hidden="true">↗</span></button>`,
    )
    .join("");
  document.querySelector("#filter-status").textContent =
    `${visible.length}개 프로젝트 표시`;
}
document.querySelector("#featured-projects").innerHTML = projects
  .filter((p) => p.featured)
  .map(
    (p, i) =>
      `<button type="button" class="featured-project ${i === 0 ? "featured-ai" : "featured-water"}" data-project="${p.id}"><div class="featured-art" aria-hidden="true"><span class="art-label mono">${i === 0 ? "ANALYZE / STRUCTURE / REVIEW" : "OBSERVE / CONNECT / CONTROL"}</span><div class="art-diagram">${i === 0 ? '<div class="diagram-window"><span>PLC AI STUDIO</span><div class="ladder"><i></i><i></i><i></i></div></div><div class="art-cube">AI</div>' : '<div class="water-pipe"></div><div class="water-tank"><span></span></div><div class="water-metric"><small>LIVE DATA</small><svg viewBox="0 0 160 60"><path d="M0 48L25 42L45 50L70 20L92 30L110 8L132 22L160 12"/></svg></div>'}</div><span class="art-caption mono">${i === 0 ? "AI + RULES → HUMAN REVIEW" : "PLC → SERVER → WEB"}</span></div><div class="featured-copy"><span class="eyebrow">${escapeHTML(p.label)}</span><h3>${escapeHTML(p.title)} <span aria-hidden="true">↗</span></h3><p>${escapeHTML(p.summary)}</p><div class="tag-list">${p.stack
        .slice(0, 3)
        .map((t) => `<span>${escapeHTML(t)}</span>`)
        .join("")}</div></div></button>`,
  )
  .join("");
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
let activeScene = 'overview';
function updateChapter() {
  const chapters = [...document.querySelectorAll('[data-scene]')];
  const target = chapters.reduce((best, chapter) => Math.abs(chapter.getBoundingClientRect().top) < Math.abs(best.getBoundingClientRect().top) ? chapter : best);
  if (target.dataset.scene === activeScene) return;
  activeScene = target.dataset.scene;
  document.querySelectorAll('[data-view]').forEach(link => link.setAttribute('aria-current', String(link.dataset.view === activeScene)));
  window.dispatchEvent(new CustomEvent('showcase-view', {detail:activeScene}));
}
window.addEventListener('scroll', updateChapter, {passive:true});
window.addEventListener('resize', updateChapter);
window.addEventListener('showcase-ready', updateChapter);
window.addEventListener('identity-scene-unavailable', () => {
  document.querySelector('.scene-loading strong').textContent = '설비 → 소프트웨어 → AI';
  document.querySelector('.scene-loading > span:last-child').textContent = '3D를 지원하지 않는 환경입니다. 프로젝트 메뉴에서 작업을 살펴보세요.';
  document.querySelector('.loading-orbit').hidden = true;
  document.querySelector('#motion-toggle').hidden = true;
});
setTimeout(() => {
  if (!document.querySelector('.webgl-ready')) window.dispatchEvent(new Event('identity-scene-unavailable'));
}, 30000);
