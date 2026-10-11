import * as THREE from './vendor/three.module.min.js';
const container = document.querySelector('#scene-viewport');
const canvas = document.querySelector('#identity-canvas');
const motionButton = document.querySelector('#motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  initializeLab();
} catch (error) {
  console.error('Lab initialization failed', error);
  window.dispatchEvent(new Event('identity-scene-unavailable'));
}
function initializeLab() {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 80);
  const root = new THREE.Group(); scene.add(root);
  scene.add(new THREE.HemisphereLight(0xc8dfff, 0x252537, 1.9));
  const key = new THREE.DirectionalLight(0xffe5c7, 4);
  key.position.set(-4, 8, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .1, far: 30 });
  key.shadow.normalBias = .025; key.shadow.bias = -.00015; scene.add(key);
  const rim = new THREE.DirectionalLight(0x94baff, 2.8); rim.position.set(5, 5, -3); scene.add(rim);
  const studio = new THREE.Scene(); studio.background = new THREE.Color(0x4c566b);
  for (const [x,y,z,w,h] of [[-5,4,3,3,6],[5,4,0,2,7],[0,8,-3,7,3]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(4,4,4),side:THREE.DoubleSide}));
    panel.position.set(x,y,z); panel.lookAt(0,0,0); studio.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio,.04).texture; scene.environmentIntensity = .55;
  studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();}); pmrem.dispose();
  const mat = (color, metalness=.2, roughness=.5) => new THREE.MeshStandardMaterial({color,metalness,roughness});
  const steel = mat(0xbfcbd8,.9,.25), graphite = mat(0x182331,.6,.32), rubber = mat(0x101921,.05,.85);
  const paint = new THREE.MeshPhysicalMaterial({color:0xd9e2e7,metalness:.4,roughness:.26,clearcoat:.6});
  const accent = mat(0x527ea8,.65,.3), paper = mat(0xc6c4b7,.03,.9);
  function box(parent,w,h,d,material,x=0,y=0,z=0) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material); mesh.position.set(x,y,z);
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(parent,r,h,material,x=0,y=0,z=0) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,48),material);mesh.position.set(x,y,z);
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function rounded(parent,w,h,d,material,x=0,y=0,z=0,r=.025) {
    r=Math.min(r,w/5,h/5,d/5); const shape=new THREE.Shape(),a=w/2-r,b=h/2-r;
    shape.moveTo(-a,-b-r);shape.lineTo(a,-b-r);shape.quadraticCurveTo(a+r,-b-r,a+r,-b);shape.lineTo(a+r,b);shape.quadraticCurveTo(a+r,b+r,a,b+r);shape.lineTo(-a,b+r);shape.quadraticCurveTo(-a-r,b+r,-a-r,b);shape.lineTo(-a-r,-b);shape.quadraticCurveTo(-a-r,-b-r,-a,-b-r);
    const geo=new THREE.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r*.55,bevelThickness:r,curveSegments:6});geo.translate(0,0,-d/2+r);
    const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cable(parent,points,r=.02,color=0x172433) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,24,r,8,false),mat(color,.2,.6));mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function texture(draw,w=1024,h=512) {
    const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return t;
  }
  const woodMap=texture((c,w,h)=>{c.fillStyle='#78624e';c.fillRect(0,0,w,h);for(let y=0;y<h;y++){c.strokeStyle=`rgba(${y%2?30:200},${y%2?26:169},${y%2?22:127},${.015+(y*17%11)/240})`;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(w*.3,y+Math.sin(y)*4,w*.7,y-3,w,y+2);c.stroke();}},1024,512);
  const oak=new THREE.MeshStandardMaterial({map:woodMap,roughness:.5,metalness:.08});
  const glow=color=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.65,roughness:.4});
  function screen(parent,w,h,x,y,z,map) {
    rounded(parent,w+.08,h+.08,.07,graphite,x,y,z,.024);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,toneMapped:false}));mesh.position.set(x,y,z+.045);parent.add(mesh);return mesh;
  }
  const interactive=[];
  function target(group,project,anchor,label) { interactive.push({group,project,anchor:new THREE.Vector3(...anchor),label}); }
  const noteMap=(heading,lines)=>texture((c,w,h)=>{
    c.fillStyle='#132136';c.fillRect(0,0,w,h);c.fillStyle='#9fbddf';c.font='24px monospace';c.fillText(heading,38,54);
    c.strokeStyle='#3a5575';c.beginPath();c.moveTo(38,78);c.lineTo(w-38,78);c.stroke();
    lines.forEach((line,i)=>{c.fillStyle=i%3===0?'#e0d4b9':'#b0c4dc';c.font='23px monospace';c.fillText(line,38,130+i*43);});
  });
  // Cutaway architecture, warm wood, and a cool task wall establish a personal place.
  rounded(root,7.6,.2,5.1,graphite,0,-.13,0,.08);
  box(root,7.4,.025,4.9,mat(0x434958,.2,.75),0,-.018,0);
  for(let x=-3.4;x<3.7;x+=.55)box(root,.009,.003,4.8,mat(0x252d3d,.1,.8),x,0,0);
  rounded(root,7.55,2.95,.14,mat(0x263547,.2,.7),0,1.38,-2.45,.035);
  // A short side wall leaves the scene open to the viewer.
  rounded(root,.13,1.25,4.9,mat(0x293747,.2,.7),-3.7,.55,0,.035);
  box(root,7.2,.028,.032,glow(0x809bb9),0,2.8,-2.34);
  for(let x=-3.5;x<3.55;x+=.18)box(root,.012,2.68,.014,mat(0x334256,.15,.75),x,1.38,-2.365);
  const sign=noteMap('EONSANG SON', ['BUILD. TEST. UNDERSTAND.','SOFTWARE / AUTOMATION / AI']);
  screen(root,1.75,.86,-2.48,2.14,-2.33,sign);
  // Main desk: an actual project record and an illustrative code workspace.
  const desk=new THREE.Group();desk.position.set(-.9,0,.7);root.add(desk);
  rounded(desk,3.15,.115,1.35,oak,0,1.02,0,.045);
  for(const x of [-1.31,1.31]){box(desk,.065,.94,.82,graphite,x,.48,0);box(desk,.34,.05,.95,graphite,x,.035,0);}
  rounded(desk,1.5,.015,.57,rubber,-.15,1.089,.24,.025);
  const loader=new THREE.TextureLoader();
  const codeMap=noteMap('PLC AI STUDIO / CONCEPT', ['program = parse(source)','context = trace_signals(program)','checks = validate(context)','review = engineer.review(checks)','', '// AI assists. Engineers decide.']);
  const waterGroup=new THREE.Group();desk.add(waterGroup);
  let waterTexture=loader.load('./assets/lab/water.webp',()=>wake(),undefined,()=>{});waterTexture.colorSpace=THREE.SRGBColorSpace;
  screen(waterGroup,1.45,.87,-.6,1.77,-.32,waterTexture);
  box(waterGroup,.07,.29,.07,steel,-.6,1.22,-.34);rounded(waterGroup,.4,.025,.28,graphite,-.6,1.11,-.22);
  const aiDisplay=new THREE.Group();desk.add(aiDisplay);
  screen(aiDisplay,1.16,.87,.8,1.77,-.29,codeMap);box(aiDisplay,.055,.29,.055,steel,.8,1.22,-.32);rounded(aiDisplay,.34,.025,.26,graphite,.8,1.11,-.23);
  target(waterGroup,'water',[-1.5,2.42,.36],'SCADA project');
  target(aiDisplay,'plc-ai',[-.1,2.42,.41],'PLC AI Studio');
  const keyboard=rounded(desk,.82,.035,.28,mat(0x616b7a,.35,.45),-.3,1.12,.31,.018);
  for(let row=0;row<4;row++)for(let col=0;col<14;col++)box(desk,.04,.01,.042,row===0?accent:graphite,-.67+col*.055,1.145,.215+row*.055);
  rounded(desk,.10,.04,.15,paint,.45,1.125,.32,.02);
  cable(desk,[[-.6,1.69,-.39],[-.6,1.05,-.58],[.9,.85,-.55],[1.2,.2,-.5]],.016);
  // A desk lamp casts warm light onto the notebook rather than decorative neon.
  cylinder(desk,.15,.035,graphite,-1.25,1.11,-.27);
  cylinder(desk,.027,.64,steel,-1.25,1.43,-.27);
  const shade=new THREE.Mesh(new THREE.ConeGeometry(.19,.23,48,1,true),mat(0x7c8d9f,.75,.25));shade.rotation.z=-.5;shade.position.set(-1.12,1.81,-.2);desk.add(shade);
  const lamp=new THREE.PointLight(0xffd6a0,2.5,3);lamp.position.set(-1.04,1.7,-.1);desk.add(lamp);
  const mug=cylinder(desk,.075,.17,mat(0xc9beb0,.1,.6),1.27,1.2,.25);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.058,.012,8,32),mat(0xc9beb0,.1,.6));handle.position.set(1.36,1.23,.25);desk.add(handle);
  cylinder(desk,.063,.003,mat(0x35231b,.05,.6),1.27,1.287,.25);
  // Chair and under-desk compute tower keep the room grounded in everyday development.
  const chair=new THREE.Group();chair.position.set(-.75,0,1.95);root.add(chair);
  cylinder(chair,.045,.45,steel,0,.28,0);rounded(chair,.63,.12,.6,graphite,0,.55,0,.065);
  rounded(chair,.6,.66,.11,mat(0x33445b,.15,.75),0,.91,.28,.055);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const arm=box(chair,.045,.035,.42,steel,Math.sin(a)*.18,.10,Math.cos(a)*.18);arm.rotation.y=a;cylinder(chair,.045,.06,rubber,Math.sin(a)*.36,.047,Math.cos(a)*.36);}
  rounded(desk,.38,.69,.64,graphite,1.03,.37,-.06,.04);
  for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.09,.009,10,40),accent);ring.position.set(1.03,.21+i*.17,.27);desk.add(ring);}
  // Rear bench: prototype hardware and a reusable miniature industrial robot.
  const bench=new THREE.Group();bench.position.set(2.03,0,-1.35);root.add(bench);
  rounded(bench,2.62,.09,1.20,oak,0,.96,0,.035);
  for(const x of [-1.05,1.05])for(const z of [-.42,.42])box(bench,.055,.90,.055,steel,x,.48,z);
  rounded(bench,.62,.12,.4,graphite,-.68,1.07,.03,.02);
  for(let i=0;i<8;i++){box(bench,.042,.09,.14,steel,-.91+i*.066,1.17,.06);box(bench,.016,.015,.012,glow(0x7aa5a0),-.91+i*.066,1.225,.14);}
  cable(bench,[[-.87,1.21,.08],[-.85,1.32,.32],[-.4,1.12,.4],[.22,1.04,.15]],.012,0x6a8296);
  target(bench,'embedded',[2.35,2.60,-1.30],'Control software');
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
  robot.position.set(.32,1.0,-.12);
  robot.scale.setScalar(.58);
  bench.add(robot);
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
  // Tool board and project reference mounted above the bench.
  const controllerTexture=loader.load('./assets/lab/controller.webp',()=>wake(),undefined,()=>{});controllerTexture.colorSpace=THREE.SRGBColorSpace;
  screen(root,1.15,.65,2.6,2.29,-2.33,controllerTexture);
  const board=new THREE.Group();board.position.set(.88,1.86,-2.33);root.add(board);
  box(board,1.4,.78,.04,mat(0x607184,.55,.45));
  for(let y=-.32;y<.34;y+=.12)for(let x=-.61;x<.63;x+=.12){const hole=cylinder(board,.013,.008,rubber,x,y,.025);hole.rotation.x=Math.PI/2;}
  for(let i=0;i<4;i++){box(board,.045,.26,.05,steel,-.45+i*.23,0,.07);rounded(board,.08,.18,.055,i===1?accent:graphite,-.45+i*.23,-.17,.072,.015);}
  // Notebook: a personal route to experience, not a fabricated document or certificate.
  const notebook=new THREE.Group();notebook.position.set(-1.97,1.1,1.03);notebook.rotation.y=-.18;root.add(notebook);
  rounded(notebook,.5,.035,.66,mat(0x1d2c3d,.05,.8),0,0,0,.016);
  const notes=texture((c,w,h)=>{c.fillStyle='#d4ccb8';c.fillRect(0,0,w,h);c.fillStyle='#314355';c.font='bold 48px sans-serif';c.fillText('FIELD NOTES',44,76);c.font='29px monospace';['Eonsang Son','', 'Observe the process.','Build the software.','Test on the bench.','Keep learning.'].forEach((t,i)=>c.fillText(t,44,135+i*52));},512,640);
  const page=new THREE.Mesh(new THREE.PlaneGeometry(.46,.60),new THREE.MeshBasicMaterial({map:notes}));page.rotation.x=-Math.PI/2;page.position.y=.022;notebook.add(page);
  const pen=cylinder(notebook,.012,.45,steel,.32,.023,0);pen.rotation.x=Math.PI/2;
  target(notebook,'experience',[-1.97,1.22,1.08],'Field notes');
  // Small shelf, books and a plant soften the technical workspace.
  rounded(root,1.7,.07,.38,oak,-.6,2.36,-2.19,.025);
  const bookColors=[0x718297,0x475e7c,0x9b8771,0x293f58];
  for(let i=0;i<4;i++)box(root,.12,.38+(i%2)*.07,.22,mat(bookColors[i],.05,.85),-1.21+i*.14,2.59,-2.16);
  const plant=new THREE.Group();plant.position.set(-2.8,0,-1.6);plant.scale.setScalar(1.3);root.add(plant);
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(.25,.19,.42,40),mat(0x8f8275,.1,.7));pot.position.y=.24;pot.castShadow=true;plant.add(pot);
  for(let i=0;i<9;i++){
    const a=i*2.4, h=.65+(i%4)*.12;
    cable(plant,[[0,.4,0],[Math.sin(a)*.12,h*.75,Math.cos(a)*.12],[Math.sin(a)*.22,h,Math.cos(a)*.22]],.009,0x344638);
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),mat(i%2?0x426350:0x607c61,.03,.8));leaf.scale.set(.07,.24,.025);leaf.position.set(Math.sin(a)*.24,h,Math.cos(a)*.24);leaf.rotation.set(.1,a,-Math.sin(a)*.6);plant.add(leaf);
  }
  // Wire the four matching HTML hotspots to physical points in the room.
  const markers=interactive.map(item=>({...item,element:document.querySelector(`[data-lab-project="${item.project}"]`)}));
  let selected='room', paused=reducedMotion.matches, raf=0, last=0, time=0, disposed=false;
  const focus=new THREE.Vector3(0,1,-.1), desired=focus.clone();
  let distance=12.5, targetDistance=12.5;
  const pointer=new THREE.Vector2();
  const views={room:{focus:[0,1,-.1],distance:12.5},desk:{focus:[-.8,1.4,.65],distance:7.5},bench:{focus:[2,1.45,-1.3],distance:7.4},notes:{focus:[-1.3,1.25,.8],distance:7.5}};
  function updateMarkers(){
    for(const item of markers){
      const p=item.anchor.clone().project(camera);
      item.element.style.left=`${(p.x+1)*.5*container.clientWidth}px`;
      item.element.style.top=`${(1-p.y)*.5*container.clientHeight}px`;
      item.element.hidden=Math.abs(p.x)>.91 || Math.abs(p.y)>.88;
    }
  }
  function draw(delta=0){
    const easing=reducedMotion.matches?1:1-Math.exp(-delta*5);
    focus.lerp(desired,easing);distance+=(targetDistance-distance)*easing;
    camera.position.set(focus.x+distance*.43+pointer.x*.18,focus.y+distance*.47+pointer.y*.10,focus.z+distance*.79);
    camera.lookAt(focus);camera.updateMatrixWorld();
    robotArm.rotation.y=Math.sin(time*.5)*.18;
    renderer.render(scene,camera);updateMarkers();
  }
  function frame(now){
    raf=0;
    if(disposed || document.hidden || document.querySelector('dialog[open]')){last=0;return;}
    const delta=Math.min((now-(last||now))/1000,.05);last=now;
    if(!paused)time+=delta;draw(delta);
    if(!paused || focus.distanceTo(desired)>.001 || Math.abs(distance-targetDistance)>.001)raf=requestAnimationFrame(frame);
  }
  function wake(){if(!disposed && !raf){last=0;raf=requestAnimationFrame(frame);}}
  function choose(id){
    const view=views[id]||views.room;selected=id;desired.set(...view.focus);
    targetDistance=view.distance*(innerWidth<650?(id==='room' && innerHeight>700?1.34:1.2):1);
    if(reducedMotion.matches){focus.copy(desired);distance=targetDistance;draw();}wake();
  }
  function resize(){
    const w=container.clientWidth,h=container.clientHeight;
    renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,1.4),2,Math.sqrt(5500000/Math.max(1,w*h))));renderer.setSize(w,h,false);
    camera.aspect=w/Math.max(1,h);camera.fov=innerWidth<650?39:33;camera.updateProjectionMatrix();choose(selected);draw();
  }
  window.addEventListener('lab-view',e=>choose(e.detail));
  function objectAt(event){
    const r=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1),camera);
    return interactive.flatMap(item=>ray.intersectObject(item.group,true).map(hit=>({...hit,project:item.project}))).sort((a,b)=>a.distance-b.distance)[0];
  }
  container.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse')return;
    const hit=e.target===canvas?objectAt(e):null;
    markers.forEach(item=>item.element.classList.toggle('is-hovered',item.project===hit?.project));
    canvas.style.cursor=hit?'pointer':'default';
    if(reducedMotion.matches)return;
    const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5);wake();
  });
  container.addEventListener('pointerleave',()=>{pointer.set(0,0);markers.forEach(item=>item.element.classList.remove('is-hovered'));wake();});
  canvas.addEventListener('click',e=>{const hit=objectAt(e);if(hit)document.querySelector(`[data-lab-project="${hit.project}"]`).click();});
  function motionLabel(){motionButton.textContent=paused?'Play motion':'Pause motion';motionButton.setAttribute('aria-pressed',String(paused));}
  motionButton.addEventListener('click',()=>{paused=!paused;motionLabel();wake();});
  reducedMotion.addEventListener('change',()=>{paused=reducedMotion.matches;motionLabel();choose(selected);});
  document.addEventListener('visibilitychange',wake);window.addEventListener('world-overlay-close',wake);
  new ResizeObserver(resize).observe(container);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();disposed=true;cancelAnimationFrame(raf);container.classList.remove('webgl-ready');window.dispatchEvent(new Event('identity-scene-unavailable'));});
  resize();motionLabel();container.classList.add('webgl-ready');window.dispatchEvent(new Event('lab-ready'));wake();
}
