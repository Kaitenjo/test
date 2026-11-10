import { beforeAll, describe, expect, it } from 'vitest';
import { ComponentsRootComponent } from './components-root.xd.component';

describe('ComponentsRootComponent', () => {
  beforeAll(() => {
    // happy-dom lacks moveBefore, which the keyed @for blocks of the grid use to reorder their rows
    if (!('moveBefore' in Node.prototype)) {
      Object.defineProperty(Node.prototype, 'moveBefore', {
        configurable: true,
        value(this: Node, node: Node, reference: Node | null): void {
          this.insertBefore(node, reference);
        }
      });
    }
  });

  it('shows the test data in a grid', async () => {
    const element = document.createElement('components-root') as ComponentsRootComponent;
    document.body.append(element);
    await new Promise(resolve => setTimeout(resolve));

    const grid = element.shadowRoot?.querySelector('xd-grid');
    expect(element).toBeInstanceOf(ComponentsRootComponent);
    expect(element.rows()).toHaveLength(40);
    expect(grid?.shadowRoot?.querySelectorAll('tbody > tr.xd-grid-row')).toHaveLength(40);
    expect(grid?.shadowRoot?.querySelectorAll('thead th.xd-grid-header-cell')).toHaveLength(element.columns().length);
    element.remove();
  });
});
