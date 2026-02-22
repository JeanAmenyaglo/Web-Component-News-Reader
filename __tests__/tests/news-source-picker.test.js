import { vi, expect, test, describe, beforeEach, afterEach } from 'vitest';
import * as newsApi from '../../src/js/api/news-api.js';
import '../../src/js/components/news-source-picker.js';

const testSources = [
  { id: 'test-news-source', name: 'Test News Source' },
  { id: 'another-news-source', name: 'Another News Source' },
];

// Mock fetchTopHeadlineSources function
vi.spyOn(newsApi, 'fetchTopHeadlineSources').mockImplementation(async () => {
  return testSources;
});

let element;

beforeEach(() => {
  element = document.createElement('news-source-picker');
});

afterEach(() => {
  element.remove();
  element = null;
});

describe('NewsSourcePicker Component', () => {
  test('1) should render default slot values', () => {
    document.body.appendChild(element);
    const shadow = element.shadowRoot;
    const selectEl = shadow.querySelector('select');

    expect(selectEl).toBeDefined();
    expect(selectEl.children.length).toBe(1);
    expect(selectEl.children[0].textContent).toBe('Select a news source');
  });

  test('2) should load and populate news sources on connectedCallback', async () => {
    const shadow = element.shadowRoot;
    const selectEl = shadow.querySelector('select');

    // Initially, only the default option should be present
    expect(selectEl.children.length).toBe(1);

    document.body.appendChild(element);
    // Wait for 150 ms to allow async operations to complete
    await new Promise(resolve => setTimeout(resolve, 150));

    // After loading, the select should be populated with our test sources
    expect(selectEl.children.length).toBe(3);
    // expect(element.shadowRoot.querySelector('div.error').textContent).toBe('Failed to load news sources');
    expect(selectEl.children[1].value).toBe('test-news-source');
    expect(selectEl.children[1].textContent).toBe('Test News Source');
    expect(selectEl.children[2].value).toBe('another-news-source');
    expect(selectEl.children[2].textContent).toBe('Another News Source');
  });

  test('3) should dispatch source:changed event on select change', async () => {
    document.body.appendChild(element);
    // Wait for 150 ms to allow async operations to complete
    await new Promise(resolve => setTimeout(resolve, 150));

    const shadow = element.shadowRoot;
    const selectEl = shadow.querySelector('select');

    const testSource = testSources[1].id;
    const eventPromise = new Promise((resolve) => {
      element.addEventListener('source:changed', (event) => {
        resolve(event);
      });
    });

    // Simulate changing the select value
    selectEl.value = testSource;
    selectEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    return eventPromise.then((event) => {
      expect(event).toBeDefined();
      expect(selectEl.value).toBe(testSource);
      expect(event.detail.source).toBe(testSource);
    });
  });

  test('4) should remove event listener in disconnectedCallback', async () => {
    document.body.appendChild(element);
    // Wait for 150 ms to allow async operations to complete
    await new Promise(resolve => setTimeout(resolve, 150));

    const shadow = element.shadowRoot;
    const selectEl = shadow.querySelector('select');

    const testSource = testSources[1].id;
    const eventPromise = new Promise((resolve) => {
      element.addEventListener('source:changed', (event) => {
        resolve(event);
      });
    });

    // Remove element to trigger disconnectedCallback
    element.remove();

    // Simulate changing the select value
    selectEl.value = testSource;
    selectEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    // Expect that the event listener has been removed and the promise does not resolve
    let eventResolved = false;
    eventPromise.then(() => {
      eventResolved = true;
    });

    // Wait for 100 ms to see if the event resolves
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(eventResolved).toBe(false);
  });
  test('5) should handle error during source loading', async () => {
    // Mock fetchTopHeadlineSources to throw an error
    vi.spyOn(newsApi, 'fetchTopHeadlineSources').mockImplementationOnce(async () => {
      throw new Error('Network error');
    });

    document.body.appendChild(element);
    // Wait for 150 ms to allow async operations to complete
    await new Promise(resolve => setTimeout(resolve, 150));

    const shadow = element.shadowRoot;
    const errorDiv = shadow.querySelector('div.error');

    expect(errorDiv).toBeDefined();
    expect(errorDiv.textContent).toBe('Failed to load news sources');
  });
});
