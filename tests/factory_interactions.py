import os
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

base_url = os.environ.get("PORTFOLIO_URL", "http://localhost:4173")
artifacts = Path(
    os.environ.get("SCREENSHOT_DIR", tempfile.mkdtemp(prefix="factory-qa-"))
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
    page = b.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.emulate_media(reduced_motion="reduce")
    page.goto(base_url, wait_until="networkidle")
    assert page.locator(".webgl-ready").count() == 1
    page.screenshot(path=str(artifacts / "factory-desktop.png"))
    assert page.locator("[data-node]").count() == 3
    assert page.locator("#factory-run").is_disabled()
    page.locator("#connect-mode").click()
    for id in [1, 2, 2, 3]:
        page.locator(f'[data-node="{id}"]').click()
    assert page.locator("#factory-lines").text_content() == "1개"
    page.locator("#factory-run").click()
    page.wait_for_function(
        "parseInt(document.querySelector('#factory-output').textContent)>0", timeout=15000
    )
    page.locator("#factory-run").click()
    page.locator("#selection-project").click()
    assert page.locator("#world-card").evaluate("d=>d.open")
    page.locator('[data-world-project="plc-ai"]').click()
    assert page.locator("#dialog-title").inner_text() == "PLC AI Studio"
    page.keyboard.press("Escape")
    page.keyboard.press("Escape")
    page.locator("#move-mode").click()
    page.locator('[data-node="1"]').click()
    page.locator("#selection-rotate").click()
    page.locator("#selection-remove").click()
    assert page.locator("#factory-run").is_disabled()
    page.locator("#factory-undo").click()
    assert page.locator("[data-node]").count() == 3
    assert page.locator("#factory-run").is_enabled()
    page.locator('[data-add="ot"]').click()
    assert page.locator("[data-node]").count() == 4
    page.locator("#quick-connect").click()
    assert page.locator("#factory-lines").text_content() == "2개"
    page.locator("#factory-clear").click()
    assert page.locator("[data-node]").count() == 0
    for t in ["ot", "it", "ai"]:
        page.locator(f'[data-add="{t}"]').click()
    page.locator("#quick-connect").click()
    assert page.locator("#factory-run").is_enabled()
    page.locator("#factory-sample").click()
    page.locator("#world-terminal").click()
    page.locator('[data-library="projects"]').click()
    assert page.locator(".archive-item").count() == 11
    page.keyboard.press("Escape")
    for w, h in [(390, 844), (320, 568), (844, 390), (1024, 768)]:
        page.set_viewport_size({"width": w, "height": h})
        page.reload(wait_until="networkidle")
        assert page.evaluate(
            "document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight"
        ), (w, h)
        page.screenshot(path=str(artifacts / f"factory-{w}.png"))
    assert not errors, errors
    print(
        "PASS sample, manual connections, running output, project dialogs, rotate, delete invalidation, undo, multiple robots, clear/new build, archive, responsive layouts; no JS errors"
    )
    b.close()
