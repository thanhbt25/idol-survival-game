/* --- MINIGAMES LOGIC --- */
var Minigame = {
    type: null, active: false, timer: null, listener: null,

    // DIFFICULTY CONFIGURATION
    getDifficulty: (statType) => {
        let val = (statType === 'gym') ? Player.stats.stamina : Player.stats[statType];
        let level = "";
        let color = "";
        let params = {};

        if (val < 50) {
            level = "EASY"; color = "#00b894"; 
            params = { 
                obsSpeed: 5, gap: 140, spawnRate: 90, duration: 1500, // Vocal
                showSpeed: 500, rounds: 3, // Dance
                timeDrain: 0.6, wordLen: [4, 6], // Rap
                barSpeed: 8, targetW: 120, speedInc: 2 // Gym
            };
        } else if (val < 65) {
            level = "MEDIUM"; color = "#0984e3"; 
            params = { 
                obsSpeed: 6, gap: 130, spawnRate: 80, duration: 1800,
                showSpeed: 450, rounds: 4,
                timeDrain: 1.0, wordLen: [5, 7],
                barSpeed: 12, targetW: 90, speedInc: 3
            };
        } else if (val < 80) {
            level = "HARD"; color = "#fdcb6e"; 
            params = { 
                obsSpeed: 8, gap: 120, spawnRate: 70, duration: 2000,
                showSpeed: 350, rounds: 5,
                timeDrain: 1.5, wordLen: [6, 9],
                barSpeed: 16, targetW: 60, speedInc: 4
            };
        } else if (val < 90) {
            level = "EXTREME"; color = "#e17055"; 
            params = { 
                obsSpeed: 10, gap: 100, spawnRate: 60, duration: 2500,
                showSpeed: 250, rounds: 6,
                timeDrain: 2.0, wordLen: [8, 12],
                barSpeed: 20, targetW: 40, speedInc: 5
            };
        } else {
            level = "NIGHTMARE"; color = "#d63031"; 
            params = { 
                obsSpeed: 13, gap: 85, spawnRate: 50, duration: 3000,
                showSpeed: 180, rounds: 8,
                timeDrain: 3.0, wordLen: [10, 15],
                barSpeed: 25, targetW: 25, speedInc: 6
            };
        }
        return { level, color, params };
    },

    initCanvas: (c) => {
        c.innerHTML = '';
        const cv = document.createElement('canvas');
        cv.width = c.clientWidth;
        cv.height = c.clientHeight;
        c.appendChild(cv);
        return { cv, ctx: cv.getContext('2d'), w: cv.width, h: cv.height };
    },

    start: (type) => {
        Game.toggleJoystick(false);
        BGM.play('minigame');
        showScreen('minigame-screen');
        Minigame.type = type; 
        Minigame.active = false; 
        
        document.getElementById('minigame-result-overlay').style.display = 'none';
        const c = document.getElementById('minigame-canvas-container'); 
        c.innerHTML = '';
        
        const diff = Minigame.getDifficulty(type);
        document.getElementById('minigame-info').innerHTML = 
            `TRAINING: <span style="color:${diff.color}; font-weight:bold;">${diff.level}</span>`;

        // Call Tutorial Screen
        Minigame.showTutorial(c, type, () => {
            // After Ready -> Countdown
            Minigame.showCountdown(c, () => {
                // Countdown finished -> Start Game
                Minigame.active = true;
                if (type === 'vocal') Minigame.vocal(c, diff.params);
                else if (type === 'dance') Minigame.dance(c, diff.params);
                else if (type === 'rap') Minigame.rap(c, diff.params);
                else Minigame.gym(c, diff.params);
            });
        });
    },

    // --- TUTORIAL DISPLAY (ENGLISH) ---
    showTutorial: (container, type, callback) => {
        let title = "";
        let instructions = "";
        let icon = "";

        if (type === 'vocal') {
            title = "VOCAL TRAINING";
            icon = "🎤";
            instructions = `
                <p>1. <b>Left Click</b> repeatedly to flap wings.</p>
                <p>2. Dodge pipes and don't hit the ground.</p>
                <p>3. Survive longer for higher score!</p>
            `;
        } else if (type === 'dance') {
            title = "DANCE TRAINING";
            icon = "💃";
            instructions = `
                <p>1. Watch the highlighted key sequence.</p>
                <p>2. Repeat it using: <b>D - F - J - K</b>.</p>
                <p>3. Sequence length increases each round!</p>
            `;
        } else if (type === 'rap') {
            title = "RAP TRAINING";
            icon = "🧢"; // Hat Icon (Blue)
            instructions = `
                <p>1. Read the keyword shown above.</p>
                <p>2. <b>Type it exactly</b> into the input box.</p>
                <p>3. Type fast before the timer runs out!</p>
            `;
        } else if (type === 'gym') {
            title = "GYM TRAINING";
            icon = "💪";
            instructions = `
                <p>1. The white bar moves back and forth.</p>
                <p>2. Press <b>SPACE</b> when inside the GREEN zone.</p>
                <p>3. Zone gets smaller & speed increases!</p>
            `;
        }

        const tutDiv = document.createElement('div');
        tutDiv.id = 'mg-tutorial';
        tutDiv.style.cssText = `
            position: absolute; top:0; left:0; width:100%; height:100%;
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            background: rgba(0,0,0,0.85); z-index: 60; color: #fff;
            font-family: 'Press Start 2P', sans-serif; text-align: center;
        `;
        
        tutDiv.innerHTML = `
            <div style="font-size: 60px; margin-bottom: 20px;">${icon}</div>
            <h2 style="color: #ffeaa7; margin-bottom: 20px; text-transform: uppercase;">${title}</h2>
            <div style="font-family: 'Pixelify Sans', sans-serif; font-size: 20px; line-height: 1.6; margin-bottom: 30px; color: #dfe6e9; text-align: left; background: rgba(255,255,255,0.1); padding: 25px; border-radius: 10px; border: 2px solid #fff;">
                ${instructions}
            </div>
            <button id="btn-tut-start" style="padding: 15px 40px; font-size: 20px; font-family: 'Press Start 2P'; background: #00b894; color: white; border: none; cursor: pointer; border-radius: 5px; border-bottom: 4px solid #008c72;">I'M READY!</button>
        `;

        container.style.position = 'relative';
        container.appendChild(tutDiv);

        document.getElementById('btn-tut-start').onclick = () => {
            tutDiv.remove();
            callback();
        };
    },

    // --- COUNTDOWN FUNCTION ---
    showCountdown: (container, callback) => {
        const cdDiv = document.createElement('div');
        cdDiv.id = 'mg-countdown';
        cdDiv.style.cssText = `
            position: absolute; top:0; left:0; width:100%; height:100%;
            display:flex; align-items:center; justify-content:center;
            font-size: 80px; font-weight: bold; color: #fff;
            background: rgba(0,0,0,0.5); z-index: 50; text-shadow: 4px 4px 0 #000;
            font-family: 'Press Start 2P', cursive;
        `;
        container.style.position = 'relative';
        container.appendChild(cdDiv);

        let count = 3;
        cdDiv.innerText = count;

        const int = setInterval(() => {
            count--;
            if (count > 0) {
                cdDiv.innerText = count;
            } else if (count === 0) {
                cdDiv.innerText = "START!";
                cdDiv.style.color = "#ffeaa7";
            } else {
                clearInterval(int);
                cdDiv.remove();
                callback();
            }
        }, 1000);
    },

    finish: (win, gain) => {
        Minigame.active = false; 
        clearInterval(Minigame.timer);
        if (Minigame.listener) window.removeEventListener('keydown', Minigame.listener);
        
        const o = document.getElementById('minigame-result-overlay'); 
        o.style.display = 'flex';
        document.getElementById('mg-res-title').innerText = win ? "SUCCESS" : "FAILED";
        document.getElementById('mg-res-title').style.color = win ? "#00b894" : "#d63031";

        let fanGain = 0;
        let statText = "";

        if (win) { 
            if (Minigame.type === 'gym') {
                Player.stats.visual += 2.5;
                Player.stats.charisma += 2.5;
                statText = "+2.5 VIS | +2.5 CHA";
            } else if (Minigame.type === 'team') {
                Player.teamwork += gain;
                statText = `+${gain} TEAMWORK`;
            } else {
                Player.stats[Minigame.type] += gain;
                statText = `+${gain} ${Minigame.type.toUpperCase()}`;
            }
            fanGain = (gain * 10) + Math.floor(Player.stats.charisma * 0.5);
            Player.fans += fanGain;
        }
        
        document.getElementById('mg-res-info').innerHTML = win ? 
            `${statText}<br><span style="color:#ff6b81">+${fanGain} FANS</span>` : 
            "TRY AGAIN";
            
        updateUI();
    },

    retry: () => Game.startPractice(Minigame.type),
    
    exit: () => { 
        Minigame.active = false; clearInterval(Minigame.timer);
        if (Minigame.listener) window.removeEventListener('keydown', Minigame.listener);
        document.getElementById('minigame-result-overlay').style.display = 'none'; 
        Game.enterHub(); 
    },

vocal: (c, params) => {
        const { cv, ctx, w, h } = Minigame.initCanvas(c);
        
        // Tỉ lệ scale dựa trên chiều cao (chuẩn 400px)
        const scale = h / 400; 

        let birdY = h / 2;
        let birdV = 0;
        let frame = 0;
        let obs = [];
        
        // Điều khiển: Hỗ trợ cả Click chuột và Touch màn hình
        const jump = (e) => { 
            if(e) e.preventDefault(); 
            if(!Minigame.active) return;
            birdV = -6 * scale; // Lực nhảy theo tỉ lệ
        };
        cv.onmousedown = jump;
        cv.ontouchstart = jump;

        const duration = params.duration || 1500;
        // Tốc độ game cũng cần scale theo chiều ngang
        const speed = (params.obsSpeed || 5) * (w / 600); 

        Minigame.timer = setInterval(() => {
            if (!Minigame.active || App.paused) return;

            // Xóa màn hình
            ctx.fillStyle = "#48dbfb"; ctx.fillRect(0, 0, w, h);

            // Thanh tiến trình
            ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(10, 10, w - 20, 10 * scale);
            ctx.fillStyle = "#00b894"; ctx.fillRect(10, 10, (frame / duration) * (w - 20), 10 * scale);

            // Vật lý chim
            birdV += 0.35 * scale; // Trọng lực
            birdY += birdV;

            // Vẽ Chim (To hơn 1.5 lần bình thường cho dễ nhìn)
            const bSize = 25 * scale; 
            ctx.fillStyle = "#feca57"; ctx.fillRect(w * 0.2, birdY, bSize, bSize * 0.8);
            // Mắt
            ctx.fillStyle = "#fff"; ctx.fillRect(w * 0.2 + bSize*0.6, birdY + bSize*0.1, bSize*0.3, bSize*0.3);
            ctx.fillStyle = "#000"; ctx.fillRect(w * 0.2 + bSize*0.7, birdY + bSize*0.2, bSize*0.1, bSize*0.1);
            // Mỏ
            ctx.fillStyle = "#e67e22"; ctx.fillRect(w * 0.2 + bSize*0.8, birdY + bSize*0.5, bSize*0.4, bSize*0.2);

            // Sinh Cột (Obstacles)
            if (frame % params.spawnRate === 0) {
                let minH = 50 * scale;
                let maxH = h - (params.gap * scale) - minH;
                let obsH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
                obs.push({ x: w, h: obsH });
            }

            // Vẽ & Va chạm Cột
            ctx.fillStyle = "#1dd1a1"; ctx.strokeStyle = "#10ac84"; ctx.lineWidth = 3;
            const pW = 60 * scale; // Chiều rộng cột
            const gap = params.gap * scale; // Khe hở

            for (let i = obs.length - 1; i >= 0; i--) {
                let o = obs[i];
                o.x -= speed;

                // Cột trên
                ctx.fillRect(o.x, 0, pW, o.h); ctx.strokeRect(o.x, 0, pW, o.h);
                // Cột dưới
                ctx.fillRect(o.x, o.h + gap, pW, h - (o.h + gap)); ctx.strokeRect(o.x, o.h + gap, pW, h - (o.h + gap));

                // Va chạm (Hitbox đơn giản)
                // Chim: [w*0.2, birdY, bSize, bSize*0.8]
                if (
                    w * 0.2 + bSize > o.x && 
                    w * 0.2 < o.x + pW && 
                    (birdY < o.h || birdY + bSize * 0.8 > o.h + gap)
                ) {
                    Minigame.finish(false, 0);
                }

                if (o.x < -pW) obs.splice(i, 1);
            }

            // Va chạm đất/trần
            if (birdY < 0 || birdY + bSize * 0.8 > h) Minigame.finish(false, 0);

            frame++;
            if (frame >= duration) Minigame.finish(true, 5);

        }, 20);
    },

    // --- 2. DANCE (MEMORY) - SCALED UI ---
    dance: (c, params) => {
        // Sử dụng CSS Flexbox để tự co giãn nút bấm
        c.innerHTML = `
            <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#222;">
                <div id="d-seq" style="color:#fff; font-size:min(5vw, 30px); margin-bottom: 20px;">WATCH</div>
                <div style="display:flex; gap:15px; width:90%; justify-content:center; height: 30%;">
                    <div class="dance-btn" id="db-0" style="flex:1; background:#ff7675; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:min(6vw, 40px); font-weight:bold; color:#fff; cursor:pointer;">D</div>
                    <div class="dance-btn" id="db-1" style="flex:1; background:#74b9ff; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:min(6vw, 40px); font-weight:bold; color:#fff; cursor:pointer;">F</div>
                    <div class="dance-btn" id="db-2" style="flex:1; background:#ffeaa7; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:min(6vw, 40px); font-weight:bold; color:#333; cursor:pointer;">J</div>
                    <div class="dance-btn" id="db-3" style="flex:1; background:#a29bfe; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:min(6vw, 40px); font-weight:bold; color:#fff; cursor:pointer;">K</div>
                </div>
                <div style="color:#aaa; font-size:min(3vw, 12px); margin-top:20px;">TAP BUTTONS or PRESS D-F-J-K</div>
            </div>`;

        // Style hiệu ứng active
        const style = document.createElement('style');
        style.innerHTML = `.dance-btn.active { transform: scale(0.9); filter: brightness(1.5); box-shadow: 0 0 15px currentColor; }`;
        c.appendChild(style);

        const k = ['d', 'f', 'j', 'k'];
        const btnIds = ['db-0', 'db-1', 'db-2', 'db-3'];
        let seq = [], idx = 0, round = 0;

        // Hàm xử lý khi người chơi bấm (Touch hoặc Key)
        const handleInput = (index) => {
            if (!Minigame.active) return;
            const btn = document.getElementById(btnIds[index]);
            btn.classList.add('active');
            setTimeout(() => btn.classList.remove('active'), 100);

            if (index === seq[idx]) {
                idx++;
                if (idx >= seq.length) {
                    // Thắng vòng này
                    if (round < params.rounds) setTimeout(playRound, 500);
                    else Minigame.finish(true, 5);
                }
            } else {
                Minigame.finish(false, 0); // Sai nút -> Thua
            }
        };

        // Gán sự kiện Touch cho Mobile
        btnIds.forEach((id, index) => {
            document.getElementById(id).ontouchstart = (e) => { e.preventDefault(); handleInput(index); };
            document.getElementById(id).onmousedown = (e) => { e.preventDefault(); handleInput(index); };
        });

        // Gán sự kiện Phím cho PC
        Minigame.listener = (e) => {
            let i = k.indexOf(e.key.toLowerCase());
            if (i >= 0) handleInput(i);
        };
        window.addEventListener('keydown', Minigame.listener);

        const playRound = async () => {
            seq = []; idx = 0; round++;
            document.getElementById('d-seq').innerText = `ROUND ${round}/${params.rounds}`;
            await new Promise(r => setTimeout(r, 800));

            let len = round + 2;
            // Máy chơi mẫu
            for (let i = 0; i < len; i++) {
                if(!Minigame.active) return;
                let m = Math.floor(Math.random() * 4);
                seq.push(m);
                document.getElementById(btnIds[m]).classList.add('active');
                await new Promise(r => setTimeout(r, params.showSpeed));
                document.getElementById(btnIds[m]).classList.remove('active');
                await new Promise(r => setTimeout(r, 200));
            }
            document.getElementById('d-seq').innerText = "REPEAT!";
        };
        playRound();
    },

    rap: (c, params) => {
        c.innerHTML = `
            <div id="rap-game-ui" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#222;">
                <div id="r-w" style="font-size:min(8vw, 40px); color:#fff; font-family:monospace; margin-bottom:20px; text-align:center; min-height:50px;"></div>
                
                <input id="r-i" type="text" 
                    style="font-size:min(6vw, 30px); text-align:center; background:#333; color:#fff; border:3px solid #fff; padding:15px; width:90%; border-radius:8px;" 
                    autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false">
                
                <div id="rap-timer-bar" style="width:90%; height:15px; background:#555; margin-top:20px; border:2px solid #fff; border-radius:10px; overflow:hidden;">
                    <div id="rap-timer-fill" style="height:100%; width:100%; background:#ff4757; transition: width 0.1s linear;"></div>
                </div>
                <div style="color:#aaa; margin-top:10px; font-size:10px;">TYPE IT FAST!</div>
            </div>`;

        const inp = document.getElementById('r-i');
        inp.focus();
        inp.onclick = () => inp.focus();

        const vocabulary = [
            "YO", "MIC", "CHECK", "ONE", "TWO", "RAP", "FLOW", "BEAT", "DROP", "SICK",
            "FREESTYLE", "RHYME", "LYRIC", "STAGE", "CROWD", "VIBE", "SWAG", "HOMIE",
            "STREET", "FIRE", "BOOM", "BAP", "GOLD", "CHAIN", "DREAM", "NIGHT", "CITY",
            "POWER", "SKILL", "SPEED", "SMOKE", "ICE", "DANCE", "LIGHT", "SOUND", "MUSIC",
            "CHAMP", "IDOL", "STAR", "DEBUT", "SUNNY", "BRIGHT", "GLOW", "LEGEND", "STYLE",
            "PERFECT", "TIMING", "RHYTHM", "PASSION", "ENERGY", "VOICE", "HEART", "SOUL"
        ];
        
        const pool = vocabulary.filter(w => w.length >= params.wordLen[0] && w.length <= params.wordLen[1]);
        if(pool.length === 0) pool.push("RAP"); 

        let curTargetString = "", n = 0, time = 150; 
        const maxTime = 150; 
        const totalRounds = 6;

        const generateTarget = () => {
            let numWords = 1;
            const diffInfo = document.getElementById('minigame-info').innerText;
            if (diffInfo.includes("MEDIUM")) numWords = Math.random() < 0.5 ? 2 : 1;
            else if (diffInfo.includes("HARD")) numWords = 2;
            else if (diffInfo.includes("EXTREME")) numWords = 3;
            else if (diffInfo.includes("NIGHTMARE")) numWords = Math.random() < 0.5 ? 3 : 4;

            let words = [];
            for(let i = 0; i < numWords; i++) {
                words.push(pool[Math.floor(Math.random() * pool.length)]);
            }
            return words.join(" ");
        };

        const nextRound = () => {
            if (n >= totalRounds) { Minigame.finish(true, 5); return; }
            curTargetString = generateTarget();
            document.getElementById('r-w').innerText = curTargetString;
            let inp = document.getElementById('r-i');
            inp.value = ""; inp.focus(); 
            n++; time = maxTime; 
        };
        
        document.getElementById('r-i').oninput = (e) => { 
            if (e.target.value.toUpperCase() === curTargetString) {
                document.getElementById('r-w').style.color = "#00b894";
                setTimeout(() => {
                    document.getElementById('r-w').style.color = "#fff";
                    nextRound();
                }, 100);
            } 
        };
        
        nextRound();
        
        Minigame.timer = setInterval(() => {
            if (!Minigame.active || App.paused) return; 
            time -= params.timeDrain; 
            const fill = document.getElementById('rap-timer-fill');
            if (fill) {
                let displayPercent = (time / maxTime) * 100;
                fill.style.width = displayPercent + "%";
                fill.style.background = displayPercent < 30 ? "#ff4757" : "#feca57";
            }
            if (time <= 0) Minigame.finish(false, 0);
        }, 50);
    },

    gym: (c, params) => {
        const { cv, ctx, w, h } = Minigame.initCanvas(c);
        
        // Tính toán kích thước thanh bar theo chiều ngang màn hình
        const barW = w * 0.8; // Thanh bar chiếm 80% chiều ngang
        const barH = h * 0.15; // Cao 15% màn hình
        const barX = (w - barW) / 2; // Căn giữa
        const barY = h / 2 - barH / 2;

        let cursorX = 0;       
        let speed = params.barSpeed * (w / 600); // Scale tốc độ
        let direction = 1;     
        let targetW = params.targetW * (w / 600); // Scale vùng xanh
        let targetX = Math.random() * (barW - targetW);
        let round = 0; const maxRounds = 5;

        // Vẽ lại mỗi frame
        Minigame.timer = setInterval(() => {
            if (!Minigame.active) return;
            ctx.fillStyle = "#2d3436"; ctx.fillRect(0, 0, w, h);

            // Text REP
            ctx.fillStyle = "#fff"; 
            ctx.font = `bold ${Math.floor(h*0.08)}px 'Press Start 2P'`; 
            ctx.textAlign = "center";
            ctx.fillText(`REP: ${round}/${maxRounds}`, w/2, barY - 30);

            // Thanh Xám (Nền)
            ctx.fillStyle = "#636e72"; ctx.fillRect(barX, barY, barW, barH);
            
            // Thanh Xanh (Mục tiêu)
            ctx.fillStyle = "#00b894"; ctx.fillRect(barX + targetX, barY, targetW, barH);
            
            // Con trỏ (Trắng)
            ctx.fillStyle = "#fff"; 
            const curW = 8; // Độ dày con trỏ
            ctx.fillRect(barX + cursorX, barY - 10, curW, barH + 20);

            // Di chuyển
            cursorX += speed * direction;
            if (cursorX >= barW - curW || cursorX <= 0) direction *= -1;

        }, 16);

        // Xử lý Input (Space hoặc Touch)
        const checkHit = (e) => {
            if(e) e.preventDefault();
            if(!Minigame.active) return;

            // Kiểm tra trúng
            if (cursorX >= targetX && cursorX <= targetX + targetW) {
                round++;
                if (round > maxRounds) {
                    Minigame.finish(true, 5);
                } else {
                    speed += params.speedInc * (w/600); // Tăng tốc
                    targetW = Math.max(15, targetW - 10); // Nhỏ lại
                    targetX = Math.random() * (barW - targetW); // Random vị trí mới
                }
            } else {
                Minigame.finish(false, 0);
            }
        };

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') checkHit(e);
        });
        cv.ontouchstart = checkHit;
        cv.onmousedown = checkHit;
    }
};