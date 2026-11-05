// HiKeymash regression tests: Remington punctuation, single typing view, inline results.
// Run: node tests/hikeymash.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, '../hikeymash.html'));

    // 1. Punctuation in text converts to the authentic Remington keys.
    const conv = await page.evaluate(() => window.__HIKEYMASH__.unicodeToKrutiDev(',?.;-:!'));
    assert.equal(conv, ']\\-(&%!', 'comma=]  ?=\\  .=-  ;=(  -=&  :=%  !=!');
    assert.equal(await page.evaluate(() => window.__HIKEYMASH__.unicodeToKrutiDev('ए')), ',', "the ',' KEY still types ए");
    assert.equal(await page.evaluate(() => window.__HIKEYMASH__.unicodeToKrutiDev('घ')), '?k', "the '?' byte still types घ");
    assert.equal(await page.evaluate(() => window.__HIKEYMASH__.unicodeToKrutiDev('।')), 'A', 'danda = Shift+A');
    assert.equal(await page.evaluate(() => window.__HIKEYMASH__.unicodeToKrutiDev('॥')), 'AA', 'double danda = two dandas');
    assert.equal(await page.evaluate(() => window.__HIKEYMASH__.unicodeToKrutiDev('राम, क्या?')), 'jke] D;k\\', 'letters untouched, punctuation remapped');

    // 2. Exactly one visual of the paragraph (duplicate preview removed).
    assert.equal(await page.evaluate(() => document.getElementById('literature-preview')), null, 'no duplicate paragraph view');

    // 3. A snippet with punctuation is typed with real key events, including ] and \.
    await page.evaluate(() => window.__HIKEYMASH__.loadSnippet({ id: 't1', title: 'टेस्ट', author: 'परीक्षक', category: 'prose', genre: 'परीक्षण', text: 'राम, सीता?' }));
    const target = await page.evaluate(() => window.__HIKEYMASH__.getState().targetKruti);
    assert.ok(target.includes(']'), 'comma in target as ] byte: ' + target);
    assert.ok(target.includes('\\'), 'question mark in target as \\ byte: ' + target);
    await page.click('#typing-canvas');
    for (const ch of target) {
        if (ch === ' ') await page.keyboard.press('Space');
        else if (ch === '\\') await page.keyboard.press('Backslash');
        else await page.keyboard.press(ch);
    }
    const st = await page.evaluate(() => window.__HIKEYMASH__.getState());
    assert.equal(st.isCompleted, true, 'snippet completes');
    assert.equal(st.mistakes, 0, 'no mistakes with the correct Remington keys');

    // 4. Results appear keymash-style: inline panel replacing the typing area, not a fixed modal window.
    assert.ok(await page.evaluate(() => document.getElementById('results-modal').classList.contains('open')), 'results show');
    assert.ok(await page.evaluate(() => document.body.classList.contains('showing-results')));
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.getElementById('results-modal')).position), 'fixed', 'results are inline, not an overlay window');
    assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('typing-canvas')).display), 'none', 'typing area hidden while results show');
    assert.ok(await page.locator('#modal-next-btn').isVisible(), 'next action visible');
    assert.ok(await page.locator('#modal-retry-btn').isVisible(), 'retry action visible');

    // 5. The next action returns to the typing view.
    await page.click('#modal-next-btn');
    assert.ok(await page.evaluate(() => !document.body.classList.contains('showing-results')), 'results cleared');
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.getElementById('typing-canvas')).display), 'none', 'typing area back after next');

    assert.deepEqual(errors, [], 'no page errors: ' + errors.join(' | '));
    console.log('PASS: Remington punctuation keys, single typing view, inline keymash-style results, next/retry flow.');
    await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
