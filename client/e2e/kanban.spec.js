import { test, expect } from '@playwright/test';

test.describe('Kanban Board E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('[role="region"][aria-label="Kanban board"]');
  });

  test('should display the board with initial lists', async ({ page }) => {
    await expect(page.locator('text=Kanban Board')).toBeVisible();
    await expect(page.locator('[role="region"]').first()).toBeVisible();
  });

  test('should add a new list', async ({ page }) => {
    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'New Test List');
    await page.click('button:has-text("Add List")');

    await expect(page.locator('text=New Test List')).toBeVisible();
  });

  test('should add a new card to a list', async ({ page }) => {
    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'Test List');
    await page.click('button:has-text("Add List")');

    await page.click('button:has-text("Add a card")');
    await page.fill('textarea[aria-label="New card title"]', 'New Test Card');
    await page.click('button:has-text("Add Card")');

    await expect(page.locator('text=New Test Card')).toBeVisible();
  });

  test('should edit a card via modal', async ({ page }) => {
    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'Edit Test List');
    await page.click('button:has-text("Add List")');

    await page.click('button:has-text("Add a card")');
    await page.fill('textarea[aria-label="New card title"]', 'Card to Edit');
    await page.click('button:has-text("Add Card")');

    await page.click('text=Card to Edit');
    await page.waitForSelector('[role="dialog"]');

    await page.fill('input#card-title', 'Edited Card Title');
    await page.fill('textarea#card-description', 'New description');
    await page.click('button:has-text("Save changes")');

    await expect(page.locator('text=Edited Card Title')).toBeVisible();
  });

  test('should drag and drop a card between lists', async ({ page }) => {
    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'Source List');
    await page.click('button:has-text("Add List")');

    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'Target List');
    await page.click('button:has-text("Add List")');

    const sourceList = page.locator('[aria-label*="Source List"]');
    await sourceList.locator('button:has-text("Add a card")').click();
    await page.fill('textarea[aria-label="New card title"]', 'Draggable Card');
    await page.click('button:has-text("Add Card")');

    const card = page.locator('text=Draggable Card');
    const targetList = page.locator('[aria-label*="Target List"]');

    await card.dragTo(targetList);

    await expect(targetList.locator('text=Draggable Card')).toBeVisible();
  });

  test('should archive a list', async ({ page }) => {
    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'List to Archive');
    await page.click('button:has-text("Add List")');

    const listColumn = page.locator('[aria-label*="List to Archive"]');
    await listColumn.locator('button[aria-label="List options"]').click();
    await page.click('button:has-text("Archive list")');

    await page.click('button:has-text("Confirm")');

    await expect(page.locator('[aria-label*="List to Archive"]')).not.toBeVisible();
  });

  test('should rename a list', async ({ page }) => {
    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'Original Name');
    await page.click('button:has-text("Add List")');

    const listColumn = page.locator('[aria-label*="Original Name"]');
    await listColumn.locator('button[aria-label="List options"]').click();
    await page.click('button:has-text("Rename list")');

    await page.fill('input[aria-label="Enter text..."]', 'Renamed List');
    await page.keyboard.press('Enter');

    await expect(page.locator('text=Renamed List')).toBeVisible();
  });

  test('should use keyboard navigation', async ({ page }) => {
    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'Keyboard Test');
    await page.click('button:has-text("Add List")');

    await page.click('button:has-text("Add a card")');
    await page.fill('textarea[aria-label="New card title"]', 'Keyboard Card');
    await page.click('button:has-text("Add Card")');

    const card = page.locator('text=Keyboard Card');
    await card.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should persist data after reload (offline support)', async ({ page }) => {
    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'Persistent List');
    await page.click('button:has-text("Add List")');

    await page.click('button:has-text("Add a card")');
    await page.fill('textarea[aria-label="New card title"]', 'Persistent Card');
    await page.click('button:has-text("Add Card")');

    await page.reload();
    await page.waitForSelector('[role="region"][aria-label="Kanban board"]');

    await expect(page.locator('text=Persistent List')).toBeVisible();
    await expect(page.locator('text=Persistent Card')).toBeVisible();
  });

  test('should work offline and sync after reconnect', async ({ page, context }) => {
    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'Online List');
    await page.click('button:has-text("Add List")');

    await context.setOffline(true);

    await page.click('button:has-text("Add a card")');
    await page.fill('textarea[aria-label="New card title"]', 'Offline Card');
    await page.click('button:has-text("Add Card")');

    await expect(page.locator('text=Offline Card')).toBeVisible();
    await expect(page.locator('text=Offline')).toBeVisible();

    await context.setOffline(false);

    await page.waitForTimeout(1000);
    await expect(page.locator('text=Offline Card')).toBeVisible();
  });

  test('should undo and redo actions', async ({ page }) => {
    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'Undo Test List');
    await page.click('button:has-text("Add List")');

    await expect(page.locator('text=Undo Test List')).toBeVisible();

    await page.click('button[aria-label*="Undo"]');

    await expect(page.locator('text=Undo Test List')).not.toBeVisible();

    await page.click('button[aria-label*="Redo"]');

    await expect(page.locator('text=Undo Test List')).toBeVisible();
  });

  test('should delete a card', async ({ page }) => {
    await page.click('button[aria-label="Add new list"]');
    await page.fill('input[aria-label="New list title"]', 'Delete Test');
    await page.click('button:has-text("Add List")');

    await page.click('button:has-text("Add a card")');
    await page.fill('textarea[aria-label="New card title"]', 'Card to Delete');
    await page.click('button:has-text("Add Card")');

    await page.click('text=Card to Delete');
    await page.waitForSelector('[role="dialog"]');

    await page.click('button:has-text("Delete card")');
    await page.click('button:has-text("Click to confirm delete")');

    await expect(page.locator('text=Card to Delete')).not.toBeVisible();
  });
});
