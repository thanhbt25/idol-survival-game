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
    
    startDraft: () => {
        showScreen('draft-screen');
        const canvas = document.getElementById('draftCanvas');
        const container = document.getElementById('draft-visual');
        const ctx = canvas.getContext('2d');
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width; canvas.height = rect.height;

        // Nhận diện Mobile (Sử dụng cả width và touch để chính xác hơn)
        const isMobile = (canvas.width < 1024) || (navigator.maxTouchPoints > 0);
        let viewDetailTeamIndex = -1;

        // --- SỰ KIỆN CLICK ---
        canvas.onclick = (e) => {
            if (!isMobile) return; 
            const cRect = canvas.getBoundingClientRect();
            // Tính toán tọa độ chuẩn dựa trên tỷ lệ canvas thực tế
            const scaleX = canvas.width / cRect.width;
            const scaleY = canvas.height / cRect.height;
            const clickX = (e.clientX - cRect.left) * scaleX;
            const clickY = (e.clientY - cRect.top) * scaleY;

            SpecialEvent.teams.forEach((t, index) => {
                // Kiểm tra va chạm với tọa độ y của leader (t.y) thay vì số 90 cứng nhắc
                if (Math.hypot(clickX - t.x, clickY - t.y) < 50) {
                    viewDetailTeamIndex = (viewDetailTeamIndex === index) ? -1 : index;
                }
            });
        };

        let survivors = [...NPCs, {...Player, id:'p'}].filter(n => !n.eliminated).sort((a,b) => b.totalVote - a.totalVote);
        let numTeams = (App.day === 7) ? 6 : 4;
        let leaders = survivors.slice(0, numTeams);
        let pool = survivors.slice(numTeams);

        // --- TÍNH TOÁN VỊ TRÍ (ÉP 1 HÀNG TRÊN MOBILE) ---
        SpecialEvent.teams = leaders.map((l, index) => {
            let tx = 0, ty = 90;
            if (isMobile) {
                // Ép tất cả vào 1 hàng duy nhất, chia đều theo chiều ngang
                tx = (canvas.width / numTeams) * index + (canvas.width / numTeams / 2);
                ty = 100; // Độ cao cố định cho hàng leader
            } else {
                // PC giữ nguyên logic cũ
                tx = (canvas.width / numTeams) * index + (canvas.width / numTeams / 2);
                ty = 90;
            }
            return { leader: l, members: [l], x: tx, y: ty, eventScore: 0, history: [0, 0, 0] };
        });

        let pickingTeam = 0; let animId;

        const drawDraft = () => {
            // --- VẼ NỀN ---
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

            // --- VẼ CÁC ĐỘI ---
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

                drawFace(ctx, t.x, currentY, t.leader, 4.5); 
                ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#000";
                ctx.fillStyle = "#FFD700"; ctx.font = "bold 10px 'Press Start 2P'"; 
                ctx.strokeText(`TEAM ${i+1}`, t.x, currentY - 35); ctx.fillText(`TEAM ${i+1}`, t.x, currentY - 35);
                
                let lName = `★ ${t.leader.name.split(' ')[0]}`;
                ctx.fillStyle = isLeaderPlayer ? "#ff4757" : (amIInThisTeam ? "#00ffea" : "#fff");
                ctx.font = "8px 'Press Start 2P'";
                ctx.strokeText(lName, t.x, currentY + 30); ctx.fillText(lName, t.x, currentY + 30);

                // --- LOGIC HIỂN THỊ THÀNH VIÊN ---
                if (!isMobile) {
                    // PC: Vẽ đầy đủ mặt và tên như cũ
                    t.members.forEach((m, mi) => {
                        if (mi > 0) { 
                            let faceY = currentY + 35 + (mi * 60); 
                            let isPlayer = (m.id === 'p');
                            drawFace(ctx, t.x, faceY, m, 3.2);
                            ctx.textAlign = "left";
                            ctx.font = isPlayer ? "bold 9px 'Press Start 2P'" : "8px 'Press Start 2P'";
                            ctx.fillStyle = isPlayer ? "#ff6b81" : "#ecf0f1"; 
                            let nameTxt = m.name.split(' ')[0]; if (isPlayer) nameTxt += " (ME)";
                            ctx.strokeText(nameTxt, t.x + 30, faceY + 10); ctx.fillText(nameTxt, t.x + 30, faceY + 10);
                        }
                    });
                } else if (viewDetailTeamIndex === i) {
                    // MOBILE: Chỉ vẽ danh sách tên khi click vào leader
                    ctx.save();
                    ctx.fillStyle = "rgba(0,0,0,0.85)";
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = 2;
                    // Vẽ khung popup nhỏ
                    const popupW = 120;
                    const popupH = t.members.length * 20 + 10;
                    ctx.fillRect(t.x - popupW/2, currentY + 45, popupW, popupH);
                    ctx.strokeRect(t.x - popupW/2, currentY + 45, popupW, popupH);
                    
                    ctx.textAlign = "center";
                    ctx.font = "8px 'Press Start 2P'";
                    t.members.forEach((m, mi) => {
                        let isPlayer = (m.id === 'p');
                        ctx.fillStyle = isPlayer ? "#ff6b81" : "#fff";
                        let nameTxt = m.name.split(' ')[0];
                        ctx.fillText(nameTxt, t.x, currentY + 65 + (mi * 20));
                    });
                    ctx.restore();
                }
            });

            // --- VẼ POOL (Hàng chờ) ---
            let poolHeight = 140; let poolY = canvas.height - poolHeight;
            if (pool.length > 0) {
                ctx.fillStyle = "#5d4037"; ctx.fillRect(0, poolY, canvas.width, poolHeight);
                ctx.fillStyle = "#ff6b81"; ctx.fillRect(0, poolY, canvas.width, 6);
                ctx.fillStyle = "#fff"; ctx.font = "10px 'Press Start 2P'"; ctx.textAlign = "center";
                ctx.fillText(isMobile ? "" : "WAITING TRAINEES...", canvas.width/2, poolY - 15);

                pool.forEach((p, i) => {
                    if (!p.picked) {
                        let itemsPerRow = isMobile ? 8 : 12; 
                        let spacingX = canvas.width / itemsPerRow;
                        let px = (spacingX / 2) + (i % itemsPerRow) * spacingX; 
                        let py = poolY + 40 + Math.floor(i / itemsPerRow) * (isMobile ? 40 : 50);
                        drawFace(ctx, px, py, p, 2.5); 
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

/* --- COMPETITION MINIGAMES ENGINE --- */
var Competition = {
    canvas: null, ctx: null, active: false, type: null,
    entities: [], items: [], grass: [],
    timer: 30, score: 0, loopId: null, lastGameType: null,
    
    // Joystick cho Mobile
    joystick: { active: false, originX: 0, originY: 0, currX: 0, currY: 0, vecX: 0, vecY: 0 },

    // ... (Giữ nguyên startRound) ...
    startRound: () => {
        const games = ['shoe', 'push', 'run', 'catch', 'dodge', 'pose'];
        let availableGames = games.filter(g => g !== Competition.lastGameType);
        let randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
        Competition.lastGameType = randomGame;
        Competition.init(randomGame);
    },

    init: (type) => {
        showScreen('comp-screen');
        
        // --- TẠO WRAPPER ĐỂ CĂN GIỮA NẾU CHƯA CÓ ---
        let canvas = document.getElementById('compCanvas');
        if (canvas.parentElement.id !== 'comp-canvas-wrapper') {
            const wrapper = document.createElement('div');
            wrapper.id = 'comp-canvas-wrapper';
            // Copy style cơ bản để PC vẫn hiển thị đúng
            wrapper.style.cssText = "position: relative; width: 90%; height: 450px; background: #000; border: 4px solid #fff; margin: 0 auto;";
            canvas.parentElement.replaceChild(wrapper, canvas);
            wrapper.appendChild(canvas);
            
            // Di chuyển các overlay vào trong wrapper để nó căn theo canvas
            wrapper.appendChild(document.getElementById('comp-overlay'));
            wrapper.appendChild(document.getElementById('comp-hud'));
            wrapper.appendChild(document.getElementById('round-result-overlay'));
        }

        Competition.canvas = document.getElementById('compCanvas');
        Competition.ctx = Competition.canvas.getContext('2d');
        
        // Resize Canvas theo Wrapper (Fix lỗi lệch tọa độ)
        const wrapper = document.getElementById('comp-canvas-wrapper');
        Competition.canvas.width = wrapper.clientWidth;
        Competition.canvas.height = wrapper.clientHeight;

        Competition.type = type; Competition.active = false;
        
        // Reset UI
        document.getElementById('round-result-overlay').style.display = 'none';
        document.getElementById('comp-result-overlay').style.display = 'none';
        document.getElementById('comp-hud').style.display = 'none';
        
        // Overlay Hướng dẫn
        const overlay = document.getElementById('comp-overlay'); 
        overlay.style.display = 'flex';
        const title = document.getElementById('comp-name'); 
        const desc = document.getElementById('comp-desc');
        
        const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        title.innerHTML = `<span style="font-size:12px; color:#aaa; display:block; margin-bottom:5px;">ROUND ${App.currentRound}/${App.maxRounds}</span>`;
        
        let instructions = "";
        if (type === 'shoe') instructions = isMobile ? "TAP screen when GREEN!" : "Press [SPACE] when GREEN!";
        else if (type === 'push') instructions = isMobile ? "Use Joystick to PUSH!" : "Arrow Keys to PUSH!";
        else if (type === 'run') instructions = isMobile ? "TAP fast to RUN!" : "Mash [SPACE] to RUN!";
        else if (type === 'catch') instructions = "Catch YELLOW CHICKENS!";
        else if (type === 'dodge') instructions = "Avoid BOMBS! Get STARS!";
        else if (type === 'pose') instructions = isMobile ? "Touch & Hold when FLASH!" : "Hold [SPACE] when FLASH!";

        title.innerHTML += type.toUpperCase().replace('_', ' ');
        desc.innerHTML = instructions;
        
        Competition.setupInput();
    },

    // ... (Giữ nguyên setupInput, startGame, loop, và các logic game loopPush, loopCatch...) ...
    // Bạn copy lại hàm setupInput và các logic game từ câu trả lời trước nhé, phần đó đã ok rồi.
    setupInput: () => {
        const c = Competition.canvas;
        const getPos = (e) => {
            const rect = c.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: (clientX - rect.left) * (c.width / rect.width), y: (clientY - rect.top) * (c.height / rect.height) };
        };
        const startAction = (e) => {
            if (!Competition.active) return;
            const pos = getPos(e);
            if (Competition.type === 'shoe' && Competition.shoeState.phase === 'aiming') { Competition.shoeState.phase = 'flying'; Competition.calcShoeTrajectory(); }
            if (Competition.type === 'run') Competition.entities[0].x += 15;
            if (Competition.type === 'pose') Competition.poseState.isPosing = true;
            if (['push', 'catch', 'dodge'].includes(Competition.type)) {
                Competition.joystick.active = true; Competition.joystick.originX = pos.x; Competition.joystick.originY = pos.y;
                Competition.joystick.currX = pos.x; Competition.joystick.currY = pos.y; Competition.joystick.vecX = 0; Competition.joystick.vecY = 0;
            }
        };
        const moveAction = (e) => {
            if (!Competition.active || !Competition.joystick.active) return;
            const pos = getPos(e);
            Competition.joystick.currX = pos.x; Competition.joystick.currY = pos.y;
            const dx = pos.x - Competition.joystick.originX; const dy = pos.y - Competition.joystick.originY;
            const dist = Math.hypot(dx, dy); const maxDist = 40;
            if (dist > 0) { const force = Math.min(dist, maxDist) / maxDist; Competition.joystick.vecX = (dx / dist) * force; Competition.joystick.vecY = (dy / dist) * force; }
        };
        const endAction = () => { Competition.joystick.active = false; Competition.joystick.vecX = 0; Competition.joystick.vecY = 0; if (Competition.type === 'pose') Competition.poseState.isPosing = false; };
        c.onmousedown = startAction; window.onmousemove = moveAction; window.onmouseup = endAction;
        c.ontouchstart = startAction; c.ontouchmove = moveAction; c.ontouchend = endAction;
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
        if (Competition.joystick.active) {
            const j = Competition.joystick;
            ctx.save(); ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.arc(j.originX, j.originY, 40, 0, Math.PI*2); ctx.fillStyle = "#ccc"; ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(j.originX + j.vecX * 40, j.originY + j.vecY * 40, 20, 0, Math.PI*2); ctx.fillStyle = "#ff7675"; ctx.fill();
            ctx.restore();
        }
        Competition.loopId = requestAnimationFrame(Competition.loop);
    },
    
    // --- SETUP LOGIC GAME (Giữ nguyên code cũ của bạn cho các hàm setup/loop game) ---
    // --- SETUP LOGIC GAME ---

    // 1. SHOE TOSS (Ném giày)
    setupShoe: () => {
        Competition.shoeState = {
            barX: 0,
            dir: 1,
            speed: 15,
            phase: 'aiming',
            shoeX: 50,
            shoeY: 0,
            shoeVX: 0,
            shoeVY: 0,
            rot: 0,
            distance: 0
        };
    },

    loopShoe: (ctx, w, h) => {
        let s = Competition.shoeState;

        // Vẽ nền trời và đất
        ctx.fillStyle = "#48dbfb";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#2ecc71";
        ctx.fillRect(0, h - 60, w, 60);

        if (s.phase === 'aiming') {
            // Giai đoạn ngắm
            drawFace(ctx, 50, h - 90, Player, 3);
            
            // Vẽ thanh lực
            ctx.fillStyle = "#555";
            ctx.fillRect(50, h / 2 - 20, w - 100, 40);
            ctx.fillStyle = "#fff";
            ctx.fillRect(50 + s.barX, h / 2 - 30, 10, 60);

            // Di chuyển thanh lực
            s.barX += s.speed * s.dir;
            if (s.barX > w - 110 || s.barX < 0) s.dir *= -1;

        } else {
            // Giai đoạn giày bay
            s.shoeX += s.shoeVX;
            s.shoeY += s.shoeVY;
            s.shoeVY += 0.5; // Trọng lực
            s.rot += 0.2;
            s.distance = Math.min(100, (s.shoeX / w) * 100);

            // Vẽ chiếc giày xoay
            ctx.save();
            ctx.translate(s.shoeX, s.shoeY);
            ctx.rotate(s.rot);
            ctx.fillStyle = "#d63031";
            ctx.fillRect(-10, -5, 20, 10);
            ctx.restore();

            drawFace(ctx, 50, h - 90, Player, 3);

            // Hiển thị khoảng cách
            ctx.fillStyle = "#2f3542";
            ctx.font = "30px Arial";
            ctx.fillText(Math.floor(s.distance) + "m", w / 2, h / 2);

            // Kiểm tra chạm đất
            if (s.shoeY > h - 60) Competition.finish(s.distance);
        }
    },

    calcShoeTrajectory: () => {
        let w = Competition.canvas.width;
        // Tính lực dựa trên vị trí thanh bar (càng gần đích càng mạnh)
        let power = 1.0 - Math.abs((w - 50) - (Competition.shoeState.barX + 50)) / w;
        
        Competition.shoeState.shoeX = 50;
        Competition.shoeState.shoeY = Competition.canvas.height - 90;
        Competition.shoeState.shoeVX = 15 * power;
        Competition.shoeState.shoeVY = -12;
    },

    // 2. RUN (Chạy đua)
    setupRun: () => {
        Competition.entities = [
            { id: 'p', x: 20, y: 100, isPlayer: true },
            { id: 0, x: 20, y: 150, isPlayer: false },
            { id: 1, x: 20, y: 200, isPlayer: false }
        ];
    },

    loopRun: (ctx, w, h) => {
        ctx.fillStyle = "#e17055";
        ctx.fillRect(0, 0, w, h);

        // Vẽ vạch đích
        let fX = w - 50;
        ctx.fillStyle = "#fff";
        ctx.fillRect(fX, 0, 20, h);

        Competition.entities.forEach(e => {
            if (!e.isPlayer) e.x += 3 + Math.random(); // NPC tự chạy

            drawFace(ctx, e.x, e.y, e.isPlayer ? Player : NPCs[e.id], 1.5);

            if (e.isPlayer) {
                Competition.score = Math.min(100, Math.floor((e.x / fX) * 100));
                document.getElementById('c-score').innerText = Competition.score + "/100";
            }

            if (e.x > fX && e.isPlayer) Competition.finish(100);
        });
    },

    // 3. PUSH (Đẩy Sumo)
    setupPush: () => {
        let cx = Competition.canvas.width / 2;
        let cy = Competition.canvas.height / 2;
        Competition.entities = [];
        
        SpecialEvent.teams.forEach((t, i) => {
            let ang = i * (Math.PI * 2 / SpecialEvent.teams.length);
            Competition.entities.push({
                id: i,
                char: t.leader,
                x: cx + Math.cos(ang) * 120,
                y: cy + Math.sin(ang) * 120,
                r: 25,
                vx: 0,
                vy: 0,
                isPlayer: t.members.some(m => m.id === 'p'),
                mass: 1.2
            });
        });
    },

    loopPush: (ctx, w, h) => {
        // Vẽ sàn đấu
        ctx.fillStyle = "#d3a675";
        ctx.fillRect(0, 0, w, h);
        let cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.4;
        
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = "#f5e6ca"; ctx.fill();
        ctx.lineWidth = 8; ctx.strokeStyle = "#e74c3c"; ctx.stroke();

        // Xử lý từng nhân vật
        Competition.entities.forEach(e => {
            if (e.elim) return;

            if (e.isPlayer) {
                // Di chuyển bằng Joystick
                e.vx += Competition.joystick.vecX * 0.8;
                e.vy += Competition.joystick.vecY * 0.8;
            } else {
                // AI đuổi theo người chơi
                let t = Competition.entities.find(o => o.isPlayer && !o.elim);
                if (t) {
                    let dx = t.x - e.x, dy = t.y - e.y, d = Math.hypot(dx, dy);
                    if (d > 0) {
                        e.vx += (dx / d) * 0.3;
                        e.vy += (dy / d) * 0.3;
                    }
                }
            }

            // Ma sát và cập nhật vị trí
            e.vx *= 0.92; e.vy *= 0.92;
            e.x += e.vx; e.y += e.vy;

            drawFace(ctx, e.x, e.y, e.char, 3.5);

            // Kiểm tra rơi khỏi sàn
            if (Math.hypot(e.x - cx, e.y - cy) > r) {
                e.elim = true;
                if (e.isPlayer) Competition.finish(10);
            }
        });

        // Xử lý va chạm giữa các nhân vật
        for (let i = 0; i < Competition.entities.length; i++) {
            for (let j = i + 1; j < Competition.entities.length; j++) {
                let a = Competition.entities[i];
                let b = Competition.entities[j];
                
                if (a.elim || b.elim) continue;

                let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
                if (d < 60) {
                    let an = Math.atan2(dy, dx), f = 3;
                    let tx = Math.cos(an) * f, ty = Math.sin(an) * f;
                    
                    a.vx -= tx / a.mass; a.vy -= ty / a.mass;
                    b.vx += tx / b.mass; b.vy += ty / b.mass;
                }
            }
        }

        // Kiểm tra chiến thắng (chỉ còn mình người chơi hoặc NPC)
        if (Competition.entities.filter(e => !e.elim && !e.isPlayer).length === 0) {
            Competition.finish(100);
        }
    },

    // 4. CATCH (Bắt gà)
    setupCatch: () => {
        Competition.entities = [];
        // Tạo gà
        for (let i = 0; i < 10; i++) {
            Competition.entities.push({
                x: Math.random() * 400,
                y: Math.random() * 300,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * 4 - 2
            });
        }
        // Tạo người chơi và NPC
        Competition.players = [
            { x: 200, y: 200, isPlayer: true },
            { x: 220, y: 220, isPlayer: false },
            { x: 200, y: 220, isPlayer: false }
        ];
    },

    loopCatch: (ctx, w, h) => {
        ctx.fillStyle = "#55efc4";
        ctx.fillRect(0, 0, w, h);

        // Vẽ và di chuyển gà
        Competition.entities.forEach(c => {
            c.x += c.vx; c.y += c.vy;
            if (c.x < 0 || c.x > w) c.vx *= -1;
            if (c.y < 0 || c.y > h) c.vy *= -1;
            
            ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(c.x, c.y, 15, 0, Math.PI * 2); ctx.fill();
        });

        // Xử lý người chơi và NPC
        Competition.players.forEach((p, idx) => {
            if (p.isPlayer) {
                p.x += Competition.joystick.vecX * 5;
                p.y += Competition.joystick.vecY * 5;
            } else {
                // AI NPC
                if (!p.t || Math.random() < 0.05) {
                    p.t = Competition.entities[Math.floor(Math.random() * Competition.entities.length)];
                }
                if (p.t) {
                    let dx = p.t.x - p.x, dy = p.t.y - p.y, d = Math.hypot(dx, dy);
                    if (d > 0) {
                        p.x += (dx / d) * 3;
                        p.y += (dy / d) * 3;
                    }
                }
            }

            // Giới hạn biên
            p.x = Math.max(20, Math.min(w - 20, p.x));
            p.y = Math.max(20, Math.min(h - 20, p.y));

            drawFace(ctx, p.x, p.y, idx === 0 ? Player : NPCs[idx], 3);

            // Kiểm tra bắt gà
            for (let i = Competition.entities.length - 1; i >= 0; i--) {
                if (Math.hypot(p.x - Competition.entities[i].x, p.y - Competition.entities[i].y) < 50) {
                    Competition.entities.splice(i, 1);
                    if (p.isPlayer) {
                        Competition.score = Math.min(100, Competition.score + 10);
                        document.getElementById('c-score').innerText = Competition.score;
                    }
                    // Spawn gà mới
                    Competition.entities.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        vx: Math.random() * 4 - 2,
                        vy: Math.random() * 4 - 2
                    });
                }
            }
        });
    },

    // 5. DODGE (Né bom)
    setupDodge: () => {
        Competition.entities = [{
            x: Competition.canvas.width / 2,
            y: Competition.canvas.height - 70,
            isPlayer: true
        }];
        Competition.items = [];
    },

    loopDodge: (ctx, w, h) => {
        ctx.fillStyle = "#4fc3f7";
        ctx.fillRect(0, 0, w, h);

        let p = Competition.entities[0];
        p.x += Competition.joystick.vecX * 8;
        p.x = Math.max(30, Math.min(w - 30, p.x));

        drawFace(ctx, p.x, p.y, Player, 3.5);

        // Sinh vật phẩm
        if (Math.random() < 0.08) {
            Competition.items.push({
                x: Math.random() * (w - 40) + 20,
                y: -40,
                type: Math.random() < 0.3 ? 'star' : 'bomb',
                speed: 5 + Math.random() * 4
            });
        }

        // Di chuyển và kiểm tra va chạm vật phẩm
        for (let i = Competition.items.length - 1; i >= 0; i--) {
            let it = Competition.items[i];
            it.y += it.speed;

            ctx.fillStyle = it.type === 'star' ? "#f1c40f" : "#000";
            ctx.fillText(it.type === 'star' ? "★" : "💣", it.x - 10, it.y);

            if (Math.hypot(p.x - it.x, p.y - it.y) < 50) {
                if (it.type === 'star') Competition.score = Math.min(100, Competition.score + 10);
                else Competition.score = Math.max(0, Competition.score - 10);
                
                document.getElementById('c-score').innerText = Competition.score;
                Competition.items.splice(i, 1);
            } else if (it.y > h + 50) {
                Competition.items.splice(i, 1);
            }
        }
    },

    // 6. POSE (Tạo dáng)
    setupPose: () => {
        Competition.entities = [{
            x: Competition.canvas.width / 2,
            y: Competition.canvas.height / 2,
            isPlayer: true
        }];
        Competition.poseState = { flashing: false, flashTimer: 0, nextFlash: 100 };
    },

    loopPose: (ctx, w, h) => {
        let ps = Competition.poseState;
        ps.flashTimer++;

        // Logic Flash màn hình
        if (ps.flashTimer > ps.nextFlash) {
            ps.flashing = true;
            if (ps.flashTimer > ps.nextFlash + 60) {
                ps.flashing = false;
                ps.flashTimer = 0;
                ps.nextFlash = 100 + Math.random() * 100;
                Competition.score += 20;
                document.getElementById('c-score').innerText = Competition.score;
            }
        }

        ctx.fillStyle = ps.flashing ? "#fff" : "#6c5ce7";
        ctx.fillRect(0, 0, w, h);

        if (ps.flashing) {
            ctx.fillStyle = "red";
            ctx.font = "30px Arial";
            ctx.fillText("POSE!", w / 2 - 40, h / 2 - 50);
        }

        let p = Competition.entities[0];

        // Di chuyển khi không Flash
        if (!ps.isPosing && !ps.flashing) {
            p.x += Competition.joystick.vecX * 4;
            p.y += Competition.joystick.vecY * 4;
        }

        // Trừ điểm nếu không tạo dáng khi Flash
        if (ps.flashing && !ps.isPosing) {
            Competition.score -= 1;
        }

        drawFace(ctx, p.x, p.y, Player, ps.isPosing ? 2.5 : 2);

        // Hiệu ứng khi đang tạo dáng
        if (ps.isPosing) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 3;
            ctx.strokeRect(p.x - 15, p.y - 15, 30, 30);
        }
    },
    // --- CÁC HÀM HIỂN THỊ KẾT QUẢ ĐÃ ĐƯỢC CHỈNH SỬA CLASS ---
    
    finish: (customScore = null) => {
        Competition.active = false; 
        cancelAnimationFrame(Competition.loopId);
        let finalScore = Math.min(100, Math.max(0, Math.floor(customScore !== null ? customScore : Competition.score)));
        let myTeamIndex = SpecialEvent.teams.findIndex(t => t.members.some(m => m.id === 'p'));
        let roundResults = [];
        SpecialEvent.teams.forEach((t, i) => {
            let s = (i === myTeamIndex) ? finalScore : Math.floor(50 + Math.random() * 50);
            t.history[App.currentRound - 1] = s; t.eventScore += s;
            roundResults.push({ team: t, score: s, isMe: (i === myTeamIndex) });
        });
        roundResults.sort((a, b) => b.score - a.score);

        const overlay = document.getElementById('round-result-overlay'); 
        overlay.style.display = 'flex';
        
        // SỬ DỤNG CLASS "res-layout", "res-left", "res-right" ĐỂ CSS MOBILE TÁC ĐỘNG
        overlay.innerHTML = `
            <h2 style="color:#a29bfe; margin-bottom: 10px;">ROUND ${App.currentRound}</h2>
            <div class="res-layout">
                <div class="res-left">
                    <table style="width:100%; border-collapse:collapse; font-size: 10px; color:#2f3542;">
                        ${roundResults.map(r => `
                            <tr style="border-bottom:1px dashed #eee; background:${r.isMe ? '#ffeaa7' : 'transparent'}; font-weight:${r.isMe ? 'bold' : 'normal'}">
                                <td style="padding:5px;">TEAM ${r.team.leader.name.split(' ')[0]}</td>
                                <td style="padding:5px; text-align:right;">${r.score}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
                <div class="res-right">
                    <div style="font-size:10px; color:#aaa;">MY SCORE</div>
                    <div style="font-size:24px; color:#00b894; font-weight:bold; margin-bottom:10px;">${finalScore}</div>
                    <button class="res-btn" id="btn-next-round" style="background:#ff7675; color:#fff; border:none; cursor:pointer;">
                        ${App.currentRound < App.maxRounds ? "NEXT >>" : "FINISH"}
                    </button>
                </div>
            </div>
        `;
        const btn = document.getElementById('btn-next-round');
        if (App.currentRound < App.maxRounds) btn.onclick = Competition.nextRound;
        else btn.onclick = Competition.finalizeEvent;
    },

    nextRound: () => { App.currentRound++; Competition.startRound(); },

    finalizeEvent: () => {
        document.getElementById('round-result-overlay').style.display = 'none';
        SpecialEvent.teams.sort((a, b) => b.eventScore - a.eventScore);
        const rewards = [20000, 15000, 10000, 5000, 2000, 1000];
        const overlay = document.getElementById('comp-result-overlay');
        overlay.style.display = 'flex';

        let tableRows = SpecialEvent.teams.map((t, i) => {
            let bonus = rewards[i] || 0;
            if (t.members.some(m => m.id === 'p')) { App.lastEventBonus = bonus; 
            App.compScore = t.eventScore; App.accumulatedScore = t.eventScore; }
            t.members.forEach(m => { if (m.id !== 'p') m.totalVote = (m.totalVote || 0) + bonus; });
            let isMyTeam = t.members.some(m => m.id === 'p');
            let rankIcon = (i + 1) === 1 ? "👑" : `#${i + 1}`;
            return `<tr style="border-bottom:1px solid #ddd; background:${isMyTeam ? '#ffeaa7' : '#fff'}; color:#2f3542; font-weight:${isMyTeam?'bold':'normal'}">
                <td style="padding:5px;">${rankIcon}</td>
                <td style="text-align:left;">${t.leader.name.split(' ')[0]}</td>
                <td style="font-weight:bold;">${t.eventScore}</td>
            </tr>`;
        }).join('');

        // SỬ DỤNG CLASS "res-layout", "res-left", "res-right"
        overlay.innerHTML = `
            <h1 style="color:#ffeaa7; text-shadow: 2px 2px 0 #d35400;">FINAL RANKING</h1>
            <div class="res-layout">
                <div class="res-left">
                    <table style="width:100%; border-collapse:collapse; font-size: 10px; text-align:center; color:#2f3542;">
                        <tr style="background:#2f3542; color:#fff;"><th>#</th><th>TEAM</th><th>PTS</th></tr>
                        ${tableRows}
                    </table>
                </div>
                <div class="res-right">
                    <div style="font-size:10px; color:#ccc;">BONUS</div>
                    <div style="font-size:16px; color:#ffeaa7; font-weight:bold;">+${formatNum(App.lastEventBonus||0)}</div>
                    <button class="res-btn" onclick="Competition.closeResult()" style="background:#00b894; color:#fff; border:none;">CONTINUE</button>
                </div>
            </div>
        `;
    },
    
    closeResult: () => { 
        document.getElementById('comp-result-overlay').style.display = 'none';
        document.getElementById('comp-screen').style.display = 'none';
        App.eventDone = true; Game.triggerStageSetup();
    }
};

// Đảm bảo Competition.keys tồn tại
Competition.keys = {};
window.onkeydown = (e) => Competition.keys[e.key] = true;
window.onkeyup = (e) => Competition.keys[e.key] = false;