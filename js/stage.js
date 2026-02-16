/* --- STAGE ENGINE & FIREWORKS --- */
var Stage = {
    canvas: null, ctx: null, run: false, score: 0, hp: 100, notes: [], teammates: [], 
    lastTotalScore: 0,
    scoreHold: 0, scoreTap: 0, scoreCombo: 0, maxCombo: 0, combo: 0, laneCooldown: [0, 0, 0, 0],
    totalNotesSpawned: 0, missCount: 0,
    retryCount: 0,
    totalHoldSpawned: 0, 
    diffParams: {}, 
    maxRawScore: 0, 
    feedback: { text: "", alpha: 0, y: 0, color: "#fff" },

    // --- HỆ THỐNG ÂM THANH CỐ ĐỊNH (SINGLETON) ---
    // Các biến này sẽ giữ nguyên giá trị suốt quá trình chơi, không bao giờ bị xóa
    actx: null,   
    anl: null,    
    audioElement: null, 
    mediaSource: null,  
    dataArray: null,

    DIFFICULTY_SETTINGS: {
        'easy':   { spawnRate: 0.08, holdChance: 0.1, cooldown: 60, sensitivity: 90 },
        'medium': { spawnRate: 0.15, holdChance: 0.2, cooldown: 40, sensitivity: 80 },
        'hard':   { spawnRate: 0.35, holdChance: 0.4, cooldown: 20, sensitivity: 70 }
    },

    // 1. HÀM KHỞI TẠO ÂM THANH (Chỉ chạy đúng 1 lần duy nhất khi F5 trang)
    setupAudioSystem: () => {
        if (Stage.actx) return; // Nếu đã có thì thôi, không tạo lại

        console.log("Initializing Audio System...");
        const AC = window.AudioContext || window.webkitAudioContext;
        Stage.actx = new AC();
        
        // Tạo thẻ Audio ẩn trong DOM để quản lý luồng tốt hơn
        Stage.audioElement = new Audio();
        Stage.audioElement.crossOrigin = "anonymous";
        Stage.audioElement.loop = false;

        // Tạo bộ phân tích
        Stage.anl = Stage.actx.createAnalyser();
        Stage.anl.fftSize = 2048; 
        Stage.dataArray = new Uint8Array(Stage.anl.frequencyBinCount);

        // KẾT NỐI VĨNH VIỄN: Audio -> Source -> Analyser -> Loa
        // Đây là bước quan trọng nhất: Chỉ nối dây 1 lần!
        Stage.mediaSource = Stage.actx.createMediaElementSource(Stage.audioElement);
        Stage.mediaSource.connect(Stage.anl);
        Stage.anl.connect(Stage.actx.destination);
    },

    setupTouchInput: () => {
        const c = Stage.canvas;
        
        // Ngăn chặn hành động cuộn/zoom mặc định của trình duyệt khi chạm vào game
        c.style.touchAction = "none"; 

        // Hàm tính toán xem ngón tay chạm vào làn số mấy (0, 1, 2, 3)
        const getLaneIndex = (touch) => {
            const rect = c.getBoundingClientRect();
            // 500 là chiều rộng cố định được set trong hàm loop()
            const scaleX = 500 / rect.width; 
            const x = (touch.clientX - rect.left) * scaleX;
            
            // Chia 500px thành 4 làn đều nhau
            const lane = Math.floor(x / (500 / 4));
            return lane;
        };

        // Xử lý khi bắt đầu chạm (Tương đương KeyDown)
        c.addEventListener("touchstart", (e) => {
            e.preventDefault(); // Chặn hành vi mặc định
            // Duyệt qua tất cả các ngón tay vừa chạm vào (hỗ trợ đa điểm)
            for (let i = 0; i < e.changedTouches.length; i++) {
                const lane = getLaneIndex(e.changedTouches[i]);
                if (lane >= 0 && lane <= 3) {
                    Stage.handleInput(lane); // Gọi hàm xử lý hit
                }
            }
        }, { passive: false });

        // Xử lý khi nhấc ngón tay ra (Tương đương KeyUp - Quan trọng cho nốt Hold)
        c.addEventListener("touchend", (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const lane = getLaneIndex(e.changedTouches[i]);
                if (lane >= 0 && lane <= 3) {
                    Stage.handleRelease(lane); // Gọi hàm nhả nốt
                }
            }
        }, { passive: false });
    },

    // 2. HÀM BẮT ĐẦU MÀN CHƠI
    realInit: () => {
        if (!App.audioFile) { Notify.show("MISSING MUSIC"); return; }
        
        // Đảm bảo hệ thống âm thanh đã được dựng
        Stage.setupAudioSystem();
        BGM.stop();

        // Ẩn UI chọn team, hiện UI game
        document.getElementById('team-select-overlay').style.display = 'none';
        showScreen('stage-screen');

        // Hiển thị team
        let h = ''; Stage.teammates.forEach(t => h += `<div class="teammate-mini-card"><b>${t.name}</b><br>${t.role}</div>`);
        document.getElementById('stage-teammates-list').innerHTML = h;

        // Reset thông số màn chơi
        let diffKey = App.stageConfig.difficulty || 'medium';
        Stage.diffParams = Stage.DIFFICULTY_SETTINGS[diffKey];
        let retryText = Stage.retryCount > 0 ? ` (RETRY #${Stage.retryCount})` : "";
        document.getElementById('playing-song-name').innerText = 
            `${App.audioName} [${App.stageConfig.concept.toUpperCase()} - ${diffKey.toUpperCase()}]${retryText}`;

        // QUAN TRỌNG: Đánh thức AudioContext nếu nó đang ngủ
        if (Stage.actx.state === 'suspended') {
            Stage.actx.resume();
        }

        // --- XỬ LÝ NẠP NHẠC AN TOÀN ---
        // Dừng nhạc cũ nếu đang chạy
        Stage.audioElement.pause();
        
        // Gán nguồn nhạc mới
        const objectUrl = URL.createObjectURL(App.audioFile);
        Stage.audioElement.src = objectUrl;
        
        // Xóa sự kiện cũ để tránh lặp
        Stage.audioElement.onended = null;
        Stage.audioElement.onended = () => {
            URL.revokeObjectURL(objectUrl); // Dọn dẹp bộ nhớ
            Stage.endSong(true);
        };

        // Bắt đầu phát
        Stage.audioElement.play().catch(e => {
            console.error("Audio Error:", e);
            Notify.show("CLICK SCREEN TO ENABLE AUDIO");
        });

        // Reset biến Game
        Stage.canvas = document.getElementById('rhythmCanvas');
        Stage.ctx = Stage.canvas.getContext('2d');

        Stage.setupTouchInput();

        Stage.run = true; Stage.hp = 100; Stage.notes = [];
        Stage.score = 0; Stage.scoreTap = 0; Stage.scoreHold = 0;
        Stage.combo = 0; Stage.maxCombo = 0;
        Stage.totalNotesSpawned = 0; Stage.missCount = 0;
        Stage.totalHoldSpawned = 0;
        Stage.maxRawScore = 0; 
        Stage.feedback = { text: "", alpha: 0, y: 0, color: "#fff" };

        document.getElementById('combo-hud').innerText = "COMBO 0"; 
        document.getElementById('score-hud').innerText = "0";
        document.getElementById('health-fill').style.height = "100%";

        // Bắt đầu vòng lặp
        Stage.loop();
        
        // Gán sự kiện bàn phím
        window.onkeydown = e => { 
            const k = C.KEYS.indexOf(e.key.toLowerCase()); 
            if (k > -1 && !e.repeat) Stage.handleInput(k); 
        };
        window.onkeyup = e => { 
            const k = C.KEYS.indexOf(e.key.toLowerCase()); 
            if (k > -1) Stage.handleRelease(k); 
        };
    },

    loop: () => {
        // Logic dừng
        if (!Stage.run) return;
        
        // Logic Pause: Giữ loop chạy nhưng không làm gì cả
        if (App.paused) {
            requestAnimationFrame(Stage.loop);
            return;
        }

        const ctx = Stage.ctx; const w = 500; const h = 400;
        Stage.canvas.width = w; Stage.canvas.height = h;

        for (let i = 0; i < 4; i++) if (Stage.laneCooldown[i] > 0) Stage.laneCooldown[i]--;

        // Lấy dữ liệu từ bộ phân tích (đã nối sẵn ở setupAudioSystem)
        Stage.anl.getByteFrequencyData(Stage.dataArray);
        let sum = 0; for (let i = 0; i < Stage.dataArray.length; i++) sum += Stage.dataArray[i];

        // Spawn Notes
        if (sum / Stage.dataArray.length > Stage.diffParams.sensitivity && Math.random() < Stage.diffParams.spawnRate) {
            const ln = Math.floor(Math.random() * 4);
            if (Stage.laneCooldown[ln] === 0) {
                const hold = Math.random() < Stage.diffParams.holdChance;
                Stage.laneCooldown[ln] = hold ? (Stage.diffParams.cooldown + 30) : Stage.diffParams.cooldown;
                Stage.maxRawScore += 1000; 
                Stage.notes.push({ l: ln, y: -50, h: hold, len: hold ? 100 : 0, maxLen: hold ? 100 : 0 });
                Stage.totalNotesSpawned++;
                if (hold) Stage.totalHoldSpawned++;
            }
        }

        // Vẽ nền & Lane
        ctx.fillStyle = "#2c2c54"; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fillRect(0, h - 60, w, 60);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, h - 50); ctx.lineTo(w, h - 50); ctx.stroke();
        const lw = w / 4; for (let i = 0; i < 4; i++) { ctx.strokeStyle = "#444"; ctx.strokeRect(i * lw, 0, lw, h); }

        // Vẽ Notes
        Stage.notes.forEach((n, i) => {
            if (n.proc) return;
            
            if (n.holding) {
                n.len -= 4; 
                Stage.score += 20; Stage.scoreHold += 20;
                if (n.len <= 0) { n.proc = true; Stage.triggerHit("PERFECT", true); }
            } else {
                n.y += 4; 
            }

            const cols = ["#ff9ff3", "#00d2d3", "#feca57", "#54a0ff"];
            const c = cols[n.l]; ctx.fillStyle = c;
            if (n.h) {
                let grd = ctx.createLinearGradient(0, n.y, 0, n.y - n.len);
                grd.addColorStop(0, c); grd.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = grd; ctx.fillRect(n.l * lw + 10, n.y - n.len, lw - 20, n.len);
            }
            ctx.fillStyle = n.holding ? "#fff" : c; ctx.fillRect(n.l * lw + 5, n.y - 10, lw - 10, 20);
            
            if (!n.holding && n.y > h) { n.proc = true; Stage.triggerHit("MISS"); }
        });

        // Vẽ Feedback
        if (Stage.feedback && Stage.feedback.alpha > 0) {
            ctx.globalAlpha = Stage.feedback.alpha;
            ctx.fillStyle = Stage.feedback.color;
            ctx.font = "bold 30px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.fillText(Stage.feedback.text, w / 2, h / 2);
            ctx.globalAlpha = 1.0;
            Stage.feedback.alpha -= 0.05; Stage.feedback.y -= 1;
        }
        document.getElementById('score-hud').innerText = Stage.score;
        document.getElementById('health-fill').style.height = Stage.hp + "%";

        if (Stage.hp <= 0) { Stage.endSong(false); return; }
        requestAnimationFrame(Stage.loop);
    },

    handleInput: (idx) => {
        if (!Stage.run || App.paused) return;
        const h = Stage.canvas.height; const target = h - 50;
        const note = Stage.notes.find(n => n.l === idx && !n.proc && !n.holding && Math.abs(n.y - target) < 60);
        
        if (note) { 
            if (note.h) { 
                note.holding = true; 
                let pts = 500; Stage.score += pts; Stage.scoreHold += pts;
                Stage.combo++; Stage.updateCombo();
                Stage.feedback = { text: "HOLD", alpha: 1.0, y: 200, color: "#fff" };
            } else { 
                note.proc = true; Stage.evaluateHit(note.y, target); 
            } 
        }
    },

    handleRelease: (idx) => {
        if (!Stage.run || App.paused) return;
        const note = Stage.notes.find(n => n.l === idx && n.holding);
        if (note) { note.holding = false; note.proc = true; }
    },

    evaluateHit: (y, target) => {
        let diff = Math.abs(y - target);
        if (diff < 15) Stage.triggerHit("PERFECT");
        else if (diff < 30) Stage.triggerHit("GOOD");
        else Stage.triggerHit("BAD");
    },

    triggerHit: (type, isHoldEnd = false) => {
        if (type === "MISS") {
            Stage.missCount++; Stage.combo = 0;
            Stage.hp = Math.max(0, Stage.hp - 10);
            Stage.feedback = { text: "MISS", alpha: 1.0, y: 200, color: "#d63031" };
        } else {
            let pts = 1000; let col = "#00b894"; 
            if (type === "GOOD") { pts = 500; col = "#0984e3"; }
            if (type === "BAD") { pts = 200; Stage.combo = 0; col = "#fdcb6e"; }
            
            if (!isHoldEnd && type !== "BAD") Stage.combo++; 
            if (type !== "BAD" && !isHoldEnd) { Stage.score += pts; Stage.scoreTap += pts; }
            Stage.feedback = { text: type, alpha: 1.0, y: 200, color: col };
            if (type === "PERFECT") Stage.hp = Math.min(100, Stage.hp + 2);
        }
        Stage.updateCombo();
    },

    updateCombo: () => {
        if(Stage.combo > Stage.maxCombo) Stage.maxCombo = Stage.combo;
        document.getElementById('combo-hud').innerText = "COMBO " + Stage.combo;
    },

    quitStage: () => {
        document.getElementById('stage-fail-overlay').style.display = 'none';
        Stage.endSong('quit');
    },

    retryStage: () => {
        document.getElementById('stage-fail-overlay').style.display = 'none';
        Stage.retryCount++;
        Stage.realInit();
    },

    cleanup: () => {
        Stage.run = false;
        if (Stage.audioElement) {
            Stage.audioElement.pause();
            Stage.audioElement.currentTime = 0;
        }
        if (Stage.actx && Stage.actx.state === 'running') {
            Stage.actx.suspend();
        }
    },

    endSong: (winStatus = true) => {
        Stage.run = false; 
        if (Stage.audioElement) {
            Stage.audioElement.pause();
            Stage.audioElement.currentTime = 0;
        }
        window.onkeydown = null; window.onkeyup = null;

        // Xử lý Thất bại
        if (winStatus === false) {
            Stage.lastTotalScore = 0;
            document.getElementById('stage-fail-overlay').style.display = 'flex';
            return; 
        }

        document.getElementById('stage-fail-overlay').style.display = 'none';
        document.getElementById('stage-detail-overlay').style.display = 'flex';

        // --- TÍNH TOÁN ĐIỂM SỐ ---
        let total = Stage.totalNotesSpawned || 1;
        if (Stage.maxRawScore === 0) Stage.maxRawScore = 1;
        let accuracy = (Stage.score / Stage.maxRawScore) * 100;
        if (accuracy > 100) accuracy = 100; 

        // Tính sao độ khó
        let duration = App.stageConfig.duration || 180;
        let difficultyScore = (total * 0.05) + (Stage.totalHoldSpawned * 0.1) + (total/duration * 5);
        let starLevel = Math.min(10, Math.max(1, Math.floor(difficultyScore / 5)));
        let starString = "★".repeat(starLevel) + "<span style='color:#ccc'>"+"★".repeat(10 - starLevel)+"</span>";

        // Tính điểm cơ bản & Bonus
        let currentDiff = App.stageConfig.difficulty || 'medium';
        const MAX_SCORES = { 'easy': 10000, 'medium': 15000, 'hard': 20000 };
        let targetMaxScore = MAX_SCORES[currentDiff];
        let baseScore = Math.floor(targetMaxScore * (accuracy / 100));

        // Skill Bonus
        let skillBonus = 0;
        let concept = App.stageConfig.concept;
        if (concept === 'vocal') skillBonus = Math.floor(baseScore * (Player.stats.vocal / 100) * 3.0);
        else if (concept === 'rap') skillBonus = Math.floor(baseScore * (Player.stats.rap / 100) * 2.5);
        else if (concept === 'dance') skillBonus = Math.floor((baseScore * (Stage.maxCombo/total)) * (Player.stats.dance / 100) * 3.0);

        // Relationship Bonus
        let relBonus = (typeof RelManager !== 'undefined') ? RelManager.getTeamBonus(Stage.teammates) : 0;

        // Tổng kết
        let finalScore = baseScore + skillBonus + relBonus;
        
        // Penaty nếu Quit hoặc Retry
        if (winStatus === 'quit') finalScore = Math.floor(finalScore * 0.5);
        if (Stage.retryCount > 0) finalScore -= Math.floor(finalScore * Math.min(1, Stage.retryCount * 0.2));
        
        Stage.lastTotalScore = finalScore;

        // Xếp hạng (Grade)
        let grade = "F"; let gradeColor = "#b2bec3";
        if (accuracy >= 100) { grade = "SSS"; gradeColor = "#ff7675"; }
        else if (accuracy >= 95) { grade = "S"; gradeColor = "#feca57"; }
        else if (accuracy >= 90) { grade = "A"; gradeColor = "#00b894"; }
        else if (accuracy >= 80) { grade = "B"; gradeColor = "#0984e3"; }
        else if (accuracy >= 70) { grade = "C"; gradeColor = "#6c5ce7"; }
        else if (accuracy >= 60) { grade = "D"; gradeColor = "#636e72"; }

        // --- RENDER GIAO DIỆN (LAYOUT MỚI CHO MOBILE) ---
        const contentDiv = document.getElementById('stage-detail-content');
        
        // Ẩn nút cũ ngoài overlay nếu có (để tránh bị trùng)
        const oldBtn = document.querySelector('#stage-detail-overlay > button');
        if(oldBtn) oldBtn.style.display = 'none';

        contentDiv.innerHTML = `
            <div class="stage-res-layout">
                <div class="sr-left">
                    <div style="font-size:10px; color:#aaa; font-weight:bold;">${concept.toUpperCase()} / ${currentDiff.toUpperCase()}</div>
                    <div class="grade-text" style="color:${gradeColor}; text-shadow:2px 2px 0 #fff, 4px 4px 0 rgba(0,0,0,0.1);">${grade}</div>
                    <div class="acc-text" style="color:#2f3542;">ACC: ${accuracy.toFixed(1)}%</div>
                    <div class="diff-stars" style="color:#feca57;">${starString}</div>
                </div>

                <div class="sr-right">
                    <div class="score-row"><span>BASE SCORE</span> <b>${formatNum(baseScore)}</b></div>
                    <div class="score-row" style="color:#0984e3;"><span>SKILL BONUS</span> <b>+${formatNum(skillBonus)}</b></div>
                    <div class="score-row" style="color:#e84393;"><span>TEAMWORK</span> <b>+${formatNum(relBonus)}</b></div>
                    
                    ${winStatus === 'quit' ? `<div class="score-row" style="color:red;"><span>QUIT PENALTY</span> <b>-50%</b></div>` : ''}
                    ${Stage.retryCount > 0 ? `<div class="score-row" style="color:red;"><span>RETRY PENALTY</span> <b>-${Stage.retryCount*20}%</b></div>` : ''}
                    
                    <div class="total-score-box">
                        TOTAL: ${formatNum(finalScore)}
                    </div>

                    <button id="btn-stage-continue" onclick="Game.finishStageDay()">CONTINUE</button>
                </div>
            </div>
        `;
    },
};

/* --- OPTIMIZED FIREWORKS FOR MOBILE --- */
var Fireworks = {
    canvas: null, ctx: null, particles: [], active: false, loopId: null,
    
    init: () => {
        if (Fireworks.active) return;
        Fireworks.canvas = document.getElementById('fireworks-canvas');
        Fireworks.ctx = Fireworks.canvas.getContext('2d');
        const c = document.getElementById('game-container');
        Fireworks.canvas.width = c.clientWidth;
        Fireworks.canvas.height = c.clientHeight;
        Fireworks.active = true;
        Fireworks.loop();
    },

    create: (x, y) => {
        // MOBILE: Giảm số lượng hạt từ 30 -> 10 để đỡ lag
        const particleCount = (window.innerWidth < 800) ? 10 : 30;
        const colors = ['#ff6b81', '#feca57', '#54a0ff', '#1dd1a1', '#fff'];
        
        for(let i=0; i < particleCount; i++) {
            Fireworks.particles.push({
                x: x, y: y,
                // Giảm tốc độ bay để nhìn mượt hơn
                vx: (Math.random() - 0.5) * 4, 
                vy: (Math.random() - 0.5) * 4,
                life: 80 + Math.random() * 20,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 2 + 1
            });
        }
    },

    loop: () => {
        if(!Fireworks.active) return;
        const ctx = Fireworks.ctx;
        
        // Hiệu ứng mờ đuôi (Trail) - Tối ưu performance
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
        ctx.fillRect(0, 0, Fireworks.canvas.width, Fireworks.canvas.height);
        
        // Tắt 'lighter' trên mobile vì nó ngốn GPU kinh khủng
        ctx.globalCompositeOperation = 'source-over'; 

        // Tỉ lệ bắn pháo hoa: PC 5%, Mobile 2%
        if(Math.random() < (window.innerWidth < 800 ? 0.02 : 0.05)) {
            Fireworks.create(Math.random() * Fireworks.canvas.width, Math.random() * Fireworks.canvas.height / 2);
        }

        for(let i=Fireworks.particles.length-1; i>=0; i--) {
            let p = Fireworks.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.05; 
            p.life--; 
            
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            
            if(p.life <= 0) Fireworks.particles.splice(i, 1);
        }
        Fireworks.loopId = requestAnimationFrame(Fireworks.loop);
    },

    stop: () => { 
        Fireworks.active = false; 
        if(Fireworks.loopId) cancelAnimationFrame(Fireworks.loopId);
        if(Fireworks.ctx) Fireworks.ctx.clearRect(0, 0, Fireworks.canvas.width, Fireworks.canvas.height);
        Fireworks.particles = [];
    }
};