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

// Content is discoverable through the world as well as the regular archive.
const worldZones = {
  ot: {
    label: "01 / EQUIPMENT — OT",
    title: "Observe & Control",
    description:
      "현장 설비와 제어 시스템을 이해하고, 반복 가능한 공정으로 연결합니다. 로봇·PLC·임베디드 장비가 제 엔지니어링의 출발점입니다.",
    career: "SL Corporation / Production Engineering Center\n2025.07 — PRESENT",
    projects: ["process", "vision", "g90", "embedded", "battery"],
  },
  it: {
    label: "02 / DATA — IT",
    title: "Connect & Structure",
    description:
      "장비의 신호를 소프트웨어와 데이터 시스템으로 연결합니다. 실시간 모니터링, 산업 통신, 웹과 HMI를 통해 현장을 더 잘 이해할 수 있게 만듭니다.",
    career: "Automation Company / Software Developer\n2020.10 — 2023.06",
    projects: ["water", "viewer", "journey", "smartfarm"],
  },
  ai: {
    label: "03 / INTELLIGENCE — AI",
    title: "Interpret & Assist",
    description:
      "공정 지식과 데이터, 엔지니어링 제약을 AI와 결합합니다. 사람의 해석과 변경 검토를 돕는 제조 지능화 시스템을 만들고 있습니다.",
    career: "RESEARCH DIRECTION\nKnowledge-guided manufacturing AI",
    projects: ["plc-ai", "local-llm"],
  },
};
let worldAvailable = false;
const worldCard = document.querySelector("#world-card");
function showWorldZone(id) {
  const zone = worldZones[id];
  if (!zone) return;
  document.querySelector("#world-card-label").textContent = zone.label;
  document.querySelector("#world-card-title").textContent = zone.title;
  document.querySelector("#world-card-description").textContent =
    zone.description;
  document.querySelector("#world-card-career").textContent = zone.career;
  document.querySelector("#world-card-projects").innerHTML = zone.projects
    .map((id) => {
      const p = projects.find((p) => p.id === id);
      return `<button type="button" data-world-project="${id}">${escapeHTML(p.title)} <span aria-hidden="true">↗</span></button>`;
    })
    .join("");
  document
    .querySelector("#world-card-projects")
    .insertAdjacentHTML(
      "beforeend",
      '<div class="zone-library-links"><button type="button" data-open-library="projects">전체 프로젝트 ↗</button><button type="button" data-open-library="experience">경력·학력 ↗</button><button type="button" data-open-library="identity">소개 ↗</button><button type="button" data-open-library="contact">연락처 ↗</button></div>',
    );
  worldCard.hidden = false;
  document.querySelector("#world-status").textContent =
    `${zone.title}. ${zone.description}`;
}
function closeWorldCard() {
  worldCard.hidden = true;
  document.querySelector("#identity-canvas").focus({ preventScroll: true });
}
document
  .querySelector("#world-card-close")
  .addEventListener("click", closeWorldCard);
worldCard.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    closeWorldCard();
  }
});
worldCard.addEventListener("click", (event) => {
  const b = event.target.closest("[data-world-project]");
  if (b) openProject(b.dataset.worldProject);
});
window.addEventListener("world-ready", () => {
  worldAvailable = true;
});
window.addEventListener("world-zone", (event) => {
  const { id, visited } = event.detail;
  showWorldZone(id);
  document.querySelector("#world-progress").textContent =
    `${visited.length} / 3`;
  document
    .querySelectorAll("[data-objective]")
    .forEach((el) =>
      el.classList.toggle("connected", visited.includes(el.dataset.objective)),
    );
  document
    .querySelectorAll("[data-destination]")
    .forEach((el) =>
      el.classList.toggle("visited", visited.includes(el.dataset.destination)),
    );
  document
    .querySelector(".hero-world")
    .classList.toggle("world-complete", visited.length === 3);
  document.querySelector(".world-quest strong").textContent =
    visited.length === 3
      ? "Equipment → Data → Intelligence 연결 완료"
      : "세 시스템을 하나로 연결하기";
});
window.addEventListener("identity-layer", (event) => {
  worldCard.hidden = true;
  if (!worldAvailable) showWorldZone(event.detail);
});
document
  .querySelectorAll("[data-destination]")
  .forEach((b) =>
    b.addEventListener("click", () =>
      document.querySelector(`[data-layer="${b.dataset.destination}"]`).click(),
    ),
  );
document.querySelector("#world-reset").addEventListener("click", () => {
  worldCard.hidden = true;
  document.querySelector("#world-progress").textContent = "0 / 3";
  document
    .querySelectorAll(".connected,.visited")
    .forEach((el) => el.classList.remove("connected", "visited"));
  document.querySelector(".hero-world").classList.remove("world-complete");
  document.querySelector(".world-quest strong").textContent =
    "세 시스템을 하나로 연결하기";
  document.querySelector("#world-status").textContent =
    "탐험을 처음부터 시작합니다.";
  window.dispatchEvent(new Event("world-reset"));
});
window.addEventListener("identity-scene-unavailable", () => {
  worldAvailable = false;
  document.querySelector(".world-quest").hidden = true;
  document.querySelector("#world-controls").textContent =
    "아래 구역 버튼으로 기술과 프로젝트를 탐색하세요.";
});

// The world is the main page; all portfolio sections live in its terminal.
const library = document.querySelector("#library-dialog");
let libraryReturnFocus = null;
function selectLibrarySection(id) {
  if (!["identity", "projects", "experience", "contact"].includes(id)) return;
  library
    .querySelectorAll(".library-body > section,.library-body > footer")
    .forEach((section) => (section.hidden = section.id !== id));
  library
    .querySelectorAll("[data-library]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.library === id)),
    );
  library.querySelector(".library-body").scrollTop = 0;
}
function openLibrary(id = "identity") {
  selectLibrarySection(id);
  if (!library.open) {
    libraryReturnFocus = document.activeElement;
    library.showModal();
  }
  library.querySelector(`[data-library="${id}"]`).focus();
  window.dispatchEvent(new Event("world-overlay-open"));
}
library.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-library]");
  if (tab) selectLibrarySection(tab.dataset.library);
  if (event.target.closest("[data-return-world]")) library.close();
});
document
  .querySelector("#library-close")
  .addEventListener("click", () => library.close());
library.addEventListener("close", () => {
  if (libraryReturnFocus?.isConnected)
    libraryReturnFocus.focus({ preventScroll: true });
  else
    document.querySelector("#identity-canvas").focus({ preventScroll: true });
  window.dispatchEvent(new Event("world-overlay-close"));
});
window.addEventListener("world-library", () => openLibrary());
document.querySelector("#world-terminal").addEventListener("click", () => {
  if (worldAvailable)
    window.dispatchEvent(
      new CustomEvent("identity-layer", { detail: "terminal" }),
    );
  else openLibrary();
});
document
  .querySelector("#terminal-marker")
  .addEventListener("click", () =>
    document.querySelector("#world-terminal").click(),
  );
worldCard.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-library]");
  if (button) openLibrary(button.dataset.openLibrary);
});
// Legacy section URLs also open the requested terminal page.
function followSectionHash() {
  const id = location.hash.slice(1);
  if (["identity", "projects", "experience", "contact"].includes(id))
    openLibrary(id);
}
window.addEventListener("hashchange", followSectionHash);
followSectionHash();
