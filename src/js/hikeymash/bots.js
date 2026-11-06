'use strict';

        // 6. BOT SIMULATION ENGINE
        // ─────────────────────────────────────────────────────────────
        function startBots() {
            botProgress = [0, 0];
            botSpeed = [38 + Math.floor(Math.random() * 8), 30 + Math.floor(Math.random() * 8)];
            if (botInterval) clearInterval(botInterval);

            botInterval = setInterval(() => {
                if (isFinished || !sessionStartTime) return;
                const elapsedSec = (Date.now() - sessionStartTime) / 1000;
                const totalTargetChars = targetKrutiText.length || 150;

                // Bot 1
                const bot1CharsPerSec = (botSpeed[0] * 5) / 60;
                botProgress[0] = Math.min(1, (elapsedSec * bot1CharsPerSec) / totalTargetChars);
                el.bot1Pill.style.left = (botProgress[0] * 90 + 5) + '%';
                const curWpm1 = elapsedSec >= 1 ? (botSpeed[0] + (Math.sin(elapsedSec) * 2)).toFixed(2) : '0.00';
                el.bot1Wpm.textContent = curWpm1 + ' WPM';

                // Bot 2
                const bot2CharsPerSec = (botSpeed[1] * 5) / 60;
                botProgress[1] = Math.min(1, (elapsedSec * bot2CharsPerSec) / totalTargetChars);
                el.bot2Pill.style.left = (botProgress[1] * 90 + 5) + '%';
                const curWpm2 = elapsedSec >= 1 ? (botSpeed[1] + (Math.cos(elapsedSec) * 2)).toFixed(2) : '0.00';
                el.bot2Wpm.textContent = curWpm2 + ' WPM';
            }, 120);
        }

        function stopBots() {
            if (botInterval) clearInterval(botInterval);
            botInterval = null;
        }

        // ─────────────────────────────────────────────────────────────
