from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the login page
        page.goto("http://localhost:19006/login")

        # Fill in the login form
        page.get_by_placeholder("Email").fill("dr.sarah@clinic.com")
        page.get_by_placeholder("Password").fill("password123")

        # Click the login button
        page.get_by_role("button", name="Login").click()

        # Wait for navigation to the main page and for the sync button to be visible
        expect(page.get_by_role("button", name="sync")).to_be_visible()

        # Take a screenshot of the main page
        page.screenshot(path="jules-scratch/verification/verification.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)