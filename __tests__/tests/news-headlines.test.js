import { vi, expect, test, describe, beforeEach, afterEach } from 'vitest';
import * as newsApi from '../../src/js/api/news-api.js';
import '../../src/js/components/news-headlines.js';

const testSources = [
  { id: 'test-news-source', name: 'Test News Source' },
  { id: 'another-news-source', name: 'Another News Source' },
];

const testArticles = [
  {
    source: { id: 'test-news-source', name: 'Test News Source' },
    title: 'Test Article 1',
    description: 'Description for Test Article 1',
    url: 'https://example.com/test-article-1',
    urlToImage: 'https://example.com/image1.jpg',
  },
  {
    source: { id: 'test-news-source', name: 'Test News Source' },
    title: 'Test Article 2',
    description: 'Description for Test Article 2',
    url: 'https://example.com/test-article-2',
    urlToImage: 'https://example.com/image2.jpg',
  },
];

// Mock fetchTopHeadlineSources function
vi.spyOn(newsApi, 'fetchTopHeadlineSources').mockImplementation(async () => {
  return testSources;
});

// Mock fetchTopHeadlines function
vi.spyOn(newsApi, 'fetchTopHeadlines').mockImplementation(async (source) => {
  if (source === 'test-news-source') {
    return testArticles;
  }
  return [];
});

let element;

beforeEach(() => {
  element = document.createElement('news-headlines');
});

afterEach(() => {
  element.remove();
  element = null;
});

describe('NewsHeadlines Component', () => {
  test('1) should render default articles slot value', () => {
    document.body.appendChild(element);
    const shadow = element.shadowRoot;
    const articlesSlot = shadow.querySelector('slot[name="articles"]');

    expect(articlesSlot).toBeDefined();
    expect(articlesSlot.textContent).toContain('Choose a news source.');
    expect(articlesSlot.assignedNodes().length).toBe(0);
  });

  test('2) should load and render articles when source is set', async () => {
    const shadow = element.shadowRoot;
    const articlesSlot = shadow.querySelector('slot[name="articles"]');
    const sourceSlot = shadow.querySelector('slot[name="source"]');

    // Initially, only the default slot content should be present
    expect(articlesSlot.textContent).toContain('Choose a news source.');
    expect(sourceSlot.textContent).toBe('Top Headlines');

    // Set source and trigger loading
    element.source = 'test-news-source';
    await new Promise(resolve => setTimeout(resolve, 150));

    // After loading, the articles slot should be populated
    expect(sourceSlot.textContent).toBe('Source: test-news-source');
    expect(articlesSlot.textContent).toContain('Test Article 1');
    expect(articlesSlot.textContent).toContain('Test Article 2');
  });

  test('3) should render expected message when no articles for set source', async () => {
    const shadow = element.shadowRoot;
    const articlesSlot = shadow.querySelector('slot[name="articles"]');
    const sourceSlot = shadow.querySelector('slot[name="source"]');

    // Set source with no articles and trigger loading
    element.source = 'another-news-source';
    await new Promise(resolve => setTimeout(resolve, 150));

    // After loading, the articles slot should indicate no articles
    expect(sourceSlot.textContent).toBe('Source: another-news-source');
    expect(articlesSlot.textContent).toContain('No articles');
  });

  test('4) should dispatch articles:loaded event after loading articles', async () => {
    const eventPromise = new Promise((resolve) => {
      element.addEventListener('articles:loaded', (event) => {
        resolve(event);
      });
    });

    // Set source and trigger loading
    element.source = 'test-news-source';
    await new Promise(resolve => setTimeout(resolve, 150));

    return eventPromise.then((event) => {
      expect(event).toBeDefined();
      expect(event.detail.source).toBe('test-news-source');
      expect(event.detail.articles.length).toBe(2);
      expect(event.detail.articles[0].title).toBe('Test Article 1');
    });
  });

  test('5) should indicate loading state while fetching articles', async () => {
    const shadow = element.shadowRoot;

    // Extend the mock to add delay
    newsApi.fetchTopHeadlines.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(testArticles);
        }, 300);
      });
    });

    // Set source and immediately check loading state
    element.source = 'test-news-source';

    // During loading, there should be a loading message
    expect(shadow.textContent).toContain('Loading news...');
  });

  test('6) should handle error and render expected message during if fail to load articles', async () => {
    // Modify the mock to throw an error
    newsApi.fetchTopHeadlines.mockImplementationOnce(async () => {
      throw new Error('API Error');
    });

    const shadow = element.shadowRoot;

    // Set source and trigger loading
    element.source = 'test-news-source';
    await new Promise(resolve => setTimeout(resolve, 150));

    // After loading, the div.error should be present
    const errorDiv = shadow.querySelector('div.error');
    expect(errorDiv).toBeDefined();
    expect(errorDiv.textContent).toBe('Failed to load news articles');
  });
});
