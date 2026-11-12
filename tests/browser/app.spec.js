const { test, expect } = require("@playwright/test");
const { session } = require("./fixture");
async function login(page) {
  await page.addInitScript(
    (value) =>
      localStorage.setItem("sb-cutoff-test-auth-token", JSON.stringify(value)),
    session,
  );
}
test("public pages work on desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Practice with a point." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "B 5 m/s" }).click();
  await expect(
    page.getByText("Exactly. Speed = distance ÷ time. You’re in motion."),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Find your starting point" }).click();
  await expect(page.getByLabel("Your name")).toBeVisible();
  await page.screenshot({
    path: "test-results/signup-mobile.png",
    fullPage: true,
  });
});
test("student completes an attempt and reviews it", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { name: /Good to see you/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Practice papers", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Find your next challenge." }),
  ).toBeVisible();
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", {
        name: "Cutoff starter practice",
        exact: true,
      }),
    })
    .click();
  await page.getByRole("button", { name: "Start or resume" }).click();
  await expect(
    page.getByRole("heading", {
      name: "A particle travels 20 m in 4 s at a constant speed. What is its speed?",
    }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "B 5 m/s" }).check();
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio", { name: "B 5 m/s" })).toBeChecked();
  await page.screenshot({
    path: "test-results/exam-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Next question" }).click();
  await page.getByRole("checkbox", { name: "A −2", exact: true }).check();
  await page.getByRole("checkbox", { name: "C 2", exact: true }).check();
  await page.getByLabel("Mark for review").check();
  await page.getByRole("button", { name: /Question 5,/ }).click();
  await page.getByLabel("Your answer").fill("0");
  await page.getByRole("button", { name: "Save now", exact: true }).click();
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/exam-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Submit attempt", exact: true })
    .click();
  await page.getByRole("button", { name: "Submit now", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Every answer tells you something." }),
  ).toBeVisible();
  await expect(
    page.getByText("100% accuracy on attempted questions"),
  ).toBeVisible();
  await page.getByLabel("Group by").selectOption("chapters");
  await page.screenshot({
    path: "test-results/results-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/results-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("combobox", { name: "Show", exact: true })
    .selectOption("correct");
  await expect(page.locator(".review-question")).toHaveCount(3);
  await page.locator(".review-question summary").first().click();
  await expect(
    page.getByRole("heading", { name: "Why it works" }).first(),
  ).toBeVisible();
});
test("failed saves keep the response and support retry", async ({ page }) => {
  await login(page);
  await page.goto("/app/papers");
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", {
        name: "Cutoff starter practice",
        exact: true,
      }),
    })
    .click();
  await page.getByRole("button", { name: "Start or resume" }).click();
  await expect(page.getByRole("radio", { name: "B 5 m/s" })).toBeVisible();
  await page.route("**/api/attempts/*/answers/*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Temporarily offline" }),
    }),
  );
  await page.getByRole("radio", { name: "B 5 m/s" }).check();
  await expect(
    page.getByText("Not saved — check connection and retry"),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "B 5 m/s" })).toBeChecked();
  await page.getByRole("link", { name: "Cutoff home" }).click();
  await expect(
    page.getByRole("heading", { name: "Save before you go." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stay here" }).click();
  await page.unroute("**/api/attempts/*/answers/*");
  await page.getByRole("button", { name: "Save now", exact: true }).click();
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Submit attempt", exact: true })
    .click();
  await page.getByRole("button", { name: "Submit now", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Every answer tells you something." }),
  ).toBeVisible();
});

test("auth forms handle confirmation and rejected login", async ({ page }) => {
  await page.route("**/auth/v1/signup**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: session.user.id,
        email: "new@example.test",
        identities: [{ id: session.user.id }],
      }),
    }),
  );
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("New student");
  await page.getByLabel("Email address").fill("new@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your inbox");
  await page.route("**/auth/v1/token**", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid login credentials",
      }),
    }),
  );
  await page.goto("/login");
  await page.getByLabel("Email address").fill("new@example.test");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Invalid login credentials",
  );
  await page.route("**/auth/v1/recover**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await page.getByLabel("Email", { exact: true }).fill("new@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "reset link will arrive",
  );
});

test("a used or missing recovery link leads back to email recovery", async ({
  page,
}) => {
  await page.goto("/reset-password");
  await expect(
    page.getByRole("heading", { name: "Request a new reset link." }),
  ).toBeVisible();
  await expect(page.getByLabel("New password")).toHaveCount(0);
  await page.getByRole("link", { name: "Request reset email" }).click();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
});

test("sign-in returns a student to their requested paper library", async ({
  page,
}) => {
  await page.route("**/auth/v1/token**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(session),
    }),
  );
  await page.goto("/app/papers");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email address").fill(session.user.email);
  await page.getByLabel("Password", { exact: true }).fill("test-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app\/papers$/);
  await expect(
    page.getByRole("heading", { name: "Cutoff starter practice", exact: true }),
  ).toBeVisible();
});
