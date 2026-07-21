from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path.cwd()
PREVIEW = ROOT / "reports/prompt-06/preview"
OUTPUT = Path(sys.argv[1] if len(sys.argv) > 1 else "reports/prompt-20/browser-acceptance.json")
if not OUTPUT.is_absolute():
    OUTPUT = (ROOT / OUTPUT).resolve()
SCREENSHOTS = OUTPUT.parent / "screenshots"
ROUTES = {
    "home": PREVIEW / "index.html",
    "article": PREVIEW / "2026/07/20/a-cidade-terceirizou-o-relogio/index.html",
    "archive": PREVIEW / "arquivo/index.html",
    "search": PREVIEW / "busca/index.html",
    "newsroom": PREVIEW / "redacao/index.html",
}
VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "mobile": {"width": 390, "height": 844},
}


def prepared_html(path: Path) -> str:
    html = path.read_text(encoding="utf-8")
    html = re.sub(r'<meta[^>]+http-equiv="Content-Security-Policy"[^>]*>', '', html, flags=re.I)
    html = re.sub(r'<link[^>]+rel="stylesheet"[^>]*>', '', html, flags=re.I)
    html = re.sub(r'<script[^>]+src="[^"]+"[^>]*></script>', '', html, flags=re.I)
    return html


def fail(code: str, detail: str) -> dict:
    return {"code": code, "detail": detail}


issues: list[dict] = []
results: list[dict] = []
css = "\n".join([
    (PREVIEW / "assets/tokens.css").read_text(encoding="utf-8"),
    (PREVIEW / "assets/jornal-concreto.css").read_text(encoding="utf-8"),
])
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    )
    for route_name, route_path in ROUTES.items():
        if not route_path.exists():
            issues.append(fail("missing-route", str(route_path)))
            continue
        for viewport_name, viewport in VIEWPORTS.items():
            context = browser.new_context(
                viewport=viewport,
                reduced_motion="reduce",
                color_scheme="light",
                java_script_enabled=True,
            )
            page = context.new_page()
            console_errors: list[str] = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda exc: console_errors.append(str(exc)))
            page.set_content(prepared_html(route_path), wait_until="domcontentloaded")
            page.add_style_tag(content=css)

            title = page.title()
            lang = page.locator("html").get_attribute("lang")
            main_count = page.locator("main").count()
            h1_count = page.locator("h1").count()
            skip_count = page.locator('a[href="#conteudo"]').count()
            nav_label = page.locator("nav[aria-label]").first.get_attribute("aria-label") if page.locator("nav[aria-label]").count() else None
            overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            text_length = len(page.locator("main").inner_text().strip()) if main_count else 0

            page.locator("body").focus()
            page.keyboard.press("Tab")
            first_focus = page.evaluate("document.activeElement && ({tag: document.activeElement.tagName, text: document.activeElement.textContent.trim(), href: document.activeElement.getAttribute('href')})")

            checks = {
                "title": bool(title.strip()),
                "lang_pt_br": lang == "pt-BR",
                "single_main": main_count == 1,
                "single_h1": h1_count == 1,
                "skip_link": skip_count == 1,
                "labeled_navigation": bool(nav_label),
                "critical_text": text_length >= 80,
                "no_horizontal_overflow": overflow <= 2,
                "skip_first_focus": bool(first_focus and first_focus.get("href") == "#conteudo"),
                "no_console_errors": len(console_errors) == 0,
            }
            for key, passed in checks.items():
                if not passed:
                    issues.append(fail(key, f"{route_name}/{viewport_name}"))

            screenshot = SCREENSHOTS / f"{route_name}-{viewport_name}.png"
            if (route_name, viewport_name) in {
                ("home", "desktop"),
                ("home", "mobile"),
                ("article", "desktop"),
                ("archive", "mobile"),
            }:
                page.screenshot(path=str(screenshot), full_page=True)
                screenshot_value = str(screenshot.relative_to(ROOT))
            else:
                screenshot_value = None

            results.append({
                "route": route_name,
                "viewport": viewport_name,
                "dimensions": viewport,
                "title": title,
                "main_text_characters": text_length,
                "horizontal_overflow_px": overflow,
                "first_focus": first_focus,
                "checks": checks,
                "screenshot": screenshot_value,
            })
            context.close()
    browser.close()

payload = {
    "schema_version": 1,
    "status": "pass" if not issues else "fail",
    "engine": "system Chromium through Python Playwright",
    "source": "deterministic preview, not Astro dist",
    "routes": len(ROUTES),
    "viewport_runs": len(results),
    "issues": issues,
    "results": results,
    "manual_acceptance_substitute": False,
}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Browser acceptance {payload['status']}: {len(results)} execuções, {len(issues)} problemas.")
if issues:
    raise SystemExit(1)
