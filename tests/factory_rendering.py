import os
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

base_url = os.environ.get("PORTFOLIO_URL", "http://localhost:4173")
artifacts = Path(
    os.environ.get("SCREENSHOT_DIR", tempfile.mkdtemp(prefix="factory-qa-"))
)
artifacts.mkdir(parents=True, exist_ok=True)
from hashlib import sha256

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
    page = b.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.emulate_media(reduced_motion="reduce")
    page.goto(base_url, wait_until="networkidle")
    assert page.locator("#identity-canvas").evaluate("(c)=>c.width/c.clientWidth") == 2
    page.locator("#quality-toggle").click()
    assert page.locator("#identity-canvas").evaluate("(c)=>c.width/c.clientWidth") == 1
    page.locator("#connect-mode").click()
    page.locator('[data-node="1"]').click()
    page.locator('[data-node="3"]').click()
    assert page.locator("#factory-run").is_disabled()
    page.locator("#move-mode").click()
    page.locator('[data-node="1"]').click()
    page.locator("#identity-canvas").focus()
    x = page.locator('[data-node="1"]').bounding_box()["x"]
    page.keyboard.press("ArrowRight")
    assert page.locator('[data-node="1"]').bounding_box()["x"] != x
    x = page.locator('[data-node="1"]').bounding_box()["x"]
    page.keyboard.press("ArrowRight")
    assert page.locator('[data-node="1"]').bounding_box()["x"] == x
    assert "빈 공간" in page.locator("#factory-toast").inner_text()
    page.keyboard.press("q")
    page.keyboard.press("e")
    page.locator("#quick-connect").click()
    page.locator("#factory-run").click()
    page.wait_for_function(
        "parseInt(document.querySelector('#factory-output').textContent)>0",
        timeout=15000,
    )
    page.locator("#world-terminal").click()
    count = page.locator("#factory-output").text_content()
    page.wait_for_timeout(3300)
    assert page.locator("#factory-output").text_content() == count
    page.keyboard.press("Escape")
    page.locator("#factory-run").click()
    page.locator("#selection-disconnect").click()
    assert page.locator("#factory-run").is_disabled()
    page.locator("#factory-undo").click()
    assert page.locator("#factory-run").is_enabled()
    page.locator("#factory-sample").click()

    # Real 3D raycast: select a model and then place it on the empty back row.
    def point(x, y, z):
        return page.evaluate(
            """async(v)=>{const T=await import('./vendor/three.module.min.js');const r=document.querySelector('#identity-canvas').getBoundingClientRect(),a=r.width/r.height,k=Math.max(5.9,7.9/a);const c=new T.OrthographicCamera(-k*a,k*a,k,-k,.1,100);c.position.set(Math.sin(.6)*15,13,Math.cos(.6)*15);c.lookAt(0,.2,0);c.updateMatrixWorld();const n=new T.Vector3(...v).project(c);return{x:r.left+(n.x+1)*r.width/2,y:r.top+(1-n.y)*r.height/2}}""",
            [x, y, z],
        )

    pt = point(-3.5, 0.5, 0)
    page.mouse.click(pt["x"], pt["y"])
    assert page.locator("#selection-name").inner_text() == "로봇 셀 1"
    before = page.locator('[data-node="1"]').bounding_box()
    pt = point(-3.5, -0.12, -3)
    page.mouse.click(pt["x"], pt["y"])
    after = page.locator('[data-node="1"]').bounding_box()
    assert before != after
    page.locator("#selection-done").click()
    page.locator("#camera-right").click()
    assert page.locator('[data-node="1"]').bounding_box() != after
    canvas = page.locator("#identity-canvas")
    bounds = canvas.bounding_box()
    page.mouse.move(
        bounds["x"] + bounds["width"] * 0.8, bounds["y"] + bounds["height"] * 0.4
    )
    page.mouse.down()
    page.mouse.move(
        bounds["x"] + bounds["width"] * 0.8 + 60,
        bounds["y"] + bounds["height"] * 0.4,
        steps=5,
    )
    page.mouse.up()
    page.locator("#camera-home").click()
    page.locator("#factory-sample").click()
    for _ in range(6):
        page.locator('[data-add="ot"]').click()
    assert page.locator("[data-node]").count() == 8
    assert "최대 8개" in page.locator("#factory-toast").inner_text()
    page.locator("#factory-sample").click()
    page.locator("#quick-connect").click()
    page.locator("#selection-done").click(force=True) if page.locator(
        "#selection-done"
    ).is_visible() else None
    page.locator("#factory-run").click()
    page.locator("#motion-toggle").click()
    h = sha256(canvas.screenshot()).hexdigest()
    page.wait_for_timeout(300)
    assert h != sha256(canvas.screenshot()).hexdigest()
    page.locator("#quality-toggle").click()
    page.screenshot(path=str(artifacts / "factory-running.png"))
    assert not errors, errors
    page = b.new_page(viewport={"width": 390, "height": 844})
    page.add_init_script(
        "const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t.startsWith('webgl')?null:g.call(this,t,...a)}"
    )
    page.goto(base_url, wait_until="networkidle")
    page.locator('[data-add="ai"]').click()
    assert page.locator("#world-card").evaluate("d=>d.open")
    page.keyboard.press("Escape")
    page.locator("#world-terminal").click()
    assert page.locator("#library-dialog").evaluate("d=>d.open")
    print(
        "PASS invalid links, placement collisions, keyboard edits, simulation dialog pause, disconnect/undo, model and floor raycasts, orbit drag, eight-module limit, live animation, quality toggle and WebGL fallback"
    )
    b.close()
