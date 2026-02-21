var SongDraft = {
    currentSongs: [],
    audioTemp: null,
    playingIdx: -1, // Lưu trạng thái nút nào đang phát

    startPhase: () => {
        if (typeof HubMap !== 'undefined') HubMap.stop();
        
        // Lọc bài chưa chơi
        let availableSongs = SONG_DB.filter(s => !App.usedSongs.includes(s.id));
        
        // Nếu lỡ hết bài hát trong kho (chơi quá nhiều vòng), reset lại kho
        if (availableSongs.length < 5) {
            App.usedSongs = [];
            availableSongs = [...SONG_DB];
        }

        // Random lấy 5 bài
        SongDraft.currentSongs = availableSongs.sort(() => 0.5 - Math.random()).slice(0, 5);
        SongDraft.currentSongs.forEach(s => App.usedSongs.push(s.id));

        SongDraft.showPreviewUI();
    },

    showPreviewUI: () => {
        const overlay = document.getElementById('song-draft-overlay');
        const list = document.getElementById('draft-song-list');
        const title = document.querySelector('.draft-header h1');
        const desc = document.querySelector('.draft-header p');
        const nextBtn = document.getElementById('btn-to-minigame');

        if (title) title.innerText = t("song_preview");
        if (desc) desc.innerHTML = t("song_preview_desc");
        if (nextBtn) {
            nextBtn.innerText = t("song_preview_next");
            nextBtn.style.display = 'block';
        }
        list.innerHTML = ''; // Xóa rác cũ

        SongDraft.currentSongs.forEach((song, idx) => {
            let card = document.createElement('div');
            card.className = 'song-card';
            card.innerHTML = `
                <div>
                    <div class="song-title">${song.name}</div>
                    <div class="song-concept">${song.concept.toUpperCase()}</div>
                </div>
                <button id="btn-play-${idx}" class="play-preview-btn" onclick="SongDraft.playSnippet(${idx})">▶ ${t("play_30s")}</button>
            `;
            list.appendChild(card);
        });

        overlay.style.display = 'flex';

        // Nút NEXT chuyển sang Minigame
        document.getElementById('btn-to-minigame').onclick = () => {
            if (SongDraft.audioTemp) {
                SongDraft.audioTemp.pause();
                SongDraft.audioTemp = null;
            }
            overlay.style.display = 'none';
            
            // Bắt đầu Event Minigame phân định thứ tự
            SpecialEvent.startDraft(); 
        };
    },

    playSnippet: (idx) => {
        // Nếu bấm lại chính nút đang phát -> Tắt nhạc
        if (SongDraft.playingIdx === idx && SongDraft.audioTemp && !SongDraft.audioTemp.paused) {
            SongDraft.audioTemp.pause();
            document.getElementById(`btn-play-${idx}`).innerText = `▶ ${t("play_30s")}`;
            document.getElementById(`btn-play-${idx}`).classList.remove('playing');
            SongDraft.playingIdx = -1;
            return;
        }

        // Tắt nhạc cũ nếu đang phát bài khác
        if (SongDraft.audioTemp) {
            SongDraft.audioTemp.pause();
            if (SongDraft.playingIdx !== -1) {
                let oldBtn = document.getElementById(`btn-play-${SongDraft.playingIdx}`);
                if (oldBtn) {
                    oldBtn.innerText = `▶ ${t("play_30s")}`;
                    oldBtn.classList.remove('playing');
                }
            }
        }

        const song = SongDraft.currentSongs[idx];
        const btn = document.getElementById(`btn-play-${idx}`);

        if (song.url) {
            SongDraft.audioTemp = new Audio(song.url);
            
            // Tua đến đoạn giữa bài (ví dụ giây 60), tuỳ bạn chỉnh
            SongDraft.audioTemp.currentTime = 60; 
            SongDraft.audioTemp.play().catch(e => {
                console.error("Audio error:", e);
                Notify.show(t("cannot_load_audio"));
            });

            btn.innerText = `⏸ ${t("stop")}`;
            btn.classList.add('playing');
            SongDraft.playingIdx = idx;

            // Tự tắt sau 30 giây
            setTimeout(() => {
                if (SongDraft.audioTemp && SongDraft.playingIdx === idx) {
                    SongDraft.audioTemp.pause();
                    btn.innerText = `▶ ${t("play_30s")}`;
                    btn.classList.remove('playing');
                    SongDraft.playingIdx = -1;
                }
            }, 30000);
        }
    },

    processSelection: (teamsList) => {
        // Hàm này sẽ chạy sau khi Minigame kết thúc (như hướng dẫn ở phần trước)
        let availableSongs = [...SongDraft.currentSongs];
        let myTeamPickedSong = null;

        teamsList.forEach(team => {
            let isPlayerTeam = team.members.some(m => m.id === 'p' || m.isPlayer);
            
            if (isPlayerTeam) {
                myTeamPickedSong = availableSongs[0]; 
                availableSongs.shift();
                Notify.show(t("team_picked", { name: myTeamPickedSong.name }));
            } else {
                let pickedIndex = Math.floor(Math.random() * availableSongs.length);
                let pickedSong = availableSongs[pickedIndex];
                team.song = pickedSong;
                availableSongs.splice(pickedIndex, 1);
            }
        });

        if (myTeamPickedSong) {
            // TẠO OBJECT FILE ẢO TỪ URL LOCAL ĐỂ ĐẨY VÀO HỆ THỐNG STAGE CŨ
            fetch(myTeamPickedSong.url)
                .then(res => res.blob())
                .then(blob => {
                    App.audioFile = new File([blob], myTeamPickedSong.name + ".mp3", { type: "audio/mp3" });
                    App.audioName = myTeamPickedSong.name;
                    App.stageConfig.concept = myTeamPickedSong.concept;
                    App.eventDone = true;
                    Game.triggerStageSetup();
                })
                .catch(err => {
                    console.error("Fetch local audio error:", err);
                    Notify.show(t("error_loading_stage_audio"));
                });
        }
    },

    startDraft: (teams) => {
        const overlay = document.getElementById('song-draft-overlay');
        if (overlay) overlay.style.display = 'flex';

        // Dùng chính danh sách đã preview trước minigame; fallback nếu thiếu dữ liệu
        if (SongDraft.currentSongs && SongDraft.currentSongs.length) {
            SongDraft.pool = SongDraft.currentSongs.map(s => ({ ...s, pickedBy: null }));
        } else {
            SongDraft.pool = [...SONG_DB].sort(() => 0.5 - Math.random()).slice(0, 5).map(s => ({ ...s, pickedBy: null }));
        }
        
        // Sắp xếp 5 đội theo điểm Minigame (eventScore)
        SongDraft.pickOrder = [...teams].sort((a, b) => (b.eventScore || 0) - (a.eventScore || 0));
        SongDraft.currentIndex = 0;

        SongDraft.renderUI();
        SongDraft.processNextPick();
    },

    renderUI: () => {
        const grid = document.getElementById('draft-song-list');
        grid.innerHTML = '';
        
        // Nút NEXT tạm ẩn, chỉ hiện thông báo trạng thái
        const btn = document.getElementById('btn-to-minigame');
        btn.style.display = 'none'; 
        
        document.querySelector('.draft-header h1').innerText = t("song_selection");
        document.querySelector('.draft-header p').innerHTML = t("pick_order_info");

        SongDraft.pool.forEach((song, idx) => {
            let d = document.createElement('div');
            d.className = `song-card ${song.pickedBy ? 'picked' : ''}`;
            d.style.opacity = song.pickedBy ? "0.4" : "1";
            
            let charName = song.pickedBy ? song.pickedBy.leader.name.split(' ')[0] : 'AVAILABLE';
            let charColor = song.pickedBy ? '#ff7675' : '#00b894';
            const pickedLabel = (typeof Lang !== 'undefined' && Lang.current === 'vi') ? 'ĐÃ CHỌN BỞI' : 'PICKED BY';

            d.innerHTML = `
                <div class="song-title">${song.name}</div>
                <div class="song-concept">${song.concept}</div>
                <div class="song-picked-by" style="color:${charColor};">
                    ${song.pickedBy ? `${pickedLabel}<br>${charName}` : ''}
                </div>
            `;
            
            // Nếu tới lượt người chơi và bài này chưa ai chọn thì cho phép click
            if (!song.pickedBy) {
                d.onclick = () => {
                    let currentTeam = SongDraft.pickOrder[SongDraft.currentIndex];
                    if (currentTeam.members.some(m => m.id === 'p')) {
                        SongDraft.pickSong(idx);
                    }
                };
                if(SongDraft.pickOrder[SongDraft.currentIndex].members.some(m=>m.id==='p')){
                    d.style.cursor = 'pointer';
                    d.style.borderColor = '#ffeaa7';
                }
            }
            grid.appendChild(d);
        });
    },

    processNextPick: () => {
        if (SongDraft.currentIndex >= SongDraft.pickOrder.length) {
            // Đã chọn xong hết
            setTimeout(() => {
                const btn = document.getElementById('btn-to-minigame');
                btn.innerText = t("go_preparation_room");
                btn.style.display = 'block';
                btn.onclick = SongDraft.finalizeDraft;
            }, 1000);
            return;
        }

        let currentTeam = SongDraft.pickOrder[SongDraft.currentIndex];
        let isPlayerTeam = currentTeam.members.some(m => m.id === 'p');

        document.querySelector('.draft-header p').innerHTML = isPlayerTeam
            ? `<span style="color:#ffeaa7; font-size:14px; font-weight:bold;">${t("your_turn_pick")}</span>`
            : t("team_is_picking", { name: `<b style="color:#ff7675">${currentTeam.leader.name.split(' ')[0]}</b>` });
        
        SongDraft.renderUI();

        if (!isPlayerTeam) {
            // NPC tự động chọn sau 1.5 giây
            setTimeout(() => {
                let available = [];
                SongDraft.pool.forEach((s, i) => { if (!s.pickedBy) available.push(i); });
                let randomPick = available[Math.floor(Math.random() * available.length)];
                SongDraft.pickSong(randomPick);
            }, 1500);
        }
    },

    pickSong: (songIndex) => {
        let currentTeam = SongDraft.pickOrder[SongDraft.currentIndex];
        let pickedSong = SongDraft.pool[songIndex];
        pickedSong.pickedBy = currentTeam;
        currentTeam.song = pickedSong;
        
        // Nếu là team của Player, lưu bài hát vào config để chuẩn bị diễn
        if (currentTeam.members.some(m => m.id === 'p')) {
            App.stageConfig = {
                songName: pickedSong.name,
                concept: pickedSong.concept,
                songUrl: pickedSong.url,
                difficulty: 'medium' // Mặc định
            };
            App.audioName = pickedSong.name;
            App.audioFile = null;
        }

        SongDraft.currentIndex++;
        SongDraft.processNextPick();
    },

    finalizeDraft: () => {
        App.eventDone = true;
        const overlay = document.getElementById('song-draft-overlay');
        if (overlay) overlay.style.display = 'none';
        Game.triggerStageSetup();
    }
};

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
    initialized: false,
    valX: 0, // Giá trị từ -1 đến 1 (trái/phải)
    valY: 0, // Giá trị từ -1 đến 1 (lên/xuống)
    
    originX: 0, // Tọa độ gốc khi bắt đầu chạm
    originY: 0,
    maxRadius: 50, // Khoảng cách kéo tối đa để đạt tốc độ max

    init: () => {
        if (Joystick.initialized) return; 
        Joystick.initialized = true;
        const zone = document.body; // Lắng nghe toàn bộ màn hình

        // 1. SỰ KIỆN BẮT ĐẦU CHẠM
        zone.addEventListener('touchstart', (e) => {
            // Nếu người chơi bấm vào nút (Button) thì KHÔNG kích hoạt di chuyển
            if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.interactive')) {
                return;
            }

            Joystick.active = true;
            // Lưu vị trí chạm đầu tiên làm TÂM
            Joystick.originX = e.touches[0].clientX;
            Joystick.originY = e.touches[0].clientY;
            
            Joystick.valX = 0;
            Joystick.valY = 0;
        }, { passive: false });

        // 2. SỰ KIỆN DI CHUYỂN NGÓN TAY
        zone.addEventListener('touchmove', (e) => {
            if (!Joystick.active) return;
            // e.preventDefault(); // Bỏ comment dòng này nếu muốn chặn kéo trang web (scroll)

            const touch = e.touches[0];
            let dx = touch.clientX - Joystick.originX;
            let dy = touch.clientY - Joystick.originY;
            
            // Tính khoảng cách
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Nếu kéo quá xa, giới hạn lại trong vòng tròn maxRadius
            if (distance > Joystick.maxRadius) {
                const ratio = Joystick.maxRadius / distance;
                dx *= ratio;
                dy *= ratio;
            }

            // Tính toán giá trị output (-1 đến 1)
            Joystick.valX = dx / Joystick.maxRadius;
            Joystick.valY = dy / Joystick.maxRadius;
        }, { passive: false });

        // 3. SỰ KIỆN THẢ TAY
        const endTouch = () => {
            Joystick.active = false;
            Joystick.valX = 0;
            Joystick.valY = 0;
        };
        zone.addEventListener('touchend', endTouch);
        zone.addEventListener('touchcancel', endTouch);
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
    if (typeof Lang !== 'undefined') Lang.init();
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
    toggleJoystick: (show) => {
        const el = document.getElementById('mobile-controls');
        if (!el) return;
        
        const isMobile = window.innerWidth < 1024 || navigator.maxTouchPoints > 0;

        if (show && isMobile) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    },

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
        App.usedSongs = [];
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
        display.innerText = t("selected_song", { name: name });
        
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

            if (App.screen === 'stage-screen') {
                if (Stage.audioElement) {
                    Stage.audioElement.play(); 
                }
            }
        }
    },

    updateSettingsUI: () => {
        const btn = document.getElementById('btn-setting-bgm');
        if (BGM.enabled) {
            btn.innerText = `🔊 ${t("bgm_on")}`;
            btn.style.background = "#fff"; btn.style.color = "#2f3542";
        } else {
            btn.innerText = `🔇 ${t("bgm_off")}`;
            btn.style.background = "#aaa"; btn.style.color = "#fff";
        }
        document.getElementById('bgm-toggle').innerText = BGM.enabled ? `🔊 ${t("bgm_off")}` : `🔇 ${t("bgm_on")}`;
    },

    toggleLanguage: () => {
        if (typeof Lang === 'undefined') return;
        Lang.toggle();
    },

    quitToTitle: () => {
        if(confirm(t("quit_confirm"))) {
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
        Notify.show(t("welcome_day", { day: App.day }));
        
        document.getElementById('interaction-modal').style.display = 'none';

        if (typeof Joystick !== 'undefined') Joystick.init();
        Game.toggleJoystick(true);

        if (typeof HubMap !== 'undefined') {
            HubMap.stop(); 
            
            setTimeout(() => {
                HubMap.start(); 
            }, 20);
        }
    },
    
    checkStageDay: () => {
        console.log(App.day)
        if(C.ELIM_DAYS.includes(App.day)) {
            const n = document.getElementById('room-notification');
            
            // Thay thế điều kiện hardcode bằng kiểm tra App.eventDone
            if (!App.eventDone) {
                HubMap.stop();
                
                // Nếu bạn ĐÃ ghép tính năng chọn nhạc (SongDraft), gọi nó ở đây. 
                // Nếu CHƯA, thì gọi SpecialEvent.startDraft()
                if (typeof SongDraft !== 'undefined') {
                    SongDraft.startPhase();
                } else {
                    SpecialEvent.startDraft(); 
                }
                return;
            }
            
            Game.triggerStageSetup();
        }
    },

    nextDay: () => {
        if (App.isGameOver) { Game.showGameOver(); return; }
        if (App.day >= 35) { Game.showWin(); return; }
        
        App.day++; 
        App.eventDone = false; 
        Player.stats.stamina = 50; 
        Game.enterHub();
    },

    // CẬP NHẬT HÀM NÀY TRONG js/game.js
    triggerStageSetup: () => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('hub-screen').classList.add('active');
        App.screen = 'hub-screen';
        
        HubMap.start();
        
        const n = document.getElementById('room-notification');
        n.style.display='block';
        
        let title = t("room_team_battle");
        if (App.day === 35) title = t("room_final_debut"); // Sửa 30 thành 35
        
        document.getElementById('room-title').innerText = title;
        document.getElementById('room-desc').innerText = t("prepare_performance");
        document.getElementById('stage-setup-area').style.display='block';
        
        document.getElementById('room-action-btn').style.display = 'none'; 
        document.getElementById('room-cancel-btn').style.display='none';
        document.getElementById('stage-start-btn').style.display='none';

        // Sử dụng C.ELIM_DAYS thay vì 7,14,21
        if (C.ELIM_DAYS.includes(App.day)) {
            let myTeam = SpecialEvent.teams.find(t => t.members.some(m => m.id === 'p' || m.isPlayer));
            
            if (myTeam) {
                Stage.teammates = myTeam.members.filter(m => !m.isPlayer && m.id !== 'p');
            } else {
                Stage.teammates = NPCs.filter(n=>!n.eliminated).sort(()=>0.5-Math.random()).slice(0,4);
            }
        } else {
            if (App.day === 35) Stage.teammates = []; // Sửa 30 thành 35
            else Stage.teammates = NPCs.filter(n=>!n.eliminated).sort(()=>0.5-Math.random()).slice(0,4);
        }

        if (App.stageConfig && App.stageConfig.songName) {
            document.getElementById('drafted-song-name').innerText = App.stageConfig.songName;
            document.getElementById('drafted-song-concept').innerText = App.stageConfig.concept + " " + t("stage_suffix");
        }

        Game.selectDiff('medium');
        document.getElementById('stage-start-btn').style.display = 'block';
    },

    triggerTeamSelection: () => {
        Stage.retryCount = 0;
        document.getElementById('room-notification').style.display='none';
        
        // Sử dụng C.ELIM_DAYS
        if (C.ELIM_DAYS.includes(App.day)) {
            Stage.realInit();
            return; 
        }

        document.getElementById('team-select-overlay').style.display='flex';
        const c = document.getElementById('team-slots-container'); c.innerHTML='';
        
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
                document.getElementById('song-name-display').innerHTML = t("selected_song_len", { name: App.audioName, dur: durText });
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
        if(Player.stats.stamina<10) { Notify.show(t("no_stamina")); return; }
        Player.stats.stamina-=10; updateUI(); Minigame.start(type);
    },

    rest: () => { Player.stats.stamina=50; Notify.show(t("rested")); Game.simDay(); },
    
    finishStageDay: () => {
        document.getElementById('stage-detail-overlay').style.display = 'none';
        if (C.ELIM_DAYS.includes(App.day)) {
            Game.showTeamReveal();
        } else {
            Game.showDaySummary();
        }
    },

    showTeamReveal: () => {
        showScreen('team-reveal-screen');
        
        // Xóa sạch các thuộc tính display ép cứng trước đó (nếu có)
        const screenEl = document.getElementById('team-reveal-screen');
        if (screenEl) screenEl.style.display = '';

        const list = document.getElementById('team-reveal-list');
        if (!list) return;
        list.innerHTML = '';
        
        const btnNext = document.getElementById('btn-reveal-next');
        if (btnNext) {
            btnNext.style.display = 'none';
            btnNext.onclick = () => { Game.finalizeDay(); }; 
        }

        // FAILSAFE: Nếu bỏ qua bốc thăm và chơi thẳng, tự sinh mảng Team ảo để không Crash
        if (!SpecialEvent.teams || SpecialEvent.teams.length === 0) {
            SpecialEvent.teams = Array.from({length: 5}, (_, i) => ({
                leader: i === 0 ? Player : (NPCs[i] || {name: 'Bot', skin:'#ccc', hair:'#000', stats:{dance:50,vocal:50,rap:50}}),
                members: i === 0 ? [{...Player, id:'p', isPlayer:true}] : [(NPCs[i] || {name:'Bot', stats:{dance:50,vocal:50,rap:50}})],
                eventScore: Math.floor(Math.random() * 5000)
            }));
        }

        let currentDiff = (App.stageConfig && App.stageConfig.difficulty) ? App.stageConfig.difficulty : 'medium';
        const MAX_SCORES = { 'easy': 10000, 'medium': 15000, 'hard': 20000 };
        let targetMaxScore = MAX_SCORES[currentDiff] || 15000;
        let concept = (App.stageConfig && App.stageConfig.concept) ? App.stageConfig.concept : 'dance';

        SpecialEvent.teams.forEach(t => {
            let isMyTeam = t.members && t.members.some(m => m.id === 'p' || m.isPlayer);
            if (isMyTeam) {
                t.stageScore = App.myTeamStageScore || 0; 
            } else {
                let tTotal = 0;
                if (t.members) t.members.forEach(m => { tTotal += Stage.simulateNPCStageScore(m, targetMaxScore, concept); });
                t.stageScore = tTotal;
            }
            t.finalDailyScore = (t.eventScore || 0) + (t.stageScore || 0);
        });

        SpecialEvent.teams.sort((a,b) => b.finalDailyScore - a.finalDailyScore);

        const rankBonuses = [50000, 30000, 10000, 5000, 0];
        SpecialEvent.teams.forEach((t, i) => {
            t.rankBonus = rankBonuses[i] || 0;
            if (t.members) t.members.forEach(m => {
                if (m.id === 'p') App.lastEventBonus = t.rankBonus;
                else m.dailyBonus = t.rankBonus; 
            });
        });

        SpecialEvent.teams.forEach((t, i) => {
            let isMyTeam = t.members && t.members.some(m => m.id === 'p');
            let div = document.createElement('div');
            
            div.style.cssText = `background:#fff; border:3px solid ${isMyTeam?'#ff6b81':'#2f3542'}; border-radius:8px; padding:10px; position:relative; overflow:hidden; display:flex; justify-content:space-between; align-items:center; z-index:1; margin-bottom: 12px; width: 100%; box-sizing: border-box;`;
            let leaderName = (t.leader && t.leader.name) ? t.leader.name.split(' ')[0] : 'Bot';

            const isVi = (typeof Lang !== 'undefined' && Lang.current === 'vi');
            div.innerHTML = `
                <div id="ts-fill-${i}" style="position:absolute; top:0; left:0; height:100%; width:0%; background:${isMyTeam?'#ffeaa7':'#dfe6e9'}; z-index:-1; transition:width 1.5s ease-out;"></div>
                <div style="display:flex; align-items:center; gap:10px; position:relative; z-index:2;">
                    <div style="font-size:20px; font-weight:bold; color:${i===0?'#f1c40f':'#2f3542'};">#${i+1}</div>
                    <div style="font-size:12px; font-weight:bold; color:#2f3542; text-align:left;">${isVi ? "ĐỘI" : "TEAM"} ${leaderName}<br><span style="font-size:8px; color:#ff7675;">${isVi ? "THƯỞNG" : "BONUS"}: +${formatNum(t.rankBonus)}</span></div>
                </div>
                <div id="ts-val-${i}" style="font-size:18px; font-weight:bold; color:#2f3542; position:relative; z-index:2;">0</div>
            `;
            list.appendChild(div);

            setTimeout(() => {
                let maxPossible = targetMaxScore * 5 + 20000; 
                let percent = Math.min(100, (t.finalDailyScore / maxPossible) * 100);
                let fillEl = document.getElementById(`ts-fill-${i}`);
                if (fillEl) fillEl.style.width = `${percent}%`;
                
                let valEl = document.getElementById(`ts-val-${i}`);
                if (valEl) {
                    if (typeof Game.animateValue === 'function') Game.animateValue(`ts-val-${i}`, 0, t.finalDailyScore, 1500);
                    else valEl.innerText = formatNum(t.finalDailyScore);
                }
            }, i * 300 + 100);
        });

        setTimeout(() => { if (btnNext) btnNext.style.display = 'block'; }, SpecialEvent.teams.length * 300 + 1500);
    },

    renderRank: () => {
        let all = [...NPCs, {...Player, id:'p', isPlayer:true}].sort((a,b)=>b.totalVote-a.totalVote);
        const l = document.getElementById('ranking-list'); l.innerHTML='';
        
        let elim = 0;
        if(C.ELIM_DAYS.includes(App.day)) {
            elim = 5; 
            if(elim>0) {
                document.getElementById('elimination-msg').style.display='block';
                document.getElementById('elimination-msg').innerText = t("elim_bottom_leave", { num: elim });
            }
        } else {
            document.getElementById('elimination-msg').style.display='none';
        }

        let active = all.filter(t=>!t.eliminated);
        let cutoff = active.length - elim;

        all.forEach((t, i) => {
            let currentRank = i + 1;
            let d = document.createElement('div'); d.className='rank-card';
            if(t.isPlayer) d.classList.add('player');
            if(t.eliminated) d.classList.add('eliminated');
            
            if(elim > 0 && !t.eliminated && active.indexOf(t) >= cutoff) {
                d.style.borderColor='red'; d.innerHTML += `<div style="color:red; font-size:8px; font-weight:bold; position:absolute; top:4px; right:4px; background:#fff; padding:2px 4px; border-radius:3px; line-height:1;">${(typeof Lang !== 'undefined' && Lang.current === 'vi') ? "LOẠI" : "ELIM"}</div>`;
                if(t.isPlayer) App.isGameOver=true; else NPCs.find(n=>n.id===t.id).eliminated=true;
            }
            
            let rankChangeHtml = "";
            let voteGained = t.totalVote - (t.prevVote || 0);

            if (t.prevRank) {
                let rankDiff = t.prevRank - currentRank;
                if (rankDiff > 0) rankChangeHtml = `<span style="color:#00b894; font-size:8px;">▲${rankDiff}</span>`;
                else if (rankDiff < 0) rankChangeHtml = `<span style="color:#d63031; font-size:8px;">▼${Math.abs(rankDiff)}</span>`;
                else rankChangeHtml = `<span style="color:#b2bec3; font-size:8px;">-</span>`;
            }

            // FAILSAFE: Lấy tên an toàn, tránh báo lỗi split undefined
            let safeName = (t.name && typeof t.name === 'string') ? t.name.split(' ')[0] : 'Unknown';

            d.innerHTML += `
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                    <div class="rank-num">#${currentRank} ${rankChangeHtml}</div>
                </div>
                <div class="rank-avatar" style="background:${t.skin || '#ccc'};">
                    <div class="rank-avatar-hair" style="background:${t.hair || '#000'};"></div>
                </div>
                <b class="rank-name" style="font-size:10px;">${safeName}</b><br>
                <div style="font-size:10px; color:#2f3542;">
                    ${formatNum(t.totalVote)}<br>
                    <span style="font-size:7px; color:#e17055;">(+${formatNum(voteGained)})</span>
                </div>
            `;
            l.appendChild(d);
        });
    },

    // 3. TỔNG KẾT CÁ NHÂN (CHỈ PC - HOẶC MOBILE NẾU MUỐN SHOW)
    showDaySummary: () => {
        showScreen('day-summary-screen');
        
        let sGame = App.compScore || 0;    
        let sBonus = App.lastEventBonus || 0; 
        let sStage = Math.floor(Stage.lastTotalScore || 0);
        
        // LOGIC MỚI:
        let sTotal = 0;
        if (C.ELIM_DAYS.includes(App.day)) {
            // Ngày event: Chỉ tính điểm Live Stage
            sTotal = sStage;
            document.getElementById('sum-game').innerText = "(Picking Order Only)";
        } else {
            // Ngày thường: Tính tất cả
            sTotal = sGame + sBonus + sStage;
            document.getElementById('sum-game').innerText = "+" + formatNum(sGame);
        }

        // Cộng điểm
        Player.totalVote += sTotal;

        // 3. Cộng Fan
        let fanMultiplier = 1 + (Player.stats.visual / 100);
        let stageFans = Math.floor((sStage / 100) * fanMultiplier);
        Player.fans += stageFans;

        // 4. Reset
        App.compScore = 0;
        App.lastEventBonus = 0; 

        // 5. Hiển thị
        document.getElementById('sum-game').innerText = "+" + formatNum(sGame);
        document.getElementById('sum-bonus').innerText = "+" + formatNum(sBonus);
        document.getElementById('sum-stage').innerText = "+" + formatNum(sStage);
        
        Game.animateValue('sum-total', 0, sTotal, 1500);

        // --- QUAN TRỌNG: CLICK ĐỂ SANG FINALIZEDAY ---
        // Gán sự kiện click vào màn hình này để chuyển sang trang Ranking/Kết thúc ngày
        const screen = document.getElementById('day-summary-screen');
        screen.onclick = () => {
            screen.onclick = null; // Tránh click 2 lần
            Game.finalizeDay();
        };
        
        // Hoặc tạo một thông báo nhỏ nhắc người chơi bấm để tiếp tục
        setTimeout(() => {
           Notify.show(t("click_continue"));
        }, 2000);
    },

    // 4. HÀM MỚI: KẾT THÚC NGÀY (Nối vào logic cũ)
    finalizeDay: () => {
        if (App.day === 35) {
            showScreen('heart-game-screen');
            document.getElementById('heart-start-overlay').style.display = 'flex';
        } else {
            Game.simDay(); 
        }
    },

    simDay: () => {
        document.getElementById('interaction-modal').style.display = 'none';

        // --- 1. LƯU SNAPSHOT (Lịch sử xếp hạng & điểm trước khi cộng) ---
        let allChars = [...NPCs, {...Player, id:'p', isPlayer:true}];
        allChars.sort((a,b) => b.totalVote - a.totalVote);
        
        // Gắn rank cũ và vote cũ vào từng object
        allChars.forEach((c, index) => {
            let target = (c.isPlayer) ? Player : NPCs.find(n => n.id === c.id);
            if (target) {
                target.prevRank = index + 1;
                target.prevVote = target.totalVote || 0;
            }
        });

        // --- 2. CỘNG ĐIỂM NGÀY HÔM NAY ---
        // Player: Cộng điểm Stage + Bonus sự kiện + Điểm thụ động
        let playerDailyGain = (Stage.lastTotalScore || 0) + (App.lastEventBonus || 0) + Math.floor(Player.fans / 2);
        Player.totalVote += playerDailyGain;
        
        let relScore = 0;
        NPCs.forEach(n => relScore += (n.relationship || 0));
        Player.totalVote += Math.max(0, relScore * 10);

        // NPC: Cộng điểm
        let sortedNPCs = [...NPCs].sort((a, b) => b.totalVote - a.totalVote);
        NPCs.forEach(n => { 
            if(!n.eliminated) {
                let npcStats = n.stats.vocal + n.stats.dance + n.stats.rap + n.stats.visual + n.stats.charisma;
                let dailyNPCGain = Math.floor(npcStats * (2.0 + Math.random() * 2.0));
                
                // Nếu là ngày sự kiện, NPC được cộng bonus Team (đã lưu ở bước 3)
                if (n.dailyBonus) {
                    dailyNPCGain += n.dailyBonus;
                    n.dailyBonus = 0; // Xóa sau khi cộng
                }

                let rankIndex = sortedNPCs.indexOf(n);
                if (rankIndex === 0) dailyNPCGain += 3000;
                else if (rankIndex < 7) dailyNPCGain += 1000;

                n.totalVote += dailyNPCGain;
            }
        });

        // Xóa rác biến tạm
        Stage.lastTotalScore = 0; App.lastEventBonus = 0; App.compScore = 0;

        // --- 3. HIỂN THỊ KẾT QUẢ ---
        showScreen('result-screen'); 
        Game.renderRank();
    },

    showGameOver: () => {
        let all = [...NPCs, {...Player, id:'p'}].sort((a,b)=>b.totalVote-a.totalVote);
        let rank = all.findIndex(t => t.id === 'p') + 1;
        document.getElementById('go-days').innerText = App.day + " " + ((typeof Lang !== 'undefined' && Lang.current === "vi") ? "Ngày" : "Days");
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

    triggerInteraction: (npc) => {
        // Tắt Joystick khi vào hội thoại
        Game.toggleJoystick(false);
        HubMap.run = false;

        const modal = document.getElementById('interaction-modal');
        modal.style.display = 'flex'; // Dùng flex để CSS hoạt động tốt

        document.getElementById('dialogue-npc-name').innerText = npc.name;

        // Lấy dữ liệu hội thoại ngẫu nhiên
        const currentDialogues = Lang.getDialogueList();
        const rIndex = Math.floor(Math.random() * currentDialogues.length);
        const chatData = currentDialogues[rIndex];
        
        document.getElementById('dialogue-text').innerText = chatData.text;
        
        const optsContainer = document.getElementById('dialogue-options'); 
        optsContainer.innerHTML = ''; 

        // Tạo danh sách lựa chọn ngẫu nhiên
        let shuffledOptions = chatData.options.map((text, index) => {
            return { text: text, originalIndex: index }; 
        });
        shuffledOptions.sort(() => Math.random() - 0.5);

        // Tạo nút bấm mới (Sử dụng class CSS thay vì style inline)
        shuffledOptions.forEach((opt) => {
            let b = document.createElement('button');
            b.innerText = opt.text;
            b.className = 'dialogue-btn'; // Gán class mới để CSS trang trí

            b.onclick = () => {
                // --- Xử lý điểm số ---
                if (opt.originalIndex === 0) {
                    RelManager.update(npc, 5);
                    Player.teamwork += 0.5;
                    Player.fans += 50 + Player.stats.charisma;
                    Notify.show(`👍 ${npc.name.split(' ')[0]} ${t("dialog_like")}`);
                } else if (opt.originalIndex === 2) {
                    RelManager.update(npc, -5);
                    Player.teamwork -= 0.5;
                    Player.fans -= 50;
                    Notify.show(`👎 ${npc.name.split(' ')[0]} ${t("dialog_dislike")}`);
                } else {
                    Notify.show(`😐 ${t("dialog_normal")}`);
                }

                updateUI();

                // --- Đóng bảng hội thoại ---
                if (typeof HubMap !== 'undefined' && HubMap.closeInteraction) {
                    HubMap.closeInteraction(); 
                } else {
                    modal.style.display = 'none';
                    if (typeof HubMap !== 'undefined') {
                        HubMap.run = true; 
                        HubMap.loop();
                    }
                }
                
                // Bật lại Joystick khi xong
                Game.toggleJoystick(true);
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
            let safeRelName = (n.name && typeof n.name === 'string') ? n.name.split(' ')[0] : 'Unknown';

            grid.innerHTML += `
            <div class="rel-card">
                <div style="width:20px; height:20px; background:${n.skin}; margin:0 auto 5px;">
                    <div style="width:100%; height:6px; background:${n.hair}"></div>
                </div>
                <div class="rel-name" style="font-weight:bold; font-size:9px; margin-bottom:5px;">${safeRelName}</div>
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
