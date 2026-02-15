function resizeGame() {
    const container = document.getElementById('game-container');
    if (!container) return;

    // 1. Cập nhật kích thước thực tế cho các Canvas theo container
    // Hub Map Canvas
    if (HubMap.canvas) {
        HubMap.canvas.width = container.clientWidth;
        HubMap.canvas.height = container.clientHeight;
    }

    // Competition Canvas (Minigame)
    const compCanvas = document.getElementById('compCanvas');
    if (compCanvas) {
        compCanvas.width = compCanvas.parentElement.clientWidth;
        compCanvas.height = compCanvas.parentElement.clientHeight;
    }

    // Rhythm Canvas (Stage)
    const rhythmCanvas = document.getElementById('rhythmCanvas');
    if (rhythmCanvas) {
        rhythmCanvas.width = rhythmCanvas.parentElement.clientWidth;
        rhythmCanvas.height = rhythmCanvas.parentElement.clientHeight;
    }

    // 2. Cập nhật lại biến VIEW trong cấu hình để các object vẽ đúng vị trí
    if (typeof C !== 'undefined') {
        C.VIEW_W = container.clientWidth;
        C.VIEW_H = container.clientHeight;
    }
    
    console.log("Resized to:", container.clientWidth, "x", container.clientHeight);
}


var Joystick = {
    active: false,
    base: null,
    stick: null,
    maxRadius: 35, // Giới hạn di chuyển của cần gạt
    valX: 0, // Giá trị từ -1 đến 1
    valY: 0, // Giá trị từ -1 đến 1
    touchId: null,

    init: () => {
        Joystick.base = document.getElementById('joystick-base');
        Joystick.stick = document.getElementById('joystick-stick');
        
        if (!Joystick.base) return;

        // Sự kiện bắt đầu chạm
        Joystick.base.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Joystick.active = true;
            Joystick.base.classList.add('active');
            Joystick.touchId = e.changedTouches[0].identifier;
            Joystick.handleMove(e.changedTouches[0]);
        }, { passive: false });

        // Sự kiện di chuyển ngón tay
        Joystick.base.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!Joystick.active) return;
            
            // Tìm điểm chạm đúng trong danh sách touches
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === Joystick.touchId) {
                    Joystick.handleMove(e.changedTouches[i]);
                    break;
                }
            }
        }, { passive: false });

        // Sự kiện thả tay
        const endTouch = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === Joystick.touchId) {
                    Joystick.reset();
                    break;
                }
            }
        };
        
        Joystick.base.addEventListener('touchend', endTouch);
        Joystick.base.addEventListener('touchcancel', endTouch);
    },

    handleMove: (touch) => {
        const rect = Joystick.base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Tính khoảng cách từ tâm
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        
        // Tính khoảng cách vector
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Giới hạn trong hình tròn (Clamp)
        if (distance > Joystick.maxRadius) {
            const ratio = Joystick.maxRadius / distance;
            dx *= ratio;
            dy *= ratio;
        }

        // Cập nhật giao diện (di chuyển cái núm)
        Joystick.stick.style.transform = `translate(${dx}px, ${dy}px)`;

        // Tính toán giá trị output (-1 đến 1) để nhân vật di chuyển
        Joystick.valX = dx / Joystick.maxRadius;
        Joystick.valY = dy / Joystick.maxRadius;
    },

    reset: () => {
        Joystick.active = false;
        Joystick.base.classList.remove('active');
        Joystick.stick.style.transform = `translate(0px, 0px)`;
        Joystick.valX = 0;
        Joystick.valY = 0;
        Joystick.touchId = null;
    }
};

// Lắng nghe sự kiện thay đổi kích thước và xoay màn hình
window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', () => {
    // Đợi một chút để trình duyệt cập nhật lại thông số layout rồi mới resize
    setTimeout(resizeGame, 200);
});
window.scrollPicker = (id, direction) => {
    const el = document.getElementById(id);
    if (el) {
        // Cuộn 120px (bằng kích thước container) để qua đúng 4 ô mới
        el.scrollLeft += direction * 120;
    }
};

function initGame() {
    showScreen('title-screen'); 
    resizeGame();
    Joystick.init();
    generateDecor();
}

function generateDecor() {
    DECOR = [];
    for(let i=0; i<60; i++) { 
        let dx = r(C.MAP_W);
        let dy = r(C.MAP_H);
        
        let inRoom = false;
        ROOMS.forEach(rm => {
            if(dx >= rm.x && dx <= rm.x+rm.w && dy >= rm.y && dy <= rm.y+rm.h) {
                inRoom = true;
            }
        });
        
        let rnd = Math.random();
        if (inRoom) {
            if(rnd < 0.3) DECOR.push({ type: 'plant', x: dx, y: dy, color: '#2ecc71', w: 15, h: 20 });
            else if (rnd < 0.5) DECOR.push({ type: 'lamp', x: dx, y: dy, color: '#f1c40f', w: 10, h: 30 });
        } else {
             if(rnd < 0.15) DECOR.push({ type: 'tree', x: dx, y: dy, color: '#10ac84', w: 30, h: 50 });
            else if (rnd < 0.35) DECOR.push({ type: 'flower', x: dx, y: dy, color: '#e056fd', w: 30, h: 40 });
            else if (rnd < 0.45) DECOR.push({ type: 'rock', x: dx, y: dy, color: '#636e72', w: 20, h: 15 });
        }
    }
}

function generateNPCs() {
    NPCs = [];
    const sourceNames = [
        "Adam","Alex","Ben","Brian","Chris","Daniel","David","Dylan","Ethan","Evan",
        "Felix","Harry","Jack","James","Jason","John","Kevin","Leo","Lucas","Mark",
        "Max","Michael","Noah","Oliver","Oscar","Paul","Ryan","Sam","Tom","William",
        "Aiden","Ash","Axel","Blaze","Cody","Drake","Eli","Finn","Hunter","Jax",
        "Kai","Kian","Milo","Nico","Orion","Ryder","Zane","Zion","Ace",
        "Akira","Haru","Hiro","Isamu","Ken","Ren","Riku","Sora","Taiga","Yuki",
        "Jin","Joon","Min","Taeyang","Hoon","Dong","Woo","Sung","Hyun","Seok",
        "Chen","Liang","Ming","Tao","Wei","Yun",
        "Arthur","Benedict","Calvin","Cedric","Damian","Edgar","Hugo","Isaac",
        "Julian","Leonard","Marcus","Nathan","Sebastian","Victor",
        "Blade","Crow","Dante","Echo","Hawk","Raven","Storm","Wolf"
    ];

    let shuffledNames = [...sourceNames].sort(() => 0.5 - Math.random());

    for(let i=0; i<29; i++) {
        let n = i < shuffledNames.length ? shuffledNames[i] : "Trainee " + i;
        let role = Math.random()<0.33?'Vocal':(Math.random()<0.5?'Dance':'Rap');
        
        NPCs.push({
            id:i, name:n, role:role,
            stats: {
                vocal: 20 + r(40), 
                dance: 20 + r(40), 
                rap: 20 + r(40), 
                visual: 10 + r(60), 
                charisma: 10 + r(60)
            },
            totalVote:0, eliminated:false, relationship:0,
            x:r(C.MAP_W), y:r(C.MAP_H), vx:(Math.random()-0.5)*2, vy:(Math.random()-0.5)*2,
            skin: PALETTES.skin[r(PALETTES.skin.length)], 
            hair: PALETTES.hair[r(PALETTES.hair.length)], 
            eye: '#000',
            shirt: `hsl(${Math.random()*360}, 75%, 60%)`
        });
    }
}

var Game = {    
    startCreation: () => {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!BGM.ctx) BGM.ctx = new AC();
        if (BGM.ctx.state === 'suspended') BGM.ctx.resume();
        BGM.enabled = true;
        Game.reset();
        
        const d = document.getElementById('stats-inputs'); d.innerHTML='';
        let tPool=100;
        let tStats = {...Player.stats};
        
        // Tìm hàm renderPicker trong Game.startCreation và thay thế:
        const renderPicker = (type, colors) => {
            const el = document.getElementById(`picker-${type}`);
            if (!el) return;

            // CHỈ TẠO NÚT NẾU CHƯA CÓ (Tránh re-render gây giật)
            if (el.children.length === 0) {
                colors.forEach(c => {
                    const b = document.createElement('div');
                    b.className = 'color-btn';
                    b.style.backgroundColor = c;
                    
                    // Gán dữ liệu màu vào nút để dễ tìm sau này
                    b.dataset.color = c; 

                    b.onclick = () => {
                        // Cập nhật dữ liệu
                        Player[type] = c;
                        
                        // Cập nhật giao diện (chỉ đổi class active, không vẽ lại)
                        updatePickerActiveState(type, c);
                        
                        // Vẽ lại nhân vậtFa
                        Game.drawPreview();
                    };
                    el.appendChild(b);
                });
            }
            
            // Luôn cập nhật trạng thái active mỗi khi gọi hàm
            updatePickerActiveState(type, Player[type] || colors[0]);
        };
        const updatePickerActiveState = (type, selectedColor) => {
            const el = document.getElementById(`picker-${type}`);
            if (!el) return;

            // Lặp qua tất cả các nút con
            Array.from(el.children).forEach(btn => {
                // So sánh màu của nút với màu đang chọn
                // Lưu ý: style.backgroundColor trả về RGB, nên so sánh tương đối
                if (btn.dataset.color === selectedColor) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        };
        renderPicker('skin', PALETTES.skin);
        renderPicker('hair', PALETTES.hair);
        renderPicker('shirt', PALETTES.shirt);
        Game.drawPreview(); 

        Object.keys(Player.stats).forEach(k => {
            if(k==='stamina') return;
            d.innerHTML += `<div class="stat-row">
                <span class="stat-label" style="flex: 1;">${k.toUpperCase()}</span>
                <div class="stat-controls">
                    <button onclick="ms('${k}',-5)">-</button>
                    <span class="stat-val" id="v-${k}">${tStats[k]}</span>
                    <button onclick="ms('${k}',5)">+</button>
                </div>
            </div>`;
        });
        window.ms = (k,v) => {
            if(v>0 && tPool<v) return; if(v<0 && tStats[k]<=0) return;
            tStats[k]+=v; tPool-=v;
            document.getElementById(`v-${k}`).innerText = tStats[k];
            document.getElementById('pool-points').innerText = tPool;
            Player.stats = tStats; 
        };
        
        showScreen('create-screen');
        setTimeout(() => {
            Game.drawPreview();
        }, 100);
    },

    drawPreview: () => {
        const canvas = document.getElementById('char-preview');
        if (!canvas) return;

        // 1. Lấy kích thước hiển thị thực tế của thẻ canvas
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        const ctx = canvas.getContext('2d');
        
        // 2. Sử dụng màu đã chọn, hoặc màu mặc định nếu chưa có
        const skin = Player.skin || PALETTES.skin[0];
        const hair = Player.hair || PALETTES.hair[0];
        const shirt = Player.shirt || PALETTES.shirt[0];

        const x = canvas.width / 2;
        const y = canvas.height / 2 + 5; // Dịch xuống xíu cho cân
        // Tự tính tỉ lệ scale (s) dựa trên chiều cao canvas
        const s = Math.floor(canvas.height / 32); 

        // --- BẮT ĐẦU VẼ (Thứ tự lớp quan trọng!) ---

        // Lớp 1: Bóng & Thân
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.beginPath(); ctx.ellipse(x, y + (5*s), 6*s, 3*s, 0, 0, Math.PI * 2); ctx.fill(); // Bóng

        ctx.fillStyle = "#2c3e50"; // Chân
        ctx.fillRect(x - 3*s, y + 4*s, 2.5*s, 4*s);
        ctx.fillRect(x + 0.5*s, y + 4*s, 2.5*s, 4*s);

        ctx.fillStyle = shirt; // Áo
        ctx.fillRect(x - 4*s, y - 2*s, 8*s, 7*s);

        // Lớp 2: Đầu & Tay
        ctx.fillStyle = skin;
        ctx.fillRect(x - 6*s, y - 1*s, 2*s, 5*s); // Tay trái
        ctx.fillRect(x + 4*s, y - 1*s, 2*s, 5*s); // Tay phải
        ctx.fillRect(x - 5*s, y - 11*s, 10*s, 10*s); // Đầu

        // Lớp 3: MẮT (Vẽ trước tóc để không bị che)
        ctx.fillStyle = "#fff";
        ctx.fillRect(x - 3*s, y - 7*s, 2.5*s, 3*s);
        ctx.fillRect(x + 1*s, y - 7*s, 2.5*s, 3*s);
        
        ctx.fillStyle = "#000";
        ctx.fillRect(x - 2*s, y - 6*s, 1*s, 2*s);
        ctx.fillRect(x + 2*s, y - 6*s, 1*s, 2*s);

        // Lớp 4: TÓC (Vẽ cuối cùng)
        ctx.fillStyle = hair;
        ctx.fillRect(x - 6*s, y - 13*s, 12*s, 4*s); // Mái trên
        ctx.fillRect(x - 6*s, y - 11*s, 2*s, 7*s);  // Tóc mai trái
        ctx.fillRect(x + 4*s, y - 11*s, 2*s, 7*s);  // Tóc mai phải
    },
    
    reset: () => {
        App.day = 1; App.isGameOver = false;
        Player.totalVote = 0;
        Player.teamwork = 20;
        Player.stats = {dance:20,vocal:20,rap:20,visual:20,charisma:20,stamina:50};
    },

    toggleMusicSource: (type) => {
        const fileArea = document.getElementById('source-file-area');
        const urlArea = document.getElementById('source-url-area');
        const btnFile = document.getElementById('tab-file');
        const btnUrl = document.getElementById('tab-url');

        if (type === 'file') {
            fileArea.style.display = 'block';
            urlArea.style.display = 'none';
            btnFile.style.background = '#2f3542'; btnFile.style.color = '#fff';
            btnUrl.style.background = '#ccc'; btnUrl.style.color = '#000';
        } else {
            fileArea.style.display = 'none';
            urlArea.style.display = 'block';
            btnFile.style.background = '#ccc'; btnFile.style.color = '#000';
            btnUrl.style.background = '#2f3542'; btnUrl.style.color = '#fff';
        }
    },

    // Xử lý khi chọn file từ máy
    handleSongUpload: (input) => {
        const file = input.files[0];
        if (file) {
            // Tạo URL ảo cho file vừa chọn
            const objectUrl = URL.createObjectURL(file);
            Game.previewSong(objectUrl, file.name);
        }
    },

    // Xử lý khi nhập Link
    loadSongFromUrl: () => {
        const url = document.getElementById('song-url-input').value;
        if (url && url.length > 5) {
            Game.previewSong(url, "Linked Song");
        } else {
            alert("Please enter a valid URL!");
        }
    },

    // Hàm chung để xử lý nhạc sau khi có nguồn
    previewSong: (src, name) => {
        // Hiển thị tên bài hát
        const display = document.getElementById('song-name-display');
        display.innerText = "SELECTED: " + name;
        
        // Lưu nguồn nhạc vào biến global của Stage
        Stage.audioSource = src; 
        
        // Hiển thị phần chọn Concept
        document.getElementById('concept-selector').style.display = 'block';
        
        // Reset các nút chọn cũ
        document.querySelectorAll('.concept-btn').forEach(b => b.style.background = '#eee');
        document.querySelectorAll('.diff-btn').forEach(b => b.style.background = '#eee');
        document.getElementById('stage-start-btn').style.display = 'none';
    },

    toggleSettings: () => {
        if (App.screen === 'title-screen') return;
        App.paused = !App.paused; 

        const overlay = document.getElementById('settings-overlay');
        
        if (App.paused) {
            overlay.style.display = 'flex';
            Game.updateSettingsUI();

            if (BGM.ctx && BGM.ctx.state === 'running') BGM.ctx.suspend();

            if (App.screen === 'stage-screen' && Stage.audioElement) {
                Stage.audioElement.pause();
            }

        } else {
            overlay.style.display = 'none';
            if (BGM.ctx && BGM.ctx.state === 'suspended') BGM.ctx.resume();

            if (App.screen === 'hub-screen') {
                HubMap.loop(); 
            } 
            else if (App.screen === 'stage-screen') {
                if (Stage.audioElement) {
                    Stage.audioElement.play(); 
                }
            }
        }
    },

    updateSettingsUI: () => {
        const btn = document.getElementById('btn-setting-bgm');
        if (BGM.enabled) {
            btn.innerText = "🔊 BGM ON";
            btn.style.background = "#fff"; btn.style.color = "#2f3542";
        } else {
            btn.innerText = "🔇 BGM OFF";
            btn.style.background = "#aaa"; btn.style.color = "#fff";
        }
        document.getElementById('bgm-toggle').innerText = BGM.enabled ? "🔊 BGM OFF" : "🔇 BGM ON";
    },

    quitToTitle: () => {
        if(confirm("Quit to Title Screen? Unsaved progress will be lost.")) {
            App.paused = false;
            document.getElementById('settings-overlay').style.display = 'none';
            HubMap.stop();
            Stage.run = false; if(Stage.audio) { Stage.audio.pause(); Stage.audio = null; }
            Minigame.exit(); 
            Fireworks.stop(); 
            showScreen('title-screen');
            BGM.stop(); 
        }
    },

    finishCreation: () => {
        const nameInput = document.getElementById('player-name');
        if(nameInput) Player.name = nameInput.value;
        generateNPCs();
        const g = document.getElementById('npc-list-grid'); 
        if(g) {
            g.innerHTML='';
            NPCs.forEach(n => {
                g.innerHTML += `<div class="rank-card" style="height: auto; min-height: 140px;">
                    <div style="width:20px; height:20px; background:${n.skin}; margin:0 auto;">
                        <div style="width:100%; height:6px; background:${n.hair}"></div>
                    </div>
                    <div style="font-weight:bold; margin: 5px 0;">${n.name}</div>
                    <div style="color:#888; font-size:8px; margin-bottom:5px;">${n.role}</div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 2px; font-size: 7px; color: #555; background: #f1f2f6; padding: 4px; border-radius: 4px;">
                        <span>VOC:${n.stats.vocal}</span>
                        <span>DAN:${n.stats.dance}</span>
                        <span>RAP:${n.stats.rap}</span>
                        <span>VIS:${n.stats.visual}</span>
                        <span style="grid-column: span 2; text-align: center;">CHA:${n.stats.charisma}</span>
                    </div>
                </div>`;
            });
        }
        showScreen('npc-intro-screen');
    },

    enterHub: () => { 
        showScreen('hub-screen'); 
        BGM.play('hub'); 
        Notify.show("WELCOME TO IDOL DORM!<br>DAY " + App.day);
    },
    
    checkStageDay: () => {
        if(C.ELIM_DAYS.includes(App.day)) {
            const n = document.getElementById('room-notification');
            
            if ((App.day === 7 || App.day === 14 || App.day === 21) && !App.eventDone) {
                HubMap.stop();
                SpecialEvent.startDraft(); 
                return;
            }
            
            Game.triggerStageSetup();
        }
    },

    nextDay: () => {
        if (App.isGameOver) { Game.showGameOver(); return; }
        if (App.day >= 30) { Game.showWin(); return; }
        
        App.day++; 
        App.eventDone = false; 
        Player.stats.stamina = 50; 
        Game.enterHub();
    },

    // CẬP NHẬT HÀM NÀY TRONG js/game.js
    triggerStageSetup: () => {
        // --- FIX LỖI TRÀN BỘ NHỚ (INFINITE LOOP) ---
        // Thay vì gọi showScreen('hub-screen') (vốn sẽ gọi lại checkStageDay -> tạo vòng lặp),
        // Ta tự tay thao tác DOM để hiện màn hình Hub mà không kích hoạt logic kiểm tra lại.
        
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('hub-screen').classList.add('active');
        App.screen = 'hub-screen';
        
        // Khởi động lại Map nhưng KHÔNG gọi Game.checkStageDay()
        HubMap.start();
        // -------------------------------------------
        
        const n = document.getElementById('room-notification');
        n.style.display='block';
        
        let title = "TEAM BATTLE";
        if (App.day === 30) title = "FINAL DEBUT STAGE";
        
        document.getElementById('room-title').innerText = title;
        document.getElementById('room-desc').innerText = "PREPARE PERFORMANCE";
        document.getElementById('stage-setup-area').style.display='block';
        
        // Ẩn các nút không cần thiết
        document.getElementById('room-action-btn').style.display = 'none'; 
        document.getElementById('room-cancel-btn').style.display='none';
        document.getElementById('stage-start-btn').style.display='none';

        // GÁN TEAMMATES TỪ DRAFT
        if (App.day === 7 || App.day === 14 || App.day === 21) {
            let myTeam = SpecialEvent.teams.find(t => t.members.some(m => m.id === 'p' || (m.isPlayer)));
            
            if (myTeam) {
                Stage.teammates = myTeam.members.filter(m => !m.isPlayer && m.id !== 'p');
            } else {
                Stage.teammates = NPCs.filter(n=>!n.eliminated).sort(()=>0.5-Math.random()).slice(0,4);
            }
        } else {
            if (App.day === 30) Stage.teammates = [];
            else Stage.teammates = NPCs.filter(n=>!n.eliminated).sort(()=>0.5-Math.random()).slice(0,4);
        }
    },

    triggerTeamSelection: () => {
        Stage.retryCount = 0;
        document.getElementById('room-notification').style.display='none';
        
        // NẾU LÀ NGÀY SỰ KIỆN: BỎ QUA BƯỚC CHỌN LẠI TEAM, VÀO THẲNG STAGE
        if (App.day === 7 || App.day === 14 || App.day === 21) {
            // Team đã được gán ở triggerStageSetup rồi
            Stage.realInit();
            return; 
        }

        // NẾU LÀ NGÀY THƯỜNG: Random như cũ
        document.getElementById('team-select-overlay').style.display='flex';
        const c = document.getElementById('team-slots-container'); c.innerHTML='';
        
        // Logic random cũ cho ngày thường
        Stage.teammates = NPCs.filter(n=>!n.eliminated).sort(()=>0.5-Math.random()).slice(0,4);
        
        Stage.teammates.forEach((n,i) => {
            let d = document.createElement('div');
            d.className = 'team-slot'; d.innerHTML='?'; c.appendChild(d);
            setTimeout(() => {
                d.innerHTML=`<div style="width:30px; height:30px; background:${n.skin}; margin:0 auto;"><div style="width:100%; height:8px; background:${n.hair}"></div></div><div style="margin-top:5px; font-weight:bold">${n.name}</div>`;
                d.classList.add('filled');
            }, (i+1)*500);
        });
        setTimeout(() => document.getElementById('start-stage-btn').style.display='block', 2500);
    },

    selectDiff: (level) => {
        App.stageConfig.difficulty = level;
        document.querySelectorAll('.diff-btn').forEach(b => {
            b.style.background = "#fff"; b.style.color = "#2f3542";
        });
        const btn = document.getElementById(`btn-d-${level}`);
        if(btn) { btn.style.background = "#2f3542"; btn.style.color = "#fff"; }
    },

    handleSongUpload: (el) => {
        if(el.files[0]) { 
            App.audioFile = el.files[0]; 
            App.audioName = el.files[0].name;
            const tempAudio = new Audio(URL.createObjectURL(App.audioFile));
            tempAudio.onloadedmetadata = function() {
                App.stageConfig.duration = tempAudio.duration || 180; 
                let durText = Math.floor(App.stageConfig.duration) + "s";
                document.getElementById('song-name-display').innerHTML = `SELECTED: ${App.audioName}<br>(Length: ${durText})`;
                document.getElementById('concept-selector').style.display = 'block';
                document.getElementById('stage-start-btn').style.display = 'block';
                Game.selectConcept('dance');
                Game.selectDiff('medium');
            };
        }
    },

    selectConcept: (type) => {
        App.stageConfig.concept = type;
        document.querySelectorAll('.concept-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById(`btn-c-${type}`).classList.add('selected');
    },
    
    startPractice: (type) => {
        if(Player.stats.stamina<10) { Notify.show("NO STAMINA! GO TO DORM."); return; }
        Player.stats.stamina-=10; updateUI(); Minigame.start(type);
    },

    rest: () => { Player.stats.stamina=50; Notify.show("RESTED!"); Game.simDay(); },

    // Chuyển hướng sang màn hình Reveal thay vì End luôn
    finishStageDay: () => {
        document.getElementById('stage-detail-overlay').style.display='none';
        
        // Nếu là ngày sự kiện (7, 14, 21): Vào màn hình công bố điểm đội
        if (App.day === 7 || App.day === 14 || App.day === 21) {
            Game.showTeamReveal();
        } 
        // Nếu ngày thường hoặc ngày 30: Vào thẳng tổng kết cá nhân
        else {
            Game.showDaySummary();
        }
    },

    // 2. HÀM MỚI: HIỂN THỊ ĐIỂM ĐỘI CHẠY CHẠY (Team Reveal)
    showTeamReveal: () => {
        showScreen('team-reveal-screen');
        const list = document.getElementById('team-reveal-list');
        list.innerHTML = '';
        document.getElementById('btn-reveal-next').style.display = 'none';

        // Lấy danh sách team từ sự kiện
        let teams = SpecialEvent.teams;
        
        // Cập nhật điểm Stage cho đội của người chơi (Để hiển thị chính xác tổng điểm hôm nay)
        let myTeam = teams.find(t => t.members.some(m => m.id === 'p'));
        if (myTeam) {
            // Điểm team hôm nay = Điểm Minigame + Điểm Bonus + Điểm Stage (của Player đại diện)
            // Lưu ý: Đây là điểm hiển thị cho vui, còn điểm thực tế đã cộng vào Player.totalVote rồi
            // Ta cộng thêm Stage Score vào để team mình trông "khủng" hơn
            myTeam.eventScore += Math.floor(Stage.lastTotalScore); 
        }

        // Tạo dữ liệu điểm ảo cho các đội khác để tạo kịch tính
        // Yêu cầu: Random > 15,000 + Bonus
        teams.forEach(t => {
            if (!t.members.some(m => m.id === 'p')) {
                // Đội máy: Random điểm Stage giả (15k - 25k) + Điểm sự kiện cũ
                let fakeStageScore = 15000 + Math.floor(Math.random() * 10000);
                t.finalDailyScore = t.eventScore + fakeStageScore; 
            } else {
                // Đội mình
                t.finalDailyScore = t.eventScore; // eventScore lúc này đã bao gồm StageScore cộng ở trên
            }
        });

        // Sắp xếp lại theo điểm tổng ngày hôm nay
        teams.sort((a,b) => b.finalDailyScore - a.finalDailyScore);

        // Render HTML
        teams.forEach((t, i) => {
            let isMyTeam = t.members.some(m => m.id === 'p');
            let div = document.createElement('div');
            div.className = `team-score-bar ${isMyTeam ? 'my-team' : ''}`;
            div.innerHTML = `
                <div class="ts-rank">#${i+1}</div>
                <div class="ts-name">TEAM ${t.leader.name.split(' ')[0]}</div>
                <div class="ts-val" id="ts-val-${i}">0</div>
                <div class="ts-fill" id="ts-fill-${i}"></div>
            `;
            list.appendChild(div);

            // Animation số chạy
            setTimeout(() => {
                div.classList.add('revealed');
                // Chạy thanh fill
                let percent = Math.min(100, (t.finalDailyScore / 40000) * 100); // 40k là max ước lượng
                document.getElementById(`ts-fill-${i}`).style.width = `${percent}%`;
                
                // Chạy số
                Game.animateValue(`ts-val-${i}`, 0, t.finalDailyScore, 2000);
            }, i * 200); // Delay từng dòng cho kịch tính
        });

        // Hiện nút Next sau khi chạy xong
        setTimeout(() => {
            document.getElementById('btn-reveal-next').style.display = 'block';
        }, teams.length * 200 + 2000);
    },

    // Hàm phụ trợ: Chạy số
    animateValue: (id, start, end, duration) => {
        let obj = document.getElementById(id);
        let range = end - start;
        let minTimer = 50;
        let stepTime = Math.abs(Math.floor(duration / (range / 100))); // Chạy nhảy cóc cho nhanh
        stepTime = Math.max(stepTime, minTimer);
        let startTime = new Date().getTime();
        let endTime = startTime + duration;
        let timer;
      
        function run() {
            let now = new Date().getTime();
            let remaining = Math.max((endTime - now) / duration, 0);
            let value = Math.round(end - (remaining * range));
            obj.innerHTML = formatNum(value);
            if (value == end) {
                clearInterval(timer);
            }
        }
        
        timer = setInterval(run, stepTime);
        run();
    },

    // 3. HÀM MỚI: TỔNG KẾT CÁ NHÂN (Day Summary)
    showDaySummary: () => {
        showScreen('day-summary-screen');
        
        // 1. Lấy các đầu điểm
        let sGame = App.compScore || 0;         // Điểm chơi Minigame (Ném giày, bắt gà...)
        let sBonus = App.lastEventBonus || 0;   // Điểm thưởng hạng Nhất/Nhì...
        let sStage = Math.floor(Stage.lastTotalScore || 0); // Điểm nhảy Audition
        
        // 2. Tính tổng
        let sTotal = sGame + sBonus + sStage;

        // 3. [QUAN TRỌNG] CỘNG TẤT CẢ VÀO TỔNG PHIẾU BẦU CỦA NGƯỜI CHƠI
        Player.totalVote += sTotal;

        // 4. Cộng Fan (Chỉ tính dựa trên màn trình diễn Stage như cũ)
        let fanMultiplier = 1 + (Player.stats.visual / 100);
        let stageFans = Math.floor((sStage / 100) * fanMultiplier);
        Player.fans += stageFans;

        // 5. Reset biến tạm
        App.compScore = 0;
        App.lastEventBonus = 0; 

        // 6. Hiển thị ra màn hình
        document.getElementById('sum-game').innerText = "+" + formatNum(sGame);
        document.getElementById('sum-bonus').innerText = "+" + formatNum(sBonus);
        document.getElementById('sum-stage').innerText = "+" + formatNum(sStage);
        
        // Hiệu ứng số tổng chạy tăng dần cho sướng mắt
        Game.animateValue('sum-total', 0, sTotal, 1500);
    },

    // 4. HÀM MỚI: KẾT THÚC NGÀY (Nối vào logic cũ)
    finalizeDay: () => {
        // --- KIỂM TRA NGÀY 30 ---
        if (App.day === 30) {
            showScreen('heart-game-screen');
            document.getElementById('heart-start-overlay').style.display = 'flex';
        } else {
            Game.simDay(); // Tính toán xếp hạng toàn server
        }
    },

    simDay: () => {
        if(C.ELIM_DAYS.includes(App.day)) {
            showScreen('result-screen'); 
            Game.renderRank();
            return;
        }

        let totalStats = Player.stats.vocal + Player.stats.dance + Player.stats.rap + Player.stats.visual + Player.stats.charisma;
        let statScore = Math.floor(totalStats * (3.0 + Math.random())); 
        let fanScore = Math.floor(Player.fans / 2); 

        let relScore = 0;
        NPCs.forEach(n => relScore += (n.relationship || 0));
        if (relScore < 0) relScore = 0; 
        relScore = relScore * 10;

        let playerViral = 0;
        if (Math.random() < 0.05) { 
            playerViral = 5000 + Math.floor(Math.random() * 5000);
            Notify.show("⭐ YOU WENT VIRAL TODAY! ⭐\n(HUGE VOTE BOOST)");
        }

        let dailyGain = statScore + fanScore + relScore + playerViral;
        Player.totalVote += dailyGain;

        let sortedNPCs = [...NPCs].sort((a, b) => b.totalVote - a.totalVote);

        NPCs.forEach(n => { 
            if(!n.eliminated) {
                let npcStats = n.stats.vocal + n.stats.dance + n.stats.rap + n.stats.visual + n.stats.charisma;
                let skillGain = Math.floor(npcStats * (2.0 + Math.random() * 2.0));
                let momentumGain = Math.floor(n.totalVote * (0.08 + Math.random() * 0.04));

                let rankIndex = sortedNPCs.indexOf(n);
                let rankBonus = 0;
                if (rankIndex === 0) rankBonus = 5000 + Math.floor(Math.random() * 3000);
                else if (rankIndex < 3) rankBonus = 3000 + Math.floor(Math.random() * 2000);
                else if (rankIndex < 7) rankBonus = 1500 + Math.floor(Math.random() * 1000);
                else rankBonus = 200 + Math.floor(Math.random() * 300);

                let viralBonus = 0;
                if (Math.random() < 0.03) viralBonus = 10000 + Math.floor(Math.random() * 10000);

                let totalNPCGain = skillGain + momentumGain + rankBonus + viralBonus;

                if (rankIndex < 10 && n.totalVote < Player.totalVote) {
                    totalNPCGain = Math.floor(totalNPCGain * 1.5);
                }
                n.totalVote += totalNPCGain;
            }
        });

        showScreen('result-screen'); 
        Game.renderRank();
    },

    renderRank: () => {
        let all = [...NPCs, {...Player, id:'p', isPlayer:true}].sort((a,b)=>b.totalVote-a.totalVote);
        const l = document.getElementById('ranking-list'); l.innerHTML='';
        let elim = 0;
        if(C.ELIM_DAYS.includes(App.day)) {
            elim = App.day===7?6:(App.day===14?4:(App.day===21?4:0));
            if(elim>0) {
                document.getElementById('elimination-msg').style.display='block';
                document.getElementById('elimination-msg').innerText = `ELIMINATION: BOTTOM ${elim} LEAVE!`;
            }
        } else document.getElementById('elimination-msg').style.display='none';

        let active = all.filter(t=>!t.eliminated);
        let cutoff = active.length - elim;

        all.forEach((t, i) => {
            let d = document.createElement('div'); d.className='rank-card';
            if(t.isPlayer) d.classList.add('player');
            if(t.eliminated) d.classList.add('eliminated');
            
            if(elim > 0 && !t.eliminated && active.indexOf(t) >= cutoff) {
                d.style.borderColor='red'; d.innerHTML += '<div style="color:red; font-size:8px; font-weight:bold">ELIM</div>';
                if(t.isPlayer) App.isGameOver=true; else NPCs.find(n=>n.id===t.id).eliminated=true;
            }
            if(App.day===30 && !t.eliminated && active.indexOf(t)<5) {
                 d.style.borderColor='gold'; d.innerHTML += '<div style="color:gold; font-size:8px">DEBUT</div>';
            }

            d.innerHTML += `<div class="rank-num">#${i+1}</div><b>${t.name}</b><br>${formatNum(t.totalVote)}`;
            l.appendChild(d);
        });
    },

    showGameOver: () => {
        let all = [...NPCs, {...Player, id:'p'}].sort((a,b)=>b.totalVote-a.totalVote);
        let rank = all.findIndex(t => t.id === 'p') + 1;
        document.getElementById('go-days').innerText = App.day + " Days";
        document.getElementById('go-rank').innerText = "#" + rank;
        document.getElementById('go-votes').innerText = Player.totalVote.toLocaleString();
        showScreen('game-over-screen');
    },

    showWin: () => {
        showScreen('win-screen');
        BGM.play('hub'); 
        Fireworks.init();

        let all = [...NPCs, {...Player, id:'p'}].sort((a,b) => b.totalVote - a.totalVote);
        let debutGroup = all.slice(0, 7);

        document.getElementById('py-row-1').innerHTML = '';
        document.getElementById('py-row-2').innerHTML = '';
        document.getElementById('py-row-3').innerHTML = '';

        const createCardHTML = (t, rank) => {
            let rankClass = "rank-normal";
            if (rank === 1) rankClass = "rank-1";
            else if (rank === 2) rankClass = "rank-2";
            else if (rank === 3) rankClass = "rank-3";

            return `
            <div class="debut-card ${rankClass}">
                <div class="debut-badge">${rank}</div>
                <div class="debut-avatar" style="background:${t.skin}; position:relative;">
                    <div style="width:100%; height:25%; background:${t.hair}; position:absolute; top:0;"></div>
                </div>
                <div style="font-size:${rank===1?'10px':'8px'}; font-weight:bold; color:#2f3542; margin-bottom:2px;">
                    ${t.name}
                </div>
                <div style="font-size:6px; color:#ff6b81; font-weight:bold;">
                    ${formatNum(t.totalVote)}
                </div>
            </div>`;
        };

        if(debutGroup[0]) document.getElementById('py-row-1').innerHTML += createCardHTML(debutGroup[0], 1);
        if(debutGroup[1]) document.getElementById('py-row-2').innerHTML += createCardHTML(debutGroup[1], 2);
        if(debutGroup[2]) document.getElementById('py-row-2').innerHTML += createCardHTML(debutGroup[2], 3);
        for(let i=3; i<7; i++) {
            if(debutGroup[i]) document.getElementById('py-row-3').innerHTML += createCardHTML(debutGroup[i], i+1);
        }
    },
    
    nextDay: () => {
        if (App.isGameOver) { 
            Game.showGameOver();
            return; 
        }
        
        if (App.day >= 30) { 
            Game.showWin(); 
            return; 
        }
        
        App.day++; 
        Player.stats.stamina = 50; 
        Game.enterHub();
    },

    triggerInteraction: (npc) => {
        HubMap.run = false;
        document.getElementById('interaction-modal').style.display = 'block';
        document.getElementById('dialogue-npc-name').innerText = npc.name;

        // Uses DIALOGUE_LIB from data.js
        const rIndex = Math.floor(Math.random() * DIALOGUE_LIB.length);
        const chatData = DIALOGUE_LIB[rIndex];
        
        document.getElementById('dialogue-text').innerText = chatData.text;
        const optsContainer = document.getElementById('dialogue-options'); 
        optsContainer.innerHTML = '';

        let shuffledOptions = chatData.options.map((text, index) => {
            return { text: text, originalIndex: index }; 
        });
        shuffledOptions.sort(() => Math.random() - 0.5);

        shuffledOptions.forEach((opt) => {
            let b = document.createElement('button');
            b.innerText = opt.text;
            b.style.display = 'block'; 
            b.style.width = '100%'; 
            b.style.marginTop = '5px';

            b.onclick = () => {
                // 1. Xử lý logic điểm số (Giữ nguyên logic cũ của bạn)
                if (opt.originalIndex === 0) {
                    RelManager.update(npc, 5);
                    Player.teamwork += 0.5;
                    let fanBonus = 50 + Player.stats.charisma;
                    Player.fans += fanBonus;
                    Notify.show(`👍 ${npc.name.split(' ')[0]} liked that! (+5 Rel, +0.5 Team)`);
                } else if (opt.originalIndex === 2) {
                    RelManager.update(npc, -5);
                    Player.teamwork -= 0.5;
                    let fanBonus = -50;
                    Player.fans += fanBonus;
                    let label = RelManager.getStatusLabel(npc.relationship);
                    Notify.show(`👎 ${npc.name.split(' ')[0]} disappointed... (-3 Rel, -0.5 Team)`);
                } else {
                    Notify.show("😐 Just a normal conversation.");
                }

                updateUI(); // Cập nhật giao diện điểm số

                // 2. [QUAN TRỌNG] Đóng bảng hội thoại ngay lập tức
                // Gọi hàm closeInteraction của HubMap thay vì tự ẩn thủ công để đảm bảo logic chạy lại
                if (typeof HubMap !== 'undefined' && HubMap.closeInteraction) {
                    HubMap.closeInteraction(); 
                } else {
                    // Fallback nếu HubMap chưa load kịp (dù hiếm khi xảy ra)
                    document.getElementById('interaction-modal').style.display = 'none';
                    if (typeof HubMap !== 'undefined') {
                        HubMap.run = true; 
                        HubMap.loop();
                    }
                }
            };
            optsContainer.appendChild(b);
        });
    },

    showRelList: () => {
        HubMap.run = false;
        const grid = document.getElementById('rel-list-grid');
        grid.innerHTML = '';
        let sortedNPCs = [...NPCs].sort((a, b) => (b.relationship || 0) - (a.relationship || 0));

        sortedNPCs.forEach(n => {
            let score = n.relationship || 0;
            let statusText = (typeof RelManager !== 'undefined') ? RelManager.getStatusLabel(score) : "UNKNOWN";
            let scoreColor = score >= 0 ? '#ff4757' : '#57606f'; 

            grid.innerHTML += `
            <div class="rel-card">
                <div style="width:20px; height:20px; background:${n.skin}; margin:0 auto 5px;">
                    <div style="width:100%; height:6px; background:${n.hair}"></div>
                </div>
                <div style="font-weight:bold; font-size:9px; margin-bottom:5px;">${n.name}</div>
                <div class="rel-score" style="color:${scoreColor}">${score > 0 ? '+' : ''}${score}</div>
                <div class="rel-status">${statusText}</div>
            </div>`;
        });
        document.getElementById('rel-screen').style.display = 'flex';
    },

    closeRelList: () => {
        document.getElementById('rel-screen').style.display = 'none';
        HubMap.run = true; 
        HubMap.loop();
    },

    
};

window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        Game.toggleSettings();
    }
});

initGame();

document.addEventListener('DOMContentLoaded', () => {
    const statsBox = document.getElementById('hub-stats-display');
    if (statsBox) {
        // Tạo biến trạng thái
        statsBox.dataset.expanded = "false";
        
        // Thêm sự kiện click để mở rộng/thu gọn
        statsBox.onclick = () => {
            const isExpanded = statsBox.dataset.expanded === "true";
            const children = statsBox.querySelectorAll('div');
            
            if (isExpanded) {
                // Thu gọn: Ẩn các chỉ số chi tiết
                children.forEach((el, index) => {
                    // Giữ lại Tên (0), Ngày (1), và Fan (last)
                    if (index > 1 && index < children.length - 1) el.style.display = 'none';
                });
                statsBox.dataset.expanded = "false";
                statsBox.style.opacity = "0.8"; // Mờ đi
            } else {
                // Mở rộng: Hiện tất cả
                children.forEach(el => el.style.display = 'block');
                statsBox.dataset.expanded = "true";
                statsBox.style.opacity = "1"; // Rõ lên
            }
        };
        
        // Mặc định chạy 1 lần để thu gọn lúc đầu
        statsBox.click(); 
    }
});