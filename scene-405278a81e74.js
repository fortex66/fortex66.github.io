import * as THREE from './vendor/three.module.min.js';

const stage=document.querySelector('#scene-viewport');
const canvas=document.querySelector('#identity-canvas');
const motionButton=document.querySelector('#motion-toggle');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  createFactory();
} catch(error) { fail(error); }
function fail(error){console.warn('Factory view unavailable',error);window.dispatchEvent(new Event('factory-unavailable'));}

function createFactory(){
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x111b27,.014);
  const camera=new THREE.PerspectiveCamera(38,1,.1,500);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  scene.add(new THREE.HemisphereLight(0xd8e6f2,0x162232,2.5));
  const key=new THREE.DirectionalLight(0xfff1da,4);key.position.set(-10,20,14);key.castShadow=true;
  key.shadow.mapSize.set(1536,1536);Object.assign(key.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:65});key.shadow.normalBias=.035;key.shadow.bias=-.0001;
  scene.add(key,key.target);
  const rim=new THREE.DirectionalLight(0x98c4eb,3);rim.position.set(10,7,-10);scene.add(rim);
  const studio=new THREE.Scene();studio.background=new THREE.Color(0x47596b);
  for(const [x,y,z,w,h,power] of [[-8,8,4,4,12,4],[8,6,-2,3,13,3],[0,11,0,14,3,4],[0,2,9,7,3,2]]){
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(power,power,power),side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);
  }
  const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.06).texture;scene.environmentIntensity=.8;
  studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});pmrem.dispose();
  const standard=(color,metalness=.5,roughness=.35)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const steel=standard(0xaebcc6,.9,.26),aluminum=standard(0xc5d1d8,.75,.32),black=standard(0x0a121b,.3,.65),graphite=standard(0x25313c,.7,.38),rubber=standard(0x14202b,.1,.76);
  const white=new THREE.MeshPhysicalMaterial({color:0xe0e5e5,metalness:.32,roughness:.3,clearcoat:.7});
  const cobalt=standard(0x477798,.7,.3),amber=standard(0xae8250,.65,.32);
  const glow=new THREE.MeshStandardMaterial({color:0xa4d5ef,emissive:0x669fbd,emissiveIntensity:.8,roughness:.4});
  const geometryCache=new Map();
  const animations=[],stations=[],pickables=[];
  let mode=window.factoryState?.mode||'road',desired=window.factoryState?.progress||0,current=desired;
  let overviewMix=mode==='overview'?1:0,paused=reduced.matches,raf=0,last=0,time=0,disposed=false,portrait=false;
  const pointer=new THREE.Vector2(),pointerTarget=new THREE.Vector2();
  function geom(key,build){if(!geometryCache.has(key))geometryCache.set(key,build());return geometryCache.get(key);}
  function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(parent,w,h,d,material,x=0,y=0,z=0){return mesh(parent,geom(`box:${w}:${h}:${d}`,()=>new THREE.BoxGeometry(w,h,d)),material,x,y,z);}
  function cylinder(parent,r,h,material,x=0,y=0,z=0){return mesh(parent,geom(`cyl:${r}:${h}`,()=>new THREE.CylinderGeometry(r,r,h,36)),material,x,y,z);}
  function sphere(parent,r,material,x=0,y=0,z=0){return mesh(parent,geom(`ball:${r}`,()=>new THREE.SphereGeometry(r,24,16)),material,x,y,z);}
  function rounded(parent,w,h,d,material,x=0,y=0,z=0,r=.055){
    r=Math.min(r,w/5,h/5,d/3);const geometry=geom(`rounded:${w}:${h}:${d}:${r}`,()=>{
      const s=new THREE.Shape(),a=w/2-r,b=h/2-r;s.moveTo(-a,-b-r);s.lineTo(a,-b-r);s.quadraticCurveTo(a+r,-b-r,a+r,-b);s.lineTo(a+r,b);s.quadraticCurveTo(a+r,b+r,a,b+r);s.lineTo(-a,b+r);s.quadraticCurveTo(-a-r,b+r,-a-r,b);s.lineTo(-a-r,-b);s.quadraticCurveTo(-a-r,-b-r,-a,-b-r);
      const g=new THREE.ExtrudeGeometry(s,{depth:d-r*2,bevelEnabled:true,bevelThickness:r,bevelSize:r*.5,bevelSegments:3,curveSegments:6,steps:1});g.translate(0,0,-d/2+r);return g;
    });return mesh(parent,geometry,material,x,y,z);
  }
  function tube(parent,points,r,material){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>Array.isArray(p)?new THREE.Vector3(...p):p)),40,r,8,false),material);}
  function ring(parent,r,t,material,x=0,y=0,z=0){return mesh(parent,geom(`ring:${r}:${t}`,()=>new THREE.TorusGeometry(r,t,12,64)),material,x,y,z);}
  function texture(draw,w=1024,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return t;}
  function labelMap(title,subtitle){return texture((c,w,h)=>{c.fillStyle='#172b3c';c.fillRect(0,0,w,h);c.fillStyle='#c9d7e1';c.font='500 52px Arial';c.fillText(title,48,103);c.fillStyle='#91adc4';c.font='25px monospace';c.fillText(subtitle,50,162);c.strokeStyle='#4f7492';c.lineWidth=3;for(let i=0;i<4;i++){let y=235+i*53;c.beginPath();c.moveTo(50,y);c.lineTo(w-50,y);c.stroke();c.fillStyle='#9dbbd1';c.fillRect(140+i*137,y-9,35,18);}},1024,512);}
  function screen(parent,title,subtitle,w=1.5,h=.8,x=0,y=1.5,z=0){
    rounded(parent,w+.1,h+.1,.12,graphite,x,y,z);
    return mesh(parent,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:labelMap(title,subtitle),toneMapped:false}),x,y,z+.073);
  }
  function bolts(parent,w,h,z){for(const x of [-w/2,w/2])for(const y of [-h/2,h/2]){const b=cylinder(parent,.035,.025,steel,x,y,z);b.rotation.x=Math.PI/2;}}

  // A single straight conveyor follows the career sequence from present to past.
  // Career boundaries add breathing room without changing travel direction.
  const stops=window.factoryStops,stationSpecs=[],zones=[];
  let distance=0;
  stops.forEach((stop,i)=>{
    if(i)distance+=6.6+(stop.era!==stops[i-1].era?4:0);
    stationSpecs.push({point:new THREE.Vector3(distance,1,0),normal:new THREE.Vector3(0,0,1)});
    let zone=zones.at(-1);
    if(!zone||zone.id!==stop.era){zone={id:stop.era,title:stop.eraTitle||'SELECTED WORK',period:stop.period||'',start:distance,end:distance};zones.push(zone);}
    zone.end=distance;
  });
  const midpoint=distance/2,routeLength=distance+8;
  stationSpecs.forEach(spec=>spec.point.x-=midpoint);
  const curve=new THREE.LineCurve3(new THREE.Vector3(-midpoint-4,1,0),new THREE.Vector3(midpoint+4,1,0));
  stationSpecs.forEach(spec=>spec.u=(spec.point.x+midpoint+4)/routeLength);
  const begin=stationSpecs[0].u,end=stationSpecs.at(-1).u;
  const positions=stationSpecs.map(s=>(s.u-begin)/(end-begin));
  function pose(t){const point=curve.getPointAt(t),tangent=curve.getTangentAt(t);return{point,tangent,normal:new THREE.Vector3(0,0,1)};}
  const floorMap=texture((c,w,h)=>{c.fillStyle='#293540';c.fillRect(0,0,w,h);c.strokeStyle='#43505b';c.lineWidth=1;c.strokeRect(0,0,w,h);c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke();},512,512);floorMap.wrapS=floorMap.wrapT=THREE.RepeatWrapping;floorMap.repeat.set(routeLength/5,5);
  const floor=mesh(scene,new THREE.PlaneGeometry(routeLength+12,25),new THREE.MeshStandardMaterial({map:floorMap,color:0x43576a,roughness:.86,metalness:.12}),0,-.18,1);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
  const zoneMat=standard(0x152433,.25,.72);
  zones.forEach((zone,i)=>{
    const cx=(zone.start+zone.end)/2-midpoint,width=zone.end-zone.start+5.5;
    rounded(scene,width,.13,7.5,zoneMat,cx,-.08,2,.04);
    box(scene,width,.012,.024,cobalt,cx,.005,-1.75);
    box(scene,width,.012,.024,cobalt,cx,.005,5.75);
    if(i){const boundary=zone.start-midpoint-5.3;for(const z of [-1.6,5.6]){box(scene,.06,.65,.06,steel,boundary,.25,z);box(scene,.1,.09,.1,glow,boundary,.62,z);}}
  });

  // Instanced slats and support legs keep the entire route inexpensive to draw.
  const length=curve.getLength(),count=Math.ceil(length/.24),dummy=new THREE.Object3D();
  const slats=new THREE.InstancedMesh(new THREE.BoxGeometry(1.72,.08,.21),aluminum,count);slats.receiveShadow=true;scene.add(slats);
  for(let i=0;i<count;i++){const {point,tangent}=pose(i/(count-1));dummy.position.copy(point);dummy.rotation.set(0,Math.atan2(tangent.x,tangent.z),0);dummy.updateMatrix();slats.setMatrixAt(i,dummy.matrix);slats.setColorAt(i,new THREE.Color(i%8===0?0x61717f:0xb5c3cd));}
  const legsCount=Math.floor(length/1.8),legs=new THREE.InstancedMesh(new THREE.BoxGeometry(.1,1,.1),graphite,legsCount*2);scene.add(legs);
  for(let i=0;i<legsCount;i++){const {point,tangent,normal}=pose(i/(legsCount-1));for(let j=0;j<2;j++){dummy.position.copy(point).addScaledVector(normal,j?-.8:.8);dummy.position.y=point.y/2-.05;dummy.scale.set(1,point.y-.12,1);dummy.rotation.set(0,Math.atan2(tangent.x,tangent.z),0);dummy.updateMatrix();legs.setMatrixAt(i*2+j,dummy.matrix);}}
  for(const side of [-1,1]){
    const railPoints=[];for(let i=0;i<=800;i++){const {point,normal}=pose(i/800);railPoints.push(point.clone().addScaledVector(normal,side*.96).add(new THREE.Vector3(0,.14,0)));}
    const railCurve=new THREE.CatmullRomCurve3(railPoints);mesh(scene,new THREE.TubeGeometry(railCurve,1000,.045,8,false),steel);
    const lower=railPoints.map(p=>p.clone().add(new THREE.Vector3(0,-.33,0)));mesh(scene,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lower),800,.065,6,false),graphite);
  }
  // A small carrier follows the visitor's actual scroll position, never auto-drives.
  const carrier=new THREE.Group();scene.add(carrier);rounded(carrier,.76,.12,.66,graphite,0,.13,0);rounded(carrier,.48,.28,.4,white,0,.32,0);box(carrier,.22,.015,.1,glow,0,.47,0);

  function platform(spec,index){
    const group=new THREE.Group();group.position.copy(spec.point).addScaledVector(spec.normal,3.25);group.position.y=.06;group.rotation.y=Math.atan2(-spec.normal.x,-spec.normal.z);scene.add(group);
    rounded(group,4.5,.18,3.4,graphite,0,.05,0,.07);
    rounded(group,4.36,.025,3.26,standard(0x63717b,.5,.5),0,.15,0,.04);
    box(group,3.9,.014,.022,cobalt,0,.18,1.42);
    const digit=texture((c,w,h)=>{c.fillStyle='#d5dfe5';c.font='bold 170px Arial';c.fillText(String(index+1).padStart(2,'0'),12,176);},256,200);
    const m=mesh(group,new THREE.PlaneGeometry(.43,.34),new THREE.MeshBasicMaterial({map:digit,transparent:true,depthWrite:false}),-1.82,.18,1.28);m.rotation.x=-Math.PI/2;m.castShadow=false;
    stations.push(group);pickables.push({group,index,id:window.factoryStops[index].id});return group;
  }
  function column(parent,x,y,z,height=2.6){box(parent,.1,height,.1,aluminum,x,y+height/2,z);box(parent,.3,.035,.3,steel,x,y,z);}
  function cabinet(parent,x,z,width=1.5){
    const g=new THREE.Group();g.position.set(x,.2,z);parent.add(g);
    rounded(g,width,2.05,.7,white,0,1.025,0,.07);rounded(g,width-.1,1.91,.035,graphite,0,1.03,.38,.03);
    for(let i=0;i<5;i++){rounded(g,.13,.66,.12,i%2?aluminum:steel,-width*.3+i*width*.15,1.05,.42,.015);box(g,.07,.06,.01,glow,-width*.3+i*width*.15,1.2,.49);}
    box(g,width-.22,.06,.15,steel,0,.48,.45);for(let i=0;i<6;i++)box(g,.1,.08,.12,cobalt,-width*.28+i*width*.11,.36,.45);
    screen(g,'CONTROL','PLC / I-O',width*.7,width*.34,0,1.7,.47);return g;
  }
  function robot(parent,x,z,scale=1){
    const g=new THREE.Group();g.position.set(x,.22,z);g.scale.setScalar(scale);parent.add(g);
    cylinder(g,.49,.15,graphite,0,.07,0);cylinder(g,.33,.49,white,0,.35,0);const arm=new THREE.Group();arm.position.y=.64;g.add(arm);
    const p=[new THREE.Vector3(0,0,0),new THREE.Vector3(-.35,.95,0),new THREE.Vector3(.42,1.66,0),new THREE.Vector3(1.14,1,.08)];
    for(let i=0;i<3;i++){
      const d=p[i+1].clone().sub(p[i]);const limb=rounded(arm,.28-i*.04,d.length(),.29-i*.04,white);limb.position.copy(p[i]).add(p[i+1]).multiplyScalar(.5);limb.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
      const servo=cylinder(arm,.19-i*.025,.36,graphite,...p[i].toArray());servo.rotation.x=Math.PI/2;
      const cap=cylinder(arm,.14-i*.018,.025,steel,p[i].x,p[i].y,.2);cap.rotation.x=Math.PI/2;
      const seal=ring(arm,.12-i*.015,.014,amber,p[i].x,p[i].y,.22);
    }
    tube(arm,[[.12,-.1,-.2],[-.53,.75,-.23],[-.42,1.08,-.18],[.26,1.83,-.15],[.9,1.42,-.15],[1.14,1,.05]],.038,black);
    rounded(arm,.26,.18,.23,graphite,1.14,.87,.08);box(arm,.035,.23,.11,steel,1.05,.67,.08);box(arm,.035,.23,.11,steel,1.23,.67,.08);
    animations.push(t=>arm.rotation.y=Math.sin(t*.45+x)*.13);return g;
  }
  function gantry(parent){
    for(const x of [-1.75,1.75])column(parent,x,.21,-.8,2.7);
    rounded(parent,3.7,.3,.32,white,0,3,-.8);box(parent,3.4,.09,.38,steel,0,2.88,-.8);rounded(parent,.45,.52,.5,graphite,.35,2.66,-.8);
    cylinder(parent,.045,.7,steel,.35,2.08,-.8);rounded(parent,.21,.23,.28,white,.35,1.75,-.8);
  }
  function sensor(parent,x,y,z){
    const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);rounded(g,.37,.33,.5,graphite);const lens=cylinder(g,.11,.12,steel,0,0,.29);lens.rotation.x=Math.PI/2;const glass=cylinder(g,.082,.015,cobalt,0,0,.36);glass.rotation.x=Math.PI/2;return g;
  }
  function tank(parent,x,z,r=.55,height=1.5){
    const g=new THREE.Group();g.position.set(x,.26,z);parent.add(g);cylinder(g,r,height,steel,0,height/2+.25,0);
    const dome=mesh(g,new THREE.SphereGeometry(r,32,20),steel,0,height+.25,0);dome.scale.y=.35;
    for(const y of [.42,height+.09]){const hoop=ring(g,r+.016,.025,aluminum,0,y,0);hoop.rotation.x=Math.PI/2;}
    for(const angle of [0,2.094,4.188])box(g,.07,.34,.07,graphite,Math.cos(angle)*r*.7,.12,Math.sin(angle)*r*.7);
    cylinder(g,.12,.18,graphite,0,height+.5,0);return g;
  }
  function nodes(parent,x,z){
    const g=new THREE.Group();g.position.set(x,.2,z);parent.add(g);const points=[[-.75,1.35,0],[.1,2.1,0],[.8,1.3,.3],[.05,.8,.35]];
    for(const p of points)sphere(g,.14,glow,...p);
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)tube(g,[points[i],points[j]],.014,steel);
    return g;
  }
  stationSpecs.forEach((spec,i)=>{
    const g=platform(spec,i),id=window.factoryStops[i].id;
    if(id==='g90'){
      robot(g,-1,.1,1.05);rounded(g,1.65,.48,.85,white,.8,.6,.1,.09);rounded(g,1.1,.2,.7,graphite,.8,.92,.1);for(const x of [.22,1.35])cylinder(g,.035,.48,steel,x,1.1,.1);
      for(const x of [-1.8,1.8])column(g,x,.2,-1.05,2.8);box(g,3.7,.11,.11,aluminum,0,3,-1.05);box(g,1.1,.02,.06,glow,0,2.93,-1.05);
    }else if(id==='vision'){
      gantry(g);sensor(g,-.7,2.43,-.55);sensor(g,.7,2.43,-.55);rounded(g,1.8,.22,1.2,steel,0,.47,.2);rounded(g,.6,.45,.4,white,0,.8,.2);robot(g,-1.4,.2,.65);
      const scan=mesh(g,new THREE.PlaneGeometry(1.5,1.2),new THREE.MeshBasicMaterial({color:0x81c7ee,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}),0,1.5,-.05);scan.rotation.x=-.65;
    }else if(id==='process'){
      gantry(g);tank(g,-1.2,.35,.39,1.15);tank(g,1.2,.35,.39,1.15);tube(g,[[-1.2,1.9,.35],[-1.2,2.3,-.4],[.35,2.3,-.7]],.045,steel);tube(g,[[1.2,1.9,.35],[1.2,2.3,-.4],[.35,2.3,-.7]],.045,steel);screen(g,'FEEDBACK','MEASURE / CONTROL',.96,.48,0,1.1,.7);
    }else if(id==='embedded'){
      cabinet(g,-.7,-.35,1.7);screen(g,'EMBEDDED','C++ / Qt / Linux',1.5,.9,1,1.45,.35);column(g,1,.2,.3,.7);tube(g,[[-.7,.5,.2],[-.3,.3,.6],[1,.3,.6],[1,.8,.5]],.035,black);
    }else if(id==='water'){
      tank(g,-1.2,-.45,.57,1.7);tank(g,.25,-.5,.57,1.7);tank(g,1.43,-.2,.36,1.05);tube(g,[[-1.2,.8,.2],[-1.2,.55,.9],[.3,.55,.9],[.3,.8,.1]],.065,steel);tube(g,[[.3,2.35,-.5],[.3,2.72,-.5],[1.43,2.72,-.2],[1.43,1.78,-.2]],.055,steel);screen(g,'SCADA','PLC → WEB',1.05,.58,-.4,1,.95);
    }else if(id==='viewer'){
      cabinet(g,-1,-.4,1.1);column(g,.8,.2,-.25,1.3);screen(g,'ForTex-Viewer','DATA / VISUALIZATION',2.12,1.22,.7,1.93,-.12);rounded(g,1.7,.07,.7,graphite,.7,1.1,.25);for(let k=0;k<7;k++)box(g,.07,.12+k*.055,.04,cobalt,-.1+k*.22,1.7,-.01);
    }else if(id==='battery'){
      rounded(g,3.25,.3,1.8,graphite,0,.43,0);for(let r=0;r<2;r++)for(let c=0;c<7;c++){cylinder(g,.16,.68,cobalt,-1.25+c*.42,.9,-.4+r*.8);cylinder(g,.11,.03,steel,-1.25+c*.42,1.255,-.4+r*.8);}for(const z of [-.4,.4])box(g,2.8,.026,.055,aluminum,0,1.29,z);screen(g,'BATTERY','SENSORS / CONTROL',1.4,.65,0,2,-.75);column(g,0,.2,-.8,1.35);
    }else if(id==='smartfarm'){
      for(const x of [-1.7,1.7])column(g,x,.2,-.7,2.6);box(g,3.5,.1,.13,aluminum,0,2.8,-.7);
      for(const z of [-.5,.5]){rounded(g,3.3,.2,.57,white,0,.72,z);for(let j=0;j<6;j++){cylinder(g,.12,.15,graphite,-1.3+j*.52,.85,z);const sprout=sphere(g,.11,standard(0x6b8990,.1,.75),-1.3+j*.52,1.02,z);sprout.scale.set(.55,1.7,.7);}}
      screen(g,'SmartFarm','WEB / MARKETPLACE',1.05,.6,0,2.1,-.6);
    }else if(id==='plc-ai'){
      cabinet(g,-1,-.55,1.1);const graph=nodes(g,.65,-.3);screen(g,'PLC AI STUDIO','CONTEXT / RULES / REVIEW',2.1,.86,.35,1.02,.73);rounded(g,1.25,.14,1.25,steel,.7,.38,-.3);animations.push(t=>graph.rotation.y=Math.sin(t*.25)*.12);
    }else if(id==='local-llm'){
      robot(g,-1,.1,.8);cabinet(g,1,-.5,.9);screen(g,'LOCAL LLM','TOOL CALL → LabVIEW',1.8,.8,.1,2.42,-.3);tube(g,[[-1,.4,.1],[-.5,.35,.7],[1,.35,.7],[1,.8,-.2]],.04,black);
    }else if(id==='journey'){
      for(const [x,y,z,title] of [[-1.1,1.45,0,'DISCOVER'],[.8,2,-.3,'COLLABORATE'],[.25,.75,.6,'CHAT']]){screen(g,title,'JourneyMate',1.55,.84,x,y,z);column(g,x,.2,z-.1,Math.max(.2,y-.65));}
      tube(g,[[-1.1,1,0],[-.6,1,.2],[.8,1.5,-.3]],.019,glow);
    }
  });

  const eraMarkers=zones.map(zone=>{
    const element=document.createElement('div');element.className='map-era';
    const title=document.createElement('strong'),period=document.createElement('span');title.textContent=zone.title;period.textContent=zone.period;element.append(title,period);document.querySelector('#overview-markers').append(element);
    return {point:new THREE.Vector3((zone.start+zone.end)/2-midpoint,0,-3.25),element};
  });
  const markers=stations.map((group,i)=>({group,element:document.querySelector(`#overview-markers [data-stop="${i}"]`)}));
  const camPos=new THREE.Vector3(),camTarget=new THREE.Vector3(),roadPos=new THREE.Vector3(),roadTarget=new THREE.Vector3();
  const overviewPos=new THREE.Vector3(),overviewTarget=new THREE.Vector3(0,0,0);
  const tooltip=document.querySelector('#object-tooltip');
  function cameraPose(){
    const u=begin+(end-begin)*current,{point,tangent,normal}=pose(u);
    const mobile=portrait;
    roadPos.copy(point).addScaledVector(normal,mobile?-12:-8.6).addScaledVector(tangent,mobile?-9.5:-7.2);roadPos.y=point.y+(mobile?11.5:7.4);
    roadTarget.copy(point).addScaledVector(normal,2.6).addScaledVector(tangent,.5);roadTarget.y=point.y+(mobile?-1.9:.1);
    // Fit the long line to the usable viewport, including compact landscape screens.
    const halfFov=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const usableHeight=Math.max(.4,(stage.clientHeight-220)/stage.clientHeight);
    const mapHeight=mobile?(routeLength+6)/(2*halfFov*usableHeight):Math.max((routeLength+6)/(2*halfFov*camera.aspect*.86),19/(2*halfFov*usableHeight));
    overviewTarget.set(0,0,1.6);
    overviewPos.set(0,mapHeight,mobile?1.65:mapHeight*.32+1.6);
    camPos.copy(roadPos).lerp(overviewPos,overviewMix);camTarget.copy(roadTarget).lerp(overviewTarget,overviewMix);
    if(!paused){camPos.x+=pointer.x*.15*(1-overviewMix);camPos.z+=pointer.y*.15*(1-overviewMix);}
    scene.fog.density=THREE.MathUtils.lerp(.014,.003,overviewMix);
    camera.position.copy(camPos);
    camera.up.set(overviewMix* (mobile?-1:0),1-overviewMix*(mobile?1:0),0).normalize();
    camera.lookAt(camTarget);camera.updateMatrixWorld();
    carrier.position.copy(point);carrier.rotation.y=Math.atan2(tangent.x,tangent.z);
    key.position.set(point.x-10,20,point.z+14);key.target.position.set(point.x,0,point.z);
    const n=positions.reduce((best,p,i)=>Math.abs(p-current)<Math.abs(positions[best]-current)?i:best,0);
    stage.dataset.currentStation=String(n);stage.dataset.roadProgress=current.toFixed(5);
  }
  function updateMarkers(){
    if(mode!=='overview')return;
    for(const {group,element} of markers){
      const p=group.localToWorld(new THREE.Vector3(0,3.3,0)).project(camera);
      const x=(p.x+1)*.5*stage.clientWidth-(portrait?28:0),y=(1-p.y)*.5*stage.clientHeight;
      element.style.left=x+'px';element.style.top=y+'px';
      element.hidden=p.z>1||x<15||x>stage.clientWidth-15||y<95||y>stage.clientHeight-75;
    }
    for(const {point,element} of eraMarkers){
      const p=point.clone().project(camera);
      element.style.left=(portrait?stage.clientWidth*.61:(p.x+1)*.5*stage.clientWidth)+'px';
      element.style.top=((1-p.y)*.5*stage.clientHeight-(portrait?0:28))+'px';
    }
  }
  function draw(delta=0){
    const ease=reduced.matches?1:1-Math.exp(-delta*6.5);
    const old=current,oldOverview=overviewMix;current+=(desired-current)*ease;
    overviewMix+=((mode==='overview'?1:0)-overviewMix)*ease;
    if(Math.abs(current-desired)<.000005)current=desired;
    if(Math.abs(overviewMix-(mode==='overview'?1:0))<.00005)overviewMix=mode==='overview'?1:0;
    pointer.lerp(pointerTarget,.04);
    cameraPose();animations.forEach(fn=>fn(time));
    if(Math.abs(current-old)>.00001||Math.abs(overviewMix-oldOverview)>.0001)renderer.shadowMap.needsUpdate=true;
    renderer.render(scene,camera);updateMarkers();
  }
  function frame(now){
    raf=0;if(disposed||document.hidden||document.querySelector('dialog[open]')||['list','about'].includes(mode)){last=0;return;}
    const delta=Math.min((now-(last||now))/1000,.05);last=now;if(!paused)time+=delta;
    draw(delta);
    if(!paused||current!==desired||overviewMix!==(mode==='overview'?1:0))raf=requestAnimationFrame(frame);
  }
  function wake(){if(!disposed&&!raf){last=0;raf=requestAnimationFrame(frame);}}
  function resize(){
    const w=stage.clientWidth,h=stage.clientHeight;portrait=w<650;
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75,Math.sqrt(3500000/Math.max(w*h,1))));renderer.setSize(w,h,false);
    camera.aspect=w/Math.max(h,1);camera.fov=portrait?40:38;camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;draw();wake();
  }
  window.addEventListener('factory-progress',e=>{desired=e.detail;tooltip.hidden=true;if(reduced.matches){current=desired;renderer.shadowMap.needsUpdate=true;draw();}wake();});
  // Direct selections zoom to their station instead of racing around every intervening station.
  window.addEventListener('factory-jump',e=>{current=desired=e.detail;if(!reduced.matches&&mode!=='road')overviewMix=mode==='overview'?1:.55;renderer.shadowMap.needsUpdate=true;wake();});
  window.addEventListener('factory-mode',e=>{mode=e.detail;tooltip.hidden=true;if(reduced.matches){overviewMix=mode==='overview'?1:0;draw();}wake();});
  const raycaster=new THREE.Raycaster();
  function hitAt(x,y){
    if(!['road','overview'].includes(mode))return null;
    const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);
    return pickables.flatMap(item=>raycaster.intersectObject(item.group,true).map(hit=>({...hit,index:item.index,id:item.id}))).sort((a,b)=>a.distance-b.distance)[0];
  }
  canvas.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||e.buttons)return;
    const hit=hitAt(e.clientX,e.clientY);tooltip.hidden=!hit;
    if(hit){tooltip.textContent=window.factoryStops[hit.index].title+' →';tooltip.style.left=Math.min(e.clientX+16,stage.clientWidth-240)+'px';tooltip.style.top=Math.min(e.clientY+16,stage.clientHeight-55)+'px';}
    canvas.style.cursor=hit?'pointer':'grab';if(!paused){pointerTarget.set(e.clientX/stage.clientWidth-.5,e.clientY/stage.clientHeight-.5);wake();}
  });
  canvas.addEventListener('pointerleave',()=>{tooltip.hidden=true;pointerTarget.set(0,0);wake();});
  window.addEventListener('factory-pick',e=>{const hit=hitAt(e.detail.x,e.detail.y);if(hit){tooltip.hidden=true;window.dispatchEvent(new CustomEvent(mode==='overview'?'factory-visit':'factory-open',{detail:mode==='overview'?hit.index:hit.id}));}});
  function labelMotion(){motionButton.innerHTML=`Motion ${paused?'off':'on'} <span>◌</span>`;motionButton.setAttribute('aria-pressed',String(paused));motionButton.setAttribute('aria-label',paused?'Enable ambient motion':'Pause ambient motion');}
  motionButton.addEventListener('click',()=>{paused=!paused;pointer.set(0,0);pointerTarget.set(0,0);labelMotion();draw();wake();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;pointer.set(0,0);pointerTarget.set(0,0);if(paused){current=desired;overviewMix=mode==='overview'?1:0;}labelMotion();draw();wake();});
  document.addEventListener('visibilitychange',wake);window.addEventListener('factory-resume',wake);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;cancelAnimationFrame(raf);fail('WebGL context lost');});
  new ResizeObserver(resize).observe(stage);
  resize();labelMotion();stage.classList.add('webgl-ready');stage.classList.remove('scene-unavailable');document.querySelector('.scene-fallback').hidden=true;document.querySelector('.scene-loading').hidden=true;
  window.dispatchEvent(new CustomEvent('factory-ready',{detail:{positions}}));wake();
}
