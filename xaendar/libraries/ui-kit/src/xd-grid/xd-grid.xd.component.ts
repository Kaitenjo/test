import { CustomElement, Event, Property, Query, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { computed, signal, untracked } from '@xaendar/core/signals';
import type { Aliased, Computed, InputSignal, QuerySignal, Signal } from '@xaendar/core/signals';
import type { PaginatorState } from '../xd-paginator/xd-paginator.xd.component';
import type { XdScrollerComponent, XdScrollerRange } from '../xd-scroller/xd-scroller.xd.component';
import { filterConstraints } from '../utils/xd-grid.filter';
import type { XdGridColReorderEvent, XdGridColResizeEvent, XdGridColumn, XdGridColumnDropEvent, XdGridColumnSortEvent, XdGridDisplayColumn, XdGridExportOptions, XdGridFilterEvent, XdGridFilterMatchMode, XdGridFilters, XdGridLazyLoadEvent, XdGridPageEvent, XdGridResizeEvent, XdGridRow, XdGridRowClickEvent, XdGridRowEvent, XdGridRowExpandEvent, XdGridSelectAllEvent, XdGridSortMeta } from '../types/xd-grid.types';
import { compareValues, equals, isEmptyValue, resolveFieldData } from '../utils/xd-grid.utils';

/**
 * A data grid: it shows `value` in the `columns` and offers sorting, filtering, pagination, row selection, row
 * expansion, column resizing and reordering, virtual scrolling, lazy loading and CSV export.
 *
 * Custom content goes in the named slots of the grid: `caption`, `summary`, `empty`, `paginator-left`,
 * `paginator-right`, `header-<field>`, `footer-<field>`, `cell-<field>-<rowKey>` and `expansion-<rowKey>`, where
 * `rowKey` is the value of `dataKey` in the row, or its position in `value` when there is no `dataKey`.
 * Arrays and objects given to the grid are never changed: give it a new one to update it.
 */
@WebComponent({
  selector: 'xd-grid',
  styleUrl: './xd-grid.xd.component.scss',
  templateUrl: './xd-grid.xd.component.html'
})
export class XdGridComponent extends CustomElement {
  /**
   * The rows to show. The grid never changes the array: give it a new one to update the rows. It is empty until a
   * host sets it: a host other than Xaendar (Angular, React, plain HTML) sets the properties of the element after
   * connecting it, so the input cannot be required.
   */
  @Property<InputSignal<unknown[]>>([])
  public accessor value!: InputSignal<unknown[]>;
  /**
   * The columns of the grid, in the order they are shown. It is empty until a host sets it, like `value`.
   */
  @Property<InputSignal<XdGridColumn[]>>([])
  public accessor columns!: InputSignal<XdGridColumn[]>;
  /**
   * Path of the field identifying a row: it makes the selection and the expansion survive a new `value`.
   */
  @Property<InputSignal<string | undefined>>(undefined)
  public accessor dataKey!: InputSignal<string | undefined>;
  /**
   * The text shown when there are no rows, unless the `empty` slot has content.
   */
  @Property('No records found')
  public accessor emptyMessage!: InputSignal<string>;
  /**
   * Whether the rows are split in pages.
   */
  @Property(false)
  public accessor paginator!: InputSignal<boolean>;
  /**
   * The number of rows of a page.
   */
  @Property(10)
  public accessor rows!: InputSignal<number>;
  /**
   * The position in the rows of the first row of the page.
   */
  @Property(0)
  public accessor first!: InputSignal<number>;
  /**
   * Number of rows of a lazy grid, all pages included.
   */
  @Property(0)
  public accessor totalRecords!: InputSignal<number>;
  /**
   * The number of page links the paginator shows.
   */
  @Property(5)
  public accessor pageLinks!: InputSignal<number>;
  /**
   * The page sizes the user can choose from: numbers or `{ label, value }` objects.
   */
  @Property<InputSignal<any[] | undefined>>(undefined)
  public accessor rowsPerPageOptions!: InputSignal<any[] | undefined>;
  /**
   * Whether the paginator is shown even when there is a single page.
   */
  @Property(true)
  public accessor alwaysShowPaginator!: InputSignal<boolean>;
  /**
   * Where the paginator is shown.
   */
  @Property<InputSignal<'top' | 'bottom' | 'both'>>('bottom')
  public accessor paginatorPosition!: InputSignal<'top' | 'bottom' | 'both'>;
  /**
   * The text of the page report, with the placeholders `{currentPage}`, `{totalPages}`, `{rows}`, `{first}`, `{last}` and `{totalRecords}`.
   */
  @Property('{currentPage} of {totalPages}')
  public accessor currentPageReportTemplate!: InputSignal<string>;
  /**
   * Whether the paginator shows the page report.
   */
  @Property(false)
  public accessor showCurrentPageReport!: InputSignal<boolean>;
  /**
   * Whether the paginator has the buttons to go to the first and the last page.
   */
  @Property(true)
  public accessor showFirstLastIcon!: InputSignal<boolean>;
  /**
   * Whether the paginator shows the links to the pages.
   */
  @Property(true)
  public accessor showPageLinks!: InputSignal<boolean>;
  /**
   * Whether the paginator has a dropdown to go to any page.
   */
  @Property(false)
  public accessor showJumpToPageDropdown!: InputSignal<boolean>;
  /**
   * Whether the paginator has a field to go to any page.
   */
  @Property(false)
  public accessor showJumpToPageInput!: InputSignal<boolean>;
  /**
   * The locale the paginator formats the numbers with.
   */
  @Property<InputSignal<string | undefined>>(undefined)
  public accessor paginatorLocale!: InputSignal<string | undefined>;
  /**
   * Whether the rows are sorted by one column or by several ones.
   */
  @Property<InputSignal<'single' | 'multiple'>>('single')
  public accessor sortMode!: InputSignal<'single' | 'multiple'>;
  /**
   * The field the rows are sorted by when `sortMode` is `single`.
   */
  @Property<InputSignal<string | null>>(null)
  public accessor sortField!: InputSignal<string | null>;
  /**
   * `1` ascending, `-1` descending.
   */
  @Property(1)
  public accessor sortOrder!: InputSignal<number>;
  /**
   * The fields and orders the rows are sorted by when `sortMode` is `multiple`.
   */
  @Property<InputSignal<XdGridSortMeta[] | null>>(null)
  public accessor multiSortMeta!: InputSignal<XdGridSortMeta[] | null>;
  /**
   * Order given to a column sorted for the first time.
   */
  @Property(1)
  public accessor defaultSortOrder!: InputSignal<number>;
  /**
   * Whether sorting goes back to the first page.
   */
  @Property(true)
  public accessor resetPageOnSort!: InputSignal<boolean>;
  /**
   * The grid does not sort: it dispatches `sortChange` and the application gives a sorted `value`.
   */
  @Property(false)
  public accessor customSort!: InputSignal<boolean>;
  /**
   * How many rows can be selected: one, several or none.
   */
  @Property<InputSignal<'single' | 'multiple' | null>>(null)
  public accessor selectionMode!: InputSignal<'single' | 'multiple' | null>;
  /**
   * The selected row (`single`) or rows (`multiple`).
   */
  @Property<InputSignal<unknown>>(null)
  public accessor selection!: InputSignal<unknown>;
  /**
   * The header checkbox selects only the rows of the current page.
   */
  @Property(false)
  public accessor selectionPageOnly!: InputSignal<boolean>;
  /**
   * A click replaces the selection; with the Ctrl / Meta key it adds to it.
   */
  @Property(false)
  public accessor metaKeySelection!: InputSignal<boolean>;
  /**
   * How a row is found in the selection: by reference (`equals`) or by its content (`deepEquals`).
   */
  @Property<InputSignal<'equals' | 'deepEquals'>>('deepEquals')
  public accessor compareSelectionBy!: InputSignal<'equals' | 'deepEquals'>;
  /**
   * Tells whether a row can be selected: it gets the data of the row and its position in `value`.
   */
  @Property<InputSignal<((row: { data: unknown; index: number }) => boolean) | undefined>>(undefined)
  public accessor rowSelectable!: InputSignal<((row: { data: unknown; index: number }) => boolean) | undefined>;
  /**
   * The filters applied to the rows by field; the key `global` holds the global filter.
   */
  @Property<InputSignal<XdGridFilters>>({})
  public accessor filters!: InputSignal<XdGridFilters>;
  /**
   * The fields the global filter looks into; by default every column.
   */
  @Property<InputSignal<string[] | undefined>>(undefined)
  public accessor globalFilterFields!: InputSignal<string[] | undefined>;
  /**
   * The milliseconds without a new filter change to wait before the rows are filtered.
   */
  @Property(300)
  public accessor filterDelay!: InputSignal<number>;
  /**
   * The locale texts are compared with when sorting and filtering.
   */
  @Property<InputSignal<string | undefined>>(undefined)
  public accessor filterLocale!: InputSignal<string | undefined>;
  /**
   * Whether the application loads the rows, listening to `lazyLoad`, instead of the grid sorting, filtering and paginating `value`.
   */
  @Property(false)
  public accessor lazy!: InputSignal<boolean>;
  /**
   * Whether `lazyLoad` is dispatched when the grid starts.
   */
  @Property(true)
  public accessor lazyLoadOnInit!: InputSignal<boolean>;
  /**
   * The expanded rows: the values of `dataKey` mapped to `true`.
   */
  @Property<InputSignal<Record<string, boolean>>>({})
  public accessor expandedRowKeys!: InputSignal<Record<string, boolean>>;
  /**
   * Whether several rows can be expanded at the same time.
   */
  @Property<InputSignal<'single' | 'multiple'>>('multiple')
  public accessor rowExpandMode!: InputSignal<'single' | 'multiple'>;
  /**
   * Whether the table scrolls inside the height of `scrollHeight`, with a sticky header.
   */
  @Property(false)
  public accessor scrollable!: InputSignal<boolean>;
  /**
   * Height of the scroll viewport as a CSS length, or `flex` to fill the height of the grid.
   */
  @Property<Aliased<InputSignal<string | undefined>, 'scrollHeight'>>(undefined, { alias: 'scrollHeight' })
  public accessor viewportHeight!: Aliased<InputSignal<string | undefined>, 'scrollHeight'>;
  /**
   * Whether only the rows in view are rendered.
   */
  @Property(false)
  public accessor virtualScroll!: InputSignal<boolean>;
  /**
   * Height in pixels of a row: virtual scrolling needs rows of the same height.
   */
  @Property(40)
  public accessor virtualScrollItemSize!: InputSignal<number>;
  /**
   * The milliseconds a scroll is throttled by in a lazy grid with virtual scrolling.
   */
  @Property(250)
  public accessor virtualScrollDelay!: InputSignal<number>;
  /**
   * Whether the columns can be resized by dragging the edge of their header.
   */
  @Property(false)
  public accessor resizableColumns!: InputSignal<boolean>;
  /**
   * Whether resizing a column takes the width from the next one (`fit`) or changes the width of the table (`expand`).
   */
  @Property<InputSignal<'fit' | 'expand'>>('fit')
  public accessor columnResizeMode!: InputSignal<'fit' | 'expand'>;
  /**
   * Whether the columns can be moved by dragging their header.
   */
  @Property(false)
  public accessor reorderableColumns!: InputSignal<boolean>;
  /**
   * Whether the grid is waiting for its rows: it shows the loader over them.
   */
  @Property(false)
  public accessor loading!: InputSignal<boolean>;
  /**
   * Whether the loader is shown while `loading`.
   */
  @Property(true)
  public accessor showLoader!: InputSignal<boolean>;
  /**
   * Whether a row is highlighted under the pointer.
   */
  @Property(false)
  public accessor rowHover!: InputSignal<boolean>;
  /**
   * The size of the cells.
   */
  @Property<InputSignal<'small' | 'large' | undefined>>(undefined)
  public accessor size!: InputSignal<'small' | 'large' | undefined>;
  /**
   * Whether the cells have borders on every side.
   */
  @Property(false)
  public accessor showGridlines!: InputSignal<boolean>;
  /**
   * Whether the odd rows have another background.
   */
  @Property(false)
  public accessor stripedRows!: InputSignal<boolean>;
  /**
   * A class added to the table.
   */
  @Property('')
  public accessor tableStyleClass!: InputSignal<string>;
  /**
   * The character separating the values of a CSV export.
   */
  @Property(',')
  public accessor csvSeparator!: InputSignal<string>;
  /**
   * The name of the exported CSV file, without extension.
   */
  @Property('download')
  public accessor exportFilename!: InputSignal<string>;
  /**
   * Dispatched when the user goes to another page or changes the page size.
   */
  @Event()
  public accessor pageChange!: Output<XdGridPageEvent>;
  /**
   * Dispatched when the position of the first row of the page changes.
   */
  @Event()
  public accessor firstChange!: Output<number>;
  /**
   * Dispatched when the page size changes.
   */
  @Event()
  public accessor rowsChange!: Output<number>;
  /**
   * The sort changed: the detail lists the sorted fields (one with `single` sorting).
   */
  @Event()
  public accessor sortChange!: Output<XdGridSortMeta[]>;
  /**
   * Dispatched when the filters change, with the rows that pass them.
   */
  @Event()
  public accessor filtersChange!: Output<XdGridFilterEvent>;
  /**
   * Dispatched when the selection changes, with the selected row or rows.
   */
  @Event()
  public accessor selectionChange!: Output<unknown>;
  /**
   * Dispatched when a row is selected.
   */
  @Event()
  public accessor rowSelect!: Output<XdGridRowEvent>;
  /**
   * Dispatched when a row is no longer selected.
   */
  @Event()
  public accessor rowUnselect!: Output<XdGridRowEvent>;
  /**
   * Dispatched when the header checkbox selects or clears the rows.
   */
  @Event()
  public accessor selectAllChange!: Output<XdGridSelectAllEvent>;
  /**
   * Dispatched when a row is expanded.
   */
  @Event()
  public accessor rowExpand!: Output<XdGridRowExpandEvent>;
  /**
   * Dispatched when a row is collapsed.
   */
  @Event()
  public accessor rowCollapse!: Output<XdGridRowExpandEvent>;
  /**
   * Dispatched when the set of expanded rows changes.
   */
  @Event()
  public accessor expandedRowKeysChange!: Output<Record<string, boolean>>;
  /**
   * Dispatched when a lazy grid needs other rows: the detail holds the page, the sort and the filters to load.
   */
  @Event()
  public accessor lazyLoad!: Output<XdGridLazyLoadEvent>;
  /**
   * Dispatched when a column has been resized.
   */
  @Event()
  public accessor columnResize!: Output<XdGridColResizeEvent>;
  /**
   * Dispatched when a column has been moved.
   */
  @Event()
  public accessor columnReorder!: Output<XdGridColReorderEvent>;
  /**
   * The element holding the table, which scrolls when the grid is `scrollable`.
   */
  @Query.ref('wrapper')
  public accessor wrapper!: QuerySignal<HTMLElement | null>;
  /**
   * The virtual scroller, when `virtualScroll` is on.
   */
  @Query.ref('scroller')
  public accessor scroller!: QuerySignal<XdScrollerComponent | null>;
  /**
   * The cells of the header row, in the order of the columns.
   */
  @Query.all('thead th.xd-grid-header-cell')
  public accessor headerCells!: QuerySignal<HTMLTableCellElement[]>;
  /**
   * The text fields of the column filters.
   */
  @Query.all('input.xd-grid-filter-input')
  public accessor filterInputs!: QuerySignal<HTMLInputElement[]>;
  /**
   * The element given to the `caption` slot.
   */
  @Query.content('[slots="caption"]')
  public accessor captionContent!: QuerySignal<HTMLElement | null>;
  /**
   * The element given to the `summary` slot.
   */
  @Query.content('[slots="summary"]')
  public accessor summaryContent!: QuerySignal<HTMLElement | null>;
  /**
   * The first row of the current page.
   */
  public readonly currentFirst: Signal<number> = signal(0);
  /**
   * The number of rows of a page.
   */
  public readonly currentRows: Signal<number> = signal(10);
  /**
   * The columns, in the order they are shown.
   */
  public readonly displayColumns: Signal<XdGridDisplayColumn[]> = signal([]);
  /**
   * Window of rows rendered by the virtual scroller.
   */
  public readonly virtualRange: Signal<XdScrollerRange> = signal({ first: 0, last: 20 });

  /**
   * Every row of `value`, with its position and its key.
   */
  public readonly allRows: Computed<XdGridRow[]> = computed(() => this._computeAllRows());
  /**
   * The rows after sorting.
   */
  public readonly sortedRows: Computed<XdGridRow[]> = computed(() => this._computeSortedRows());
  /**
   * The rows sorted and filtered, all pages included.
   */
  public readonly processedRows: Computed<XdGridRow[]> = computed(() => this._computeProcessedRows());
  /**
   * The number of rows paginated.
   */
  public readonly totalCount: Computed<number> = computed(() => this._computeTotalCount());
  /**
   * The rows of the current page.
   */
  public readonly pageRows: Computed<XdGridRow[]> = computed(() => this._computePageRows());
  /**
   * The rows in the table: the current page, or the window of the virtual scroller.
   */
  public readonly renderedRows: Computed<XdGridRow[]> = computed(() => this._computeRenderedRows());
  /**
   * Whether the `caption` slot has content.
   */
  public readonly hasCaption: Computed<boolean> = computed(() => this._computeHasCaption());
  /**
   * Whether the `summary` slot has content.
   */
  public readonly hasSummary: Computed<boolean> = computed(() => this._computeHasSummary());
  /**
   * Whether a column has a filter, so that the header shows the row of the filters.
   */
  public readonly hasColumnFilters: Computed<boolean> = computed(() => this._computeHasColumnFilters());
  /**
   * Whether a column has a footer, so that the table shows the footer row.
   */
  public readonly hasFooter: Computed<boolean> = computed(() => this._computeHasFooter());
  /**
   * Whether the paginator is shown above the table.
   */
  public readonly paginatorTop: Computed<boolean> = computed(() => this._computePaginatorTop());
  /**
   * Whether the paginator is shown below the table.
   */
  public readonly paginatorBottom: Computed<boolean> = computed(() => this._computePaginatorBottom());
  /**
   * Whether every selectable row is selected: the state of the header checkbox.
   */
  public readonly headerChecked: Computed<boolean> = computed(() => this._computeHeaderChecked());
  /**
   * Whether only some of the rows are selected.
   */
  public readonly headerIndeterminate: Computed<boolean> = computed(() => this._computeHeaderIndeterminate());
  /**
   * The style of the guide line shown while a column is resized.
   */
  public readonly resizeIndicatorStyle: Computed<string> = computed(() => this._computeResizeIndicatorStyle());

  private readonly _sortFieldState: Signal<string | null> = signal(null);
  private readonly _sortOrderState: Signal<number> = signal(1);
  private readonly _multiSortMetaState: Signal<XdGridSortMeta[] | null> = signal(null);
  private readonly _selectionState: Signal<unknown> = signal(null);
  private readonly _filtersState: Signal<XdGridFilters> = signal({});
  private readonly _expandedKeysState: Signal<Record<string, boolean>> = signal({});
  private readonly _widths: Signal<Record<string, number>> = signal({});
  private readonly _resizeGuide: Signal<number | null> = signal(null);
  private readonly _selectionKeys: Computed<Set<string> | null> = computed(() => this._computeSelectionKeys());
  /**
   * The smallest width a column can be resized to, in pixels.
   */
  private readonly _minColumnWidth = 15;
  private _filterTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * The filters waiting for `filterDelay` to apply: they hold every change made meanwhile.
   */
  private _pendingFilters: XdGridFilters | null = null;
  private _anchorIndex: number | null = null;
  private _rangeIndex: number | null = null;
  private _initialized = false;

  /**
   * Copies the inputs into the state the grid changes itself, and asks for the first rows of a lazy grid.
   */
  public onInit(): void {
    this.effect(() => {
      this.currentFirst.set(this.first());
    });
    this.effect(() => {
      this.currentRows.set(this.rows());
    });
    this.effect(() => {
      this._sortFieldState.set(this.sortField());
    });
    this.effect(() => {
      this._sortOrderState.set(this.sortOrder());
    });
    this.effect(() => {
      this._multiSortMetaState.set(this.multiSortMeta());
    });
    this.effect(() => {
      this._selectionState.set(this.selection());
    });
    this.effect(() => {
      this._filtersState.set(this.filters());
    });
    this.effect(() => {
      this._expandedKeysState.set(this.expandedRowKeys());
    });
    this.effect(() => {
      this._applyColumns(this.columns());
    });

    if (!this._initialized && this.lazy() && this.lazyLoadOnInit() && !this.virtualScroll()) {
      this.lazyLoad.emit(this._createLazyLoadEvent());
    }
    this._initialized = true;
  }

  /**
   * Keeps the text fields of the filters in step with the filters applied.
   */
  public afterRender(): void {
    this.effect(() => {
      this._syncFilterInputs(this.filterInputs(), this._filtersState());
    });
  }

  /**
   * Whether several rows can be selected.
   */
  public isMultiple(): boolean {
    return this.selectionMode() === 'multiple';
  }

  /**
   * Whether rows can be selected.
   */
  public isSelectable(): boolean {
    return this.selectionMode() !== null;
  }

  /**
   * Whether a click on the header of the column sorts the grid.
   */
  public isSortable(column: XdGridColumn): boolean {
    return column.sortable === true && !!column.field && !column.type;
  }

  /**
   * Whether the column can be resized.
   */
  public isResizable(column: XdGridColumn): boolean {
    return this.resizableColumns() && column.resizable !== false && !column.type;
  }

  /**
   * Whether the column can be moved.
   */
  public isReorderable(column: XdGridColumn): boolean {
    return this.reorderableColumns() && column.reorderable !== false && !column.type;
  }

  /**
   * Whether the column shows the values of a field, not a selection or an expansion control.
   */
  public isDataColumn(column: XdGridColumn): boolean {
    return !column.type;
  }

  /**
   * The text of the header cell of a column.
   */
  public headerText(column: XdGridColumn): string {
    return column.header ?? column.field;
  }

  /**
   * The text of the footer cell of a column.
   */
  public footerText(column: XdGridColumn): string {
    return column.footer ?? '';
  }

  /**
   * The text of a body cell: the value of the field of the row, formatted by the column.
   */
  public cellText(row: XdGridRow, column: XdGridColumn): string {
    if (row.data === null || row.data === undefined) {
      return '';
    }

    const value = resolveFieldData(row.data, column.field);
    if (column.formatter) {
      return column.formatter(value, row.data);
    }

    return value === null || value === undefined ? '' : String(value);
  }

  /**
   * The name of the slot a body cell can be given content through.
   */
  public cellSlot(row: XdGridRow, column: XdGridColumn): string {
    return `cell-${column.field}-${row.key}`;
  }

  /**
   * The classes of the root element, from the inputs changing the look of the grid.
   */
  public rootClass(): string {
    const classes = ['xd-grid'];
    const height = this.viewportHeight();
    if (this.scrollable() || this.virtualScroll()) {
      classes.push(height === 'flex' ? 'xd-grid-flex-scrollable' : 'xd-grid-scrollable');
    }
    if (this.showGridlines()) {
      classes.push('xd-grid-gridlines');
    }
    if (this.stripedRows()) {
      classes.push('xd-grid-striped');
    }
    if (this.rowHover() || this.isSelectable()) {
      classes.push('xd-grid-hoverable');
    }
    if (this.size()) {
      classes.push(`xd-grid-${this.size()}`);
    }

    return classes.join(' ');
  }

  /**
   * The style of the element holding the table.
   */
  public containerStyle(): string | null {
    const height = this.viewportHeight();

    return this.scrollable() && !this.virtualScroll() && height && height !== 'flex' ? `max-height: ${height}` : null;
  }

  /**
   * The style of the table: its layout and, when the columns expand it, its width.
   */
  public tableStyle(): string | null {
    if (this.resizableColumns() && this.columnResizeMode() === 'expand') {
      const widths = this._widths();
      const columns = this.displayColumns();
      let total = 0;
      for (let i = 0; i < columns.length; i++) {
        const width = widths[(columns[i] as XdGridDisplayColumn).key];
        if (width === undefined) {
          return null;
        }
        total += width;
      }

      return `table-layout: fixed; width: ${total}px`;
    }

    return this.resizableColumns() ? 'table-layout: fixed' : null;
  }

  /**
   * The width of a column in the `colgroup`.
   */
  public columnStyle(column: XdGridDisplayColumn): string | null {
    const width = this._widths()[column.key];
    const styles: string[] = [];
    if (width !== undefined) {
      styles.push(`width: ${width}px`);
    } else if (column.width) {
      styles.push(`width: ${column.width}`);
    }
    if (column.minWidth) {
      styles.push(`min-width: ${column.minWidth}`);
    }

    return styles.length ? styles.join('; ') : null;
  }

  /**
   * The classes of the header cell of a column.
   */
  public headerClass(column: XdGridColumn): string {
    const classes = ['xd-grid-header-cell'];
    if (column.styleClass) {
      classes.push(column.styleClass);
    }
    if (column.align) {
      classes.push(`xd-grid-align-${column.align}`);
    }
    if (this.isSortable(column)) {
      classes.push('xd-grid-sortable-column');
      if (this.sortState(column.field) !== 0) {
        classes.push('xd-grid-column-sorted');
      }
    }
    if (this.isReorderable(column)) {
      classes.push('xd-grid-reorderable-column');
    }
    if (this.isResizable(column)) {
      classes.push('xd-grid-resizable-column');
    }

    return classes.join(' ');
  }

  /**
   * The classes of the body cells of a column.
   */
  public cellClass(column: XdGridColumn): string {
    const classes = ['xd-grid-cell'];
    if (column.styleClass) {
      classes.push(column.styleClass);
    }
    if (column.align) {
      classes.push(`xd-grid-align-${column.align}`);
    }
    if (column.type) {
      classes.push(`xd-grid-cell-${column.type}`);
    }

    return classes.join(' ');
  }

  /**
   * The classes of a row; `position` is its position among the rows shown.
   */
  public rowClass(row: XdGridRow, position: number): string {
    const classes = ['xd-grid-row'];
    if (position % 2 === 1) {
      classes.push('xd-grid-row-odd');
    }
    if (this.isSelectable() && this.isSelected(row.data)) {
      classes.push('xd-grid-row-selected');
    }
    if (this.isSelectable() && this._isRowSelectable(row.data, row.index)) {
      classes.push('xd-grid-selectable-row');
    }
    if (row.data === null || row.data === undefined) {
      classes.push('xd-grid-row-placeholder');
    }

    return classes.join(' ');
  }

  /**
   * The style of a row: a fixed height with virtual scrolling.
   */
  public rowStyle(): string | null {
    return this.virtualScroll() ? `height: ${this.virtualScrollItemSize()}px` : null;
  }

  /**
   * Position in the processed rows of the first row of the table.
   */
  public rowOffset(): number {
    if (this.virtualScroll()) {
      return this.virtualRange().first;
    }

    return this.paginator() && !this.lazy() ? this.currentFirst() : 0;
  }

  /**
   * Whether `rowSelectable` accepts the row.
   */
  public isRowSelectable(row: XdGridRow): boolean {
    return this._isRowSelectable(row.data, row.index);
  }

  /**
   * The `aria-sort` value of the header cell of a column.
   */
  public sortAriaValue(column: XdGridColumn): string {
    switch (this.sortState(column.field)) {
      case 1:
        return 'ascending';
      case -1:
        return 'descending';
      default:
        return 'none';
    }
  }

  /**
   * The name of the icon showing how a column is sorted.
   */
  public sortIcon(column: XdGridColumn): string {
    switch (this.sortState(column.field)) {
      case 1:
        return 'sort-amount-up-alt';
      case -1:
        return 'sort-amount-down';
      default:
        return 'sort-alt';
    }
  }

  /**
   * The position of a column in a multiple sort, shown when several columns are sorted.
   */
  public sortBadge(column: XdGridColumn): string {
    const meta = this._multiSortMetaState();
    if (this.sortMode() !== 'multiple' || !meta || meta.length < 2) {
      return '';
    }
    for (let i = 0; i < meta.length; i++) {
      if ((meta[i] as XdGridSortMeta).field === column.field) {
        return String(i + 1);
      }
    }

    return '';
  }

  /**
   * `1` ascending, `-1` descending, `0` when the field does not sort the grid.
   */
  public sortState(field: string): number {
    if (this.sortMode() === 'single') {
      return this._sortFieldState() === field ? this._sortOrderState() : 0;
    }

    const meta = this._multiSortMetaState();
    if (meta?.length) {
      for (let i = 0; i < meta.length; i++) {
        if ((meta[i] as XdGridSortMeta).field === field) {
          return (meta[i] as XdGridSortMeta).order;
        }
      }
    }

    return 0;
  }

  /**
   * The value of the filter of a column, `null` without one.
   */
  public filterValue(column: XdGridColumn): unknown {
    return this._filtersState()[column.field]?.value ?? null;
  }

  /**
   * The value of the filter of a column as the text of its field.
   */
  public filterText(column: XdGridColumn): string {
    const value = this.filterValue(column);

    return value === null ? '' : String(value);
  }

  /**
   * The placeholder of the field of the filter of a column.
   */
  public filterPlaceholder(column: XdGridColumn): string {
    return column.filterPlaceholder ?? `Search by ${this.headerText(column).toLowerCase()}`;
  }

  /**
   * Whether the row with this data is expanded.
   */
  public isExpanded(data: unknown): boolean {
    const key = this._expansionKey(data);

    return key !== null && this._expandedKeysState()[key] === true;
  }

  /**
   * The name of the icon of the expansion button of a row.
   */
  public expanderIcon(data: unknown): string {
    return this.isExpanded(data) ? 'chevron-down' : 'chevron-right';
  }

  /**
   * Whether the row with this data is selected.
   */
  public isSelected(data: unknown): boolean {
    const selection = this._selectionState();
    if (data === null || data === undefined || selection === null || selection === undefined) {
      return false;
    }

    const keys = this._selectionKeys();
    if (keys?.size) {
      return keys.has(String(resolveFieldData(data, this.dataKey())));
    }

    return Array.isArray(selection) ? this._indexInSelection(data) > -1 : this._equals(data, selection);
  }

  // --- Public API

  /**
   * Filters every column with the same value; `matchMode` defaults to `contains`.
   */
  public filterGlobal(value: unknown, matchMode: XdGridFilterMatchMode = 'contains'): void {
    this.filter(value, 'global', matchMode);
  }

  /**
   * Filters one field. The filter applies after `filterDelay` milliseconds without another call.
   */
  public filter(value: unknown, field: string, matchMode: XdGridFilterMatchMode): void {
    if (this._filterTimer !== null) {
      clearTimeout(this._filterTimer);
    }

    // A change made before the delay of another one elapsed keeps it
    const next: XdGridFilters = Object.assign({}, this._pendingFilters ?? this._filtersState());
    if (isEmptyValue(value) || (typeof value === 'string' && value.trim() === '')) {
      delete next[field];
    } else {
      next[field] = { value, matchMode };
    }
    this._pendingFilters = next;
    this._anchorIndex = null;
    this._filterTimer = setTimeout(() => {
      this._filterTimer = null;
      this._pendingFilters = null;
      this._applyFilters(next);
    }, this.filterDelay());
  }

  /**
   * Clears the sort, the filters and goes back to the first page.
   */
  public clear(): void {
    this._cancelPendingFilters();
    this._sortFieldState.set(null);
    this._sortOrderState.set(this.defaultSortOrder());
    this._multiSortMetaState.set(null);
    this._filtersState.set({});
    this._setFirst(0);
    if (this.lazy()) {
      this.lazyLoad.emit(this._createLazyLoadEvent());
    }
  }

  /**
   * Same as `clear`.
   */
  public reset(): void {
    this.clear();
  }

  /**
   * Scrolls the table back to its first row.
   */
  public resetScrollTop(): void {
    this.virtualScroll() ? this.scroller()?.scrollToTop() : this.wrapper()?.scrollTo({ top: 0 });
  }

  /**
   * Scrolls the virtual scroller to a row. It needs `virtualScroll`.
   */
  public scrollToIndex(index: number): void {
    this.scroller()?.scrollToIndex(index);
  }

  /**
   * Downloads the rows as a CSV file.
   */
  public exportCSV(options?: XdGridExportOptions): void {
    const csv = this._buildCSV(options);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL(blob);
    link.download = `${this.exportFilename()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoked later: some browsers cancel a download whose URL is revoked at once
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 1000);
  }

  // --- Listeners of the template

  /**
   * Follows the paginator: shows the page and dispatches the page events.
   */
  public onPageChange(event: CustomEvent<PaginatorState>): void {
    const { first, rows } = event.detail;
    this.currentFirst.set(first);
    this.currentRows.set(rows);
    this.pageChange.emit({ first, rows });
    this.firstChange.emit(first);
    this.rowsChange.emit(rows);
    if (this.lazy()) {
      this.lazyLoad.emit(this._createLazyLoadEvent());
    }
    this._anchorIndex = null;
    if (this.scrollable()) {
      this.resetScrollTop();
    }
  }

  /**
   * Sorts the grid by the field of the header cell clicked.
   */
  public onSort(event: CustomEvent<XdGridColumnSortEvent>): void {
    const { field, originalEvent } = event.detail;
    if (this.sortMode() === 'single') {
      this._sortSingle(field);
    } else {
      this._sortMultiple(field, originalEvent as MouseEvent | KeyboardEvent);
    }
    this._anchorIndex = null;
  }

  /**
   * Filters a column by the text typed in its field.
   */
  public onFilterInput(column: XdGridColumn, input: HTMLInputElement): void {
    this.filter(input.value, column.field, column.filterMatchMode ?? 'startsWith');
  }

  /**
   * Filters a column by the value of its numeric field.
   */
  public onFilterValue(column: XdGridColumn, value: unknown): void {
    this.filter(value, column.field, column.filterMatchMode ?? 'equals');
  }

  /**
   * A boolean filter goes round: any, true, false.
   */
  public onFilterBoolean(column: XdGridColumn): void {
    const value = this.filterValue(column);
    this.filter(value === null ? true : value === true ? false : null, column.field, column.filterMatchMode ?? 'equals');
  }

  /**
   * Selects or clears a row from a click on it: `Shift` selects a range, `Ctrl` / `Meta` adds to the selection.
   */
  public onRowClick(row: XdGridRow, event: CustomEvent<XdGridRowClickEvent>): void {
    const mode = this.selectionMode();
    if (!mode) {
      return;
    }

    const { originalEvent, index, touched } = event.detail;
    const pointer = originalEvent as MouseEvent;
    if (mode === 'multiple' && pointer.shiftKey && this._anchorIndex !== null) {
      this._selectRange(originalEvent, index);

      return;
    }

    const selected = this.isSelected(row.data);
    if (!selected && !this._isRowSelectable(row.data, row.index)) {
      return;
    }

    this._anchorIndex = index;
    this._rangeIndex = index;
    const metaKey = pointer.metaKey || pointer.ctrlKey;
    const replacing = selected && (touched || !this.metaKeySelection() || metaKey);
    if (replacing) {
      this._unselect(row.data, originalEvent, index, 'row');
    } else {
      // With meta-key selection a plain click replaces the selection, the Ctrl / Meta key adds to it
      const append = mode === 'multiple' && (touched || !this.metaKeySelection() || metaKey);
      this._select(row.data, originalEvent, index, 'row', append);
    }
  }

  /**
   * Selects or clears a row from its checkbox; `position` is the position of the row in the table.
   */
  public onRowCheckbox(row: XdGridRow, position: number, event: Event): void {
    const index = position + this.rowOffset();
    if (this.isSelected(row.data)) {
      this._unselect(row.data, event, index, 'checkbox');
    } else if (this._isRowSelectable(row.data, row.index)) {
      this._select(row.data, event, index, 'checkbox', true);
    }
  }

  /**
   * Selects a row, or clears it, from its radio button; `position` is the position of the row in the table.
   */
  public onRowRadio(row: XdGridRow, position: number, event: Event): void {
    const index = position + this.rowOffset();
    if (this.isSelected(row.data)) {
      this._unselect(row.data, event, index, 'radio');
    } else if (this._isRowSelectable(row.data, row.index)) {
      this._select(row.data, event, index, 'radio', false);
    }
  }

  /**
   * Selects every selectable row, or clears them, from the header checkbox.
   */
  public onHeaderCheckboxChange(checked: boolean, event: Event): void {
    const rows = this.selectionPageOnly() ? this.pageRows() : this.processedRows();
    const current = this._selectionList();
    const kept: unknown[] = [];
    if (this.selectionPageOnly() && current?.length) {
      for (let i = 0; i < current.length; i++) {
        if (!this._rowsInclude(rows, current[i])) {
          kept.push(current[i]);
        }
      }
    }

    if (checked) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as XdGridRow;
        if (row.data !== null && row.data !== undefined && this._isRowSelectable(row.data, row.index)) {
          kept.push(row.data);
        }
      }
    }
    this._setSelection(kept);
    this.selectAllChange.emit({ originalEvent: event, checked });
  }

  /**
   * Expands the row with this data, or collapses it. It needs `dataKey`.
   */
  public toggleRow(data: unknown, event?: Event): void {
    const key = this._expansionKey(data);
    if (key === null) {
      throw new Error('xd-grid: dataKey must be defined to use row expansion');
    }

    let expanded = this._expandedKeysState();
    if (expanded[key]) {
      expanded = Object.assign({}, expanded);
      delete expanded[key];
      this.rowCollapse.emit({ originalEvent: event, data });
    } else {
      expanded = this.rowExpandMode() === 'single' ? { [key]: true } : Object.assign({}, expanded, { [key]: true });
      this.rowExpand.emit({ originalEvent: event, data });
    }
    this._expandedKeysState.set(expanded);
    this.expandedRowKeysChange.emit(expanded);
  }

  /**
   * Stores the window of rows the virtual scroller asks to render.
   */
  public onRangeChange(event: CustomEvent<XdScrollerRange>): void {
    this.virtualRange.set(event.detail);
  }

  /**
   * Asks for the rows of the window the virtual scroller shows in a lazy grid.
   */
  public onVirtualLazyLoad(event: CustomEvent<XdScrollerRange>): void {
    if (this.lazy()) {
      const lazyEvent = this._createLazyLoadEvent();
      lazyEvent.first = event.detail.first;
      lazyEvent.rows = event.detail.last - event.detail.first;
      this.lazyLoad.emit(lazyEvent);
    }
  }

  /**
   * Fixes the width of the columns and shows the guide line when a resize starts.
   */
  public onResizeBegin(event: CustomEvent<XdGridResizeEvent>): void {
    this._freezeWidths();
    this._resizeGuide.set(event.detail.clientX);
  }

  /**
   * Moves the guide line while a column is resized.
   */
  public onResizing(event: CustomEvent<XdGridResizeEvent>): void {
    this._resizeGuide.set(event.detail.clientX);
  }

  /**
   * Applies the new width of the column at `columnIndex` when its resize ends.
   */
  public onResizeEnd(event: CustomEvent<XdGridResizeEvent>, columnIndex: number): void {
    this._resizeGuide.set(null);
    const { delta, width } = event.detail;
    const columns = this.displayColumns();
    const column = columns[columnIndex];
    if (!column || delta === 0) {
      return;
    }

    const minimum = this._minWidth(column);
    const newWidth = width + delta;
    if (newWidth < minimum) {
      return;
    }

    const widths = Object.assign({}, this._widths());
    if (this.columnResizeMode() === 'fit') {
      const next = columns[columnIndex + 1];
      if (!next) {
        return;
      }
      const nextWidth = (widths[next.key] ?? 0) - delta;
      if (nextWidth < this._minWidth(next)) {
        return;
      }
      widths[next.key] = nextWidth;
    }
    widths[column.key] = newWidth;
    this._widths.set(widths);
    this.columnResize.emit({ column, delta });
  }

  /**
   * Moves a column to the position it was dropped on.
   */
  public onColumnDrop(event: CustomEvent<XdGridColumnDropEvent>): void {
    const { dragIndex, dropIndex } = event.detail;
    const columns = this.displayColumns().slice();
    const [moved] = columns.splice(dragIndex, 1);
    if (!moved) {
      return;
    }

    columns.splice(dropIndex, 0, moved);
    this.displayColumns.set(columns);
    this.columnReorder.emit({ dragIndex, dropIndex, columns });
  }

  // --- Computed

  private _computeHasCaption(): boolean {
    return this.captionContent() !== null;
  }

  private _computeHasSummary(): boolean {
    return this.summaryContent() !== null;
  }

  private _computePaginatorTop(): boolean {
    return this.paginator() && this.paginatorPosition() !== 'bottom';
  }

  private _computePaginatorBottom(): boolean {
    return this.paginator() && this.paginatorPosition() !== 'top';
  }

  private _computeAllRows(): XdGridRow[] {
    const dataKey = this.dataKey();
    const value = this.value();
    const rows: XdGridRow[] = [];
    for (let index = 0; index < value.length; index++) {
      const data = value[index];
      const key = dataKey && data !== null && data !== undefined ? String(resolveFieldData(data, dataKey)) : String(index);
      rows.push({ data, index, key });
    }

    return rows;
  }

  private _computeSortedRows(): XdGridRow[] {
    const rows = this.allRows();
    if (this.lazy() || this.customSort()) {
      return rows;
    }

    const metas = this._activeSortMeta();
    if (!metas) {
      return rows;
    }

    const locale = this.filterLocale();

    return rows.slice().sort((first, second) => {
      for (let i = 0; i < metas.length; i++) {
        const meta = metas[i] as XdGridSortMeta;
        const result = compareValues(resolveFieldData(first.data, meta.field), resolveFieldData(second.data, meta.field), meta.order, locale);
        if (result !== 0) {
          return result;
        }
      }

      return 0;
    });
  }

  private _computeProcessedRows(): XdGridRow[] {
    const rows = this.sortedRows();
    const filters = this._filtersState();
    const fields = Object.keys(filters);
    if (this.lazy() || fields.length === 0) {
      return rows;
    }

    const globalFilter = filters['global'];
    const globalFields = this._globalFields();
    const locale = this.filterLocale();
    const result: XdGridRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as XdGridRow;
      if (this._matchesColumnFilters(row, filters, fields, locale) && (!globalFilter || this._matchesGlobalFilter(row, globalFilter.value, globalFilter.matchMode, globalFields, locale))) {
        result.push(row);
      }
    }

    return result;
  }

  private _computeTotalCount(): number {
    return this.lazy() ? this.totalRecords() : this.processedRows().length;
  }

  private _computePageRows(): XdGridRow[] {
    const rows = this.processedRows();
    if (!this.paginator()) {
      return rows;
    }

    const first = this.lazy() ? 0 : this.currentFirst();

    return rows.slice(first, first + this.currentRows());
  }

  private _computeRenderedRows(): XdGridRow[] {
    if (!this.virtualScroll()) {
      return this.pageRows();
    }

    const range = this.virtualRange();

    return this.processedRows().slice(range.first, range.last);
  }

  private _computeHasColumnFilters(): boolean {
    const columns = this.displayColumns();
    for (let i = 0; i < columns.length; i++) {
      if ((columns[i] as XdGridColumn).filter) {
        return true;
      }
    }

    return false;
  }

  private _computeHasFooter(): boolean {
    const columns = this.displayColumns();
    for (let i = 0; i < columns.length; i++) {
      if ((columns[i] as XdGridColumn).footer !== undefined) {
        return true;
      }
    }

    return false;
  }

  private _computeHeaderChecked(): boolean {
    const rows = this.selectionPageOnly() ? this.pageRows() : this.processedRows();
    let selectable = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as XdGridRow;
      if (row.data !== null && row.data !== undefined && this._isRowSelectable(row.data, i)) {
        selectable++;
        if (!this.isSelected(row.data)) {
          return false;
        }
      }
    }

    return selectable > 0;
  }

  private _computeHeaderIndeterminate(): boolean {
    const selection = this._selectionList();

    return !!selection && selection.length > 0 && !this.headerChecked();
  }

  private _computeResizeIndicatorStyle(): string {
    const guide = this._resizeGuide();
    if (guide === null) {
      return 'display: none';
    }

    return `display: block; left: ${guide - this.getBoundingClientRect().left}px; height: ${this.offsetHeight}px`;
  }

  private _computeSelectionKeys(): Set<string> | null {
    const dataKey = this.dataKey();
    const selection = this._selectionState();
    if (!dataKey || selection === null || selection === undefined) {
      return null;
    }

    const keys = new Set<string>();
    if (Array.isArray(selection)) {
      for (let i = 0; i < selection.length; i++) {
        keys.add(String(resolveFieldData(selection[i], dataKey)));
      }
    } else {
      keys.add(String(resolveFieldData(selection, dataKey)));
    }

    return keys;
  }

  // --- Internals

  private _applyColumns(columns: XdGridColumn[]): void {
    const display: XdGridDisplayColumn[] = [];
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i] as XdGridColumn;
      display.push(Object.assign({}, column, { key: column.key ?? column.field ?? column.type ?? String(i) }));
    }
    this.displayColumns.set(display);
    this._widths.set({});
  }

  private _activeSortMeta(): XdGridSortMeta[] | null {
    if (this.sortMode() === 'single') {
      const field = this._sortFieldState();

      return field ? [{ field, order: this._sortOrderState() }] : null;
    }

    const meta = this._multiSortMetaState();

    return meta?.length ? meta : null;
  }

  private _globalFields(): string[] {
    const fields = this.globalFilterFields();
    if (fields) {
      return fields;
    }

    const columns = this.displayColumns();
    const result: string[] = [];
    for (let i = 0; i < columns.length; i++) {
      const field = (columns[i] as XdGridColumn).field;
      if (field) {
        result.push(field);
      }
    }

    return result;
  }

  private _matchesColumnFilters(row: XdGridRow, filters: XdGridFilters, fields: string[], locale: string | undefined): boolean {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i] as string;
      if (field === 'global') {
        continue;
      }

      const meta = filters[field];
      if (meta && !filterConstraints[meta.matchMode](resolveFieldData(row.data, field), meta.value, locale)) {
        return false;
      }
    }

    return true;
  }

  private _matchesGlobalFilter(row: XdGridRow, value: unknown, matchMode: XdGridFilterMatchMode, fields: string[], locale: string | undefined): boolean {
    const constraint = filterConstraints[matchMode];
    for (let i = 0; i < fields.length; i++) {
      if (constraint(resolveFieldData(row.data, fields[i]), value, locale)) {
        return true;
      }
    }

    return false;
  }

  private _applyFilters(filters: XdGridFilters): void {
    this._filtersState.set(filters);
    this._setFirst(0);
    if (this.lazy()) {
      this.lazyLoad.emit(this._createLazyLoadEvent());
    }
    this.filtersChange.emit({ filters, filteredValue: untracked(() => this.processedRows().map(row => row.data)) });
    if (this.scrollable()) {
      this.resetScrollTop();
    }
  }

  private _setFirst(first: number): void {
    if (this.currentFirst() !== first) {
      this.currentFirst.set(first);
      this.firstChange.emit(first);
    }
  }

  private _sortSingle(field: string): void {
    const order = this._sortFieldState() === field ? this._sortOrderState() * -1 : this.defaultSortOrder();
    this._sortFieldState.set(field);
    this._sortOrderState.set(order);
    if (this.resetPageOnSort()) {
      this._setFirst(0);
      if (this.scrollable()) {
        this.resetScrollTop();
      }
    }
    this._afterSort([{ field, order }]);
  }

  private _sortMultiple(field: string, event: MouseEvent | KeyboardEvent): void {
    const metaKey = event.metaKey || event.ctrlKey;
    const current = this._multiSortMetaState();
    let next: XdGridSortMeta[];
    let found: XdGridSortMeta | undefined;
    if (current?.length) {
      for (let i = 0; i < current.length; i++) {
        if ((current[i] as XdGridSortMeta).field === field) {
          found = current[i];
        }
      }
    }

    if (found && metaKey && current?.length) {
      const flipped = found;
      next = current.map(meta => (meta === flipped ? { field, order: meta.order * -1 } : meta));
    } else if (found) {
      next = [{ field, order: found.order * -1 }];
      this._resetPageOnSort();
    } else if (metaKey && current?.length) {
      next = current.concat([{ field, order: this.defaultSortOrder() }]);
    } else {
      next = [{ field, order: this.defaultSortOrder() }];
      this._resetPageOnSort();
    }

    this._multiSortMetaState.set(next);
    this._afterSort(next);
  }

  private _resetPageOnSort(): void {
    if (this.resetPageOnSort()) {
      this._setFirst(0);
      if (this.scrollable()) {
        this.resetScrollTop();
      }
    }
  }

  private _afterSort(meta: XdGridSortMeta[]): void {
    if (this.lazy()) {
      this.lazyLoad.emit(this._createLazyLoadEvent());
    }
    this.sortChange.emit(meta);
  }

  private _createLazyLoadEvent(): XdGridLazyLoadEvent {
    const filters = this._filtersState();

    return {
      first: this.currentFirst(),
      rows: this.currentRows(),
      sortField: this._sortFieldState(),
      sortOrder: this._sortOrderState(),
      multiSortMeta: this._multiSortMetaState(),
      filters,
      globalFilter: filters['global']?.value ?? null
    };
  }

  private _expansionKey(data: unknown): string | null {
    const dataKey = this.dataKey();

    return dataKey && data !== null && data !== undefined ? String(resolveFieldData(data, dataKey)) : null;
  }

  private _isRowSelectable(data: unknown, index: number): boolean {
    const predicate = this.rowSelectable();

    return predicate ? predicate({ data, index }) : true;
  }

  private _equals(first: unknown, second: unknown): boolean {
    return this.compareSelectionBy() === 'equals' ? first === second : equals(first, second, this.dataKey());
  }

  private _selectionList(): unknown[] | undefined {
    const selection = this._selectionState();

    return Array.isArray(selection) ? selection : undefined;
  }

  private _indexInSelection(data: unknown): number {
    const selection = this._selectionList();
    if (selection?.length) {
      return this._indexInSelectionOf(selection, data);
    }

    return -1;
  }

  private _rowsInclude(rows: XdGridRow[], data: unknown): boolean {
    for (let i = 0; i < rows.length; i++) {
      if (this._equals(data, (rows[i] as XdGridRow).data)) {
        return true;
      }
    }

    return false;
  }

  private _setSelection(selection: unknown): void {
    this._selectionState.set(selection);
    this.selectionChange.emit(selection);
  }

  /**
   * Selects a row; `append` keeps the rows already selected (multiple selection).
   */
  private _select(data: unknown, event: Event, index: number, type: XdGridRowEvent['type'], append: boolean): void {
    const current = this._selectionList();
    this._setSelection(this.selectionMode() === 'multiple' ? (append && current?.length ? current.concat([data]) : [data]) : data);
    this.rowSelect.emit({ originalEvent: event, data, index, type });
  }

  private _unselect(data: unknown, event: Event, index: number, type: XdGridRowEvent['type']): void {
    const current = this._selectionList();
    const position = this._indexInSelection(data);
    this._setSelection(current ? current.filter((_item, itemIndex) => itemIndex !== position) : null);
    this.rowUnselect.emit({ originalEvent: event, data, index, type });
  }

  /**
   * Shift selection: replaces the previous range by the rows between the anchor and `index`.
   */
  private _selectRange(event: Event, index: number): void {
    const anchor = this._anchorIndex as number;
    const rows = this.processedRows();
    let selection = this._selectionList();
    if (this._rangeIndex !== null && selection?.length) {
      const previousStart = Math.min(anchor, this._rangeIndex);
      const previousEnd = Math.max(anchor, this._rangeIndex);
      for (let i = previousStart; i <= previousEnd; i++) {
        const row = rows[i];
        if (row) {
          const position = this._indexInSelectionOf(selection, row.data);
          selection = selection.filter((_item, itemIndex) => itemIndex !== position);
        }
      }
    }

    this._rangeIndex = index;
    const selected: unknown[] = [];
    const start = Math.min(anchor, index);
    const end = Math.max(anchor, index);
    for (let i = start; i <= end; i++) {
      const row = rows[i];
      if (row && row.data !== null && row.data !== undefined && this._isRowSelectable(row.data, row.index) && !(selection?.length && this._indexInSelectionOf(selection, row.data) > -1)) {
        selected.push(row.data);
      }
    }

    this._setSelection(selection?.length ? selection.concat(selected) : selected);
    this.rowSelect.emit({ originalEvent: event, data: selected, index, type: 'row' });
  }

  private _indexInSelectionOf(selection: unknown[], data: unknown): number {
    for (let i = 0; i < selection.length; i++) {
      if (this._equals(data, selection[i])) {
        return i;
      }
    }

    return -1;
  }

  private _minWidth(column: XdGridDisplayColumn): number {
    const parsed = column.minWidth ? parseFloat(column.minWidth) : NaN;

    return Number.isNaN(parsed) ? this._minColumnWidth : Math.max(parsed, this._minColumnWidth);
  }

  /**
   * Fixes the width of every column to the one it has now, so that resizing one moves only the others it must.
   */
  private _freezeWidths(): void {
    const columns = this.displayColumns();
    const cells = this.headerCells();
    const widths: Record<string, number> = {};
    for (let i = 0; i < columns.length; i++) {
      const cell = cells[i];
      widths[(columns[i] as XdGridDisplayColumn).key] = cell ? cell.getBoundingClientRect().width : 0;
    }
    this._widths.set(widths);
  }

  private _syncFilterInputs(inputs: HTMLInputElement[], filters: XdGridFilters): void {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i] as HTMLInputElement;
      const value = filters[input.dataset['field'] ?? '']?.value;
      const text = value === null || value === undefined ? '' : String(value);
      if (input.value !== text && this.shadowRoot?.activeElement !== input) {
        input.value = text;
      }
    }
  }

  private _buildCSV(options?: XdGridExportOptions): string {
    const rows = this._rowsToExport(options);
    const columns = this.displayColumns().filter(column => column.field && !column.type);
    const separator = this.csvSeparator();
    const lines = [columns.map(column => `"${this.headerText(column).replace(/"/g, '""')}"`).join(separator)];
    if (rows?.length) {
      for (let i = 0; i < rows.length; i++) {
        const cells: string[] = [];
        for (let j = 0; j < columns.length; j++) {
          const value = resolveFieldData(rows[i], (columns[j] as XdGridColumn).field);
          cells.push(`"${value === null || value === undefined ? '' : String(value).replace(/"/g, '""')}"`);
        }
        lines.push(cells.join(separator));
      }
    }

    return lines.join('\n');
  }

  private _rowsToExport(options?: XdGridExportOptions): unknown[] | undefined {
    if (options?.selectionOnly) {
      const selection = this._selectionState();
      if (Array.isArray(selection)) {
        return selection;
      }

      return selection === null || selection === undefined ? undefined : [selection];
    }

    return options?.allValues ? this.value() : this.processedRows().map(row => row.data);
  }

  private _cancelPendingFilters(): void {
    if (this._filterTimer !== null) {
      clearTimeout(this._filterTimer);
      this._filterTimer = null;
    }
    this._pendingFilters = null;
  }

  /**
   * Cancels the filter waiting for its delay.
   */
  public onDestroy(): void {
    this._cancelPendingFilters();
  }
}
