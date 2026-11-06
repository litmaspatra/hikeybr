'use strict';

        // 7. SNIPPET PICKER & INITIALIZER
        // ─────────────────────────────────────────────────────────────
        // Paragraphs already served this session: never repeat a paragraph
        // until every other candidate in the pool has been served.
        const recentSnippetIds = [];
        function pickFromPool(pool, excludeId = null) {
            let candidates = pool;
            if (excludeId && candidates.length > 1) {
                candidates = candidates.filter(s => s.id !== excludeId);
            }
            if (candidates.length > 3 && recentSnippetIds.length) {
                const fresh = candidates.filter(s => !recentSnippetIds.includes(s.id));
                if (fresh.length) candidates = fresh;
            }
            const chosen = candidates[Math.floor(Math.random() * candidates.length)];
            recentSnippetIds.push(chosen.id);
            const cap = Math.min(40, Math.max(1, pool.length - 1));
            while (recentSnippetIds.length > cap) recentSnippetIds.shift();
            return chosen;
        }

        function pickSnippet(cat = 'all', excludeId = null) {
            return pickFromPool(LITERATURE_SNIPPETS, excludeId);
        }

        // Race content pool: cinema dialogues (data/cinema.js) and the
        // literature library (data/quotes.js), always mixed together.
        let cinemaCache = null;
        function cinemaSnippets() {
            if (cinemaCache) return cinemaCache;
            const lib = Array.isArray(window.__HIKEYMASH_CINEMA__) ? window.__HIKEYMASH_CINEMA__ : [];
            if (!lib.length) return [];
            cinemaCache = lib.map(d => ({
                id: d.id,
                title: (d.source && d.source.title) || 'सिनेमा',
                author: [(d.source && d.source.character), (d.source && d.source.year)].filter(Boolean).join(' • ') || 'फ़िल्म संवाद',
                category: 'cinema',
                genre: 'संवाद',
                difficulty: 'easy',
                text: d.text
            }));
            return cinemaCache;
        }

        function racePool() {
            // Content is always mixed: literature library + cinema dialogues.
            return LITERATURE_SNIPPETS.concat(cinemaSnippets());
        }

        function wordCountOf(text) { return text.trim().split(/\s+/).length; }
        function tierOf(wc) { return wc <= 38 ? 'short' : wc <= 65 ? 'medium' : 'long'; }

        function pickRaceSnippet() {
            const pool = racePool();
            const tiered = pool.filter(sn => tierOf(wordCountOf(sn.text)) === raceConfig.len);
            // A tier with almost no entries (e.g. long cinema dialogues) falls
            // back to the whole category rather than repeating 1-2 paragraphs.
            const effective = tiered.length >= 3 ? tiered : pool;
            return pickFromPool(effective, currentSnippet ? currentSnippet.id : null);
        }

        function loadSnippet(snippet) {
            if (typeof snippet === 'string') {
                snippet = LITERATURE_SNIPPETS.find(s => s.id === snippet) || LITERATURE_SNIPPETS[0];
            }
            currentSnippet = snippet;
            document.body.classList.remove('showing-lobby');
            isFinished = false;
            sessionStartTime = null;
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = null;
            elapsedSeconds = 0;
            correctKeystrokes = 0;
            errorKeystrokes = 0;
            totalTyped = 0;
            cursorIndex = 0;
            mistakeWordIndices.clear();
            keystrokeLog = [];

            // Guess-the-title banner stays hidden while typing
            el.snippetGenre.textContent = snippet.genre || 'उपन्यास';
            const srQuote = document.getElementById('sr-quote');
            if (srQuote) srQuote.textContent = snippet.title + ', ' + snippet.author + ': ' + snippet.text;
            const rawWords = snippet.text.trim().split(/\s+/);
            el.snippetWordCount.textContent = rawWords.length + ' शब्द';
            el.snippetCharCount.textContent = snippet.text.length + ' अक्षर';

            // Convert Unicode literature text into KrutiDev keystroke target
            targetKrutiText = unicodeToKrutiDev(snippet.text.trim());

            // Reset racer tracks
            el.playerPill.style.left = '5%';
            el.playerPill.textContent = rawWords[0] || 'शुरू';
            el.playerWpm.textContent = '0.00 WPM';
            el.bot1Pill.style.left = '5%';
            el.bot1Pill.textContent = 'शुरू';
            el.bot1Wpm.textContent = '0.00 WPM';
            el.bot2Pill.style.left = '5%';
            el.bot2Pill.textContent = 'शुरू';
            el.bot2Wpm.textContent = '0.00 WPM';
            stopBots();

            updateDisplay();
            el.resultsModal.classList.remove('open');
            document.body.classList.remove('showing-results');
            setTimeout(() => el.hiddenInput.focus(), 60);
        }

        // ─────────────────────────────────────────────────────────────
