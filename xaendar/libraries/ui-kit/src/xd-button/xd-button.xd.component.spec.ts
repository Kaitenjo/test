import { afterEach, describe, expect, it } from 'vitest';
import { XdButtonComponent } from './xd-button.xd.component';

/**
 * Waits for the effects, the template updates and the queries, which run in microtasks.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the component as a page does.
 */
function mount(): XdButtonComponent {
  const element = document.createElement('xd-button');
  if (!(element instanceof XdButtonComponent)) {
    throw new Error('xd-button is not defined');
  }

  document.body.append(element);
  return element;
}

describe('XdButtonComponent', () => {
  afterEach(() => document.body.replaceChildren());

  it('renders a native button of type button', () => {
    const element = mount();
    const button = element.shadowRoot!.querySelector('button')!;

    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(element.shadowRoot!.querySelector('.label')).toBeNull();
  });

  it('shows the label and the icon', async () => {
    const element = mount();

    Object.assign(element, { label: 'Save', icon: 'check', iconPos: 'right' });
    await flush();

    expect(element.shadowRoot!.querySelector('.label')!.textContent).toBe('Save');
    expect(element.shadowRoot!.querySelector('xd-icon')!.classList.contains('right')).toBe(true);
    expect(element.shadowRoot!.querySelector('button')!.classList.contains('icon-only')).toBe(false);
  });

  it('is icon only without label', async () => {
    const element = mount();

    Object.assign(element, { icon: 'plus' });
    await flush();

    expect(element.shadowRoot!.querySelector('button')!.classList.contains('icon-only')).toBe(true);
  });

  it('reflects the severity, the variants and the accessible label', async () => {
    const element = mount();

    Object.assign(element, { severity: 'danger', text: true, rounded: true, accessibleLabel: 'Delete' });
    await flush();
    const button = element.shadowRoot!.querySelector('button')!;

    expect(button.classList.contains('danger')).toBe(true);
    expect(button.classList.contains('text')).toBe(true);
    expect(button.classList.contains('rounded')).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('Delete');
  });

  it('disables the button and the host', async () => {
    const element = mount();

    Object.assign(element, { disabled: true });
    await flush();

    expect(element.shadowRoot!.querySelector('button')!.hasAttribute('disabled')).toBe(true);
    expect(element.classList.contains('disabled')).toBe(true);
  });

  it('lets the click reach the parent', () => {
    const element = mount();
    let clicks = 0;
    element.addEventListener('click', () => {
      clicks += 1;
    });

    element.shadowRoot!.querySelector('button')!.click();

    expect(clicks).toBe(1);
  });
});
