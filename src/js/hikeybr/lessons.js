'use strict';

        // 8. 25-WORD PHONOTACTIC HINDI LESSON GENERATOR
        // ─────────────────────────────────────────────────────────────
        // Book and poem text (public-domain texts in books.js). Lessons are read in order
        // and the position is remembered, like keybr's book lessons. Free practice: no unlocks.
        const bookWordCache={};
        const PUNCT_RE=/[।॥,;:!?"'“”‘’()\[\]\-–—.…॰]/g;
        function findBook(id){
            if(id==='custom')return opts.customText.trim()?{id:'custom',title:'Custom text',author:'You',kind:'custom',lines:opts.customText.split(/\n+/).filter(l=>l.trim())}:null;
            return (window.HIKEYBR_BOOKS||[]).find(b=>b.id===id);
        }
        // Paragraphs of typable words (Unicode) for a book, honoring "remove punctuation".
        function bookParagraphs(book){
            const key=book.id+(opts.removePunct?':np':':p')+(book.id==='custom'?':'+opts.customText.length:'');
            if(bookWordCache[key])return bookWordCache[key];
            const out=[];
            for(const line of book.lines){
                const ws=[];
                for(let w of line.split(/\s+/)){
                    if(opts.removePunct)w=w.replace(PUNCT_RE,'');
                    if(!w||!isSuitableWord(w))continue;
                    const seq=unicodeToKrutiDev(w);
                    if(/[\u0900-\u097f]/.test(seq)||!seq.length)continue;
                    ws.push(w);
                }
                if(ws.length)out.push(ws);
            }
            return bookWordCache[key]=out;
        }
        function bookStats(book){
            const paras=bookParagraphs(book),all=paras.flat();
            const chars=all.reduce((n,w)=>n+[...w].length,0);
            return {paragraphs:paras.length,words:all.length,unique:new Set(all).size,chars,avg:all.length?chars/all.length:0};
        }
        function bookLessonText(book,count){
            const paras=bookParagraphs(book);
            if(!paras.length)return '';
            let pos=Number.isInteger(bookPos[book.id])?((bookPos[book.id]%paras.length)+paras.length)%paras.length:0;
            const out=[];let n=0,used=0;
            while(out.length<count&&used<paras.length){
                out.push(...paras[(pos+n)%paras.length]);n++;used++;
            }
            if(out.length>count*2)out.length=count*2;
            bookPos[book.id]=(pos+n)%paras.length;
            lastLessonParaStart=pos;
            const st=document.getElementById('word-pool-status');
            if(st)st.textContent=`${book.title} · ${book.author} · paragraph ${pos+1}${n>1?'–'+(pos+n):''} of ${paras.length.toLocaleString()}`;
            updateBookStatCard(pos);
            return out.join(' ');
        }
        let lastLessonParaStart=0;
        let forceTab=null;
        function currentTab(){if(forceTab)return forceTab;return textSource==='words'?'words':(textSource==='custom'?'custom':'books');}
        function populateTextSources(){
            const sel=document.getElementById('book-select');if(!sel)return;
            sel.replaceChildren();
            const groups=[['novel','Novels'],['story','Stories'],['poem','Poems and dohas']];
            for(const [kind,label] of groups){
                const bs=(window.HIKEYBR_BOOKS||[]).filter(b=>b.kind===kind);if(!bs.length)continue;
                const og=document.createElement('optgroup');og.label=label;
                bs.forEach(b=>og.appendChild(new Option(`${b.title} - ${b.author}`,b.id)));sel.appendChild(og);
            }
            const books=window.HIKEYBR_BOOKS||[];
            if(!findBook(opts.lastBook)||opts.lastBook==='custom')opts.lastBook=books[0]?books[0].id:'';
            if(textSource!=='words'&&textSource!=='custom'&&findBook(textSource))opts.lastBook=textSource;
            sel.value=opts.lastBook;
            syncSettingsUI();
        }
        function syncSettingsUI(){
            const $=id=>document.getElementById(id);
            const tab=currentTab();
            document.querySelectorAll('.ls-tab').forEach(t=>t.classList.toggle('active',t.dataset.lstab===tab));
            document.querySelectorAll('.ls-pane').forEach(p=>p.hidden=p.dataset.pane!==tab);
            $('opt-strict').checked=!!opts.strict;
            $('opt-repeat').value=opts.repeat;$('opt-repeat-val').textContent=opts.repeat;
            $('opt-punct').value=opts.punct;$('opt-punct-val').textContent=opts.punct+'%';
            $('opt-removepunct').checked=$('opt-removepunct2').checked=!!opts.removePunct;
            $('opt-stop').checked=!!opts.stopOnError;$('opt-skip').checked=!!opts.spaceSkips;
            document.querySelectorAll('input[name=snd]').forEach(r=>r.checked=r.value===opts.soundMode);
            $('opt-volume').value=opts.volume;$('opt-volume-val').textContent=opts.volume+'%';
            $('opt-theme').value=opts.soundTheme;
            if($('custom-text')&&$('custom-text').value!==opts.customText)$('custom-text').value=opts.customText;
            const of=$('opt-font');
            if(of&&!of.options.length){Object.entries(FONT_REGISTRY).forEach(([k,f])=>of.appendChild(new Option(f.label,k)));}
            if(of)of.value=displayFont;
            const ots=$('opt-text-size');if(ots){ots.value=opts.textSize||32;$('opt-text-size-val').textContent=(opts.textSize||32)+'px';}
            applyPracticeTextPrefs();
            updateTextSourceNote();updateBookPanel();
        }
        function updateBookPanel(){
            const book=currentTab()==='books'?findBook(textSource):null;
            const info=document.getElementById('book-info'),list=document.getElementById('para-list'),range=document.getElementById('para-range');
            if(!info)return;
            if(!book){info.replaceChildren();list.replaceChildren();return;}
            const st=bookStats(book),paras=bookParagraphs(book);
            info.innerHTML='';
            const t=document.createElement('div');t.className='bi-title';t.textContent=book.title+' - '+book.author;
            const m=document.createElement('div');m.className='bi-meta';
            m.textContent=`Paragraphs: ${st.paragraphs.toLocaleString()} · All words: ${st.words.toLocaleString()} · Unique words: ${st.unique.toLocaleString()} · Characters: ${st.chars.toLocaleString()} · Average word length: ${st.avg.toFixed(2)}`;
            info.append(t,m);
            range.max=Math.max(1,st.paragraphs);
            const cur=Number.isInteger(bookPos[book.id])?bookPos[book.id]:0;
            const shown=(lastLessonParaStart!=null&&currentLessonText)?lastLessonParaStart:cur;
            range.value=shown+1;
            document.getElementById('para-val').textContent='#'+(shown+1);
            list.replaceChildren();
            for(let i=shown;i<Math.min(paras.length,shown+3);i++){
                const row=document.createElement('div');row.className='para-row'+(i===shown?' cur':'');
                row.textContent=`#${i+1} ${i===shown?'▶ ':''}${paras[i].join(' ')}`;list.appendChild(row);
            }
        }
        function updateLessonPreview(){
            const keys=document.getElementById('lp-keys');if(!keys)return;
            keys.replaceChildren();
            const free=textSource!=='words';
            KEY_PROGRESSION.forEach((item,idx)=>{
                const c=document.createElement('span');
                c.className='lp-key'+((free||idx<=highestUnlocked)?' on':'')+(!free&&idx===unlockedIndex?' cur':'');
                c.textContent=item.h;c.title=item.d||'';keys.appendChild(c);
            });
            const cur=document.getElementById('lp-current');
            const item=KEY_PROGRESSION[unlockedIndex];
            cur.textContent=free?'All keys are unlocked (practice text, no unlocking).':'Current key: '+item.h+' ('+(item.alt?'Alt+'+item.alt:(item.conjunct?item.h:item.k.toUpperCase()))+')';
            const smp=document.getElementById('lp-sample');
            smp.textContent=(currentLessonText||'').split(' ').slice(0,8).join(' ')+' …';
        }
        // Books/custom mode shows book progress in place of the guided-only
        // "Keys Unlocked" stat. Guided stats stay untouched in words mode.
        function updateBookStatCard(paraPos,paraSpan){
            const paraEl=document.getElementById('metric-book-para');if(!paraEl)return;
            const b=textSource==='words'?null:findBook(textSource);
            if(!b)return;
            const paras=bookParagraphs(b),total=paras.length;
            let pos=(typeof paraPos==='number')?paraPos:(Number.isInteger(bookPos[b.id])?bookPos[b.id]:0);
            if(total)pos=((pos%total)+total)%total;
            paraEl.textContent=total?String(pos+1):'\u2013';
            document.getElementById('metric-book-total').textContent=total?total.toLocaleString():'\u2013';
            document.getElementById('metric-book-label').textContent=b.id==='custom'?'Custom Text Progress':'Book Progress';
            document.getElementById('metric-book-title').textContent=b.id==='custom'?'your custom text':`${b.title} - ${b.author}`;
        }
        function updateTextSourceNote(){
            const note=document.getElementById('text-source-note');if(!note)return;
            const b=textSource==='words'?null:findBook(textSource);
            document.documentElement.classList.toggle('book-mode',!!b);
            note.textContent=b?(b.id==='custom'?'Custom text: lessons follow your text in order. Key unlocking is paused.':`${b.title} by ${b.author} (d. ${b.died}, public domain). Practice mode: lessons follow the text in order, key unlocking is paused. Source: ${b.source}`):'Guided lessons: every lesson is built from the keys you have unlocked.';
            updateBookStatCard();
        }
        function generateLessonText() {
            if(textSource!=='words'){const book=findBook(textSource);if(book){const t=bookLessonText(book,parseInt(el.wordsSelect.value,10)||25);if(t)return t;}textSource='words';syncSettingsUI();}
            const unlockedItems = KEY_PROGRESSION.slice(0, highestUnlocked + 1);
            const activeItem = KEY_PROGRESSION[unlockedIndex];
            const wordCount = Math.max(1,Math.ceil((parseInt(el.wordsSelect.value, 10) || 25)/Math.max(1,opts.repeat)));

            // BUG 4 FIX: Keystroke-based eligibility check
            const SHIFT_BASE = { '~':'`', '!':'1', '@':'2', '#':'3', '$':'4', '%':'5', '^':'6', '&':'7', '*':'8', '(':'9', ')':'0', '_':'-', '+':'=', '{':'[', '}':']', '|':'\\', ':':';', '"':"'", '<':',', '>':'.', '?':'/' };
            const unlockedKeySet = new Set(unlockedItems.map(x => x.k));
            const unlockedBytes = new Set();
            unlockedItems.forEach(x => {
                if (x.conjunct) {
                    for (const c of unicodeToKrutiDev(x.h)) {
                        unlockedBytes.add(c);
                    }
                }
            });
            const physKey = c => unlockedKeySet.has(c) ? c : (unlockedKeySet.has(c.toLowerCase()) ? c.toLowerCase() : SHIFT_BASE[c]);

            if(!encodedWordBank){
                const all=[...new Set([...HINDI_WORD_BANK,...FREQUENCY_WORDS,...OFFICIAL_WORDS])].filter(w=>isSuitableWord(w)&&!hiddenWords.includes(w));
                encodedWordBank=all.map(word=>({word,seq:unicodeToKrutiDev(word)})).filter(item=>{
                    return !/[\u0900-\u097f]/.test(item.seq) && item.seq.length>0;
                });
            }
            if(!eligibleWordCache.has(highestUnlocked)){
                eligibleWordCache.set(highestUnlocked,encodedWordBank.filter(({seq})=>[...seq].every(c=>{
                    const pk=physKey(c);return unlockedBytes.has(c)||(pk!==undefined&&unlockedKeySet.has(pk));
                })).map(item=>item.word));
            }
            const eligibleRealWords=eligibleWordCache.get(highestUnlocked);

            const words = [];

            // Real-word-first lessons. Repeat familiar words rather than inventing
            // syllables. Reserve enough target strokes to avoid starving progression.
            const targetSequence = (!activeItem.conjunct&&!activeItem.alt&&activeItem.k.length===1)?activeItem.k:unicodeToKrutiDev(activeItem.h);
            const targetHits = word => {
                const seq = unicodeToKrutiDev(word);
                if (!targetSequence) return 0;
                return seq.split(targetSequence).length - 1;
            };
            const realPool = [...new Set(eligibleRealWords)];
            const focusedPool = realPool.filter(word => targetHits(word) > 0);
            const weak = reviewKey();
            const reviewSequence = weak ? ((!weak.conjunct&&!weak.alt&&weak.k.length===1)?weak.k:unicodeToKrutiDev(weak.h)) : '';
            let reviewPool = weak ? focusedPool.filter(word => unicodeToKrutiDev(word).includes(reviewSequence)) : [];
            const reviewQuota=reviewPool.length?Math.min(Math.ceil(wordCount*.60),wordCount):0;
            const mixedStarters=!reviewMode&&highestUnlocked===INITIAL_UNLOCKED_COUNT-1;
            const starterCounts=Object.fromEntries(unlockedItems.map(item=>[item.k,0]));
            let reviewWords = 0;
            let previous = '';
            const used=new Set(), recent=new Set(recentLessonWords);
            const pick = pool => {
                let choices=pool.filter(word=>!used.has(word)&&!recent.has(word));

                if(!choices.length)choices=pool.filter(word=>!used.has(word));

                if(!choices.length)choices=pool.filter(word=>word!==previous);
                if(!choices.length)choices=pool;
                const chosen=choices[Math.floor(Math.random()*choices.length)];used.add(chosen);return chosen;
            };
            for (let w = 0; w < wordCount; w++) {
                let chosen;
                if (mixedStarters) {
                    // Cover every starter, including pre-base ि. A target-only
                    // pool can starve ि and leave the first unlock stuck.
                    const least=unlockedItems.reduce((a,b)=>starterCounts[a.k]<=starterCounts[b.k]?a:b);
                    const pool=realPool.filter(word=>unicodeToKrutiDev(word).includes(least.k));
                    chosen=pool.length?pick(pool):least.h+KEY_PROGRESSION[0].h;
                    const seq=unicodeToKrutiDev(chosen);
                    unlockedItems.forEach(item=>{starterCounts[item.k]+=seq.split(item.k).length-1;});
                } else if (reviewWords < reviewQuota) {
                    chosen = pick(reviewPool);
                    reviewWords++;
                } else if (focusedPool.length) {
                    chosen = pick(focusedPool);
                } else {
                    // No real word can teach this glyph yet (digits, rare Alt codes,
                    // or very early levels). Use only the minimum short glyph drill.
                    const count = 2;
                    const context=realPool.length?pick(realPool):KEY_PROGRESSION[0].h;
                    chosen = activeItem.h.repeat(count)+' '+context;
                }
                words.push(chosen);
                previous = chosen;
            }
            // Mix drills and review words without changing their quotas.
            for (let i = words.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [words[i], words[j]] = [words[j], words[i]];
            }
            recentLessonWords=recentLessonWords.concat(words).slice(-150);
            if(opts.repeat>1){const r=[];words.forEach(w=>{for(let i=0;i<opts.repeat;i++)r.push(w);});words.length=0;words.push(...r);}
            if(opts.punct>0&&unlockedKeySet.has('a')){for(let i=0;i<words.length;i++)if(Math.random()*100<opts.punct&&!words[i].includes('।'))words[i]+='।';}
            document.getElementById('word-pool-status').textContent=`${focusedPool.length.toLocaleString()} target words / ${eligibleRealWords.length.toLocaleString()} usable at this level / ${encodedWordBank.length.toLocaleString()} total`+(mixedStarters?' · Mixed starter practice: क, ा, ि, र.':focusedPool.length===0?' · New glyph plus unlocked-word practice.':focusedPool.length<wordCount?' · Small target pool: some repetition needed.':'');
            return words.join(' ');
        }

