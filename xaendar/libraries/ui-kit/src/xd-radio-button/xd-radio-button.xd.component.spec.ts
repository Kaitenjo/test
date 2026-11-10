import { afterEach, describe, expect, it } from 'vitest';
import { XdRadioButtonComponent } from './xd-radio-button.xd.component';

/**
 * Waits for the effects, the template updates and the queries, which run in microtasks.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the component as a page does and records its `checkedChange` events.
 */
function mount(): { element: XdRadioButtonComponent; changes: boolean[] } {
  const element = document.createElement('xd-radio-button');
  if (!(element instanceof XdRadioButtonComponent)) {
    throw new Error('xd-radio-button is not defined');
  }

  const changes = new Array<boolean>();
  element.addEventListener('checkedChange', event => {
    changes.push((event as CustomEvent<boolean>).detail);
  });
  document.body.append(element);
  return { element, changes };
}

describe('XdRadioButtonComponent', () => {
  afterEach(() => document.body.replaceChildren());

  it('is an unchecked, focusable radio', async () => {
    const { element } = mount();
    await flush();

    expect(element.getAttribute('role')).toBe('radio');
    expect(element.getAttribute('aria-checked')).toBe('false');
    expect(element.getAttribute('tabindex')).toBe('0');
  });

  it('emits true on click and on Space', () => {
    const { element, changes } = mount();

    element.click();
    element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));

    expect(changes).toEqual([true, true]);
  });

  it('reflects the checked state and emits nothing when it is checked', async () => {
    const { element, changes } = mount();

    Object.assign(element, { checked: true });
    await flush();
    element.click();

    expect(element.getAttribute('aria-checked')).toBe('true');
    expect(element.classList.contains('checked')).toBe(true);
    expect(changes).toEqual([]);
  });

  it('ignores the user when disabled', async () => {
    const { element, changes } = mount();

    Object.assign(element, { disabled: true, accessibleLabel: 'Select row' });
    await flush();
    element.click();

    expect(changes).toEqual([]);
    expect(element.getAttribute('tabindex')).toBe('-1');
    expect(element.getAttribute('aria-label')).toBe('Select row');
  });
});
