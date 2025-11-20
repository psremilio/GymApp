import re
from playwright.sync_api import Page, expect, sync_playwright

def test_app_features(page: Page):
    # 1. Go to the app
    page.goto("http://localhost:8081")
    page.wait_for_timeout(5000)
    expect(page.get_by_text("Willkommen,")).to_be_visible()

    # ---------------------------
    # TEST PLANNER (SEARCH & TIMER)
    # ---------------------------

    # Navigate to Planner (2nd tab)
    viewport_size = page.viewport_size
    if viewport_size:
        width = viewport_size['width']
        height = viewport_size['height']
        page.mouse.click(width * 0.37, height - 35)

    page.wait_for_timeout(1000)
    expect(page.get_by_text("Planer")).to_be_visible()

    # Search
    search_input = page.get_by_placeholder("Übung suchen...")
    search_input.fill("Bank")
    expect(page.get_by_text("Bankdrücken (LH)")).to_be_visible()
    search_input.fill("")

    # ---------------------------
    # TEST NUTRITION (CUSTOM FOOD)
    # ---------------------------

    # Navigate to Nutrition (3rd tab)
    if viewport_size:
        page.mouse.click(width * 0.62, height - 35)

    page.wait_for_timeout(1000)
    expect(page.get_by_text("Ernährung")).to_be_visible()

    # Open "Manuell" Modal
    page.get_by_text("Manuell").click()
    expect(page.get_by_text("Neues Lebensmittel")).to_be_visible()

    # Fill form
    page.get_by_placeholder("Name (z.B. Apfel)").fill("Test Food")
    page.get_by_placeholder("Kalorien").fill("100")
    page.get_by_placeholder("Protein").fill("10")
    page.get_by_placeholder("Carbs").fill("5")
    page.get_by_placeholder("Fett").fill("2")

    # Save
    page.get_by_text("Speichern & Hinzufügen").click()

    # Verify Alert (Playwright handles alerts automatically by dismissing, but we can't easily assert Alert text in standard Web without handling dialog event)
    # But the app adds it to the log.
    # Check if "Test Food" appears in "Heutige Einträge"
    expect(page.get_by_text("Test Food")).to_be_visible()
    expect(page.get_by_text("100 kcal")).to_be_visible()

    # Take screenshot of Nutrition view
    page.screenshot(path="/home/jules/verification/nutrition_custom_food.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Handle alerts automatically (accept them)
        page.on("dialog", lambda dialog: dialog.accept())

        try:
            test_app_features(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="/home/jules/verification/failure.png")
            raise e
        finally:
            browser.close()
