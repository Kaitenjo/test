import { CustomDirective, Directive, Event, HostEvent, HostProperty, Property } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { InputSignal, Signal } from '@xaendar/core/signals';
import type { XdGridColumnDropEvent } from '../types/xd-grid.types';

/**
 * The column being dragged: the root of its grid and its position, shared by the directives of one drag.
 */
let draggedColumn: { owner: object; root: Node; index: number } | null = null;

/**
 * Makes a header cell draggable to another position: dropping it on another cell dispatches `columnDrop` with the
 * position it takes. The cell shows `xd-drop-before` / `xd-drop-after` while a column hovers its half.
 */
@Directive({ selector: 'xdGridColumnReorder' })
export class XdGridColumnReorderDirective extends CustomDirective<HTMLElement> {
  /**
   * The position of the column in the grid.
   */
  @Property(0)
  public accessor index!: InputSignal<number>;
  /**
   * Whether the column cannot be moved.
   */
  @Property(false)
  public accessor disabled!: InputSignal<boolean>;
  /**
   * The column was dropped on another position: the detail holds the old and the new one.
   */
  @Event()
  public accessor columnDrop!: Output<XdGridColumnDropEvent>;

  /**
   * Whether a dragged column is hovering the first half of the cell.
   */
  @HostProperty('class.xd-drop-before')
  public readonly dropBefore: Signal<boolean> = signal(false);
  /**
   * Whether a dragged column is hovering the second half of the cell.
   */
  @HostProperty('class.xd-drop-after')
  public readonly dropAfter: Signal<boolean> = signal(false);

  /**
   * Makes the cell draggable, unless the directive is disabled.
   */
  @HostProperty('draggable')
  public get draggable(): string | null {
    return this.disabled() ? null : 'true';
  }

  /**
   * Starts dragging the column, unless the drag begins on the resize handle.
   */
  @HostEvent('dragstart')
  public onDragStart(event: DragEvent): void {
    // A drag starting on the resize handle resizes the column: it does not move it
    if (this.disabled() || (event.target instanceof Element && event.target.closest('.xd-grid-column-resizer'))) {
      event.preventDefault();

      return;
    }

    draggedColumn = { owner: this, root: this.element.getRootNode(), index: this.index() };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      // Firefox starts a drag only when the transfer holds some data
      event.dataTransfer.setData('text', '');
    }
  }

  /**
   * Accepts the dragged column and marks the half of the cell it hovers.
   */
  @HostEvent('dragover')
  public onDragOver(event: DragEvent): void {
    if (this.disabled() || !this._isDropTarget()) {
      return;
    }

    event.preventDefault();
    const bounds = this.element.getBoundingClientRect();
    const after = event.clientX > bounds.left + bounds.width / 2;
    this.dropBefore.set(!after);
    this.dropAfter.set(after);
  }

  /**
   * Removes the drop mark when the dragged column leaves the cell.
   */
  @HostEvent('dragleave')
  public onDragLeave(): void {
    this._clear();
  }

  /**
   * Dispatches `columnDrop` with the position the dragged column takes.
   */
  @HostEvent('drop')
  public onDrop(event: DragEvent): void {
    if (this.disabled() || !draggedColumn || !this._isDropTarget()) {
      return;
    }

    event.preventDefault();
    const dragIndex = draggedColumn.index;
    const insertion = this.dropAfter() ? this.index() + 1 : this.index();
    const dropIndex = insertion > dragIndex ? insertion - 1 : insertion;
    this._clear();
    draggedColumn = null;
    if (dropIndex !== dragIndex) {
      this.columnDrop.emit({ dragIndex, dropIndex });
    }
  }

  /**
   * Forgets the dragged column when the drag ends, wherever it was dropped.
   */
  @HostEvent('dragend')
  public onDragEnd(): void {
    draggedColumn = null;
    this._clear();
  }

  private _isDropTarget(): boolean {
    return draggedColumn !== null && draggedColumn.root === this.element.getRootNode() && draggedColumn.index !== this.index();
  }

  private _clear(): void {
    this.dropBefore.set(false);
    this.dropAfter.set(false);
  }

  /**
   * Forgets the dragged column if this cell started the drag.
   */
  public onDestroy(): void {
    if (draggedColumn?.owner === this) {
      draggedColumn = null;
    }
  }
}
