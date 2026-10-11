"""Personal lab: object stories, camera views, archive, motion and graceful fallback."""
import os
import re
from hashlib import sha256
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(os.environ.get('SCREENSHOT_DIR', '/tmp/lab-qa'))
out.mkdir(parents=True, exist_ok=True)
url = os.environ.get('PORTFOLIO_URL', 'http://localhost:4173')
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'), args=[
        '--no-sandbox', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url, wait_until='networkidle')
    page.wait_for_selector('.webgl-ready')
    page.screenshot(path=str(out / 'desktop.png'))
    assert page.locator('.lab-hotspot:visible').count() == 4
    # A direct click on the monitor surface also opens its project (raycast path).
    marker_box = page.locator('[data-lab-project="water"]').bounding_box()
    page.mouse.click(marker_box['x'] + marker_box['width'] / 2, marker_box['y'] + marker_box['height'] / 2 + 60)
    page.wait_for_selector('#project-dialog[open]')
    assert page.locator('#dialog-title').inner_text() == 'Water Treatment SCADA'
    page.keyboard.press('Escape')
    for project, title in [('water', 'Water Treatment SCADA'), ('plc-ai', 'PLC AI Studio'), ('embedded', 'Industrial Embedded Controllers')]:
        marker = page.locator(f'[data-lab-project="{project}"]')
        marker.click()
        assert page.locator('#dialog-title').inner_text() == title
        page.keyboard.press('Escape')
        assert marker.evaluate('e => e === document.activeElement')
    page.locator('[data-lab-project="experience"]').click()
    assert page.locator('#experience').is_visible()
    page.locator('#library-close').click()
    for view in ['desk', 'bench', 'notes', 'room']:
        page.locator(f'[data-lab-view="{view}"]').click()
        assert page.locator(f'[data-lab-view="{view}"]').get_attribute('aria-pressed') == 'true'
        page.screenshot(path=str(out / f'{view}.png'))
    page.locator('.lab-header [data-open-library="projects"]').click()
    assert page.locator('.archive-item').count() == 11
    for category, count in [('ai', 2), ('industrial', 6), ('software', 3), ('all', 11)]:
        page.locator(f'[data-filter="{category}"]').click()
        assert page.locator('.archive-item').count() == count
    page.locator('.archive-item').first.click()
    page.keyboard.press('Escape')
    assert page.locator('#library-dialog').evaluate('d => d.open')
    for section in ['identity', 'projects', 'experience', 'contact']:
        page.locator(f'[data-library="{section}"]').click()
        assert not re.search(r'[가-힣]', page.locator('#library-dialog').inner_text())
    page.locator('#library-close').click()
    for width, height in [(390, 844), (320, 568), (844, 390), (740, 390)]:
        page.set_viewport_size({'width': width, 'height': height})
        page.wait_for_timeout(300)
        page.screenshot(path=str(out / f'mobile-{width}.png'))
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight')
        for button in page.locator('.lab-footer nav button').all():
            r = button.bounding_box()
            assert r['x'] >= 0 and r['x'] + r['width'] <= width and r['y'] + r['height'] <= height
    page.locator('#motion-toggle').click()
    before = sha256(page.locator('#identity-canvas').screenshot()).hexdigest()
    page.wait_for_timeout(600)
    assert before != sha256(page.locator('#identity-canvas').screenshot()).hexdigest()
    page.locator('#motion-toggle').click()
    page.wait_for_timeout(200)
    frozen = sha256(page.locator('#identity-canvas').screenshot()).hexdigest()
    page.wait_for_timeout(400)
    assert frozen == sha256(page.locator('#identity-canvas').screenshot()).hexdigest()
    page.goto(url + '/#experience', wait_until='networkidle')
    assert page.locator('#experience').is_visible()
    page.close()
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.add_init_script("const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t.startsWith('webgl')?null:g.call(this,t,...a)}")
    page.goto(url, wait_until='networkidle')
    assert not page.locator('#motion-toggle').is_visible()
    assert page.locator('[data-lab-view="room"]').is_disabled()
    page.locator('.lab-header [data-open-library="projects"]').click()
    assert page.locator('.archive-item').count() == 11
    assert page.locator('html').get_attribute('lang') == 'en'
    assert not re.search(r'[가-힣]', page.locator('body').inner_text())
    assert not errors, errors
    browser.close()
    print('PASS four object stories and views, focus restoration, archive filters, nested dialogs, responsive layouts, animation/pause, English content, deep links and WebGL fallback')
