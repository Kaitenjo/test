import { CustomDirective, Directive, Event, HostEvent, HostProperty, Property } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import type { XdGridColumnSortEvent } from '../types/xd-grid.types';
import { INTERACTIVE_SELECTOR } from '../utils/xd-grid.utils';

/**
 * Makes a header cell sortable: a click, or Enter / Space with the cell focused, dispatches `columnSort`.
 * The grid decides what sorting means.
 */
@Directive({ selector: 'xdGridSortableColumn' })
export class XdGridSortableColumnDirective extends CustomDirective<HTMLElement> {
  /**
   * The path of the value the column shows.
   */
  @Property('')
  public accessor field!: InputSignal<string>;
  /**
   * Whether the column cannot be sorted.
   */
  @Property(false)
  public accessor disabled!: InputSignal<boolean>;
  /**
   * The column was clicked, or activated with Enter / Space.
   */
  @Event()
  public accessor columnSort!: Output<XdGridColumnSortEvent>;

  /**
   * Makes the cell focusable, unless the directive is disabled.
   */
  @HostProperty('tabindex')
  public get tabIndex(): number | null {
    return this.disabled() ? null : 0;
  }

  /**
   * Dispatches `columnSort`, unless the click comes from a control inside the cell.
   */
  @HostEvent('click')
  public onClick(event: MouseEvent): void {
    const target = event.target;
    if (!this.disabled() && !(target instanceof Element && target.closest(INTERACTIVE_SELECTOR))) {
      this._sort(event);
    }
  }

  /**
   * Dispatches `columnSort` when Enter / Space is pressed on the cell itself.
   */
  @HostEvent('keydown')
  public onKeydown(event: KeyboardEvent): void {
    if ((event.key === 'Enter' || event.key === ' ') && event.target === this.element && !this.disabled()) {
      event.preventDefault();
      this._sort(event);
    }
  }

  private _sort(event: Event): void {
    this.columnSort.emit({ originalEvent: event, field: this.field() });
  }
}
