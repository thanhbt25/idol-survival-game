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

    endSong: (winStatus = true) => {
        Stage.run = false; 
        if (Stage.audioElement) {
            Stage.audioElement.pause(); 
        }
        // Xóa sự kiện phím khi kết thúc màn chơi
        window.onkeydown = null; window.onkeyup = null;

        if (winStatus === false) {
            Stage.lastTotalScore = 0;
            document.getElementById('stage-fail-overlay').style.display = 'flex';
            document.getElementById('stage-fail-overlay').querySelector('h1').innerText = "FAILED";
            return; 
        }

        document.getElementById('stage-fail-overlay').style.display = 'none';
        document.getElementById('stage-detail-overlay').style.display = 'flex';

        // --- TÍNH ĐIỂM ---
        let total = Stage.totalNotesSpawned || 1;
        let holdCount = Stage.totalHoldSpawned || 0;
        
        if (Stage.maxRawScore === 0) Stage.maxRawScore = 1;
        let accuracy = (Stage.score / Stage.maxRawScore) * 100;
        if (accuracy > 100) accuracy = 100; 

        let duration = App.stageConfig.duration || 180;
        let density = total / duration;
        let difficultyScore = (total * 0.05) + (holdCount * 0.1) + (density * 5);
        let starLevel = Math.min(10, Math.max(1, Math.floor(difficultyScore / 5)));
        let starString = "★".repeat(starLevel) + "☆".repeat(10 - starLevel);

        let currentDiff = App.stageConfig.difficulty || 'medium';
        const MAX_SCORES = { 'easy': 10000, 'medium': 15000, 'hard': 20000 };
        let targetMaxScore = MAX_SCORES[currentDiff];

        let performanceRatio = accuracy / 100; 
        let baseScore = Math.floor(targetMaxScore * performanceRatio);

        let concept = App.stageConfig.concept;
        let skillBonus = 0;
        let skillHtml = "";

        if (concept === 'vocal') {
            skillBonus = Math.floor(baseScore * (Player.stats.vocal / 100) * 3.0);
            skillHtml = `<span style="color:#ff7675; font-weight:bold;">VOCAL BONUS:</span> <span>+${formatNum(skillBonus)}</span>`;
        } else if (concept === 'rap') {
            skillBonus = Math.floor(baseScore * (Player.stats.rap / 100) * 2.5);
            skillHtml = `<span style="color:#a29bfe; font-weight:bold;">RAP BONUS:</span> <span>+${formatNum(skillBonus)}</span>`;
        } else if (concept === 'dance') {
            let comboRatio = Stage.maxCombo / total;
            skillBonus = Math.floor((baseScore * comboRatio) * (Player.stats.dance / 100) * 3.0);
            skillHtml = `<span style="color:#74b9ff; font-weight:bold;">DANCE BONUS:</span> <span>+${formatNum(skillBonus)}</span>`;
        }

        let relBonus = 0;
        if (typeof RelManager !== 'undefined') relBonus = RelManager.getTeamBonus(Stage.teammates);

        let finalScore = baseScore + skillBonus + relBonus;
        
        let quitMsg = "";
        if (winStatus === 'quit') {
            finalScore = Math.floor(finalScore * 0.5);
            quitMsg = `<div class="score-line" style="color:red; font-weight:bold;"><span>QUIT PENALTY:</span> <span>-50%</span></div>`;
        }

        let penaltyRate = 0;
        if (Stage.retryCount > 0) penaltyRate = Math.min(1, Stage.retryCount * 0.2);
        let penaltyAmount = Math.floor(finalScore * penaltyRate);
        finalScore -= penaltyAmount;
        
        Stage.lastTotalScore = finalScore;

        let grade = "F"; let gradeColor = "#555";
        if (accuracy >= 100) { grade = "SSS"; gradeColor = "#e17055"; }
        else if (accuracy >= 95) { grade = "S"; gradeColor = "#feca57"; }
        else if (accuracy >= 90) { grade = "A"; gradeColor = "#00b894"; }
        else if (accuracy >= 80) { grade = "B"; gradeColor = "#0984e3"; }
        else if (accuracy >= 70) { grade = "C"; gradeColor = "#6c5ce7"; }
        else if (accuracy >= 60) { grade = "D"; gradeColor = "#b2bec3"; }

        document.getElementById('stage-detail-content').innerHTML = `
            <div style="text-align:center; margin-bottom:15px; border-bottom: 2px solid #eee; padding-bottom:10px;">
                <div style="font-size:10px; color:#aaa; margin-bottom:5px;">${concept.toUpperCase()} / ${currentDiff.toUpperCase()}</div>
                <div style="font-size:50px; font-weight:bold; color:${gradeColor}; text-shadow:3px 3px 0 #000;">${grade}</div>
                <div style="font-size:12px; color:#2f3542; font-weight:bold;">ACCURACY: ${accuracy.toFixed(2)}%</div>
            </div>
            <div class="score-line"><span>DIFFICULTY:</span> <span style="color:#feca57; letter-spacing:-1px;">${starString}</span></div>
            <div style="background:#f1f2f6; padding:5px; border-radius:5px; margin: 10px 0;">
                <div class="score-line" style="border:none; margin:5px 0;"><span>STAGE SCORE:</span> <span>${formatNum(baseScore)}</span></div>
                <div class="score-line" style="border:none; margin:5px 0;">${skillHtml}</div>
                <div class="score-line" style="border:none; margin:5px 0; color:#fd79a8"><span>RELATIONSHIP:</span> <span>+${formatNum(relBonus)}</span></div>
            </div>
            ${quitMsg}
            ${penaltyAmount > 0 ? `<div class="score-line" style="color:red"><span>RETRY PENALTY:</span> <span>-${formatNum(penaltyAmount)}</span></div>` : ''}
            <div class="total-line" style="font-size:24px; border-top: 4px solid #2f3542; padding-top:10px; margin-top:10px; background:#feca57; color:#fff; text-shadow:1px 1px 0 #000; border-radius:5px;">
                TOTAL: ${formatNum(finalScore)}
            </div>
        `;
    },
};

var Fireworks = {
    canvas: null, ctx: null, particles: [], active: false,
    init: () => {
        Fireworks.canvas = document.getElementById('fireworks-canvas');
        Fireworks.ctx = Fireworks.canvas.getContext('2d');
        const c = document.getElementById('game-container');
        Fireworks.canvas.width = c.clientWidth;
        Fireworks.canvas.height = c.clientHeight;
        Fireworks.active = true;
        Fireworks.loop();
    },
    create: (x, y) => {
        const colors = ['#ff6b81', '#feca57', '#54a0ff', '#1dd1a1', '#fff'];
        for(let i=0; i<30; i++) {
            Fireworks.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 100,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 3 + 1
            });
        }
    },
    loop: () => {
        if(!Fireworks.active) return;
        const ctx = Fireworks.ctx;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
        ctx.fillRect(0, 0, Fireworks.canvas.width, Fireworks.canvas.height);
        ctx.globalCompositeOperation = 'lighter';
        if(Math.random() < 0.05) {
            Fireworks.create(Math.random() * Fireworks.canvas.width, Math.random() * Fireworks.canvas.height / 2);
        }
        for(let i=Fireworks.particles.length-1; i>=0; i--) {
            let p = Fireworks.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.05; 
            p.life--; p.size *= 0.96;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            if(p.life <= 0) Fireworks.particles.splice(i, 1);
        }
        requestAnimationFrame(Fireworks.loop);
    },
    stop: () => { Fireworks.active = false; }
};