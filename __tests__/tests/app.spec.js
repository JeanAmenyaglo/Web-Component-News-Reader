import { test, expect } from '@playwright/test';
const appUrl = 'http://localhost:8080';

test('news-dashboard registered', async ({ page }) => {
  await page.goto(appUrl);
  const newsDashboard = page.locator('news-dashboard');
  await expect(newsDashboard).toHaveCount(1);
});

test('news-source-picker registered', async ({ page }) => {
  await page.goto(appUrl);
  const newsSourcePicker = page.locator('news-source-picker');
  await expect(newsSourcePicker).toHaveCount(1);
});

test('news-headlines registered', async ({ page }) => {
  await page.goto(appUrl);
  const newsHeadlines = page.locator('news-headlines');
  await expect(newsHeadlines).toHaveCount(1);
});

test('news-dashboard has correct shadow content', async ({ page }) => {
  await page.goto(appUrl);
  const newsDashboard = page.locator('news-dashboard');
  await expect(newsDashboard).toContainText('News Dashboard');
  await expect(newsDashboard).toContainText('No content available');
});

test('news-dashboard contains required custom component slots', async ({ page }) => {
  await page.goto(appUrl);
  const newsDashboard = page.locator('news-dashboard');
  await expect(newsDashboard).toHaveCount(1);
  const sourcesSlot = newsDashboard.locator('news-source-picker[slot="sources"]');
  await expect(sourcesSlot).toHaveCount(1);
  const mainSlot = newsDashboard.locator('news-headlines[slot="main"]');
  await expect(mainSlot).toHaveCount(1);
});

test('news-source-picker has correct default content', async ({ page }) => {
  await page.goto(appUrl);
  const newsSourcePicker = page.locator('news-source-picker');
  await expect(newsSourcePicker).toContainText('Select a news source');
});

test('news-source-picker loads options', async ({ page }) => {
  await page.route('**/top-headlines/sources**', async (route) => {
    const mockSources = JSON.parse(
      `{
          "status": "ok",
          "sources": [
            {
              "id": "cbc-news",
              "name": "CBC News"
            },
            {
              "id": "google-news-ca",
              "name": "Google News (Canada)"
            }
          ]
        }`,
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: mockSources,
    });
  });
  await page.goto(appUrl);
  const newsSourcePicker = page.locator('news-source-picker');
  await expect(newsSourcePicker).toContainText('CBC News');
  await expect(newsSourcePicker).toContainText('Google News (Canada)');
});

test('news-source-picker dispatches source:changed event on selection', async ({ page }) => {
  await page.route('**/top-headlines/sources**', async (route) => {
    const mockSources = JSON.parse(
      `{
          "status": "ok",
          "sources": [
            {
              "id": "cbc-news",
              "name": "CBC News"
            },
            {
              "id": "google-news-ca",
              "name": "Google News (Canada)"
            }
          ]
        }`,
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: mockSources,
    });
  });
  await page.goto(appUrl);
  const newsSourcePicker = page.locator('news-source-picker');
  const selectEl = newsSourcePicker.locator('select');

  let eventDetail = null;
  await page.exposeFunction('onSourceChanged', (detail) => {
    eventDetail = detail;
  });
  await page.evaluate(() => {
    document.querySelector('news-source-picker').addEventListener('source:changed', (event) => {
      window.onSourceChanged(event.detail);
    });
  });

  await selectEl.selectOption('cbc-news');

  expect(eventDetail).not.toBeNull();
  expect(eventDetail.source).toBe('cbc-news');
});

test('news-headlines has correct default content', async ({ page }) => {
  await page.goto(appUrl);
  const newsHeadlines = page.locator('news-headlines');
  await expect(newsHeadlines).toContainText('Choose a news source.');
});

test('selecting source updates news-headlines', async ({ page }) => {
  await page.route('**/top-headlines/sources**', async (route) => {
    const mockSources = JSON.parse(
      `{
          "status": "ok",
          "sources": [
            {
              "id": "cbc-news",
              "name": "CBC News"
            }
          ]
        }`,
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: mockSources,
    });
  });

  await page.route('**/top-headlines?**', async (route) => {
    const mockHeadlines = JSON.parse(
      `{
          "status": "ok",
          "totalResults": 2,
          "articles": [
            {
              "source": { "id": "cbc-news", "name": "CBC News" },
              "author": "John Doe",
              "title": "Sample News Article",
              "description": "This is a sample news article description.",
              "url": "https://www.example.com/sample-article",
              "urlToImage": "https://www.example.com/sample-image.jpg",
              "publishedAt": "2025-01-01T00:00:00Z",
              "content": "Full content of the sample news article."
            },
            { "source": { "id": "cbc-news", "name": "CBC News" },
              "author": "Jane Smith",
              "title": "Another News Article",
              "description": "This is another news article description.",
              "url": "https://www.example.com/another-article",
              "urlToImage": "https://www.example.com/another-image.jpg",
              "publishedAt": "2025-01-02T00:00:00Z",
              "content": "Full content of another news article."
            }
          ]
        }`,
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: mockHeadlines,
    });
  });

  await page.goto(appUrl);
  const newsSourcePicker = page.locator('news-source-picker');
  const selectEl = newsSourcePicker.locator('select');
  await selectEl.selectOption('cbc-news');
  const newsHeadlines = page.locator('news-headlines');
  await expect(newsHeadlines).toContainText('Sample News Article');
  await expect(newsHeadlines).toContainText('This is a sample news article description.');
  await expect(newsHeadlines).toContainText('Another News Article');
  await expect(newsHeadlines).toContainText('This is another news article description.');
});

test('news-headlines shows loading state and no articles message', async ({ page }) => {
  await page.route('**/top-headlines/sources**', async (route) => {
    const mockSources = JSON.parse(
      `{
          "status": "ok",
          "sources": [
            {
              "id": "cbc-news",
              "name": "CBC News"
            }
          ]
        }`,
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: mockSources,
    });
  });

  let fetchHeadlinesResolve;
  await page.route('**/top-headlines?**', async (route) => {
    const mockHeadlinesPromise = new Promise((resolve) => {
      fetchHeadlinesResolve = resolve;
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: await mockHeadlinesPromise,
    });
  });

  await page.goto(appUrl);
  const newsSourcePicker = page.locator('news-source-picker');
  const selectEl = newsSourcePicker.locator('select');
  const newsHeadlines = page.locator('news-headlines');

  const selectPromise = selectEl.selectOption('cbc-news');
  await expect(newsHeadlines).toContainText('Loading news...');

  fetchHeadlinesResolve({
    status: 'ok',
    totalResults: 0,
    articles: [], // No articles
  });
  await selectPromise;

  await expect(newsHeadlines).toContainText('No articles available for the selected source.');
});

test('news-headlines dispatches articles:loaded event', async ({ page }) => {
  await page.route('**/top-headlines/sources**', async (route) => {
    const mockSources = JSON.parse(
      `{
          "status": "ok",
          "sources": [
            {
              "id": "cbc-news",
              "name": "CBC News"
            }
          ]
        }`,
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: mockSources,
    });
  });

  await page.route('**/top-headlines?**', async (route) => {
    const mockHeadlines = JSON.parse(
      `{
          "status": "ok",
          "totalResults": 1,
          "articles": []
        }`,
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: mockHeadlines,
    });
  });

  await page.goto(appUrl);
  const newsSourcePicker = page.locator('news-source-picker');
  const selectEl = newsSourcePicker.locator('select');

  let eventDetail = null;
  await page.exposeFunction('onArticlesLoaded', (detail) => {
    eventDetail = detail;
  });
  await page.evaluate(() => {
    document.querySelector('news-headlines').addEventListener('articles:loaded', (event) => {
      window.onArticlesLoaded(event.detail);
    });
  });

  await selectEl.selectOption('cbc-news');
  await page.waitForTimeout(500);
  expect(eventDetail).not.toBeNull();
  expect(eventDetail.source).toBe('cbc-news');
  expect(Array.isArray(eventDetail.articles)).toBe(true);
});

test('news-source-picker handles load errors gracefully', async ({ page }) => {
  await page.route('**/top-headlines/sources**', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      json: { status: 'error', message: 'Internal Server Error' },
    });
  });
  await page.goto(appUrl);
  const newsSourcePicker = page.locator('news-source-picker');
  const errorDiv = newsSourcePicker.locator('div.error');
  await expect(errorDiv).toHaveCount(1);
  await expect(errorDiv).toContainText('Failed to load news sources');
});

test('news-headlines handles load errors gracefully', async ({ page }) => {
  await page.route('**/top-headlines/sources**', async (route) => {
    const mockSources = JSON.parse(
      `{
          "status": "ok",
          "sources": [
            {
              "id": "cbc-news",
              "name": "CBC News"
            }
          ]
        }`,
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: mockSources,
    });
  });

  await page.route('**/top-headlines?**', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      json: { status: 'error', message: 'Internal Server Error' },
    });
  });

  await page.goto(appUrl);
  const newsSourcePicker = page.locator('news-source-picker');
  const selectEl = newsSourcePicker.locator('select');
  await selectEl.selectOption('cbc-news');
  const newsHeadlines = page.locator('news-headlines');
  const errorDiv = newsHeadlines.locator('div.error');
  await expect(errorDiv).toHaveCount(1);
  await expect(errorDiv).toContainText('Failed to load news articles');
});
