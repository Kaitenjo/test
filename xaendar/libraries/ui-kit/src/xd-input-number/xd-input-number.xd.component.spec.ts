import { afterEach, describe, expect, it } from 'vitest';
import { XdInputNumberComponent } from './xd-input-number.xd.component';

/**
 * Waits for the effects, the template updates and the queries, which run in microtasks.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the component as a page does and records its `valueChange` events.
 */
async function mount(): Promise<{ element: XdInputNumberComponent; changes: Array<number | null> }> {
  const element = document.createElement('xd-input-number');
  if (!(element instanceof XdInputNumberComponent)) {
    throw new Error('xd-input-number is not defined');
  }

  const changes = new Array<number | null>();
  element.addEventListener('valueChange', event => {
    changes.push((event as CustomEvent<number | null>).detail);
  });
  document.body.append(element);
  await flush();
  return { element, changes };
}

/**
 * Types a text in the field and fires the `change` event the browser fires on blur or Enter.
 */
function type(element: XdInputNumberComponent, text: string): void {
  const field = element.shadowRoot!.querySelector('input')!;
  field.value = text;
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('XdInputNumberComponent', () => {
  afterEach(() => document.body.replaceChildren());

  it('renders an empty field', async () => {
    const { element } = await mount();

    expect(element.shadowRoot!.querySelector('input')!.value).toBe('');
    expect(element.shadowRoot!.querySelector('button')).toBeNull();
  });

  it('shows the value with the fraction digits', async () => {
    const { element } = await mount();

    Object.assign(element, { value: 3.5, minFractionDigits: 2 });
    await flush();

    // The text follows the locale of the environment
    const expected = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, useGrouping: false }).format(3.5);
    expect(element.shadowRoot!.querySelector('input')!.value).toBe(expected);
  });

  it('emits the typed number, clamped to min and max', async () => {
    const { element, changes } = await mount();
    Object.assign(element, { min: 0, max: 10 });
    await flush();

    type(element, '5');
    type(element, '42');
    type(element, '-3');

    expect(changes).toEqual([5, 10, 0]);
  });

  it('emits null for an empty text and restores the value for an invalid one', async () => {
    const { element, changes } = await mount();
    Object.assign(element, { value: 7 });
    await flush();
    const field = element.shadowRoot!.querySelector('input')!;

    type(element, 'abc');
    expect(field.value).toBe('7');
    expect(changes).toEqual([]);

    type(element, '');
    expect(changes).toEqual([null]);
  });

  it('rounds to the maximum fraction digits', async () => {
    const { element, changes } = await mount();
    Object.assign(element, { maxFractionDigits: 1 });
    await flush();

    type(element, '2,26');

    expect(changes).toEqual([2.3]);
  });

  it('steps with the arrow keys', async () => {
    const { element, changes } = await mount();
    Object.assign(element, { value: 4, step: 2, max: 5 });
    await flush();
    const field = element.shadowRoot!.querySelector('input')!;

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));

    expect(changes).toEqual([5, 2]);
  });

  it('steps with the buttons and disables them', async () => {
    const { element, changes } = await mount();
    Object.assign(element, { showButtons: true, value: 1 });
    await flush();
    const [increment, decrement] = Array.from(element.shadowRoot!.querySelectorAll('button'));

    increment!.click();
    decrement!.click();
    expect(changes).toEqual([2, 0]);

    Object.assign(element, { disabled: true });
    await flush();
    expect(increment!.hasAttribute('disabled')).toBe(true);
    expect(element.shadowRoot!.querySelector('input')!.hasAttribute('disabled')).toBe(true);
  });
});
