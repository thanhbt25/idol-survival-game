/* --- SPECIAL EVENTS & TOURNAMENT LOGIC --- */

// 1. HÀM VẼ MẶT
function drawFace(ctx, x, y, char, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(0,0,0,0.1)"; ctx.fillRect(-2, 2, 10, 10);
    ctx.fillStyle = char.skin; ctx.fillRect(-5, -5, 10, 10);
    ctx.fillStyle = "#fff"; ctx.fillRect(-3, -2, 3, 3); ctx.fillRect(1, -2, 3, 3);
    ctx.fillStyle = "#000"; ctx.fillRect(-2, -2, 1, 3); ctx.fillRect(2, -2, 1, 3);
    ctx.fillStyle = char.hair; ctx.fillRect(-6, -7, 12, 4); ctx.fillRect(-6, -5, 2, 6); ctx.fillRect(4, -5, 2, 6);
    ctx.fillStyle = char.shirt || "#ff7675"; ctx.fillRect(-5, 5, 10, 3);
    ctx.restore();
}

var SpecialEvent = {
    teams: [],
    
    // 2. CHỌN ĐỘI (DRAFT MODE)
    startDraft: () => {
        showScreen('draft-screen');
        const canvas = document.getElementById('draftCanvas');
        const container = document.getElementById('draft-visual');
        const ctx = canvas.getContext('2d');
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width; canvas.height = rect.height;

        let survivors = [...NPCs, {...Player, id:'p'}].filter(n => !n.eliminated).sort((a,b) => b.totalVote - a.totalVote);
        let numTeams = 0;
        
        if (App.day === 7) numTeams = 6;
        else if (App.day === 14) numTeams = 4;
        else if (App.day === 21) numTeams = 4;
        else { Game.triggerStageSetup(); return; }

        let leaders = survivors.slice(0, numTeams);
        let pool = survivors.slice(numTeams);
        let colWidth = canvas.width / numTeams;

        SpecialEvent.teams = leaders.map((l, index) => ({
            leader: l, members: [l], x: (colWidth * index) + (colWidth / 2) - 35, y: 90, 
            rankBonus: 0, eventScore: 0, history: [0, 0, 0]
        }));

        let pickingTeam = 0; let animId;

        const drawDraft = () => {
            for (let i = 0; i < canvas.width; i += 50) {
                for (let j = 0; j < canvas.height; j += 50) {
                    ctx.fillStyle = (i/50 + j/50) % 2 === 0 ? "#CD853F" : "#DEB887"; ctx.fillRect(i, j, 50, 50);
                }
            }
            let gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 50, canvas.width/2, canvas.height/2, canvas.width/1.2);
            gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)"); gradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
            ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.textAlign = "center"; ctx.lineWidth = 6; ctx.strokeStyle = "#000"; ctx.fillStyle = "#fff"; 
            ctx.font = "bold 36px 'Press Start 2P'"; ctx.strokeText("TEAM DRAFT", canvas.width/2, 50); ctx.fillText("TEAM DRAFT", canvas.width/2, 50);

            SpecialEvent.teams.forEach((t, i) => {
                let currentY = 110; let isLeaderPlayer = (t.leader.id === 'p');
                if (isLeaderPlayer) {
                    ctx.save(); ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 30;
                    ctx.beginPath(); ctx.arc(t.x, currentY, 35, 0, Math.PI*2); ctx.fillStyle = "rgba(255, 255, 0, 0.6)"; ctx.fill(); ctx.restore();
                }
                drawFace(ctx, t.x, currentY, t.leader, 4.5); 
                ctx.textAlign = "left"; let textX = t.x + 30; ctx.lineWidth = 4; ctx.strokeStyle = "#000";
                
                ctx.fillStyle = "#FFD700"; ctx.font = "bold 12px 'Press Start 2P'"; 
                ctx.strokeText(`TEAM ${i+1}`, textX, currentY - 25); ctx.fillText(`TEAM ${i+1}`, textX, currentY - 25);
                
                let lName = `★ ${t.leader.name.split(' ')[0]}`;
                ctx.fillStyle = isLeaderPlayer ? "#ff4757" : "#fff"; ctx.font = "10px 'Press Start 2P'";
                ctx.strokeText(lName, textX, currentY + 15); ctx.fillText(lName, textX, currentY + 15);

                t.members.forEach((m, mi) => {
                    if (mi > 0) { 
                        let faceY = currentY + 35 + (mi * 60); let isPlayer = (m.id === 'p');
                        if (isPlayer) {
                            ctx.save(); ctx.shadowColor = "#00ff00"; ctx.shadowBlur = 20;
                            ctx.beginPath(); ctx.arc(t.x, faceY, 25, 0, Math.PI*2);
                            ctx.fillStyle = "rgba(0, 255, 0, 0.4)"; ctx.fill(); ctx.restore();
                        }
                        drawFace(ctx, t.x, faceY, m, 3.2);
                        ctx.lineWidth = 3; ctx.strokeStyle = "#000";
                        let nameTxt = m.name.split(' ')[0]; if (isPlayer) nameTxt += " (ME)";
                        ctx.font = isPlayer ? "bold 9px 'Press Start 2P'" : "8px 'Press Start 2P'";
                        ctx.fillStyle = isPlayer ? "#ff6b81" : "#ecf0f1"; 
                        ctx.strokeText(nameTxt, textX, faceY + 10); ctx.fillText(nameTxt, textX, faceY + 10);
                    }
                });
            });

            let poolHeight = 140; let poolY = canvas.height - poolHeight;
            ctx.fillStyle = "#5d4037"; ctx.fillRect(0, poolY, canvas.width, poolHeight);
            ctx.fillStyle = "#ff6b81"; ctx.fillRect(0, poolY, canvas.width, 6);
            ctx.lineWidth = 4; ctx.strokeStyle = "#000"; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "12px 'Press Start 2P'";
            ctx.strokeText("WAITING TRAINEES...", canvas.width/2, poolY - 15); ctx.fillText("WAITING TRAINEES...", canvas.width/2, poolY - 15);

            pool.forEach((p, i) => {
                if (!p.picked) {
                    let itemsPerRow = 12; let spacingX = canvas.width / itemsPerRow;
                    let offsetX = spacingX / 2;
                    let px = offsetX + (i % itemsPerRow) * spacingX; 
                    let py = poolY + 40 + Math.floor(i / itemsPerRow) * 50;
                    if (p.id === 'p') {
                        ctx.save(); ctx.shadowColor = "#fff"; ctx.shadowBlur = 15;
                        ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI*2);
                        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fill(); ctx.restore();
                    }
                    drawFace(ctx, px, py, p, 2.5); 
                }
            });
        };

        const pickStep = () => {
            if (pool.length === 0) {
                cancelAnimationFrame(animId);
                document.getElementById('draft-status').innerText = "SQUADS READY!";
                document.getElementById('draft-status').style.color = "#27ae60";
                document.getElementById('btn-start-event').style.display = 'block';
                return;
            }
            let randomIndex = Math.floor(Math.random() * pool.length);
            let pickedMember = pool[randomIndex];
            pickedMember.picked = true;
            SpecialEvent.teams[pickingTeam].members.push(pickedMember);
            pool.splice(randomIndex, 1); 
            pickingTeam++; if (pickingTeam >= numTeams) pickingTeam = 0;
            drawDraft(); setTimeout(pickStep, 100); 
        };
        drawDraft(); setTimeout(pickStep, 800);
    },

    startCompetition: () => {
        App.currentRound = 1; App.accumulatedScore = 0; App.maxRounds = 3;
        Competition.startRound();
    }
};

/* --- COMPETITION MINIGAMES ENGINE --- */
var Competition = {
    canvas: null, ctx: null, active: false, type: null,
    entities: [], items: [], grass: [], // Thêm mảng cỏ
    timer: 30, score: 0, loopId: null, lastGameType: null,

    startRound: () => {
        const games = ['shoe', 'push', 'run', 'catch', 'dodge', 'pose'];
        let availableGames = games.filter(g => g !== Competition.lastGameType);
        let randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
        Competition.lastGameType = randomGame;
        Competition.init(randomGame);
    },

    init: (type) => {
        showScreen('comp-screen');
        Competition.canvas = document.getElementById('compCanvas');
        Competition.ctx = Competition.canvas.getContext('2d');
        const p = Competition.canvas.parentElement;
        Competition.canvas.width = p.clientWidth; Competition.canvas.height = p.clientHeight;
        
        Competition.type = type; Competition.active = false;
        document.getElementById('round-result-overlay').style.display = 'none';
        document.getElementById('comp-hud').style.display = 'none';
        
        const overlay = document.getElementById('comp-overlay'); overlay.style.display = 'flex';
        const title = document.getElementById('comp-name'); const desc = document.getElementById('comp-desc');
        
        // --- CẬP NHẬT HƯỚNG DẪN CHI TIẾT ---
        title.innerHTML = `<span style="font-size:14px; color:#aaa; display:block; margin-bottom:5px;">ROUND ${App.currentRound}/${App.maxRounds}</span>`;
        let gameName = "";
        let instructions = "";

        if (type === 'shoe') { 
            gameName = "SHOE TOSS"; 
            instructions = "1. Watch the power bar.\n2. Press [SPACE] when bar is GREEN.\n3. Throw as far as possible!"; 
        } else if (type === 'push') { 
            gameName = "SUMO BATTLE"; 
            instructions = "1. Use [ARROW KEYS] to move.\n2. Push opponents out of ring.\n3. Don't fall out yourself!"; 
        } else if (type === 'run') { 
            gameName = "100M SPRINT"; 
            instructions = "1. Mash [SPACE] button repeatedly!\n2. Run fast to the finish line."; 
        } else if (type === 'catch') { 
            gameName = "CHICKEN CATCH"; 
            instructions = "1. Use [ARROW KEYS] to run.\n2. Touch YELLOW CHICKENS.\n3. Get 100 points to win!"; 
        } else if (type === 'dodge') { 
            gameName = "DODGE RAIN"; 
            instructions = "1. Use [LEFT/RIGHT] to move.\n2. Avoid BOMBS.\n3. Catch STARS for points."; 
        } else if (type === 'pose') { 
            gameName = "FLASH POSE"; 
            instructions = "1. Walk with [ARROW KEYS].\n2. When screen FLASHES WHITE...\n3. Hold [SPACE] immediately to Pose!"; 
        }

        title.innerHTML += gameName;
        // Format lại text hướng dẫn cho đẹp (xuống dòng)
        desc.innerHTML = instructions.replace(/\n/g, '<br/>');
        desc.style.lineHeight = "2";
        desc.style.fontSize = "12px";
    },

    startGame: () => {
        document.getElementById('comp-overlay').style.display = 'none';
        document.getElementById('comp-hud').style.display = 'block';
        Competition.active = true; Competition.score = 0; Competition.timer = 20;
        Competition.entities = []; Competition.items = []; Competition.grass = [];

        if (Competition.type === 'shoe') Competition.setupShoe();
        else if (Competition.type === 'push') Competition.setupPush();
        else if (Competition.type === 'run') Competition.setupRun();
        else if (Competition.type === 'catch') Competition.setupCatch();
        else if (Competition.type === 'dodge') Competition.setupDodge();
        else if (Competition.type === 'pose') Competition.setupPose();

        Competition.loop();
        
        if (Competition.type !== 'shoe') {
            const timerInt = setInterval(() => {
                if (!Competition.active) { clearInterval(timerInt); return; }
                Competition.timer--;
                document.getElementById('c-time').innerText = Competition.timer;
                if (Competition.timer <= 0) Competition.finish();
            }, 1000);
        }
    },

    finish: (customScore = null) => {
        Competition.active = false; cancelAnimationFrame(Competition.loopId);
        let rawScore = customScore !== null ? customScore : Competition.score;
        let finalScore = Math.min(100, Math.max(0, Math.floor(rawScore))); 
        
        let roundResults = [];
        let myTeamIndex = SpecialEvent.teams.findIndex(t => t.members.some(m => m.id === 'p'));

        SpecialEvent.teams.forEach((t, i) => {
            let score = 0;
            if (i === myTeamIndex) score = finalScore;
            else score = Math.floor(50 + Math.random() * 50); 
            t.history[App.currentRound - 1] = score;
            t.eventScore += score; 
            roundResults.push({ team: t, score: score, isMe: (i === myTeamIndex) });
        });

        roundResults.sort((a, b) => b.score - a.score);

        const overlay = document.getElementById('round-result-overlay'); 
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <h2 style="color:#a29bfe; font-size: 24px; margin-bottom: 20px;">ROUND ${App.currentRound} RESULTS</h2>
            <div style="background:#fff; border:4px solid #2f3542; border-radius:10px; padding:20px; width:400px; color:#2f3542;">
                <table style="width:100%; border-collapse:collapse;">
                    <tr style="border-bottom:2px solid #ccc; font-size:12px; color:#888;">
                        <th style="text-align:left; padding:5px;">TEAM</th>
                        <th style="text-align:right; padding:5px;">SCORE</th>
                    </tr>
                    ${roundResults.map((r, idx) => `
                        <tr style="border-bottom:1px dashed #eee; background:${r.isMe ? '#ffeaa7' : 'transparent'}; font-weight:${r.isMe ? 'bold' : 'normal'}">
                            <td style="padding:10px;">TEAM ${r.team.leader.name.split(' ')[0]}</td>
                            <td style="padding:10px; text-align:right; color:${r.isMe ? '#d35400' : '#2f3542'}">${r.score}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            <button id="btn-next-round" style="margin-top:30px; padding:15px 30px; background:#ff7675; color:#fff; font-size:16px; border:none; cursor:pointer;">NEXT >></button>
        `;

        const btn = document.getElementById('btn-next-round');
        if (App.currentRound < App.maxRounds) {
            btn.onclick = Competition.nextRound;
        } else {
            btn.innerText = "FINISH & RANKING";
            btn.onclick = Competition.finalizeEvent;
        }
    },

    nextRound: () => { App.currentRound++; Competition.startRound(); },

    finalizeEvent: () => {
        document.getElementById('round-result-overlay').style.display = 'none';
        SpecialEvent.teams.sort((a, b) => b.eventScore - a.eventScore);
        const rewards = [20000, 15000, 10000, 5000, 2000, 1000];
        
        let html = `<table style="width:100%; border-collapse:collapse; font-size:13px; text-align:center;">
            <tr style="background:#2f3542; color:#fff; height:40px;">
                <th style="padding:10px;">RANK</th><th style="padding:10px; text-align:left;">TEAM</th>
                <th style="padding:10px;">G1</th><th style="padding:10px;">G2</th><th style="padding:10px;">G3</th>
                <th style="padding:10px; color:#feca57;">TOTAL</th><th style="padding:10px;">BONUS</th>
            </tr>`;

        SpecialEvent.teams.forEach((t, i) => {
            let bonus = rewards[i] || 0;
            if (t.members.some(m => m.id === 'p')) {
                App.lastEventBonus = bonus; App.compScore = t.eventScore; App.accumulatedScore = t.eventScore;
            }
            t.members.forEach(m => { if (!m.totalVote) m.totalVote = 0; if (m.id !== 'p') m.totalVote += bonus; });

            let isMyTeam = t.members.some(m => m.id === 'p');
            let rowStyle = isMyTeam ? "background:#ffeaa7; font-weight:bold; color:#d35400;" : "color:#333; background:#fff;";
            let rankIcon = (i + 1) === 1 ? "👑" : `#${i + 1}`;

            html += `<tr style="border-bottom:1px solid #ddd; height:35px; ${rowStyle}">
                <td>${rankIcon}</td><td style="text-align:left;">${t.leader.name.split(' ')[0]}</td>
                <td style="color:#7f8c8d">${t.history[0]}</td><td style="color:#7f8c8d">${t.history[1]}</td><td style="color:#7f8c8d">${t.history[2]}</td>
                <td style="font-weight:bold; font-size:14px;">${t.eventScore}</td><td style="color:#27ae60;">+${formatNum(bonus)}</td>
            </tr>`;
        });
        html += `</table>`;
        document.getElementById('comp-rank-list').innerHTML = html;
        document.getElementById('comp-rank-list').style.maxWidth = "750px";
        document.getElementById('comp-result-overlay').style.display = 'flex';
    },

    animateValue: (id, start, end, duration) => { /* Helper function */
        let obj = document.getElementById(id); if(!obj) return;
        let range = end - start; let minTimer = 50;
        let stepTime = Math.abs(Math.floor(duration / (range / 100))); 
        stepTime = Math.max(stepTime, minTimer);
        let startTime = new Date().getTime(); let endTime = startTime + duration; let timer;
        function run() {
            let now = new Date().getTime(); let remaining = Math.max((endTime - now) / duration, 0);
            let value = Math.round(end - (remaining * range));
            obj.innerHTML = formatNum(value);
            if (value == end) clearInterval(timer);
        }
        timer = setInterval(run, stepTime); run();
    },

    closeResult: () => {
        document.getElementById('comp-result-overlay').style.display = 'none';
        document.getElementById('comp-screen').style.display = 'none';
        App.eventDone = true; Game.triggerStageSetup();
    },

    loop: () => {
        if (!Competition.active) return;
        const ctx = Competition.ctx; const w = Competition.canvas.width; const h = Competition.canvas.height;
        ctx.clearRect(0, 0, w, h);
        if (Competition.type === 'shoe') Competition.loopShoe(ctx, w, h);
        else if (Competition.type === 'push') Competition.loopPush(ctx, w, h);
        else if (Competition.type === 'run') Competition.loopRun(ctx, w, h);
        else if (Competition.type === 'catch') Competition.loopCatch(ctx, w, h);
        else if (Competition.type === 'dodge') Competition.loopDodge(ctx, w, h);
        else if (Competition.type === 'pose') Competition.loopPose(ctx, w, h);
        Competition.loopId = requestAnimationFrame(Competition.loop);
    },

    // --- GAME 1: SHOE TOSS ---
    shoeState: { barX: 0, dir: 1, speed: 15, phase: 'aiming', shoeX: 0, shoeY: 0, shoeVX: 0, shoeVY: 0, rot: 0, distance: 0 },
    setupShoe: () => {
        Competition.shoeState = { 
            barX: 0, dir: 1, speed: 15 + (App.day), phase: 'aiming',
            shoeX: 50, shoeY: 0, shoeVX: 0, shoeVY: 0, rot: 0, distance: 0
        };
        document.getElementById('c-time').innerText = "--";
        document.getElementById('c-score').innerText = "0m";
        window.onkeydown = (e) => {
            if (Competition.active && e.code === 'Space' && Competition.shoeState.phase === 'aiming') {
                Competition.shoeState.phase = 'flying'; Competition.calcShoeTrajectory();
            }
        };
    },
    loopShoe: (ctx, w, h) => {
        let s = Competition.shoeState;
        let skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, "#48dbfb"); skyGrad.addColorStop(1, "#a8e6cf");
        ctx.fillStyle = skyGrad; ctx.fillRect(0,0,w,h);
        ctx.fillStyle = "#2ecc71"; ctx.fillRect(0, h-60, w, 60); 
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath(); ctx.arc(150, 80, 40, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(w-100, 100, 30, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        for(let i=1; i<=10; i++) {
            let mx = (w/10) * i; ctx.fillRect(mx, h-60, 2, 20); ctx.font = "10px Arial"; ctx.fillText(i*10 + "m", mx-10, h-30);
        }
        if (s.phase === 'aiming') {
            drawFace(ctx, 50, h-90, Player, 3);
            ctx.fillStyle = "#555"; ctx.fillRect(50, h/2 - 20, w-100, 40); ctx.strokeRect(50, h/2 - 20, w-100, 40);
            ctx.fillStyle = "#00b894"; ctx.fillRect(w - 100, h/2 - 20, 50, 40); 
            ctx.fillStyle = "#fff"; ctx.fillRect(50 + s.barX, h/2 - 30, 10, 60); 
            s.barX += s.speed * s.dir; if (s.barX > w - 110 || s.barX < 0) s.dir *= -1;
        } else if (s.phase === 'flying') {
            s.shoeX += s.shoeVX; s.shoeY += s.shoeVY; s.shoeVY += 0.5; s.rot += 0.2;
            s.distance = Math.min(100, (s.shoeX / w) * 100); 
            ctx.save(); ctx.translate(s.shoeX, s.shoeY); ctx.rotate(s.rot);
            ctx.fillStyle = "#fff"; ctx.fillRect(-10, -5, 20, 10); ctx.fillStyle = "#d63031"; ctx.fillRect(5, -5, 5, 10); ctx.restore();
            drawFace(ctx, 50, h-90, Player, 3);
            ctx.fillStyle = "#2f3542"; ctx.font = "bold 40px Arial"; ctx.textAlign="center"; ctx.fillText(Math.floor(s.distance) + "m", w/2, h/2);
            if (s.shoeY > h - 60) { s.phase = 'landed'; Competition.finish(s.distance); }
        }
    },
    calcShoeTrajectory: () => {
        let w = Competition.canvas.width; let pos = Competition.shoeState.barX + 50; 
        let maxPos = w - 50; let dist = maxPos - pos; 
        let powerPercent = 0;
        if (dist < 50) powerPercent = 1.0 + (Math.random() * 0.2); else powerPercent = Math.max(0.1, 1.0 - (dist / w));
        Competition.shoeState.shoeX = 50; Competition.shoeState.shoeY = Competition.canvas.height - 90;
        Competition.shoeState.shoeVX = 8 * powerPercent; Competition.shoeState.shoeVY = -10;
    },

    // --- GAME 2: SUMO ---
    setupPush: () => {
        let cx = Competition.canvas.width / 2; let cy = Competition.canvas.height / 2;
        let startRadius = 120;
        Competition.entities = [];
        let teams = SpecialEvent.teams; let count = teams.length; let angleStep = (Math.PI * 2) / count;
        teams.forEach((t, i) => {
            let angle = i * angleStep;
            let x = cx + Math.cos(angle) * startRadius; let y = cy + Math.sin(angle) * startRadius;
            let isPlayer = t.members.some(m => m.id === 'p');
            Competition.entities.push({ 
                id: i, char: t.leader, x: x, y: y, r: 25, vx: 0, vy: 0, isPlayer: isPlayer, mass: isPlayer ? 1.2 : 1.0
            });
        });
        Competition.keys = {};
        window.onkeydown = (e) => Competition.keys[e.key] = true;
        window.onkeyup = (e) => Competition.keys[e.key] = false;
    },
    loopPush: (ctx, w, h) => {
        ctx.fillStyle = "#d3a675"; ctx.fillRect(0,0,w,h); 
        let cx = w/2, cy = h/2, radius = 200;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.fillStyle = "#f5e6ca"; ctx.fill(); 
        ctx.lineWidth=12; ctx.strokeStyle = "#e74c3c"; ctx.stroke();
        Competition.entities.forEach(e => {
            if (e.eliminated) return;
            if (e.isPlayer) {
                if (Competition.keys['ArrowUp']) e.vy -= 0.6; if (Competition.keys['ArrowDown']) e.vy += 0.6;
                if (Competition.keys['ArrowLeft']) e.vx -= 0.6; if (Competition.keys['ArrowRight']) e.vx += 0.6;
            } else {
                let target = null; let minDst = 9999;
                Competition.entities.forEach(other => {
                    if (other !== e && !other.eliminated) {
                        let d = Math.hypot(other.x - e.x, other.y - e.y);
                        if (d < minDst) { minDst = d; target = other; }
                    }
                });
                if (target) {
                    let dx = target.x - e.x; let dy = target.y - e.y; let len = Math.hypot(dx, dy);
                    if (len > 0) { e.vx += (dx/len) * 0.3; e.vy += (dy/len) * 0.3; }
                } else {
                    let dx = cx - e.x, dy = cy - e.y; e.vx += dx * 0.01; e.vy += dy * 0.01;
                }
            }
            e.vx *= 0.94; e.vy *= 0.94; e.x += e.vx; e.y += e.vy;
            drawFace(ctx, e.x, e.y, e.char, 3.5);
            if (e.isPlayer) { ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.arc(e.x, e.y - 35, 5, 0, Math.PI*2); ctx.fill(); }
            if (Math.hypot(e.x - cx, e.y - cy) > radius) {
                e.eliminated = true; ctx.fillStyle = "red"; ctx.font="bold 20px Arial"; ctx.fillText("OUT!", e.x, e.y);
                if (e.isPlayer) Competition.finish(10); 
            }
        });
        for(let i=0; i<Competition.entities.length; i++) {
            for(let j=i+1; j<Competition.entities.length; j++) {
                let a = Competition.entities[i]; let b = Competition.entities[j];
                if (a.eliminated || b.eliminated) continue;
                let dx = b.x - a.x; let dy = b.y - a.y; let dist = Math.hypot(dx, dy);
                if (dist < 60) { 
                    let angle = Math.atan2(dy, dx); let force = 3.0; 
                    let tx = Math.cos(angle) * force; let ty = Math.sin(angle) * force;
                    a.vx -= tx / a.mass; a.vy -= ty / a.mass; b.vx += tx / b.mass; b.vy += ty / b.mass;
                    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; ctx.beginPath(); ctx.arc((a.x+b.x)/2, (a.y+b.y)/2, 20, 0, Math.PI*2); ctx.fill();
                }
            }
        }
        let activeEntities = Competition.entities.filter(e => !e.eliminated);
        let playerAlive = activeEntities.some(e => e.isPlayer);
        if (playerAlive && activeEntities.length === 1) Competition.finish(100); 
    },

    // --- GAME 3: RUN ---
    setupRun: () => {
        Competition.entities = [];
        Competition.entities.push({ id:'p', x: 20, y: 100, isPlayer:true });
        for(let i=0; i<3; i++) Competition.entities.push({ id:i, x: 20, y: 150 + i*50, isPlayer:false });
        window.onkeydown = (e) => {
            if (e.code === 'Space' && Competition.active) Competition.entities[0].x += 15; 
        };
    },
    loopRun: (ctx, w, h) => {
        ctx.fillStyle = "#e17055"; ctx.fillRect(0,0,w,h);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.setLineDash([20, 20]);
        for(let i=0; i<5; i++) { let y = 100 + i*50 - 25; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        ctx.setLineDash([]);
        let finishX = w - 50;
        for(let i=0; i<10; i++) {
            ctx.fillStyle = i%2===0 ? "#fff" : "#000"; ctx.fillRect(finishX, i*(h/10), 20, h/10);
            ctx.fillStyle = i%2!==0 ? "#fff" : "#000"; ctx.fillRect(finishX+20, i*(h/10), 20, h/10);
        }
        Competition.entities.forEach(e => {
            if (!e.isPlayer) e.x += 2 + Math.random(); 
            drawFace(ctx, e.x, e.y, e.isPlayer ? Player : NPCs[e.id], 1.5);
            if (e.isPlayer) {
                let progress = Math.min(100, (e.x / finishX) * 100);
                Competition.score = Math.floor(progress);
                document.getElementById('c-score').innerText = Competition.score + "/100";
            }
            if (e.x > finishX && e.isPlayer) Competition.finish(100);
        });
    },

    // --- GAME 4: CATCH (ĐÃ NÂNG CẤP) ---
    setupCatch: () => {
        Competition.entities = []; Competition.players = []; 
        
        // 1. Tạo Gà
        for(let i=0; i<10; i++) Competition.entities.push({ x: Math.random()*400, y: Math.random()*300, vx: Math.random()*4-2, vy: Math.random()*4-2 });
        
        // 2. Tạo Players
        Competition.players.push({ x: 200, y: 200, isPlayer:true });
        Competition.players.push({ x: 200, y: 220, isPlayer:false, target:null });
        Competition.players.push({ x: 220, y: 200, isPlayer:false, target:null });
        
        // 3. Tạo Cỏ (Trang trí nền)
        Competition.grass = [];
        for(let i=0; i<50; i++) {
            Competition.grass.push({x: Math.random()*Competition.canvas.width, y: Math.random()*Competition.canvas.height});
        }

        Competition.keys = {};
        window.onkeydown = (e) => Competition.keys[e.key] = true;
        window.onkeyup = (e) => Competition.keys[e.key] = false;
    },
    loopCatch: (ctx, w, h) => {
        // Nền cỏ xanh
        ctx.fillStyle = "#55efc4"; ctx.fillRect(0,0,w,h);
        
        // Vẽ Cỏ
        ctx.fillStyle = "#00b894"; 
        Competition.grass.forEach(g => {
            ctx.fillRect(g.x, g.y, 4, 8);
            ctx.fillRect(g.x+2, g.y+3, 4, 5);
        });

        // Gà Vàng (TO HƠN - Radius 15)
        Competition.entities.forEach(c => {
            c.x += c.vx; c.y += c.vy;
            if(c.x<0 || c.x>w) c.vx *= -1; if(c.y<0 || c.y>h) c.vy *= -1;
            
            // Vẽ Gà
            ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(c.x, c.y, 15, 0, Math.PI*2); ctx.fill(); // Thân to
            ctx.fillStyle = "#e67e22"; ctx.beginPath(); ctx.arc(c.x+8, c.y, 5, 0, Math.PI*2); ctx.fill(); // Mỏ to
            ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(c.x-4, c.y-4, 4, 0, Math.PI*2); ctx.fill(); // Mắt to
            
            // Mào gà đỏ
            ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(c.x, c.y-12, 5, 0, Math.PI*2); ctx.fill(); 
        });
        
        // Players (TO HƠN - Scale 3.0)
        Competition.players.forEach((p, idx) => {
            if (p.isPlayer) {
                if (Competition.keys['ArrowUp']) p.y -= 4; if (Competition.keys['ArrowDown']) p.y += 4;
                if (Competition.keys['ArrowLeft']) p.x -= 4; if (Competition.keys['ArrowRight']) p.x += 4;
            } else {
                if (!p.target || Math.random()<0.02) p.target = Competition.entities[Math.floor(Math.random()*Competition.entities.length)];
                if (p.target) {
                    let dx = p.target.x - p.x, dy = p.target.y - p.y; let d = Math.hypot(dx, dy);
                    p.x += (dx/d)*3; p.y += (dy/d)*3;
                }
            }
            // Vẽ mặt to (Scale 3.0)
            drawFace(ctx, p.x, p.y, idx===0 ? Player : NPCs[idx], 3.0);
            
            // Xử lý bắt gà
            for (let i = Competition.entities.length-1; i>=0; i--) {
                let c = Competition.entities[i];
                // Tăng khoảng cách va chạm lên 50 (do gà và người đều to)
                if (Math.hypot(p.x - c.x, p.y - c.y) < 50) {
                    Competition.entities.splice(i, 1);
                    if (p.isPlayer) {
                        Competition.score = Math.min(100, Competition.score + 10); // 10 điểm/con
                        document.getElementById('c-score').innerText = Competition.score;
                        // Hiệu ứng ăn điểm
                        ctx.fillStyle = "#fff"; ctx.font="bold 20px Arial"; ctx.fillText("+10", p.x, p.y-40);
                    }
                    Competition.entities.push({ x: Math.random()*w, y: Math.random()*h, vx: Math.random()*4-2, vy: Math.random()*4-2 });
                }
            }
        });
    },

    // --- GAME 5: DODGE RAIN ---
    setupDodge: () => {
        let w = Competition.canvas.width; let h = Competition.canvas.height;
        Competition.entities = [{ x: w/2, y: h-70, isPlayer: true }];
        Competition.items = []; Competition.keys = {};
        window.onkeydown = (e) => Competition.keys[e.key] = true;
        window.onkeyup = (e) => Competition.keys[e.key] = false;
    },
    loopDodge: (ctx, w, h) => {
        let skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, "#4fc3f7"); skyGrad.addColorStop(1, "#b3e5fc");
        ctx.fillStyle = skyGrad; ctx.fillRect(0,0,w,h);

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.beginPath(); ctx.arc(100, 50, 30, 0, Math.PI*2); ctx.arc(150, 60, 40, 0, Math.PI*2); ctx.arc(200, 50, 30, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(w-150, 100, 35, 0, Math.PI*2); ctx.arc(w-100, 110, 45, 0, Math.PI*2); ctx.arc(w-50, 100, 35, 0, Math.PI*2); ctx.fill();

        if (Math.random() < 0.08) {
            let type = Math.random() < 0.3 ? 'star' : 'bomb'; 
            Competition.items.push({ x: Math.random() * (w - 40) + 20, y: -40, type: type, speed: 5 + Math.random() * 4 });
        }
        
        let p = Competition.entities[0];
        if (Competition.keys['ArrowLeft'] && p.x > 30) p.x -= 7;
        if (Competition.keys['ArrowRight'] && p.x < w-30) p.x += 7;
        
        drawFace(ctx, p.x, p.y, Player, 3.5);

        for(let i = Competition.items.length-1; i>=0; i--) {
            let it = Competition.items[i]; it.y += it.speed;
            
            if (it.type === 'star') {
                ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(it.x, it.y, 20, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#fff"; ctx.font="bold 24px Arial"; ctx.textAlign = "center"; ctx.fillText("★", it.x, it.y + 8);
            } else {
                ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(it.x, it.y, 22, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#000"; ctx.font="28px Arial"; ctx.textAlign = "center"; ctx.fillText("💣", it.x, it.y + 10);
            }

            if (Math.hypot(p.x - it.x, p.y - it.y) < 50) {
                if (it.type === 'star') {
                    Competition.score = Math.min(100, Competition.score + 10); 
                    ctx.fillStyle = "#2ecc71"; ctx.fillText("+10", p.x, p.y - 40);
                } else {
                    Competition.score = Math.max(0, Competition.score - 10); 
                    ctx.fillStyle = "#e74c3c"; ctx.fillText("-10", p.x, p.y - 40);
                }
                document.getElementById('c-score').innerText = Competition.score;
                Competition.items.splice(i, 1);
            } else if (it.y > h + 50) {
                Competition.items.splice(i, 1);
            }
        }
    },

    // --- GAME 6: POSE ---
    poseState: { flashing: false, flashTimer: 0, nextFlash: 100, isPosing: false },
    setupPose: () => {
        let w = Competition.canvas.width; let h = Competition.canvas.height;
        Competition.entities = [{ x: w/2, y: h/2, isPlayer: true }];
        for(let i=0; i<5; i++) Competition.entities.push({ id:i, x: Math.random()*w, y: Math.random()*h, isPlayer: false, vx: 2, vy: 2 });
        Competition.poseState = { flashing: false, flashTimer: 0, nextFlash: 100 + Math.random()*100 };
        Competition.keys = {};
        window.onkeydown = (e) => { Competition.keys[e.code] = true; if (e.code === 'Space') Competition.poseState.isPosing = true; };
        window.onkeyup = (e) => { Competition.keys[e.code] = false; if (e.code === 'Space') Competition.poseState.isPosing = false; };
    },
    loopPose: (ctx, w, h) => {
        let ps = Competition.poseState; ps.flashTimer++;
        if (ps.flashTimer > ps.nextFlash) {
            ps.flashing = true;
            if (ps.flashTimer > ps.nextFlash + 60) {
                ps.flashing = false; ps.flashTimer = 0; ps.nextFlash = 100 + Math.random() * 150;
                Competition.score = Math.min(100, Competition.score + 20); 
                document.getElementById('c-score').innerText = Competition.score;
            }
        }
        if (ps.flashing) {
            ctx.fillStyle = "#fff"; ctx.fillRect(0,0,w,h);
            ctx.fillStyle = "#d63031"; ctx.font = "bold 40px Arial"; ctx.textAlign="center"; ctx.fillText("POSE !!!", w/2, h/2);
        } else {
            for (let i = 0; i < w; i += 50) {
                for (let j = 0; j < h; j += 50) {
                    ctx.fillStyle = (i/50 + j/50) % 2 === 0 ? "#a29bfe" : "#6c5ce7"; ctx.fillRect(i, j, 50, 50);
                }
            }
        }
        Competition.entities.forEach(e => {
            if (e.isPlayer) {
                if (!ps.isPosing && !ps.flashing) {
                    if (Competition.keys['ArrowUp']) e.y -= 3; if (Competition.keys['ArrowDown']) e.y += 3;
                    if (Competition.keys['ArrowLeft']) e.x -= 3; if (Competition.keys['ArrowRight']) e.x += 3;
                }
                if (ps.flashing && !ps.isPosing) {
                    Competition.score = Math.max(0, Competition.score - 5); 
                }
                drawFace(ctx, e.x, e.y, Player, ps.isPosing ? 2.5 : 2); 
                if (ps.isPosing) { ctx.strokeStyle="yellow"; ctx.lineWidth=3; ctx.strokeRect(e.x-15, e.y-15, 30, 30); }
            } else {
                if (!ps.flashing) {
                    e.x += e.vx; e.y += e.vy;
                    if(e.x<0||e.x>w) e.vx*=-1; if(e.y<0||e.y>h) e.vy*=-1;
                }
                drawFace(ctx, e.x, e.y, NPCs[e.id], 1.5);
            }
        });
    }
};

/* --- HEART GAME (DAY 30) - GIỮ NGUYÊN --- */
var HeartGame = {
    canvas: null, ctx: null, active: false, score: 0, timeLeft: 15, items: [], timerId: null,
    start: () => {
        document.getElementById('heart-start-overlay').style.display = 'none';
        HeartGame.canvas = document.getElementById('heartCanvas');
        HeartGame.ctx = HeartGame.canvas.getContext('2d');
        const p = HeartGame.canvas.parentElement;
        HeartGame.canvas.width = p.clientWidth; HeartGame.canvas.height = p.clientHeight;
        HeartGame.score = 0; HeartGame.timeLeft = 15; HeartGame.items = []; HeartGame.active = true;
        document.getElementById('heart-score').innerText = 0;
        HeartGame.canvas.onmousedown = (e) => HeartGame.click(e.offsetX, e.offsetY);
        HeartGame.loop();
        HeartGame.timerId = setInterval(() => {
            HeartGame.timeLeft--;
            document.getElementById('heart-time').innerText = HeartGame.timeLeft;
            if (HeartGame.timeLeft <= 0) HeartGame.finish();
        }, 1000);
    },
    click: (mx, my) => {
        for(let i = HeartGame.items.length-1; i>=0; i--) {
            let it = HeartGame.items[i];
            if (Math.hypot(mx - it.x, my - it.y) < 30) {
                HeartGame.score += 500; 
                document.getElementById('heart-score').innerText = formatNum(HeartGame.score);
                HeartGame.items.splice(i, 1);
                break;
            }
        }
    },
    loop: () => {
        if (!HeartGame.active) return;
        const ctx = HeartGame.ctx; const w = HeartGame.canvas.width; const h = HeartGame.canvas.height;
        ctx.clearRect(0, 0, w, h);
        if (Math.random() < 0.1) {
            HeartGame.items.push({ x: Math.random() * (w - 40) + 20, y: -30, speed: 3 + Math.random() * 5, color: Math.random() < 0.8 ? '#ff6b81' : '#feca57' });
        }
        for(let i = HeartGame.items.length-1; i>=0; i--) {
            let it = HeartGame.items[i]; it.y += it.speed;
            ctx.fillStyle = it.color; ctx.beginPath(); ctx.arc(it.x, it.y, 10, 0, Math.PI*2); ctx.fill();
            if (it.y > h) HeartGame.items.splice(i, 1);
        }
        requestAnimationFrame(HeartGame.loop);
    },
    finish: () => {
        HeartGame.active = false; clearInterval(HeartGame.timerId);
        Player.totalVote += HeartGame.score;
        Notify.show(`APPEAL FINISHED!\n+${formatNum(HeartGame.score)} VOTES`);
        setTimeout(() => { Game.simDay(); }, 1500);
    }
};