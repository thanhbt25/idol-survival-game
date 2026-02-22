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

        if (SpecialEvent.resizeDraftCanvas) {
            window.removeEventListener('resize', SpecialEvent.resizeDraftCanvas);
            window.removeEventListener('orientationchange', SpecialEvent.resizeDraftCanvas);
        }
        SpecialEvent.resizeDraftCanvas = () => {
            const r = container.getBoundingClientRect();
            canvas.width = r.width;
            canvas.height = r.height;
            if (typeof SpecialEvent.initLayout === 'function') SpecialEvent.initLayout();
        };
        window.addEventListener('resize', SpecialEvent.resizeDraftCanvas);
        window.addEventListener('orientationchange', SpecialEvent.resizeDraftCanvas);

        let isMobile = canvas.width < 768 || canvas.height > canvas.width;
        let survivors = [...NPCs, {...Player, id:'p'}].filter(n => !n.eliminated).sort((a,b) => b.totalVote - a.totalVote);
        let numTeams = 5;

        let leaders = survivors.slice(0, numTeams);
        let pool = survivors.slice(numTeams);

        // Khởi tạo layout cho các thẻ (Cards)
        SpecialEvent.initLayout = () => {
            isMobile = canvas.width < 768 || canvas.height > canvas.width;
            SpecialEvent.teams.forEach((t, index) => {
                if (isMobile) {
                    let col = index % 2;
                    let row = Math.floor(index / 2);
                    t.x = (index === 4) ? canvas.width / 2 : (canvas.width / 4) * (col * 2 + 1);
                    t.y = 110 + row * 120;
                    t.scale = 3.5;
                } else {
                    t.x = (canvas.width / numTeams) * index + (canvas.width / numTeams / 2);
                    t.y = canvas.height * 0.45;
                    t.scale = 4.5;
                }
            });
        };

        SpecialEvent.teams = leaders.map((l) => {
            return { leader: l, members: [l], x: 0, y: 0, scale: 3, eventScore: 0, history: [0, 0, 0], flash: 0, floatTextY: 0 };
        });
        
        SpecialEvent.initLayout();

        let pickingTeam = 0; 
        let animId;
        let isDrafting = true;
        let lastPickTime = Date.now();
        let totalMembersPerTeam = Math.ceil(survivors.length / numTeams);

        // FIX LỖI: Đưa khai báo isVi và mainFont ra ngoài cùng để dùng được ở mọi nơi
        const isVi = (typeof Lang !== 'undefined' && Lang.current === 'vi');
        const mainFont = isVi ? "'VT323', monospace" : "'Press Start 2P', sans-serif";

        const drawDraft = () => {
            // 1. Vẽ Background (Sàn nhà màu Vàng tươi sáng, lưới Cam nhạt)
            ctx.fillStyle = "#ffeaa7"; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "rgba(225, 112, 85, 0.2)"; 
            ctx.lineWidth = 2;
            for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
            for (let j = 0; j < canvas.height; j += 40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke(); }

            // 2. Tiêu đề (Đổi viền đen, chữ đỏ cam cho hợp với nền sáng)
            ctx.textAlign = "center"; ctx.lineWidth = 6; ctx.strokeStyle = "#2d3436"; ctx.fillStyle = "#ff7675";
            let titleSize = isMobile ? (isVi ? "26px" : "18px") : (isVi ? "38px" : "28px");
            ctx.font = `bold ${titleSize} ${mainFont}`;
            
            const draftTitle = isVi ? "BỐC THĂM ĐỘI HÌNH" : "TEAM DRAFT";
            ctx.strokeText(draftTitle, canvas.width/2, isMobile ? 40 : 60); 
            ctx.fillText(draftTitle, canvas.width/2, isMobile ? 40 : 60);

            // 3. Vẽ các khu vực Đội (Team Cards)
            SpecialEvent.teams.forEach((t, i) => {
                let isLeaderPlayer = (t.leader.id === 'p');
                let amIInThisTeam = t.members.some(m => m.id === 'p');

                if (t.flash > 0) t.flash -= 0.05;
                if (t.flash < 0) t.flash = 0;

                ctx.save();
                ctx.translate(t.x, t.y);
                
                if (amIInThisTeam) {
                    ctx.shadowColor = "#00b894"; ctx.shadowBlur = 20; // Đổi bóng sang xanh lá cho hợp nền vàng
                } else if (t.flash > 0) {
                    ctx.shadowColor = "#ffdd59"; ctx.shadowBlur = 30 * t.flash;
                }
                
                // Nền thẻ: Hơi xám trong suốt để nổi bật trên nền vàng sáng
                ctx.fillStyle = (amIInThisTeam) ? "rgba(0, 184, 148, 0.8)" : "rgba(45, 52, 54, 0.85)";
                if (t.flash > 0) ctx.fillStyle = `rgba(255, 221, 89, ${0.4 + t.flash * 0.6})`;
                ctx.beginPath(); ctx.roundRect(-50, -50, 100, 100, 10); ctx.fill();
                ctx.lineWidth = amIInThisTeam ? 3 : 2;
                ctx.strokeStyle = amIInThisTeam ? "#55efc4" : "#636e72";
                ctx.stroke();
                ctx.restore();

                drawFace(ctx, t.x, t.y - 10, t.leader, t.scale);

                ctx.textAlign = "center"; ctx.lineWidth = 3; ctx.strokeStyle = "#000";
                ctx.fillStyle = amIInThisTeam ? "#55efc4" : "#fff"; 
                let teamFontSize = isMobile ? (isVi ? "14px" : "8px") : (isVi ? "16px" : "10px");
                ctx.font = `bold ${teamFontSize} ${mainFont}`; 
                ctx.strokeText(`TEAM ${i+1}`, t.x, t.y - 40); ctx.fillText(`TEAM ${i+1}`, t.x, t.y - 40);
                
                let lName = `★ ${t.leader.name.split(' ')[0]}`;
                ctx.fillStyle = isLeaderPlayer ? "#ff4757" : "#feca57";
                let leaderFontSize = isMobile ? (isVi ? "14px" : "8px") : (isVi ? "16px" : "9px");
                ctx.font = `${leaderFontSize} ${mainFont}`;
                ctx.strokeText(lName, t.x, t.y + 20); ctx.fillText(lName, t.x, t.y + 20);

                let slotW = 6; let slotGap = 4;
                let totalW = (totalMembersPerTeam * slotW) + ((totalMembersPerTeam - 1) * slotGap);
                let startX = t.x - totalW / 2 + slotW / 2;
                let startY = t.y + 35;

                for (let mIdx = 0; mIdx < totalMembersPerTeam; mIdx++) {
                    ctx.beginPath();
                    ctx.arc(startX + mIdx * (slotW + slotGap), startY, slotW/2, 0, Math.PI * 2);
                    if (mIdx < t.members.length) {
                        ctx.fillStyle = (t.members[mIdx].id === 'p') ? "#ff7675" : "#0be881"; 
                        ctx.fill();
                        ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke();
                    } else {
                        ctx.fillStyle = "rgba(255,255,255,0.15)"; 
                        ctx.fill();
                        ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1; ctx.stroke();
                    }
                }

                if (t.flash > 0) {
                    t.floatTextY -= 1;
                    ctx.fillStyle = `rgba(11, 232, 129, ${t.flash})`;
                    ctx.font = `bold ${isVi ? "20px" : "14px"} ${mainFont}`; 
                    ctx.lineWidth = 3; ctx.strokeStyle = `rgba(0,0,0,${t.flash})`;
                    ctx.strokeText("+1", t.x, t.y - 50 + t.floatTextY);
                    ctx.fillText("+1", t.x, t.y - 50 + t.floatTextY);
                }
            });

            // 4. Vẽ khu vực Pool (Chờ bốc thăm) ở đáy màn hình
            let poolHeight = isMobile ? 120 : 100; 
            let poolY = canvas.height - poolHeight;
            
            ctx.fillStyle = "#2d3436"; ctx.fillRect(0, poolY, canvas.width, poolHeight);
            ctx.fillStyle = "#0984e3"; ctx.fillRect(0, poolY, canvas.width, 4); // Đổi viền xanh cho mát
            ctx.fillStyle = "#fff"; 
            ctx.font = `${isVi ? "14px" : "8px"} ${mainFont}`; 
            ctx.textAlign = "center";
            ctx.fillText(isVi ? `ĐANG CHỜ BỐC THĂM: ${pool.length}` : `WAITING POOL: ${pool.length}`, canvas.width/2, poolY + 15);
            
            if (pool.length > 0) {
                let itemsPerRow = isMobile ? 8 : 15; 
                let spacingX = canvas.width / itemsPerRow;
                survivors.slice(numTeams).forEach((p, i) => {
                    let px = (spacingX / 2) + (i % itemsPerRow) * spacingX; 
                    let py = poolY + 40 + Math.floor(i / itemsPerRow) * 35;
                    ctx.save();
                    if (p.picked) { ctx.globalAlpha = 0.2; } 
                    drawFace(ctx, px, py, p, isMobile ? 1.5 : 2.0); 
                    ctx.restore();
                });
            }
        };

        const pickStep = () => {
            if (pool.length === 0) {
                isDrafting = false;
                document.getElementById('draft-status').innerText = ((typeof Lang !== 'undefined' && Lang.current === 'vi') ? "CÁC ĐỘI HÌNH ĐÃ SẴN SÀNG!" : "SQUADS READY!");
                document.getElementById('draft-status').style.color = "#0be881";
                document.getElementById('btn-start-event').style.display = 'block';
                return;
            }
            
            let randomIndex = Math.floor(Math.random() * pool.length);
            let pickedMember = pool[randomIndex];
            pickedMember.picked = true;
            
            SpecialEvent.teams[pickingTeam].members.push(pickedMember);
            SpecialEvent.teams[pickingTeam].flash = 1.0; 
            SpecialEvent.teams[pickingTeam].floatTextY = 0; 
            
            pool.splice(randomIndex, 1); 
            pickingTeam = (pickingTeam + 1) % numTeams;
        };

        const renderLoop = () => {
            drawDraft();
            
            let now = Date.now();
            if (isDrafting && now - lastPickTime > 350) {
                pickStep();
                lastPickTime = now;
            }

            if (isDrafting || SpecialEvent.teams.some(t => t.flash > 0)) {
                animId = requestAnimationFrame(renderLoop);
            }
        };

        animId = requestAnimationFrame(renderLoop);
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
    
    // --- INPUT STATE ---
    joystick: { active: false, vecX: 0, vecY: 0 },
    keys: { up: false, down: false, left: false, right: false, space: false }, // PC Keyboard state
    isPC: !('ontouchstart' in window), 

    frameCounter: 0,
    totalParticipants: 0,

    // [THÊM MỚI] Hàm vẽ bóng/vòng sáng xanh dưới chân người chơi
    drawPlayerHighlight: (ctx, x, y, scale) => {
        ctx.save();
        ctx.translate(x, y + (scale * 8)); // Dịch chuyển tâm xuống dưới chân
        ctx.scale(2, 1); // Kéo giãn chiều ngang để tạo hình elip dẹt (phối cảnh top-down)
        ctx.beginPath();
        ctx.arc(0, 0, scale * 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(9, 132, 227, 0.6)"; // Xanh dương bán trong suốt
        ctx.shadowColor = "#74b9ff"; // Phát sáng viền
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.restore();
    },

    getRankScore: (rank) => {
        if (rank === -1) return 0;
        let step = 100 / (Competition.totalParticipants || 4);
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
        const compScreen = document.getElementById('comp-screen');
        if (compScreen) compScreen.style.display = '';
        
        let canvas = document.getElementById('compCanvas');
        let wrapper = document.getElementById('comp-canvas-wrapper');
        
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'comp-canvas-wrapper';
            wrapper.className = 'responsive-game-wrapper'; 
            
            canvas.parentElement.insertBefore(wrapper, canvas);
            wrapper.appendChild(canvas);
            wrapper.appendChild(document.getElementById('comp-overlay'));
            wrapper.appendChild(document.getElementById('comp-hud'));
            wrapper.appendChild(document.getElementById('round-result-overlay'));
        }

        Competition.canvas = canvas;
        Competition.ctx = Competition.canvas.getContext('2d', { alpha: false });
        Competition.canvas.width = wrapper.clientWidth || 600;
        Competition.canvas.height = wrapper.clientHeight || 450;

        Competition.type = type; 
        Competition.active = false;
        
        document.getElementById('round-result-overlay').style.display = 'none';
        document.getElementById('comp-result-overlay').style.display = 'none';
        document.getElementById('comp-hud').style.display = 'none';
        
        const overlay = document.getElementById('comp-overlay'); 
        overlay.style.display = 'flex';
        const title = document.getElementById('comp-name'); 
        const desc = document.getElementById('comp-desc');
        const compTitle = document.getElementById('comp-title');
        
        const isVi = (typeof Lang !== 'undefined' && Lang.current === 'vi');
        title.innerHTML = `<span style="font-size:12px; color:#aaa; display:block; margin-bottom:5px;">${isVi ? "VÒNG" : "ROUND"} ${App.currentRound}/${App.maxRounds}</span>`;
        
        let numTeams = SpecialEvent.teams.length || 4; 
        Competition.totalParticipants = numTeams;

        let gameName = type.toUpperCase();
        let instructions = "";
        
        let actionTxt = Competition.isPC ? (type === 'shoe' ? (isVi ? "NHẤP CHUỘT" : "CLICK MOUSE") : (isVi ? "NHẤN SPACE" : "PRESS SPACE")) : (isVi ? "CHẠM" : "TAP");
        let moveTxt = Competition.isPC ? (isVi ? "PHÍM MŨI TÊN" : "ARROW KEYS") : "JOYSTICK";

        if (type === 'shoe') {
            gameName = isVi ? "NÉM GIÀY" : "SHOE THROW";
            instructions = isVi
                ? `Ném xa nhất! ${actionTxt}`
                : `Throw farthest! ${actionTxt}!`;
        }
        else if (type === 'push') {
            gameName = isVi ? "ĐẤU SUMO" : "SUMO PUSH";
            instructions = isVi
                ? `Đấu sumo! Dùng ${moveTxt} để trụ trong vòng!`
                : `Sumo Battle! Use ${moveTxt} to stay inside!`;
        }
        else if (type === 'run') {
            gameName = isVi ? "CHẠY ĐUA" : "SPRINT RACE";
            instructions = isVi
                ? `Chạy đua! ${actionTxt} liên tục để tăng tốc!`
                : `Race! ${actionTxt} repeatedly to run!`;
        }
        else if (type === 'catch') {
            gameName = isVi ? "BẮT GÀ" : "CHICKEN CATCH";
            instructions = isVi
                ? `Dùng ${moveTxt} để bắt GÀ 🐔!`
                : `Use ${moveTxt} to catch CHICKENS 🐔!`;
        }
        else if (type === 'dodge') {
            gameName = isVi ? "NÉM BOM" : "BOMB DODGE";
            instructions = isVi
                ? `Dùng ${moveTxt} để né BOM 💣!`
                : `Use ${moveTxt} to dodge BOMBS 💣!`;
        }
        else if (type === 'redgreen') {
            gameName = isVi ? "ĐÈN XANH - ĐÈN ĐỎ" : "RED LIGHT, GREEN LIGHT";
            instructions = isVi
                ? "Chạy khi XANH. Dừng khi ĐỎ."
                : "Run on GREEN. Stop on RED.";
        }

        title.innerHTML += gameName;
        desc.innerHTML = instructions;
        if (compTitle) compTitle.textContent = gameName;
        
        Competition.setupInput();
    },

    setupInput: () => {
        const c = document.getElementById('compCanvas');
        if(!c) return;

        const wrapper = document.getElementById('comp-canvas-wrapper');
        const newC = c.cloneNode(true);
        c.parentNode.replaceChild(newC, c);
        
        Competition.canvas = newC;
        Competition.ctx = newC.getContext('2d', { alpha: false });

        Competition.canvas.width = wrapper.clientWidth || 800;
        Competition.canvas.height = wrapper.clientHeight || 600;

        const triggerAction = (e) => {
            if (!Competition.active) return;
            if (Competition.type === 'shoe' && Competition.shoeState && Competition.shoeState.phase === 'aiming') { 
                Competition.shoeState.phase = 'flying'; Competition.calcShoeTrajectory(); 
            }
            if (Competition.type === 'run') {
                let p = Competition.entities.find(ent => ent.isPlayer);
                if(p && !p.finished) p.x += 15; 
            }
        };

        newC.addEventListener('touchstart', (e) => {
            if(e.cancelable) e.preventDefault();
            if (Competition.type === 'redgreen') Competition.mouseHeld = true;
            triggerAction();
        }, { passive: false });

        newC.addEventListener('touchend', (e) => {
            if(e.cancelable) e.preventDefault();
            Competition.mouseHeld = false;
        }, { passive: false });
        newC.addEventListener('touchcancel', () => { Competition.mouseHeld = false; });

        newC.addEventListener('mousedown', () => {
            if (Competition.type === 'redgreen') Competition.mouseHeld = true;
            triggerAction();
        });
        newC.addEventListener('mouseup', () => { Competition.mouseHeld = false; });
        newC.addEventListener('mouseleave', () => { Competition.mouseHeld = false; });

        // --- PC KEYBOARD ---
        window.removeEventListener('keydown', Competition.handleKeyDown);
        window.removeEventListener('keyup', Competition.handleKeyUp);

        Competition.handleKeyDown = (e) => {
            if (!Competition.active) return;
            switch(e.code) {
                case 'ArrowUp': case 'KeyW': Competition.keys.up = true; break;
                case 'ArrowDown': case 'KeyS': Competition.keys.down = true; break;
                case 'ArrowLeft': case 'KeyA': Competition.keys.left = true; break;
                case 'ArrowRight': case 'KeyD': Competition.keys.right = true; break;
                case 'Space': 
                    if (!Competition.keys.space) { 
                        e.preventDefault(); triggerAction(); Competition.keys.space = true;
                    } break;
            }
        };

        Competition.handleKeyUp = (e) => {
            switch(e.code) {
                case 'ArrowUp': case 'KeyW': Competition.keys.up = false; break;
                case 'ArrowDown': case 'KeyS': Competition.keys.down = false; break;
                case 'ArrowLeft': case 'KeyA': Competition.keys.left = false; break;
                case 'ArrowRight': case 'KeyD': Competition.keys.right = false; break;
                case 'Space': Competition.keys.space = false; break;
            }
        };

        window.addEventListener('keydown', Competition.handleKeyDown);
        window.addEventListener('keyup', Competition.handleKeyUp);
    },

    startGame: () => {
        document.getElementById('comp-overlay').style.display = 'none';
        document.getElementById('comp-hud').style.display = 'block';
        
        let wrapper = document.getElementById('comp-canvas-wrapper');
        Competition.canvas.width = wrapper.clientWidth || 600;
        Competition.canvas.height = wrapper.clientHeight || 450;

        Competition.active = true; 
        Competition.score = 0; 
        Competition.timer = 20; 
        Competition.frameCounter = 0;
        Competition.entities = []; 
        Competition.items = [];

        Competition.keys = { up: false, down: false, left: false, right: false, space: false };
        Competition.mouseHeld = false; 

        const needJoystick = ['push', 'catch', 'dodge', 'redgreen'];
        if (typeof Game !== 'undefined') {
            Game.toggleJoystick(!Competition.isPC && needJoystick.includes(Competition.type));
        }

        if (Competition.type === 'shoe') Competition.setupShoe();
        else if (Competition.type === 'push') Competition.setupPush();
        else if (Competition.type === 'run') Competition.setupRun();
        else if (Competition.type === 'catch') Competition.setupCatch();
        else if (Competition.type === 'dodge') Competition.setupDodge();
        else         if (Competition.type === 'redgreen') Competition.setupRedGreen();

        if(Competition.loopId) cancelAnimationFrame(Competition.loopId);
        Competition.loop();
        
        if (['catch', 'dodge'].includes(Competition.type)) {
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
        const ctx = Competition.ctx; 
        const w = Competition.canvas.width; 
        const h = Competition.canvas.height;
        
        if(w === 0 || h === 0) { return; }

        ctx.clearRect(0, 0, w, h);
        Competition.frameCounter++;

        if (Competition.isPC) {
            let vx = 0, vy = 0;
            if (Competition.keys.left) vx -= 1;
            if (Competition.keys.right) vx += 1;
            if (Competition.keys.up) vy -= 1;
            if (Competition.keys.down) vy += 1;

            if (vx !== 0 || vy !== 0) {
                let mag = Math.hypot(vx, vy);
                Competition.joystick.vecX = vx / mag;
                Competition.joystick.vecY = vy / mag;
                Competition.joystick.active = true;
            } else {
                Competition.joystick.vecX = 0;
                Competition.joystick.vecY = 0;
                Competition.joystick.active = false;
            }
        } else {
            if (typeof Joystick !== 'undefined' && Joystick.active) {
                Competition.joystick.active = true;
                Competition.joystick.vecX = Joystick.valX;
                Competition.joystick.vecY = Joystick.valY;
            } else {
                Competition.joystick.active = false;
                Competition.joystick.vecX = 0; 
                Competition.joystick.vecY = 0;
            }
        }

        try {
            if (Competition.type === 'shoe') Competition.loopShoe(ctx, w, h);
            else if (Competition.type === 'push') Competition.loopPush(ctx, w, h);
            else if (Competition.type === 'run') Competition.loopRun(ctx, w, h);
            else if (Competition.type === 'catch') Competition.loopCatch(ctx, w, h);
            else if (Competition.type === 'dodge') Competition.loopDodge(ctx, w, h);
            else if (Competition.type === 'redgreen') Competition.loopRedGreen(ctx, w, h);
        } catch (e) {
            console.error("Game Loop Error:", e);
            console.error(e.stack); 
            Competition.finishMatch();
            return;
        }

        Competition.loopId = requestAnimationFrame(Competition.loop);
    },

    finishMatch: () => {        
        if (!Competition.active) return; 
        Competition.active = false;
        Competition.mouseHeld = false;

        if(Competition.loopId) { cancelAnimationFrame(Competition.loopId); Competition.loopId = null; }
        if(Competition.timerInterval) { clearInterval(Competition.timerInterval); Competition.timerInterval = null; }
        
        window.removeEventListener('keydown', Competition.handleKeyDown);
        window.removeEventListener('keyup', Competition.handleKeyUp);

        if (typeof Game !== 'undefined') Game.toggleJoystick(false);

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
                    else if (Competition.type === 'catch') resultText = `${ent.performance} 🐔”`;
                    else if (Competition.type === 'dodge') resultText = `${ent.performance} ⭐`;
                    else if (Competition.type === 'push') resultText = (ent.rank === 1) ? ((typeof t === 'function') ? t("survivor") : "SURVIVOR") : `#${ent.rank}`;
                    else if (Competition.type === 'run') resultText = `${(ent.performance/60).toFixed(2)}s`;
                    else if (Competition.type === 'redgreen') resultText = (ent.rank === -1) ? ((typeof t === 'function') ? t("elim_short") : "ELIM") : `${(ent.performance/60).toFixed(2)}s`;
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
            
            const getSafeLeader = (t) => t.leader || {name: 'Bot', skin: '#ccc', hair: '#000'};

            overlay.innerHTML = `
                <h3 style="color:#a29bfe; margin-bottom: 10px; text-transform: uppercase; text-shadow: 1px 1px 0 #000; font-size: 18px;">${(typeof t === 'function') ? t("round_result", { n: App.currentRound }) : `ROUND ${App.currentRound} RESULT`}</h3>
                <div class="res-layout" style="display:flex; flex-direction:row; gap:10px; width:90%; max-width:600px; height: 280px;">
                    <div class="res-table" style="background:#fff; border-radius:8px; padding:10px; border:3px solid #2f3542; flex: 2.5; display:flex; flex-direction:column; overflow:hidden;">
                        <div style="display:flex; border-bottom:2px solid #2f3542; padding-bottom:5px; margin-bottom:5px; font-weight:900; font-size:10px; color:#2f3542; text-transform: uppercase;">
                            <div style="flex:2;">${(typeof t === 'function') ? t("team") : "TEAM"}</div>
                            <div style="flex:1; text-align:center;">${(typeof t === 'function') ? t("perf") : "PERF"}</div>
                            <div style="flex:1; text-align:right;">${(typeof t === 'function') ? t("pts") : "PTS"}</div>
                        </div>
                        <div style="flex-grow: 1; overflow-y: auto;">
                            ${roundResults.map((r, idx) => {
                                let l = getSafeLeader(r.team);
                                return `
                                <div style="display:flex; padding:6px 2px; border-bottom:1px dashed #ccc; font-size:10px; color:#2f3542; background:${r.isMe ? '#ffeaa7' : 'transparent'}; align-items:center;">
                                    <div style="flex:2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center;">
                                        <span style="color:#aaa; margin-right:5px; font-size: 9px;">#${idx+1}</span>
                                        <div style="width: 16px; height: 16px; background-color: ${l.skin}; border-radius: 3px; margin-right: 5px; border: 1px solid #2f3542; position: relative; overflow: hidden; flex-shrink: 0;">
                                            <div style="width: 100%; height: 30%; background-color: ${l.hair}; position: absolute; top: 0;"></div>
                                        </div>
                                        <span style="font-size: 10px; font-weight: normal; ${r.isMe ? 'color: #d63031;' : ''}">${l.name.split(' ')[0]}</span>
                                    </div>
                                    <div style="flex:1; text-align:center; color:#e17055; font-weight:bold; font-size:9px;">${r.raw}</div>
                                    <div style="flex:1; text-align:right; color:#00b894; font-weight:900;">+${r.score}</div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                    <div class="res-summary" style="flex: 1; display:flex; flex-direction:column; justify-content:center; align-items:center; background: rgba(47, 53, 66, 0.95); padding: 10px; border-radius: 8px; border: 3px solid #fff; color: #fff;">
                        <div style="margin-bottom: 15px; text-align:center;">
                            <div style="font-size:10px; opacity:0.8; text-transform: uppercase; margin-bottom: 5px;">${(typeof t === 'function') ? t("earned") : "EARNED"}</div>
                            <div style="font-size:28px; font-weight:900; color:#ffeaa7; text-shadow: 2px 2px 0 #e67e22; line-height: normal; margin: 10px 0;">+${myScore}</div>
                            <div style="font-size:10px; font-weight:bold;">${(typeof t === 'function') ? t("pts") : "PTS"}</div>
                        </div>
                        <button id="btn-next-round" style="background:#ff7675; color:#fff; border:2px solid #fff; padding:10px 0; font-family:inherit; cursor:pointer; border-radius:20px; font-weight:900; font-size: 12px; text-transform: uppercase; width: 100%; box-shadow: 0 4px 0 #d63031; transition: all 0.1s;">
                            ${App.currentRound < App.maxRounds ? ((typeof t === 'function') ? t("next") : "NEXT >>") : ((typeof t === 'function') ? t("finish") : "FINISH")}
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
                let l = t.leader || {name:'Bot', skin:'#ccc', hair:'#000'}; 
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
                <h1 style="color:#ffeaa7; text-shadow: 3px 3px 0 #d35400; font-size: 32px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px;">${(typeof t === 'function') ? t("final_standings") : "FINAL STANDINGS"}</h1>
                <div class="res-layout" style="display:flex; flex-direction:row; gap:20px; width:95%; max-width:900px; height: 380px;">
                    <div class="res-table" style="background:#fff; border-radius:12px; padding:15px; border:4px solid #2f3542; flex: 2.5; display:flex; flex-direction:column; overflow:hidden; box-shadow: 5px 5px 0 rgba(0,0,0,0.2);">
                        <div style="display:flex; border-bottom:3px solid #2f3542; padding-bottom:10px; margin-bottom:5px; font-weight:900; font-size:12px; color:#2f3542; text-transform: uppercase;">
                            <div style="width: 40px; text-align:center;">#</div>
                            <div style="flex:2;">${(typeof t === 'function') ? t("team") : "TEAM"}</div>
                            <div style="flex:1; text-align:center;">${(typeof Lang !== 'undefined' && Lang.current === 'vi') ? "V1" : "G1"}</div>
                            <div style="flex:1; text-align:center;">${(typeof Lang !== 'undefined' && Lang.current === 'vi') ? "V2" : "G2"}</div>
                            <div style="flex:1; text-align:center;">${(typeof Lang !== 'undefined' && Lang.current === 'vi') ? "V3" : "G3"}</div>
                            <div style="flex:1; text-align:right; padding-right:5px;">${(typeof Lang !== 'undefined' && Lang.current === 'vi') ? "TỔNG" : "TOTAL"}</div>
                        </div>
                        <div style="flex-grow: 1; overflow-y: auto; padding-right:5px;">${tableRows}</div>
                    </div>
                    <div class="res-summary" style="flex: 1; display:flex; flex-direction:column; justify-content:center; align-items:center; background: rgba(47, 53, 66, 0.95); padding: 20px; border-radius: 12px; border: 4px solid #fff; color: #fff; box-shadow: 5px 5px 0 rgba(0,0,0,0.3);">
                        <div style="margin-bottom: 30px; text-align:center; width:100%;">
                            <div style="font-size:12px; opacity:0.8; text-transform: uppercase; margin-bottom: 10px; letter-spacing:1px; border-bottom:1px solid rgba(255,255,255,0.3); padding-bottom:5px;">${(typeof t === 'function') ? t("ranking_bonus") : "RANKING BONUS"}</div>
                            <div style="font-size:36px; font-weight:900; color:#ffeaa7; text-shadow: 3px 3px 0 #e67e22; line-height: normal; margin: 15px 0;">+${(App.lastEventBonus || 0).toLocaleString()}</div>
                            <div style="font-size:14px; font-weight:bold; color:#f1c40f;">${(typeof Lang !== 'undefined' && Lang.current === 'vi') ? "VOTE" : "VOTES"}</div>
                        </div>
                        <button id="btn-close-event" style="background:#00b894; color:#fff; border:3px solid #fff; padding:15px 0; font-family:inherit; cursor:pointer; border-radius:30px; font-weight:900; font-size: 16px; text-transform: uppercase; width: 100%; box-shadow: 0 6px 0 #008c72; transition: all 0.1s;">${(typeof t === 'function') ? t("complete_event") : "COMPLETE EVENT"}</button>
                    </div>
                </div>`;
                
            const btn = document.getElementById('btn-close-event');
            if(btn) btn.onclick = Competition.closeResult;
        }, 100);
    },

    closeResult: () => { 
        document.getElementById('comp-result-overlay').style.display = 'none'; 
        Competition.active = false;
        
        const c = document.getElementById('compCanvas');
        if (c) c.dataset.hasInput = "false";
        
        SongDraft.startDraft(SpecialEvent.teams);
    },

    setupEntitiesFromTeams: () => {
        Competition.entities = [];
        let teams = SpecialEvent.teams;
        if (!teams || teams.length === 0) {
            teams = [
                {leader: Player, members: [{id:'p'}]}, 
                {leader: {name:'Bot 1', skin:'#f00', hair:'#000'}, members: [{id:0}]}, 
                {leader: {name:'Bot 2', skin:'#0f0', hair:'#000'}, members: [{id:1}]}, 
                {leader: {name:'Bot 3', skin:'#00f', hair:'#000'}, members: [{id:2}]},
                {leader: {name:'Bot 4', skin:'#ff0', hair:'#000'}, members: [{id:3}]}
            ];
        }
        teams.forEach((t, i) => {
            let isPlayer = false;
            if (t.members) {
                isPlayer = t.members.some(m => m.id === 'p' || m.isPlayer);
            }
            Competition.entities.push({
                teamIdx: i, 
                id: isPlayer ? 'p' : i, 
                isPlayer: isPlayer, 
                char: t.leader || {skin:'#ccc', hair:'#000', name:'Unk'},
                x: 0, y: 0, vx: 0, vy: 0, performance: 0, rank: 0, finished: false, elim: false
            });
        });
    },

    // --- GAME LOGIC ---
    setupShoe: () => { Competition.setupEntitiesFromTeams(); Competition.shoeState = { barX:0, dir:1, speed:15, phase:'aiming', shoeX:50, shoeY:0, shoeVX:0, shoeVY:0, rot:0, distance:0 }; },
    loopShoe: (ctx, w, h) => { 
        let s = Competition.shoeState; ctx.fillStyle="#48dbfb"; ctx.fillRect(0,0,w,h); ctx.fillStyle="#2ecc71"; ctx.fillRect(0,h-60,w,60); 
        if(s.phase==='aiming') {
            Competition.drawPlayerHighlight(ctx, 50, h-90, 3); // [THÊM MỚI]
            drawFace(ctx,50,h-90,Player,3); ctx.fillStyle="#555";ctx.fillRect(50,h/2-20,w-100,40); ctx.fillStyle="#fff";ctx.fillRect(50+s.barX,h/2-30,10,60);
            s.barX+=s.speed*s.dir;if(s.barX>w-110||s.barX<0)s.dir*=-1;
        } else {
            s.shoeX+=s.shoeVX; s.shoeY+=s.shoeVY; s.shoeVY+=0.5; s.rot+=0.2; s.distance=Math.min(100,(s.shoeX/w)*100);
            ctx.save();ctx.translate(s.shoeX,s.shoeY);ctx.rotate(s.rot); ctx.fillStyle="#d63031";ctx.fillRect(-10,-5,20,10);ctx.restore();
            Competition.drawPlayerHighlight(ctx, 50, h-90, 3); // [THÊM MỚI]
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
            if(e.isPlayer) Competition.drawPlayerHighlight(ctx, e.x, e.y, 1.5); // [THÊM MỚI]
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
            e.vx*=0.92;e.vy*=0.92;e.x+=e.vx;e.y+=e.vy; 
            if(e.isPlayer) Competition.drawPlayerHighlight(ctx, e.x, e.y, 3.5); // [THÊM MỚI]
            drawFace(ctx,e.x,e.y,e.char,3.5);
            if(Math.hypot(e.x-cx,e.y-cy)>r){ e.elim=true; e.performance = Competition.eliminatedCount; Competition.eliminatedCount++; }
        });
        for(let i=0;i<Competition.entities.length;i++)for(let j=i+1;j<Competition.entities.length;j++){let a=Competition.entities[i],b=Competition.entities[j];if(a.elim||b.elim)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<60){let an=Math.atan2(dy,dx),f=3;let tx=Math.cos(an)*f,ty=Math.sin(an)*f;a.vx-=tx/a.mass;a.vy-=ty/a.mass;b.vx+=tx/b.mass;b.vy+=ty/b.mass;}}
        let p=Competition.entities.find(e=>e.isPlayer); 
        if(p.elim || alive===1){ if(alive===1) last.performance = Competition.entities.length; Competition.finishMatch(); }
    },

    setupCatch: () => { Competition.setupEntitiesFromTeams(); Competition.entities.forEach(e=>{e.x=Math.random()*400;e.y=Math.random()*300;e.performance=0;}); Competition.items=[]; for(let i=0;i<12;i++) Competition.items.push({x:Math.random()*400,y:Math.random()*300,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4}); },
    loopCatch: (ctx, w, h) => { 
        ctx.fillStyle="#55efc4";ctx.fillRect(0,0,w,h); ctx.font="24px Arial";ctx.textAlign="center";
        Competition.items.forEach(c=>{c.x+=c.vx;c.y+=c.vy;if(c.x<0||c.x>w)c.vx*=-1;if(c.y<0||c.y>h)c.vy*=-1;ctx.fillText("\u{1F414}",c.x,c.y);});
        Competition.entities.forEach(p=>{
            if(p.isPlayer){p.x+=Competition.joystick.vecX*5;p.y+=Competition.joystick.vecY*5;}
            else{let cl=null,md=9999;Competition.items.forEach(it=>{let d=Math.hypot(p.x-it.x,p.y-it.y);if(d<md){md=d;cl=it;}});if(cl){let dx=cl.x-p.x,dy=cl.y-p.y;if(md>0){p.x+=(dx/md)*3;p.y+=(dy/md)*3;}}}
            p.x=Math.max(20,Math.min(w-20,p.x));p.y=Math.max(20,Math.min(h-20,p.y)); 
            if(p.isPlayer) Competition.drawPlayerHighlight(ctx, p.x, p.y, 3); // [THÊM MỚI]
            drawFace(ctx,p.x,p.y,p.char,3); ctx.fillStyle="#000";ctx.font="12px Arial";ctx.fillText(p.performance,p.x,p.y-40);
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
            p.x=Math.max(30,Math.min(w-30,p.x)); 
            if(p.isPlayer) Competition.drawPlayerHighlight(ctx, p.x, p.y, 3); 
            drawFace(ctx,p.x,p.y,p.char,3); ctx.fillStyle="#000";ctx.font="12px Arial";ctx.fillText(p.performance,p.x,p.y-40);
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
            if(e.isPlayer){
                const runInput = Math.abs(Competition.joystick.vecY)>0.1 || (Competition.mouseHeld===true);
                if(runInput){e.y-=3;mv=true;}
            }
            else{if(s.isGreen){e.y-=(2+Math.random());mv=true;}else if(Math.random()<0.02){e.y-=1;mv=true;}}
            
            if(e.isPlayer) Competition.drawPlayerHighlight(ctx, e.x, e.y, 2.5); // [THÊM MỚI]
            drawFace(ctx,e.x,e.y,e.char,2.5);
            
            if(!s.isGreen && mv){e.elim=true; ctx.fillText("\u274C",e.x,e.y);}
            if(e.y<50){e.finished=true; e.performance = Competition.frameCounter;}
        });
        if(allDone) Competition.finishMatch();
    }
};

Competition.keys = {};
window.onkeydown = (e) => Competition.keys[e.key] = true;
window.onkeyup = (e) => Competition.keys[e.key] = false;




