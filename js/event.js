/* --- SPECIAL EVENTS & TOURNAMENT LOGIC --- */

// 1. HÀM VẼ MẶT (Giữ nguyên)
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
    
    startDraft: () => {
        if (typeof Game !== 'undefined') Game.toggleJoystick(false);
        showScreen('draft-screen');
        const canvas = document.getElementById('draftCanvas');
        const container = document.getElementById('draft-visual');
        const ctx = canvas.getContext('2d');
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width; canvas.height = rect.height;

        // Nhận diện Mobile
        const isMobile = (canvas.width < 1024) || (navigator.maxTouchPoints > 0);
        let viewDetailTeamIndex = -1;

        // --- SỰ KIỆN CLICK (Để xem chi tiết nếu cần) ---
        canvas.onclick = (e) => {
            if (!isMobile) return; 
            const cRect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / cRect.width;
            const scaleY = canvas.height / cRect.height;
            const clickX = (e.clientX - cRect.left) * scaleX;
            const clickY = (e.clientY - cRect.top) * scaleY;

            SpecialEvent.teams.forEach((t, index) => {
                if (Math.hypot(clickX - t.x, clickY - t.y) < 50) {
                    viewDetailTeamIndex = (viewDetailTeamIndex === index) ? -1 : index;
                }
            });
        };

        let survivors = [...NPCs, {...Player, id:'p'}].filter(n => !n.eliminated).sort((a,b) => b.totalVote - a.totalVote);
        let numTeams = (App.day === 7) ? 6 : 4;
        let leaders = survivors.slice(0, numTeams);
        let pool = survivors.slice(numTeams);

        // --- TÍNH TOÁN VỊ TRÍ ---
        SpecialEvent.teams = leaders.map((l, index) => {
            let tx = 0, ty = 90;
            if (isMobile) {
                // Chia đều theo chiều ngang
                tx = (canvas.width / numTeams) * index + (canvas.width / numTeams / 2);
                ty = 100; 
            } else {
                tx = (canvas.width / numTeams) * index + (canvas.width / numTeams / 2);
                ty = 90;
            }
            return { leader: l, members: [l], x: tx, y: ty, eventScore: 0, history: [0, 0, 0] };
        });

        let pickingTeam = 0; let animId;

        const drawDraft = () => {
            // --- 1. VẼ NỀN ---
            for (let i = 0; i < canvas.width; i += 50) {
                for (let j = 0; j < canvas.height; j += 50) {
                    ctx.fillStyle = (i/50 + j/50) % 2 === 0 ? "#CD853F" : "#DEB887"; ctx.fillRect(i, j, 50, 50);
                }
            }
            let gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 50, canvas.width/2, canvas.height/2, canvas.width/1.2);
            gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)"); gradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
            ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.textAlign = "center"; ctx.lineWidth = 6; ctx.strokeStyle = "#000"; ctx.fillStyle = "#fff"; 
            ctx.font = "bold 24px 'Press Start 2P'";
            ctx.strokeText("TEAM DRAFT", canvas.width/2, 40); ctx.fillText("TEAM DRAFT", canvas.width/2, 40);

            // --- 2. VẼ CÁC ĐỘI & THÀNH VIÊN ---
            SpecialEvent.teams.forEach((t, i) => {
                let currentY = t.y; 
                let isLeaderPlayer = (t.leader.id === 'p');
                let amIInThisTeam = t.members.some(m => m.id === 'p');

                // Highlight đội của mình
                if (amIInThisTeam) {
                    ctx.save(); ctx.shadowColor = "#00ffea"; ctx.shadowBlur = 40;
                    ctx.beginPath(); ctx.arc(t.x, currentY, 38, 0, Math.PI*2); 
                    ctx.fillStyle = "rgba(0, 255, 234, 0.4)"; ctx.fill(); 
                    ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke(); ctx.restore();
                } else if (isLeaderPlayer) {
                    ctx.save(); ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 30;
                    ctx.beginPath(); ctx.arc(t.x, currentY, 35, 0, Math.PI*2); ctx.fillStyle = "rgba(255, 255, 0, 0.6)"; ctx.fill(); ctx.restore();
                }

                // Vẽ Leader (To)
                drawFace(ctx, t.x, currentY, t.leader, 4.5); 
                
                // Tên Team
                ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#000";
                ctx.fillStyle = "#FFD700"; ctx.font = "bold 10px 'Press Start 2P'"; 
                ctx.strokeText(`TEAM ${i+1}`, t.x, currentY - 35); ctx.fillText(`TEAM ${i+1}`, t.x, currentY - 35);
                
                // Tên Leader
                let lName = `★ ${t.leader.name.split(' ')[0]}`;
                ctx.fillStyle = isLeaderPlayer ? "#ff4757" : (amIInThisTeam ? "#00ffea" : "#fff");
                ctx.font = "8px 'Press Start 2P'";
                ctx.strokeText(lName, t.x, currentY + 30); ctx.fillText(lName, t.x, currentY + 30);

                // --- [UPDATE] VẼ CÁC THÀNH VIÊN BÊN DƯỚI (ICONS) ---
                t.members.forEach((m, mi) => {
                    if (mi > 0) { // Bỏ qua Leader (index 0)
                        let spacing = 35; // Khoảng cách giữa các thành viên
                        let startY = currentY + 65; // Vị trí bắt đầu (dưới tên leader)
                        let memberY = startY + ((mi - 1) * spacing);
                        let isPlayer = (m.id === 'p');

                        // Vẽ bóng mờ dưới chân cho đẹp
                        ctx.fillStyle = "rgba(0,0,0,0.3)";
                        ctx.beginPath(); ctx.ellipse(t.x, memberY + 12, 10, 5, 0, 0, Math.PI*2); ctx.fill();

                        // Vẽ mặt thành viên (Scale nhỏ: 2.2)
                        drawFace(ctx, t.x, memberY, m, 2.2);

                        // Nếu là người chơi, thêm mũi tên nhỏ hoặc viền để nhận biết
                        if (isPlayer) {
                            ctx.strokeStyle = "#ff4757"; ctx.lineWidth = 2;
                            ctx.beginPath(); ctx.moveTo(t.x, memberY - 15); ctx.lineTo(t.x - 5, memberY - 20); ctx.lineTo(t.x + 5, memberY - 20); ctx.closePath();
                            ctx.fillStyle = "#ff4757"; ctx.fill(); ctx.stroke();
                        }
                    }
                });
            });

            // --- 3. VẼ POOL (Hàng chờ bên dưới cùng) ---
            // Thu nhỏ chiều cao pool lại một chút để nhường chỗ cho danh sách team
            let poolHeight = 100; let poolY = canvas.height - poolHeight;
            if (pool.length > 0) {
                ctx.fillStyle = "#5d4037"; ctx.fillRect(0, poolY, canvas.width, poolHeight);
                ctx.fillStyle = "#ff6b81"; ctx.fillRect(0, poolY, canvas.width, 6);
                ctx.fillStyle = "#fff"; ctx.font = "10px 'Press Start 2P'"; ctx.textAlign = "center";
                ctx.fillText("WAITING...", canvas.width/2, poolY - 15);

                pool.forEach((p, i) => {
                    if (!p.picked) {
                        let itemsPerRow = isMobile ? 10 : 15; 
                        let spacingX = canvas.width / itemsPerRow;
                        let px = (spacingX / 2) + (i % itemsPerRow) * spacingX; 
                        let py = poolY + 40 + Math.floor(i / itemsPerRow) * 40;
                        drawFace(ctx, px, py, p, 2.0); 
                    }
                });
            }
        };

        const pickStep = () => {
            if (pool.length === 0) {
                cancelAnimationFrame(animId);
                document.getElementById('draft-status').innerText = "SQUADS READY!";
                document.getElementById('draft-status').style.color = "#27ae60";
                document.getElementById('btn-start-event').style.display = 'block';
                drawDraft();
                return;
            }
            let randomIndex = Math.floor(Math.random() * pool.length);
            let pickedMember = pool[randomIndex];
            pickedMember.picked = true;
            SpecialEvent.teams[pickingTeam].members.push(pickedMember);
            pool.splice(randomIndex, 1); 
            pickingTeam = (pickingTeam + 1) % numTeams;
            drawDraft(); setTimeout(pickStep, 100); 
        };
        drawDraft(); setTimeout(pickStep, 800);
    },

    startCompetition: () => {
        App.currentRound = 1; App.accumulatedScore = 0; App.maxRounds = 3;
        Competition.startRound();
    }
};

var Competition = {
    canvas: null, ctx: null, active: false, type: null,
    entities: [], items: [],
    timer: 30, score: 0, loopId: null, lastGameType: null,
    
    joystick: { active: false, vecX: 0, vecY: 0 },
    frameCounter: 0,
    totalParticipants: 0,

    getRankScore: (rank) => {
        if (rank === -1) return 0;
        let step = 100 / (Competition.totalParticipants || 4); // Fix division by zero check
        return Math.floor(100 - (rank - 1) * step);
    },

    startRound: () => {
        const games = ['shoe', 'push', 'run', 'catch', 'dodge', 'redgreen'];
        let availableGames = games.filter(g => g !== Competition.lastGameType);
        let randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
        Competition.lastGameType = randomGame;
        Competition.init(randomGame);
    },

    init: (type) => {
        if (typeof Game !== 'undefined') Game.toggleJoystick(false);
        showScreen('comp-screen');
        
        let canvas = document.getElementById('compCanvas');
        // --- FIX DOM MANIPULATION ---
        // Không xóa đi tạo lại wrapper liên tục, chỉ tạo 1 lần nếu chưa có
        let wrapper = document.getElementById('comp-canvas-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'comp-canvas-wrapper';
            wrapper.style.cssText = "position: relative; width: 90%; height: 450px; background: #000; border: 4px solid #fff; margin: 0 auto;";
            // Move canvas inside
            canvas.parentElement.insertBefore(wrapper, canvas);
            wrapper.appendChild(canvas);
            wrapper.appendChild(document.getElementById('comp-overlay'));
            wrapper.appendChild(document.getElementById('comp-hud'));
            wrapper.appendChild(document.getElementById('round-result-overlay'));
        }

        Competition.canvas = canvas;
        Competition.ctx = Competition.canvas.getContext('2d', { alpha: false }); // Optimize
        Competition.canvas.width = wrapper.clientWidth;
        Competition.canvas.height = wrapper.clientHeight;

        Competition.type = type; 
        Competition.active = false;
        
        document.getElementById('round-result-overlay').style.display = 'none';
        document.getElementById('comp-result-overlay').style.display = 'none';
        document.getElementById('comp-hud').style.display = 'none';
        
        const overlay = document.getElementById('comp-overlay'); 
        overlay.style.display = 'flex';
        const title = document.getElementById('comp-name'); 
        const desc = document.getElementById('comp-desc');
        
        title.innerHTML = `<span style="font-size:12px; color:#aaa; display:block; margin-bottom:5px;">ROUND ${App.currentRound}/${App.maxRounds}</span>`;
        
        let numTeams = SpecialEvent.teams.length || 4; 
        Competition.totalParticipants = numTeams;

        let gameName = type.toUpperCase();
        let instructions = "";

        if (type === 'shoe') instructions = "Throw farthest! TAP in GREEN ZONE!";
        else if (type === 'push') instructions = `Sumo Battle! Stay in ring longest!`;
        else if (type === 'run') instructions = `Race! Reach finish line fastest!`;
        else if (type === 'catch') instructions = `Catch CHICKENS 🐔! Get highest score!`;
        else if (type === 'dodge') instructions = `Dodge BOMBS 💣! Collect STARS ⭐!`;
        else if (type === 'redgreen') { gameName = "RED LIGHT, GREEN LIGHT"; instructions = "Run on GREEN. Stop on RED. Be fast!"; }

        title.innerHTML += gameName;
        desc.innerHTML = instructions;
        
        Competition.setupInput();
    },

    setupInput: () => {
        const c = Competition.canvas;
        // Xóa event cũ để tránh memory leak
        const newC = c.cloneNode(true);
        c.parentNode.replaceChild(newC, c);
        Competition.canvas = newC;
        Competition.ctx = newC.getContext('2d');

        const tapAction = (e) => {
            if (!Competition.active) return;
            // Shoe: Ném
            if (Competition.type === 'shoe' && Competition.shoeState && Competition.shoeState.phase === 'aiming') { 
                Competition.shoeState.phase = 'flying'; Competition.calcShoeTrajectory(); 
            }
            // Run: Tap để chạy nhanh
            if (Competition.type === 'run') {
                let p = Competition.entities.find(e => e.isPlayer);
                if(p && !p.finished) p.x += 15; 
            }
        };

        newC.addEventListener('mousedown', tapAction);
        // --- FIX TOUCH EVENT ---
        newC.addEventListener('touchstart', (e) => {
            if(e.cancelable) e.preventDefault(); // Chỉ prevent nếu cancelable
            tapAction(e);
        }, { passive: false });
    },

    startGame: () => {
        document.getElementById('comp-overlay').style.display = 'none';
        document.getElementById('comp-hud').style.display = 'block';
        
        Competition.active = true; 
        Competition.score = 0; 
        Competition.timer = 20; 
        Competition.frameCounter = 0;
        Competition.entities = []; 
        Competition.items = [];

        const needJoystick = ['push', 'catch', 'dodge', 'redgreen'];
        if (typeof Game !== 'undefined') Game.toggleJoystick(needJoystick.includes(Competition.type));

        if (Competition.type === 'shoe') Competition.setupShoe();
        else if (Competition.type === 'push') Competition.setupPush();
        else if (Competition.type === 'run') Competition.setupRun();
        else if (Competition.type === 'catch') Competition.setupCatch();
        else if (Competition.type === 'dodge') Competition.setupDodge();
        else if (Competition.type === 'redgreen') Competition.setupRedGreen();

        Competition.loop();
        
        if (['catch', 'dodge'].includes(Competition.type)) {
            // Clear old interval if exists
            if(Competition.timerInterval) clearInterval(Competition.timerInterval);
            
            Competition.timerInterval = setInterval(() => {
                if (!Competition.active) { clearInterval(Competition.timerInterval); return; }
                Competition.timer--;
                const timeEl = document.getElementById('c-time');
                if(timeEl) timeEl.innerText = Competition.timer;
                
                if (Competition.timer <= 0) Competition.finishMatch(); 
            }, 1000);
        } else {
            const timeEl = document.getElementById('c-time');
            if(timeEl) timeEl.innerText = "--";
        }
    },

    loop: () => {
        if (!Competition.active) return;
        const ctx = Competition.ctx; const w = Competition.canvas.width; const h = Competition.canvas.height;
        ctx.clearRect(0, 0, w, h);
        Competition.frameCounter++;

        if (typeof Joystick !== 'undefined' && Joystick.active) {
            Competition.joystick.active = true;
            Competition.joystick.vecX = Joystick.valX;
            Competition.joystick.vecY = Joystick.valY;
        } else {
            Competition.joystick.active = false;
            Competition.joystick.vecX = 0; Competition.joystick.vecY = 0;
        }

        // Try-catch bên trong loop để tránh crash cả app nếu 1 game lỗi
        try {
            if (Competition.type === 'shoe') Competition.loopShoe(ctx, w, h);
            else if (Competition.type === 'push') Competition.loopPush(ctx, w, h);
            else if (Competition.type === 'run') Competition.loopRun(ctx, w, h);
            else if (Competition.type === 'catch') Competition.loopCatch(ctx, w, h);
            else if (Competition.type === 'dodge') Competition.loopDodge(ctx, w, h);
            else if (Competition.type === 'redgreen') Competition.loopRedGreen(ctx, w, h);
        } catch (e) {
            console.error("Game Loop Error:", e);
            Competition.finishMatch(); // Thoát game nếu lỗi
            return;
        }

        Competition.loopId = requestAnimationFrame(Competition.loop);
    },

    // ============================================================
    // === FIX QUAN TRỌNG: TÁCH LOGIC VÀ UI ===
    // ============================================================
    finishMatch: () => {
        if (!Competition.active) return; // Chặn gọi nhiều lần
        Competition.active = false; 
        
        if(Competition.loopId) cancelAnimationFrame(Competition.loopId);
        if(Competition.timerInterval) clearInterval(Competition.timerInterval);
        if (typeof Game !== 'undefined') Game.toggleJoystick(false);

        // --- BƯỚC 1: XỬ LÝ SỐ LIỆU NGẦM ---
        if (SpecialEvent.teams.length === 0) Competition.setupEntitiesFromTeams();

        if (Competition.type === 'shoe') {
            Competition.entities.forEach(e => {
                if (!e.isPlayer) e.performance = Math.floor(20 + Math.random() * 75); 
                else e.performance = Math.floor(e.distance || 0);
            });
        }

        let isDescending = ['catch', 'dodge', 'shoe', 'push'].includes(Competition.type);

        Competition.entities.sort((a, b) => {
            let pa = (a.performance !== undefined) ? a.performance : (isDescending ? -1 : 99999);
            let pb = (b.performance !== undefined) ? b.performance : (isDescending ? -1 : 99999);
            
            if (Competition.type === 'push' || Competition.type === 'redgreen') {
                if (a.elim && !b.elim) return 1;
                if (!a.elim && b.elim) return -1;
            }
            return isDescending ? (pb - pa) : (pa - pb);
        });

        Competition.entities.forEach((e, index) => {
            if (Competition.type === 'redgreen' && e.elim) e.rank = -1;
            else e.rank = index + 1;
        });

        // --- BƯỚC 2: RENDER UI SAU 100MS (Tránh Freeze) ---
        setTimeout(() => {
            let myTeamIndex = SpecialEvent.teams.findIndex(t => t.members.some(m => m.id === 'p'));
            let roundResults = [];
            
            SpecialEvent.teams.forEach((t, i) => {
                let ent = Competition.entities.find(e => e.teamIdx === i);
                let s = 0;
                let resultText = "---";

                if (ent) {
                    s = Competition.getRankScore(ent.rank);
                    if (Competition.type === 'shoe') resultText = `${ent.performance}m`;
                    else if (Competition.type === 'catch') resultText = `${ent.performance} 🐔`;
                    else if (Competition.type === 'dodge') resultText = `${ent.performance} ⭐`;
                    else if (Competition.type === 'push') resultText = (ent.rank === 1) ? "SURVIVOR" : `#${ent.rank}`;
                    else if (Competition.type === 'run') resultText = `${(ent.performance/60).toFixed(2)}s`;
                    else if (Competition.type === 'redgreen') resultText = (ent.rank === -1) ? "ELIM" : `${(ent.performance/60).toFixed(2)}s`;
                }

                if(!t.history) t.history = [];
                t.history[App.currentRound - 1] = s; 
                t.eventScore = (t.eventScore || 0) + s;

                roundResults.push({ team: t, score: s, raw: resultText, isMe: (i === myTeamIndex) });
            });
            
            roundResults.sort((a, b) => b.score - a.score);
            let myResult = roundResults.find(r => r.isMe);
            let myScore = myResult ? myResult.score : 0;

            const overlay = document.getElementById('round-result-overlay'); 
            overlay.style.display = 'flex';
            
            // Hàm an toàn để lấy tên/màu
            const getSafeLeader = (t) => t.leader || {name: 'Bot', skin: '#ccc', hair: '#000'};

            overlay.innerHTML = `
                <h3 style="color:#a29bfe; margin-bottom: 10px; text-transform: uppercase; text-shadow: 1px 1px 0 #000; font-size: 18px;">ROUND ${App.currentRound} RESULT</h3>
                <div class="res-layout" style="display:flex; flex-direction:row; gap:10px; width:90%; max-width:600px; height: 280px;">
                    <div class="res-table" style="background:#fff; border-radius:8px; padding:10px; border:3px solid #2f3542; flex: 2.5; display:flex; flex-direction:column; overflow:hidden;">
                        <div style="display:flex; border-bottom:2px solid #2f3542; padding-bottom:5px; margin-bottom:5px; font-weight:900; font-size:10px; color:#2f3542; text-transform: uppercase;">
                            <div style="flex:2;">TEAM</div>
                            <div style="flex:1; text-align:center;">PERF</div>
                            <div style="flex:1; text-align:right;">PTS</div>
                        </div>
                        <div style="flex-grow: 1; overflow-y: auto;">
                            ${roundResults.map((r, idx) => {
                                let l = getSafeLeader(r.team);
                                return `
                                <div style="display:flex; padding:6px 2px; border-bottom:1px dashed #ccc; font-size:10px; color:#2f3542; background:${r.isMe ? '#ffeaa7' : 'transparent'}; font-weight:${r.isMe ? 'bold' : 'normal'}; align-items:center;">
                                    <div style="flex:2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center;">
                                        <span style="color:#aaa; margin-right:5px; font-size: 9px;">#${idx+1}</span>
                                        <div style="width: 16px; height: 16px; background-color: ${l.skin}; border-radius: 3px; margin-right: 5px; border: 1px solid #2f3542; position: relative; overflow: hidden; flex-shrink: 0;">
                                            <div style="width: 100%; height: 30%; background-color: ${l.hair}; position: absolute; top: 0;"></div>
                                        </div>
                                        ${l.name.split(' ')[0]}
                                    </div>
                                    <div style="flex:1; text-align:center; color:#e17055; font-weight:bold; font-size:9px;">${r.raw}</div>
                                    <div style="flex:1; text-align:right; color:#00b894; font-weight:900;">+${r.score}</div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                    <div class="res-summary" style="flex: 1; display:flex; flex-direction:column; justify-content:center; align-items:center; background: rgba(47, 53, 66, 0.95); padding: 10px; border-radius: 8px; border: 3px solid #fff; color: #fff;">
                        <div style="margin-bottom: 15px; text-align:center;">
                            <div style="font-size:10px; opacity:0.8; text-transform: uppercase; margin-bottom: 5px;">EARNED</div>
                            <div style="font-size:28px; font-weight:900; color:#ffeaa7; text-shadow: 2px 2px 0 #e67e22; line-height: 1;">+${myScore}</div>
                            <div style="font-size:10px; font-weight:bold;">PTS</div>
                        </div>
                        <button id="btn-next-round" style="background:#ff7675; color:#fff; border:2px solid #fff; padding:10px 0; font-family:inherit; cursor:pointer; border-radius:20px; font-weight:900; font-size: 12px; text-transform: uppercase; width: 100%; box-shadow: 0 4px 0 #d63031; transition: all 0.1s;">
                            ${App.currentRound < App.maxRounds ? "NEXT >>" : "FINISH"}
                        </button>
                    </div>
                </div>`;
            
            const btn = document.getElementById('btn-next-round');
            if (btn) {
                btn.onclick = (App.currentRound < App.maxRounds) ? Competition.nextRound : Competition.finalizeEvent;
            }
        }, 100);
    },

    nextRound: () => { App.currentRound++; Competition.startRound(); },

    finalizeEvent: () => {
        // Tương tự, cần setTimeout cho finalizeEvent để tránh khựng
        document.getElementById('round-result-overlay').style.display = 'none';
        
        setTimeout(() => {
            SpecialEvent.teams.sort((a, b) => (b.eventScore||0) - (a.eventScore||0));
            const rewards = [20000, 15000, 10000, 5000, 2000, 1000];
            
            let tableRows = SpecialEvent.teams.map((t, i) => {
                let isMyTeam = t.members.some(m => m.id === 'p');
                let bonus = rewards[i] || 0;
                
                if (isMyTeam) { App.lastEventBonus = bonus; App.compScore = t.eventScore; }
                t.members.forEach(m => { if(m.id !== 'p') m.totalVote = (m.totalVote || 0) + bonus; });

                let h = t.history || [0,0,0];
                let l = t.leader || {name:'Bot', skin:'#ccc', hair:'#000'}; // Safe access
                let rowBg = isMyTeam ? '#ffeaa7' : '#fff';

                return `
                <div style="display:flex; padding:12px 5px; border-bottom:1px dashed #ccc; font-size:12px; color:#2f3542; background:${rowBg}; font-weight:${isMyTeam?'bold':'normal'}; align-items:center;">
                    <div style="width: 40px; text-align:center; font-weight:900; color:${(i===0)?"#f1c40f":"#2f3542"}; font-size:14px;">${(i===0)?"👑":`#${i+1}`}</div>
                    <div style="flex:2; display:flex; align-items:center; overflow:hidden;">
                        <div style="width: 20px; height: 20px; background-color: ${l.skin}; border-radius: 4px; margin-right: 8px; border: 1px solid #2f3542; position: relative; overflow: hidden; flex-shrink: 0;">
                            <div style="width: 100%; height: 30%; background-color: ${l.hair}; position: absolute; top: 0;"></div>
                        </div>
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${l.name.split(' ')[0]}</span>
                    </div>
                    <div style="flex:1; text-align:center; color:#74b9ff;">${h[0]||0}</div>
                    <div style="flex:1; text-align:center; color:#a29bfe;">${h[1]||0}</div>
                    <div style="flex:1; text-align:center; color:#ff7675;">${h[2]||0}</div>
                    <div style="flex:1; text-align:right; font-weight:900; color:#00b894; font-size:14px; padding-right:5px;">${t.eventScore||0}</div>
                </div>`;
            }).join('');

            const overlay = document.getElementById('comp-result-overlay');
            overlay.style.display = 'flex';
            
            overlay.innerHTML = `
                <h1 style="color:#ffeaa7; text-shadow: 3px 3px 0 #d35400; font-size: 32px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px;">FINAL STANDINGS</h1>
                <div class="res-layout" style="display:flex; flex-direction:row; gap:20px; width:95%; max-width:900px; height: 380px;">
                    <div class="res-table" style="background:#fff; border-radius:12px; padding:15px; border:4px solid #2f3542; flex: 2.5; display:flex; flex-direction:column; overflow:hidden; box-shadow: 5px 5px 0 rgba(0,0,0,0.2);">
                        <div style="display:flex; border-bottom:3px solid #2f3542; padding-bottom:10px; margin-bottom:5px; font-weight:900; font-size:12px; color:#2f3542; text-transform: uppercase;">
                            <div style="width: 40px; text-align:center;">#</div>
                            <div style="flex:2;">TEAM</div>
                            <div style="flex:1; text-align:center;">G1</div>
                            <div style="flex:1; text-align:center;">G2</div>
                            <div style="flex:1; text-align:center;">G3</div>
                            <div style="flex:1; text-align:right; padding-right:5px;">TOTAL</div>
                        </div>
                        <div style="flex-grow: 1; overflow-y: auto; padding-right:5px;">${tableRows}</div>
                    </div>
                    <div class="res-summary" style="flex: 1; display:flex; flex-direction:column; justify-content:center; align-items:center; background: rgba(47, 53, 66, 0.95); padding: 20px; border-radius: 12px; border: 4px solid #fff; color: #fff; box-shadow: 5px 5px 0 rgba(0,0,0,0.3);">
                        <div style="margin-bottom: 30px; text-align:center; width:100%;">
                            <div style="font-size:12px; opacity:0.8; text-transform: uppercase; margin-bottom: 10px; letter-spacing:1px; border-bottom:1px solid rgba(255,255,255,0.3); padding-bottom:5px;">RANKING BONUS</div>
                            <div style="font-size:36px; font-weight:900; color:#ffeaa7; text-shadow: 3px 3px 0 #e67e22; line-height: 1.2;">+${(App.lastEventBonus || 0).toLocaleString()}</div>
                            <div style="font-size:14px; font-weight:bold; color:#f1c40f;">VOTES</div>
                        </div>
                        <button id="btn-close-event" style="background:#00b894; color:#fff; border:3px solid #fff; padding:15px 0; font-family:inherit; cursor:pointer; border-radius:30px; font-weight:900; font-size: 16px; text-transform: uppercase; width: 100%; box-shadow: 0 6px 0 #008c72; transition: all 0.1s;">COMPLETE EVENT</button>
                    </div>
                </div>`;
                
            const btn = document.getElementById('btn-close-event');
            if(btn) btn.onclick = Competition.closeResult;
        }, 100);
    },

    closeResult: () => { 
        document.getElementById('comp-result-overlay').style.display = 'none'; 
        document.getElementById('comp-screen').style.display = 'none'; 
        App.eventDone = true; 
        Game.triggerStageSetup(); 
    },

    setupEntitiesFromTeams: () => {
        Competition.entities = [];
        let teams = SpecialEvent.teams;
        if (!teams || teams.length === 0) {
            teams = [{leader:Player, members:[{id:'p'}]}, {leader:{name:'Bot 1', skin:'#f00', hair:'#000'}, members:[{id:0}]}, {leader:{name:'Bot 2', skin:'#0f0', hair:'#000'}, members:[{id:1}]}, {leader:{name:'Bot 3', skin:'#00f', hair:'#000'}, members:[{id:2}]}];
        }
        teams.forEach((t, i) => {
            let isPlayer = t.members.some(m => m.id === 'p');
            Competition.entities.push({
                teamIdx: i, id: isPlayer ? 'p' : i, isPlayer: isPlayer, char: t.leader || {skin:'#ccc', hair:'#000', name:'Unk'},
                x: 0, y: 0, vx: 0, vy: 0, performance: 0, rank: 0, finished: false, elim: false
            });
        });
    },

    // --- GAME LOGIC (GIỮ NGUYÊN NHƯNG CHECK SAFE DRAWFACE) ---
    setupShoe: () => { Competition.setupEntitiesFromTeams(); Competition.shoeState = { barX:0, dir:1, speed:15, phase:'aiming', shoeX:50, shoeY:0, shoeVX:0, shoeVY:0, rot:0, distance:0 }; },
    loopShoe: (ctx, w, h) => { 
        let s = Competition.shoeState; ctx.fillStyle="#48dbfb"; ctx.fillRect(0,0,w,h); ctx.fillStyle="#2ecc71"; ctx.fillRect(0,h-60,w,60); 
        if(s.phase==='aiming') {
            drawFace(ctx,50,h-90,Player,3); ctx.fillStyle="#555";ctx.fillRect(50,h/2-20,w-100,40); ctx.fillStyle="#fff";ctx.fillRect(50+s.barX,h/2-30,10,60);
            s.barX+=s.speed*s.dir;if(s.barX>w-110||s.barX<0)s.dir*=-1;
        } else {
            s.shoeX+=s.shoeVX; s.shoeY+=s.shoeVY; s.shoeVY+=0.5; s.rot+=0.2; s.distance=Math.min(100,(s.shoeX/w)*100);
            ctx.save();ctx.translate(s.shoeX,s.shoeY);ctx.rotate(s.rot); ctx.fillStyle="#d63031";ctx.fillRect(-10,-5,20,10);ctx.restore();
            drawFace(ctx,50,h-90,Player,3); ctx.fillStyle="#2f3542";ctx.font="30px Arial";ctx.fillText(Math.floor(s.distance)+"m",w/2,h/2);
            if(s.shoeY>h-60) { 
                let p = Competition.entities.find(e => e.isPlayer);
                if(p) p.distance = s.distance;
                Competition.finishMatch(); 
            }
        }
    },
    calcShoeTrajectory: () => { let w=Competition.canvas.width; let power=1.0-Math.abs((w-50)-(Competition.shoeState.barX+50))/w; Competition.shoeState.shoeX=50; Competition.shoeState.shoeY=Competition.canvas.height-90; Competition.shoeState.shoeVX=15*power; Competition.shoeState.shoeVY=-12; },

    setupRun: () => { Competition.setupEntitiesFromTeams(); let sp=Competition.canvas.height/(Competition.entities.length+1); Competition.entities.forEach((e,i)=>{e.x=20;e.y=sp*(i+1);e.speed=2+Math.random()*1.5;}); },
    loopRun: (ctx, w, h) => { 
        ctx.fillStyle="#e17055"; ctx.fillRect(0,0,w,h); let fX=w-50; for(let i=0;i<h;i+=20){ctx.fillStyle=(i/20)%2===0?"#fff":"#000";ctx.fillRect(fX,i,20,20);}
        let allFinished=true; 
        Competition.entities.forEach(e=>{
            if(!e.finished){ allFinished=false; if(!e.isPlayer)e.x+=e.speed+(Math.random()*1.5); }
            drawFace(ctx,e.x,e.y,e.char,1.5);
            if(e.x>fX && !e.finished){ e.finished=true; e.x=fX+30; e.performance = Competition.frameCounter; }
        });
        if(allFinished) Competition.finishMatch();
    },

    setupPush: () => { Competition.setupEntitiesFromTeams(); let cx=Competition.canvas.width/2,cy=Competition.canvas.height/2; Competition.eliminatedCount=0; Competition.entities.forEach((e,i)=>{let ang=i*(Math.PI*2/Competition.entities.length); e.x=cx+Math.cos(ang)*120; e.y=cy+Math.sin(ang)*120; e.r=25; e.mass=1.2; e.performance=0;}); },
    loopPush: (ctx, w, h) => { 
        ctx.fillStyle="#d3a675";ctx.fillRect(0,0,w,h); let cx=w/2,cy=h/2,r=Math.min(w,h)*0.4; ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle="#f5e6ca";ctx.fill();ctx.lineWidth=8;ctx.strokeStyle="#e74c3c";ctx.stroke();
        let alive=0, last=null;
        Competition.entities.forEach(e=>{ 
            if(e.elim) return; alive++; last=e;
            if(e.isPlayer){e.vx+=Competition.joystick.vecX*0.8;e.vy+=Competition.joystick.vecY*0.8;}
            else{let t=Competition.entities.find(o=>!o.elim&&o!==e); if(t){let dx=t.x-e.x,dy=t.y-e.y,d=Math.hypot(dx,dy);if(d>0){e.vx+=(dx/d)*0.3;e.vy+=(dy/d)*0.3;}}}
            e.vx*=0.92;e.vy*=0.92;e.x+=e.vx;e.y+=e.vy; drawFace(ctx,e.x,e.y,e.char,3.5);
            if(Math.hypot(e.x-cx,e.y-cy)>r){ e.elim=true; e.performance = Competition.eliminatedCount; Competition.eliminatedCount++; }
        });
        for(let i=0;i<Competition.entities.length;i++)for(let j=i+1;j<Competition.entities.length;j++){let a=Competition.entities[i],b=Competition.entities[j];if(a.elim||b.elim)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<60){let an=Math.atan2(dy,dx),f=3;let tx=Math.cos(an)*f,ty=Math.sin(an)*f;a.vx-=tx/a.mass;a.vy-=ty/a.mass;b.vx+=tx/b.mass;b.vy+=ty/b.mass;}}
        let p=Competition.entities.find(e=>e.isPlayer); 
        if(p.elim || alive===1){ if(alive===1) last.performance = Competition.entities.length; Competition.finishMatch(); }
    },

    setupCatch: () => { Competition.setupEntitiesFromTeams(); Competition.entities.forEach(e=>{e.x=Math.random()*400;e.y=Math.random()*300;e.performance=0;}); Competition.items=[]; for(let i=0;i<12;i++) Competition.items.push({x:Math.random()*400,y:Math.random()*300,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4}); },
    loopCatch: (ctx, w, h) => { 
        ctx.fillStyle="#55efc4";ctx.fillRect(0,0,w,h); ctx.font="24px Arial";ctx.textAlign="center";
        Competition.items.forEach(c=>{c.x+=c.vx;c.y+=c.vy;if(c.x<0||c.x>w)c.vx*=-1;if(c.y<0||c.y>h)c.vy*=-1;ctx.fillText("🐔",c.x,c.y);});
        Competition.entities.forEach(p=>{
            if(p.isPlayer){p.x+=Competition.joystick.vecX*5;p.y+=Competition.joystick.vecY*5;}
            else{let cl=null,md=9999;Competition.items.forEach(it=>{let d=Math.hypot(p.x-it.x,p.y-it.y);if(d<md){md=d;cl=it;}});if(cl){let dx=cl.x-p.x,dy=cl.y-p.y;if(md>0){p.x+=(dx/md)*3;p.y+=(dy/md)*3;}}}
            p.x=Math.max(20,Math.min(w-20,p.x));p.y=Math.max(20,Math.min(h-20,p.y)); drawFace(ctx,p.x,p.y,p.char,3); ctx.fillStyle="#000";ctx.font="12px Arial";ctx.fillText(p.performance,p.x,p.y-40);
            for(let i=Competition.items.length-1;i>=0;i--){if(Math.hypot(p.x-Competition.items[i].x,p.y-Competition.items[i].y)<40){Competition.items.splice(i,1);p.performance++;if(p.isPlayer){const el=document.getElementById('c-score');if(el)el.innerText=p.performance;}Competition.items.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4});}}
        });
    },

    setupDodge: () => { Competition.setupEntitiesFromTeams(); let sp=Competition.canvas.width/(Competition.entities.length+1); Competition.entities.forEach((e,i)=>{e.x=sp*(i+1);e.y=Competition.canvas.height-50;e.performance=0;}); Competition.items=[]; },
    loopDodge: (ctx, w, h) => { 
        ctx.fillStyle="#4fc3f7";ctx.fillRect(0,0,w,h); 
        if(Math.random()<0.08) Competition.items.push({x:Math.random()*(w-40)+20,y:-40,type:Math.random()<0.3?'star':'bomb',speed:4+Math.random()*3});
        ctx.font="35px Arial";ctx.textAlign="center";
        for(let i=Competition.items.length-1;i>=0;i--){let it=Competition.items[i];it.y+=it.speed;ctx.fillText(it.type==='star'?"⭐":"💣",it.x,it.y);
            Competition.entities.forEach(p=>{if(Math.hypot(p.x-it.x,p.y-it.y)<60){if(it.type==='star')p.performance+=10;else p.performance=Math.max(0,p.performance-10);if(p.isPlayer){const el=document.getElementById('c-score');if(el)el.innerText=p.performance;}it.eaten=true;}});
            if(it.y>h+50||it.eaten)Competition.items.splice(i,1);
        }
        Competition.entities.forEach(p=>{
            if(p.isPlayer)p.x+=Competition.joystick.vecX*6;
            else{if(Math.random()<0.05)p.tx=Math.random()*w;if(p.tx)p.x+=(p.tx-p.x)*0.05;}
            p.x=Math.max(30,Math.min(w-30,p.x)); drawFace(ctx,p.x,p.y,p.char,3); ctx.fillStyle="#000";ctx.font="12px Arial";ctx.fillText(p.performance,p.x,p.y-40);
        });
    },

    setupRedGreen: () => { Competition.setupEntitiesFromTeams(); Competition.rlState={isGreen:true,timer:0,nextSwitch:100}; let sp=Competition.canvas.width/(Competition.entities.length+1); Competition.entities.forEach((e,i)=>{e.x=sp*(i+1);e.y=Competition.canvas.height-30;}); },
    loopRedGreen: (ctx, w, h) => {
        let s=Competition.rlState; s.timer++; if(s.timer>s.nextSwitch){s.isGreen=!s.isGreen;s.timer=0;s.nextSwitch=s.isGreen?(100+Math.random()*150):(60+Math.random()*60);}
        ctx.fillStyle=s.isGreen?"#a3e635":"#ef4444";ctx.fillRect(0,0,w,h); ctx.fillStyle="#fff";ctx.fillRect(0,50,w,20);
        ctx.font="40px 'Press Start 2P'";ctx.textAlign="center";ctx.fillText(s.isGreen?"RUN!":"STOP!",w/2,40);
        
        let allDone = true;
        Competition.entities.forEach(e=>{
            if(e.finished||e.elim) return;
            allDone = false;
            let mv=false;
            if(e.isPlayer){if(Math.abs(Competition.joystick.vecY)>0.1){e.y-=3;mv=true;}}
            else{if(s.isGreen){e.y-=(2+Math.random());mv=true;}else if(Math.random()<0.02){e.y-=1;mv=true;}}
            drawFace(ctx,e.x,e.y,e.char,2.5);
            if(!s.isGreen && mv){e.elim=true; ctx.fillText("❌",e.x,e.y);}
            if(e.y<50){e.finished=true; e.performance = Competition.frameCounter;}
        });
        if(allDone) Competition.finishMatch();
    },
};

// Đảm bảo Competition.keys tồn tại
Competition.keys = {};
window.onkeydown = (e) => Competition.keys[e.key] = true;
window.onkeyup = (e) => Competition.keys[e.key] = false;

// Đảm bảo Competition.keys tồn tại
Competition.keys = {};
window.onkeydown = (e) => Competition.keys[e.key] = true;
window.onkeyup = (e) => Competition.keys[e.key] = false;