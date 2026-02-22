// NewsHeadlines component to display a list of news headlines

import { fetchTopHeadlines } from '../api/news-api.js';

// TODO: define template for news-headlines component, markup is provided below
// <h2>News Articles</h2>
// <p class="lead"><slot name="source"></slot></p>
// <slot name="articles">Choose a news source.</slot>
// Ensure to correctly include Bootstrap CSS for scoped styling

const template = document.createElement('template');
template.innerHTML = `
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css">

  <section>
    <h2>News Articles</h2>
    <p class="lead"><slot name="source">Top Headlines</slot></p>
    <slot name="articles">Choose a news source.</slot>
  </section>
`;

class NewsHeadlines extends HTMLElement {
  #source = null;
  #isLoaded = false;
  #articles = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.sourceSlot = this.shadowRoot.querySelector('slot[name="source"]');
    this.articlesSlot = this.shadowRoot.querySelector('slot[name="articles"]');
  }

  connectedCallback() {
    this.render();
  }

  get source() {
    return this.#source;
  }

  set source(value) {
    if (value === this.#source) return;

    this.#source = value;
    this.fetchNews(value);
  }

  async fetchNews(source) {
    try {
      this.#isLoaded = false;
      this.render();

      if (!source) {
        this.#articles = [];
        this.#isLoaded = true;
        this.render();
        return;
      }

      const articles = await fetchTopHeadlines(source);
      this.#articles = articles || [];
      this.#isLoaded = true;

      this.dispatchEvent(
        new CustomEvent('articles:loaded', {
          detail: { source, articles: this.#articles },
          bubbles: true,
          composed: true
        })
      );

      this.render();
    } catch (err) {
      const errorDiv = document.createElement('div');
      errorDiv.classList.add('error');
      errorDiv.textContent = "Failed to load news articles";
      this.shadowRoot.appendChild(errorDiv);
    }
  }

  render() {
    if (!this.#isLoaded) {
      this.articlesSlot.innerHTML = "Loading news...";
      return;
    }

    if (this.#articles.length === 0) {
      this.articlesSlot.innerHTML = "No articles available.";
      return;
    }

    const container = document.createElement('div');

    this.#articles.forEach(article => {
      const card = document.createElement('div');
      card.classList.add('card', 'mb-3');

      card.innerHTML = `
        <div class="row g-0">
          <div class="col-md-4">
            <img src="${article.urlToImage || ''}" class="img-fluid" alt="${article.title}">
          </div>
          <div class="col-md-8">
            <div class="card-body">
              <h5 class="card-title">${article.title}</h5>
              <p class="card-text">${article.description || ''}</p>
              <a href="${article.url}" target="_blank" rel="noopener noreferrer">Read more</a>
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    this.articlesSlot.innerHTML = "";
    this.articlesSlot.appendChild(container);
  }
}

customElements.define('news-headlines', NewsHeadlines);