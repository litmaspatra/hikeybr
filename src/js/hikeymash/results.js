'use strict';

        // 10. FINISH TEST & RESULTS RENDERER (IMAGE 1)
        // ─────────────────────────────────────────────────────────────
        function finishTest() {
            if (isFinished) return;
            isFinished = true;
            if (timerInterval) clearInterval(timerInterval);
            stopBots();

            sound.win();

            const seconds = Math.max(1, elapsedSeconds);
            const mins = seconds / 60;
            const netWpm = Math.min(250, ((correctKeystrokes / 5) / mins));
            const rawWpm = Math.min(250, ((totalTyped / 5) / mins));
            const acc = totalTyped > 0 ? Math.round((correctKeystrokes / totalTyped) * 100) : 100;

            // Book Reader: no results screen - toast the speed and flow
            // straight into the next paragraph (keybr-style continuity).
            if (appMode === 'book') {
                showParaToast(Math.round(netWpm) + ' WPM • ' + acc + '% सटीकता');
                inputLocked = true;
                setTimeout(() => { inputLocked = false; advanceBookPara(1); }, 850);
                return;
            }

            // Fill Image 1 Statistics Cards
            el.statWpm.textContent = netWpm.toFixed(2);
            el.statAcc.textContent = acc + '%';
            el.statTime.textContent = seconds.toFixed(2) + 's';
            el.statMistakes.textContent = errorKeystrokes;

            // Fill Title & Author Card
            el.resQuoteTitle.textContent = currentSnippet.title;
            el.resQuoteAuthor.textContent = currentSnippet.author;

            // Fill Word Review Card with red mistakes (Image 1 bottom right)
            renderReviewCard();

            // Fill Bottom Finish Track
            const words = currentSnippet.text.trim().split(/\s+/);
            el.bottomFinishWord.textContent = words[words.length - 1] || 'पूर्ण';
            el.bottomFinishWpm.textContent = netWpm.toFixed(2) + ' WPM';

            // Fill Performance Diagnostics
            renderPerformanceView(netWpm, rawWpm);

            // Populate Replay View
            initReplayView();

            // Save to localStorage & render Summary
            saveRaceRecord(netWpm, acc, seconds);
            renderSummaryView();

            // Legacy values for compatibility
            el.resWpm.textContent = Math.round(netWpm);
            el.resAcc.textContent = acc + '%';
            el.resTime.textContent = Math.round(seconds) + 's';
            el.resChars.textContent = correctKeystrokes;
            el.resErrors.textContent = errorKeystrokes;
            el.resRaw.textContent = Math.round(rawWpm);

            document.body.classList.add('showing-results');
            el.resultsModal.classList.add('open');

            // Default to Match -> Statistics tab
            activateTopTab('panel-match');
            activateSubtab('view-stats');

            setTimeout(() => el.modalNextBtn.focus(), 100);
        }

        // Render review text with red words for mistakes (Image 1 right card)
        function renderReviewCard() {
            const words = currentSnippet.text.trim().split(/\s+/);
            el.resReviewText.innerHTML = '';
            words.forEach((w, idx) => {
                const span = document.createElement('span');
                if (mistakeWordIndices.has(idx)) {
                    span.className = 'word-mistake';
                } else {
                    span.className = 'word-correct';
                }
                span.textContent = w + ' ';
                el.resReviewText.appendChild(span);
            });
        }

        // ─────────────────────────────────────────────────────────────
