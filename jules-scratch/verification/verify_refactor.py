from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # It can take a while for the dev server to start
        time.sleep(45)

        page.goto("http://localhost:8081")

        # Login
        page.get_by_placeholder("Email").fill("dr.sarah@clinic.com")
        page.get_by_placeholder("Password").fill("password123")
        page.get_by_role("button", name="Login").click()

        # Wait for navigation to the main page
        expect(page).to_have_url("http://localhost:8081/", timeout=30000)

        # Find the favorite button for a specific patient and check its initial state
        patient_card = page.locator(".r-flexDirection-18u37iz").filter(has_text="John Wilson")
        initial_favorite_button = patient_card.get_by_role("button").nth(0)

        # The icon will have a name of 'heart' if it's favorited, and 'heart-outline' if not.
        # Let's get the initial state
        initial_icon_name = initial_favorite_button.locator("i").get_attribute("class")

        # Click to toggle favorite
        initial_favorite_button.click()

        # Wait for the icon to change
        if "heart-outline" in initial_icon_name:
            expect(initial_favorite_button.locator("i")).to_have_class(lambda c: "heart" in c, timeout=5000)
        else:
            expect(initial_favorite_button.locator("i")).to_have_class(lambda c: "heart-outline" in c, timeout=5000)


        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot taken.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)