"""Entry regressions: no SVG flash, immediate movement, usable no-WebGL state."""
import os
from hashlib import sha256
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'), args=[
        '--no-sandbox', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    url = os.environ.get('PORTFOLIO_URL', 'http://localhost:4173')
    page.goto(url, wait_until='networkidle')
    page.wait_for_selector('.webgl-ready')
    assert page.locator('.scene-fallback').count() == 0
    assert not page.locator('.scene-loading').is_visible()
    assert not page.locator('#world-start').is_visible()
    assert page.locator('.play-guide').get_attribute('open') is not None
    page.locator('#quality-toggle').click()
    # Keyboard works directly from the document, without a start/canvas click.
    page.evaluate('document.activeElement.blur()')
    canvas = page.locator('#identity-canvas')
    before = sha256(canvas.screenshot()).hexdigest()
    page.keyboard.down('ArrowLeft')
    page.wait_for_timeout(500)
    page.keyboard.up('ArrowLeft')
    after = sha256(canvas.screenshot()).hexdigest()
    assert before != after, 'Initial keyboard movement did not change the scene'
    assert page.locator('.play-guide').get_attribute('open') is None
    page.locator('.play-guide summary').click()
    assert page.locator('.play-guide p').is_visible()
    page.close()
    # Hold the scene module to inspect the actual first-paint loading UI.
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.route('**/scene-*.js', lambda route: route.abort())
    page.goto(url, wait_until='networkidle')
    assert page.locator('.scene-loading').is_visible()
    assert page.locator('.scene-fallback').count() == 0
    page.locator('#world-terminal').click()
    assert page.locator('#library-dialog').evaluate('d => d.open')
    page.close()
    # Browser without WebGL retains direct project access and a clear explanation.
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.add_init_script("const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t.startsWith('webgl')?null:g.call(this,t,...a)}")
    page.goto(url, wait_until='networkidle')
    assert page.locator('.scene-unavailable').count() == 1
    assert '표시할 수 없어요' in page.locator('.scene-loading strong').inner_text()
    page.locator('#world-terminal').click()
    page.locator('[data-library="projects"]').click()
    assert page.locator('#projects').is_visible()
    assert not errors, errors
    browser.close()
    print('PASS immediate keyboard movement, collapsible instructions, no SVG during loading, project access without scene module or WebGL')
