'use strict';

        // 15b. REAL PING (measured round-trip to the site host)
        // ─────────────────────────────────────────────────────────────
        // HiKeymash is a static site with no game server yet, so this times a
        // tiny cache-busted request to the host that serves the page - the same
        // path a real multiplayer server round-trip would take.
        async function measurePing() {
            if (!el.matchPingVal) return;
            const t0 = performance.now();
            try {
                await fetch('src/css/keyboard.css?ping=' + Date.now(), { cache: 'no-store' });
                el.matchPingVal.textContent = Math.max(1, Math.round(performance.now() - t0)) + 'ms';
            } catch (e) {
                el.matchPingVal.textContent = '--';
            }
        }
        measurePing();
        setInterval(measurePing, 10000);

        el.matchRefreshBtn.addEventListener('click', () => {
            if (appMode === 'book') advanceBookPara(1);
            else loadSnippet(pickRaceSnippet());
        });

        // ─────────────────────────────────────────────────────────────
        // 16. EXPORTS FOR TESTS & INITIALIZATION
        // ─────────────────────────────────────────────────────────────
        window.__HIKEYMASH__ = {
            get LITERATURE_SNIPPETS() { return LITERATURE_SNIPPETS; },
            unicodeToKrutiDev,
            getKrutiKeystrokeHint,
            loadSnippet,
            handleKeystroke,
            pickSnippet,
            pickRaceSnippet,
            startRace,
            showLobby,
            openBook,
            advanceBookPara,
            raceConfig,
            finishTest,
            get appMode() { return appMode; },
            get bookState() { return bookState; },
            getState: () => ({
                currentSnippet,
                targetKruti: targetKrutiText,
                currentIndex: cursorIndex,
                totalKeystrokes: totalTyped,
                mistakes: errorKeystrokes,
                isCompleted: isFinished,
                finalWpm: parseFloat(el.statWpm.textContent) || parseInt(el.resWpm.textContent, 10) || 0,
                finalAccuracy: parseInt(el.statAcc.textContent, 10) || 100
            })
        };

        renderVirtualKeyboard();
        showLobby();

