import { afterEach, describe, expect, it } from 'vitest';
import { XdIconComponent } from './xd-icon.xd.component';

/**
 * Waits for the effects, the template updates and the queries, which run in microtasks.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the component as a page does.
 */
function mount(): XdIconComponent {
  const element = document.createElement('xd-icon');
  if (!(element instanceof XdIconComponent)) {
    throw new Error('xd-icon is not defined');
  }

  document.body.append(element);
  return element;
}

describe('XdIconComponent', () => {
  afterEach(() => document.body.replaceChildren());

  it('draws nothing without a name', () => {
    const element = mount();

    expect(element.shadowRoot!.querySelector('svg')).toBeNull();
  });

  it('draws the icon of its name', async () => {
    const element = mount();

    Object.assign(element, { name: 'check' });
    await flush();

    expect(element.shadowRoot!.querySelectorAll('svg')).toHaveLength(1);
    expect(element.shadowRoot!.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 14 14');
  });

  it('changes the icon and spins it', async () => {
    const element = mount();

    Object.assign(element, { name: 'spinner', spin: true });
    await flush();
    expect(element.shadowRoot!.querySelector('svg')!.classList.contains('spin')).toBe(true);

    Object.assign(element, { name: 'plus', spin: false });
    await flush();
    expect(element.shadowRoot!.querySelector('svg')!.classList.contains('spin')).toBe(false);
    expect(element.shadowRoot!.querySelectorAll('path')).toHaveLength(1);
  });
});
