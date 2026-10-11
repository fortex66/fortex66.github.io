import * as THREE from './vendor/three.module.min.js';

const container = document.querySelector('#scene-viewport');
const canvas = document.querySelector('#identity-canvas');
const motionButton = document.querySelector('#motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  initialize().catch(unavailable);
} catch (error) { unavailable(error); }
function unavailable(error) {
  console.warn('The 3D portfolio is unavailable.', error);
  window.dispatchEvent(new Event('identity-scene-unavailable'));
}

async function initialize() {
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.22;
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x0c162a,.018);
  const camera=new THREE.PerspectiveCamera(39,1,.1,200);
  const hemisphere=new THREE.HemisphereLight(0xd9e5ff,0x182947,2.1);scene.add(hemisphere);
  const key=new THREE.DirectionalLight(0xf0f3ff,4.1);key.position.set(-4,7,8);scene.add(key);
  const rim=new THREE.DirectionalLight(0x679cff,5);rim.position.set(6,3,-6);scene.add(rim);
  // Procedural studio reflections: local, deterministic, no HDR downloads.
  const studio=new THREE.Scene();studio.background=new THREE.Color(0x213759);
  for(const [x,y,z,w,h,intensity] of [[-6,5,4,3,10,5],[6,3,2,2,12,4],[0,8,-4,12,2,5],[0,-5,3,8,1,2]]){
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(intensity,intensity,intensity),side:THREE.DoubleSide}));
    panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);
  }
  const pmrem=new THREE.PMREMGenerator(renderer), environment=pmrem.fromScene(studio,.035);
  scene.environment=environment.texture;scene.environmentIntensity=.85;
  studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});pmrem.dispose();
  let letters=null;
  try {const r=await fetch('./assets/immersive/letterforms.json');if(r.ok)letters=await r.json();} catch { /* Use texture lettering if the optional outlines cannot load. */ }
  const chrome=new THREE.MeshPhysicalMaterial({color:0xc7daee,metalness:.98,roughness:.19,clearcoat:.85,clearcoatRoughness:.14});
  const porcelain=new THREE.MeshPhysicalMaterial({color:0xd6e5f6,metalness:.5,roughness:.26,clearcoat:.8});
  const dark=new THREE.MeshStandardMaterial({color:0x10213b,metalness:.8,roughness:.28});
  const black=new THREE.MeshStandardMaterial({color:0x07101f,metalness:.55,roughness:.3});
  const blue=new THREE.MeshPhysicalMaterial({color:0x2869cc,metalness:.72,roughness:.22,clearcoat:1});
  const soft=new THREE.MeshStandardMaterial({color:0xabc2e0,metalness:.45,roughness:.35});
  const luminous=new THREE.MeshBasicMaterial({color:0x80b7ff});
  const wireMat=new THREE.LineBasicMaterial({color:0x6685b1,transparent:true,opacity:.32});
  const groups=[], pickables=[], animators=[];
  let raf=0,last=0,time=0,paused=reducedMotion.matches,disposed=false;
  let selected=+document.querySelector('.exhibit').dataset.chapter||0,current=selected,overview=false,overviewMix=0;
  let pointer=new THREE.Vector2(),targetPointer=new THREE.Vector2(),portrait=false;
  function texture(draw,w=1024,h=640){
    const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return t;
  }
  function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
  function box(parent,w,h,d,material,x=0,y=0,z=0){return mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
  function rounded(parent,w,h,d,material,x=0,y=0,z=0,r=.06){
    r=Math.min(r,w/4,h/4);const s=new THREE.Shape(),a=w/2-r,b=h/2-r;
    s.moveTo(-a,-b-r);s.lineTo(a,-b-r);s.quadraticCurveTo(a+r,-b-r,a+r,-b);s.lineTo(a+r,b);s.quadraticCurveTo(a+r,b+r,a,b+r);s.lineTo(-a,b+r);s.quadraticCurveTo(-a-r,b+r,-a-r,b);s.lineTo(-a-r,-b);s.quadraticCurveTo(-a-r,-b-r,-a,-b-r);
    const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:3,curveSegments:10,steps:1});g.translate(0,0,-d/2);
    return mesh(parent,g,material,x,y,z);
  }
  function tube(parent,points,radius,material){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(parent,new THREE.TubeGeometry(curve,64,radius,12,false),material);}
  function ring(parent,radius,tubeRadius,x=0,y=0,z=0,material=chrome){return mesh(parent,new THREE.TorusGeometry(radius,tubeRadius,20,160),material,x,y,z);}
  function textMap(title,subtitle='',label=''){
    return texture((c,w,h)=>{
      c.fillStyle='#0d1b31';c.fillRect(0,0,w,h);c.strokeStyle='#354f73';c.strokeRect(1,1,w-2,h-2);
      c.fillStyle='#8caedc';c.font='18px monospace';c.fillText(label,46,55);
      c.fillStyle='#e4ecf8';c.font='500 49px Arial';title.split('\n').forEach((line,i)=>c.fillText(line,44,140+i*62));
      c.fillStyle='#9dafc8';c.font='22px Arial';subtitle.split('\n').forEach((line,i)=>c.fillText(line,46,h-95+i*34));
      c.fillStyle='#7196c6';c.fillRect(46,h-30,60,2);
    },1024,512);
  }
  function text3D(parent,text,size,x,y,z,material=chrome){
    const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
    if(!letters){const t=texture((c,w,h)=>{c.fillStyle='#d6e5f8';c.font='bold 150px Arial';c.fillText(text,0,170)},1024,220);const p=mesh(g,new THREE.PlaneGeometry(size*text.length*.77,size*.9),new THREE.MeshBasicMaterial({map:t,transparent:true}));return g;}
    let advance=0;
    for(const ch of text){
      const glyph=letters[ch];if(!glyph){advance+=size*.35;continue;}
      const path=new THREE.ShapePath();
      for(const [cmd,...v] of glyph.paths){
        if(cmd==='m')path.moveTo(v[0],v[1]);
        if(cmd==='l')path.lineTo(v[0],v[1]);
        if(cmd==='q')path.quadraticCurveTo(...v);
        if(cmd==='c')path.bezierCurveTo(...v);
        if(cmd==='z')path.currentPath.closePath();
      }
      const geometry=new THREE.ExtrudeGeometry(path.toShapes(),{depth:.12,bevelEnabled:true,bevelThickness:.012,bevelSize:.007,bevelSegments:3,curveSegments:9,steps:1});
      const letter=mesh(g,geometry,material,advance);letter.scale.setScalar(size);advance+=(glyph.advance+.012)*size;
    }
    for(const m of g.children)m.position.x-=advance/2;
    return g;
  }
  function panel(parent,map,w,h,x,y,z,project,material=dark){
    const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
    rounded(g,w+.13,h+.13,.13,material);
    mesh(g,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,toneMapped:false}),0,0,.084);
    if(project)pickables.push({group:g,project,chapter:groups.indexOf(parent)});
    return g;
  }
  function thinOrbit(parent,radius,x,y,z){
    const points=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*radius,Math.sin(a)*radius,0));}
    const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),wireMat);l.position.set(x,y,z);parent.add(l);return l;
  }
  function base(){const g=new THREE.Group();g.position.x=groups.length*18;scene.add(g);groups.push(g);return g;}
  // Original diagrams, derived from the public project descriptions. No screenshots.
  function diagramMap(kind) {
    return texture((c,w,h)=>{
      const light=kind==='water'||kind==='battery';
      const bg=light?'#dbe5f0':'#101f37', ink=light?'#172f4f':'#e1eafa', muted=light?'#506f95':'#89a6ce', line=light?'#7c9cc2':'#42628d';
      c.fillStyle=bg;c.fillRect(0,0,w,h);
      c.strokeStyle=light?'#c6d4e5':'#192e4b';c.lineWidth=1;
      for(let x=0;x<w;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
      for(let y=0;y<h;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
      const heading=(title,label)=>{c.fillStyle=muted;c.font='17px monospace';c.fillText(label,44,47);c.fillStyle=ink;c.font='500 47px Arial';c.fillText(title,42,115);};
      const node=(x,y,width,height,title,detail)=>{
        c.fillStyle=light?'#eff4fa':'#172c49';c.strokeStyle=line;c.lineWidth=2;c.beginPath();c.roundRect(x,y,width,height,9);c.fill();c.stroke();
        c.fillStyle=ink;c.font='500 27px Arial';c.fillText(title,x+20,y+42);c.fillStyle=muted;c.font='19px Arial';c.fillText(detail,x+20,y+76);
      };
      const connector=(x,y,x2,y2)=>{c.strokeStyle=line;c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();c.fillStyle=ink;c.beginPath();c.arc(x2,y2,4,0,Math.PI*2);c.fill();};
      if(kind==='water'){
        heading('Water Treatment SCADA','SYSTEM ARCHITECTURE / INDUSTRIAL WEB');
        node(44,190,280,114,'01  Field equipment','PLC / sensors');
        node(392,190,280,114,'02  Communication','Modbus TCP');
        node(392,385,280,114,'03  Data platform','Node.js + MySQL');
        node(738,385,240,114,'04  Web app','React');
        connector(324,247,392,247);connector(532,304,532,385);connector(672,441,738,441);
        // A tank and its sensor represent the process without inventing live data.
        c.strokeStyle=line;c.lineWidth=3;c.strokeRect(91,378,100,119);c.beginPath();c.ellipse(141,378,50,12,0,0,Math.PI*2);c.stroke();
        c.fillStyle='#a7c3e3';c.fillRect(95,438,92,55);connector(191,449,257,449);connector(257,449,257,331);
      }else if(kind==='controller'){
        heading('Industrial control','SOFTWARE ARCHITECTURE / EMBEDDED');
        ['Qt / QML interface','C++ control & communication','Linux / ARM platform'].forEach((label,i)=>{
          const y=182+i*111;c.fillStyle=['#2c527e','#244263','#1b3454'][i];c.strokeStyle='#779dc9';c.lineWidth=2;c.beginPath();c.roundRect(80,y,w-160,87,8);c.fill();c.stroke();
          c.fillStyle='#aec6e6';c.font='20px monospace';c.fillText('0'+(i+1),105,y+52);c.fillStyle='#edf3fc';c.font='30px Arial';c.fillText(label,177,y+53);
          if(i<2)connector(512,y+87,512,y+111);
        });
      }else if(kind==='battery'){
        heading('EV Battery Management','SENSORS / THERMAL MANAGEMENT / CONTROL');
        for(let i=0;i<5;i++){
          c.strokeStyle=line;c.lineWidth=3;c.beginPath();c.roundRect(81+i*93,200,70,185,8);c.stroke();c.fillStyle='#9cbadb';c.fillRect(90+i*93,262,52,113);c.fillStyle=ink;c.fillRect(103+i*93,189,25,11);
        }
        node(650,225,310,114,'Temperature data','Sensor integration');node(650,415,310,114,'Control','Charge / discharge');
        connector(520,294,650,282);connector(805,339,805,415);
        c.fillStyle=muted;c.font='22px Arial';c.fillText('Observe → evaluate → control',83,458);
      }else if(kind==='journey'){
        heading('JourneyMate','REACT / REAL-TIME COLLABORATION');
        node(64,205,355,124,'Discover','Travel information');node(605,205,355,124,'Collaborate','Shared workspace');
        node(334,405,355,124,'Keep in touch','Real-time chat');
        connector(419,267,605,267);connector(241,329,334,466);connector(783,329,689,466);
      }
      c.fillStyle=muted;c.font='16px monospace';c.fillText('PROJECT OVERVIEW / CONCEPTUAL SYSTEM DIAGRAM',44,h-25);
    },1024,640);
  }
  const water=diagramMap('water'),controller=diagramMap('controller');
  const journey=diagramMap('journey'),battery=diagramMap('battery');


  // 01. A monumental signature, reflected in a continuous machined ribbon.
  const identity=base();
  const signature=new THREE.Group();identity.add(signature);signature.rotation.set(.04,-.12,-.055);
  text3D(signature,'EONSANG',1.7,0,1.45,.4,porcelain);
  text3D(signature,'SON',2.25,.45,-.65,.7,porcelain);
  const ribbon=mesh(identity,new THREE.TorusKnotGeometry(2.45,.15,300,24,2,3),chrome,1.65,.8,-1.3);ribbon.scale.set(1.3,.86,.75);ribbon.rotation.set(.8,.45,.25);
  const orbit=thinOrbit(identity,4.4,0,.9,-2.4);orbit.rotation.set(.72,.35,.2);
  for(let i=0;i<5;i++){const a=i*1.3;mesh(identity,new THREE.SphereGeometry(.045,18,14),soft,Math.cos(a)*4.4,.9+Math.sin(a)*3.2,-1.8);}
  animators.push(t=>{ribbon.rotation.y=.45+Math.sin(t*.13)*.13;signature.rotation.y=-.12+Math.sin(t*.2)*.035;});

  // 02. Real chronology, in spatial layers rather than a desk or generic equipment trio.
  const experience=base();
  const timeline=new THREE.Group();experience.add(timeline);timeline.rotation.set(.02,-.18,-.03);
  const dates=[{x:-2.5,y:-.65,z:-.8,year:'2018',title:'Computer Science',sub:'Bachelor’s Degree\n2018.03 — 2025.02',label:'01 / EDUCATION'},
    {x:0,y:.1,z:.15,year:'2020',title:'Software Developer',sub:'Automation Company\n2020.10 — 2023.06',label:'02 / PROFESSIONAL EXPERIENCE'},
    {x:2.5,y:.85,z:.9,year:'2025',title:'SL Corporation',sub:'Production Engineering Center\n2025.07 — PRESENT',label:'03 / CURRENT'}];
  for(const d of dates){
    const node=new THREE.Group();node.position.set(d.x,d.y,d.z);timeline.add(node);
    text3D(node,d.year,.62,0,1.2,0,porcelain);
    panel(node,textMap(d.title,d.sub,d.label),2.45,1.23,0,.25,0,'experience');
    const hoop=ring(node,.14,.025,0,-.65,0,chrome);
    box(node,.012,.5,.012,soft,0,-.28,0);
  }
  tube(timeline,[[-3.8,-1.7,-1.6],[-2.5,-1.3,-.8],[0,-.55,.15],[2.5,.2,.9],[3.8,.6,1.3]],.025,chrome);
  const trajectory=thinOrbit(experience,3.8,0,.35,-2);trajectory.rotation.x=1.05;
  animators.push(t=>timeline.rotation.y=-.18+Math.sin(t*.2)*.04);

  // 03. A suspended program architecture, distinctly labelled as an illustrative model.
  const ai=base();
  const core=mesh(ai,new THREE.IcosahedronGeometry(.8,3),chrome,0,.8,.35);
  const shell=ring(ai,1.13,.025,0,.8,.35,luminous);shell.rotation.x=.7;
  const shell2=ring(ai,1.38,.018,0,.8,.35,chrome);shell2.rotation.y=1.05;
  const logicTexture=texture((c,w,h)=>{
    c.fillStyle='#0d1c33';c.fillRect(0,0,w,h);c.fillStyle='#a6caff';c.font='17px monospace';c.fillText('PLC AI STUDIO  /  PROGRAM MODEL',38,44);
    c.strokeStyle='#537bab';c.lineWidth=3;
    for(let row=0;row<4;row++){
      let y=110+row*78;c.beginPath();c.moveTo(55,y);c.lineTo(w-55,y);c.stroke();
      for(let col=0;col<3;col++){let x=180+col*230;c.fillStyle='#0d1c33';c.fillRect(x-45,y-25,100,50);c.strokeRect(x-45,y-25,100,50);c.fillStyle=row===2?'#d6e6ff':'#9cbae0';c.font='18px monospace';c.fillText(['INPUT','CHECK','OUTPUT'][col],x-36,y+7);}
    }
    c.fillStyle='#8ca4c7';c.font='16px monospace';c.fillText('CONCEPT VISUAL · NOT A PRODUCT SCREENSHOT',38,h-25);
  },1024,460);
  const logic=panel(ai,logicTexture,4.8,2.16,-.65,.75,-.9,'plc-ai');logic.rotation.y=.08;
  const review=panel(ai,textMap('Human review','AI assists. Engineers decide.','VALIDATION / RULES + CONTEXT'),2.55,1.27,1.75,-.25,1.3,'plc-ai');review.rotation.y=-.23;
  core.position.set(2.25,1.9,.2);shell.position.copy(core.position);shell2.position.copy(core.position);
  for(let i=0;i<6;i++){const angle=i/6*Math.PI*2;const dot=mesh(ai,new THREE.SphereGeometry(.055,16,12),luminous,2.25+Math.cos(angle)*1.2,1.9+Math.sin(angle)*1.2,.2);}
  animators.push(t=>{core.rotation.set(t*.12,t*.15,0);shell.rotation.z=t*.12;shell2.rotation.x=t*.1;review.position.y=-.25+Math.sin(t*.6)*.035;});

  // 04. An original SCADA architecture diagram, held inside a precise floating instrument frame.
  const scada=base();
  const dashboard=panel(scada,water,5.8,3.3,0,.85,.3,'water',chrome);dashboard.rotation.set(.03,-.14,-.045);
  rounded(dashboard,5.1,.035,.05,luminous,0,-1.77,0,.01);
  const sidePanel=panel(scada,textMap('Plant → browser','Modbus TCP / Node.js / React','WATER TREATMENT SCADA'),2.9,1.45,-1.7,-1.15,1.1,'water');sidePanel.rotation.y=.15;
  tube(scada,[[-4,-1.5,-1],[-3.6,1.8,-1.5],[-1,2.8,-1.6],[3.3,2.3,-1],[3.8,-.7,-.6],[1,-1.8,-.5]],.065,chrome);
  const waterPulse=mesh(scada,new THREE.SphereGeometry(.09,20,16),luminous);
  animators.push(t=>{dashboard.rotation.y=-.14+Math.sin(t*.25)*.025;waterPulse.position.set(-3.6,Math.sin(t)*1.2,-1);});

  // 05. A disassembled industrial controller: enclosure, circuit, and a software-layer diagram.
  const industrial=base();
  const instrument=new THREE.Group();industrial.add(instrument);instrument.rotation.set(.06,-.3,.025);
  const housing=rounded(instrument,4.5,2.9,.4,dark,0,.7,-.55,.14);
  for(let i=0;i<12;i++)box(instrument,.035,1.95,.035,black,-1.92+i*.1,.75,-.315);
  const pcb=rounded(instrument,3.7,2.3,.07,new THREE.MeshStandardMaterial({color:0x143c52,roughness:.5,metalness:.4}),0,.7,-.1);
  for(let i=0;i<7;i++){
    rounded(instrument,.3,.33,.12,black,-1.3+(i%4)*.75,.3+Math.floor(i/4)*.85,.02,.02);
    box(instrument,.6,.014,.008,soft,-1.25+(i%4)*.75,.12+Math.floor(i/4)*.8,-.05);
  }
  const display=panel(instrument,controller,3.95,2.4,0,.78,.7,'embedded',chrome);
  for(const x of [-2.06,2.06])for(const y of [-.52,2.05]){const screw=mesh(instrument,new THREE.CylinderGeometry(.055,.055,.04,24),chrome,x,y,.8);screw.rotation.x=Math.PI/2;box(instrument,.045,.006,.008,black,x,y,.824);}
  const ports=new THREE.Group();ports.position.set(0,-1.35,.45);industrial.add(ports);
  for(let i=0;i<7;i++){rounded(ports,.44,.34,.42,soft,-1.55+i*.52,0,0,.025);box(ports,.29,.12,.01,black,-1.55+i*.52,0,.22);}
  const factoryLabel=panel(industrial,textMap('G90 · GV90','Production program participation','AUTOMOTIVE / PROCESS ENGINEERING'),2.6,1.3,2.15,-.5,1.1,'g90');factoryLabel.rotation.y=-.2;
  animators.push(t=>{display.position.z=.7+Math.sin(t*.4)*.075;instrument.rotation.y=-.3+Math.sin(t*.22)*.045;});

  // 06. Diagram-led project gallery. Every surface opens its existing project record.
  const gallery=base();
  const projectCards=[
    {map:battery,x:-2.55,y:.35,z:-.2,ry:.28,id:'battery'},
    {map:journey,x:.1,y:1,z:.75,ry:-.06,id:'journey'},
    {map:controller,x:2.7,y:.15,z:-.6,ry:-.32,id:'embedded'},
  ];
  projectCards.forEach((p,i)=>{const card=panel(gallery,p.map,2.9,1.85,p.x,p.y,p.z,p.id,chrome);card.rotation.set(.03,p.ry,(i-1)*-.035);animators.push(t=>card.position.y=p.y+Math.sin(t*.5+i)*.055);});
  panel(gallery,textMap('Local LLM × LabVIEW','Natural language → validated tool calls','APPLIED AI / LOCAL INTEGRATION'),2.45,1.23,.3,-1.1,.2,'local-llm');
  const galleryArc=thinOrbit(gallery,4.5,0,.25,-1.2);galleryArc.rotation.set(1.25,0,.1);

  // 07. An open-ended signature. No score, quests, or game navigation.
  const contact=base();
  const monogram=text3D(contact,'ES',4,0,-.25,.2,porcelain);monogram.rotation.set(.07,-.15,-.06);
  const contactOrbit=ring(contact,2.7,.075,.2,1,-.45,chrome);contactOrbit.rotation.set(.8,.4,.5);
  const contactLine=thinOrbit(contact,3.65,.2,1,-.6);contactLine.rotation.set(.7,-.2,.3);
  animators.push(t=>{contactOrbit.rotation.y=.4+Math.sin(t*.18)*.16;monogram.rotation.y=-.15+Math.sin(t*.2)*.045;});

  // Sparse spatial dust is stable and uses one draw call.
  const dustPositions=new Float32Array(160*3);
  for(let i=0;i<160;i++){dustPositions[i*3]=(i*13.71%126)-8;dustPositions[i*3+1]=(i*7.31%16)-8;dustPositions[i*3+2]=-4-(i*4.91%10);}
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  scene.add(new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0x91b6ed,size:.022,transparent:true,opacity:.32,sizeAttenuation:true})));

  function layout(){
    portrait=container.clientWidth<650;
    const short=container.clientHeight<680;
    groups.forEach((g,i)=>{
      const aspect=container.clientWidth/container.clientHeight;
      const scale=portrait?Math.min(.55,(i===0?.70:.87)*aspect):1;
      g.scale.setScalar(scale);
      g.position.set(i*18+(portrait?0:(i===0?0:2.25)),portrait?(short?1.8:1.9):.45,0);
    });
  }
  function draw(dt=0){
    const ease=reducedMotion.matches?1:1-Math.exp(-dt*4.5);
    current+=(selected-current)*ease;
    overviewMix+=((overview?1:0)-overviewMix)*ease;
    pointer.lerp(targetPointer,paused||reducedMotion.matches?1:.06);
    const baseX=current*18;
    const overviewX=54;
    const distance=portrait?11.8:13.1;
    const z=THREE.MathUtils.lerp(distance,portrait?110:72,overviewMix);
    camera.aspect=container.clientWidth/Math.max(1,container.clientHeight);
    camera.position.set(THREE.MathUtils.lerp(baseX,overviewX,overviewMix)+(paused?0:pointer.x*.28),THREE.MathUtils.lerp(.45,15,overviewMix)+(paused?0:pointer.y*.14),z);
    camera.lookAt(THREE.MathUtils.lerp(baseX,overviewX,overviewMix),THREE.MathUtils.lerp(.45,0,overviewMix),0);
    key.position.x=baseX-4;rim.position.x=baseX+6;
    groups.forEach((g,i)=>g.visible=overviewMix>.01||Math.abs(i-current)<1.6);
    animators.forEach(fn=>fn(time));
    renderer.render(scene,camera);
  }
  function frame(now){
    raf=0;
    if(disposed||document.hidden||document.querySelector('dialog[open]')){last=0;return;}
    const delta=Math.min((now-(last||now))/1000,.05);last=now;
    if(!paused)time+=delta;
    draw(delta);
    if(!paused||Math.abs(current-selected)>.0005||Math.abs(overviewMix-(overview?1:0))>.0005)raf=requestAnimationFrame(frame);
  }
  function wake(){if(!disposed&&!raf){last=0;raf=requestAnimationFrame(frame);}}
  function resize(){
    const w=container.clientWidth,h=container.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio,2,Math.sqrt(4500000/Math.max(w*h,1))));renderer.setSize(w,h,false);
    camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();layout();draw();wake();
  }
  window.addEventListener('portfolio-chapter',e=>{selected=e.detail;if(reducedMotion.matches){current=selected;draw();}wake();});
  window.addEventListener('portfolio-overview',e=>{overview=e.detail;if(reducedMotion.matches){overviewMix=overview?1:0;draw();}wake();});
  const raycaster=new THREE.Raycaster();
  const tooltip=document.querySelector('.object-tooltip');
  function hitAt(x,y){
    if(overview||Math.abs(current-selected)>.04)return null;
    const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);
    const hits=pickables.filter(p=>{
      let ancestor=p.group;
      while(ancestor&&!groups.includes(ancestor))ancestor=ancestor.parent;
      return ancestor===groups[selected];
    }).flatMap(p=>raycaster.intersectObject(p.group,true).map(hit=>({...hit,project:p.project}))).sort((a,b)=>a.distance-b.distance);
    return hits[0];
  }
  canvas.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse')return;
    const hit=hitAt(e.clientX,e.clientY);
    tooltip.hidden=!hit;
    if(hit){
      tooltip.textContent=(hit.project==='experience'?'Experience':window.portfolioProjects.find(p=>p.id===hit.project)?.title||'Explore project')+' →';
      tooltip.style.left=Math.min(e.clientX+18,container.clientWidth-250)+'px';tooltip.style.top=Math.min(e.clientY+18,container.clientHeight-70)+'px';
    }
    canvas.style.cursor=hit?'pointer':'grab';
    if(paused)return;
    const r=canvas.getBoundingClientRect();targetPointer.set((e.clientX-r.left)/r.width-.5,-((e.clientY-r.top)/r.height-.5));wake();
  });
  canvas.addEventListener('pointerleave',()=>{tooltip.hidden=true;targetPointer.set(0,0);wake();});
  window.addEventListener('portfolio-chapter',()=>{tooltip.hidden=true;});
  window.addEventListener('portfolio-pick',e=>{
    const hit=hitAt(e.detail.x,e.detail.y);
    if(hit){tooltip.hidden=true;window.dispatchEvent(new CustomEvent('portfolio-project',{detail:hit.project}));}
  });
  function motionLabel(){motionButton.textContent=paused?'Play motion':'Pause motion';motionButton.setAttribute('aria-pressed',String(paused));}
  motionButton.addEventListener('click',()=>{paused=!paused;if(paused){pointer.set(0,0);targetPointer.set(0,0);draw();}motionLabel();wake();});
  reducedMotion.addEventListener('change',()=>{paused=reducedMotion.matches;motionLabel();if(paused){current=selected;overviewMix=overview?1:0;pointer.set(0,0);targetPointer.set(0,0);draw();}wake();});
  document.addEventListener('visibilitychange',wake);window.addEventListener('world-overlay-close',wake);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;cancelAnimationFrame(raf);unavailable('WebGL context lost');});
  new ResizeObserver(resize).observe(container);
  resize();motionLabel();container.classList.remove('scene-unavailable');container.classList.add('webgl-ready');
  document.querySelector('.scene-fallback').hidden=true;document.querySelector('.scene-loading').hidden=true;motionButton.hidden=false;wake();
}
