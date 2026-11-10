import { CustomDirective, Directive, Event, HostEvent, HostProperty, Property } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import type { XdGridRowClickEvent } from '../types/xd-grid.types';
import { INTERACTIVE_SELECTOR } from '../utils/xd-grid.utils';

/**
 * Makes a table row selectable: a click, or Enter / Space with the row focused, dispatches `rowClick`; the arrow keys
 * move the focus to the previous / next selectable row.
 */
@Directive({ selector: 'xdGridSelectableRow' })
export class XdGridSelectableRowDirective extends CustomDirective<HTMLElement> {
  /**
   * The position of the row among the sorted and filtered rows.
   */
  @Property(0)
  public accessor index!: InputSignal<number>;
  /**
   * Whether the row cannot be selected.
   */
  @Property(false)
  public accessor disabled!: InputSignal<boolean>;
  /**
   * The row was clicked, or activated with Enter / Space.
   */
  @Event()
  public accessor rowClick!: Output<XdGridRowClickEvent>;

  private _touched = false;
  private _touchTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Makes the row focusable, unless the directive is disabled.
   */
  @HostProperty('tabindex')
  public get tabIndex(): number | null {
    return this.disabled() ? null : 0;
  }

  /**
   * Remembers that the next click follows a touch.
   */
  @HostEvent('touchend')
  public onTouchEnd(): void {
    // The click of a touch follows at once: a touch that scrolled produces none and must not taint the next click
    this._touched = true;
    this._clearTouchTimer();
    this._touchTimer = setTimeout(() => {
      this._touched = false;
      this._touchTimer = null;
    }, 700);
  }

  /**
   * Dispatches `rowClick`, unless the click comes from a control inside the row.
   */
  @HostEvent('click')
  public onClick(event: MouseEvent): void {
    const target = event.target;
    const touched = this._touched;
    this._touched = false;
    this._clearTouchTimer();
    if (!this.disabled() && !(target instanceof Element && target.closest(INTERACTIVE_SELECTOR))) {
      this.rowClick.emit({ originalEvent: event, index: this.index(), touched });
    }
  }

  /**
   * Activates the row with Enter / Space and moves the focus with the arrow keys.
   */
  @HostEvent('keydown')
  public onKeydown(event: KeyboardEvent): void {
    if (event.target !== this.element) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.rowClick.emit({ originalEvent: event, index: this.index(), touched: false });
        break;
      case 'ArrowDown':
        event.preventDefault();
        this._focusSibling('nextElementSibling');
        break;
      case 'ArrowUp':
        event.preventDefault();
        this._focusSibling('previousElementSibling');
        break;
      default:
        break;
    }
  }

  private _clearTouchTimer(): void {
    if (this._touchTimer !== null) {
      clearTimeout(this._touchTimer);
      this._touchTimer = null;
    }
  }

  private _focusSibling(direction: 'nextElementSibling' | 'previousElementSibling'): void {
    let sibling = this.element[direction];
    while (sibling instanceof HTMLElement && !sibling.hasAttribute('tabindex')) {
      sibling = sibling[direction];
    }
    if (sibling instanceof HTMLElement) {
      sibling.focus();
    }
  }

  /**
   * Cancels the timer that forgets the touch.
   */
  public onDestroy(): void {
    this._clearTouchTimer();
  }
}
