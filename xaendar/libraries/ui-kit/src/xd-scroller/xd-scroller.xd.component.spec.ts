import { afterEach, describe, expect, it } from 'vitest';
import { XdScrollerComponent } from './xd-scroller.xd.component';
import type { XdScrollerRange } from './xd-scroller.xd.component';

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

function createScroller(properties: Record<string, unknown>): XdScrollerComponent {
  const element = document.createElement('xd-scroller') as XdScrollerComponent;
  Object.defineProperty(element, 'clientHeight', { configurable: true, get: () => 200 });
  Object.assign(element, properties);
  return element;
}

describe('XdScrollerComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('computes the range from the viewport and reserves the rest of the space', async () => {
    const element = createScroller({ itemCount: 100, itemSize: 20, numToleratedItems: 2 });
    const ranges: XdScrollerRange[] = [];
    element.addEventListener('rangeChange', event => {
      ranges.push((event as CustomEvent<XdScrollerRange>).detail);
    });
    document.body.append(element);
    await flush();

    // 200px / 20px = 10 visible items, plus 2 tolerated below
    expect(element).toBeInstanceOf(XdScrollerComponent);
    expect(element.first()).toBe(0);
    expect(element.last()).toBe(12);
    expect(ranges[0]).toEqual({ first: 0, last: 12 });
    expect(element.shadowRoot?.querySelector('.content')?.getAttribute('style')).toContain('padding-block-end: 1760px');
  });

  it('moves the range on scroll and clamps it to the item count', async () => {
    const element = createScroller({ itemCount: 30, itemSize: 20, numToleratedItems: 2 });
    let offset = 0;
    Object.defineProperty(element, 'scrollTop', { configurable: true, get: () => offset });
    document.body.append(element);
    await flush();

    offset = 200;
    element.dispatchEvent(new Event('scroll'));
    await flush();
    expect(element.first()).toBe(8);
    expect(element.last()).toBe(22);

    offset = 10000;
    element.dispatchEvent(new Event('scroll'));
    await flush();
    expect(element.last()).toBe(30);
    expect(element.first()).toBeLessThan(30);
  });

  it('aligns the lazy range to the step', async () => {
    const element = createScroller({ itemCount: 100, itemSize: 20, numToleratedItems: 0, lazy: true, step: 25 });
    const loads: XdScrollerRange[] = [];
    element.addEventListener('lazyLoad', event => {
      loads.push((event as CustomEvent<XdScrollerRange>).detail);
    });
    document.body.append(element);
    await flush();

    expect(loads).toEqual([{ first: 0, last: 25 }]);
  });

  it('applies the viewport height to the host', async () => {
    const element = createScroller({ itemCount: 10, viewportHeight: '320px' });
    document.body.append(element);
    await flush();

    expect(element.style.height).toBe('320px');
  });
});
