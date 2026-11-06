'use strict';

        // 5. VIRTUAL KEYBOARD RENDERER
        // ─────────────────────────────────────────────────────────────
        const keyDOMMap = new Map();
        const CLICKABLE_LABEL_KEYS = new Set([' ', 'Backspace']);
        function renderVirtualKeyboard() {
            el.keyboardFrame.innerHTML = '';
            keyDOMMap.clear();
            KB_MATRIX.forEach(row => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'k-row';
                row.forEach(keyDef => {
                    if (keyDef.sp) {
                        const spacerEl = document.createElement('div');
                        spacerEl.className = 'k-spacer';
                        spacerEl.style.flexGrow = String(keyDef.sp);
                        rowDiv.appendChild(spacerEl);
                        return;
                    }
                    const keyEl = document.createElement('div');
                    const classes = ['k-key'];
                    if (keyDef.w) classes.push(keyDef.w);
                    if (keyDef.label) classes.push('label-key');
                    keyEl.className = classes.join(' ');
                    keyEl.dataset.key = keyDef.k;

                    if (keyDef.label) {
                        keyEl.innerHTML = `<span class="hi-main">${keyDef.h}</span>`;
                    } else {
                        const shiftHtml = keyDef.sh ? `<span class="hi-shift">${keyDef.sh}</span>` : '';
                        const enLabel = (keyDef.k.length === 1 && keyDef.k !== ' ') ? keyDef.k.toUpperCase() : '';
                        keyEl.innerHTML = `${shiftHtml}<span class="hi-main">${keyDef.h}</span><span class="en-sub">${enLabel}</span>`;
                    }

                    if (!keyDef.label || CLICKABLE_LABEL_KEYS.has(keyDef.k)) {
                        keyEl.addEventListener('mousedown', (e) => {
                            e.preventDefault();
                            handleKeystroke(keyDef.k);
                        });
                    }

                    keyDOMMap.set(keyDef.k, keyEl);
                    if (keyDef.code) keyDOMMap.set(keyDef.code, keyEl);
                    if (keyDef.k.length === 1) keyDOMMap.set(keyDef.k.toLowerCase(), keyEl);
                    rowDiv.appendChild(keyEl);
                });
                el.keyboardFrame.appendChild(rowDiv);
            });
        }

        function updateKeyboardHighlights(targetInfo) {
            keyDOMMap.forEach((keyEl) => {
                keyEl.classList.remove('target', 'shift-needed');
            });
            if (!targetInfo || !targetInfo.targetKey) return;

            const targetEl = keyDOMMap.get(targetInfo.targetKey.toLowerCase()) || keyDOMMap.get(targetInfo.targetKey);
            if (targetEl) {
                targetEl.classList.add('target');
            }
            if (targetInfo.isShifted) {
                const shiftL = keyDOMMap.get('ShiftLeft');
                const shiftR = keyDOMMap.get('ShiftRight');
                if (shiftL) shiftL.classList.add('shift-needed');
                if (shiftR) shiftR.classList.add('shift-needed');
            }
        }

        // ─────────────────────────────────────────────────────────────
