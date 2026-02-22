// vitest unit tests/news-dashboard.test.js
import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import '../../src/js/components/news-dashboard.js';

let element;

beforeEach(() => {
  element = document.createElement('news-dashboard');
});

afterEach(() => {
  element.remove();
  element = null;
});

describe('NewsDashboard Component', () => {
  test('1) should render default slot values', () => {
    document.body.appendChild(element);
    const shadow = element.shadowRoot;

    const sourcesSlot = shadow.querySelector('slot[name="sources"]');
    const mainSlot = shadow.querySelector('slot[name="main"]');

    expect(sourcesSlot).toBeDefined();
    expect(sourcesSlot.textContent).toContain('Add a <news-source-picker > here.');
    expect(mainSlot).toBeDefined();
    expect(mainSlot.textContent).toContain('No content available');
    expect(mainSlot.assignedNodes().length).toBe(0);
  });

  test('2) should assign event listener in connectedCallback for source:changed event', () => {
    const shadow = element.shadowRoot;

    // Create mock source picker
    const mockSourcePicker = document.createElement('div');
    mockSourcePicker.setAttribute('slot', 'sources');

    // Dispatch cuseom source:changed event from mock source picker when it is clicked
    const testSource = 'test-news-source';
    const event = new CustomEvent('source:changed', {
      detail: { source: testSource },
      bubbles: true,
      composed: true,
    });
    mockSourcePicker.addEventListener('click', () => {
      mockSourcePicker.dispatchEvent(event);
    });

    // Insert mock source picker into sources slot
    element.appendChild(mockSourcePicker);

    // Create mock main content
    const mockMainContent = document.createElement('div');
    mockMainContent.setAttribute('slot', 'main');
    element.appendChild(mockMainContent);

    // Append element here to body to call connectedCallback
    document.body.appendChild(element);

    // Test the click to dispatch event
    mockSourcePicker.click();

    // Get the main slot and verify its source property was updated
    const mainSlot = shadow.querySelector('slot[name="main"]');
    const assignedNodes = mainSlot.assignedNodes();
    expect(assignedNodes.length).toBe(1);
    const mainContent = assignedNodes[0];
    expect(mainContent.source).toBe(testSource);
  });

  test('3) should remove event listener in disconnectedCallback for source:changed event', () => {
    const shadow = element.shadowRoot;

    // Create mock source picker
    const mockSourcePicker = document.createElement('div');
    mockSourcePicker.setAttribute('slot', 'sources');

    // Dispatch cuseom source:changed event from mock source picker when it is clicked
    const testSource = 'test-news-source';
    const event = new CustomEvent('source:changed', {
      detail: { source: testSource },
      bubbles: true,
      composed: true,
    });
    mockSourcePicker.addEventListener('click', () => {
      mockSourcePicker.dispatchEvent(event);
    });

    // Insert mock source picker into sources slot
    element.appendChild(mockSourcePicker);

    // Create mock main content
    const mockMainContent = document.createElement('div');
    mockMainContent.setAttribute('slot', 'main');
    element.appendChild(mockMainContent);

    // Append element here to body to call connectedCallback
    document.body.appendChild(element);

    // Test the click to dispatch event
    mockSourcePicker.click();

    // Get the main slot and verify its source property was updated
    const mainSlot = shadow.querySelector('slot[name="main"]');
    const assignedNodes = mainSlot.assignedNodes();
    expect(assignedNodes.length).toBe(1);
    const mainContent = assignedNodes[0];
    expect(mainContent.source).toBe(testSource);

    // Now remove the element to call disconnectedCallback
    element.remove();

    // Reset the source property
    mainContent.source = null;

    // Click again to try to dispatch event after disconnectedCallback
    mockSourcePicker.click();

    // Verify that the main content source property was NOT updated
    expect(mainContent.source).toBeNull();
  });
});
