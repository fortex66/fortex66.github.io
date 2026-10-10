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
  const floor = new THREE.GridHelper(15, 30, 0x274747, 0x1b3034);
  floor.position.y = -0.32;
  floor.material.transparent = true;
  floor.material.opacity = 0.3;
  root.add(floor);
  let selected = "ot",
    paused = reducedMotion.matches,
    inViewport = true,
    raf = 0,
    time = 0,
    previous = 0;
  const pointer = new THREE.Vector2();
  function sizeScene() {
    const width = container.clientWidth,
      height = container.clientHeight;
    renderer.setSize(width, height, false);
    const aspect = width / height,
      vertical = 3.7;
    camera.left = -vertical * aspect;
    camera.right = vertical * aspect;
    camera.top = vertical;
    camera.bottom = -vertical;
    camera.updateProjectionMatrix();
    render();
  }
  function render() {
    renderer.render(scene, camera);
  }
  function pose() {
    // A horizontal yaw swings the robot arm left and right around its base.
    robotArm.rotation.y = Math.sin(time * 0.85) * 0.38;
    server.position.y = Math.sin(time * 0.8 + 1) * 0.065;
    ai.position.y = 1.35 + Math.sin(time * 0.95) * 0.14;
    ai.rotation.y = Math.sin(time * 0.4) * 0.18;
    particles.forEach(({ dot, path, offset }) =>
      dot.position.copy(path.getPointAt((time * 0.12 + offset) % 1)),
    );
  }
  function frame(now) {
    raf = 0;
    if (paused || document.hidden || !inViewport) {
      previous = 0;
      return;
    }
    time += previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    root.rotation.y = THREE.MathUtils.lerp(
      root.rotation.y,
      pointer.x * 0.08,
      0.035,
    );
    root.rotation.x = THREE.MathUtils.lerp(
      root.rotation.x,
      pointer.y * 0.025,
      0.035,
    );
    pose();
    render();
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    previous = 0;
    const running = !paused && !document.hidden && inViewport;
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.setAttribute(
      "aria-label",
      paused ? "3D 움직임 재생" : "3D 움직임 정지",
    );
    motionButton.textContent = paused ? "Play motion ▷" : "Pause motion Ⅱ";
    render();
    if (running) raf = requestAnimationFrame(frame);
  }
  container.addEventListener("pointermove", (event) => {
    if (paused || reducedMotion.matches || event.pointerType === "touch")
      return;
    const rect = container.getBoundingClientRect();
    pointer.set(
      (event.clientX - rect.left) / rect.width - 0.5,
      (event.clientY - rect.top) / rect.height - 0.5,
    );
  });
  container.addEventListener("pointerleave", () => pointer.set(0, 0));
  motionButton.addEventListener("click", () => {
    paused = !paused;
    sync();
  });
  reducedMotion.addEventListener("change", () => {
    paused = reducedMotion.matches;
    pointer.set(0, 0);
    root.rotation.set(0, 0, 0);
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  new IntersectionObserver(
    ([entry]) => {
      inViewport = entry.isIntersecting;
      sync();
    },
    { threshold: 0.05 },
  ).observe(container);
  new ResizeObserver(sizeScene).observe(container);
  window.addEventListener("identity-layer", (event) => {
    selected = event.detail;
    Object.entries(pads).forEach(([id, pad]) => {
      pad.children[0].material = id === selected ? highlightedPad : dark;
    });
    render();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    paused = true;
    cancelAnimationFrame(raf);
    container.classList.remove("webgl-ready");
    window.dispatchEvent(new Event("identity-scene-unavailable"));
  });
  pose();
  sizeScene();
  container.classList.add("webgl-ready");
  sync();
}
