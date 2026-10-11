import os
import re
from hashlib import sha256
from playwright.sync_api import sync_playwright
from pathlib import Path
out=Path(os.environ.get('SCREENSHOT_DIR','/tmp/showcase-qa'));out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'),args=['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('PORTFOLIO_URL','http://localhost:4173'),wait_until='networkidle');page.wait_for_selector('.webgl-ready');page.screenshot(path=str(out/'desktop.png'))
 for view in ['ot','it','ai']:
  page.locator(f'[data-view="{view}"]').click();page.wait_for_function(f"document.querySelector('[data-view=\"{view}\"]').getAttribute('aria-current')==='true'",timeout=15000)
  assert page.locator(f'[data-view="{view}"]').get_attribute('aria-current')=='true'
 page.screenshot(path=str(out/'ai.png'))
 page.locator('#chapter-ai [data-open-library]').click();assert page.locator('#projects').is_visible();assert page.locator('.archive-item').count()==2
 page.locator('.archive-item').first.click();assert page.locator('#project-dialog').evaluate('e=>e.open');page.keyboard.press('Escape');page.locator('#library-close').click()
 for w,h in [(390,844),(320,568),(844,390),(740,390)]:
  page.set_viewport_size({'width':w,'height':h});page.locator('[data-view="overview"]').click();page.wait_for_timeout(400);page.screenshot(path=str(out/f'mobile-{w}.png'))
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('#motion-toggle').click();assert page.locator('#motion-toggle').get_attribute('aria-pressed')=='false'
 before=sha256(page.locator('#identity-canvas').screenshot()).hexdigest()
 page.wait_for_timeout(600)
 after=sha256(page.locator('#identity-canvas').screenshot()).hexdigest()
 assert before!=after,'The production cell should animate when motion is enabled'
 page.locator('#motion-toggle').click();assert page.locator('#motion-toggle').get_attribute('aria-pressed')=='true'
 page.wait_for_timeout(200)
 frozen=sha256(page.locator('#identity-canvas').screenshot()).hexdigest()
 page.wait_for_timeout(400)
 assert frozen==sha256(page.locator('#identity-canvas').screenshot()).hexdigest(),'Pause should freeze the production cell'
 page.goto(os.environ.get('PORTFOLIO_URL','http://localhost:4173')+'/#experience',wait_until='networkidle');assert page.locator('#experience').is_visible()
 for section in ['identity','projects','experience','contact']:
  page.locator(f'[data-library="{section}"]').click()
  assert not re.search(r'[가-힣]',page.locator('#library-dialog').inner_text()),section
 page.close()
 page=b.new_page(viewport={'width':390,'height':844})
 page.add_init_script("const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t.startsWith('webgl')?null:g.call(this,t,...a)}")
 page.goto(os.environ.get('PORTFOLIO_URL','http://localhost:4173'),wait_until='networkidle')
 assert not page.locator('#motion-toggle').is_visible()
 page.locator('.showcase-nav [data-open-library="projects"]').click();assert page.locator('.archive-item').count()==11
 page.locator('.archive-item').first.click();assert page.locator('#project-dialog').evaluate('e=>e.open')
 assert page.locator('html').get_attribute('lang') == 'en'
 assert not re.search(r'[가-힣]',page.locator('body').inner_text())
 for project in page.evaluate('window.portfolioProjects'):
  assert not re.search(r'[가-힣]',str(project)),project['id']
 assert not errors,errors
 b.close();print('PASS showcase navigation, filtered archive, nested dialogs, responsive widths, English interface and all 11 project records; no JS errors')
