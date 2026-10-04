/* CyberVault FPS Engine — Murder Mystery Escape Room */
(function(){
'use strict';

/* ── AUDIO ──────────────────────────────────────────────────── */
var SFX={ctx:null,
init:function(){if(this.ctx)return;try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();this._amb();}catch(e){}},
_t:function(f,t,d,v,l){v=v||.06;l=l||0;if(!this.ctx||this.ctx.state==='suspended')return;try{var o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=t;o.frequency.value=f;var tm=this.ctx.currentTime+l;g.gain.setValueAtTime(v,tm);g.gain.exponentialRampToValueAtTime(.001,tm+d);o.connect(g);g.connect(this.ctx.destination);o.start(tm);o.stop(tm+d);}catch(e){}},
step:function(){this._t(110,'sine',.055,.02);},
click:function(){this._t(880,'sine',.04,.025);},
uv:function(){this._t(1400,'triangle',.1,.04);this._t(900,'sine',.1,.025,.04);},
clue:function(){var s=this;[523,659,784].forEach(function(f,i){s._t(f,'sine',.2,.065,i*.09);});},
beep:function(){this._t(1100,'square',.06,.018);},
err:function(){this._t(200,'sawtooth',.12,.04);},
unlock:function(){var s=this;[400,700,1000].forEach(function(f,i){s._t(f,'sine',.24,.085,i*.11);});},
door:function(){this._t(80,'sawtooth',.22,.06);this._t(180,'sine',.22,.032,.08);},
pickup:function(){this._t(1500,'sine',.055,.032);this._t(2000,'sine',.055,.023,.07);},
puzzle:function(){this._t(600,'triangle',.08,.038);this._t(900,'triangle',.12,.038,.07);},
wrong:function(){this._t(150,'sawtooth',.18,.048);this._t(100,'sawtooth',.18,.038,.06);},
_amb:function(){var o=this.ctx.createOscillator(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();o.type='sawtooth';o.frequency.value=42;f.type='lowpass';f.frequency.value=85;g.gain.value=.008;o.connect(f);f.connect(g);g.connect(this.ctx.destination);o.start();var s=this;setInterval(function(){if(Math.random()<.1)s._t(55+Math.random()*35,'sine',.3+Math.random()*.5,.014);},6000);}
};

/* ── SUSPECTS ───────────────────────────────────────────────── */
var SUSPECTS={
thorne:{name:'Dr. Aris Thorne',color:'#e74c3c',stress:30,
  r:{hint:["Look harder. UV traces lead everywhere.","Every clue is a test, detective.","Check walls under blacklight — if you dare."],
     code:["Codes… I love prime numbers. And years.","Code is written in light you cannot see.","The keypad remembers who built it."],
     suspect:["I am not your suspect. I am your intellectual superior.","You waste time on me while evidence decays."],
     uv:["UV fluorescence… elegant, isn't it?","Invisible evidence is always most damning."],
     def:["Another question. How tedious.","The truth is in the evidence, not my words.","Fascinating you haven't found the UV cipher yet.","Most investigators solve room two faster."]}},
maya:{name:'Maya Lin',color:'#2ecc9b',stress:72,
  r:{hint:["Glowing symbols near the door — they mean something.","Check under the table. Markings.","The floor tiles… the order matters."],
     code:["I didn't know the code! They told me nothing!","Maybe the briefcase note? Something about a year.","Thorne mentioned a year… that's all I know."],
     suspect:["I was doing data entry! I had no idea!","Ask Victor. He had security access, not me."],
     uv:["UV reveals what they tried to hide.","I saw Thorne writing on walls with something glowing."],
     def:["Please hurry. I don't know how much time we have.","Something's wrong with this room.","Noises behind the wall.","Get us out. Please."]}},
victor:{name:'Victor Vance',color:'#f39c12',stress:50,
  r:{hint:["Negative. No intel without clearance.","Check six. Always.","Military protocol. No specifics."],
     code:["Shift rotation unrelated to codes. Stand down.","I accessed at 22:00. Perimeter check. On record.","Security gaps. Several. Ask about those."],
     suspect:["Alibi is solid. Check GPS logs.","Twenty years of service and you accuse me?"],
     uv:["UV was standard at Site-09. Thorne insisted.","I flagged unusual lighting in B4. Was ignored."],
     def:["Move with purpose. Time is tactical.","Every second you waste is a second they use.","This scene is staged. Someone wanted you here.","Trust instincts."]}}};

function suspectReply(suspId,q){var s=SUSPECTS[suspId];var ql=q.toLowerCase();var key='def';
  if(ql.includes('hint')||ql.includes('help'))key='hint';
  else if(ql.includes('code')||ql.includes('passcode')||ql.includes('number'))key='code';
  else if(ql.includes('suspect')||ql.includes('guilty')||ql.includes('did you'))key='suspect';
  else if(ql.includes('uv')||ql.includes('light')||ql.includes('glow'))key='uv';
  var arr=s.r[key]||s.r.def;s.stress=Math.min(100,s.stress+5);
  return arr[Math.floor(Math.random()*arr.length)]+(s.stress>80?' [BREAKING POINT: '+s.stress+'%]':'');}

/* ── ROOM DATA ──────────────────────────────────────────────── */
var ROOMS=[
{id:1,name:'ROOM 01 — SURGICAL VAULT',bg:0x040608,fog:.085,amb:[0x1a2438,.55],start:[0,1.7,4],time:600,code:'8041',
 clues:{'S1A':{name:'Operating Table',tag:'BIO-01',desc:'Type O− stain on headrest. Hydraulic tilt unlocked. Recent use confirmed.',item:{icon:'🩺',label:'Scalpel'}},
   'S1B':{name:'UV Wall Cipher',tag:'UV-02',desc:'Phosphorescent code [ 8-0-4-1 ]. Handwriting: Thorne.',uvOnly:true},
   'S1C':{name:'Blast Door Keypad',tag:'LOCK-03',desc:'4-digit exit. Burn marks from prior bypass.',isKeypad:true}}},
{id:2,name:'ROOM 02 — DETECTIVE LAB',bg:0x0a0600,fog:.065,amb:[0x1e1206,.6],start:[0,1.7,4],time:720,isComboPuzzle:true,comboSolution:[1,9,5,3],
 clues:{'D2A':{name:'World Map Board',tag:'MAP-04',desc:'Red pins mark Thorne\'s operation zones.',item:{icon:'🗺️',label:'Map Fragment'}},
   'D2B':{name:'Glowing Pyramid',tag:'ART-05',desc:'Active UV emitter at 365nm. Neural interface.',item:{icon:'🔺',label:'Pyramid Key'}},
   'D2C':{name:'Combination Safe',tag:'LOCK-06',desc:'4-dial safe. Hint: year stamped on briefcase.',isComboPuzzle:true}}},
{id:3,name:'ROOM 03 — PRISON CELL',bg:0x060504,fog:.08,amb:[0x120e08,.5],start:[0,1.7,3.5],time:540,isPressure:true,pressureSolution:[0,3,7,5,2,9],
 clues:{'P3A':{name:'Iron Gate',tag:'GATE-07',desc:'Forced from inside. Bloodstained grip on upper bar.',item:{icon:'⛓️',label:'Rusty Key'}},
   'P3B':{name:'UV Floor Arrows',tag:'UV-08',desc:'Pressure sequence: NW→SE→NE→SW→C→W.',uvOnly:true},
   'P3C':{name:'Pressure Floor',tag:'LOCK-09',desc:'6 tiles in correct sequence unlock exit.',isPressure:true}}},
{id:4,name:'ROOM 04 — MEDIEVAL HALL',bg:0x080402,fog:.07,amb:[0x1a0e04,.55],start:[0,1.7,4.5],time:660,isColor:true,colorSolution:[2,0,3,1],
 clues:{'M4A':{name:'Heraldic Shield',tag:'CREST-10',desc:'Lion crest matches Thorne\'s ancestral sigil.',item:{icon:'🛡️',label:'Crest Rubbing'}},
   'M4B':{name:'Goblets',tag:'PHY-11',desc:'Hemlock residue. Sourced from vault lab.',item:{icon:'🍷',label:'Poison Vial'}},
   'M4C':{name:'Banner Lock',tag:'LOCK-12',desc:'Four coloured banners in heraldic order.',isColor:true}}},
{id:5,name:'ROOM 05 — CASTLE CORRIDOR',bg:0x060408,fog:.075,amb:[0x0e0a14,.5],start:[0,1.7,4],time:600,isMirror:true,mirrorSolution:[0,2,4,6,8],
 clues:{'C5A':{name:'Stone Archway',tag:'ARCH-13',desc:'Purple orbs in keystones — bio-electronic sensors.',item:{icon:'💎',label:'Orb Shard'}},
   'C5B':{name:'UV Manuscript',tag:'UV-14',desc:'"ALIGN THE 5 MIRRORS OF TRUTH".',uvOnly:true},
   'C5C':{name:'Mirror Array',tag:'LOCK-15',desc:'5 of 9 mirrors route laser to receptor.',isMirror:true}}},
{id:6,name:'ROOM 06 — HAUNTED HALLWAY',bg:0x080004,fog:.09,amb:[0x150005,.45],start:[0,1.7,4],time:480,code:'6661',
 clues:{'H6A':{name:'Symbol Door',tag:'SYM-16',desc:'Cipher: reversed 666+1. Thorne\'s signature.',item:{icon:'🚪',label:'Door Rubbing'}},
   'H6B':{name:'UV Floor Sigils',tag:'UV-17',desc:'"THE CODE IS WHAT EVIL FEARS — 6661".',uvOnly:true},
   'H6C':{name:'Exit Keypad',tag:'LOCK-18',desc:'Code on floor under UV.',isKeypad:true}}},
{id:7,name:'ROOM 07 — VICTORIAN STUDY',bg:0x060402,fog:.065,amb:[0x14100a,.55],start:[0,1.7,4.5],time:720,isCipher:true,cipherSolution:[2,0,3],
 clues:{'V7A':{name:'Portrait Wall',tag:'PORT-19',desc:'Middle portrait has hidden camera lens.',item:{icon:'🖼️',label:'Lens Fragment'}},
   'V7B':{name:'Piano Keys',tag:'PHY-20',desc:'C-E-G = cipher positions 2-0-3.',item:{icon:'🎹',label:'Music Sheet'}},
   'V7C':{name:'Cipher Wheel',tag:'LOCK-21',desc:'Align three symbols via musical sequence.',isCipher:true}}},
{id:8,name:'ROOM 08 — ASYLUM CELL',bg:0x050506,fog:.08,amb:[0x0e0e10,.5],start:[0,1.7,3.5],time:540,code:'2847',
 clues:{'A8A':{name:'Chain Wall',tag:'CHAIN-22',desc:'Chains form Morse: "NORTH SIDE LOOSE BLOCK".',item:{icon:'⛓️',label:'Chain Link'}},
   'A8B':{name:'UV Mattress',tag:'UV-23',desc:'"2847" scratched into frame.',uvOnly:true},
   'A8C':{name:'Cell Lock',tag:'LOCK-24',desc:'Code carved by previous occupant.',isKeypad:true}}},
{id:9,name:'ROOM 09 — MYSTIC CHAMBER',bg:0x020608,fog:.085,amb:[0x061408,.55],start:[0,1.7,4],time:660,isColor:true,colorSolution:[1,3,0,2],
 clues:{'MS9A':{name:'Seahorse Portal',tag:'PORT-25',desc:'Bio-mechanical neural interface prototype.',item:{icon:'🐉',label:'Neural Key'}},
   'MS9B':{name:'UV Compass',tag:'UV-26',desc:'Compass directions spell elemental colour sequence.',uvOnly:true},
   'MS9C':{name:'Lantern Lock',tag:'LOCK-27',desc:'Four lanterns in elemental order.',isColor:true}}},
{id:10,name:'ROOM 10 — EVIDENCE VAULT',bg:0x060408,fog:.07,amb:[0x0e0814,.5],start:[0,1.7,4],time:600,isPressure:true,pressureSolution:[2,5,8,1,4,7,0,3,6],
 clues:{'EV10A':{name:'Evidence Board',tag:'EVID-28',desc:'9 photos in 3×3. Reading pattern = suspect order.',item:{icon:'📌',label:'Evidence Photo'}},
   'EV10B':{name:'UV Network Map',tag:'UV-29',desc:'Cable sequence: 3,6,9,2,5,8,1,4,7.',uvOnly:true},
   'EV10C':{name:'Server Gate',tag:'LOCK-30',desc:'Step tiles in cable sequence order.',isPressure:true}}},
{id:11,name:'ROOM 11 — OBSERVATION DECK',bg:0x040508,fog:.075,amb:[0x08101a,.5],start:[0,1.7,4],time:540,isMirror:true,mirrorSolution:[1,3,5,7],
 clues:{'OB11A':{name:'Telescope',tag:'OPT-31',desc:'Aimed at coordinates matching Vault B.',item:{icon:'🔭',label:'Star Chart'}},
   'OB11B':{name:'UV Star Map',tag:'UV-32',desc:'4 star points align via mirror array.',uvOnly:true},
   'OB11C':{name:'Starlight Gate',tag:'LOCK-33',desc:'4 of 8 mirrors reflect starlight to hatch.',isMirror:true}}},
{id:12,name:'ROOM 12 — THE FINAL VAULT',bg:0x040404,fog:.09,amb:[0x0a0a0a,.5],start:[0,1.7,4],time:300,code:'9042',
 clues:{'FV12A':{name:'Thorne\'s Terminal',tag:'FINAL-34',desc:'Transaction logs, neural data, confirmed coordinates.',item:{icon:'💻',label:'Case Closed'}},
   'FV12B':{name:'UV Final Message',tag:'UV-35',desc:'"CODE: 9042". Case solved.',uvOnly:true},
   'FV12C':{name:'Final Vault Lock',tag:'LOCK-36',desc:'Last blast door. Code in UV.',isKeypad:true}}}
];

/* ── STATE ──────────────────────────────────────────────────── */
var scene,camera,renderer,clock;
var pitch=0,yaw=0,mF=false,mB=false,mL=false,mR=false;
var locked=false,uvMode=false;
var iObjs=[],hObj=null,kpBuf='',activePuzzle=null;
var inventory=[],roomIdx=0,dust,flickerLights=[];
var found={},wbSel=[],toastT=null,ovOpen='',walkT=0;
var activeSuspect='thorne',gemApiKey='';
var timeLeft=600,timerInterval=null;
var peer,myPeer,peerConns=[],playerMeshes={};
/* puzzle state */
var comboDials={values:[0,0,0,0],sol:[1,9,5,3]};
var colPuzzle={sol:[],attempt:[],showing:false};
var colColors=['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c'];
var cipherWheels={values:[0,0,0],symbols:['🔯','⚡','🌙','⭐','🔮','💀','🗝️','🧿','⚗️']};
var pressAttempt=[],pressSol=[];
var mirrorSel=[],mirrorSol=[];

ROOMS.forEach(function(r){found[r.id]=new Set();});

/* ── GEMINI KEY ─────────────────────────────────────────────── */
function saveGemKey(){gemApiKey=(document.getElementById('gemkey')||{}).value||'';if(gemApiKey)localStorage.setItem('cv_gk',gemApiKey);addChat('API key saved. Live suspect responses active.','bot');}
(function(){var k=localStorage.getItem('cv_gk');if(k){gemApiKey=k;var el=document.getElementById('gemkey');if(el)el.value=k;}})();

/* ── BOOTSTRAP ──────────────────────────────────────────────── */
function boot(){
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,80);
  camera.position.set(0,1.7,4);camera.rotation.order='YXZ';
  clock=new THREE.Clock();
  renderer=new THREE.WebGLRenderer({canvas:document.getElementById('cv'),antialias:true,powerPreference:'high-performance'});
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  var pg=new THREE.BufferGeometry(),pp=new Float32Array(300*3);
  for(var i=0;i<300*3;i+=3){pp[i]=(Math.random()-.5)*14;pp[i+1]=Math.random()*5;pp[i+2]=(Math.random()-.5)*14;}
  pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
  dust=new THREE.Points(pg,new THREE.PointsMaterial({color:0x99aabb,size:.022,transparent:true,opacity:.22}));
  var sb=document.getElementById('sb');
  if(sb)sb.addEventListener('click',function(){SFX.init();document.getElementById('cv').requestPointerLock();});
  document.addEventListener('pointerlockchange',onPL);
  document.addEventListener('mousemove',onMM);
  window.addEventListener('keydown',onKD);window.addEventListener('keyup',onKU);
  window.addEventListener('resize',function(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  document.getElementById('cv').addEventListener('click',function(){if(locked&&hObj)interact(hObj);});
  initPeer();loadRoom(0);loop();
}

function onPL(){locked=document.pointerLockElement===document.getElementById('cv');var ls=document.getElementById('ls');if(ls)ls.style.display=locked?'none':'flex';if(ovOpen)closeOv();}
function onMM(e){if(!locked)return;yaw-=e.movementX*.0018;pitch-=e.movementY*.0018;pitch=Math.max(-1.2,Math.min(1.2,pitch));}
function onKD(e){
  if(e.code==='KeyW')mF=true;if(e.code==='KeyS')mB=true;if(e.code==='KeyA')mL=true;if(e.code==='KeyD')mR=true;
  if(e.code==='KeyF'&&locked)toggleUV();
  if(e.code==='KeyE'&&locked&&hObj)interact(hObj);
  if(e.code==='KeyC'&&locked){var ci=document.getElementById('ci');if(ci)ci.focus();}
  if(e.code==='Tab'){e.preventDefault();if(locked)ovOpen?closeOv():openOv('mm');}
  if(e.code==='Escape'){closeAllPuzzles();if(ovOpen)closeOv();}
}
function onKU(e){if(e.code==='KeyW')mF=false;if(e.code==='KeyS')mB=false;if(e.code==='KeyA')mL=false;if(e.code==='KeyD')mR=false;}

/* ── MOVEMENT ───────────────────────────────────────────────── */
var _fv=new THREE.Vector3(),_rv=new THREE.Vector3(),_mv=new THREE.Vector3();
function move(dt){
  if(!locked||activePuzzle||ovOpen)return;
  camera.getWorldDirection(_fv);_fv.y=0;_fv.normalize();
  _rv.crossVectors(_fv,camera.up).normalize();
  _mv.set(0,0,0);var sp=3.0;
  if(mF)_mv.addScaledVector(_fv,sp*dt);if(mB)_mv.addScaledVector(_fv,-sp*dt);
  if(mR)_mv.addScaledVector(_rv,sp*dt);if(mL)_mv.addScaledVector(_rv,-sp*dt);
  camera.position.add(_mv);
  camera.position.x=Math.max(-5.5,Math.min(5.5,camera.position.x));
  camera.position.z=Math.max(-6.5,Math.min(6.5,camera.position.z));
  if(_mv.lengthSq()>.0001){walkT+=dt*7;camera.position.y=1.7+Math.sin(walkT)*.024;if(Math.abs(Math.sin(walkT))<.05)SFX.step();}
  else camera.position.y=1.7;
  camera.rotation.y=yaw;camera.rotation.x=pitch;
  broadcastPose();
}

/* ── UV ─────────────────────────────────────────────────────── */
function toggleUV(){
  uvMode=!uvMode;SFX.uv();
  var vig=document.getElementById('vig');if(vig)vig.className=uvMode?'uv':'';
  var tm=document.getElementById('tmode');if(tm){tm.className=uvMode?'uvon':'';tm.innerText=uvMode?'🔮 UV LIGHT':'🔦 WHITE';}
  iObjs.forEach(function(o){var cl=ROOMS[roomIdx].clues[o.userData.cid];if(cl&&cl.uvOnly)o.material.opacity=uvMode?.8:0;});
  dust.material.color.set(uvMode?0xcc00ff:0x99aabb);dust.material.opacity=uvMode?.4:.22;
  if(scene.__uvSpot)scene.__uvSpot.visible=uvMode;if(scene.__wSpot)scene.__wSpot.visible=!uvMode;
}

/* ── RAYCAST ────────────────────────────────────────────────── */
var _rc=new THREE.Raycaster(),_c2=new THREE.Vector2(0,0);
function ray(){
  _rc.setFromCamera(_c2,camera);_rc.far=3.4;
  var hits=_rc.intersectObjects(iObjs,true);
  var xh=document.getElementById('xh'),ap=document.getElementById('ap');
  if(!xh||!ap)return;
  if(hits.length>0){
    var o=hits[0].object;while(o&&!o.userData.cid&&o.parent)o=o.parent;
    if(!o||!o.userData.cid){hObj=null;xh.className='';ap.style.display='none';return;}
    var cl=ROOMS[roomIdx].clues[o.userData.cid];
    if(cl&&cl.uvOnly&&!uvMode){hObj=null;xh.className='';ap.style.display='none';return;}
    hObj=o;xh.className=uvMode?'uvhit':'hit';ap.style.display='block';
    ap.innerText=(cl&&(cl.isKeypad||cl.isComboPuzzle||cl.isColor||cl.isCipher||cl.isPressure||cl.isMirror))?'[ E ] PUZZLE':'[ E ] '+cl.name;
  }else{hObj=null;xh.className='';ap.style.display='none';}
}

function interact(o){
  if(!o)return;var cl=ROOMS[roomIdx].clues[o.userData.cid];if(!cl)return;SFX.click();
  if(cl.uvOnly&&!uvMode)return;
  if(cl.isKeypad){openKP();return;}if(cl.isComboPuzzle){openCombo();return;}
  if(cl.isColor){openColor();return;}if(cl.isCipher){openCipher();return;}
  if(cl.isPressure){openPressure();return;}if(cl.isMirror){openMirror();return;}
  showToast(cl.name,cl.tag,cl.desc);
  var cid=o.userData.cid;
  if(!found[ROOMS[roomIdx].id].has(cid)){found[ROOMS[roomIdx].id].add(cid);SFX.clue();if(cl.item)pickup(cl.item);addTag(cl.name,cl.uvOnly);updatePips();buildMM();buildDos();if(found[ROOMS[roomIdx].id].size>=3)roomDone();}
}

/* ── UI ─────────────────────────────────────────────────────── */
function showToast(t,g,d){var e=document.getElementById('toast');if(!e)return;document.getElementById('tt').innerText=t;document.getElementById('tg').innerText=g;document.getElementById('td').innerText=d;e.style.display='block';if(toastT)clearTimeout(toastT);toastT=setTimeout(function(){e.style.display='none';},5000);}
function addTag(n,u){var l=document.getElementById('evlog');if(!l)return;var d=document.createElement('div');d.className='et'+(u?' uv':'');d.innerText=(u?'🔮 ':'🔍 ')+n;l.prepend(d);if(l.children.length>4)l.removeChild(l.lastChild);}
function pickup(it){inventory.push(it);var idx=inventory.length-1;if(idx>4)return;var s=document.getElementById('s'+idx);if(s){s.innerHTML='<span style="font-size:.9rem">'+it.icon+'</span><span>'+it.label.slice(0,7)+'</span>';s.className='is on';}SFX.pickup();}
function updatePips(){var r=ROOMS[roomIdx],n=found[r.id].size;var pl=document.getElementById('pl');if(pl)pl.innerText='CLUES '+n+'/3';var row=document.getElementById('pips');if(row){row.innerHTML='';Object.values(r.clues).forEach(function(cl,i){var p=document.createElement('div');var c='pip';if(found[r.id].has(Object.keys(r.clues)[i])){c+=(cl.isKeypad||cl.isComboPuzzle||cl.isColor||cl.isCipher||cl.isPressure||cl.isMirror)?' kp':' on';}p.className=c;row.appendChild(p);});}var ri=document.getElementById('ri');if(ri)ri.innerText='ROOM '+(roomIdx+1)+' / '+ROOMS.length;}
function roomDone(){clearInterval(timerInterval);var lt=document.getElementById('lt');if(lt)lt.innerText='ROOM CLEARED';var ld=document.getElementById('ld');if(ld)ld.innerText=ROOMS[roomIdx].name;var lg=document.getElementById('lgr');if(lg)lg.innerText='⭐⭐⭐';var ln=document.getElementById('ln');if(ln)ln.style.display=roomIdx<ROOMS.length-1?'inline-block':'none';var lc=document.getElementById('lc');if(lc)lc.style.display='flex';document.exitPointerLock();}
function nextRoom(){var lc=document.getElementById('lc');if(lc)lc.style.display='none';if(roomIdx<ROOMS.length-1){roomIdx++;loadRoom(roomIdx);document.getElementById('cv').requestPointerLock();}}
function replayRoom(){var lc=document.getElementById('lc');if(lc)lc.style.display='none';found[ROOMS[roomIdx].id]=new Set();inventory=[];for(var i=0;i<5;i++){var s=document.getElementById('s'+i);if(s){s.innerHTML='<span>—</span>';s.className='is';}}loadRoom(roomIdx);document.getElementById('cv').requestPointerLock();}
window.nextRoom=nextRoom;window.replayRoom=replayRoom;

/* ── TIMER ──────────────────────────────────────────────────── */
function startTimer(s){clearInterval(timerInterval);timeLeft=s;updateTimer();timerInterval=setInterval(function(){timeLeft--;updateTimer();if(timeLeft<=0){clearInterval(timerInterval);addChat('⏰ TIME EXPIRED — resetting room.','bot');setTimeout(replayRoom,2200);}},1000);}
function updateTimer(){var m=Math.floor(timeLeft/60),s=timeLeft%60;var el=document.getElementById('timer');if(!el)return;el.innerText=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;el.className=timeLeft<=30?'urgent':'';}

/* ── KEYPAD ─────────────────────────────────────────────────── */
function openKP(){kpBuf='';updKP();var ke=document.getElementById('kperr');if(ke)ke.innerText='';var km=document.getElementById('km');if(km)km.style.display='flex';activePuzzle='kp';document.exitPointerLock();}
function closeAllPuzzles(){['km','cm-color','cm-cipher','cm-combo','cm-pressure','cm-mirror'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display='none';});activePuzzle=null;if(locked)document.getElementById('cv').requestPointerLock();}
function kp(n){if(kpBuf.length<4){kpBuf+=n;SFX.beep();updKP();}}
function kpClr(){kpBuf='';SFX.beep();updKP();var ke=document.getElementById('kperr');if(ke)ke.innerText='';}
function updKP(){var el=document.getElementById('kpd');if(el)el.innerText=(kpBuf+'____').slice(0,4).split('').join(' ');}
function kpSub(){var r=ROOMS[roomIdx];if(!r.code){closeAllPuzzles();return;}
  if(kpBuf===r.code){SFX.unlock();SFX.door();closeAllPuzzles();markPuzzle('isKeypad');openDoor();}
  else{SFX.err();var ke=document.getElementById('kperr');if(ke)ke.innerText='✗ ACCESS DENIED';var kd=document.getElementById('kpd');if(kd)kd.innerText='E R R';setTimeout(function(){kpBuf='';updKP();var ke2=document.getElementById('kperr');if(ke2)ke2.innerText='';},850);}
}
window.kp=kp;window.kpClr=kpClr;window.kpSub=kpSub;window.closeAllPuzzles=closeAllPuzzles;

/* ── COMBO LOCK ─────────────────────────────────────────────── */
function openCombo(){var r=ROOMS[roomIdx];comboDials.sol=r.comboSolution||[1,9,5,3];comboDials.values=[0,0,0,0];var grid=document.getElementById('combo-dials');if(!grid)return;grid.innerHTML='';comboDials.values.forEach(function(_,i){var div=document.createElement('div');div.className='combo-dial';div.innerHTML='<button class="cd-btn" onclick="comboDial('+i+',1)">▲</button><div class="cd-num" id="cd'+i+'">0</div><button class="cd-btn" onclick="comboDial('+i+',-1)">▼</button>';grid.appendChild(div);});var cm=document.getElementById('cm-combo');if(cm)cm.style.display='flex';activePuzzle='combo';document.exitPointerLock();}
function comboDial(idx,dir){comboDials.values[idx]=(comboDials.values[idx]+dir+10)%10;SFX.beep();var el=document.getElementById('cd'+idx);if(el)el.innerText=comboDials.values[idx];}
function submitCombo(){if(comboDials.values.join('')===comboDials.sol.join('')){SFX.unlock();closeAllPuzzles();markPuzzle('isComboPuzzle');openDoor();}else SFX.err();}
window.openCombo=openCombo;window.comboDial=comboDial;window.submitCombo=submitCombo;

/* ── COLOR SEQUENCE ─────────────────────────────────────────── */
function openColor(){var r=ROOMS[roomIdx];colPuzzle.sol=r.colorSolution||[2,0,3,1];colPuzzle.attempt=[];var panels=document.getElementById('col-panels');if(!panels)return;panels.innerHTML='';colPuzzle.sol.forEach(function(ci){var btn=document.createElement('div');btn.className='col-panel';btn.style.background=colColors[ci];btn.setAttribute('data-ci',ci);btn.onclick=function(){pressColor(ci,btn);};panels.appendChild(btn);});var att=document.getElementById('col-attempt');if(att){att.innerHTML='';colPuzzle.sol.forEach(function(){var d=document.createElement('div');d.className='col-att-dot';att.appendChild(d);});}var ch=document.getElementById('col-hint');if(ch)ch.innerText='Press panels in order shown';var cs=document.getElementById('col-status');if(cs)cs.innerText='';var cm=document.getElementById('cm-color');if(cm)cm.style.display='flex';activePuzzle='color';document.exitPointerLock();}
function pressColor(ci,btn){SFX.puzzle();btn.classList.add('pressed');setTimeout(function(){btn.classList.remove('pressed');},200);colPuzzle.attempt.push(ci);var i=colPuzzle.attempt.length-1;var dots=document.getElementById('col-attempt');if(dots&&dots.children[i]){dots.children[i].style.background=colColors[ci];dots.children[i].style.border='1px solid rgba(255,255,255,.4)';}if(ci!==colPuzzle.sol[i]){SFX.err();var cs=document.getElementById('col-status');if(cs)cs.innerText='✗ Wrong — resetting…';setTimeout(function(){colPuzzle.attempt=[];var d2=document.getElementById('col-attempt');if(d2)Array.from(d2.children).forEach(function(d){d.style.background='rgba(255,255,255,.1)';d.style.border='1px solid rgba(255,255,255,.15)';});var cs2=document.getElementById('col-status');if(cs2)cs2.innerText='Try again.';},900);return;}if(colPuzzle.attempt.length===colPuzzle.sol.length){SFX.unlock();var cs3=document.getElementById('col-status');if(cs3)cs3.innerText='✓ CORRECT!';setTimeout(function(){closeAllPuzzles();markPuzzle('isColor');openDoor();},800);}}
window.openColor=openColor;

/* ── CIPHER WHEEL ───────────────────────────────────────────── */
function openCipher(){var r=ROOMS[roomIdx];var sol=r.cipherSolution||[2,0,3];cipherWheels.values=[0,0,0];var grid=document.getElementById('cipher-wheels');if(!grid)return;grid.innerHTML='';var syms=cipherWheels.symbols;sol.forEach(function(_,wi){var div=document.createElement('div');div.className='cipher-wheel';div.innerHTML='<div class="cw-sym" id="cw'+wi+'">'+syms[0]+'</div><div class="cw-lbl">WHEEL '+(wi+1)+'</div><div class="cw-arrows"><button class="cw-btn" onclick="spinWheel('+wi+',-1)">◀</button><button class="cw-btn" onclick="spinWheel('+wi+',1)">▶</button></div>';grid.appendChild(div);});var ct=document.getElementById('ciph-target');if(ct)ct.innerText='Target: '+sol.map(function(i){return syms[i];}).join(' — ');var cs=document.getElementById('ciph-status');if(cs)cs.innerText='';var cm=document.getElementById('cm-cipher');if(cm)cm.style.display='flex';activePuzzle='cipher';document.exitPointerLock();}
function spinWheel(wi,dir){var syms=cipherWheels.symbols;cipherWheels.values[wi]=(cipherWheels.values[wi]+dir+syms.length)%syms.length;SFX.puzzle();var el=document.getElementById('cw'+wi);if(el)el.innerText=syms[cipherWheels.values[wi]];}
function submitCipher(){var r=ROOMS[roomIdx];var sol=r.cipherSolution||[2,0,3];if(cipherWheels.values.join(',')===sol.join(',')){SFX.unlock();var cs=document.getElementById('ciph-status');if(cs)cs.innerText='✓ CIPHER SOLVED!';setTimeout(function(){closeAllPuzzles();markPuzzle('isCipher');openDoor();},700);}else{SFX.err();var cs2=document.getElementById('ciph-status');if(cs2)cs2.innerText='✗ Incorrect.';}}
window.openCipher=openCipher;window.spinWheel=spinWheel;window.submitCipher=submitCipher;

/* ── PRESSURE PLATES ────────────────────────────────────────── */
function openPressure(){var r=ROOMS[roomIdx];pressSol=r.pressureSolution||[0,3,7,5,2,9];pressAttempt=[];var EMOJI=['🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔶','🔷','🔸'];var grid=document.getElementById('press-grid');if(!grid)return;grid.innerHTML='';var count=Math.max(pressSol.length+6,12);for(var i=0;i<count;i++){(function(idx){var tile=document.createElement('div');tile.className='press-tile';tile.innerText=EMOJI[idx%EMOJI.length];tile.onclick=function(){pressTile(idx,tile);};grid.appendChild(tile);})(i);}var ph=document.getElementById('press-hint');if(ph)ph.innerText='Activate '+pressSol.length+' tiles in UV-revealed order';var ps=document.getElementById('press-status');if(ps)ps.innerText='';var cm=document.getElementById('cm-pressure');if(cm)cm.style.display='flex';activePuzzle='pressure';document.exitPointerLock();}
function pressTile(idx,tile){SFX.puzzle();var expected=pressSol[pressAttempt.length];if(idx!==expected){SFX.err();tile.classList.add('wrong');pressAttempt=[];var ps=document.getElementById('press-status');if(ps)ps.innerText='✗ Wrong — resetting…';setTimeout(function(){document.querySelectorAll('.press-tile').forEach(function(t){t.classList.remove('active','wrong');});pressAttempt=[];var ps2=document.getElementById('press-status');if(ps2)ps2.innerText='Try again.';},900);return;}tile.classList.add('active');pressAttempt.push(idx);if(pressAttempt.length===pressSol.length){SFX.unlock();var ps3=document.getElementById('press-status');if(ps3)ps3.innerText='✓ SEQUENCE COMPLETE!';setTimeout(function(){closeAllPuzzles();markPuzzle('isPressure');openDoor();},700);}}
window.openPressure=openPressure;

/* ── MIRROR PUZZLE ──────────────────────────────────────────── */
function openMirror(){var r=ROOMS[roomIdx];mirrorSol=r.mirrorSolution||[0,2,4,6,8];mirrorSel=[];var MIRR=['🪞','🌟','💡','🔦','⚡','🌀','🔆','✨','💫'];var grid=document.getElementById('mirror-grid');if(!grid)return;grid.innerHTML='';for(var i=0;i<9;i++){(function(idx){var cell=document.createElement('div');cell.className='mirror-cell';cell.innerText=MIRR[idx];cell.onclick=function(){toggleMirror(idx,cell);};grid.appendChild(cell);})(i);}var ms=document.getElementById('mirror-status');if(ms)ms.innerText='Activate '+mirrorSol.length+' mirrors';var cm=document.getElementById('cm-mirror');if(cm)cm.style.display='flex';activePuzzle='mirror';document.exitPointerLock();}
function toggleMirror(idx,cell){SFX.puzzle();var pos=mirrorSel.indexOf(idx);if(pos>=0){mirrorSel.splice(pos,1);cell.classList.remove('lit');}else if(mirrorSel.length<mirrorSol.length){mirrorSel.push(idx);cell.classList.add('lit');}}
function submitMirror(){var att=mirrorSel.slice().sort().join(','),sol=mirrorSol.slice().sort().join(',');if(att===sol){SFX.unlock();var ms=document.getElementById('mirror-status');if(ms)ms.innerText='✓ LASER ALIGNED!';setTimeout(function(){closeAllPuzzles();markPuzzle('isMirror');openDoor();},700);}else{SFX.err();var ms2=document.getElementById('mirror-status');if(ms2)ms2.innerText='✗ Incorrect alignment.';}}
window.openMirror=openMirror;window.toggleMirror=toggleMirror;window.submitMirror=submitMirror;

/* ── PUZZLE HELPERS ─────────────────────────────────────────── */
function markPuzzle(key){var r=ROOMS[roomIdx];var cid=Object.keys(r.clues).find(function(k){return r.clues[k][key];});if(cid&&!found[r.id].has(cid)){found[r.id].add(cid);addTag(r.clues[cid].name,false);updatePips();buildMM();buildDos();if(found[r.id].size>=3)setTimeout(roomDone,700);}}
function openDoor(){var d=scene.getObjectByName('exitDoor');if(!d)return;var p=0;var s=d.rotation.y;(function a(){p+=.025;d.rotation.y=s-Math.PI/2*Math.min(p,1);if(p<1)requestAnimationFrame(a);})();}

/* ── OVERLAYS ───────────────────────────────────────────────── */
function openOv(v){ovOpen=v;var mm=document.getElementById('ov-mm'),dos=document.getElementById('ov-dos');if(mm)mm.style.display=v==='mm'?'flex':'none';if(dos)dos.style.display=v==='dos'?'flex':'none';['hud','bot','radar','playerlist','suspects','aip','mp-panel','xh','ap','vig','tabs'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.visibility='hidden';});if(v==='mm')buildMM();if(v==='dos')buildDos();}
function closeOv(){ovOpen='';var mm=document.getElementById('ov-mm'),dos=document.getElementById('ov-dos');if(mm)mm.style.display='none';if(dos)dos.style.display='none';['hud','bot','radar','playerlist','suspects','aip','mp-panel','xh','ap','vig','tabs'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.visibility='visible';});}
window.openOv=openOv;window.closeOv=closeOv;

/* ── MIND MAP ───────────────────────────────────────────────── */
function buildMM(){var svg=document.getElementById('mmsvg');if(!svg)return;var r=ROOMS[roomIdx],keys=Object.keys(r.clues),n=found[r.id].size;var cx=450,cy=240;
  var nodes=[{x:cx,y:cy,r:50,col:'#e74c3c',lbl:'DR. THORNE',sub:'PRIME SUSPECT'}];
  keys.forEach(function(k,i){var a=(i/keys.length)*Math.PI*2-Math.PI/2;var cl=r.clues[k];var col=cl.uvOnly?'#bb00ff':cl.isKeypad||cl.isComboPuzzle||cl.isColor||cl.isCipher||cl.isPressure||cl.isMirror?'#f39c12':'#c8a86b';
    nodes.push({x:cx+Math.cos(a)*230,y:cy+Math.sin(a)*165,r:40,col:col,lbl:cl.name.split(' ').slice(0,2).join(' '),sub:k});});
  var h='<defs><pattern id="gg" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0L0 0 0 28" fill="none" stroke="rgba(200,168,107,.05)" stroke-width="1"/></pattern></defs><rect width="900" height="480" fill="url(#gg)"/>';
  for(var i=1;i<nodes.length;i++)h+='<line x1="'+nodes[0].x+'" y1="'+nodes[0].y+'" x2="'+nodes[i].x+'" y2="'+nodes[i].y+'" stroke="#e74c3c" stroke-width="1.8" stroke-dasharray="5 3" opacity="'+(i<=n+1?.62:.14)+'"/>';
  nodes.forEach(function(nd,i){var vis=i===0||i<=n+1;var lines=nd.lbl.split(' ');
    h+='<g opacity="'+(vis?1:.2)+'"><circle cx="'+nd.x+'" cy="'+nd.y+'" r="'+nd.r+'" fill="rgba(6,10,18,.9)" stroke="'+nd.col+'" stroke-width="2"/>';
    lines.forEach(function(l,j){h+='<text x="'+nd.x+'" y="'+(nd.y-(lines.length-1)*7+j*14+4)+'" fill="'+nd.col+'" font-size="10" text-anchor="middle" font-family="Share Tech Mono,monospace">'+l+'</text>';});
    h+='<text x="'+nd.x+'" y="'+(nd.y+nd.r+13)+'" fill="rgba(200,168,107,.3)" font-size="8" text-anchor="middle" font-family="Share Tech Mono,monospace">'+nd.sub+'</text></g>';});
  h+='<rect x="798" y="8" width="94" height="24" rx="4" fill="rgba(200,168,107,.07)" stroke="rgba(200,168,107,.25)"/><text x="845" y="24" fill="#c8a86b" font-size="10" text-anchor="middle" font-family="Share Tech Mono,monospace">'+n+'/3 CLUES</text>';
  svg.innerHTML=h;}

/* ── DOSSIER ────────────────────────────────────────────────── */
function buildDos(){var rb=document.getElementById('rbr');if(rb){rb.innerHTML='';var n=found[ROOMS[roomIdx].id].size;for(var i=0;i<3;i++){var b=document.createElement('div');b.className='rb'+(i<n?' on':'');rb.appendChild(b);}}var rg=document.getElementById('rg');var n2=found[ROOMS[roomIdx].id].size;if(rg){rg.innerText=n2===3?'S — EXPERT':n2===2?'A — SKILLED':n2===1?'B — DEVELOPING':'C — NOVICE';rg.style.color=n2===3?'#2ecc9b':n2===2?'#c8a86b':n2===1?'#f39c12':'#e74c3c';}var ws=document.getElementById('wbs');if(ws){ws.innerHTML='';document.getElementById('wbr').innerText='';wbSel=[];if(!inventory.length){ws.innerHTML='<span style="font-size:.62rem;color:#7a8daa">No items yet.</span>';return;}inventory.forEach(function(it,i){var s=document.createElement('div');s.className='wbs';s.innerText=it.icon;s.title=it.label;s.onclick=function(){if(wbSel.find(function(x){return x.i===i;})){wbSel=wbSel.filter(function(x){return x.i!==i;});s.classList.remove('sel');}else if(wbSel.length<2){wbSel.push({i:i,it:it});s.classList.add('sel');}if(wbSel.length===2)wbCombine();};ws.appendChild(s);});}}
function wbCombine(){var l=wbSel.map(function(s){return s.it.label;}).sort().join('+');var c={'Map Fragment+Pyramid Key':'🗝️ Vault B access code unlocked!','Music Sheet+Lens Fragment':'🎵 Cipher decoded — musical sequence confirmed.','Case Closed+Neural Key':'🏆 CASE CLOSED — Dr. Thorne located at Vault B.'};var wbr=document.getElementById('wbr');if(wbr)wbr.innerText=c[l]||'❓ No reaction.';SFX.clue();}

/* ── RADAR ──────────────────────────────────────────────────── */
var radarAngle=0;
function drawRadar(){var cv2=document.getElementById('rc');if(!cv2)return;var ctx=cv2.getContext('2d'),W=cv2.width,H=cv2.height,cx=W/2,cy=H/2,R=Math.min(W,H)/2-5;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='rgba(0,0,0,.82)';ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fill();
  [.3,.6,.9].forEach(function(f){ctx.strokeStyle='rgba(200,168,107,'+(f*.12+.04)+')';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,R*f,0,Math.PI*2);ctx.stroke();});
  ctx.strokeStyle='rgba(200,168,107,.08)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-R,cy);ctx.lineTo(cx+R,cy);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy-R);ctx.lineTo(cx,cy+R);ctx.stroke();
  radarAngle+=.022;ctx.save();ctx.translate(cx,cy);ctx.rotate(radarAngle);ctx.strokeStyle='rgba(200,168,107,.55)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(R,0);ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,-.65,0);ctx.closePath();ctx.fillStyle='rgba(200,168,107,.04)';ctx.fill();ctx.restore();
  ctx.strokeStyle='rgba(200,168,107,.3)';ctx.lineWidth=1.4;ctx.strokeRect(cx-R*.82,cy-R*.82,R*1.64,R*1.64);
  var keys=Object.keys(ROOMS[roomIdx].clues);
  [{x:.32,y:-.42},{x:-.38,y:.28},{x:.02,y:-.62}].forEach(function(b,i){var bx=cx+b.x*R,by=cy+b.y*R;var p=.5+.5*Math.sin(Date.now()*.004+i);var f=found[ROOMS[roomIdx].id].has(keys[i]);
    ctx.fillStyle=f?'rgba(46,204,155,'+(0.6+p*.35)+')':'rgba(231,76,60,'+(0.4+p*.35)+')';ctx.beginPath();ctx.arc(bx,by,3.5,0,Math.PI*2);ctx.fill();
    if(!f){ctx.strokeStyle='rgba(231,76,60,'+(0.28*p)+')';ctx.lineWidth=1;ctx.beginPath();ctx.arc(bx,by,4+7*p,0,Math.PI*2);ctx.stroke();}});
  ctx.fillStyle='#c8a86b';ctx.beginPath();ctx.arc(cx,cy,4,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(cx,cy);ctx.rotate(yaw||0);ctx.strokeStyle='rgba(200,168,107,.75)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-11);ctx.stroke();ctx.restore();}

/* ── AI SUSPECTS CHAT ───────────────────────────────────────── */
function selectSuspect(id,el){activeSuspect=id;document.querySelectorAll('.susp-tab').forEach(function(t){t.classList.remove('active');});el.classList.add('active');var s=SUSPECTS[id];var cn=document.getElementById('cname');if(cn){cn.innerText=s.name;cn.style.color=s.color;}addChat('Now questioning '+s.name+'.','bot');}
function sendChat(){var inp=document.getElementById('ci');if(!inp)return;var txt=inp.value.trim();if(!txt)return;inp.value='';addChat(txt,'usr');
  if(gemApiKey){fetchGeminiReply(txt,activeSuspect).then(function(r){addChat(r,'suspect',SUSPECTS[activeSuspect].name);}).catch(function(){addChat(suspectReply(activeSuspect,txt),'suspect',SUSPECTS[activeSuspect].name);});}
  else{var r=suspectReply(activeSuspect,txt);setTimeout(function(){addChat(r,'suspect',SUSPECTS[activeSuspect].name);},380);}
}
function addChat(m,type,sender){var l=document.getElementById('cl');if(!l)return;var d=document.createElement('div');d.className='cm '+(type||'bot');if(sender){var s=document.createElement('span');s.className='sender';s.innerText=sender;d.appendChild(s);}d.appendChild(document.createTextNode(m));l.appendChild(d);l.scrollTop=l.scrollHeight;}
function fetchGeminiReply(question,suspId){var s=SUSPECTS[suspId];var sysp='You are '+s.name+', a suspect in a murder mystery escape room. Personality: '+(suspId==='thorne'?'cold, genius, manipulative':(suspId==='maya'?'terrified, innocent but complicit':'military, evasive, hiding something'))+'. Answer in 2 sentences max. Stay in character.';return fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+gemApiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system_instruction:{parts:[{text:sysp}]},contents:[{parts:[{text:question}]}]})}).then(function(res){return res.json();}).then(function(d){return(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts&&d.candidates[0].content.parts[0].text)||suspectReply(suspId,question);});}
window.selectSuspect=selectSuspect;window.sendChat=sendChat;window.saveGemKey=saveGemKey;

/* ── MULTIPLAYER ─────────────────────────────────────────────── */
function initPeer(){try{peer=new Peer();peer.on('open',function(id){myPeer=id;var el=document.getElementById('myid');if(el)el.innerText=id;});peer.on('connection',function(conn){setupConn(conn);});peer.on('error',function(){var el=document.getElementById('myid');if(el)el.innerText='Offline';});}catch(e){var el=document.getElementById('myid');if(el)el.innerText='No PeerJS';}}
function joinPeer(){var id=(document.getElementById('joinid')||{}).value||'';if(!id||!peer)return;setupConn(peer.connect(id));}
function setupConn(conn){peerConns.push(conn);conn.on('open',function(){updatePlList();});conn.on('data',function(d){if(d.type==='pose')updateRemPl(conn.peer,d.pos,d.rot);if(d.type==='chat')addChat('[P]'+d.msg,'bot');});conn.on('close',function(){peerConns=peerConns.filter(function(c){return c!==conn;});if(playerMeshes[conn.peer]){scene.remove(playerMeshes[conn.peer]);delete playerMeshes[conn.peer];}updatePlList();});}
function broadcastPose(){if(!peerConns.length)return;var d={type:'pose',pos:{x:camera.position.x,y:camera.position.y,z:camera.position.z},rot:{y:yaw}};peerConns.forEach(function(c){try{if(c.open)c.send(d);}catch(e){}});}
function updateRemPl(id,pos,rot){if(!playerMeshes[id]){var cols=[0x00f0ff,0xffb700,0xe000ff,0x00ff88];var m=new THREE.Mesh(new THREE.CapsuleGeometry(.25,.9,4,8),new THREE.MeshBasicMaterial({color:cols[Object.keys(playerMeshes).length%4],wireframe:true}));scene.add(m);playerMeshes[id]=m;}playerMeshes[id].position.set(pos.x,pos.y,pos.z);playerMeshes[id].rotation.y=rot.y;}
function updatePlList(){var l=document.getElementById('plist');if(!l)return;l.innerHTML='<div class="pli"><div class="pldot" style="background:#c8a86b"></div><span>You</span></div>';peerConns.forEach(function(c,i){if(c.open)l.innerHTML+='<div class="pli"><div class="pldot" style="background:#2ecc9b"></div><span>P'+(i+2)+'</span></div>';});}
window.joinPeer=joinPeer;

/* ── SCENE HELPERS ──────────────────────────────────────────── */
function clrScene(){while(scene.children.length)scene.remove(scene.children[0]);while(camera&&camera.children.length)camera.remove(camera.children[0]);iObjs=[];flickerLights=[];scene.__uvSpot=null;scene.__wSpot=null;}
function M(o){return new THREE.MeshStandardMaterial(o);}
function BM(o){return new THREE.MeshBasicMaterial(o);}
function add(g,m,px,py,pz,rx,ry,rz){var x=new THREE.Mesh(g,m);if(px!==undefined)x.position.set(px,py,pz);if(rx!==undefined)x.rotation.set(rx,ry||0,rz||0);x.castShadow=x.receiveShadow=true;scene.add(x);return x;}
function iAdd(g,m,cid,px,py,pz,rx,ry,rz){var x=new THREE.Mesh(g,m);if(px!==undefined)x.position.set(px,py,pz);if(rx!==undefined)x.rotation.set(rx,ry||0,rz||0);x.userData.cid=cid;x.castShadow=true;scene.add(x);iObjs.push(x);return x;}
function pL(c,i,d,x,y,z,f){var l=new THREE.PointLight(c,i,d);l.position.set(x,y,z);scene.add(l);if(f){l.__base=i;flickerLights.push(l);}return l;}
function sL(c,i,x,y,z,tx,ty,tz){var l=new THREE.SpotLight(c,i);l.position.set(x,y,z);l.target.position.set(tx,ty,tz);l.angle=Math.PI/4.5;l.penumbra=.55;l.castShadow=true;l.shadow.mapSize.set(512,512);scene.add(l);scene.add(l.target);return l;}
function tileTex(b,l,r){r=r||7;var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');x.fillStyle=b;x.fillRect(0,0,256,256);x.strokeStyle=l;x.lineWidth=1.5;var s=256/r;for(var i=0;i<=r;i++){x.beginPath();x.moveTo(i*s,0);x.lineTo(i*s,256);x.stroke();x.beginPath();x.moveTo(0,i*s);x.lineTo(256,i*s);x.stroke();}var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(r,r);return t;}
function woodTex(){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');x.fillStyle='#3a2310';x.fillRect(0,0,256,256);for(var i=0;i<35;i++){x.strokeStyle='rgba('+(80+Math.random()*40)+','+(40+Math.random()*20)+','+(10+Math.random()*15)+',.42)';x.lineWidth=.8+Math.random()*1.6;x.beginPath();x.moveTo(0,i*7.5+Math.random()*5);x.lineTo(256,i*7.5+Math.random()*8);x.stroke();}return new THREE.CanvasTexture(c);}
function stoneTex(d){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');x.fillStyle=d?'#13161a':'#22272e';x.fillRect(0,0,256,256);for(var i=0;i<300;i++){x.fillStyle='rgba('+(30+Math.random()*25)+','+(30+Math.random()*25)+','+(32+Math.random()*25)+',.7)';x.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*5,1+Math.random()*5);}var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return t;}
function shell(fM,wM,cM,W,D,H){W=W||12;D=D||14;H=H||5.5;add(new THREE.PlaneGeometry(W,D),fM,0,0,0,-Math.PI/2);add(new THREE.PlaneGeometry(W,H),wM,0,H/2,-D/2);add(new THREE.PlaneGeometry(D,H),wM,-W/2,H/2,0,0,Math.PI/2);add(new THREE.PlaneGeometry(D,H),wM,W/2,H/2,0,0,-Math.PI/2);add(new THREE.PlaneGeometry(W,H),wM,0,H/2,D/2,0,Math.PI);add(new THREE.PlaneGeometry(W,D),cM,0,H,0,Math.PI/2);}
function uvP(cid,w,h,col,x,y,z,rx,ry){return iAdd(new THREE.PlaneGeometry(w,h),BM({color:col,transparent:true,opacity:0,side:THREE.DoubleSide}),cid,x,y,z,rx||0,ry||0,0);}
function exitDoor(r){var hc=!!(r.code||r.isComboPuzzle||r.isColor||r.isCipher||r.isPressure||r.isMirror);var d=new THREE.Mesh(new THREE.BoxGeometry(2.2,3.2,.14),M({color:hc?0x1e2a1e:0x141414,metalness:.4,roughness:.4,emissive:hc?0x003300:0x001100,emissiveIntensity:.2}));d.name='exitDoor';d.position.set(0,1.6,-6.93);d.castShadow=true;scene.add(d);var pCid=Object.keys(r.clues).find(function(k){var cl=r.clues[k];return cl.isKeypad||cl.isComboPuzzle||cl.isColor||cl.isCipher||cl.isPressure||cl.isMirror;});if(pCid){d.userData.cid=pCid;iObjs.push(d);}var led=new THREE.Mesh(new THREE.SphereGeometry(.045),BM({color:hc?0xff3300:0x00ff44}));led.position.set(.7,2,-6.86);scene.add(led);}

/* ── LOAD ROOM ──────────────────────────────────────────────── */
function loadRoom(idx){clrScene();var r=ROOMS[idx];
  document.getElementById('rl').innerText=r.name;
  scene.background=new THREE.Color(r.bg);scene.fog=new THREE.FogExp2(r.bg,r.fog);
  camera.position.set(r.start[0],r.start[1],r.start[2]);yaw=0;pitch=0;
  scene.add(dust);scene.add(camera);
  scene.add(new THREE.HemisphereLight(0x2a3040,.25));
  scene.add(new THREE.AmbientLight(r.amb[0],r.amb[1]));
  var wsp=new THREE.SpotLight(0xfff5e0,3.8,14,Math.PI/5,.45);wsp.position.set(0,0,.3);wsp.target.position.set(0,0,-1);camera.add(wsp);camera.add(wsp.target);scene.__wSpot=wsp;
  var uvsp=new THREE.SpotLight(0xaa00ff,5.5,12,Math.PI/4,.5);uvsp.visible=false;uvsp.position.set(0,0,.3);uvsp.target.position.set(0,0,-1);camera.add(uvsp);camera.add(uvsp.target);scene.__uvSpot=uvsp;
  uvMode=false;var vig=document.getElementById('vig');if(vig)vig.className='';var tm=document.getElementById('tmode');if(tm){tm.className='';tm.innerText='🔦 WHITE';}dust.material.color.set(0x99aabb);dust.material.opacity=.22;
  switch(r.id){case 1:bVault();break;case 2:bDetLab();break;case 3:bPrison();break;case 4:bMedieval();break;case 5:bCastle();break;case 6:bHaunted();break;case 7:bVictorian();break;case 8:bAsylum();break;case 9:bMystic();break;case 10:bEvidVault();break;case 11:bObsDeck();break;case 12:bFinalVault();break;}
  exitDoor(r);updatePips();var evlog=document.getElementById('evlog');if(evlog)evlog.innerHTML='';buildMM();startTimer(r.time||600);}

/* ── ROOMS ──────────────────────────────────────────────────── */
function bVault(){sL(0xfff5cc,5.5,0,5.5,.5,0,.7,0);pL(0xcc2200,1.5,10,-4.5,2.8,-4.5);pL(0x1a4466,.8,10,4,1.5,3);shell(M({map:tileTex('#10151e','#1e2d40',8),roughness:.4,metalness:.1}),M({color:0x0d1218,roughness:.85}),M({color:0x080c12,roughness:.9}));scene.add(new THREE.GridHelper(12,24,0x333322,0x111110));add(new THREE.CylinderGeometry(.4,.5,.65,16),M({color:0x222a38,metalness:.5,roughness:.3}),0,.325,0);iAdd(new THREE.BoxGeometry(1.3,.1,2.6),M({color:0x3a4a5e,metalness:.3,roughness:.4}),'S1A',0,.7,0);var ck=new THREE.Mesh(new THREE.PlaneGeometry(.85,1.9),BM({color:0xffffff,transparent:true,opacity:.28,wireframe:true}));ck.rotation.x=-Math.PI/2;ck.position.set(0,.755,0);scene.add(ck);add(new THREE.CylinderGeometry(.04,.04,1.3),M({color:0x333d4a,metalness:.5}),0,4.85,.5);iAdd(new THREE.CylinderGeometry(.75,.85,.22,24),M({color:0x4a5a72,metalness:.4,roughness:.3,emissive:0x001122,emissiveIntensity:.2}),'S1B',0,4.2,.5);pL(0xffddaa,1.4,5,0,3.8,.5,true);uvP('S1B',1.7,.75,0xcc00ff,-2.5,2.2,-5.88);add(new THREE.BoxGeometry(.75,.85,.55),M({color:0x1c2530}),2.5,.425,.8);for(var i=0;i<2;i++){add(new THREE.BoxGeometry(.8,2.2,.5),M({color:0x0d1825,metalness:.3,roughness:.4}),4.8+i,1.1,-4.5);for(var j=0;j<6;j++){var ll=new THREE.Mesh(new THREE.SphereGeometry(.032),BM({color:j%3===0?0x00cc88:0xcc2200}));ll.position.set(4.8+i+.32,.3+j*.32,-4.23);scene.add(ll);}}iAdd(new THREE.BoxGeometry(.35,.25,.04),M({color:0x1a2535,metalness:.3,emissive:0xcc2200,emissiveIntensity:.5}),'S1C',-5.93,1.7,-1.5,0,Math.PI/2);}
function bDetLab(){sL(0xffcc66,4.5,0,5,.5,0,1,0);pL(0xff8800,1.8,8,-2,2.5,0);pL(0xff4400,1,7,2,1.5,-2);var wt=woodTex();shell(M({map:tileTex('#1a1008','#2a1a08',6),roughness:.6}),M({color:0x1a1008,roughness:.88}),M({color:0x100a04,roughness:.9}));add(new THREE.BoxGeometry(3,.1,2),M({map:wt,roughness:.6}),0,.75,0);for(var i=0;i<4;i++)add(new THREE.BoxGeometry(.1,.75,.1),M({map:wt}),(i<2?-1.4:1.4),.375,i%2===0?-.9:.9);iAdd(new THREE.BoxGeometry(2.4,1.6,.04),M({color:0x1a1408,roughness:.8}),'D2A',-3.5,2.5,-4.9);pL(0xffaa44,.6,4,-3.5,4,-4.5,true);iAdd(new THREE.CylinderGeometry(.12,.08,.35,6),M({color:0x8a6020,metalness:.6,emissive:0xff4400,emissiveIntensity:.4}),'D2B',.2,.9,.1);add(new THREE.BoxGeometry(.8,.8,.6),M({color:0x2a1a0a,roughness:.7}),2.5,.4,0);iAdd(new THREE.BoxGeometry(.8,.8,.6),M({color:0x1a1008,roughness:.8,emissive:0xff8800,emissiveIntensity:.15}),'D2C',2.5,.8,0);var ll2=new THREE.Mesh(new THREE.SphereGeometry(.04),BM({color:0xff3300}));ll2.position.set(2.9,1.25,0.32);scene.add(ll2);}
function bPrison(){pL(0xffaa44,1.2,8,-1,2,2,true);pL(0x4488ff,.6,6,3,1.5,-2);shell(M({map:stoneTex(),roughness:.82}),M({map:stoneTex(),roughness:.85}),M({color:0x080807,roughness:.9}),10,12,4.5);for(var bx=-3;bx<=3;bx+=.55){var bar=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,4),M({color:0x4a3a2a,metalness:.8,roughness:.3}));bar.position.set(bx,2,-5.9);scene.add(bar);}iAdd(new THREE.BoxGeometry(2.2,3,.12),M({color:0x3a2a1a,metalness:.7,roughness:.4,emissive:0x221100,emissiveIntensity:.1}),'P3A',0,1.5,-5.9);for(var ci=0;ci<3;ci++){var chain=new THREE.Mesh(new THREE.TorusGeometry(.3,.04,6,16),M({color:0x4a3020,metalness:.7,roughness:.4}));chain.position.set(-3+ci*1.5,1.5+Math.sin(ci)*.3,-3.9);chain.rotation.x=Math.PI/4+ci*.2;scene.add(chain);}uvP('P3B',3,2,0x00ff88,0,1,-3.9);var bed=new THREE.Mesh(new THREE.BoxGeometry(1.2,.2,2),M({color:0x888880,roughness:.8}));bed.position.set(-3,.1,-1.5);scene.add(bed);iAdd(new THREE.BoxGeometry(.35,.25,.04),M({color:0x1a2535,metalness:.3,emissive:0xcc2200,emissiveIntensity:.5}),'P3C',4.85,1.7,-1.5,0,-Math.PI/2);}
function bMedieval(){pL(0xff8800,2,8,0,4.5,0,true);pL(0xff6600,1.5,7,-2,2,-2);var mt=woodTex();shell(M({map:mt,roughness:.65}),M({color:0x2a1a08,roughness:.88}),M({color:0x1a1004,roughness:.9}),12,12,5.5);add(new THREE.CylinderGeometry(2.2,.1,.08,32),M({map:mt,roughness:.6}),0,.76,0);iAdd(new THREE.BoxGeometry(.5,1.5,.05),M({color:0x8a2020,roughness:.7,emissive:0x441010,emissiveIntensity:.2}),'M4A',-5.5,2,-4.9);for(var gi=0;gi<4;gi++){add(new THREE.CylinderGeometry(.06,.04,.22,8),M({color:0x3a2010,roughness:.5}),-.4+gi*.28,.83,0);add(new THREE.SphereGeometry(.07,8,6),M({color:0x2a1a08,roughness:.5}),-.4+gi*.28,.9,0);}iAdd(new THREE.BoxGeometry(.5,.06,.4),M({map:mt,roughness:.6}),'M4B',0,.82,0);for(var bi=0;bi<4;bi++){iAdd(new THREE.PlaneGeometry(.8,2),M({color:[0xcc2200,0x2244cc,0x22cc22,0xccaa00][bi],roughness:.7}),'M4C',-4.5+bi*3,2.5,-5.9);}add(new THREE.BoxGeometry(.25,7,.25),M({color:0x2a2235,roughness:.7}),4.9,3.5,-3);}
function bCastle(){pL(0x6622cc,1.8,8,0,3,0);pL(0x4488ff,.8,8,-3,2,-2);shell(M({map:stoneTex(),roughness:.85}),M({map:stoneTex(false),roughness:.88}),M({color:0x080610,roughness:.9}),10,12,5.5);for(var ai=0;ai<3;ai++){var arch=new THREE.Mesh(new THREE.TorusGeometry(2,.18,6,20,Math.PI),M({color:0x2a2235,roughness:.8}));arch.position.set(0,3,-ai*4.5);arch.rotation.z=Math.PI;scene.add(arch);}for(var oi=0;oi<6;oi++){var orb=new THREE.Mesh(new THREE.SphereGeometry(.1,12,8),M({color:0x6600cc,emissive:0x440088,emissiveIntensity:.8,roughness:.2}));orb.position.set(Math.cos(oi/6*Math.PI*2)*4.5,1.5+oi*.2,-oi*1.5);scene.add(orb);pL(0x6600cc,.5,2,orb.position.x,orb.position.y,orb.position.z,true);}iAdd(new THREE.BoxGeometry(2.2,3.5,.2),M({color:0x2a2235,roughness:.7,emissive:0x110022,emissiveIntensity:.2}),'C5A',0,1.75,-5.85);uvP('C5B',1.2,.6,0xcc00ff,0,2,-5.84);for(var mi=0;mi<5;mi++){iAdd(new THREE.PlaneGeometry(.5,.8),M({color:0x8899aa,metalness:.9,roughness:.05}),'C5C',-4.5+mi*2.2,2,-4.88);}add(new THREE.BoxGeometry(.25,7,.25),M({color:0x2a2235,roughness:.7}),4.9,3.5,-3);add(new THREE.BoxGeometry(.25,7,.25),M({color:0x2a2235,roughness:.7}),-4.9,3.5,-3);}
function bHaunted(){pL(0xcc0000,1.5,8,0,3,0,true);pL(0x880000,.8,8,-3,2,-2);shell(M({color:0x1a0408,roughness:.88}),M({color:0x180205,roughness:.9}),M({color:0x0e0103,roughness:.92}),10,12,5.5);var chandelier=new THREE.Mesh(new THREE.TorusGeometry(.4,.05,8,32),M({color:0x3a1008,metalness:.6}));chandelier.position.set(0,4.5,0);scene.add(chandelier);pL(0xcc2200,.8,5,0,4.3,0,true);iAdd(new THREE.BoxGeometry(2.2,3.2,.14),M({color:0x1a0404,roughness:.7,emissive:0x220000,emissiveIntensity:.3}),'H6A',0,1.6,-5.9);uvP('H6B',2,1.5,0xcc00ff,0,.5,-5.88,-Math.PI/2);for(var si=0;si<4;si++){var sym=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.2),M({color:0x3a0808,roughness:.8,emissive:0x220000,emissiveIntensity:.3}));sym.position.set(-4.5+si*3,2,-4.9);scene.add(sym);}iAdd(new THREE.BoxGeometry(.35,.25,.04),M({color:0x1a2535,metalness:.3,emissive:0xcc2200,emissiveIntensity:.5}),'H6C',-5.93,1.7,-1.5,0,Math.PI/2);}
function bVictorian(){sL(0xffcc88,3.5,0,5,.5,0,1,0);pL(0xff8844,1.5,8,-2,2,-2);var wt=woodTex();shell(M({map:wt,roughness:.65}),M({color:0x1a1008,roughness:.88}),M({color:0x0e0a06,roughness:.9}),12,12,5.5);for(var pi=0;pi<3;pi++){add(new THREE.BoxGeometry(1.4,1.8,.06),M({color:0x5a3828,roughness:.65}),-3.5+pi*3.5,2.5,-5.9);if(pi===1)iAdd(new THREE.PlaneGeometry(1.2,1.55),M({color:0x4a3020,roughness:.8}),'V7A',-3.5+pi*3.5,2.5,-5.87);}var piano=new THREE.Mesh(new THREE.BoxGeometry(2.5,1.2,.8),M({map:wt,roughness:.5,metalness:.1}));piano.position.set(4,0.6,-4.5);scene.add(piano);iAdd(new THREE.BoxGeometry(2.5,.08,.5),M({color:0x1a1008,roughness:.4,emissive:0x221100,emissiveIntensity:.1}),'V7B',4,1.25,-4.25);for(var ki=0;ki<14;ki++){var wkey=new THREE.Mesh(new THREE.BoxGeometry(.15,.05,.4),M({color:0xf8f8f0,roughness:.3}));wkey.position.set(3.0+ki*.17,1.28,-4.22);scene.add(wkey);}var compass=new THREE.Mesh(new THREE.CircleGeometry(.8,32),M({color:0x3a2a18,roughness:.7}));compass.rotation.x=-Math.PI/2;compass.position.set(0,.01,0);scene.add(compass);iAdd(new THREE.CylinderGeometry(.35,.35,.12,6),M({color:0x8a6020,metalness:.7,roughness:.3,emissive:0x441a00,emissiveIntensity:.3}),'V7C',0,.76,-1);var led3=new THREE.Mesh(new THREE.SphereGeometry(.04),BM({color:0xff0000}));led3.position.set(.4,1.0,-.93);scene.add(led3);}
function bAsylum(){pL(0xcccc88,1,6,-1,2.5,0,true);shell(M({map:stoneTex(),roughness:.82}),M({map:stoneTex(),roughness:.85}),M({color:0x080808,roughness:.9}),9,10,4.5);var bed=new THREE.Mesh(new THREE.BoxGeometry(1.2,.3,2.2),M({color:0x5a5a4a,roughness:.8}));bed.position.set(-2.5,.15,-2);scene.add(bed);for(var ch=0;ch<3;ch++){var chain=new THREE.Mesh(new THREE.TorusGeometry(.5,.04,6,18),M({color:0x6a5a4a,metalness:.7,roughness:.4}));chain.position.set(-4.9,1.5+ch*.7,ch*.8-2);chain.rotation.y=Math.PI/2;chain.rotation.z=.3;scene.add(chain);}iAdd(new THREE.BoxGeometry(1.4,1.4,.04),M({color:0x3a3528,roughness:.8}),'A8A',-4.88,1.8,-1.5,0,Math.PI/2);uvP('A8B',1.4,.8,0xccffcc,-2.5,.35,-1.9,-Math.PI/2);iAdd(new THREE.BoxGeometry(.35,.25,.04),M({color:0x1a2535,metalness:.3,emissive:0xcc2200,emissiveIntensity:.5}),'A8C',-4.43,1.7,-3.5,0,Math.PI/2);}
function bMystic(){pL(0x00cc44,1.8,8,0,3,0,true);pL(0x00aa88,.8,6,-3,2,-2);var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');x.fillStyle='#0a1a0a';x.fillRect(0,0,256,256);for(var i=0;i<200;i++){x.fillStyle='rgba('+(10+Math.random()*20)+','+(30+Math.random()*40)+','+(10+Math.random()*20)+',.8)';x.fillRect(Math.random()*256,Math.random()*256,2+Math.random()*8,2+Math.random()*8);}var gt=new THREE.CanvasTexture(c);gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(3,3);shell(M({map:gt,roughness:.75}),M({map:gt,roughness:.8}),M({color:0x020a06,roughness:.9}),12,12,5.5);var seahorse=new THREE.Mesh(new THREE.TorusGeometry(1,.3,8,32),M({color:0x006633,metalness:.5,roughness:.4,emissive:0x003318,emissiveIntensity:.5}));seahorse.position.set(-3.5,2,-4);scene.add(seahorse);iAdd(new THREE.SphereGeometry(.4,16,12),M({color:0x00aa44,emissive:0x006622,emissiveIntensity:.6,roughness:.3}),'MS9A',-3.5,2,-4);pL(0x00ff88,1,3,-3.5,2,-4,true);uvP('MS9B',1.5,1.5,0x00ff88,0,.01,-.5,-Math.PI/2);for(var li=0;li<4;li++){iAdd(new THREE.BoxGeometry(.3,.5,.3),M({color:[0x8a0000,0x004488,0x008800,0x884400][li],roughness:.5,emissive:[0x440000,0x002244,0x004400,0x442200][li],emissiveIntensity:.5}),'MS9C',-3+li*2,3.5,0);}var ll4=new THREE.Mesh(new THREE.SphereGeometry(.04),BM({color:0xff0000}));ll4.position.set(.5,1.7,-6.86);scene.add(ll4);}
function bEvidVault(){sL(0x4488ff,3,0,5,.5,0,1,0);pL(0x0066ff,1.2,8,-3,2,-2);shell(M({map:tileTex('#080c14','#162030',8),roughness:.4,metalness:.1}),M({color:0x06080e,roughness:.85}),M({color:0x040608,roughness:.9}));scene.add(new THREE.GridHelper(12,24,0x0044ff,0x101828));for(var ri=0;ri<3;ri++){add(new THREE.BoxGeometry(.8,2.2,.5),M({color:0x0d1825,metalness:.4,roughness:.3}),4.5+ri*.55,1.1,-4.5);for(var rj=0;rj<6;rj++){var led5=new THREE.Mesh(new THREE.SphereGeometry(.03),BM({color:rj%2===0?0x0066ff:0x00ff88}));led5.position.set(4.5+ri*.55+.32,.3+rj*.32,-4.23);scene.add(led5);}}iAdd(new THREE.BoxGeometry(2.5,1.8,.05),M({color:0x1a2030,roughness:.8,emissive:0x002244,emissiveIntensity:.2}),'EV10A',-3.5,2.2,-4.9);uvP('EV10B',2.5,1,0x4488ff,0,2,-4.88);iAdd(new THREE.BoxGeometry(.35,.25,.04),M({color:0x1a2535,metalness:.3,emissive:0x0044ff,emissiveIntensity:.5}),'EV10C',-5.93,1.7,-1.5,0,Math.PI/2);}
function bObsDeck(){pL(0x2244aa,1,8,0,4.5,0);pL(0x1133cc,.6,6,-3,2,-2);shell(M({map:tileTex('#050810','#102040',7),roughness:.5}),M({color:0x04060e,roughness:.88}),M({color:0x020308,roughness:.9}));for(var si=0;si<50;si++){var star=new THREE.Mesh(new THREE.SphereGeometry(.015+Math.random()*.02),BM({color:0xffffff}));star.position.set((Math.random()-.5)*11,(Math.random()-.5)*4+4,(Math.random()-.5)*13);scene.add(star);}iAdd(new THREE.CylinderGeometry(.12,.08,1.2,12),M({color:0x3a3a4a,metalness:.8,roughness:.2}),'OB11A',2,1.5,-3,-.3);uvP('OB11B',2,2,0x4488ff,0,.01,-1,-Math.PI/2);for(var mi=0;mi<8;mi++){iAdd(new THREE.PlaneGeometry(.4,.6),M({color:0x6688aa,metalness:.9,roughness:.05}),'OB11C',-4.5+mi*1.3,2,-4.88);}iAdd(new THREE.BoxGeometry(.35,.25,.04),M({color:0x1a2535,metalness:.3,emissive:0x4466ff,emissiveIntensity:.5}),'OB11C',-5.93,1.7,-1.5,0,Math.PI/2);}
function bFinalVault(){sL(0xff4444,2.5,0,5,.5,0,1,0);pL(0xff2200,1.5,8,-2,2,-2);shell(M({map:tileTex('#06060a','#181820',6),roughness:.5}),M({color:0x040406,roughness:.88}),M({color:0x020204,roughness:.9}));scene.add(new THREE.GridHelper(12,24,0xff2200,0x181010));iAdd(new THREE.BoxGeometry(1.6,1.2,.8),M({color:0x0a0a0e,metalness:.5,roughness:.4,emissive:0x110000,emissiveIntensity:.3}),'FV12A',0,.6,0);add(new THREE.BoxGeometry(1.2,.06,.7),M({color:0x333344,metalness:.5}),0,1.26,.05);pL(0xff0000,.8,3,0,1.8,.4,true);uvP('FV12B',3,1.5,0xff0000,0,.01,-1,-Math.PI/2);iAdd(new THREE.BoxGeometry(.35,.25,.04),M({color:0x1a2535,metalness:.3,emissive:0xff2a5f,emissiveIntensity:.5}),'FV12C',-5.93,1.7,-1.5,0,Math.PI/2);}

/* ── RENDER LOOP ─────────────────────────────────────────────── */
function loop(){requestAnimationFrame(loop);var dt=Math.min(clock.getDelta(),.05);move(dt);ray();drawRadar();flickerLights.forEach(function(l){if(!l.__base)l.__base=l.intensity;l.intensity=l.__base+Math.sin(Date.now()*.006+l.position.x)*l.__base*.3+(Math.random()<.03?-l.__base*.6:0);});dust.rotation.y+=.0003;renderer.render(scene,camera);}

/* ── KICK OFF ────────────────────────────────────────────────── */
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}else{boot();}

})();
