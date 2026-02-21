/* --- BGM SYSTEM (FIXED VOLUME) --- */
var BGM = {
    ctx: null,
    enabled: true,    
    currentType: null, 
    timer: null,

    // Khá»Ÿi táº¡o AudioContext (Cáº§n thiáº¿t Ä‘á»ƒ trÃ¬nh duyá»‡t cho phÃ©p phÃ¡t nháº¡c)
    init: () => {
        if (!BGM.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            BGM.ctx = new AC();
        }
    },

    toggle: () => {
        BGM.enabled = !BGM.enabled;
        
        // Cáº­p nháº­t giao diá»‡n nÃºt báº¥m (náº¿u cÃ³)
        const btnMain = document.getElementById('bgm-toggle');
        const btnSetting = document.getElementById('btn-setting-bgm');
        
        if (BGM.enabled) {
            if (BGM.currentType) BGM.play(BGM.currentType);
            if(btnMain) btnMain.innerText = `🔊 ${typeof t === 'function' ? t("bgm_on") : "BGM ON"}`;
            if(btnSetting) btnSetting.innerText = `🔊 ${typeof t === 'function' ? t("bgm_on") : "BGM ON"}`;
        } else {
            BGM.stop();
            if(btnMain) btnMain.innerText = `🔇 ${typeof t === 'function' ? t("bgm_off") : "BGM OFF"}`;
            if(btnSetting) btnSetting.innerText = `🔇 ${typeof t === 'function' ? t("bgm_off") : "BGM OFF"}`;
        }
    },

    play: (type) => {
        BGM.currentType = type; 
        clearInterval(BGM.timer);

        if (!BGM.enabled) return; 

        // 1. Äáº£m báº£o AudioContext hoáº¡t Ä‘á»™ng
        BGM.init();
        if (BGM.ctx.state === 'suspended') {
            BGM.ctx.resume();
        }

        let n = 0;
        let melody = [];
        let speed = 200;
        let waveType = 'triangle';

        // 2. Äá»‹nh nghÄ©a giai Ä‘iá»‡u
        if (type === 'hub') {
            waveType = 'triangle'; 
            speed = 200;
            // Giai Ä‘iá»‡u Hub vui tÆ°Æ¡i
            melody = [
                262, 330, 392, 440, 392, 330, 262, 0,
                330, 392, 523, 659, 523, 392, 330, 0,
                294, 349, 440, 587, 440, 349, 294, 0,
                196, 262, 330, 392, 330, 262, 196, 0
            ];
        } else {
            // Giai Ä‘iá»‡u sá»± kiá»‡n dá»“n dáº­p hÆ¡n
            waveType = 'square'; 
            speed = 120; 
            melody = [
                523, 0, 523, 587, 659, 0, 523, 659,
                784, 0, 659, 784, 1046, 0, 784, 1046,
                1175, 1046, 880, 784, 659, 587, 523, 440
            ];
        }

        // 3. VÃ²ng láº·p phÃ¡t nháº¡c
        BGM.timer = setInterval(() => {
            if (!BGM.enabled) return;
            
            const freq = melody[n % melody.length];
            
            if (freq > 0) {
                // Táº¡o bá»™ phÃ¡t Ã¢m thanh má»›i cho má»—i ná»‘t (Logic cÅ© - An toÃ n nháº¥t)
                const o = BGM.ctx.createOscillator();
                const g = BGM.ctx.createGain();
                
                o.connect(g); 
                g.connect(BGM.ctx.destination); // Káº¿t ná»‘i tháº³ng ra loa
                
                o.type = waveType; 
                o.frequency.value = freq;
                
                // --- [ÄIá»‚M Sá»¬A QUAN TRá»ŒNG] ---
                // Code cÅ© lÃ  0.05 (quÃ¡ nhá»). 
                // Code má»›i lÃ  0.3 (to hÆ¡n gáº¥p 6 láº§n).
                g.gain.setValueAtTime(0.3, BGM.ctx.currentTime); 
                
                // Hiá»‡u á»©ng táº¯t dáº§n (Decay) Ä‘á»ƒ tiáº¿ng Ä‘á»¡ chÃ³i
                g.gain.exponentialRampToValueAtTime(0.01, BGM.ctx.currentTime + 0.1);
                
                o.start();
                o.stop(BGM.ctx.currentTime + 0.1);
            }
            n++;
        }, speed);
    },

    stop: () => {
        clearInterval(BGM.timer);
    }
};
