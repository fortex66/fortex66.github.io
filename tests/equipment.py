"""Validate equipment layout and timed behavior without shipping a debug API."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

url = os.environ.get('PORTFOLIO_URL', 'http://localhost:4173')
out = Path(os.environ.get('SCREENSHOT_DIR', '/tmp/factory-equipment-qa'))
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'), args=[
        '--no-sandbox', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width':1000, 'height':700}, reduced_motion='reduce')
    page.set_default_timeout(120000)  # Software WebGL shader compilation can be slow.
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    def instrument(route):
        response = route.fetch()
        source = response.text().replace(
            "window.dispatchEvent(new CustomEvent('factory-ready'",
            "window.equipmentQA={stations,carrier,at(t){time=t;draw();}};"
            "window.dispatchEvent(new CustomEvent('factory-ready'")
        route.fulfill(response=response, body=source)

    page.route('**/scene-*.js', instrument)
    page.goto(url, wait_until='networkidle')
    page.wait_for_selector('.webgl-ready')

    def visit(index):
        page.evaluate('(i)=>window.dispatchEvent(new CustomEvent("factory-visit",{detail:i}))', index)
        page.wait_for_function('(i)=>document.querySelector("#scene-viewport").dataset.currentStation===String(i)', arg=index)

    # Ambient gestures never move the carrier along the route; scrolling does.
    visit(0)
    initial_carrier = page.evaluate('equipmentQA.carrier.position.toArray()')
    assert page.evaluate('''() => {
        const carrier=equipmentQA.carrier,head=carrier.getObjectByName('companion-head');
        equipmentQA.at(0);const position=carrier.position.clone(),rotation=head.rotation.y;
        equipmentQA.at(2);return carrier.position.equals(position) && head.rotation.y!==rotation;
    }''')
    page.screenshot(path=str(out/'companion-desktop.png'))
    # Lamps sit between the two robot bases; four vision robots face the fixture.
    visit(2)
    assert page.evaluate('''() => {
        const g=equipmentQA.stations[2],lamp=g.getObjectByName('automotive-headlamp');
        const left=g.getObjectByName('lamp-robot-left'),right=g.getObjectByName('lamp-robot-right');
        return left.position.x<lamp.position.x && lamp.position.x<right.position.x;
    }''')
    page.screenshot(path=str(out/'lamp.png'))
    visit(3)
    assert page.evaluate('equipmentQA.carrier.position.toArray()') != initial_carrier
    assert page.evaluate('''() => {
        const robots=equipmentQA.stations[3].children.filter(o=>o.name.startsWith('vision-robot-'));
        return robots.length===4 && robots.every(robot=>{
            const inward=robot.position.clone().setY(0).normalize().negate();
            const reach=inward.clone().set(1,0,0).applyQuaternion(robot.quaternion);
            return reach.dot(inward)>.99;
        });
    }''')
    # The overhead optical axis intersects the shared fixture from above the arms.
    assert page.evaluate('''() => {
        const g=equipmentQA.stations[3],camera=g.getObjectByName('overhead-vision-camera');
        const target=camera.position.clone().set(0,1.19,0).sub(camera.position).normalize();
        const axis=target.clone().set(0,0,1).applyQuaternion(camera.quaternion);
        g.updateWorldMatrix(true,true);
        const lens=g.getObjectByName('overhead-camera-lens');
        const point=g.worldToLocal(lens.getWorldPosition(lens.position.clone()));
        return axis.dot(target)>.999 && point.y>2.2;
    }''')
    page.screenshot(path=str(out/'vision-desktop.png'))
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(out/'vision-mobile.png'))
    visit(0)
    page.screenshot(path=str(out/'companion-mobile.png'))
    page.set_viewport_size({'width':1000,'height':700})
    # The dispensing tip remains above the workpiece throughout its sweep.
    visit(4)
    assert page.evaluate('''() => {
        const g=equipmentQA.stations[4],tip=g.getObjectByName('dispensing-stream');
        return [0,3,9].every(t=>{
            equipmentQA.at(t);g.updateWorldMatrix(true,true);
            const local=g.worldToLocal(tip.getWorldPosition(tip.position.clone()));
            return local.x>-.76 && local.x<.36 && local.z>-.17 && local.z<.57 && Math.abs(local.y-1.023)<.03;
        });
    }''')
    # Large SCADA display is in front of treatment vessels, with a separate remote terminal.
    visit(5)
    assert page.evaluate('''() => {
        const g=equipmentQA.stations[5],monitor=g.getObjectByName('scada-supervisory-monitor');
        return g.children.filter(o=>o.name==='water-treatment-vessel').every(o=>o.position.z<monitor.position.z)
            && !!g.getObjectByName('remote-control-terminal');
    }''')
    # A fixed time produces identical telemetry, and advancing time changes the screen.
    for index,name in [(4,'dispensing-controller'),(5,'scada-supervisory-monitor'),(8,'battery-live-monitor')]:
        visit(index)
        assert page.evaluate('''([index,name]) => {
            const panel=equipmentQA.stations[index].getObjectByName(name);
            const image=panel.children.find(o=>o.material?.map).material.map.image;
            equipmentQA.at(0);const first=image.toDataURL();
            equipmentQA.at(2);const next=image.toDataURL();
            equipmentQA.at(2);return first!==next && next===image.toDataURL();
        }''', [index,name])
    # Same phase in opposite charge/discharge halves reverses current travel and indication.
    assert page.evaluate('''() => {
        const dot=equipmentQA.stations[8].getObjectByName('charge-discharge-current');
        equipmentQA.at(1);const position=dot.position.clone(),color=dot.material.color.getHex();
        equipmentQA.at(9);return position.distanceTo(dot.position)>.2 && color!==dot.material.color.getHex();
    }''')
    # Reduced motion keeps all of these animations frozen until explicitly enabled.
    assert page.locator('#motion-toggle').get_attribute('aria-pressed')=='true'
    before=page.locator('canvas').screenshot()
    page.wait_for_timeout(300)
    assert before==page.locator('canvas').screenshot()
    assert not errors, errors
    browser.close()
    print('PASS scroll companion, overhead optics, robot layout, nozzle/workpiece alignment, remote SCADA, animated telemetry, charge/discharge reversal, reduced motion')
