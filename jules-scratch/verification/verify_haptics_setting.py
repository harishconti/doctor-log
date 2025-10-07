from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the login page
        page.goto("http://localhost:8081", timeout=60000)

        # Log in as the demo user
        page.get_by_label("Email").fill("dr.sarah@clinic.com")
        page.get_by_label("Password").fill("password123")

        # Click the login button
        login_button = page.get_by_role("button", name="Login")
        login_button.click()

        # Wait for navigation and for the patient list to be visible
        expect(page.get_by_text("Patients")).to_be_visible(timeout=30000)

        # Navigate to the profile screen by clicking the profile icon
        profile_button = page.locator('div[aria-label="person-circle"]').first
        expect(profile_button).to_be_visible()
        profile_button.click()

        # Wait for the profile screen to load and find the preferences section
        preferences_section_title = page.get_by_text("Preferences")
        expect(preferences_section_title).to_be_visible(timeout=30000)

        # Locate the parent section containing the title and the toggle
        preferences_section = preferences_section_title.locator('xpath=./ancestor::*[contains(@style, "background-color: rgb(255, 255, 255)")]')
        expect(preferences_section).to_be_visible()

        # Take a screenshot of the preferences section
        preferences_section.screenshot(path="jules-scratch/verification/verification.png")

        print("Screenshot of preferences section taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)