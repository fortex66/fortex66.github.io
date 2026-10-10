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
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(9, 8, 13);
  camera.lookAt(0, 1, 0);
  scene.add(new THREE.HemisphereLight(0xdce4ee, 0x34373a, 1.6));
  const key = new THREE.DirectionalLight(0xffedda, 3.2);
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
  const rim = new THREE.DirectionalLight(0xb9d3ee, 2);
  rim.position.set(6, 5, -4);
  scene.add(rim);
  // Local studio reflection capture: no external HDR or model download.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x677079);
  for (const [x, y, z, w, h, intensity] of [
    [-6, 5, 4, 5, 7, 3],
    [6, 3, 1, 4, 6, 2],
    [0, 9, -2, 8, 5, 2],
  ]) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setScalar(intensity),
        side: THREE.DoubleSide,
      }),
    );
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio, 0.04, 0.1, 40).texture;
  scene.environmentIntensity = 0.5;
  studio.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
  pmrem.dispose();
  const root = new THREE.Group();
  scene.add(root);
  const colors = { ot: 0xe2ac78, it: 0x83cdb9, ai: 0xb6a1e7 };
  const mat = (color, metalness = 0.3, roughness = 0.42) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const dark = mat(0x21363b, 0.6);
  const highlightedPad = mat(0x65756b, 0.15, 0.7);
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
  const concreteMap = texture((c, w, h) => {
    c.fillStyle = "#969a9b";
    c.fillRect(0, 0, w, h);
    let seed = 17;
    for (let i = 0; i < 24000; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const x = seed % w;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const y = seed % h;
      const shade = 110 + (seed % 80);
      c.fillStyle = `rgba(${shade},${shade},${shade},.2)`;
      c.fillRect(x, y, 1 + (seed % 2), 1);
    }
  });
  const concreteSurface = new THREE.MeshStandardMaterial({
    color: 0xb1b6b8,
    map: concreteMap,
    roughness: 0.94,
    metalness: 0.03,
    bumpMap: concreteMap,
    bumpScale: 0.013,
  });
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
    edge(pad, 0x737e85, 0.3);
    box(group, 2.53, 0.035, 2.23, concreteSurface, 0, 0.12, 0);
    for (const x of [-1.12, 1.12])
      for (const z of [-0.96, 0.96])
        cylinder(group, 0.025, 0.02, metal, x, 0.155, z);
    // Solid risers support the three display heights down to the floor.
    const supportHeight = pos.y + 0.065;
    box(
      group,
      2.58,
      supportHeight,
      2.28,
      concreteSurface,
      0,
      -0.095 - supportHeight / 2,
      0,
    );
    pads[id] = group;
  });
  pads.ot.children[0].material = highlightedPad;
  // Purpose-built industrial equipment, modeled in real proportions.
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0xc55d1a,
    metalness: 0.25,
    roughness: 0.38,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
  });
  const graphite = mat(0x252b31, 0.48, 0.38),
    steel = mat(0xa6b0b4, 0.88, 0.27),
    rubber = mat(0x111416, 0.05, 0.84);
  const anodized = mat(0x525e67, 0.75, 0.34),
    enamel = mat(0xbfc7c6, 0.18, 0.5);
  function rounded(parent, w, h, d, material, x = 0, y = 0, z = 0, r = 0.025) {
    r = Math.min(r, w / 5, h / 5, d / 5);
    const shape = new THREE.Shape(),
      a = w / 2 - r,
      b = h / 2 - r;
    shape.moveTo(-a, -b - r);
    shape.lineTo(a, -b - r);
    shape.quadraticCurveTo(a + r, -b - r, a + r, -b);
    shape.lineTo(a + r, b);
    shape.quadraticCurveTo(a + r, b + r, a, b + r);
    shape.lineTo(-a, b + r);
    shape.quadraticCurveTo(-a - r, b + r, -a - r, b);
    shape.lineTo(-a - r, -b);
    shape.quadraticCurveTo(-a - r, -b - r, -a, -b - r);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: d - 2 * r,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: r * 0.55,
      bevelThickness: r,
      curveSegments: 4,
    });
    geometry.translate(0, 0, -d / 2 + r);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cable(parent, points, r = 0.026, color = 0x141b1e) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 28, r, 8, false),
      mat(color, 0.15, 0.7),
    );
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function texture(draw, w = 512, h = 512) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return t;
  }
  const ventTexture = texture(
    (c, w, h) => {
      c.fillStyle = "#30363b";
      c.fillRect(0, 0, w, h);
      for (let y = 8; y < h; y += 14)
        for (let x = 8; x < w; x += 14) {
          c.fillStyle = "#101519";
          c.beginPath();
          c.arc(x, y, 4, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#4b5358";
          c.fillRect(x - 3, y + 4, 6, 1);
        }
    },
    256,
    256,
  );
  const grille = new THREE.MeshStandardMaterial({
    map: ventTexture,
    metalness: 0.55,
    roughness: 0.5,
  });
  const hazardTexture = texture(
    (c, w, h) => {
      c.fillStyle = "#cda84f";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#252a28";
      for (let x = -h; x < w; x += 56) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x + 26, 0);
        c.lineTo(x + h + 26, h);
        c.lineTo(x + h, h);
        c.fill();
      }
    },
    512,
    64,
  );
  const hazardMat = new THREE.MeshStandardMaterial({
    map: hazardTexture,
    roughness: 0.78,
  });
  function screen(parent, w, h, x, y, z, title, kind) {
    rounded(parent, w + 0.055, h + 0.065, 0.065, graphite, x, y, z, 0.018);
    const map = texture(
      (c, cw, ch) => {
        c.fillStyle = "#081218";
        c.fillRect(0, 0, cw, ch);
        c.fillStyle = kind === "ai" ? "#a6b5e8" : "#7cc7b4";
        c.font = "bold 25px sans-serif";
        c.fillText(title, 22, 36);
        c.strokeStyle = "#314047";
        c.beginPath();
        c.moveTo(20, 52);
        c.lineTo(cw - 20, 52);
        c.stroke();
        c.fillStyle = "#adbdc6";
        c.font = "16px sans-serif";
        c.fillText(
          kind === "ai"
            ? "ENGINEERING ASSISTANT / LOCAL"
            : "SCADA / EQUIPMENT NETWORK",
          22,
          78,
        );
        if (kind === "ai") {
          c.fillStyle = "#1c2936";
          c.fillRect(20, 98, 270, 166);
          c.strokeStyle = "#8398b8";
          c.lineWidth = 3;
          for (let i = 0; i < 3; i++) {
            const yy = 120 + i * 52;
            c.beginPath();
            c.moveTo(38, yy);
            c.lineTo(270, yy);
            c.stroke();
            c.fillStyle = "#102029";
            c.fillRect(80, yy - 10, 28, 20);
            c.strokeRect(80, yy - 10, 28, 20);
            c.strokeRect(200, yy - 10, 28, 20);
          }
          c.fillStyle = "#8795b1";
          c.font = "16px sans-serif";
          c.fillText("ANALYSIS", 310, 120);
          c.fillStyle = "#a6c7b4";
          c.fillText("Structure parsed", 310, 156);
          c.fillText("Rules checked", 310, 188);
          c.fillStyle = "#e9c88c";
          c.fillText("Human review", 310, 224);
        } else {
          c.fillStyle = "#1a2b32";
          c.fillRect(20, 100, 180, 164);
          c.fillStyle = "#b4d0ce";
          c.font = "16px sans-serif";
          ["PLC 01   ONLINE", "ROBOT    READY", "SENSOR   ACTIVE"].forEach(
            (t, i) => c.fillText(t, 32, 132 + i * 45),
          );
          c.strokeStyle = "#243a41";
          c.lineWidth = 1;
          for (let y = 110; y < 260; y += 30) {
            c.beginPath();
            c.moveTo(220, y);
            c.lineTo(cw - 22, y);
            c.stroke();
          }
          c.strokeStyle = "#6fc7b1";
          c.lineWidth = 3;
          c.beginPath();
          for (let i = 0; i < 28; i++) {
            const x = 222 + i * 9,
              y = 190 + Math.sin(i * 0.6) * 25 + (i % 6 === 0 ? 30 : 0);
            i ? c.lineTo(x, y) : c.moveTo(x, y);
          }
          c.stroke();
        }
        c.fillStyle = "#657f88";
        c.font = "14px sans-serif";
        c.fillText("PORTFOLIO DEMO  /  NOT LIVE TELEMETRY", 22, ch - 16);
      },
      512,
      320,
    );
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map }),
    );
    panel.position.set(x, y, z + 0.037);
    parent.add(panel);
  }
  function bolts(parent, cx, cy, z, r, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const bolt = cylinder(
        parent,
        0.019,
        0.025,
        steel,
        cx + Math.cos(angle) * r,
        cy + Math.sin(angle) * r,
        z,
      );
      bolt.rotation.x = Math.PI / 2;
    }
  }
  function servo(parent, x, y, z, r = 0.19) {
    const motor = cylinder(parent, r, 0.25, paint, x, y, z);
    motor.rotation.x = Math.PI / 2;
    const cover = cylinder(parent, r * 0.82, 0.03, graphite, x, y, z + 0.145);
    cover.rotation.x = Math.PI / 2;
    const bearing = cylinder(parent, r * 0.48, 0.035, steel, x, y, z + 0.17);
    bearing.rotation.x = Math.PI / 2;
    bolts(parent, x, y, z + 0.19, r * 0.67);
  }
  // OT: cast-metal six-axis arm, protected cabling, gripper and a fixture table.
  const robot = new THREE.Group();
  robot.position.set(-0.38, 0.02, -0.17);
  pads.ot.add(robot);
  rounded(robot, 0.72, 0.14, 0.66, steel, 0, 0.22, 0);
  for (const x of [-0.28, 0.28])
    for (const z of [-0.24, 0.24])
      cylinder(robot, 0.033, 0.04, graphite, x, 0.31, z);
  cylinder(robot, 0.26, 0.23, paint, 0, 0.4, 0);
  cylinder(robot, 0.21, 0.075, graphite, 0, 0.55, 0);
  rounded(robot, 0.38, 0.4, 0.36, paint, 0, 0.69, 0, 0.05);
  const robotArm = new THREE.Group();
  robotArm.position.y = 0.82;
  robot.add(robotArm);
  const p0 = new THREE.Vector3(0, 0, 0),
    p1 = new THREE.Vector3(-0.3, 0.82, 0),
    p2 = new THREE.Vector3(0.44, 1.32, 0),
    p3 = new THREE.Vector3(1.08, 0.58, 0.28);
  function casting(a, b, width, depth) {
    const delta = b.clone().sub(a);
    const mesh = rounded(
      robotArm,
      width,
      delta.length(),
      depth,
      paint,
      0,
      0,
      0,
      0.06,
    );
    mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
  }
  casting(p0, p1, 0.29, 0.3);
  casting(p1, p2, 0.25, 0.25);
  casting(p2, p3, 0.16, 0.19);
  servo(robotArm, 0, 0, 0, 0.21);
  servo(robotArm, -0.3, 0.82, 0, 0.19);
  servo(robotArm, 0.44, 1.32, 0, 0.16);
  cable(
    robotArm,
    [
      [0.1, -0.08, -0.2],
      [-0.43, 0.46, -0.2],
      [-0.46, 0.93, -0.17],
      [0.13, 1.5, -0.18],
      [0.63, 1.25, -0.1],
      [1.04, 0.65, 0.2],
    ],
    0.045,
  );
  const wrist = cylinder(robotArm, 0.11, 0.2, steel, p3.x, p3.y, p3.z);
  wrist.rotation.z = -0.25;
  rounded(robotArm, 0.23, 0.12, 0.18, graphite, p3.x, p3.y - 0.16, p3.z);
  rounded(
    robotArm,
    0.035,
    0.18,
    0.13,
    steel,
    p3.x - 0.08,
    p3.y - 0.29,
    p3.z,
    0.008,
  );
  rounded(
    robotArm,
    0.035,
    0.18,
    0.13,
    steel,
    p3.x + 0.08,
    p3.y - 0.29,
    p3.z,
    0.008,
  );
  const workpiece = rounded(
    pads.ot,
    0.21,
    0.13,
    0.19,
    steel,
    0.72,
    0.91,
    0.28,
    0.012,
  );
  rounded(pads.ot, 0.9, 0.1, 0.75, steel, 0.74, 0.72, 0.32);
  for (const x of [0.4, 1.08])
    for (const z of [0.06, 0.57])
      box(pads.ot, 0.07, 0.51, 0.07, anodized, x, 0.43, z);
  rounded(pads.ot, 0.55, 0.07, 0.35, graphite, 0.73, 0.81, 0.31, 0.01);
  for (const x of [0.52, 0.94])
    box(pads.ot, 0.08, 0.09, 0.3, steel, x, 0.88, 0.31);
  // Controller enclosure, latch, emergency stop, and stack light.
  rounded(pads.ot, 0.46, 0.85, 0.38, enamel, -0.96, 0.63, -0.54);
  box(pads.ot, 0.35, 0.002, 0.27, grille, -0.96, 1.06, -0.54);
  rounded(pads.ot, 0.29, 0.23, 0.02, graphite, -0.96, 0.83, -0.34);
  box(pads.ot, 0.23, 0.15, 0.01, glow(0x6b9998), -0.96, 0.84, -0.325);
  const stop = cylinder(
    pads.ot,
    0.04,
    0.032,
    mat(0xa32421, 0.15),
    -0.84,
    0.59,
    -0.32,
  );
  stop.rotation.x = Math.PI / 2;
  cylinder(pads.ot, 0.025, 0.22, steel, -0.99, 1.19, -0.54);
  for (let i = 0; i < 3; i++)
    cylinder(
      pads.ot,
      0.046,
      0.07,
      mat([0x4b805d, 0xc29737, 0x973c32][i], 0.05, 0.35),
      -0.99,
      1.31 + i * 0.075,
      -0.54,
    );
  // Rear safety barrier: mesh panel in a powder-coated frame.
  for (const x of [-1.17, 1.17])
    box(pads.ot, 0.05, 0.93, 0.05, mat(0xc39b42), x, 0.61, -0.97);
  box(pads.ot, 2.37, 0.05, 0.05, graphite, 0, 1.07, -0.97);
  for (let x = -1.1; x < 1.15; x += 0.13)
    box(pads.ot, 0.009, 0.76, 0.01, graphite, x, 0.63, -0.97);
  for (let y = 0.29; y < 1.06; y += 0.13)
    box(pads.ot, 2.2, 0.009, 0.01, graphite, 0, y, -0.97);
  box(pads.ot, 2.28, 0.012, 0.1, hazardMat, 0, 0.145, 0.98);
  // IT: an enclosed 19-inch rack, patch connections, a desk and SCADA screen.
  const server = new THREE.Group();
  pads.it.add(server);
  rounded(server, 0.87, 1.91, 0.81, graphite, -0.53, 1.12, -0.23, 0.03);
  box(server, 0.76, 1.72, 0.02, rubber, -0.53, 1.12, 0.191);
  for (const x of [-0.92, -0.14])
    box(server, 0.045, 1.79, 0.03, anodized, x, 1.12, 0.215);
  for (let i = 0; i < 7; i++) {
    const y = 0.4 + i * 0.215;
    rounded(
      server,
      0.7,
      0.178,
      0.045,
      i < 2 ? anodized : graphite,
      -0.53,
      y,
      0.23,
      0.008,
    );
    box(server, 0.43, 0.115, 0.009, grille, -0.6, y, 0.257);
    box(server, 0.025, 0.025, 0.009, glow(0x6cc68e), -0.25, y, 0.26);
    for (const x of [-0.83, -0.23]) {
      const screw = cylinder(server, 0.012, 0.01, steel, x, y, 0.265);
      screw.rotation.x = Math.PI / 2;
    }
  }
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x7f999f,
    metalness: 0.15,
    roughness: 0.16,
    transparent: true,
    opacity: 0.1,
    clearcoat: 1,
    depthWrite: false,
  });
  box(server, 0.77, 1.77, 0.012, glassMat, -0.53, 1.13, 0.3);
  rounded(server, 0.025, 0.29, 0.035, steel, -0.2, 1.1, 0.326, 0.006);
  for (let i = 0; i < 4; i++)
    cable(
      server,
      [
        [-0.8 + i * 0.14, 1.87, 0.24],
        [-0.8 + i * 0.14, 1.95, 0.34],
        [-0.74 + i * 0.14, 1.74, 0.39],
      ],
      0.012,
      [0x466b84, 0xc6a84b, 0x608465, 0x9dabae][i],
    );
  rounded(server, 1.12, 0.075, 0.78, enamel, 0.67, 0.82, 0.44);
  for (const x of [0.22, 1.12])
    for (const z of [0.13, 0.71])
      box(server, 0.04, 0.65, 0.04, steel, x, 0.46, z);
  rounded(server, 0.32, 0.035, 0.2, graphite, 0.67, 0.88, 0.27);
  box(server, 0.04, 0.2, 0.04, steel, 0.67, 0.98, 0.24);
  screen(server, 1.02, 0.64, 0.67, 1.32, 0.24, "SYSTEM MONITOR", "it");
  const keyboardMap = texture(
    (c, w, h) => {
      c.fillStyle = "#30383b";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#788486";
      for (let y = 8; y < h - 8; y += 22)
        for (let x = 8; x < w - 8; x += 23) c.fillRect(x, y, 17, 14);
    },
    256,
    128,
  );
  box(
    server,
    0.48,
    0.015,
    0.17,
    new THREE.MeshStandardMaterial({ map: keyboardMap, roughness: 0.65 }),
    0.57,
    0.87,
    0.64,
  );
  rounded(server, 0.08, 0.04, 0.12, graphite, 0.98, 0.89, 0.64, 0.016);
  cable(
    server,
    [
      [-0.1, 0.2, 0.05],
      [0.1, 0.18, 0.2],
      [0.28, 0.3, 0.28],
      [0.4, 0.8, 0.28],
    ],
    0.018,
  );
  // AI: GPU compute workstation with visible PCIe boards and an engineering display.
  const ai = new THREE.Group();
  pads.ai.add(ai);
  rounded(ai, 0.9, 1.64, 0.92, graphite, -0.45, 0.98, -0.17, 0.025);
  // Removable side reveals the compute hardware behind tempered glass.
  box(ai, 0.025, 1.46, 0.78, rubber, 0.016, 0.98, -0.17);
  const pcb = mat(0x284537, 0.28, 0.65),
    fins = mat(0x88979c, 0.78, 0.35);
  for (let i = 0; i < 3; i++) {
    const y = 0.61 + i * 0.3;
    box(ai, 0.035, 0.12, 0.65, pcb, 0.043, y, -0.13);
    box(ai, 0.04, 0.065, 0.57, fins, 0.076, y + 0.08, -0.13);
    for (let z = -0.37; z < 0.18; z += 0.052)
      box(ai, 0.055, 0.105, 0.015, steel, 0.092, y + 0.08, z);
    box(ai, 0.023, 0.016, 0.4, glow(0x688f96), 0.11, y - 0.025, -0.13);
  }
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0x99acb4,
    metalness: 0.05,
    roughness: 0.12,
    transparent: true,
    opacity: 0.25,
    clearcoat: 1,
    depthWrite: false,
  });
  box(ai, 0.008, 1.43, 0.79, coreMat, 0.139, 1, -0.17);
  for (const y of [0.34, 1.66])
    for (const z of [-0.53, 0.19]) {
      const screw = cylinder(ai, 0.018, 0.016, steel, 0.154, y, z);
      screw.rotation.z = Math.PI / 2;
    }
  box(ai, 0.76, 1.43, 0.015, grille, -0.45, 0.99, 0.301);
  const gpuFans = [];
  for (let i = 0; i < 3; i++) {
    const fan = new THREE.Group();
    fan.position.set(-0.45, 0.54 + i * 0.43, 0.33);
    ai.add(fan);
    gpuFans.push(fan);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.145, 0.016, 8, 40),
      anodized,
    );
    fan.add(rim);
    const hub = cylinder(fan, 0.047, 0.026, graphite, 0, 0, 0.01);
    hub.rotation.x = Math.PI / 2;
    for (let j = 0; j < 7; j++) {
      const blade = rounded(fan, 0.053, 0.115, 0.012, rubber, 0, 0, 0, 0.007);
      const a = (j / 7) * Math.PI * 2;
      blade.position.set(Math.sin(a) * 0.09, Math.cos(a) * 0.09, 0);
      blade.rotation.z = -a + 0.4;
    }
  }
  box(ai, 0.024, 0.024, 0.02, glow(0x849cd0), -0.13, 1.67, 0.32);
  rounded(ai, 1.04, 0.07, 0.66, enamel, 0.76, 0.77, 0.42);
  for (const x of [0.34, 1.17])
    box(ai, 0.055, 0.58, 0.055, steel, x, 0.44, 0.39);
  rounded(ai, 0.27, 0.03, 0.18, graphite, 0.75, 0.83, 0.27);
  box(ai, 0.04, 0.3, 0.04, steel, 0.75, 1, 0.25);
  screen(ai, 1.04, 0.67, 0.74, 1.36, 0.23, "PLC AI STUDIO", "ai");
  box(
    ai,
    0.49,
    0.014,
    0.17,
    new THREE.MeshStandardMaterial({ map: keyboardMap, roughness: 0.6 }),
    0.7,
    0.82,
    0.61,
  );
  cable(
    ai,
    [
      [-0.17, 0.2, 0.3],
      [0.1, 0.18, 0.4],
      [0.34, 0.3, 0.4],
      [0.5, 0.74, 0.3],
    ],
    0.022,
  );

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
  const deck = box(
    root,
    12,
    0.32,
    8.5,
    new THREE.MeshStandardMaterial({
      color: 0x667078,
      map: concreteMap,
      roughness: 0.93,
      metalness: 0.02,
      bumpMap: concreteMap,
      bumpScale: 0.012,
    }),
    0,
    -0.32,
    0.5,
  );
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
  deck.castShadow = false;
  edge(deck, 0x4b8171, 0.8);
  const floor = new THREE.GridHelper(12, 24, 0x3b6759, 0x28473e);
  floor.position.set(0, -0.15, 0.5);
  floor.scale.z = 8.5 / 12;
  floor.material.transparent = true;
  floor.material.opacity = 0.18;
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
  // Optional exploration rewards never lock portfolio content.
  const chips = [-4.8, -2.4, 0, 2.4, 4.8].map((x, index) => {
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16),
      glow(0xffd88b),
    );
    mesh.position.set(x, 0.4, 3.65);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.014, 8, 40),
      glow(0xffd88b),
    );
    halo.rotation.x = Math.PI / 2;
    mesh.add(halo);
    root.add(mesh);
    return { mesh, index, collected: false };
  });
  let boost = false,
    toastTimer;
  const boostButton = document.querySelector("#boost-toggle");
  const toast = document.querySelector("#game-toast");
  function announce(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3600);
  }
  function updateRewards(message) {
    const count = chips.filter((c) => c.collected).length;
    const complete = count === 5 && visited.size === 3;
    document.querySelector("#game-score").textContent =
      visited.size * 100 + count * 20;
    document.querySelector("#game-chips").textContent =
      `데이터 칩 ${count} / 5`;
    document.querySelector("#game-rank").textContent = complete
      ? "SYSTEM ARCHITECT ★"
      : visited.size === 3
        ? "SYSTEM CONNECTOR"
        : "EXPLORER";
    document
      .querySelector(".game-hud")
      .classList.toggle("is-complete", complete);
    document.querySelector("#game-hint").textContent = complete
      ? "탐험 완료! 모든 시스템과 데이터를 연결했습니다."
      : count === 5
        ? "세 시스템을 연결하면 최종 배지를 획득합니다."
        : "빛나는 칩을 모으고 세 시스템을 연결하세요.";
    if (message)
      announce(complete ? "★ SYSTEM ARCHITECT · 400 XP 달성!" : message);
  }
  function collectChips() {
    if (!started) return;
    chips.forEach((chip) => {
      if (
        !chip.collected &&
        Math.hypot(
          explorer.position.x - chip.mesh.position.x,
          explorer.position.z - chip.mesh.position.z,
        ) < 0.48
      ) {
        chip.collected = true;
        chip.mesh.visible = false;
        updateRewards("데이터 칩 획득 · +20 XP");
      }
    });
  }
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
    camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
    const vertical = innerWidth < 650 ? 4.2 : 5.1;
    camera.fov = THREE.MathUtils.radToDeg(
      2 * Math.atan(vertical / camera.position.distanceTo(viewCenter)),
    );
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }
  function sizeScene() {
    const width = container.clientWidth,
      height = container.clientHeight;
    const desiredRatio = highQuality
      ? Math.min(Math.max(devicePixelRatio, 2), 2.5)
      : Math.min(devicePixelRatio, 1.25);
    // Bound framebuffer memory on very large screens while supersampling ordinary displays.
    renderer.setPixelRatio(
      Math.min(desiredRatio, Math.sqrt(8000000 / Math.max(1, width * height))),
    );
    renderer.setSize(width, height, false);
    cameraPose();
    render();
  }
  function updateMarkers() {
    Object.entries(positions).forEach(([id, pos]) => {
      const p = new THREE.Vector3(pos.x, pos.y + 2.8, pos.z).project(camera);
      const marker = markers.find((m) => m.dataset.destination === id);
      marker.style.left = `${(p.x + 1) * 0.5 * container.clientWidth}px`;
      const projectedY = (1 - p.y) * 0.5 * container.clientHeight;
      marker.style.top = `${innerWidth < 650 ? Math.max(265, projectedY) : projectedY}px`;
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
    const firstVisit = !visited.has(id);
    visited.add(id);
    updateRewards(
      firstVisit ? `${id.toUpperCase()} 시스템 연결 · +100 XP` : null,
    );
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
      collectChips();
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
    const remaining = autopilot ? direction.length() : Infinity;
    direction.normalize();
    const step = Math.min(
      (boost || keys.has("shift") ? 4.5 : 2.7) * delta,
      remaining,
    );
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
    collectChips();
    updateNearby();
    cameraPose();
    return true;
  }
  function pose() {
    chips.forEach(({ mesh, index, collected }) => {
      if (collected) return;
      mesh.position.y = 0.4 + Math.sin(time * 2 + index) * 0.09;
      mesh.rotation.y = time * 0.8 + index;
    });
    robotArm.rotation.y = Math.sin(time * 0.85) * 0.38;
    gpuFans.forEach((fan) => {
      fan.rotation.z = time * 3;
    });
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
    const dt = previous ? Math.min((now - previous) / 1000, 0.2) : 0;
    previous = now;
    // Preserve walking speed on slower GPUs without skipping collision checks.
    let moved = false;
    for (let remaining = dt; remaining > 0;) {
      const step = Math.min(remaining, 0.025);
      moved = move(step) || moved;
      remaining -= step;
    }
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
    motionButton.textContent = paused ? "모션 꺼짐" : "모션 켜짐";
    render();
    if (!paused || hasInput()) wake();
  }
  canvas.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (
      [
        "shift",
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
    const chip = chips.find(
      (c) => !c.collected && raycaster.intersectObject(c.mesh, true).length,
    );
    if (chip) {
      const point = new THREE.Vector3(
        chip.mesh.position.x,
        -0.1,
        chip.mesh.position.z,
      );
      if (reducedMotion.matches) {
        explorer.position.copy(point);
        collectChips();
        cameraPose();
        updateNearby();
        render();
      } else {
        autopilot = { point, zone: null };
        targetRing.position.copy(point);
        targetRing.visible = true;
        wake();
      }
      return;
    }
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
        collectChips();
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
    chips.forEach((chip) => {
      chip.collected = false;
      chip.mesh.visible = true;
    });
    boost = false;
    boostButton.setAttribute("aria-pressed", "false");
    clearTimeout(toastTimer);
    toast.classList.remove("is-visible");
    updateRewards();
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
  boostButton.addEventListener("click", () => {
    boost = !boost;
    boostButton.setAttribute("aria-pressed", String(boost));
    canvas.focus({ preventScroll: true });
  });
  document
    .querySelector("#quality-toggle")
    .addEventListener("click", (event) => {
      highQuality = !highQuality;
      renderer.shadowMap.enabled = highQuality;
      scene.traverse((object) => {
        if (object.material) object.material.needsUpdate = true;
      });
      event.currentTarget.setAttribute("aria-pressed", String(highQuality));
      event.currentTarget.textContent = highQuality
        ? "화질 · 고화질"
        : "화질 · 표준";
      sizeScene();
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
