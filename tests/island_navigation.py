import os
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

base_url = os.environ.get("PORTFOLIO_URL", "http://localhost:4173")
artifacts = Path(
    os.environ.get("SCREENSHOT_DIR", tempfile.mkdtemp(prefix="island-qa-"))
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
    page = b.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(base_url, wait_until="networkidle")
    assert page.locator(".webgl-ready").count() == 1
    page.screenshot(path=str(artifacts / "fullscreen-world-desktop.png"))
    page.locator("#quality-toggle").click()
    page.locator("#world-terminal").click()
    page.wait_for_function(
        "document.querySelector('#library-dialog').open", timeout=20000
    )
    assert page.locator("#world-progress").inner_text() == "0 / 3"
    for id in ["identity", "projects", "experience", "contact"]:
        page.locator(f'[data-library="{id}"]').click()
        assert page.locator("#" + id).is_visible()
    page.locator('[data-library="projects"]').click()
    for category, count in [("ai", 2), ("industrial", 6), ("software", 3), ("all", 11)]:
        page.locator(f'[data-filter="{category}"]').click()
        assert page.locator(".archive-item").count() == count
    page.locator(".archive-item").first.click()
    assert page.locator("#project-dialog").evaluate("d=>d.open")
    page.keyboard.press("Escape")
    assert page.locator("#library-dialog").evaluate("d=>d.open")
    page.screenshot(path=str(artifacts / "fullscreen-library.png"))
    canvas = page.locator("#identity-canvas")
    frozen = sha256(canvas.screenshot()).hexdigest()
    page.keyboard.press("ArrowLeft")
    page.wait_for_timeout(200)
    assert sha256(canvas.screenshot()).hexdigest() == frozen
    page.locator("#library-close").click()
    for id, count in [("ot", 1), ("it", 2), ("ai", 3)]:
        page.locator(f'[data-layer="{id}"]').click()
        page.wait_for_function(
            f"document.querySelector('#world-progress').textContent==='{count} / 3'",
            timeout=20000,
        )
    page.locator('[data-open-library="experience"]').click()
    assert page.locator("#experience").is_visible()
    page.keyboard.press("Escape")
    for w, h in [(390, 844), (844, 390), (320, 568), (1440, 900)]:
        page.set_viewport_size({"width": w, "height": h})
        page.goto(base_url, wait_until="networkidle")
        assert page.evaluate(
            "document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight"
        ), (w, h)
        page.screenshot(path=str(artifacts / f"fullscreen-{w}.png"))
    page.emulate_media(reduced_motion="reduce")
    page.reload(wait_until="networkidle")
    page.locator("#world-terminal").click()
    assert page.locator("#library-dialog").evaluate("d=>d.open")
    page.goto(base_url + "/#experience", wait_until="networkidle")
    assert page.locator("#experience").is_visible()
    page = b.new_page(viewport={"width": 390, "height": 844})
    page.add_init_script(
        "const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t.startsWith('webgl')?null:g.call(this,t,...a)}"
    )
    page.goto(base_url, wait_until="networkidle")
    page.locator("#world-terminal").click()
    assert page.locator("#library-dialog").evaluate("d=>d.open")
    assert not errors, errors
    print(
        "PASS fullscreen 320–1440px, terminal travel, four sections, 11 projects/filters, nested dialogs/Escape, frozen background, 3 stations, reduced motion, legacy hash, WebGL fallback; no JS errors"
    )
    b.close()
