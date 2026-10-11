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
if (renderer) {
  try { initializeScene(); } catch (error) {
    console.error("Scene initialization failed", error);
    window.dispatchEvent(new Event("identity-scene-unavailable"));
  }
}

function initializeScene() {

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(9, 8, 13);
  camera.lookAt(0, 1, 0);
  scene.add(new THREE.HemisphereLight(0xd5e5ff, 0x10131e, 1.15));
  const key = new THREE.DirectionalLight(0xfff1e3, 4.5);
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
  const rim = new THREE.DirectionalLight(0x9abfff, 3.5);
  rim.position.set(6, 5, -4);
  scene.add(rim);
  // Local studio reflection capture: no external HDR or model download.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x343d50);
  for (const [x, y, z, w, h, intensity] of [
    [-6, 5, 4, 3, 8, 6],
    [6, 3, 1, 2, 7, 5],
    [0, 9, -2, 9, 3, 4],
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
  scene.environmentIntensity = 0.85;
  studio.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
  pmrem.dispose();
  const root = new THREE.Group();
  scene.add(root);
  const colors = { ot: 0xe2ac78, it: 0x83b7ff, ai: 0xb6a1e7 };
  const mat = (color, metalness = 0.3, roughness = 0.42) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const dark = mat(0x151c2a, 0.8, 0.26);
  const highlightedPad = mat(0x526885, 0.15, 0.7);
  const bronze = mat(colors.ot, 0.5);
  const mint = mat(0x477cbc, 0.5);
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
  // Thin machined plinths replace the block-like factory platforms.
  const plinthMetal = new THREE.MeshPhysicalMaterial({color:0x182132,metalness:.86,roughness:.24,clearcoat:.45});
  const plinthTop = new THREE.MeshPhysicalMaterial({color:0x333d4b,metalness:.74,roughness:.3,clearcoat:.25});
  Object.entries(positions).forEach(([id,pos]) => {
    pos.y = 0;
    const group = new THREE.Group();group.position.copy(pos);root.add(group);
    cylinder(group,1.66,.13,plinthMetal,0,-.015,0);
    cylinder(group,1.59,.028,plinthTop,0,.066,0);
    cylinder(group,1.48,.08,dark,0,-.12,0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.63,.012,12,128),glow(id==='ot'?0xd3ae7c:id==='it'?0x7babed:0xb3a0f0));
    rim.rotation.x=Math.PI/2;rim.position.y=-.035;group.add(rim);
    const groove = new THREE.Mesh(new THREE.TorusGeometry(1.48,.006,8,128),mat(0x79869b,.85,.3));
    groove.rotation.x=Math.PI/2;groove.position.y=.083;group.add(groove);
    pads[id]=group;
  });
  // Purpose-built industrial equipment, modeled in real proportions.
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0xd9e0e5,
    metalness: 0.42,
    roughness: 0.24,
    clearcoat: 0.75,
    clearcoatRoughness: 0.16,
  });
  const graphite = mat(0x141b29, 0.68, 0.25),
    steel = mat(0xc8d5e2, 0.94, 0.2),
    rubber = mat(0x111416, 0.05, 0.84);
  const anodized = mat(0x536781, 0.86, 0.24),
    enamel = mat(0x364356, 0.75, 0.28);
  const brushedMap = texture((c,w,h)=>{
    c.fillStyle='#999999';c.fillRect(0,0,w,h);
    for(let y=0;y<h;y++){const shade=120+((y*37)%55);c.strokeStyle=`rgb(${shade},${shade},${shade})`;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  },256,256);
  brushedMap.colorSpace=THREE.NoColorSpace;
  for(const material of [steel,anodized,plinthMetal,plinthTop]){material.bumpMap=brushedMap;material.bumpScale=.002;}
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
      bevelSegments: 4,
      steps: 1,
      bevelSize: r * 0.55,
      bevelThickness: r,
      curveSegments: 8,
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
        c.fillStyle = kind === "ai" ? "#b9b2ed" : "#83b7f2";
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
          c.strokeStyle = "#85b5ff";
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
    color: 0x94b9e8,
    metalness: 0.15,
    roughness: 0.09,
    transparent: true,
    opacity: 0.19,
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

  // Surface detailing: machined collars, panel seams, and status light guides.
  for (const [x,y,z,r] of [[0,0,.15,.21],[-.3,.82,.15,.19],[.44,1.32,.15,.16]]) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(r*.87,.014,12,64),steel);
    collar.position.set(x,y,z+.022);robotArm.add(collar);
    const accent = new THREE.Mesh(new THREE.TorusGeometry(r*.98,.008,8,64),mat(0x5685bf,.7,.24));
    accent.position.set(x,y,z+.026);robotArm.add(accent);
  }
  // Rack mounting rails and ventilation slots emphasize real hardware construction.
  for (const x of [-.96,-.1]) {
    rounded(server,.025,1.83,.035,steel,x,1.12,.27,.006);
    for (let y=.35;y<1.95;y+=.105) box(server,.012,.019,.012,rubber,x,y,.293);
  }
  for (let i=0;i<3;i++) {
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.163,.007,10,64),glow(0x8dabda));
    ring.position.set(-.45,.54+i*.43,.345);ai.add(ring);
  }
  // A studio floor and soft contact pools ground the three products.
  const floor = new THREE.Mesh(new THREE.CircleGeometry(18,96),new THREE.ShadowMaterial({opacity:.22}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.205;floor.receiveShadow=true;root.add(floor);
  const shadowMap=texture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,10,w/2,h/2,w/2);g.addColorStop(0,'rgba(0,0,0,.65)');g.addColorStop(.55,'rgba(0,0,0,.28)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);},256,256);
  Object.entries(positions).forEach(([id,pos],index)=>{
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(4.7,4.7),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));
    shadow.rotation.x=-Math.PI/2;shadow.position.set(pos.x,-.195,pos.z);root.add(shadow);
    const labelTexture=texture((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#bbcce4';c.font='500 30px monospace';c.textAlign='center';c.fillText(['01  /  CONTROL','02  /  SOFTWARE','03  /  INTELLIGENCE'][index],w/2,44);},512,64);
    const label=new THREE.Mesh(new THREE.PlaneGeometry(1.85,.23),new THREE.MeshBasicMaterial({map:labelTexture,transparent:true,depthWrite:false}));
    label.rotation.x=-Math.PI/2;label.position.set(pos.x,-.19,pos.z+2);root.add(label);
  });
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
          color: 0x8cb2ea,
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
  // A studio presentation of the engineering system, without game objects.
  let selected = 'overview', paused = reducedMotion.matches, raf = 0, last = 0, time = 0;
  const focus = new THREE.Vector3(0, 1, 0);
  const desired = new THREE.Vector3(0, 1, 0);
  const pointer = new THREE.Vector2();
  let distance = 15, targetDistance = 15;
  function sizeScene() {
    const width = container.clientWidth, height = container.clientHeight;
    renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio || 1, 1.5), 2, Math.sqrt(6000000 / Math.max(1, width * height))));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = innerWidth < 650 ? 40 : 32;
    camera.updateProjectionMatrix();
    draw(0);
  }
  function draw(delta) {
    const ease = reducedMotion.matches ? 1 : 1 - Math.exp(-delta * 5);
    focus.lerp(desired, ease);
    distance += (targetDistance - distance) * ease;
    camera.position.set(focus.x + distance * .32 + pointer.x * .25, focus.y + distance * .32 + pointer.y * .15, focus.z + distance * .89);
    camera.lookAt(focus);
    robotArm.rotation.y = Math.sin(time * .75) * .3;
    gpuFans.forEach(fan => fan.rotation.z = time * 2);
    particles.forEach(({dot, path, offset}) => dot.position.copy(path.getPointAt((time * .1 + offset) % 1)));
    renderer.render(scene, camera);
  }
  function frame(now) {
    raf = 0;
    if (document.hidden || document.querySelector('dialog[open]')) { last = 0; return; }
    const delta = Math.min((now - (last || now)) / 1000, .05); last = now;
    if (!paused) time += delta;
    draw(delta);
    if (!paused || focus.distanceTo(desired) > .001 || Math.abs(distance-targetDistance) > .001) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function choose(id) {
    selected = id;
    desired.copy(positions[id] || new THREE.Vector3(0,0,0)); desired.y += 1;
    targetDistance = id === 'overview' ? (innerWidth < 650 ? 19.5 : 15) : 8.8;
    if (reducedMotion.matches) { focus.copy(desired); distance = targetDistance; draw(0); }
    wake();
  }
  window.addEventListener('showcase-view', event => choose(event.detail));
  container.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const rect = container.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width - .5, (event.clientY - rect.top) / rect.height - .5); wake();
  });
  container.addEventListener('pointerleave', () => { pointer.set(0,0); wake(); });
  // Selecting a physical device advances to its explanation.
  container.addEventListener('click', event => {
    if (event.target !== canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1), camera);
    const hits = Object.entries(pads).flatMap(([id,pad]) => ray.intersectObject(pad,true).map(hit=>({...hit,id}))).sort((a,b)=>a.distance-b.distance);
    if (hits[0]) document.querySelector('#chapter-'+hits[0].id).scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'});
  });
  function motionLabel() { motionButton.textContent = paused ? 'Play motion' : 'Pause motion'; motionButton.setAttribute('aria-pressed',String(paused)); }
  motionButton.addEventListener('click',()=>{paused=!paused;motionLabel();wake();});
  reducedMotion.addEventListener('change',()=>{paused=reducedMotion.matches;motionLabel();choose(selected);});
  document.addEventListener('visibilitychange',wake);
  window.addEventListener('world-overlay-close',wake);
  new ResizeObserver(()=>{choose(selected);sizeScene();}).observe(container);
  canvas.addEventListener('webglcontextlost', event => {event.preventDefault(); cancelAnimationFrame(raf);container.classList.remove('webgl-ready');window.dispatchEvent(new Event('identity-scene-unavailable'));});
  choose('overview'); sizeScene(); motionLabel();
  container.classList.add('webgl-ready');
  window.dispatchEvent(new Event('showcase-ready'));
  wake();
}
