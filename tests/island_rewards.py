import os
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

base_url = os.environ.get("PORTFOLIO_URL", "http://localhost:4173")
artifacts = Path(
    os.environ.get("SCREENSHOT_DIR", tempfile.mkdtemp(prefix="island-qa-"))
)
artifacts.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(
        executable_path=os.environ.get("CHROMIUM_PATH"),
        args=[
            "--no-sandbox",
            "--enable-webgl",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
        ],
    )
    page = b.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.emulate_media(reduced_motion="reduce")
    page.goto(base_url, wait_until="networkidle")
    size = page.locator("#identity-canvas").evaluate("(c)=>[c.width,c.clientWidth]")
    assert size[0] == size[1] * 2, size
    page.locator("#quality-toggle").click()
    size = page.locator("#identity-canvas").evaluate("(c)=>[c.width,c.clientWidth]")
    assert size[0] == size[1], size
    page.locator("#quality-toggle").click()

    def chip(index):
        point = page.evaluate(
            """async(i)=>{const T=await import('./vendor/three.module.min.js'); const r=document.querySelector('#identity-canvas').getBoundingClientRect(),a=r.width/r.height;const c=new T.PerspectiveCamera(T.MathUtils.radToDeg(2*Math.atan(5.1/Math.sqrt(100+9.6*9.6+196))),a,.1,100);c.position.set(10,10,14.5);c.lookAt(0,.4,.5);c.updateMatrixWorld();const v=new T.Vector3([-4.8,-2.4,0,2.4,4.8][i],.4+Math.sin(i)*.09,3.65).project(c);return{x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2}}""",
            index,
        )
        page.mouse.click(point["x"], point["y"])

    for i in range(5):
        chip(i)
        assert page.locator("#game-score").text_content() == str((i + 1) * 20), (
            i,
            page.locator("#game-score").text_content(),
        )
    assert page.locator("#game-chips").inner_text() == "데이터 칩 5 / 5"
    for i, id in enumerate(["ot", "it", "ai"]):
        page.locator(f'[data-layer="{id}"]').click()
        page.wait_for_timeout(300)
        assert page.locator("#game-score").text_content() == str(200 + i * 100), (
            id,
            page.locator("#game-score").text_content(),
            errors,
        )
    assert page.locator("#game-rank").text_content() == "SYSTEM ARCHITECT ★"
    page.locator('[data-layer="ai"]').click()
    assert page.locator("#game-score").text_content() == "400"
    page.locator("#world-card-close").click()
    page.screenshot(path=str(artifacts / "game-complete.png"))
    page.locator("#world-reset").click()
    assert page.locator("#game-score").text_content() == "0"
    assert page.locator("#game-rank").text_content() == "EXPLORER"
    page.locator("#boost-toggle").click()
    assert page.locator("#boost-toggle").get_attribute("aria-pressed") == "true"
    page.locator("#world-reset").click()
    assert page.locator("#boost-toggle").get_attribute("aria-pressed") == "false"
    page.emulate_media(reduced_motion="no-preference")
    page.locator("#motion-toggle").click()
    page.locator("#quality-toggle").click()
    page.locator("#boost-toggle").click()
    chip(0)
    page.wait_for_function(
        "document.querySelector('#game-score').textContent==='40'", timeout=15000
    )
    assert page.locator("#game-toast").inner_text() == "데이터 칩 획득 · +20 XP"
    for w, h in [(390, 844), (320, 568), (844, 390)]:
        page.set_viewport_size({"width": w, "height": h})
        page.reload(wait_until="networkidle")
        assert page.evaluate(
            "document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight"
        )
        assert page.locator("#scene-viewport").bounding_box()["width"] <= w
        page.screenshot(path=str(artifacts / f"polish-{w}.png"))
    assert not errors, errors
    print(
        "PASS 2x resolution, quality switching, five raycast collectibles and walking pickup, 400 XP badge, no repeat rewards, reset, boost toggle, three responsive sizes, no JS errors"
    )
    b.close()
