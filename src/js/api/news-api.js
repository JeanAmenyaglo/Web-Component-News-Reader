import { API_URL, API_KEY } from './config.js';

// Fetch top headline sources
export async function fetchTopHeadlineSources() {
  try {
    const response = await fetch(`${API_URL}/top-headlines/sources?apiKey=${API_KEY}`);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data.sources || [];
  } catch (error) {
    throw new Error(`Error fetching top headline sources: ${error.message}`);
  }
}

// Fetch top headlines for a given source
export async function fetchTopHeadlines(source) {
  try {
    const response = await fetch(
      `${API_URL}/top-headlines?sources=${source}&apiKey=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    throw new Error(`Error fetching top headlines: ${error.message}`);
  }
}