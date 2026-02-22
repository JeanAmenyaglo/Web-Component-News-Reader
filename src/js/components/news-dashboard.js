// NewsDashboard web component to display the overall news dashboard

// TODO: define template for news-dashboard component, markup is provided below
// <div class="container-fluid min-vh-100 bg-body-secondary d-flex flex-column">
//   <div class="row">
//     <nav class="navbar">
//       <div class="container-fluid">
//         <a href="/" class="navbar-brand mb-0 h1">News Dashboard</a>
//       </div>
//     </nav>
//   </div>
//   <div class="row  flex-sm-row flex-grow-1">
//     <nav class="p-3 col-sm-4">
//       <slot name="sources">
//         <p>Add a &lt;news-source-picker&gt; here.</p>
//       </slot>
//     </nav>
//     <main class="col-sm-8 bg-body-tertiary p-3 flex-grow-1">
//       <slot name="main">No content available</slot>
//     </main>
//   </div>
// </div>
//
// NOTE: left-hand navigation layout using Bootstrap
// Ensure to correctly include Bootstrap CSS for scoped styling

// TODO: define NewsDashboard class
// The `constructor` should:
// - Attach shadow DOM
// - Clone and append template content to shadow root
// Must implement private `onSourceChanged(event)` method to handle source changes
// - Update main slot's (news-headlines) source property with selected source from event detail
// Must implement `connectedCallback` to set references to sources slot and main slot,
//   and add event listener for `source:changed` on sources slot
// Must implement `disconnectedCallback` to remove `source:changed` event listener

// ---------------
// IMPLEMENTATION 
// ---------------

// Create template
const template = document.createElement('template');
template.innerHTML = `
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css">

  <div class="container-fluid min-vh-100 bg-body-secondary d-flex flex-column">
    <div class="row">
      <nav class="navbar">
        <div class="container-fluid">
          <a href="/" class="navbar-brand mb-0 h1">News Dashboard</a>
        </div>
      </nav>
    </div>

    <div class="row flex-sm-row flex-grow-1">
      <nav class="p-3 col-sm-4">
        <slot name="sources">
          <p>Add a &lt;news-source-picker&gt; here.</p>
        </slot>
      </nav>

      <main class="col-sm-8 bg-body-tertiary p-3 flex-grow-1">
        <slot name="main">No content available</slot>
      </main>
    </div>
  </div>
`;

class NewsDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.onSourceChanged = this.onSourceChanged.bind(this);
  }

  connectedCallback() {
    this.sourcesSlot = this.shadowRoot.querySelector('slot[name="sources"]');
    this.mainSlot = this.shadowRoot.querySelector('slot[name="main"]');

    this.sourcesSlot.addEventListener('source:changed', this.onSourceChanged);
  }

  disconnectedCallback() {
    this.sourcesSlot.removeEventListener('source:changed', this.onSourceChanged);
  }

  onSourceChanged(event) {
    const selectedSource = event.detail.source;

    const assigned = this.mainSlot.assignedElements();
    const headlinesComponent = assigned.find(el => el.tagName === 'NEWS-HEADLINES');

    if (headlinesComponent) {
      headlinesComponent.source = selectedSource;
    }
  }
}

customElements.define('news-dashboard', NewsDashboard);
