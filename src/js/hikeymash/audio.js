'use strict';

        // 3. AUDIO SYNTHESIZER
        // ─────────────────────────────────────────────────────────────
        let soundEnabled = true;
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
                this.init();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);
                gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.04);
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

        // ─────────────────────────────────────────────────────────────
