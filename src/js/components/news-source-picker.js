// NewsSourcePicker component to allow users to select a news source

import { fetchTopHeadlineSources } from '../api/news-api.js';

// Template for the component
const template = document.createElement('template');
template.innerHTML = `
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css">

  <div>
    <select class="form-select" aria-label="News Source Selector">
      <option selected>Select a news source</option>
    </select>
  </div>
`;

class NewsSourcePicker extends HTMLElement {
  #sources = [];
  #selectedSource = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.selectEl = this.shadowRoot.querySelector('select');

    this.onChange = this.onChange.bind(this);
  }

  connectedCallback() {
    this.selectEl.addEventListener('change', this.onChange);
    this.loadSources();
  }

  disconnectedCallback() {
    this.selectEl.removeEventListener('change', this.onChange);
  }

  onChange() {
    const value = this.selectEl.value;

    if (value === "Select a news source") {
      this.#selectedSource = null;
      return;
    }

    this.#selectedSource = value;

    this.dispatchEvent(
      new CustomEvent('source:changed', {
        detail: { source: this.#selectedSource },
        bubbles: true,
        composed: true
      })
    );
  }

  async loadSources() {
    try {
      this.#sources = await fetchTopHeadlineSources();
      this.populateSelect();

          if (this.#sources.length > 0) {
        this.selectEl.value = this.#sources[0].id;
        this.#selectedSource = this.#sources[0].id;

        this.dispatchEvent(
          new CustomEvent('source:changed', {
            detail: { source: this.#selectedSource },
            bubbles: true,
            composed: true
          })
        );
      }

    } catch (err) {
      const errorDiv = document.createElement('div');
      errorDiv.classList.add('error');
      errorDiv.textContent = "Failed to load news sources";
      this.shadowRoot.appendChild(errorDiv);
    }
  }

  populateSelect() {
    if (!Array.isArray(this.#sources)) return;

    this.#sources.forEach(source => {
      const option = document.createElement('option');
      option.value = source.id;
      option.textContent = source.name;
      this.selectEl.appendChild(option);
    });
  }
}

customElements.define('news-source-picker', NewsSourcePicker);