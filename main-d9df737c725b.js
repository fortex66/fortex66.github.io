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
});
const captions = {
  ot: "설비와 제어 시스템을 이해하고, 현장에서 동작하는 소프트웨어를 만듭니다.",
  it: "장비의 신호를 연결하고 구조화해, 모니터링과 데이터 시스템으로 확장합니다.",
  ai: "공정 지식과 AI를 결합해, 엔지니어의 해석과 의사결정을 지원합니다.",
};
document.querySelectorAll("[data-layer]").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll("[data-layer]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    document.querySelector("#scene-caption").textContent =
      captions[button.dataset.layer];
    window.dispatchEvent(
      new CustomEvent("identity-layer", { detail: button.dataset.layer }),
    );
  }),
);
// The readable SVG remains available if a browser cannot run the 3D scene.
window.addEventListener("identity-scene-unavailable", () => {
  const motion = document.querySelector("#motion-toggle");
  motion.hidden = true;
  document.querySelector(".scene-footnote span").textContent =
    "EQUIPMENT → DATA → INTELLIGENCE";
});
