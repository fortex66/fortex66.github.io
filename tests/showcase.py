"""Factory Road: continuous travel, four modes, eleven project stations, and fallback."""
import os
import re
from hashlib import sha256
from pathlib import Path
from playwright.sync_api import sync_playwright

out=Path(os.environ.get('SCREENSHOT_DIR','/tmp/factory-road-qa'));out.mkdir(parents=True,exist_ok=True)
url=os.environ.get('PORTFOLIO_URL','http://localhost:4173')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'),args=['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
    errors,images=[],[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:images.append(r.url) if re.search(r'\.(gif|webp|png|jpg)(\?|$)',r.url) else None)
    page.goto(url,wait_until='networkidle');page.wait_for_selector('.webgl-ready')
    assert page.locator('.mode-nav button').all_text_contents()==['ROAD','OVERVIEW','LIST','ABOUT']
    assert page.locator('#motion-toggle').get_attribute('aria-pressed')=='true'
    page.screenshot(path=str(out/'road.png'))
    # Small wheel deltas move immediately and proportionally in both directions.
    page.mouse.move(700,350)
    def position():return page.evaluate('window.factoryState.progress')
    page.mouse.wheel(0,20);page.wait_for_timeout(100);first=position()
    assert 0<first<.01,first
    page.mouse.wheel(0,20);page.wait_for_timeout(100);second=position()
    assert abs(second-first*2)<.000001,(first,second)
    page.mouse.wheel(0,-10);page.wait_for_timeout(100)
    assert abs(position()-first*1.5)<.000001
    before=position();page.mouse.move(700,350);page.mouse.down();page.mouse.move(550,350,steps=5);page.mouse.up()
    assert position()>before
    page.keyboard.press('End');assert position()==1
    page.keyboard.press('Home');assert position()==0
    slider=page.locator('#road-progress');slider.focus();page.keyboard.press('End');assert position()==1
    page.keyboard.press('Home');assert position()==0
    # The overview is the actual scene with all eleven selectable station markers.
    page.locator('.mode-nav [data-mode="overview"]').click()
    assert page.locator('.map-marker:visible').count()==11
    page.screenshot(path=str(out/'overview.png'))
    for i in [0,4,8,10]:
        page.locator('.mode-nav [data-mode="overview"]').click()
        page.locator(f'.map-marker[data-stop="{i}"]').click()
        assert page.locator('#portfolio').get_attribute('data-mode')=='road'
        assert page.locator('#scene-viewport').get_attribute('data-current-station')==str(i)
        page.locator('#station-open').click()
        assert page.locator('#project-dialog').evaluate('e=>e.open')
        page.keyboard.press('Escape')
        assert page.locator('#station-open').evaluate('e=>e===document.activeElement')
    # Index contains all projects, with direct detail and road-entry actions.
    page.locator('.mode-nav [data-mode="list"]').click()
    assert page.locator('.project-row').count()==11
    assert page.locator('.era-heading h3').all_text_contents()==['SL Corporation','Industrial Automation Company','University Years']
    assert page.locator('.career-projects').nth(1).locator('.project-name').evaluate_all("nodes=>nodes.map(n=>n.dataset.project)")==['water','embedded','viewer']
    page.screenshot(path=str(out/'list.png'))
    for button in page.locator('.project-name').all():
        title=button.locator('h3').inner_text();button.click()
        if button.get_attribute('data-project')=='water':
            assert '2024.06 — 2024.09' in page.locator('#dialog-content').inner_text()
            assert 'Contract project commissioned by Industrial Automation Company' in page.locator('#dialog-content').inner_text()
        if button.get_attribute('data-project')=='viewer':
            assert '2021 · Industrial Automation Company' in page.locator('#dialog-content').inner_text()
        assert page.locator('#dialog-title').inner_text()==title
        assert page.locator('.system-flow').is_visible()
        assert page.locator('#dialog-content img').count()==0
        assert not re.search(r'[가-힣]',page.locator('#project-dialog').inner_text())
        page.keyboard.press('Escape')
        assert button.evaluate('e=>e===document.activeElement')
    page.locator('.locate-project[data-stop="5"]').click()
    assert page.locator('#station-title').inner_text()=='Water Treatment SCADA'
    page.screenshot(path=str(out/'water.png'))
    page.locator('.mode-nav [data-mode="about"]').click()
    about=page.locator('#about-panel').inner_text()
    for phrase in ['SL Corporation','Production Engineering Center','Software Developer','Computer Science','2018.03 — 2025.02']:
        assert phrase in about
    assert 'SA Team' not in about and 'Yeungnam' not in about
    for removed in ['RECOGNITION','CREDENTIALS','SQLD','Mentoring','Engineer Information Processing']:
        assert removed not in about
    page.screenshot(path=str(out/'about.png'))
    # Portrait overview must keep every marker, including the end stations, in view.
    for w,h in [(390,844),(320,568),(844,390),(740,390)]:
        page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(120)
        page.locator('.mode-nav [data-mode="road"]').click()
        page.keyboard.press('Home')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight')
        for selector in ['.site-header','#station-card','.road-footer']:
            r=page.locator(selector).bounding_box()
            assert r['x']>=0 and r['y']>=0 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h,(selector,w,r)
        page.screenshot(path=str(out/f'road-{w}.png'))
        page.locator('.mode-nav [data-mode="overview"]').click()
        assert page.locator('.map-marker:visible').count()==11,(w,page.locator('.map-marker:visible').count())
        page.screenshot(path=str(out/f'overview-{w}.png'))
        page.locator('.map-marker[data-stop="10"]').click()
        assert page.locator('#station-title').inner_text()=='SmartFarm'
        page.locator('.mode-nav [data-mode="about"]').click()
        assert page.locator('#about-panel').is_visible()
    # Ambient motion never advances the road on its own and stops on demand.
    page.set_viewport_size({'width':1000,'height':700});page.locator('.mode-nav [data-mode="road"]').click();page.keyboard.press('Home')
    page.locator('#motion-toggle').click();before=sha256(page.locator('canvas').screenshot()).hexdigest()
    page.wait_for_timeout(500);assert before!=sha256(page.locator('canvas').screenshot()).hexdigest()
    assert position()==0
    page.locator('#motion-toggle').click();page.wait_for_timeout(100);frozen=sha256(page.locator('canvas').screenshot()).hexdigest()
    page.wait_for_timeout(350);assert frozen==sha256(page.locator('canvas').screenshot()).hexdigest()
    assert not images,images
    page.goto(url+'/#experience',wait_until='networkidle');assert page.locator('#about-panel').is_visible()
    page.close()
    fallback=browser.new_page(viewport={'width':390,'height':844})
    fallback.on('pageerror',lambda e:errors.append(str(e)))
    fallback.add_init_script("const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t.startsWith('webgl')?null:g.call(this,t,...a)}")
    fallback.goto(url,wait_until='networkidle');assert fallback.locator('.scene-fallback').is_visible()
    assert not fallback.locator('#motion-toggle').is_visible()
    fallback.locator('.mode-nav [data-mode="list"]').click();assert fallback.locator('.project-row').count()==11
    assert not fallback.locator('.scene-fallback').is_visible()
    fallback.locator('.project-name[data-project="plc-ai"]').click();assert fallback.locator('#dialog-title').inner_text()=='PLC AI Studio'
    fallback.keyboard.press('Escape');fallback.locator('.mode-nav [data-mode="about"]').click()
    assert not fallback.locator('.scene-fallback').is_visible()
    assert not re.search(r'[가-힣]',fallback.locator('body').inner_text())
    assert not errors,errors
    browser.close()
    print('PASS continuous proportional travel, drag/keyboard/slider, four modes, all 11 stations/projects, responsive overview, focus, motion/pause, no photos, deep links, WebGL fallback')
