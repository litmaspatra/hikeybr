// UI regression tests with real key events. Run: node tests/ui.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const url = 'file://' + path.resolve(__dirname, '../index.html');
    const fresh = async (seed) => {
        await page.goto(url);
        await page.evaluate(seed => {
            localStorage.clear();
            if (seed) localStorage.setItem('hikeybr_store_v3', JSON.stringify(seed));
        }, seed);
        await page.reload();
    };

    // 1. Real key events advance the practice cursor.
    await fresh();
    await page.click('#typing-canvas');
    const first = await page.evaluate(() => HiKeybr.targetKrutiText[0]);
    await page.keyboard.press(first === ' ' ? 'Space' : first);
    assert.equal(await page.evaluate(() => HiKeybr.cursorIndex), 1, 'real key advances cursor');
    assert.equal(await page.evaluate(() => HiKeybr.sessionCorrect), 1, 'real key scores once');

    // 2. Custom text field keeps focus while typing (was stolen by the global keydown handler).
    await page.click('#lesson-settings > summary');
    await page.click('.ls-tab[data-lstab="custom"]');
    await page.click('#custom-text');
    await page.keyboard.type('test');
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'custom-text', 'textarea keeps focus');
    assert.equal(await page.locator('#custom-text').inputValue(), 'test', 'typed text lands in the field');

    // 3. Alt-code glyph commits as ONE input unit and matches the target sequence.
    await page.evaluate(() => {
        const t = document.getElementById('custom-text');
        t.value = 'क्त क्त';
        t.dispatchEvent(new Event('change'));
    });
    assert.ok((await page.evaluate(() => HiKeybr.targetKrutiText)).startsWith('Dr'), 'क्त encodes to Remington Dr');
    await page.click('#typing-canvas');
    await page.keyboard.down('Alt');
    for (const k of ['Numpad0', 'Numpad2', 'Numpad0', 'Numpad4']) await page.keyboard.press(k);
    await page.keyboard.up('Alt');
    assert.equal(await page.evaluate(() => HiKeybr.cursorIndex), 2, 'Alt+0204 types both bytes of क्त');
    assert.equal(await page.evaluate(() => HiKeybr.sessionCorrect), 1, 'Alt-code glyph counts as one input unit');
    // A second Alt entry after a real space gets a valid whole-entry timing.
    await page.keyboard.press('Space');
    await page.waitForTimeout(80);
    await page.keyboard.down('Alt');
    for (const k of ['Numpad0', 'Numpad2', 'Numpad0', 'Numpad4']) await page.keyboard.press(k);
    await page.keyboard.up('Alt');
    assert.equal(await page.evaluate(() => HiKeybr.cursorIndex), 5, 'second क्त + space committed');
    assert.equal(await page.evaluate(() => HiKeybr.sessionCorrect), 3, 'each Alt glyph still one unit');

    // 4. Speed controls: Settings dropdown and lesson slider offer and accept the same values.
    const optionValues = await page.$$eval('#settings-speed-goal option', os => os.map(o => o.value));
    for (let v = 10; v <= 100; v += 5) assert.ok(optionValues.includes(String(v)), 'dropdown offers ' + v + ' WPM');
    await page.click('.nav-tab[data-target="settings"]');
    await page.selectOption('#settings-speed-goal', '45');
    assert.equal(await page.locator('#speed-goal-select').inputValue(), '45', 'dropdown drives the lesson slider');
    await page.evaluate(() => {
        const s = document.getElementById('speed-goal-select');
        s.value = '55';
        s.dispatchEvent(new Event('change'));
    });
    assert.equal(await page.locator('#settings-speed-goal').inputValue(), '55', 'lesson slider drives the dropdown');

    // 5. Reload persists settings.
    await page.reload();
    assert.equal(await page.locator('#settings-speed-goal').inputValue(), '55', 'speed goal survives reload');
    assert.equal(await page.locator('#speed-goal-select').inputValue(), '55', 'slider survives reload');

    // 6. Strict unlock: an unmeasured earlier key blocks unlocking even when the
    //    current key is ready; measuring it at goal speed unblocks.
    const readyTarget = { modelSamples: 10, modelTtt: 100, ttt: 100, tttSamples: 10, accurateBest: 100, lastAccuracy: 100, recentLessonAccuracy: 100 };
    const qualified = { modelSamples: 6, modelTtt: 100, ttt: 100, tttSamples: 6, lastAccuracy: 100 };
    const seedStrict = (dStats) => ({
        unlockedIndex: 4, highestUnlocked: 4,
        opts: { strict: true },
        keyStats: { s: readyTarget, k: qualified, f: qualified, j: qualified, ...(dStats ? { d: dStats } : {}) }
    });
    await fresh(seedStrict(null));
    let status = await page.locator('#lead-samples-status').textContent();
    assert.ok(status.includes('earlier keys must also reach the target speed'), 'strict blocks on unmeasured earlier key');
    await fresh(seedStrict(qualified));
    status = await page.locator('#lead-samples-status').textContent();
    assert.ok(status.includes('goal reached'), 'strict passes once every earlier key is measured at goal speed');

    // 7. Save failure surfaces a warning with an export option.
    await fresh();
    await page.evaluate(() => {
        const real = Storage.prototype.setItem;
        window.__restoreSetItem = () => { Storage.prototype.setItem = real; };
        Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
        document.getElementById('opt-strict').dispatchEvent(new Event('change'));
    });
    await page.waitForSelector('#storage-warning', { timeout: 3000 });
    const warnText = await page.locator('#storage-warning').textContent();
    assert.ok(warnText.includes('could not be saved'), 'save failure warns the user');
    assert.ok(await page.locator('#storage-warning button').count() >= 1, 'warning offers an export');
    const downloadPromise = page.waitForEvent('download');
    await page.click('#storage-warning button');
    const download = await downloadPromise;
    assert.ok(download.suggestedFilename().endsWith('.json'), 'export downloads progress JSON');

    assert.deepEqual(errors, [], 'no page errors: ' + errors.join(' | '));
    console.log('PASS: real key events, custom text focus, Alt-code unit scoring, speed control sync, reload persistence, strict unlock, save-failure warning.');
    await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
