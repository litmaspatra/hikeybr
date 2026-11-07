'use strict';

        // 3. AUDIO SYNTHESIZER
        // ─────────────────────────────────────────────────────────────
        let soundEnabled = true;
        let soundTheme = 'mechanical';
        const sound = {
            ctx: null,
            init() {
                if (!this.ctx) {
                    const AC = window.AudioContext || window.webkitAudioContext;
                    if (AC) this.ctx = new AC();
                }
            },
            click() {
                if (!soundEnabled) return;
                (SOUND_THEMES[soundTheme] || SOUND_THEMES.mechanical).click();
            },
            error() {
                if (!soundEnabled) return;
                this.init();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, this.ctx.currentTime);
                osc.frequency.setValueAtTime(140, this.ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.16);
            },
            win() {
                if (!soundEnabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [330, 440, 550, 660].forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.08);
                    gain.gain.setValueAtTime(0.15, now + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.08);
                    osc.stop(now + i * 0.08 + 0.2);
                });
            }
        };


        // Sound themes (ported from hikeybr): key-click presets on one synth.
        function kmTone(freq, dur, type, vol) {
            if (!soundEnabled) return;
            sound.init();
            if (!sound.ctx) return;
            const ctx = sound.ctx;
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + dur);
        }
        let kmNoiseBuf = null;
        function kmNoise(dur, freq, type, vol) {
            if (!soundEnabled) return;
            sound.init();
            if (!sound.ctx) return;
            const ctx = sound.ctx;
            if (ctx.state === 'suspended') ctx.resume();
            if (!kmNoiseBuf) {
                kmNoiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
                const d = kmNoiseBuf.getChannelData(0);
                for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            }
            const src = ctx.createBufferSource();
            src.buffer = kmNoiseBuf;
            const f = ctx.createBiquadFilter();
            f.type = type;
            f.frequency.value = freq;
            f.Q.value = 1.1;
            const g = ctx.createGain();
            g.gain.setValueAtTime(vol, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
            src.connect(f);
            f.connect(g);
            g.connect(ctx.destination);
            src.start();
        }
        const SOUND_THEMES = {
            mechanical: { click() { kmNoise(0.028, 3400, 'bandpass', 0.22); kmTone(185, 0.022, 'square', 0.05); } },
            typewriter: { click() { kmNoise(0.045, 1300, 'lowpass', 0.3); kmTone(210, 0.03, 'triangle', 0.09); setTimeout(() => kmNoise(0.02, 850, 'lowpass', 0.12), 26); } },
            soft:       { click() { kmTone(420, 0.035, 'sine', 0.1); } },
            click:      { click() { kmNoise(0.014, 5400, 'highpass', 0.17); } },
            retro:      { click() { kmTone(660, 0.03, 'square', 0.07); kmTone(880, 0.02, 'square', 0.045); } },
            thock:      { click() { kmTone(120, 0.075, 'sine', 0.26); kmNoise(0.018, 750, 'lowpass', 0.1); } }
        };

        // ─────────────────────────────────────────────────────────────

