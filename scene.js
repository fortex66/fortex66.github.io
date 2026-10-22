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

  // Straight exhibition lanes joined by tangent-continuous, gentle bends.
  // All stations remain on straight sections; only career transitions turn.
  const stops=window.factoryStops,stationSpecs=[],zones=[];
  const laneOffsets=[-4,3,-3];
  let distance=0;
  stops.forEach((stop,i)=>{
    if(i)distance+=stop.era!==stops[i-1].era?18:6.6;
    let zone=zones.at(-1);
    if(!zone||zone.id!==stop.era){zone={id:stop.era,title:stop.eraTitle,period:stop.period,start:distance,end:distance,z:laneOffsets[zones.length],specs:[]};zones.push(zone);}
    zone.end=distance;
    const spec={point:new THREE.Vector3(distance,1,zone.z),normal:new THREE.Vector3(0,0,1)};
    stationSpecs.push(spec);zone.specs.push(spec);
  });
  const midpoint=distance/2,routeWidth=distance+6;
  stationSpecs.forEach(spec=>spec.point.x-=midpoint);
  const curve=new THREE.CurvePath();
  zones.forEach((zone,i)=>{
    const start=new THREE.Vector3(zone.start-midpoint-3,1,zone.z);
    const end=new THREE.Vector3(zone.end-midpoint+3,1,zone.z);
    if(i){
      const previous=zones[i-1],from=new THREE.Vector3(previous.end-midpoint+3,1,previous.z);
      const handle=(start.x-from.x)/3;
      const bend=new THREE.CubicBezierCurve3(from,from.clone().add(new THREE.Vector3(handle,0,0)),start.clone().sub(new THREE.Vector3(handle,0,0)),start);
      bend.arcLengthDivisions=300;curve.add(bend);
    }
    const offset=curve.curves.length?curve.getLength():0;
    zone.specs.forEach(spec=>spec.distance=offset+spec.point.x-start.x);
    curve.add(new THREE.LineCurve3(start,end));
  });
  const routeLength=curve.getLength();
  stationSpecs.forEach(spec=>spec.u=spec.distance/routeLength);
  const begin=stationSpecs[0].u,end=stationSpecs.at(-1).u;
  const positions=stationSpecs.map(s=>(s.u-begin)/(end-begin));
  // CurvePath.getPoint is already arc-length based across its component curves.
  function pose(t){const point=curve.getPoint(t),tangent=curve.getTangent(t);return{point,tangent,normal:new THREE.Vector3(-tangent.z,0,tangent.x).normalize()};}
  const floorMap=texture((c,w,h)=>{c.fillStyle='#293540';c.fillRect(0,0,w,h);c.strokeStyle='#43505b';c.lineWidth=1;c.strokeRect(0,0,w,h);c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke();},512,512);floorMap.wrapS=floorMap.wrapT=THREE.RepeatWrapping;floorMap.repeat.set(routeWidth/5,6);
  const floor=mesh(scene,new THREE.PlaneGeometry(routeWidth+12,29),new THREE.MeshStandardMaterial({map:floorMap,color:0x43576a,roughness:.86,metalness:.12}),0,-.18,1);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
  const zoneMaterials=[standard(0x152433,.25,.72),standard(0x242c32,.25,.72),standard(0x1d2b36,.25,.72)];
  const zoneAccents=[cobalt,amber,aluminum];
  zones.forEach((zone,i)=>{
    const cx=(zone.start+zone.end)/2-midpoint,width=zone.end-zone.start+6;
    rounded(scene,width,.13,7.5,zoneMaterials[i],cx,-.08,zone.z+2,.04);
    box(scene,width,.012,.024,zoneAccents[i],cx,.005,zone.z-1.75);
    box(scene,width,.012,.024,zoneAccents[i],cx,.005,zone.z+5.75);
    // Small entry lights mark the next space without adding interface clutter.
    for(const z of [-1.6,5.6]){const x=zone.start-midpoint-2.8;box(scene,.06,.65,.06,steel,x,.25,zone.z+z);box(scene,.1,.09,.1,glow,x,.62,zone.z+z);}
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
  const carrier=new THREE.Group();carrier.name='road-carrier';scene.add(carrier);
  rounded(carrier,.8,.12,.72,graphite,0,.13,0);
  rounded(carrier,.68,.025,.6,cobalt,0,.205,0);
  // An original duck-like inspection companion rides along with the visitor.
  const companion=new THREE.Group();companion.name='road-companion';companion.rotation.y=Math.PI*.72;carrier.add(companion);
  const beakMaterial=standard(0xe6a34b,.25,.4);
  for(const x of [-.14,.14])rounded(companion,.2,.09,.29,beakMaterial,x,.26,.07,.04);
  const body=new THREE.Group();body.position.y=.52;companion.add(body);
  sphere(body,.28,white).scale.set(1,.94,.86);
  rounded(body,.21,.16,.045,cobalt,0,.015,.225,.035);
  rounded(body,.09,.026,.02,glow,0,.03,.254,.009);
  const wings=[];
  for(const side of [-1,1]){
    const wing=new THREE.Group();wing.position.set(side*.27,.06,0);body.add(wing);wings.push(wing);
    sphere(wing,.065,graphite);
    sphere(wing,.13,white,side*.015,-.105,0).scale.set(.55,1.2,.8);
  }
  const head=new THREE.Group();head.name='companion-head';head.position.y=.33;body.add(head);
  sphere(head,.32,white).scale.set(1,.83,.85);
  rounded(head,.47,.22,.105,black,0,.025,.23,.07);
  const eyes=[];
  for(const x of [-.105,.105]){
    const eye=rounded(head,.065,.105,.018,glow,x,.035,.293,.02);eyes.push(eye);
  }
  sphere(head,.12,beakMaterial,0,-.105,.3).scale.set(1,.4,1.05);
  cylinder(head,.024,.11,steel,0,.29,-.04);
  sphere(head,.044,glow,0,.36,-.04);
  animations.push(t=>{
    body.position.y=.52+Math.sin(t*1.8)*.012;
    head.rotation.y=Math.sin(t*.65)*.13;head.rotation.z=Math.sin(t*.9)*.045;
    const blink=Math.max(.08,Math.min(1,Math.abs((t%5.2)-4.8)/.1));
    eyes.forEach(eye=>eye.scale.y=blink);
    wings.forEach((wing,i)=>wing.rotation.z=(i?1:-1)*(.12+Math.sin(t*1.8)*.06));
  });

  function platform(spec,index){
    const group=new THREE.Group();group.name=`station-${stops[index].id}`;group.userData.stopIndex=index;group.position.copy(spec.point).addScaledVector(spec.normal,3.25);group.position.y=.06;group.rotation.y=Math.atan2(-spec.normal.x,-spec.normal.z);scene.add(group);
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
  function robot(parent,x,z,scale=1,options={}){
    const g=new THREE.Group();g.name=options.name||'industrial-robot';g.userData.role=options.tool||'gripper';g.position.set(x,.22,z);g.scale.setScalar(scale);g.rotation.y=options.yaw||0;parent.add(g);
    cylinder(g,.49,.15,graphite,0,.07,0);cylinder(g,.33,.49,white,0,.35,0);const arm=new THREE.Group();arm.position.y=.64;g.add(arm);
    const p=[new THREE.Vector3(0,0,0),new THREE.Vector3(-.35,.95,0),new THREE.Vector3(.42,1.66,0),new THREE.Vector3(1.14,1,.08)];
    for(let i=0;i<3;i++){
      const d=p[i+1].clone().sub(p[i]);const limb=rounded(arm,.28-i*.04,d.length(),.29-i*.04,white);limb.position.copy(p[i]).add(p[i+1]).multiplyScalar(.5);limb.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
      const servo=cylinder(arm,.19-i*.025,.36,graphite,...p[i].toArray());servo.rotation.x=Math.PI/2;
      const cap=cylinder(arm,.14-i*.018,.025,steel,p[i].x,p[i].y,.2);cap.rotation.x=Math.PI/2;
      const seal=ring(arm,.12-i*.015,.014,amber,p[i].x,p[i].y,.22);
    }
    tube(arm,[[.12,-.1,-.2],[-.53,.75,-.23],[-.42,1.08,-.18],[.26,1.83,-.15],[.9,1.42,-.15],[1.14,1,.05]],.038,black);
    rounded(arm,.26,.18,.23,graphite,1.14,.87,.08);
    if(options.tool==='dispenser'){
      cylinder(arm,.065,.34,steel,1.14,.61,.08);cylinder(arm,.025,.16,amber,1.14,.36,.08);
      const strand=cylinder(arm,.012,.08,glow,1.14,.24,.08);strand.name='dispensing-stream';
      tube(arm,[[0,.1,-.2],[-.45,1,-.25],[.3,1.9,-.2],[1.1,1.2,-.12],[1.14,.75,.08]],.028,cobalt);
    }else{
      box(arm,.035,.23,.11,steel,1.05,.67,.08);box(arm,.035,.23,.11,steel,1.23,.67,.08);
      if(options.tool==='vision'){
        const camera=sensor(arm,1.14,.89,.32);camera.rotation.x=Math.PI/2;camera.scale.setScalar(.55);
        const optic=ring(arm,.13,.018,glow,1.14,.53,.08);optic.rotation.x=Math.PI/2;
      }
    }
    animateStation(parent,t=>{arm.rotation.y=options.sweep?options.sweep(t):Math.sin(t*.45+(options.phase??x))*.13;});return g;
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
  function headlamp(parent){
    // An original, generic automotive lamp: tapered housing, optics and twin DRLs.
    const lamp=new THREE.Group();lamp.name='automotive-headlamp';lamp.position.set(0,1.62,.15);parent.add(lamp);
    const outline=new THREE.Shape();outline.moveTo(-1.1,-.37);outline.lineTo(.84,-.32);outline.quadraticCurveTo(1.15,-.27,1.18,-.05);outline.lineTo(.98,.29);outline.quadraticCurveTo(.88,.4,.68,.4);outline.lineTo(-1.06,.34);outline.quadraticCurveTo(-1.18,.28,-1.1,-.37);
    const housingGeometry=new THREE.ExtrudeGeometry(outline,{depth:.34,bevelEnabled:true,bevelThickness:.045,bevelSize:.04,bevelSegments:3,curveSegments:16,steps:1});housingGeometry.translate(0,0,-.2);
    mesh(lamp,housingGeometry,graphite);
    const inset=mesh(lamp,new THREE.ShapeGeometry(outline),black,0,0,.17);inset.scale.set(.94,.9,1);
    const led=new THREE.MeshStandardMaterial({color:0xe8f5ff,emissive:0xbedfff,emissiveIntensity:2,metalness:.15,roughness:.2});
    for(const x of [-.69,-.08,.53]){
      const cup=cylinder(lamp,.175,.1,steel,x,0,.23);cup.rotation.x=Math.PI/2;
      const optical=cylinder(lamp,.136,.06,black,x,0,.3);optical.rotation.x=Math.PI/2;
      const lens=sphere(lamp,.108,cobalt,x,0,.34);lens.scale.z=.42;
      ring(lamp,.116,.015,aluminum,x,0,.362);
      sphere(lamp,.03,led,x+.035,.035,.39);
    }
    for(const y of [-.235,.235])tube(lamp,[[-.98,y,.29],[-.35,y,.32],[.52,y,.32],[.86,y*.83,.29]],.028,led);
    tube(lamp,[[.94,-.19,.26],[1.01,-.04,.26],[.9,.2,.26]],.019,amber);
    const glass=new THREE.MeshPhysicalMaterial({color:0xc4e5f4,metalness:.08,roughness:.08,transparent:true,opacity:.13,clearcoat:1,side:THREE.DoubleSide,depthWrite:false});
    const cover=mesh(lamp,new THREE.ShapeGeometry(outline),glass,0,0,.41);cover.castShadow=false;
    for(const x of [-.75,.65]){box(lamp,.13,.18,.15,steel,x,-.46,0);cylinder(lamp,.035,.07,black,x,-.37,.22).rotation.x=Math.PI/2;}
    const beamFade=texture((c,w,h)=>{
      const gradient=c.createLinearGradient(0,0,0,h);
      gradient.addColorStop(0,'#dddddd');gradient.addColorStop(.35,'#666666');gradient.addColorStop(1,'#000000');
      c.fillStyle=gradient;c.fillRect(0,0,w,h);
    },32,128);beamFade.colorSpace=THREE.NoColorSpace;
    const beamMaterial=new THREE.MeshBasicMaterial({color:0xb5dfff,alphaMap:beamFade,transparent:true,opacity:.09,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false});
    for(const x of [-.69,-.08,.53]){
      const beam=mesh(lamp,new THREE.ConeGeometry(.34,1.6,24,1,true),beamMaterial,x,0,1.21);
      beam.name='headlamp-beam';beam.rotation.x=-Math.PI/2;beam.castShadow=false;beam.receiveShadow=false;
    }
    const spill=new THREE.PointLight(0xb8dfff,2.2,4,2);spill.position.set(0,0,.65);lamp.add(spill);
    animateStation(parent,t=>{const intensity=.9+Math.sin(t*.9)*.1;led.emissiveIntensity=2.6*intensity;beamMaterial.opacity=.1*intensity;spill.intensity=2.2*intensity;});
    return lamp;
  }
  function llmMonitoring(parent){
    const monitor=new THREE.Group();monitor.name='llm-monitoring-console';parent.add(monitor);
    for(const x of [-1.35,1.35])column(monitor,x,.2,-.75,1.7);
    rounded(monitor,3.96,2.3,.18,graphite,0,1.98,-.57,.08);
    const dashboard=texture((c,w,h)=>{
      c.fillStyle='#0b1725';c.fillRect(0,0,w,h);
      c.fillStyle='#e4eff7';c.font='600 108px Arial';c.fillText('LOCAL LLM',70,139);
      c.fillStyle='#91b2cc';c.font='34px monospace';c.fillText('LANGUAGE → TOOLS → MONITORING',73,207);
      c.fillStyle='#152e45';c.fillRect(70,265,560,430);c.strokeStyle='#6ea6cd';c.lineWidth=3;c.strokeRect(70,265,560,430);
      c.fillStyle='#e7f2fa';c.font='600 138px Arial';c.fillText('LLM',197,473);
      c.fillStyle='#9fc4df';c.font='36px monospace';c.fillText('LOCAL INFERENCE',187,536);
      const network=[[150,603],[240,645],[350,595],[465,644],[546,602]];
      c.strokeStyle='#608da9';c.lineWidth=3;for(let i=0;i<network.length-1;i++){c.beginPath();c.moveTo(...network[i]);c.lineTo(...network[i+1]);c.stroke();}
      c.fillStyle='#c0e5ff';for(const [x,y] of network){c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.fill();}
      c.fillStyle='#e4eff7';c.font='54px Arial';c.fillText('LabVIEW',775,330);
      c.fillStyle='#93b4cf';c.font='29px monospace';c.fillText('SYSTEM MONITORING',777,379);
      for(let i=0;i<4;i++){const y=435+i*65;c.strokeStyle='#243e53';c.beginPath();c.moveTo(775,y);c.lineTo(w-75,y);c.stroke();}
      for(let line=0;line<2;line++){c.strokeStyle=line?'#a0b8c9':'#80d1ff';c.lineWidth=5;c.beginPath();for(let i=0;i<70;i++){const x=775+i*9,y=525+line*65-Math.sin(i*.18+line)*28-Math.cos(i*.53)*12;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
      c.strokeStyle='#93bbd5';c.lineWidth=4;c.beginPath();c.moveTo(657,477);c.lineTo(735,477);c.lineTo(721,465);c.moveTo(735,477);c.lineTo(721,489);c.stroke();
      c.fillStyle='#a9c3d5';c.font='34px monospace';c.fillText('REQUEST',90,810);c.fillText('VALIDATED TOOL CALL',470,810);c.fillText('STATUS',1260,810);
      c.strokeStyle='#416983';c.lineWidth=4;c.beginPath();c.moveTo(90,742);c.lineTo(w-90,742);c.stroke();
    },1536,900);
    mesh(monitor,new THREE.PlaneGeometry(3.78,2.16),new THREE.MeshBasicMaterial({map:dashboard,toneMapped:false}),0,1.98,-.466);
    rounded(monitor,3.65,.15,.85,white,0,.65,.43);rounded(monitor,2.35,.045,.48,graphite,-.15,.76,.47);
    for(let row=0;row<3;row++)for(let col=0;col<12;col++)box(monitor,.12,.014,.06,aluminum,-1.02+col*.15,.79,.3+row*.1);
    const mouse=rounded(monitor,.19,.06,.26,graphite,1.37,.77,.46);
    for(let i=0;i<3;i++){
      const signal=sphere(monitor,.026,glow,0,1.98+2.16*(.5-742/900),-.442);
      animations.push(t=>signal.position.x=-1.65+((t*.18+i/3)%1)*3.3);
    }
    tube(monitor,[[-1.35,.45,-.75],[-1.35,.31,-.1],[1.2,.31,-.1],[1.2,.52,.43]],.028,black);
  }
  function rearEquipment(parent){
    const cell=new THREE.Group();cell.name='plc-connected-equipment';parent.add(cell);
    rounded(cell,3.8,.18,1.3,graphite,0,.05,-2.02,.06);
    rounded(cell,2.9,.65,.85,white,0,.58,-2.02);
    for(const x of [-1.6,1.6])column(cell,x,.2,-2.1,2.8);
    rounded(cell,3.4,.22,.25,white,0,3,-2.1);box(cell,2.85,.06,.31,steel,0,2.87,-2.1);
    rounded(cell,.46,.4,.43,graphite,.4,2.7,-2.06);cylinder(cell,.04,.8,steel,.4,2.13,-2.06);rounded(cell,.23,.2,.28,white,.4,1.68,-2.06);
    rounded(cell,1.6,.12,.67,steel,0,1,-1.96);for(const x of [-.6,.6])cylinder(cell,.13,.16,graphite,x,1.14,-1.96);
    const glazing=new THREE.MeshPhysicalMaterial({color:0x7196b0,transparent:true,opacity:.14,roughness:.2,metalness:.15,depthWrite:false,side:THREE.DoubleSide});
    const window=mesh(cell,new THREE.PlaneGeometry(2.8,1.65),glazing,0,1.86,-1.56);window.castShadow=false;
    for(const x of [-1.4,1.4])box(cell,.055,1.7,.06,aluminum,x,1.86,-1.54);
    box(cell,.4,.035,.045,steel,1.04,1.68,-1.49);
    column(cell,1.73,.2,-2.05,2.4);cylinder(cell,.075,.13,glow,1.73,2.7,-2.05);cylinder(cell,.075,.13,amber,1.73,2.54,-2.05);
    tube(cell,[[-1,.5,-1.63],[-1.2,.26,-1.24],[-1.2,.26,-.8],[-1,.43,-.55]],.034,black);
  }
  // Update only nearby stations in Road mode. Texture redraws are capped at 10 Hz.
  function animateStation(station,update){
    animations.push(t=>{if(mode==='overview'||Math.abs(current-positions[station.userData.stopIndex])<.065)update(t);});
  }
  function statusMaterial(color){return new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.7,roughness:.35});}
  const aqua=statusMaterial(0x59cbdc),green=statusMaterial(0x6dcca3),copper=standard(0xbd8054,.7,.3);
  function dataLink(station,name,points,material=aqua,bidirectional=false){
    const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const cable=mesh(station,new THREE.TubeGeometry(path,32,.023,6,false),graphite);cable.name=name;
    const packets=[sphere(station,.05,material),sphere(station,.05,material)];
    packets.forEach(p=>{p.castShadow=false;p.name=`${name}-packet`;});
    const point=new THREE.Vector3();
    const update=t=>packets.forEach((packet,i)=>{
      let u=(t*.22+i*.5)%1;if(bidirectional&&i)u=1-u;
      path.getPointAt(u,point);packet.position.copy(point);
    });update(0);animateStation(station,update);return cable;
  }
  function dashboard(station,name,title,paint,{x=0,y=2,z=-.8,w=2.6,h=1.5}={}){
    const panel=new THREE.Group();panel.name=name;panel.position.set(x,y,z);station.add(panel);
    rounded(panel,w+.12,h+.12,.16,graphite,0,0,0,.06);
    const c=document.createElement('canvas');c.width=1200;c.height=720;const ctx=c.getContext('2d');
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
    mesh(panel,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,toneMapped:false}),0,0,.091);
    const render=t=>{
      ctx.fillStyle='#091724';ctx.fillRect(0,0,1200,720);
      ctx.fillStyle='#e0eff8';ctx.font='600 58px Arial';ctx.fillText(title,42,76);
      ctx.fillStyle='#7798b2';ctx.font='22px monospace';ctx.fillText('ILLUSTRATIVE DATA / LIVE DEMO',44,121);
      paint(ctx,t);map.needsUpdate=true;
    };
    render(0);let lastTime=0;
    animateStation(station,t=>{if(Math.abs(t-lastTime)<.1)return;lastTime=t;render(t);});
    return panel;
  }
  function chart(ctx,x,y,w,h,t,color='#7cdbed',phase=0){
    ctx.strokeStyle='#254156';ctx.lineWidth=2;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x,y+i*h/3);ctx.lineTo(x+w,y+i*h/3);ctx.stroke();}
    ctx.strokeStyle=color;ctx.lineWidth=5;ctx.beginPath();
    for(let i=0;i<64;i++){const px=x+i*w/63,py=y+h*.5+Math.sin(i*.19-t+phase)*h*.23+Math.cos(i*.47+phase)*h*.08;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();
  }
  function fixture(parent,x=0,z=0){
    rounded(parent,1.25,.44,1.1,white,x,.5,z);rounded(parent,1.4,.12,1.22,steel,x,.8,z);
    for(const dx of [-.5,.5])for(const dz of [-.4,.4])cylinder(parent,.036,.1,graphite,x+dx,.9,z+dz);
  }
  function lampCell(g){
    g.userData.equipment='dual-robot-headlamp-cell';
    robot(g,-1.62,-.18,.86,{name:'lamp-robot-left'});
    robot(g,1.62,-.18,.86,{name:'lamp-robot-right',yaw:Math.PI,phase:1.8});
    rounded(g,1.95,.48,.95,white,0,.6,.15,.09);rounded(g,1.8,.15,.8,graphite,0,.96,.15);
    for(const x of [-.64,.64])cylinder(g,.045,.35,steel,x,1.16,.18);
    headlamp(g);
    for(const x of [-1.93,1.93])column(g,x,.2,-1.1,2.7);
    box(g,3.96,.11,.11,aluminum,0,2.9,-1.1);screen(g,'LAMP INSPECTION','DUAL ROBOT CELL',1.4,.42,0,2.65,-1.05);
  }
  function visionCell(g){
    g.userData.equipment='four-direction-vision-and-pick-place';
    fixture(g,0,0);rounded(g,.66,.14,.48,graphite,0,.97,0);
    rounded(g,.35,.12,.28,white,0,1.1,0);
    // The four bases form a compass around the shared alignment fixture.
    const specs=[['west',-1.65,0,0,'gripper',.72],['east',1.65,0,Math.PI,'gripper',.72],['north',0,-1.2,-Math.PI/2,'vision',.65],['south',0,1.2,Math.PI/2,'vision',.6]];
    specs.forEach(([direction,x,z,yaw,tool,scale],i)=>robot(g,x,z,scale,{name:`vision-robot-${direction}`,yaw,tool,phase:i*1.6}));
    for(const x of [-1.55,1.55]){
      rounded(g,.7,.11,.46,graphite,x,.38,.93);
      for(const dx of [-.17,.17])rounded(g,.16,.07,.18,white,x+dx,.48,.93);
    }
    const optic=ring(g,.27,.02,aqua,0,1.19,0);optic.rotation.x=-Math.PI/2;optic.name='alignment-target';
    box(g,.54,.008,.018,aqua,0,1.18,0);box(g,.018,.008,.5,aqua,0,1.18,0);
    const pulse=new THREE.MeshBasicMaterial({color:0x80ddf0,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false});
    const scan=mesh(g,new THREE.PlaneGeometry(.7,.5),pulse,0,1.24,0);scan.rotation.x=-Math.PI/2;scan.castShadow=false;scan.name='vision-scan';
    animateStation(g,t=>{scan.position.y=1.22+(Math.sin(t*1.2)+1)*.09;pulse.opacity=.1+(Math.sin(t*1.2)+1)*.06;});
    for(const x of [-1.6,1.6])column(g,x,.2,-1.5,3.05);
    box(g,3.3,.12,.12,aluminum,0,3.25,-1.5);
    for(const x of [-.38,.38])box(g,.075,.12,1.2,steel,x,3.25,-.9);
    box(g,.9,.12,.14,aluminum,0,3.25,-.3);
    cylinder(g,.08,.25,steel,0,3.08,-.3);
    const cameraRig=new THREE.Group();cameraRig.name='overhead-vision-camera';cameraRig.position.set(0,2.9,-.3);g.add(cameraRig);
    const target=new THREE.Vector3(0,1.19,0);
    cameraRig.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),target.clone().sub(cameraRig.position).normalize());
    rounded(cameraRig,.64,.48,.4,graphite,0,0,0,.06);
    for(const x of [-.24,.24])box(cameraRig,.04,.36,.3,steel,x,0,-.015);
    for(let i=0;i<5;i++)box(cameraRig,.3,.018,.018,black,0,-.12+i*.06,-.21);
    const barrel=cylinder(cameraRig,.19,.26,black,0,0,.31);barrel.rotation.x=Math.PI/2;
    ring(cameraRig,.19,.025,steel,0,0,.4);
    const lens=cylinder(cameraRig,.135,.025,cobalt,0,0,.445);lens.rotation.x=Math.PI/2;lens.name='overhead-camera-lens';
    const lightMaterial=aqua.clone();
    ring(cameraRig,.245,.035,lightMaterial,0,0,.42);
    sphere(cameraRig,.025,glow,.21,.15,.215);
    tube(g,[[.23,2.94,-.48],[.36,3.12,-.53],[.38,3.34,-.9],[.38,3.34,-1.5],[1.55,3.34,-1.5],[1.6,2.2,-1.5]],.022,black);
    // Fine optical sight-lines reveal the inspected area without covering the robots.
    const sightMaterial=new THREE.LineBasicMaterial({color:0x78d2ee,transparent:true,opacity:.22,depthWrite:false});
    const origin=new THREE.Vector3(0,0,.47).applyQuaternion(cameraRig.quaternion).add(cameraRig.position);
    const points=[];
    for(const x of [-.35,.35])for(const z of [-.25,.25])points.push(origin,new THREE.Vector3(x,1.2,z));
    const sights=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),sightMaterial);g.add(sights);
    animateStation(g,t=>{lightMaterial.emissiveIntensity=.65+Math.sin(t*1.2)*.15;sightMaterial.opacity=.18+(Math.sin(t*1.2)+1)*.035;});
    screen(g,'PICK & PLACE / ACTIVE ALIGN','OVERHEAD VISION / SHARED FIXTURE',2.6,.4,0,2.61,-1.45);
  }

  function dispensingCell(g){
    g.userData.equipment='robot-dispensing-feedback-cell';
    const sweep=t=>Math.sin(t*.5)*.28;
    robot(g,-1.25,.1,.9,{name:'dispensing-robot',tool:'dispenser',sweep});
    rounded(g,1.45,.55,1.05,white,-.2,.55,.2);
    rounded(g,1.5,.13,1.1,steel,-.2,.91,.2);
    rounded(g,1.12,.04,.74,graphite,-.2,.995,.2);
    // The deposited bead follows the actual nozzle's horizontal sweep.
    const beadPoints=[];for(let i=0;i<=40;i++){
      const a=-.28+i*.56/40;
      beadPoints.push([-1.25+.9*(Math.cos(a)*1.14+Math.sin(a)*.08),1.023,.1+.9*(-Math.sin(a)*1.14+Math.cos(a)*.08)]);
    }
    const bead=tube(g,beadPoints,.025,aqua.clone());bead.name='deposited-bead';
    tank(g,-1.65,-1.05,.27,1.05);
    tube(g,[[-1.65,1.8,-1.05],[-1.8,2,-.7],[-1.35,1.6,-.15],[-1.25,.9,-.05]],.035,cobalt);
    rounded(g,.82,1.5,.58,white,1.5,.98,-.15);column(g,1.5,.2,-.15,.3);
    const controller=dashboard(g,'dispensing-controller','DISPENSE CONTROL',(c,t)=>{
      c.fillStyle='#81d9e9';c.font='600 115px Arial';c.fillText((48+Math.sin(t*.5)*3).toFixed(1),56,285);
      c.font='30px monospace';c.fillText('FLOW / DEMO',60,335);chart(c,56,390,1080,175,t);
      c.fillStyle='#a3bacc';c.font='34px Arial';c.fillText('SETPOINT  /  MEASURE  /  ADJUST',56,654);
    },{x:1.5,y:1.45,z:.17,w:.72,h:.8});
    controller.userData.control='variable-flow-feedback';
    // A separate networked machine makes controller-to-equipment communication visible.
    rounded(g,1.4,.8,.7,graphite,.05,.66,-1.12);
    rounded(g,1.26,.54,.07,white,.05,.75,-.72);
    screen(g,'EQUIPMENT','COMMAND / FEEDBACK',1.13,.37,.05,1.36,-.68);
    for(const x of [-.45,0,.45])box(g,.08,.08,.04,green,x,.72,-.66);
    dataLink(g,'controller-equipment-link',[[1.5,.54,-.15],[1.18,.3,-.65],[.65,.3,-1.12],[.6,.75,-1.12]],aqua,true);
    dataLink(g,'nozzle-feedback-link',[[-.2,1.03,.4],[.45,.32,.62],[1.45,.32,.62],[1.5,.74,.18]],green);
    animateStation(g,t=>{bead.material.emissiveIntensity=.65+Math.sin(t*.5)*.12;});
  }
  function waterCell(g){
    g.userData.equipment='remote-water-treatment-scada';
    // Process hardware behind the operator's console, on its own service plinth.
    rounded(g,4.05,.15,1.55,graphite,0,.12,-1.68);
    for(const [x,height] of [[-1.35,1.65],[0,1.95],[1.35,1.5]]){
      const vessel=tank(g,x,-1.65,.49,height);vessel.name='water-treatment-vessel';
      const gauge=box(g,.09,height*.55,.055,aqua,x,.75+height*.25,-1.14);gauge.name='tank-level-indicator';
    }
    tube(g,[[-1.35,.85,-1.15],[-1.35,.5,-.87],[0,.5,-.87],[0,.85,-1.15]],.06,steel);
    tube(g,[[0,2.65,-1.65],[0,2.9,-1.65],[1.35,2.9,-1.65],[1.35,2.18,-1.65]],.055,steel);
    for(const x of [-.85,.65]){
      cylinder(g,.16,.35,cobalt,x,.47,-.78).rotation.z=Math.PI/2;
      const valve=ring(g,.12,.025,amber,x,.72,-.78);valve.rotation.x=-Math.PI/2;
    }
    dataLink(g,'water-flow',[[-1.35,.86,-1.1],[-1.35,.52,-.83],[0,.52,-.83],[0,.86,-1.1]],aqua);
    for(const x of [-.95,.95])column(g,x,.2,.65,1.45);
    dashboard(g,'scada-supervisory-monitor','WATER TREATMENT / SCADA',(c,t)=>{
      const levels=[.56+Math.sin(t*.25)*.06,.73+Math.sin(t*.25+.8)*.05,.43+Math.sin(t*.25+1.8)*.04];
      for(let i=0;i<3;i++){
        const x=65+i*250;c.fillStyle='#20394e';c.fillRect(x,192,150,235);
        c.fillStyle='#4baacb';c.fillRect(x+9,419-218*levels[i],132,218*levels[i]);
        c.strokeStyle='#adcadd';c.lineWidth=3;c.strokeRect(x,192,150,235);
        c.fillStyle='#d7eaf5';c.font='34px monospace';c.fillText(`${Math.round(levels[i]*100)}%`,x+38,474);
        c.font='25px monospace';c.fillText(['RAW','TREAT','OUT'][i],x+25,170);
      }
      c.strokeStyle='#61b5d1';c.lineWidth=7;c.beginPath();c.moveTo(215,330);c.lineTo(315,330);c.moveTo(465,330);c.lineTo(565,330);c.stroke();
      c.fillStyle='#94e4c0';c.font='34px Arial';c.fillText('REMOTE',865,205);c.fillText('CONTROL',865,246);
      c.fillStyle='#254d50';c.fillRect(850,286,270,78);c.fillStyle='#baf1d8';c.font='34px Arial';c.fillText('PUMP ON',885,337);
      c.fillStyle='#88aabf';c.font='26px monospace';c.fillText('STATUS / ACK',865,405);
      chart(c,65,520,1040,105,t*.4);c.fillStyle='#8faec3';c.font='25px monospace';c.fillText('PLC TELEMETRY  /  REMOTE COMMANDS',65,685);
    },{x:-.18,y:1.75,z:.77,w:2.65,h:1.57});
    rounded(g,2.95,.12,.56,white,-.18,.82,1.02);rounded(g,1.6,.035,.31,graphite,-.36,.91,1.05);
    rounded(g,.63,1.2,.56,white,1.7,.88,-.4);screen(g,'PLC','NETWORK',.49,.32,1.7,1.2,-.09);
    const tablet=dashboard(g,'remote-control-terminal','REMOTE',(c,t)=>{
      c.fillStyle='#86d6e6';c.font='64px Arial';c.fillText('WEB CONTROL',65,240);
      c.fillStyle='#25504c';c.fillRect(65,300,1060,160);c.fillStyle='#c0f7d8';c.font='70px Arial';c.fillText('PUMP / VALVE',125,402);
      c.fillStyle='#9fbbce';c.font='40px monospace';c.fillText('COMMAND ↔ STATUS',65,565);
    },{x:1.68,y:1.34,z:.98,w:.68,h:.92});tablet.rotation.y=-.2;
    column(g,1.68,.2,.95,.6);
    dataLink(g,'scada-plc-network',[[1.7,1,-.09],[1.72,.4,.4],[.9,.4,.72],[.9,1.2,.77]],aqua,true);
    dataLink(g,'remote-command-link',[[1.68,.85,.98],[1.92,.4,.8],[1.92,.4,-.36],[1.7,.75,-.4]],green,true);
  }
  function batteryCell(g){
    g.userData.equipment='battery-charge-discharge-monitoring';
    rounded(g,2.14,.24,1.65,graphite,-.94,.42,.28);
    const cells=new THREE.Group();cells.name='battery-cell-pack';g.add(cells);
    for(let row=0;row<2;row++)for(let col=0;col<6;col++){
      const x=-1.8+col*.34,z=-.12+row*.8;
      const cell=cylinder(cells,.136,.64,cobalt,x,.88,z);cell.name='battery-cell';
      cylinder(cells,.1,.03,steel,x,1.216,z);cylinder(cells,.04,.025,copper,x,1.24,z);
    }
    for(const z of [-.12,.68])box(g,1.86,.023,.055,copper,-.95,1.26,z);
    const board=new THREE.Group();board.name='charge-discharge-circuit';board.position.set(1.05,.68,.04);g.add(board);
    rounded(board,1.34,.1,1.28,standard(0x1d5d59,.25,.55));
    for(const x of [-.51,.51])for(const z of [-.5,.5])cylinder(board,.025,.11,steel,x,.01,z);
    for(const x of [-.28,.28]){
      rounded(board,.33,.12,.39,black,x,.12,0);
      for(let k=0;k<5;k++)box(board,.4,.035,.022,steel,x,.14,-.15+k*.07);
    }
    for(const z of [-.4,.4]){
      cylinder(board,.095,.2,graphite,-.46,.16,z);
      const coil=ring(board,.1,.035,copper,.43,.13,z);coil.rotation.x=-Math.PI/2;
      for(const x of [-.2,0,.2])box(board,.1,.028,.045,amber,x,.075,z);
      box(board,.9,.008,.016,copper,0,.059,z+.08);
    }
    const supply=new THREE.Group();supply.name='bidirectional-charger';g.add(supply);
    rounded(supply,1.28,.46,.62,white,1.06,.46,1.01);screen(supply,'CHARGE ↔ DISCHARGE','CURRENT CONTROL',1.05,.29,1.06,.5,1.34);
    const positive=standard(0xc46359,.25,.4);
    tube(g,[[-.05,1.26,-.12],[.28,1.32,-.12],[.3,.85,.1],[.4,.78,.1]],.027,positive);
    tube(g,[[-.05,1.26,.68],[.25,1.1,.72],[.35,.81,.38],[.43,.78,.35]],.027,black);
    tube(g,[[1.05,.72,.6],[1.05,.82,.78],[1.05,.72,1.02]],.03,black);
    const energyCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(1.05,.76,1.02),new THREE.Vector3(.5,.86,.8),new THREE.Vector3(.1,1.3,.5),new THREE.Vector3(-.94,1.3,.28)]);
    mesh(g,new THREE.TubeGeometry(energyCurve,32,.018,6,false),graphite);
    const chargeDot=sphere(g,.055,green);chargeDot.name='charge-discharge-current';chargeDot.castShadow=false;
    const sample=t=>{const phase=(t%16)/16;return{charging:phase<.5,soc:62+12*(1-Math.cos(phase*Math.PI*2))/2};};
    const point=new THREE.Vector3();
    const flow=t=>{const state=sample(t),u=(t*.25)%1;energyCurve.getPointAt(state.charging?u:1-u,point);chargeDot.position.copy(point);chargeDot.material=state.charging?green:aqua;};flow(0);animateStation(g,flow);
    for(const x of [-1.35,1.35])column(g,x,.2,-1.02,1.5);
    dashboard(g,'battery-live-monitor','BATTERY / LIVE MONITORING',(c,t)=>{
      const state=sample(t);c.fillStyle=state.charging?'#92e9b9':'#88d9ff';c.font='600 46px Arial';c.fillText(state.charging?'CHARGING':'DISCHARGING',48,195);
      c.fillStyle='#deeff8';c.font='56px Arial';c.fillText(`${state.soc.toFixed(0)}% SOC`,48,278);c.fillText(`${state.charging?'+':'−'}2.4 A`,440,278);c.fillText(`${(28+Math.sin(t*.3)*.8).toFixed(1)}°C`,840,278);
      for(let i=0;i<12;i++){
        const height=90+state.soc*.65+Math.sin(i*.8+t*.3)*13,x=50+i*92;
        c.fillStyle='#234052';c.fillRect(x,324,62,185);c.fillStyle=i%3?'#65bbd0':'#84dac7';c.fillRect(x,509-height,62,height);
        c.fillStyle='#aac9dd';c.font='22px monospace';c.fillText(String(i+1).padStart(2,'0'),x+16,542);
      }
      chart(c,50,574,1090,80,t*.5);c.fillStyle='#92b5cb';c.font='23px monospace';c.fillText('CELL VOLTAGES  /  CURRENT  /  TEMPERATURE',50,695);
    },{x:0,y:2.25,z:-.87,w:3.15,h:1.48});
  }

  stationSpecs.forEach((spec,i)=>{
    const g=platform(spec,i),id=window.factoryStops[i].id;
    if(id==='g90'){
      lampCell(g);
    }else if(id==='vision'){
      visionCell(g);
    }else if(id==='process'){
      dispensingCell(g);
    }else if(id==='embedded'){
      cabinet(g,-.7,-.35,1.7);screen(g,'EMBEDDED','C++ / Qt / Linux',1.5,.9,1,1.45,.35);column(g,1,.2,.3,.7);tube(g,[[-.7,.5,.2],[-.3,.3,.6],[1,.3,.6],[1,.8,.5]],.035,black);
    }else if(id==='water'){
      waterCell(g);
    }else if(id==='viewer'){
      cabinet(g,-1,-.4,1.1);column(g,.8,.2,-.25,1.3);screen(g,'ForTex-Viewer','DATA / VISUALIZATION',2.12,1.22,.7,1.93,-.12);rounded(g,1.7,.07,.7,graphite,.7,1.1,.25);for(let k=0;k<7;k++)box(g,.07,.12+k*.055,.04,cobalt,-.1+k*.22,1.7,-.01);
    }else if(id==='battery'){
      batteryCell(g);
    }else if(id==='smartfarm'){
      for(const x of [-1.7,1.7])column(g,x,.2,-.7,2.6);box(g,3.5,.1,.13,aluminum,0,2.8,-.7);
      for(const z of [-.5,.5]){rounded(g,3.3,.2,.57,white,0,.72,z);for(let j=0;j<6;j++){cylinder(g,.12,.15,graphite,-1.3+j*.52,.85,z);const sprout=sphere(g,.11,standard(0x6b8990,.1,.75),-1.3+j*.52,1.02,z);sprout.scale.set(.55,1.7,.7);}}
      screen(g,'SmartFarm','WEB / MARKETPLACE',1.05,.6,0,2.1,-.6);
    }else if(id==='plc-ai'){
      rearEquipment(g);
      cabinet(g,-1,-.55,1.1);const graph=nodes(g,.65,-.3);screen(g,'PLC AI STUDIO','CONTEXT / RULES / REVIEW',2.1,.86,.35,1.02,.73);rounded(g,1.25,.14,1.25,steel,.7,.38,-.3);animations.push(t=>graph.rotation.y=Math.sin(t*.25)*.12);
    }else if(id==='local-llm'){
      llmMonitoring(g);
    }else if(id==='journey'){
      for(const [x,y,z,title] of [[-1.1,1.45,0,'DISCOVER'],[.8,2,-.3,'COLLABORATE'],[.25,.75,.6,'CHAT']]){screen(g,title,'JourneyMate',1.55,.84,x,y,z);column(g,x,.2,z-.1,Math.max(.2,y-.65));}
      tube(g,[[-1.1,1,0],[-.6,1,.2],[.8,1.5,-.3]],.019,glow);
    }
  });

  const eraMarkers=zones.map(zone=>{
    const element=document.createElement('div');element.className='map-era';
    const title=document.createElement('strong'),period=document.createElement('span');title.textContent=zone.title;period.textContent=zone.period;element.append(title,period);document.querySelector('#overview-markers').append(element);
    return {point:new THREE.Vector3((zone.start+zone.end)/2-midpoint,0,zone.z-3.25),element};
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
    const mapHeight=mobile?(routeWidth+6)/(2*halfFov*usableHeight):Math.max((routeWidth+6)/(2*halfFov*camera.aspect*.86),29/(2*halfFov*usableHeight));
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
