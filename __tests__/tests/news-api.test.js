import { vi, expect, test, describe, afterEach } from 'vitest';
import { fetchTopHeadlineSources, fetchTopHeadlines } from '../../src/js/api/news-api.js';

describe('News API Module', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('1) fetchTopHeadlineSources should return array of sources on successful fetch', async () => {
    const mockSources = [
      { id: 'source-1', name: 'Source 1' },
      { id: 'source-2', name: 'Source 2' },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sources: mockSources }),
    });

    const sources = await fetchTopHeadlineSources();
    expect(sources).toEqual(mockSources);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('2) fetchTopHeadlineSources should throw error on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchTopHeadlineSources()).rejects.toThrow(
      'Error fetching top headline sources:',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('3) fetchTopHeadlineSources should throw error on for any non-OK response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetchTopHeadlineSources()).rejects.toThrow(
      'Error fetching top headline sources:',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('4) fetchTopHeadlines should return array of articles for given source on successful fetch', async () => {
    const testSource = 'source-1';
    const mockArticles = [
      { title: 'Article 1', description: 'Description 1' },
      { title: 'Article 2', description: 'Description 2' },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ articles: mockArticles }),
    });

    const articles = await fetchTopHeadlines(testSource);
    expect(articles).toEqual(mockArticles);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('5) fetchTopHeadlines should throw error on fetch failure', async () => {
    const testSource = 'source-1';

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchTopHeadlines(testSource)).rejects.toThrow(
      'Error fetching top headlines: Network error',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('6) fetchTopHeadlines should throw error on for any non-OK response', async () => {
    const testSource = 'source-1';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetchTopHeadlines(testSource)).rejects.toThrow(
      'Error fetching top headlines:',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
