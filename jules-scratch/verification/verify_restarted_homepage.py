from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto("http://localhost:8081")
    page.screenshot(path="jules-scratch/verification/restarted_homepage.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)