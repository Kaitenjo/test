import { afterEach, describe, expect, it } from 'vitest';
import { XdIconComponent } from '../xd-icon/xd-icon.xd.component';
import { XdCheckboxComponent } from './xd-checkbox.xd.component';

/**
 * Waits for the effects, the template updates and the queries, which run in microtasks.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the component as a page does and records its `checkedChange` events.
 */
function mount(): { element: XdCheckboxComponent; changes: boolean[] } {
  const element = document.createElement('xd-checkbox');
  if (!(element instanceof XdCheckboxComponent)) {
    throw new Error('xd-checkbox is not defined');
  }

  const changes = new Array<boolean>();
  element.addEventListener('checkedChange', event => {
    changes.push((event as CustomEvent<boolean>).detail);
  });
  document.body.append(element);
  return { element, changes };
}

/**
 * The name of the icon the checkbox shows.
 */
function iconName(element: XdCheckboxComponent): string | undefined {
  const icon = element.shadowRoot!.querySelector('xd-icon');
  return icon instanceof XdIconComponent ? icon.name() : undefined;
}

describe('XdCheckboxComponent', () => {
  afterEach(() => document.body.replaceChildren());

  it('is an unchecked, focusable checkbox', async () => {
    const { element } = mount();
    await flush();

    expect(element.getAttribute('role')).toBe('checkbox');
    expect(element.getAttribute('aria-checked')).toBe('false');
    expect(element.getAttribute('tabindex')).toBe('0');
    expect(element.shadowRoot!.querySelector('xd-icon')).toBeNull();
  });

  it('asks for the opposite value on click and on Space', () => {
    const { element, changes } = mount();

    element.click();
    element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));

    expect(changes).toEqual([true, true]);
  });

  it('shows the check and the mixed state', async () => {
    const { element } = mount();

    Object.assign(element, { checked: true });
    await flush();
    expect(element.getAttribute('aria-checked')).toBe('true');
    expect(element.classList.contains('checked')).toBe(true);
    expect(iconName(element)).toBe('check');

    Object.assign(element, { indeterminate: true });
    await flush();
    expect(element.getAttribute('aria-checked')).toBe('mixed');
    expect(iconName(element)).toBe('minus');
  });

  it('emits false when it is checked', () => {
    const { element, changes } = mount();

    Object.assign(element, { checked: true });
    element.click();

    expect(changes).toEqual([false]);
  });

  it('ignores the user when disabled', async () => {
    const { element, changes } = mount();

    Object.assign(element, { disabled: true, accessibleLabel: 'Select row' });
    await flush();
    element.click();

    expect(changes).toEqual([]);
    expect(element.getAttribute('tabindex')).toBe('-1');
    expect(element.getAttribute('aria-disabled')).toBe('true');
    expect(element.getAttribute('aria-label')).toBe('Select row');
  });
});
