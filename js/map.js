/* --- HUB MAP SYSTEM (FULL MAP: 5 HUGE ROOMS) --- */
var HubMap = {
    canvas: null, ctx: null, run: false, 
    keys: {}, 
    camera: {x:0, y:0}, 
    curRoom: null, ignore: null,
    
    // Huge Map Dimensions (3200x2400)
    width: 3200, height: 2400, 
    decorations: [], 
    
    // 5 Rooms Configuration (Scattered across the map)
    rooms: {
        dorm:  { x: 100,  y: 100,  w: 800, h: 600, color: "#f1c40f", name: "DORM" },  // Top Left
        vocal: { x: 2300, y: 100,  w: 800, h: 600, color: "#3498db", name: "VOCAL" }, // Top Right
        dance: { x: 100,  y: 1700, w: 800, h: 600, color: "#9b59b6", name: "DANCE" }, // Bottom Left
        rap:   { x: 2300, y: 1700, w: 800, h: 600, color: "#e74c3c", name: "RAP" },   // Bottom Right
        gym:   { x: 1200, y: 900,  w: 800, h: 600, color: "#2ecc71", name: "GYM" }    // Center
    },
    
    init: () => {
        HubMap.canvas = document.getElementById('hubCanvas');
        HubMap.ctx = HubMap.canvas.getContext('2d');
        const c = document.getElementById('game-container');
        HubMap.canvas.width = c.clientWidth;
        HubMap.canvas.height = c.clientHeight;
        
        if (HubMap.decorations.length === 0) HubMap.generateDecorations();
    },

    generateDecorations: () => {
        HubMap.decorations = [];
        // Generate 600 decorations because the map is huge
        for(let i=0; i<600; i++) {
            HubMap.decorations.push({
                x: Math.random() * HubMap.width,
                y: Math.random() * HubMap.height,
                type: Math.random() < 0.5 ? 'grass' : (Math.random() < 0.7 ? 'stone' : (Math.random() < 0.9 ? 'flower' : 'pebble')),
                color: Math.random() < 0.5 ? '#27ae60' : '#2ecc71',
                size: 4 + Math.random() * 6,
                variant: Math.floor(Math.random() * 3)
            });
        }
    },

    start: () => {
        HubMap.init();
        HubMap.run = true;
        
        window.onkeydown = e => { 
            if(typeof C !== 'undefined' && C.ELIM_DAYS.includes(App.day) && document.getElementById('room-notification').style.display==='block') return;
            HubMap.keys[e.key] = true; 
        };
        window.onkeyup = e => HubMap.keys[e.key] = false;

        // Spawn Player at Center (near Gym)
        if (!Player.x || Player.x < 0 || Player.x > HubMap.width) { 
            Player.x = 1600; Player.y = 1200; 
        }

        // Spawn NPCs
        NPCs.forEach(n => {
            if (!n.eliminated) {
                n.x = Math.random() * (HubMap.width - 200) + 100;
                n.y = Math.random() * (HubMap.height - 200) + 100;
            }
        });

        requestAnimationFrame(HubMap.loop);
    },

    stop: () => HubMap.run = false,

    loop: () => {
        if (!HubMap.run) return;
        if (App.paused) { requestAnimationFrame(HubMap.loop); return; }

        const ctx = HubMap.ctx;
        const cw = HubMap.canvas.width;
        const ch = HubMap.canvas.height;
        let mv = false;
        let dx = 0, dy = 0;
        let speed = 7; 
        if (HubMap.keys['ArrowUp'] && Player.y > 50) { Player.y -= speed; mv = true; }
        if (HubMap.keys['ArrowDown'] && Player.y < HubMap.height - 50) { Player.y += speed; mv = true; }
        if (HubMap.keys['ArrowLeft'] && Player.x > 50) { Player.x -= speed; mv = true; }
        if (HubMap.keys['ArrowRight'] && Player.x < HubMap.width - 50) { Player.x += speed; mv = true; }

        if (Joystick.active) {
            dx = Joystick.valX; 
            dy = Joystick.valY;
        }

        if (dx !== 0 || dy !== 0) {
            Player.x += dx * speed;
            Player.y += dy * speed;
            mv = true;

            Player.x = Math.max(50, Math.min(Player.x, HubMap.width - 50));
            Player.y = Math.max(50, Math.min(Player.y, HubMap.height - 50));
        }

        NPCs.forEach(c => {
            if (!c.eliminated) {
                if (Math.random() < 0.02) { c.vx = (Math.random() - 0.5) * 2; c.vy = (Math.random() - 0.5) * 2; }
                c.x += (c.vx || 0); c.y += (c.vy || 0);
                c.x = Math.max(100, Math.min(c.x, HubMap.width - 100));
                c.y = Math.max(100, Math.min(c.y, HubMap.height - 100));
            }
        });

        HubMap.camera.x = Math.max(0, Math.min(Player.x - cw / 2, HubMap.width - cw));
        HubMap.camera.y = Math.max(0, Math.min(Player.y - ch / 2, HubMap.height - ch));

        ctx.clearRect(0, 0, cw, ch);
        ctx.save();
        ctx.translate(-HubMap.camera.x, -HubMap.camera.y);

        // 1. Draw Ground
        ctx.fillStyle = "#e67e22"; 
        ctx.fillRect(0, 0, HubMap.width, HubMap.height);

        // 2. Draw Decorations
        HubMap.drawDecor(ctx);

        // 3. DRAW 5 HUGE ROOMS
        HubMap.drawRoom(ctx, HubMap.rooms.dorm, 'dorm');
        HubMap.drawRoom(ctx, HubMap.rooms.vocal, 'vocal');
        HubMap.drawRoom(ctx, HubMap.rooms.dance, 'dance');
        HubMap.drawRoom(ctx, HubMap.rooms.rap, 'rap');
        HubMap.drawRoom(ctx, HubMap.rooms.gym, 'gym');

        // 4. Draw Characters
        let allChars = [...NPCs, {...Player, id:'p'}].filter(c => !c.eliminated);
        allChars.sort((a,b) => a.y - b.y);
        
        allChars.forEach(c => {
            HubMap.drawHubChar(ctx, c, c.id === 'p');
        });

        ctx.restore();

        // 5. Room Trigger Logic (Check collision with 5 rooms)
        let foundRoom = null;
        for (const [key, r] of Object.entries(HubMap.rooms)) {
            // Hitbox slightly smaller than room
            if (Player.x > r.x + 50 && Player.x < r.x + r.w - 50 && 
                Player.y > r.y + 50 && Player.y < r.y + r.h - 50) {
                foundRoom = { id: key, name: r.name };
                break;
            }
        }

        if (foundRoom) {
            if (HubMap.curRoom !== foundRoom.id && HubMap.ignore !== foundRoom.id) {
                HubMap.curRoom = foundRoom.id; 
                HubMap.triggerRoom(foundRoom);
            }
        } else {
            HubMap.curRoom = null; 
            HubMap.ignore = null;
            if (typeof C !== 'undefined' && !C.ELIM_DAYS.includes(App.day)) 
                document.getElementById('room-notification').style.display = 'none';
        }

        if (mv) {
            NPCs.forEach(n => {
                if (!n.eliminated && Math.hypot(Player.x - n.x, Player.y - n.y) < 60) {
                    Game.triggerInteraction(n); 
                    Player.x -= (n.x - Player.x) * 0.1; 
                    Player.y -= (n.y - Player.y) * 0.1;
                }
            });
        }
        
        requestAnimationFrame(HubMap.loop);
    },

    // --- DRAWING FUNCTIONS ---

    drawRoom: (ctx, r, type) => {
        // Floor
        ctx.fillStyle = r.color; 
        ctx.fillRect(r.x, r.y, r.w, r.h);
        
        // Floor Patterns
        ctx.save();
        ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
        ctx.strokeStyle = "rgba(0,0,0,0.1)"; ctx.lineWidth = 4;
        
        let step = (type === 'gym' || type === 'dance') ? 80 : 50;
        for(let i=0; i<r.w; i+=step) { ctx.beginPath(); ctx.moveTo(r.x+i, r.y); ctx.lineTo(r.x+i, r.y+r.h); ctx.stroke(); }
        if (type !== 'vocal') { // Vocal only vertical lines, others grid
            for(let i=0; i<r.h; i+=step) { ctx.beginPath(); ctx.moveTo(r.x, r.y+i); ctx.lineTo(r.x+r.w, r.y+i); ctx.stroke(); }
        }
        ctx.restore();

        // Walls (Thick 3D Border)
        ctx.lineWidth = 15;
        ctx.strokeStyle = "rgba(0,0,0,0.3)"; 
        ctx.strokeRect(r.x, r.y, r.w, r.h);

        // Room Name
        ctx.fillStyle = "#fff"; 
        ctx.font = "bold 30px 'Press Start 2P'"; 
        ctx.textAlign = "left";
        ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 4;
        ctx.fillText(r.name, r.x + 80, r.y + 60);
        ctx.shadowBlur = 0;

        // Draw Icon
        HubMap.drawIcon(ctx, type, r.x + 30, r.y + 35);
    },

    drawIcon: (ctx, type, x, y) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#fff"; 
        
        if (type === 'dorm') { // Bed
            ctx.fillRect(0, 0, 40, 30); 
            ctx.fillStyle = "#3498db"; ctx.fillRect(0, 10, 40, 20); 
            ctx.fillStyle = "#fff"; ctx.fillRect(5, -5, 15, 10); 
        } 
        else if (type === 'gym') { // Dumbbell
            ctx.fillRect(0, 5, 40, 10); 
            ctx.fillStyle = "#34495e"; ctx.fillRect(-5, 0, 10, 20); ctx.fillRect(35, 0, 10, 20); 
        }
        else if (type === 'vocal') { // Mic
            ctx.fillStyle = "#bdc3c7"; ctx.fillRect(15, 10, 10, 30); // Handle
            ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.arc(20, 5, 12, 0, Math.PI*2); ctx.fill(); // Head
        }
        else if (type === 'dance') { // Shoe
            ctx.fillStyle = "#ecf0f1"; ctx.beginPath(); ctx.ellipse(20, 15, 15, 8, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#9b59b6"; ctx.fillRect(20, 10, 15, 10); // Laces
        }
        else if (type === 'rap') { // Cap (Different Color)
            // [UPDATE] Changed to Dark Blue/Black Cap to contrast with Red Room
            ctx.fillStyle = "#2c3e50"; // Dark Blue Cap
            ctx.beginPath(); ctx.arc(20, 15, 15, Math.PI, 0); ctx.fill();
            ctx.fillStyle = "#34495e"; // Visor
            ctx.fillRect(5, 15, 30, 5); 
        }
        ctx.restore();
    },

    drawDecor: (ctx) => {
        HubMap.decorations.forEach(d => {
            if (d.type === 'grass') {
                ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 4, d.y - 8); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 5, d.y - 10); ctx.stroke();
            } 
            else if (d.type === 'stone') {
                ctx.fillStyle = "#7f8c8d";
                ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.arc(d.x+2, d.y+2, d.size, 0, Math.PI*2); ctx.fill();
            } 
            else if (d.type === 'flower') {
                ctx.fillStyle = "#27ae60"; ctx.fillRect(d.x, d.y-5, 3, 6); 
                ctx.fillStyle = ["#ff6b81", "#feca57", "#54a0ff"][d.variant]; 
                ctx.beginPath(); ctx.arc(d.x+1.5, d.y-6, 4, 0, Math.PI*2); ctx.fill();
            }
            else if (d.type === 'pebble') {
                ctx.fillStyle = "#bdc3c7"; ctx.fillRect(d.x, d.y, d.size, d.size*0.7);
            }
        });
    },

    drawHubChar: (ctx, char, isPlayer) => {
        let x = char.x;
        let y = char.y;
        let s = 3.5; 
        let bounce = Math.sin(Date.now() / 200) * 1.5; 

        ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.ellipse(x, y + (5*s), 6*s, 3*s, 0, 0, Math.PI * 2); ctx.fill(); // Shadow
        ctx.fillStyle = "#2c3e50"; ctx.fillRect(x - (3*s), y + (4*s) + bounce, 2.5*s, 4*s); ctx.fillRect(x + (0.5*s), y + (4*s) + bounce, 2.5*s, 4*s); // Legs
        ctx.fillStyle = char.shirt || "#ff7675"; ctx.beginPath(); ctx.roundRect(x - (4*s), y - (2*s) + bounce, 8*s, 7*s, 3); ctx.fill(); // Body
        ctx.fillStyle = char.skin; ctx.fillRect(x - (5*s), y - (11*s) + bounce, 10*s, 10*s); // Head
        ctx.fillStyle = char.hair; ctx.fillRect(x - (6*s), y - (13*s) + bounce, 12*s, 4*s); ctx.fillRect(x - (6*s), y - (11*s) + bounce, 2*s, 7*s); ctx.fillRect(x + (4*s), y - (11*s) + bounce, 2*s, 7*s); // Hair
        ctx.fillStyle = "#fff"; ctx.fillRect(x - (3*s), y - (7*s) + bounce, 2.5*s, 3*s); ctx.fillRect(x + (1*s), y - (7*s) + bounce, 2.5*s, 3*s); // Eyes
        ctx.fillStyle = "#000"; ctx.fillRect(x - (2*s), y - (6*s) + bounce, 1*s, 2*s); ctx.fillRect(x + (2*s), y - (6*s) + bounce, 1*s, 2*s); // Pupil

        ctx.textAlign = "center"; ctx.font = isPlayer ? "bold 12px sans-serif" : "10px sans-serif";
        if (isPlayer) {
            ctx.fillStyle = "#ff4757"; ctx.beginPath(); ctx.moveTo(x, y - (18*s) + bounce); ctx.lineTo(x - 5, y - (20*s) + bounce); ctx.lineTo(x + 5, y - (20*s) + bounce); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.strokeText(char.name, x, y - (14*s) + bounce); ctx.fillText(char.name, x, y - (14*s) + bounce);
        } else {
            ctx.fillStyle = "#2f3542"; ctx.fillText(char.name.split(' ')[0], x, y - (14*s) + bounce);
        }
    },

    triggerRoom: (room) => {
        if (typeof C !== 'undefined' && C.ELIM_DAYS.includes(App.day)) return;
        const n = document.getElementById('room-notification');
        n.style.display = 'block';
        document.getElementById('room-title').innerText = room.name;
        document.getElementById('room-desc').innerText = "ACTION?";
        document.getElementById('stage-setup-area').style.display = 'none';
        
        const b = document.getElementById('room-action-btn');
        b.style.display = 'inline-block';
        document.getElementById('room-cancel-btn').style.display = 'inline-block';
        
        if (room.id === 'dorm') { b.innerText = "SLEEP (Restore STA)"; b.onclick = () => { n.style.display = 'none'; Game.rest(); }; } 
        else { b.innerText = "PRACTICE " + room.name; b.onclick = () => { n.style.display = 'none'; Game.startPractice(room.id); }; }
    },
    
    cancelRoom: () => {
        document.getElementById('room-notification').style.display = 'none';
        HubMap.ignore = HubMap.curRoom;
    },
    
    closeInteraction: () => { 
        document.getElementById('interaction-modal').style.display = 'none'; 
        HubMap.run = true; 
        HubMap.loop(); 
    }
};