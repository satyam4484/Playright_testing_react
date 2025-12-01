import { test, expect } from "@playwright/test";

test('homepage loads and shows users list', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await expect(page.getByText('Users CRUD')).toBeVisible();

    await expect(page.locator('[data-testid="user-row"]')).toBeVisible();
});

test('open create user modal', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.getByTestId('add-user-btn').click();

    await expect(page.getByTestId('modal-title')).toHaveText('Add User');
});

test('invalid form shows errors', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByTestId('add-user-btn').click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Role is required')).toBeVisible();
    await page.screenshot({ path: 'screenshot.png' });
    await page.waitForTimeout(3000);
    
})

test('server validation error is shown', async ({ page }) => {
await page.route('https://api.restful-api.dev/objects', route =>
    route.fulfill({
        status: 400,
        body: JSON.stringify({ message: 'Email already exists' })
    })
);

  await page.goto('http://localhost:5173');

  await page.getByTestId('add-user-btn').click();
  await page.getByRole('textbox', { name: 'Name' }).fill('John');
  await page.getByRole('textbox', { name: 'Email' }).fill('john@gmail.com');
  await page.getByRole('combobox').selectOption('user');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText('Failed to create item').first()).toBeVisible();
  await page.screenshot({ path: 'error_message.png' });
});
