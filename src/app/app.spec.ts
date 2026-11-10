import { TestBed } from '@angular/core/testing';
import { loadSignals } from '@xaendar/signals';
import { beforeAll, describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  beforeAll(async () => {
    // Same set-up as main.ts: the signals first, then the library defining the custom elements
    loadSignals();
    await import('@xaendar/ui-kit/xd-grid/xd-grid.xd.component');
    // jsdom lacks moveBefore, which the keyed @for blocks of the grid use to reorder their rows
    if (!('moveBefore' in Node.prototype)) {
      Object.defineProperty(Node.prototype, 'moveBefore', {
        configurable: true,
        value(this: Node, node: Node, reference: Node | null): void {
          this.insertBefore(node, reference);
        }
      });
    }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App]
    }).compileComponents();
  });

  it('shows the test data in the Xaendar grid', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve));
    const grid = (fixture.nativeElement as HTMLElement).querySelector('xd-grid');

    expect(grid?.shadowRoot?.querySelectorAll('tbody > tr.xd-grid-row')).toHaveLength(40);
    expect(grid?.shadowRoot?.querySelectorAll('thead th.xd-grid-header-cell')).toHaveLength(8);
  });
});
