/* --- CONFIG & GLOBALS --- */
var C = { 
    KEYS:['d','f','j','k'], 
    MAP_W:2000, MAP_H:1500, 
    SPEED:5, TILE:40, 
    ELIM_DAYS:[7,14,21,30] 
};

// Global Variables
var NPCs = [];
var DECOR = [];
var App = { 
    screen:'title-screen', 
    day:1, 
    audioFile:null, 
    audioName:null, 
    isGameOver:false, 
    paused:false,
    stageConfig: { duration: 180, concept: 'dance' },
    eventDone: false, 
    compScore: 0,
    lastEventBonus: 0,
    currentRound: 1,      // Vòng hiện tại (1, 2, 3)
    maxRounds: 3,         // Tổng số vòng
    accumulatedScore: 0
};

var Player = {
    name: "Sunny", 
    stats: {dance:20,vocal:20,rap:20,visual:20,charisma:20,stamina:50}, 
    teamwork:20, totalVote:0, x:1000, y:750, 
    fans:0,
    skin: '#ffdbac', hair: '#2f3542', eye:'#000', shirt: '#ff6b81'
};

// Utilities
function formatNum(n) {
    if (n >= 1000000) return parseFloat((n / 1000000).toFixed(1)) + 'M';
    if (n >= 1000) return parseFloat((n / 1000).toFixed(1)) + 'k';
    return n;
}

function r(m){return Math.floor(Math.random()*m);}

var Notify = {
    timer: null,
    show: (msg) => {
        const t = document.getElementById('game-toast');
        if(!t) return;
        
        t.className = ''; 
        t.innerHTML = msg;
        
        t.style.display = 'block';
        t.style.position = 'absolute';
        t.style.left = '50%';                
        t.style.transform = 'translateX(-50%)'; 
        t.style.top = '30px';                    
        t.style.zIndex = '999999';               
        t.style.opacity = '1';                   
        t.style.backgroundColor = '#fff';        
        t.style.color = '#2f3542';               
        t.style.border = '4px solid #2f3542';    
        t.style.padding = '10px 20px';           
        t.style.fontFamily = "'Press Start 2P', cursive";
        t.style.fontSize = '10px';
        t.style.textAlign = 'center';
        t.style.borderRadius = '8px';
        t.style.boxShadow = '4px 4px 0px rgba(0,0,0,0.2)';
        t.style.transition = 'all 0.3s ease-in-out';

        if(Notify.timer) clearTimeout(Notify.timer);
        Notify.timer = setTimeout(() => {
            t.style.opacity = '0';
            t.style.top = '-50px';
        }, 2500);
    }
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    App.screen = id;
    if(id==='hub-screen') { HubMap.start(); Game.checkStageDay(); } else HubMap.stop();
    updateUI();
}

function updateUI() {
    ['vocal','dance','rap','visual','charisma','stamina'].forEach(k => {
        const el = document.getElementById(`d-${k}`);
        if(el) el.innerText = Player.stats[k];
    });
    const elTeam = document.getElementById('d-teamwork');
    if(elTeam) elTeam.innerText = Player.teamwork;
    
    const elFans = document.getElementById('d-fans');
    if(elFans) elFans.innerText = formatNum(Player.fans);

    document.getElementById('day-counter').innerText = App.day;
    document.getElementById('display-name').innerText = Player.name.toUpperCase();
}