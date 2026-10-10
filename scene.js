import * as THREE from "./vendor/three.module.min.js";

const container = document.querySelector("#scene-viewport");
const canvas = document.querySelector("#identity-canvas");
const motionButton = document.querySelector("#motion-toggle");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
} catch {
  window.dispatchEvent(new Event("identity-scene-unavailable"));
}
if (renderer) initializeScene();

function initializeScene() {
  let highQuality = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6, 6, 3.5, -3.5, 0.1, 100);
  camera.position.set(9, 8, 13);
  camera.lookAt(0, 1, 0);
  scene.add(new THREE.HemisphereLight(0xd5f2ed, 0x142631, 3));
  const key = new THREE.DirectionalLight(0xffe1c7, 4);
  key.position.set(-3, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {
    left: -9,
    right: 9,
    top: 9,
    bottom: -9,
    near: 0.5,
    far: 30,
  });
  key.shadow.normalBias = 0.035;
  key.shadow.bias = -0.0002;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa3c8ff, 3);
  rim.position.set(6, 5, -4);
  scene.add(rim);
  const root = new THREE.Group();
  scene.add(root);
  const colors = { ot: 0xe2ac78, it: 0x83cdb9, ai: 0xb6a1e7 };
  const mat = (color, metalness = 0.3, roughness = 0.42) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const dark = mat(0x21363b, 0.6);
  const highlightedPad = mat(0x36564e, 0.6);
  const bronze = mat(colors.ot, 0.5);
  const mint = mat(0x4b978b, 0.5);
  const metal = mat(0xc2d1d2, 0.7);
  const glow = (color) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      roughness: 0.4,
    });
  function box(parent, w, h, d, material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(parent, r, h, material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, 48),
      material,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function edge(mesh, color, opacity = 1) {
    const lines = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
    mesh.add(lines);
    return lines;
  }
  function segment(parent, a, b, r, material) {
    const delta = b.clone().sub(a);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, delta.length(), 24),
      material,
    );
    mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const pads = {};
  const positions = {
    ot: new THREE.Vector3(-3.25, 0, 0.75),
    it: new THREE.Vector3(0, 0.3, 0),
    ai: new THREE.Vector3(3.25, 0.6, -0.75),
  };
  Object.entries(positions).forEach(([id, pos]) => {
    const group = new THREE.Group();
    group.position.copy(pos);
    root.add(group);
    const pad = box(group, 2.65, 0.19, 2.35, dark);
    edge(pad, colors[id], 0.75);
    box(group, 2.53, 0.035, 2.23, mat(0x2c4449, 0.6), 0, 0.12, 0);
    // Etched lines on the upper surface establish scale and perspective.
    for (let n = -2; n <= 2; n++) {
      box(group, 0.012, 0.01, 2.1, mat(0x36515a), n * 0.43, 0.145, 0);
      box(group, 2.35, 0.01, 0.012, mat(0x36515a), 0, 0.145, n * 0.38);
    }
    pads[id] = group;
  });
  pads.ot.children[0].material = highlightedPad;
  const robot = new THREE.Group();
  pads.ot.add(robot);
  cylinder(robot, 0.36, 0.26, bronze, 0, 0.29, 0);
  cylinder(robot, 0.23, 0.48, bronze, 0, 0.65, 0);
  cylinder(robot, 0.25, 0.1, metal, 0, 0.88, 0);
  const robotArm = new THREE.Group();
  robotArm.name = "robotArm";
  robotArm.position.y = 0.91;
  robot.add(robotArm);
  const joint = (x, y, z, r = 0.19) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), bronze);
    mesh.position.set(x, y, z);
    robotArm.add(mesh);
    const bolt = cylinder(robotArm, r * 0.56, 0.07, metal, x, y, z + 0.15);
    bolt.rotation.x = Math.PI / 2;
  };
  const p0 = new THREE.Vector3(0, 0, 0),
    p1 = new THREE.Vector3(-0.42, 0.95, 0),
    p2 = new THREE.Vector3(0.42, 1.58, 0),
    p3 = new THREE.Vector3(1.05, 1.2, 0);
  segment(robotArm, p0, p1, 0.13, bronze);
  segment(robotArm, p1, p2, 0.11, bronze);
  segment(robotArm, p2, p3, 0.085, metal);
  joint(0, 0, 0);
  joint(-0.42, 0.95, 0);
  joint(0.42, 1.58, 0, 0.17);
  box(robotArm, 0.16, 0.3, 0.34, metal, 1.06, 1.05, 0);
  box(robotArm, 0.06, 0.29, 0.08, metal, 1.12, 0.85, -0.15);
  box(robotArm, 0.06, 0.29, 0.08, metal, 1.12, 0.85, 0.15);
  const workpiece = box(
    pads.ot,
    0.24,
    0.22,
    0.24,
    glow(colors.it),
    1,
    0.29,
    0.35,
  );
  edge(workpiece, 0xd3f5df);
  // Rack and a tilted data display.
  const server = new THREE.Group();
  pads.it.add(server);
  const rack = box(server, 0.9, 1.9, 0.72, mat(0x315763, 0.6), -0.25, 1.15, 0);
  edge(rack, 0x69a39f, 0.6);
  for (let i = 0; i < 4; i++) {
    const y = 0.55 + i * 0.4;
    box(server, 0.76, 0.23, 0.035, dark, -0.25, y, 0.38);
    box(server, 0.45, 0.018, 0.025, metal, -0.32, y, 0.405);
    box(server, 0.06, 0.04, 0.03, glow(colors.it), 0.04, y, 0.415);
  }
  const display = new THREE.Group();
  display.position.set(0.72, 0.87, 0.45);
  display.rotation.y = -0.25;
  server.add(display);
  const monitor = box(display, 0.82, 0.89, 0.065, mat(0x122e31));
  edge(monitor, colors.it);
  const graphPoints = [
    [-0.32, -0.25],
    [-0.2, -0.14],
    [-0.1, -0.18],
    [0.01, 0.13],
    [0.12, 0.01],
    [0.26, 0.29],
  ].map(([x, y]) => new THREE.Vector3(x, y, 0.043));
  display.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(graphPoints),
      new THREE.LineBasicMaterial({ color: 0xb6f0d6 }),
    ),
  );
  // Transparent AI core with a wireframe lattice of connected nodes.
  const ai = new THREE.Group();
  ai.name = "aiCore";
  ai.position.y = 1.35;
  pads.ai.add(ai);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0x9585c4,
    metalness: 0.15,
    roughness: 0.2,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const core = box(ai, 1.12, 1.12, 1.12, coreMat);
  edge(core, 0xcfb8ff, 0.9);
  const nodes = [
    new THREE.Vector3(0, 0.36, 0),
    new THREE.Vector3(-0.34, 0.08, 0.22),
    new THREE.Vector3(0.3, 0.08, 0.24),
    new THREE.Vector3(0.25, -0.23, -0.25),
    new THREE.Vector3(-0.27, -0.22, -0.23),
    new THREE.Vector3(0, -0.36, 0.15),
  ];
  nodes.forEach((p, i) => {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 12, 8),
      glow(0xd8c6ff),
    );
    dot.position.copy(p);
    ai.add(dot);
    [1, 2].forEach((offset) =>
      segment(ai, p, nodes[(i + offset) % nodes.length], 0.008, glow(0xa9a0e6)),
    );
  });
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.008, 8, 70),
    glow(0x8c7ab7),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.2;
  pads.ai.add(halo);
  // Reuse the identity models as movable factory modules.
  Object.values(pads).forEach((p) => {
    p.visible = false;
    p.position.set(0, 0, 0);
  });
  const deck = box(root, 14, 0.32, 10, mat(0x162c2c, 0.4), 0, -0.32, 0);
  deck.castShadow = false;
  edge(deck, 0x517c6c, 0.9);
  const grid = new THREE.GridHelper(14, 28, 0x496d5c, 0x29463f);
  grid.position.y = -0.15;
  grid.scale.z = 10 / 14;
  root.add(grid);
  const names = { ot: "로봇 셀", it: "관제 시스템", ai: "AI 스튜디오" };
  const descriptions = {
    ot: "OT / 현장 제어",
    it: "IT / 소프트웨어",
    ai: "AI / 엔지니어링 지식",
  };
  const fresh = () => ({
    nodes: [
      { id: 1, type: "ot", x: -3.5, z: 0, r: 0 },
      { id: 2, type: "it", x: 0, z: 0, r: 0 },
      { id: 3, type: "ai", x: 3.5, z: 0, r: 0 },
    ],
    links: [],
    next: 4,
  });
  let state = fresh(),
    selected = null,
    mode = "move",
    source = null,
    running = false,
    produced = 0,
    cycle = 0,
    speed = 1;
  let paused = reducedMotion.matches,
    yaw = 0.6,
    zoom = 1,
    time = 0,
    raf = 0,
    previous = 0,
    toastTimer;
  const history = [],
    objects = new Map(),
    connections = [],
    labels = document.querySelector("#factory-labels");
  const $ = (s) => document.querySelector(s);
  const node = (id) => state.nodes.find((n) => n.id === id);
  const isOverlay = () => !!document.querySelector("dialog[open]");
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2(),
    hit = new THREE.Vector3();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.12);
  const selectionRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.025, 8, 70),
    glow(0xf5d59c),
  );
  selectionRing.rotation.x = -Math.PI / 2;
  selectionRing.visible = false;
  root.add(selectionRing);
  const preview = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 2.5),
    new THREE.MeshBasicMaterial({
      color: 0xb0e4d2,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
  );
  preview.rotation.x = -Math.PI / 2;
  preview.visible = false;
  root.add(preview);
  function announce(message) {
    clearTimeout(toastTimer);
    $("#factory-toast").textContent = message;
    $("#factory-toast").classList.add("visible");
    toastTimer = setTimeout(
      () => $("#factory-toast").classList.remove("visible"),
      3500,
    );
  }
  function checkpoint() {
    history.push(JSON.stringify(state));
    if (history.length > 30) history.shift();
    running = false;
    cycle = 0;
  }
  function completeLines() {
    return state.nodes.filter(
      (n) =>
        n.type === "ot" &&
        state.links.some(
          ([a, b]) =>
            a === n.id &&
            state.links.some(([c, d]) => c === b && node(d)?.type === "ai"),
        ),
    ).length;
  }
  function validSpot(x, z, id) {
    return (
      Math.abs(x) <= 5.5 &&
      Math.abs(z) <= 3.5 &&
      !state.nodes.some(
        (n) => n.id !== id && Math.hypot(n.x - x, n.z - z) < 2.6,
      )
    );
  }
  function refreshUI() {
    const chosen = node(selected),
      complete = completeLines();
    container.classList.toggle("is-running", running);
    $("#factory-run").disabled = complete === 0;
    $("#factory-run").textContent = running ? "Ⅱ 가동 멈추기" : "▶ 공장 가동";
    $("#factory-run").setAttribute("aria-pressed", String(running));
    $("#factory-undo").disabled = history.length === 0;
    $("#factory-lines").innerHTML = `${complete}<small>개</small>`;
    $("#factory-output").innerHTML = `${produced}<small>개</small>`;
    $("#factory-state").textContent = running
      ? "FACTORY RUNNING"
      : mode === "connect"
        ? "CONNECT MODE"
        : "BUILD MODE";
    $("#step-place").classList.toggle("done", state.nodes.length > 0);
    $("#step-link").classList.toggle("done", complete > 0);
    $("#step-run").classList.toggle("done", running);
    $("#move-mode").setAttribute("aria-pressed", String(mode === "move"));
    $("#connect-mode").setAttribute("aria-pressed", String(mode === "connect"));
    $("#factory-selection").hidden = !chosen;
    $("#factory-hint").textContent = running
      ? "로봇의 작업이 데이터로, 데이터가 AI로 이어집니다."
      : source
        ? `${names[node(source).type]}에서 연결할 다음 장치를 선택하세요.`
        : mode === "connect"
          ? "로봇 → 관제 → AI 순서로 두 장치씩 선택하세요."
          : chosen
            ? `${names[chosen.type]} 선택됨 · 바닥을 클릭해 이동하세요. 방향키로도 옮길 수 있습니다.`
            : "설비를 추가하고 자유롭게 배치하세요. 연결하면 공장을 가동할 수 있습니다.";
    if (chosen) {
      $("#selection-kind").textContent = descriptions[chosen.type];
      $("#selection-name").textContent = `${names[chosen.type]} ${chosen.id}`;
      selectionRing.position.set(chosen.x, -0.1, chosen.z);
    }
    selectionRing.visible = !!chosen;
    document
      .querySelectorAll("[data-node]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(Number(b.dataset.node) === selected),
        ),
      );
  }
  function rebuild() {
    objects.forEach((o) => root.remove(o));
    objects.clear();
    connections.forEach((c) => {
      root.remove(c.group);
      c.group.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) o.material.dispose();
      });
    });
    connections.length = 0;
    labels.replaceChildren();
    state.nodes.forEach((n) => {
      const object = pads[n.type].clone(true);
      object.visible = true;
      object.position.set(n.x, 0, n.z);
      object.rotation.y = n.r;
      object.scale.setScalar(0.85);
      root.add(object);
      objects.set(n.id, object);
      const label = document.createElement("button");
      label.type = "button";
      label.dataset.node = n.id;
      label.innerHTML = `<span>${names[n.type]}</span><small>${n.type.toUpperCase()} / ${String(n.id).padStart(2, "0")}</small>`;
      label.setAttribute("aria-label", `${names[n.type]} ${n.id} 선택`);
      labels.append(label);
    });
    state.links.forEach(([a, b]) => {
      const start = node(a),
        end = node(b),
        group = new THREE.Group();
      root.add(group);
      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(start.x, 0.2, start.z + 0.8),
        new THREE.Vector3(start.x, 0.25, start.z + 1.35),
        new THREE.Vector3(end.x, 0.25, end.z + 1.35),
        new THREE.Vector3(end.x, 0.2, end.z + 0.8),
      ]);
      group.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(path, 48, 0.035, 6, false),
          glow(colors[start.type]),
        ),
      );
      const packets = [];
      for (let i = 0; i < 3; i++) {
        const dot = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.14, 0.14),
          glow(0xffe2a8),
        );
        group.add(dot);
        packets.push(dot);
      }
      connections.push({ group, path, packets });
    });
    refreshUI();
    pose();
    render();
    wake();
  }
  function select(id) {
    if (!node(id)) return;
    preview.visible = false;
    if (mode === "connect") {
      if (!source) {
        source = id;
        selected = id;
      } else {
        const a = node(source),
          b = node(id);
        if (source === id) source = null;
        else if (!(
          (a.type === "ot" && b.type === "it") ||
          (a.type === "it" && b.type === "ai")
        ))
          announce("로봇 → 관제 또는 관제 → AI 순서로 연결하세요.");
        else if (state.links.some(([x, y]) => x === source && y === id))
          announce("이미 연결된 장치입니다.");
        else {
          checkpoint();
          state.links.push([source, id]);
          source = null;
          selected = id;
          rebuild();
          announce(
            completeLines()
              ? "생산 라인 완성! 공장을 가동해 보세요."
              : "연결 완료 · 다음 장치를 이어 보세요.",
          );
        }
      }
    } else {
      selected = id;
      source = null;
    }
    refreshUI();
    render();
  }
  function moveNode(x, z) {
    if (!node(selected)) return;
    x = Math.round(x * 2) / 2;
    z = Math.round(z * 2) / 2;
    if (!validSpot(x, z, selected)) {
      announce("바닥 안의 빈 공간에 배치해 주세요.");
      return;
    }
    if (node(selected).x === x && node(selected).z === z) return;
    checkpoint();
    Object.assign(node(selected), { x, z });
    rebuild();
  }
  function add(type) {
    if (state.nodes.length >= 8) {
      announce("이 공장에는 최대 8개 장치를 배치할 수 있습니다.");
      return;
    }
    let spot;
    for (const z of [0, 3, -3])
      for (const x of [0, -3.5, 3.5])
        if (!spot && validSpot(x, z)) spot = { x, z };
    if (!spot) {
      announce("빈 공간이 부족합니다. 장치를 옮기거나 삭제해 주세요.");
      return;
    }
    checkpoint();
    selected = state.next++;
    state.nodes.push({ id: selected, type, ...spot, r: 0 });
    mode = "move";
    source = null;
    rebuild();
    announce("장치 추가 완료 · 빈 바닥을 클릭하면 옮길 수 있습니다.");
  }
  function rotateNode(direction = 1) {
    if (!node(selected)) return;
    checkpoint();
    node(selected).r += (direction * Math.PI) / 2;
    rebuild();
  }
  function cameraPose() {
    const aspect = Math.max(
        0.1,
        container.clientWidth / container.clientHeight,
      ),
      vertical = Math.max(5.9, 7.9 / aspect) / zoom;
    camera.left = -vertical * aspect;
    camera.right = vertical * aspect;
    camera.top = vertical;
    camera.bottom = -vertical;
    camera.position.set(Math.sin(yaw) * 15, 13, Math.cos(yaw) * 15);
    camera.lookAt(0, 0.2, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }
  function sizeScene() {
    const width = container.clientWidth,
      height = container.clientHeight;
    const ratio = highQuality
      ? Math.min(Math.max(devicePixelRatio, 2), 2.5)
      : Math.min(devicePixelRatio, 1.25);
    renderer.setPixelRatio(
      Math.min(ratio, Math.sqrt(8000000 / Math.max(1, width * height))),
    );
    renderer.setSize(width, height, false);
    cameraPose();
    render();
  }
  function render() {
    renderer.render(scene, camera);
    const placed = [];
    state.nodes.forEach((n) => {
      const p = new THREE.Vector3(n.x, 2.6, n.z).project(camera),
        label = labels.querySelector(`[data-node="${n.id}"]`);
      label.hidden = Math.abs(p.x) > 0.94 || Math.abs(p.y) > 0.85;
      if (label.hidden) return;
      const w = label.offsetWidth,
        h = label.offsetHeight;
      const x = THREE.MathUtils.clamp(
        (p.x + 1) * 0.5 * container.clientWidth,
        w / 2 + 8,
        container.clientWidth - w / 2 - 8,
      );
      const preferredY = Math.max(
        (1 - p.y) * 0.5 * container.clientHeight,
        container.clientHeight < 350 ? 85 : 145,
      );
      const candidates = [];
      for (const dy of [0, -1, 1, -2, 2, -3, 3])
        for (const dx of [0, -1, 1]) {
          const cx = x + dx * (w + 8),
            cy = preferredY + dy * (h + 8);
          if (
            cx - w / 2 < 8 ||
            cx + w / 2 > container.clientWidth - 8 ||
            cy - h < 45 ||
            cy > container.clientHeight - 60
          )
            continue;
          candidates.push({
            x: cx,
            y: cy,
            d: Math.abs(dx) * w + Math.abs(dy) * h,
          });
        }
      const choice = candidates
        .sort((a, b) => a.d - b.d)
        .find(
          (c) =>
            !placed.some(
              (b) =>
                Math.abs(c.x - b.x) < (w + b.w) / 2 + 5 &&
                c.y - h < b.y + 5 &&
                c.y > b.y - b.h - 5,
            ),
        );
      if (!choice) {
        label.hidden = true;
        return;
      }
      label.style.left = `${choice.x}px`;
      label.style.top = `${choice.y}px`;
      placed.push({ ...choice, w, h });
    });
  }
  function pose() {
    state.nodes.forEach((n) => {
      const o = objects.get(n.id);
      // Animated children retain the procedural models' hierarchy.
      if (n.type === "ot")
        o.getObjectByName("robotArm").rotation.y =
          running && !paused ? Math.sin(time * 1.8 * speed) * 0.6 : 0;
      if (n.type === "ai") {
        const core = o.getObjectByName("aiCore");
        core.position.y = 1.35 + (paused ? 0 : Math.sin(time + n.id) * 0.1);
        core.rotation.y = paused ? 0 : time * 0.15;
      }
    });
    connections.forEach(({ packets, path }) =>
      packets.forEach((dot, i) => {
        dot.position.copy(
          path.getPointAt(
            (running && !paused ? time * speed * 0.15 : 0) +
              i / 3 -
              Math.floor(
                (running && !paused ? time * speed * 0.15 : 0) + i / 3,
              ),
          ),
        );
        dot.visible = running;
      }),
    );
  }
  function frame(now) {
    raf = 0;
    if (document.hidden || isOverlay()) {
      previous = 0;
      return;
    }
    const elapsed = previous ? Math.min((now - previous) / 1000, 0.5) : 0,
      dt = Math.min(elapsed, 0.05);
    previous = now;
    if (!paused) time += dt;
    if (running) {
      cycle += elapsed * speed;
      if (cycle >= 3) {
        produced += completeLines() * Math.floor(cycle / 3);
        cycle %= 3;
        $("#factory-output").innerHTML = `${produced}<small>개</small>`;
      }
    }
    if (!paused || dt === 0) {
      pose();
      render();
    }
    if (!paused || running) raf = requestAnimationFrame(frame);
    else previous = 0;
  }
  function wake() {
    if (!raf && !document.hidden && !isOverlay()) {
      previous = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  function setMode(value) {
    mode = value;
    source = null;
    preview.visible = false;
    refreshUI();
    render();
  }
  document
    .querySelectorAll("[data-add]")
    .forEach((b) => b.addEventListener("click", () => add(b.dataset.add)));
  labels.addEventListener("click", (event) => {
    const b = event.target.closest("[data-node]");
    if (b) select(Number(b.dataset.node));
  });
  $("#move-mode").addEventListener("click", () => setMode("move"));
  $("#connect-mode").addEventListener("click", () => setMode("connect"));
  $("#selection-done").addEventListener("click", () => {
    selected = null;
    source = null;
    preview.visible = false;
    refreshUI();
    render();
  });
  $("#selection-rotate").addEventListener("click", () => rotateNode());
  $("#selection-disconnect").addEventListener("click", () => {
    if (!node(selected)) return;
    checkpoint();
    state.links = state.links.filter((pair) => !pair.includes(selected));
    source = null;
    rebuild();
    announce("선택한 장치의 연결을 해제했습니다.");
  });
  $("#selection-remove").addEventListener("click", () => {
    if (!node(selected)) return;
    checkpoint();
    state.nodes = state.nodes.filter((n) => n.id !== selected);
    state.links = state.links.filter((pair) => !pair.includes(selected));
    source = null;
    selected = null;
    rebuild();
  });
  $("#selection-project").addEventListener("click", () => {
    if (node(selected))
      window.dispatchEvent(
        new CustomEvent("factory-inspect", { detail: node(selected).type }),
      );
  });
  $("#factory-undo").addEventListener("click", () => {
    if (!history.length) return;
    state = JSON.parse(history.pop());
    running = false;
    cycle = 0;
    selected = null;
    source = null;
    rebuild();
  });
  $("#factory-sample").addEventListener("click", () => {
    checkpoint();
    state = fresh();
    selected = null;
    source = null;
    produced = 0;
    rebuild();
    announce("세 장치를 연결해 공장을 가동해 보세요.");
  });
  $("#factory-clear").addEventListener("click", () => {
    checkpoint();
    state = { nodes: [], links: [], next: 1 };
    selected = null;
    source = null;
    produced = 0;
    rebuild();
    announce("원하는 장치를 추가해 나만의 공장을 만들어 보세요.");
  });
  $("#quick-connect").addEventListener("click", () => {
    const it = state.nodes.find((n) => n.type === "it"),
      ai = state.nodes.find((n) => n.type === "ai"),
      ots = state.nodes.filter((n) => n.type === "ot");
    if (!it || !ai || !ots.length) {
      announce("로봇, 관제, AI 장치를 하나씩 추가하세요.");
      return;
    }
    const pairs = [...ots.map((n) => [n.id, it.id]), [it.id, ai.id]].filter(
      ([a, b]) => !state.links.some(([x, y]) => x === a && y === b),
    );
    if (!pairs.length) {
      announce("이미 생산 라인이 연결되어 있습니다.");
      return;
    }
    checkpoint();
    state.links.push(...pairs);
    source = null;
    rebuild();
    announce("연결 완료! 공장 가동 버튼을 눌러 보세요.");
  });
  $("#factory-run").addEventListener("click", () => {
    if (!completeLines()) return;
    running = !running;
    source = null;
    refreshUI();
    wake();
    if (running)
      announce("공장 가동 · 로봇 → 데이터 → AI의 흐름을 확인하세요.");
  });
  $("#factory-speed").addEventListener("input", (event) => {
    speed = Number(event.target.value);
    $("#speed-label").textContent = `${speed}×`;
  });
  for (const [id, action] of Object.entries({
    "camera-left": () => (yaw -= 0.3),
    "camera-right": () => (yaw += 0.3),
    "camera-in": () => (zoom = Math.min(1.8, zoom + 0.15)),
    "camera-out": () => (zoom = Math.max(0.7, zoom - 0.15)),
    "camera-home": () => {
      yaw = 0.6;
      zoom = 1;
    },
  }))
    $("#" + id).addEventListener("click", () => {
      action();
      cameraPose();
      render();
    });
  let gesture = null;
  function screenRay(event) {
    const r = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      -((event.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
  }
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    canvas.focus({ preventScroll: true });
    gesture = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw,
      drag: false,
    };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (gesture) {
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 6)
        gesture.drag = true;
      if (gesture.drag) {
        yaw = gesture.yaw - (event.clientX - gesture.x) * 0.007;
        preview.visible = false;
        cameraPose();
        render();
      }
      return;
    }
    if (mode === "move" && node(selected)) {
      screenRay(event);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        const x = Math.round(hit.x * 2) / 2,
          z = Math.round(hit.z * 2) / 2;
        preview.position.set(x, -0.1, z);
        preview.visible = Math.abs(x) < 7 && Math.abs(z) < 5;
        preview.material.color.setHex(
          validSpot(x, z, selected) ? 0xb0e4d2 : 0xff9988,
        );
        render();
      }
    }
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const drag = gesture.drag;
    gesture = null;
    if (drag) return;
    screenRay(event);
    const hits = state.nodes
      .map((n) => ({
        id: n.id,
        hit: raycaster.intersectObject(objects.get(n.id), true)[0],
      }))
      .filter((n) => n.hit)
      .sort((a, b) => a.hit.distance - b.hit.distance);
    if (hits.length) select(hits[0].id);
    else if (
      mode === "move" &&
      selected &&
      raycaster.ray.intersectPlane(plane, hit)
    ) {
      moveNode(hit.x, hit.z);
      preview.visible = false;
    } else {
      selected = null;
      source = null;
      refreshUI();
      render();
    }
  });
  canvas.addEventListener("pointercancel", () => (gesture = null));
  canvas.addEventListener("lostpointercapture", () => (gesture = null));
  canvas.addEventListener("pointerleave", () => {
    preview.visible = false;
    render();
  });
  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoom = THREE.MathUtils.clamp(zoom - event.deltaY * 0.001, 0.7, 1.8);
      cameraPose();
      render();
    },
    { passive: false },
  );
  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      selected = null;
      source = null;
      preview.visible = false;
      refreshUI();
      render();
      return;
    }
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) &&
      node(selected)
    ) {
      event.preventDefault();
      const n = node(selected);
      moveNode(
        n.x +
          (event.key === "ArrowLeft"
            ? -0.5
            : event.key === "ArrowRight"
              ? 0.5
              : 0),
        n.z +
          (event.key === "ArrowUp"
            ? -0.5
            : event.key === "ArrowDown"
              ? 0.5
              : 0),
      );
    }
    if (["q", "e"].includes(event.key.toLowerCase())) {
      event.preventDefault();
      rotateNode(event.key.toLowerCase() === "q" ? -1 : 1);
    }
  });
  motionButton.addEventListener("click", () => {
    paused = !paused;
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.textContent = paused ? "모션 꺼짐" : "모션 켜짐";
    pose();
    render();
    wake();
  });
  $("#quality-toggle").addEventListener("click", (event) => {
    highQuality = !highQuality;
    renderer.shadowMap.enabled = highQuality;
    scene.traverse((o) => {
      if (o.material) o.material.needsUpdate = true;
    });
    event.currentTarget.setAttribute("aria-pressed", String(highQuality));
    event.currentTarget.textContent = highQuality ? "고화질" : "표준 화질";
    sizeScene();
  });
  function pauseRendering() {
    cancelAnimationFrame(raf);
    raf = 0;
    previous = 0;
    gesture = null;
    preview.visible = false;
  }
  window.addEventListener("world-overlay-open", pauseRendering);
  window.addEventListener("world-overlay-close", wake);
  document.addEventListener("visibilitychange", () => {
    pauseRendering();
    wake();
  });
  reducedMotion.addEventListener("change", () => {
    paused = reducedMotion.matches;
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.textContent = paused ? "모션 꺼짐" : "모션 켜짐";
    wake();
  });
  new ResizeObserver(sizeScene).observe(container);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    pauseRendering();
    container.classList.remove("webgl-ready");
    window.dispatchEvent(new Event("identity-scene-unavailable"));
  });
  motionButton.setAttribute("aria-pressed", String(paused));
  motionButton.textContent = paused ? "모션 꺼짐" : "모션 켜짐";
  container.classList.add("webgl-ready");
  cameraPose();
  rebuild();
  sizeScene();
}
