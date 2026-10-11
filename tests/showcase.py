"""Immersive portfolio: navigation, project stories, fallbacks, and responsive QA."""
import os
import re
from hashlib import sha256
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(os.environ.get('SCREENSHOT_DIR', '/tmp/immersive-qa'))
out.mkdir(parents=True, exist_ok=True)
url = os.environ.get('PORTFOLIO_URL', 'http://localhost:4173')
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'), args=[
        '--no-sandbox', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    errors, screenshots = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: screenshots.append(r.url) if re.search(r'\.(gif|webp|png|jpg)(\?|$)', r.url) else None)
    page.goto(url, wait_until='networkidle')
    page.wait_for_selector('.webgl-ready')
    assert page.locator('#previous-chapter').is_disabled()
    assert page.locator('#motion-toggle').get_attribute('aria-pressed') == 'true'
    for i in range(7):
        page.locator(f'.chapter-dots [data-chapter="{i}"]').click()
        assert page.locator('.exhibit').get_attribute('data-chapter') == str(i)
        assert page.locator(f'.chapter-dots [data-chapter="{i}"]').get_attribute('aria-current') == 'step'
        assert not re.search(r'[가-힣]', page.locator('body').inner_text())
        page.screenshot(path=str(out / f'desktop-{i}.png'))
        page.locator('#chapter-action').click()
        if i in (2, 3):
            assert page.locator('#project-dialog').evaluate('d=>d.open')
            assert page.locator('#dialog-title').inner_text() == ['PLC AI Studio', 'Water Treatment SCADA'][i - 2]
        else:
            assert page.locator('#library-dialog').evaluate('d=>d.open')
        page.keyboard.press('Escape')
        assert page.locator('#chapter-action').evaluate('e=>e===document.activeElement')
    assert page.locator('#next-chapter').is_disabled()
    # Keyboard, wheel, drag and the map share the same chapter state.
    page.keyboard.press('Home')
    page.mouse.move(700, 300)
    page.mouse.wheel(0, 120)
    page.wait_for_timeout(100)
    assert page.locator('.exhibit').get_attribute('data-chapter') == '1'
    page.keyboard.press('ArrowRight')
    assert page.locator('.exhibit').get_attribute('data-chapter') == '2'
    page.mouse.move(700, 700)
    page.mouse.down()
    page.mouse.move(530, 700, steps=6)
    page.mouse.up()
    assert page.locator('.exhibit').get_attribute('data-chapter') == '3'
    # Real raycast on the floating SCADA diagram.
    page.mouse.click(960, 350)
    assert page.locator('#dialog-title').inner_text() == 'Water Treatment SCADA'
    assert page.locator('#project-dialog').evaluate('d=>d.open')
    page.keyboard.press('Escape')
    page.locator('#overview-toggle').click()
    assert page.locator('#overview').is_visible()
    assert page.locator('#chapter-copy').evaluate('e=>e.inert')
    page.screenshot(path=str(out / 'overview.png'))
    page.locator('#overview [data-chapter="5"]').click()
    assert page.locator('.exhibit').get_attribute('data-chapter') == '5'
    assert not page.locator('#overview').is_visible()
    # All project details remain readable without original imagery.
    page.locator('.exhibit-header [data-open-library="projects"]').click()
    assert page.locator('.archive-item').count() == 11
    for category, count in [('ai', 2), ('industrial', 6), ('software', 3), ('all', 11)]:
        page.locator(f'[data-filter="{category}"]').click()
        assert page.locator('.archive-item').count() == count
    for item in page.locator('.archive-item').all():
        item.click()
        assert page.locator('#dialog-content img').count() == 0
        assert page.locator('#dialog-content .system-flow').is_visible()
        assert not re.search(r'[가-힣]', page.locator('#project-dialog').inner_text())
        page.keyboard.press('Escape')
        assert page.locator('#library-dialog').evaluate('d=>d.open')
    for section in ['identity', 'projects', 'experience', 'contact']:
        page.locator(f'[data-library="{section}"]').click()
        assert not re.search(r'[가-힣]', page.locator('#library-dialog').inner_text())
    page.locator('#library-close').click()
    for width, height in [(390, 844), (320, 568), (844, 390), (740, 390)]:
        page.set_viewport_size({'width': width, 'height': height})
        page.wait_for_timeout(150)
        for i in [0, 1, 3, 6]:
            page.locator(f'.chapter-dots [data-chapter="{i}"]').click()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight')
            for selector in ['#chapter-action', '#chapter-title', '.exhibit-footer', '.exhibit-header']:
                r = page.locator(selector).bounding_box()
                assert r['x'] >= 0 and r['y'] >= 0 and r['x'] + r['width'] <= width + 1 and r['y'] + r['height'] <= height, (selector, width, r)
            if i in [0, 3]:
                page.screenshot(path=str(out / f'mobile-{width}-{i}.png'))
        page.locator('#overview-toggle').click()
        page.locator('#overview [data-chapter="6"]').click()
        page.locator('#chapter-action').click()
        assert page.locator('#contact').is_visible()
        page.keyboard.press('Escape')
    page.set_viewport_size({'width': 1000, 'height': 700})
    page.keyboard.press('Home')
    page.locator('#motion-toggle').click()
    before = sha256(page.locator('#identity-canvas').screenshot()).hexdigest()
    page.wait_for_timeout(400)
    assert before != sha256(page.locator('#identity-canvas').screenshot()).hexdigest()
    page.locator('#motion-toggle').click()
    page.wait_for_timeout(100)
    frozen = sha256(page.locator('#identity-canvas').screenshot()).hexdigest()
    page.wait_for_timeout(300)
    assert frozen == sha256(page.locator('#identity-canvas').screenshot()).hexdigest()
    page.goto(url + '/#experience', wait_until='networkidle')
    assert page.locator('#experience').is_visible()
    assert not screenshots, screenshots
    page.close()
    fallback = browser.new_page(viewport={'width': 390, 'height': 844})
    fallback.on('pageerror', lambda e: errors.append(str(e)))
    fallback.add_init_script("const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t.startsWith('webgl')?null:g.call(this,t,...a)}")
    fallback.goto(url, wait_until='networkidle')
    assert fallback.locator('.scene-fallback').is_visible()
    assert not fallback.locator('#motion-toggle').is_visible()
    fallback.locator('.chapter-dots [data-chapter="2"]').click()
    fallback.locator('#chapter-action').click()
    assert fallback.locator('#dialog-title').inner_text() == 'PLC AI Studio'
    fallback.keyboard.press('Escape')
    fallback.locator('.exhibit-header [data-open-library="projects"]').click()
    assert fallback.locator('.archive-item').count() == 11
    assert fallback.locator('html').get_attribute('lang') == 'en'
    assert not errors, errors
    browser.close()
    print('PASS seven chapters, wheel/drag/keyboard/map, 3D picking, 11 diagram-only projects, responsive controls, focus, animation/pause, deep links, and WebGL fallback')
