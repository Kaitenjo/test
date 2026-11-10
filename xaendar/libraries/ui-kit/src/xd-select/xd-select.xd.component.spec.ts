import { afterEach, describe, expect, it } from 'vitest';
import { XdSelectComponent } from './xd-select.xd.component';

/**
 * Waits for the effects, the template updates and the queries, which run in microtasks.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

const CITIES = [
  { code: 'RM', name: 'Rome' },
  { code: 'MI', name: 'Milan' },
  { code: 'TO', name: 'Turin' }
];

/**
 * Mounts the component with the given inputs, as a page would assign them.
 */
async function mount(inputs: Partial<Record<keyof XdSelectComponent, unknown>> = {}): Promise<XdSelectComponent> {
  const element = document.createElement('xd-select');
  if (!(element instanceof XdSelectComponent)) {
    throw new Error('xd-select is not defined');
  }

  Object.assign(element, inputs);
  document.body.append(element);
  await flush();
  return element;
}

function trigger(element: XdSelectComponent): HTMLElement {
  return element.shadowRoot!.querySelector<HTMLElement>('.trigger')!;
}

function options(element: XdSelectComponent): HTMLElement[] {
  return [...element.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')];
}

function press(element: HTMLElement, key: string): void {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('XdSelectComponent', () => {
  afterEach(() => document.body.replaceChildren());

  it('shows the placeholder, then the label of the selected value', async () => {
    const element = await mount({ options: CITIES, optionLabel: 'name', optionValue: 'code', placeholder: 'City' });
    expect(element.shadowRoot!.querySelector('.label')!.textContent).toContain('City');

    Object.assign(element, { value: 'MI' });
    await flush();

    expect(element.shadowRoot!.querySelector('.label')!.textContent).toContain('Milan');
  });

  it('opens on click and lists the options', async () => {
    const element = await mount({ options: ['a', 'b', 'c'] });

    trigger(element).click();
    await flush();

    expect(element.isOpen()).toBe(true);
    expect(options(element).map(option => option.textContent!.trim())).toEqual(['a', 'b', 'c']);
    expect(trigger(element).getAttribute('aria-expanded')).toBe('true');
  });

  it('emits the value of the picked option and closes', async () => {
    const element = await mount({ options: CITIES, optionLabel: 'name', optionValue: 'code' });
    const values: unknown[] = [];
    element.addEventListener('valueChange', event => values.push((event as CustomEvent).detail));

    trigger(element).click();
    await flush();
    options(element)[2]!.click();
    await flush();

    expect(values).toEqual(['TO']);
    expect(element.isOpen()).toBe(false);
    expect(element.shadowRoot!.querySelector('.label')!.textContent).toContain('Turin');
  });

  it('uses the object itself as the value without optionValue', async () => {
    const element = await mount({ options: CITIES, optionLabel: 'name', value: { code: 'RM', name: 'Rome' } });

    expect(element.selectedEntry()?.label).toBe('Rome');
  });

  it('moves with the keyboard and picks with Enter', async () => {
    const element = await mount({ options: ['a', 'b', 'c'] });
    const values: unknown[] = [];
    element.addEventListener('valueChange', event => values.push((event as CustomEvent).detail));

    press(trigger(element), 'ArrowDown');
    await flush();
    press(trigger(element), 'ArrowDown');
    press(trigger(element), 'ArrowDown');
    await flush();
    expect(element.activeIndex()).toBe(2);

    press(trigger(element), 'Enter');
    await flush();

    expect(values).toEqual(['c']);
    expect(element.isOpen()).toBe(false);
  });

  it('closes with Escape without changing the value', async () => {
    const element = await mount({ options: ['a', 'b'] });

    trigger(element).click();
    await flush();
    press(trigger(element), 'Escape');
    await flush();

    expect(element.isOpen()).toBe(false);
    expect(element.hasValue()).toBe(false);
  });

  it('filters the options by label', async () => {
    const element = await mount({ options: ['Rome', 'Milan', 'Turin'], filter: true });

    trigger(element).click();
    await flush();
    const field = element.shadowRoot!.querySelector<HTMLInputElement>('.filter')!;
    field.value = 'mi';
    field.dispatchEvent(new Event('input'));
    await flush();

    expect(options(element).map(option => option.textContent!.trim())).toEqual(['Milan']);

    field.value = 'zzz';
    field.dispatchEvent(new Event('input'));
    await flush();

    expect(options(element)).toHaveLength(0);
    expect(element.shadowRoot!.querySelector('.empty')!.textContent).toContain('No results found');
  });

  it('clears the selection and emits null', async () => {
    const element = await mount({ options: ['a', 'b'], value: 'a', showClear: true });
    const values: unknown[] = [];
    element.addEventListener('valueChange', event => values.push((event as CustomEvent).detail));

    element.shadowRoot!.querySelector<HTMLElement>('.clear')!.click();
    await flush();

    expect(values).toEqual([null]);
    expect(element.hasValue()).toBe(false);
  });

  it('does not open while disabled', async () => {
    const element = await mount({ options: ['a'], disabled: true });

    trigger(element).click();
    await flush();

    expect(element.isOpen()).toBe(false);
    expect(trigger(element).getAttribute('tabindex')).toBe('-1');
  });

  it('closes on a pointer down outside', async () => {
    const element = await mount({ options: ['a'] });

    trigger(element).click();
    await flush();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    await flush();

    expect(element.isOpen()).toBe(false);
  });
});
