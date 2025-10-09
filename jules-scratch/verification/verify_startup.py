from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the app's URL
        page.goto("http://localhost:8081", timeout=60000)

        # Wait for either the loading indicator or the login page to appear
        # The login page has a prominent "Login" heading.
        # The main page has a "Medical Contacts" heading.
        # The loading screen has the text "Loading..."
        # We'll wait for any of these to be visible.
        expect(
            page.get_by_text("Loading...", exact=True)
            .or_(page.get_by_role("heading", name="Login"))
            .or_(page.get_by_text("Medical Contacts", exact=True))
        ).to_be_visible(timeout=30000)


        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        # Take a screenshot even if it fails to see what the page looks like
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)