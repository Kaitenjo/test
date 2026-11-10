import { CustomDirective, Directive, Event, HostEvent, Property } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import type { XdGridResizeEvent } from '../types/xd-grid.types';

/**
 * The drag handle of a column. Dragging it dispatches `resizeBegin`, `resizing` for every move and `resizeEnd` when
 * the pointer is released; the grid applies the new width.
 */
@Directive({ selector: 'xdGridColumnResizer' })
export class XdGridColumnResizerDirective extends CustomDirective<HTMLElement> {
  /**
   * Whether the column cannot be resized.
   */
  @Property(false)
  public accessor disabled!: InputSignal<boolean>;
  /**
   * The user pressed the handle: the drag begins.
   */
  @Event()
  public accessor resizeBegin!: Output<XdGridResizeEvent>;
  /**
   * The pointer moved while the handle is dragged.
   */
  @Event()
  public accessor resizing!: Output<XdGridResizeEvent>;
  /**
   * The pointer was released: the drag ends.
   */
  @Event()
  public accessor resizeEnd!: Output<XdGridResizeEvent>;

  private _startX = 0;
  private _startWidth = 0;
  private _direction = 1;
  private _dragging = false;
  private readonly _onPointerMove = (event: PointerEvent): void => {
    this.resizing.emit(this._describe(event));
  };
  private readonly _onPointerUp = (event: PointerEvent): void => {
    this._stop();
    this.resizeEnd.emit(this._describe(event));
  };

  /**
   * Starts the drag and listens to the pointer on the document until it is released.
   */
  @HostEvent('pointerdown')
  public onPointerDown(event: PointerEvent): void {
    if (this.disabled() || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    const header = this.element.closest('th');
    this._startX = event.clientX;
    this._startWidth = header ? header.getBoundingClientRect().width : 0;
    this._direction = getComputedStyle(this.element).direction === 'rtl' ? -1 : 1;
    this._dragging = true;
    event.preventDefault();
    document.addEventListener('pointermove', this._onPointerMove);
    document.addEventListener('pointerup', this._onPointerUp);
    document.addEventListener('pointercancel', this._onPointerUp);
    this.resizeBegin.emit(this._describe(event));
  }

  /**
   * The click ending a drag must not reach the header cell, which would sort the column.
   */
  @HostEvent('click')
  public onClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  private _describe(event: PointerEvent): XdGridResizeEvent {
    return { clientX: event.clientX, delta: (event.clientX - this._startX) * this._direction, width: this._startWidth };
  }

  private _stop(): void {
    if (this._dragging) {
      this._dragging = false;
      document.removeEventListener('pointermove', this._onPointerMove);
      document.removeEventListener('pointerup', this._onPointerUp);
      document.removeEventListener('pointercancel', this._onPointerUp);
    }
  }

  /**
   * Stops listening to the pointer.
   */
  public onDestroy(): void {
    this._stop();
  }
}
