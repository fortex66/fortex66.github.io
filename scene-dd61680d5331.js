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
    powerPreference: "low-power",
  });
} catch {
  window.dispatchEvent(new Event("identity-scene-unavailable"));
}
if (renderer) initializeScene();

function initializeScene() {
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, innerWidth < 600 ? 1.25 : 1.5),
  );
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
    parent.add(mesh);
    return mesh;
  }
  function cylinder(parent, r, h, material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, 24),
      material,
    );
    mesh.position.set(x, y, z);
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
      new THREE.CylinderGeometry(r, r, delta.length(), 12),
      material,
    );
    mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
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
  halo.position.y = -0.92;
  pads.ai.add(halo);
  // Flow between equipment, software and intelligence, not a live telemetry view.
  const paths = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2, 0.25, 1.5),
      new THREE.Vector3(-1.5, 0.45, 1.5),
      new THREE.Vector3(-1.35, 0.45, 0.8),
      new THREE.Vector3(-1.2, 0.55, 0.5),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.2, 0.65, 0.6),
      new THREE.Vector3(1.7, 0.8, 0.6),
      new THREE.Vector3(1.9, 0.85, -0.1),
      new THREE.Vector3(2, 0.85, -0.3),
    ]),
  ];
  const particles = [];
  paths.forEach((path) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      path.getPoints(45),
    );
    root.add(
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: 0x547f7a,
          transparent: true,
          opacity: 0.7,
        }),
      ),
    );
    for (let i = 0; i < 3; i++) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 6),
        glow(colors.it),
      );
      root.add(dot);
      particles.push({ dot, path, offset: i / 3 });
    }
  });
  // A playable island: the explorer connects the three engineering stations.
  const deck = box(root, 12, 0.32, 8.5, mat(0x162c2c, 0.4), 0, -0.32, 0.5);
  // The in-world information terminal opens the rest of the portfolio.
  const terminal = new THREE.Group();
  terminal.position.set(4.45, 0, 2);
  root.add(terminal);
  const terminalBase = box(terminal, 0.85, 0.14, 0.8, dark, 0, -0.02, 0);
  edge(terminalBase, 0xb0e4d2);
  box(terminal, 0.22, 0.65, 0.22, metal, 0, 0.32, 0);
  const terminalScreen = box(
    terminal,
    0.78,
    0.52,
    0.1,
    mat(0x173b36),
    0,
    0.84,
    0,
  );
  terminalScreen.rotation.x = -0.2;
  edge(terminalScreen, 0xb0e4d2);
  for (let i = 0; i < 3; i++)
    box(
      terminal,
      0.46 - i * 0.08,
      0.025,
      0.02,
      glow(0xb0e4d2),
      -0.06,
      0.97 - i * 0.1,
      0.1,
    );
  pads.terminal = terminal;
  edge(deck, 0x4b8171, 0.8);
  const floor = new THREE.GridHelper(12, 24, 0x3b6759, 0x28473e);
  floor.position.set(0, -0.15, 0.5);
  floor.material.transparent = true;
  floor.material.opacity = 0.55;
  root.add(floor);
  const routeMaterial = glow(0x426e5c);
  // Illuminated corridor: the front of each station is a clear walking route.
  for (let x = -4.3; x <= 4.3; x += 0.32)
    box(root, 0.1, 0.025, 0.08, routeMaterial, x, -0.13, 2.7);
  Object.values(positions).forEach((pos) => {
    for (let z = pos.z + 1.5; z < 2.7; z += 0.3)
      box(root, 0.08, 0.025, 0.1, routeMaterial, pos.x, -0.13, z);
  });
  const beacons = {};
  Object.entries(positions).forEach(([id, p]) => {
    const beacon = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.028, 8, 40),
      glow(colors[id]),
    );
    beacon.rotation.x = Math.PI / 2;
    beacon.position.set(p.x, -0.08, p.z + 1.65);
    root.add(beacon);
    beacons[id] = beacon;
  });
  // Small software explorer; the visitor, not a claimed real-world machine.
  const explorer = new THREE.Group();
  explorer.position.set(0, -0.1, 3.5);
  root.add(explorer);
  const suit = mat(0xb0ded0, 0.3),
    visor = mat(0x142c35, 0.5),
    boot = mat(0x52776a, 0.6);
  const body = box(explorer, 0.38, 0.42, 0.28, suit, 0, 0.49, 0);
  edge(body, 0xd4f0db, 0.7);
  const head = box(explorer, 0.44, 0.32, 0.35, suit, 0, 0.91, 0);
  edge(head, 0xbde9d3, 0.5);
  box(explorer, 0.35, 0.14, 0.025, visor, 0, 0.94, 0.19);
  box(explorer, 0.075, 0.045, 0.02, glow(0x87e3d4), -0.1, 0.95, 0.21);
  box(explorer, 0.075, 0.045, 0.02, glow(0x87e3d4), 0.1, 0.95, 0.21);
  cylinder(explorer, 0.016, 0.17, metal, 0, 1.16, 0);
  const antenna = new THREE.Mesh(
    new THREE.SphereGeometry(0.046, 12, 8),
    glow(0xc9ecb7),
  );
  antenna.position.set(0, 1.25, 0);
  explorer.add(antenna);
  const feet = [
    box(explorer, 0.14, 0.2, 0.22, boot, -0.12, 0.16, 0.015),
    box(explorer, 0.14, 0.2, 0.22, boot, 0.12, 0.16, 0.015),
  ];
  const arms = [
    box(explorer, 0.1, 0.34, 0.12, suit, -0.26, 0.5, 0),
    box(explorer, 0.1, 0.34, 0.12, suit, 0.26, 0.5, 0),
  ];
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 24),
    new THREE.MeshBasicMaterial({
      color: 0x050e10,
      transparent: true,
      opacity: 0.5,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  explorer.add(shadow);
  const targetRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.012, 8, 36),
    glow(0xb0e4d2),
  );
  targetRing.rotation.x = Math.PI / 2;
  targetRing.position.y = -0.1;
  targetRing.visible = false;
  root.add(targetRing);
  const keys = new Set(),
    held = new Set(),
    visited = new Set();
  const markers = [...document.querySelectorAll("[data-destination]")];
  const interact = document.querySelector("#world-interact");
  const startUI = document.querySelector(".world-start");
  const destinations = Object.fromEntries(
    Object.entries(positions).map(([id, p]) => [
      id,
      new THREE.Vector3(p.x, -0.1, p.z + 1.75),
    ]),
  );
  destinations.terminal = new THREE.Vector3(4.45, -0.1, 3.6);
  const viewCenter = new THREE.Vector3(0, 0.4, 0.5);
  let paused = reducedMotion.matches,
    inViewport = true,
    raf = 0,
    time = 0,
    previous = 0,
    autopilot = null,
    nearby = null,
    started = false,
    walkTime = 0;
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  const walkPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.1);
  const direction = new THREE.Vector3(),
    destinationPoint = new THREE.Vector3();
  const focusable = () =>
    !document.querySelector("dialog[open]") && !document.hidden && inViewport;
  function cameraPose() {
    if (innerWidth < 650) {
      viewCenter.x = explorer.position.x;
      viewCenter.z = explorer.position.z - 0.9;
    } else {
      viewCenter.set(0, 0.4, 0.5);
    }
    camera.position.set(viewCenter.x + 10, 10, viewCenter.z + 14);
    camera.lookAt(viewCenter);
    camera.updateMatrixWorld();
  }
  function sizeScene() {
    const width = container.clientWidth,
      height = container.clientHeight;
    renderer.setSize(width, height, false);
    const aspect = width / height,
      vertical = innerWidth < 650 ? 4.2 : 4.6;
    camera.left = -vertical * aspect;
    camera.right = vertical * aspect;
    camera.top = vertical;
    camera.bottom = -vertical;
    camera.updateProjectionMatrix();
    cameraPose();
    render();
  }
  function updateMarkers() {
    Object.entries(positions).forEach(([id, pos]) => {
      const p = new THREE.Vector3(pos.x, pos.y + 2.8, pos.z).project(camera);
      const marker = markers.find((m) => m.dataset.destination === id);
      marker.style.left = `${(p.x + 1) * 0.5 * container.clientWidth}px`;
      const projectedY = (1 - p.y) * 0.5 * container.clientHeight;
      marker.style.top = `${innerWidth < 650 ? Math.max(195, projectedY) : projectedY}px`;
      marker.classList.add("positioned");
      marker.hidden = Math.abs(p.x) > 0.78 || p.y > 1 || p.y < -0.75;
    });
    const label = document.querySelector("#terminal-marker");
    const point = new THREE.Vector3(4.45, 1.8, 2).project(camera);
    label.style.left = `${(point.x + 1) * 0.5 * container.clientWidth}px`;
    label.style.top = `${(1 - point.y) * 0.5 * container.clientHeight}px`;
    label.hidden = Math.abs(point.x) > 0.82 || Math.abs(point.y) > 0.85;
    label.classList.add("positioned");
  }
  function render() {
    renderer.render(scene, camera);
    updateMarkers();
  }
  function selectZone(id) {
    if (id === "terminal") {
      window.dispatchEvent(new Event("world-library"));
      return;
    }
    visited.add(id);
    nearby = undefined;
    updateNearby();
    pads[id].children[0].material = highlightedPad;
    beacons[id].material.emissiveIntensity = 1.8;
    if (visited.size === 3) {
      routeMaterial.color.setHex(0xb0e4d2);
      routeMaterial.emissive.setHex(0x70c39e);
      coreMat.opacity = 0.45;
    }
    document
      .querySelectorAll("[data-layer]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.layer === id)),
      );
    window.dispatchEvent(
      new CustomEvent("world-zone", { detail: { id, visited: [...visited] } }),
    );
    render();
  }
  function updateNearby() {
    let next = null,
      best = 1.55;
    for (const [id, point] of Object.entries(destinations)) {
      const d = point.distanceTo(explorer.position);
      if (d < best) {
        best = d;
        next = id;
      }
    }
    if (next !== nearby) {
      nearby = next;
      interact.disabled = !next;
      interact.textContent = next
        ? next === "terminal"
          ? "안내 단말 열기 ↗"
          : `${visited.has(next) ? "다시 보기" : "연결하기"} / ${next.toUpperCase()} ↗`
        : "구역 가까이 이동하세요";
    }
  }
  function begin() {
    started = true;
    startUI.classList.add("is-started");
    canvas.focus({ preventScroll: true });
    wake();
  }
  function travel(id) {
    begin();
    if (reducedMotion.matches) {
      explorer.position.copy(destinations[id]);
      cameraPose();
      updateNearby();
      selectZone(id);
      return;
    }
    autopilot = { point: destinations[id].clone(), zone: id };
    targetRing.position.copy(destinations[id]);
    targetRing.visible = true;
    wake();
  }
  function blocked(x, z) {
    if (Math.abs(x) > 5.55 || z < -3.25 || z > 4.35) return true;
    if (Math.abs(x - 4.45) < 0.6 && Math.abs(z - 2) < 0.55) return true;
    return Object.values(positions).some(
      (p) => Math.abs(x - p.x) < 1.48 && Math.abs(z - p.z) < 1.35,
    );
  }
  function move(delta) {
    if (!started || !focusable()) return false;
    direction.set(0, 0, 0);
    const right =
      keys.has("d") || keys.has("arrowright") || held.has("right") ? 1 : 0;
    const left =
      keys.has("a") || keys.has("arrowleft") || held.has("left") ? 1 : 0;
    const down =
      keys.has("s") || keys.has("arrowdown") || held.has("down") ? 1 : 0;
    const up = keys.has("w") || keys.has("arrowup") || held.has("up") ? 1 : 0;
    if (right || left || down || up) {
      autopilot = null;
      direction.set(
        (right - left) * 0.814 + (down - up) * 0.581,
        0,
        (down - up) * 0.814 - (right - left) * 0.581,
      );
    } else if (autopilot) {
      direction.copy(autopilot.point).sub(explorer.position);
      direction.y = 0;
      if (direction.length() < 0.1) {
        const id = autopilot.zone;
        autopilot = null;
        targetRing.visible = false;
        updateNearby();
        if (id) selectZone(id);
        return false;
      }
      // Walk along the clear front corridor before approaching the station.
      if (Math.abs(direction.x) > 0.12 && explorer.position.z < 2.7)
        direction.set(0, 0, 1);
      else if (Math.abs(direction.x) > 0.12) direction.z = 0;
    }
    if (direction.lengthSq() === 0) return false;
    direction.normalize();
    const step = 2.7 * delta;
    const x = explorer.position.x + direction.x * step,
      z = explorer.position.z + direction.z * step;
    let moved = false;
    if (!blocked(x, explorer.position.z)) {
      explorer.position.x = x;
      moved = true;
    }
    if (!blocked(explorer.position.x, z)) {
      explorer.position.z = z;
      moved = true;
    }
    if (!moved) {
      autopilot = null;
      targetRing.visible = false;
      return false;
    }
    explorer.rotation.y = Math.atan2(direction.x, direction.z);
    walkTime += delta * 11;
    if (!reducedMotion.matches) {
      feet[0].position.y = 0.16 + Math.max(0, Math.sin(walkTime)) * 0.08;
      feet[1].position.y = 0.16 + Math.max(0, -Math.sin(walkTime)) * 0.08;
      arms[0].rotation.x = Math.sin(walkTime) * 0.22;
      arms[1].rotation.x = -Math.sin(walkTime) * 0.22;
    }
    updateNearby();
    cameraPose();
    return true;
  }
  function pose() {
    robotArm.rotation.y = Math.sin(time * 0.85) * 0.38;
    server.position.y = Math.sin(time * 0.8 + 1) * 0.065;
    ai.position.y = 1.35 + Math.sin(time * 0.95) * 0.14;
    ai.rotation.y = Math.sin(time * 0.4) * 0.18;
    particles.forEach(({ dot, path, offset }) =>
      dot.position.copy(path.getPointAt((time * 0.12 + offset) % 1)),
    );
  }
  function hasInput() {
    return keys.size > 0 || held.size > 0 || autopilot !== null;
  }
  function frame(now) {
    raf = 0;
    if (
      document.hidden ||
      !inViewport ||
      document.querySelector("dialog[open]")
    ) {
      previous = 0;
      return;
    }
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    const moved = move(dt);
    if (!paused) {
      time += dt;
      pose();
    }
    if (!moved) {
      feet.forEach((f) => (f.position.y = 0.16));
      arms.forEach((a) => (a.rotation.x = 0));
    }
    render();
    if (!paused || hasInput()) raf = requestAnimationFrame(frame);
    else previous = 0;
  }
  function wake() {
    if (!raf && !document.hidden && inViewport) {
      previous = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  function clearInput() {
    keys.clear();
    held.clear();
    document
      .querySelectorAll(".is-held")
      .forEach((b) => b.classList.remove("is-held"));
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    previous = 0;
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.setAttribute(
      "aria-label",
      paused ? "배경 움직임 재생" : "배경 움직임 정지",
    );
    motionButton.textContent = paused ? "Play ambience ▷" : "Pause ambience Ⅱ";
    render();
    if (!paused || hasInput()) wake();
  }
  canvas.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
      ].includes(key)
    ) {
      event.preventDefault();
      if (!focusable()) return;
      begin();
      keys.add(key);
      wake();
    } else if (["e", "enter", " "].includes(key)) {
      event.preventDefault();
      if (nearby && !event.repeat) selectZone(nearby);
    }
  });
  document.addEventListener("keyup", (event) =>
    keys.delete(event.key.toLowerCase()),
  );
  canvas.addEventListener("blur", clearInput);
  window.addEventListener("world-overlay-open", () => {
    clearInput();
    autopilot = null;
    targetRing.visible = false;
    cancelAnimationFrame(raf);
    raf = 0;
    previous = 0;
  });
  window.addEventListener("world-overlay-close", sync);
  window.addEventListener("blur", clearInput);
  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      begin();
      held.add(button.dataset.move);
      button.classList.add("is-held");
      button.setPointerCapture(e.pointerId);
      wake();
    });
    const release = () => {
      held.delete(button.dataset.move);
      button.classList.remove("is-held");
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });
  document.querySelector("#world-start").addEventListener("click", begin);
  interact.addEventListener("click", () => {
    if (nearby) selectZone(nearby);
  });
  container.addEventListener("pointerdown", (event) => {
    if (event.target !== canvas) return;
    begin();
    const r = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      -((event.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    for (const [id, pad] of Object.entries(pads)) {
      if (raycaster.intersectObject(pad, true).length) {
        travel(id);
        return;
      }
    }
    if (raycaster.ray.intersectPlane(walkPlane, destinationPoint)) {
      if (blocked(destinationPoint.x, destinationPoint.z)) return;
      if (reducedMotion.matches) {
        explorer.position.copy(destinationPoint);
        cameraPose();
        updateNearby();
        render();
      } else {
        autopilot = { point: destinationPoint.clone(), zone: null };
        targetRing.position.copy(destinationPoint);
        targetRing.visible = true;
        wake();
      }
    }
  });
  window.addEventListener("identity-layer", (event) => travel(event.detail));
  window.addEventListener("world-reset", () => {
    clearInput();
    autopilot = null;
    visited.clear();
    targetRing.visible = false;
    explorer.position.set(0, -0.1, 3.5);
    explorer.rotation.y = 0;
    started = false;
    startUI.classList.remove("is-started");
    coreMat.opacity = 0.25;
    routeMaterial.color.setHex(0x426e5c);
    routeMaterial.emissive.setHex(0x426e5c);
    Object.values(pads).forEach((p) => (p.children[0].material = dark));
    Object.values(beacons).forEach((b) => (b.material.emissiveIntensity = 0.6));
    nearby = undefined;
    updateNearby();
    cameraPose();
    render();
  });
  motionButton.addEventListener("click", () => {
    paused = !paused;
    sync();
  });
  reducedMotion.addEventListener("change", () => {
    paused = reducedMotion.matches;
    autopilot = null;
    targetRing.visible = false;
    clearInput();
    sync();
  });
  document.addEventListener("visibilitychange", () => {
    clearInput();
    sync();
  });
  new IntersectionObserver(
    ([entry]) => {
      inViewport = entry.isIntersecting;
      if (!inViewport) clearInput();
      sync();
    },
    { threshold: 0.05 },
  ).observe(container);
  new ResizeObserver(sizeScene).observe(container);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    paused = true;
    clearInput();
    autopilot = null;
    cancelAnimationFrame(raf);
    container.classList.remove("webgl-ready");
    window.dispatchEvent(new Event("identity-scene-unavailable"));
  });
  pose();
  sizeScene();
  container.classList.add("webgl-ready");
  updateNearby();
  window.dispatchEvent(new Event("world-ready"));
  sync();
}
