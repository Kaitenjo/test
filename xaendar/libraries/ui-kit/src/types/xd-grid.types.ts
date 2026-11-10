/**
 * A column of the grid. The grid renders one header cell, one body cell per row and, when any column declares a
 * `footer`, one footer cell for each of them.
 */
export interface XdGridColumn {
  /**
   * Path of the value in the row (`name`, `address.city`).
   */
  field: string;
  /**
   * Text of the header cell. Defaults to the field.
   */
  header?: string;
  /**
   * Text of the footer cell.
   */
  footer?: string;
  /**
   * Formats the text of the body cell; by default the value converted to a string.
   */
  formatter?: (value: unknown, row: unknown) => string;
  /**
   * The column can be sorted by clicking its header.
   */
  sortable?: boolean;
  /**
   * Shows a filter field under the header.
   */
  filter?: boolean;
  /**
   * Type of the field of the filter.
   */
  filterType?: 'text' | 'numeric' | 'boolean';
  /**
   * How the filter compares the value. Defaults to `startsWith` (`equals` for numbers and booleans).
   */
  filterMatchMode?: XdGridFilterMatchMode;
  /**
   * Placeholder of the field of the filter.
   */
  filterPlaceholder?: string;
  /**
   * Special content of the column. `checkbox` / `radio` columns hold the selection control of the row.
   */
  type?: 'checkbox' | 'radio' | 'expander';
  /**
   * CSS width of the column (`10rem`).
   */
  width?: string;
  /**
   * CSS minimum width of the column.
   */
  minWidth?: string;
  /**
   * Text alignment of the cells.
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Class added to the header, body and footer cells of the column.
   */
  styleClass?: string;
  /**
   * The column cannot be resized, even when the grid has `resizableColumns`.
   */
  resizable?: boolean;
  /**
   * The column cannot be moved, even when the grid has `reorderableColumns`.
   */
  reorderable?: boolean;
  /**
   * Key of the column. Defaults to the field.
   */
  key?: string;
}

/**
 * A column of the grid with its key resolved: the `key`, the field or the type of the column, or its position.
 */
export type XdGridDisplayColumn = XdGridColumn & { key: string };

/**
 * The way a filter compares the value of a row with the value it is given.
 */
export type XdGridFilterMatchMode =
  | 'startsWith'
  | 'contains'
  | 'notContains'
  | 'endsWith'
  | 'equals'
  | 'notEquals'
  | 'in'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'between'
  | 'is'
  | 'isNot'
  | 'before'
  | 'after'
  | 'dateIs'
  | 'dateIsNot'
  | 'dateBefore'
  | 'dateAfter';

/**
 * The names of the match modes, for the code that prefers a constant to a string.
 */
export const FilterMatchMode = {
  STARTS_WITH: 'startsWith',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'notContains',
  ENDS_WITH: 'endsWith',
  EQUALS: 'equals',
  NOT_EQUALS: 'notEquals',
  IN: 'in',
  LESS_THAN: 'lt',
  LESS_THAN_OR_EQUAL_TO: 'lte',
  GREATER_THAN: 'gt',
  GREATER_THAN_OR_EQUAL_TO: 'gte',
  BETWEEN: 'between',
  IS: 'is',
  IS_NOT: 'isNot',
  BEFORE: 'before',
  AFTER: 'after',
  DATE_IS: 'dateIs',
  DATE_IS_NOT: 'dateIsNot',
  DATE_BEFORE: 'dateBefore',
  DATE_AFTER: 'dateAfter'
} as const satisfies Record<string, XdGridFilterMatchMode>;

/**
 * The filter applied to one field.
 */
export interface XdGridFilterMetadata {
  /**
   * The value the field is compared with.
   */
  value: unknown;
  /**
   * How the field is compared with the value.
   */
  matchMode: XdGridFilterMatchMode;
}

/**
 * The filters of the grid by field; the key `global` holds the global filter.
 */
export type XdGridFilters = Record<string, XdGridFilterMetadata>;

/**
 * A field the grid is sorted by.
 */
export interface XdGridSortMeta {
  /**
   * Path of the sorted value in the row.
   */
  field: string;
  /**
   * `1` ascending, `-1` descending.
   */
  order: number;
}

/**
 * What a server needs to load the rows to show when the grid is `lazy`.
 */
export interface XdGridLazyLoadEvent {
  /**
   * Position of the first row to load.
   */
  first: number;
  /**
   * Number of rows to load.
   */
  rows: number;
  /**
   * The field of a single sort, `null` when the grid is not sorted by one.
   */
  sortField: string | null;
  /**
   * The order of a single sort.
   */
  sortOrder: number;
  /**
   * The fields of a multiple sort, `null` when the grid is not sorted by several.
   */
  multiSortMeta: XdGridSortMeta[] | null;
  /**
   * The filters of the grid, the global one included.
   */
  filters: XdGridFilters;
  /**
   * The value of the global filter, `null` when there is none.
   */
  globalFilter: unknown;
}

/**
 * Detail of the `pageChange` event of the grid.
 */
export interface XdGridPageEvent {
  /**
   * Position of the first row of the page.
   */
  first: number;
  /**
   * Number of rows of a page.
   */
  rows: number;
}

/**
 * Detail of the `filtersChange` event of the grid.
 */
export interface XdGridFilterEvent {
  /**
   * The filters now applied.
   */
  filters: XdGridFilters;
  /**
   * The rows that satisfy them.
   */
  filteredValue: unknown[];
}

/**
 * Detail of the `rowSelect` and `rowUnselect` events of the grid.
 */
export interface XdGridRowEvent {
  /**
   * The DOM event that selected or unselected the row.
   */
  originalEvent: Event;
  /**
   * The row, or the rows of a range selection.
   */
  data: unknown;
  /**
   * Position of the row among the sorted and filtered rows.
   */
  index: number;
  /**
   * The control that changed the selection.
   */
  type: 'row' | 'checkbox' | 'radio';
}

/**
 * Detail of the `rowExpand` and `rowCollapse` events of the grid.
 */
export interface XdGridRowExpandEvent {
  /**
   * The DOM event that toggled the row, when there is one.
   */
  originalEvent: Event | undefined;
  /**
   * The row that was expanded or collapsed.
   */
  data: unknown;
}

/**
 * Detail of the `selectAllChange` event of the grid.
 */
export interface XdGridSelectAllEvent {
  /**
   * The DOM event of the header checkbox.
   */
  originalEvent: Event;
  /**
   * Whether the rows were selected or unselected.
   */
  checked: boolean;
}

/**
 * Detail of the `columnResize` event of the grid.
 */
export interface XdGridColResizeEvent {
  /**
   * The column that was resized.
   */
  column: XdGridColumn;
  /**
   * How many pixels wider (negative: narrower) the column became.
   */
  delta: number;
}

/**
 * Detail of the `columnReorder` event of the grid.
 */
export interface XdGridColReorderEvent {
  /**
   * Position the column had.
   */
  dragIndex: number;
  /**
   * Position the column has now.
   */
  dropIndex: number;
  /**
   * The columns in their new order.
   */
  columns: XdGridColumn[];
}

/**
 * The options of the CSV export of the grid.
 */
export interface XdGridExportOptions {
  /**
   * Export only the selection.
   */
  selectionOnly?: boolean;
  /**
   * Export the filtered rows (default) or all the rows.
   */
  allValues?: boolean;
}

/**
 * Detail of the `columnSort` event of the sortable column directive.
 */
export interface XdGridColumnSortEvent {
  /**
   * The DOM event that asked for the sort.
   */
  originalEvent: Event;
  /**
   * Path of the value the column shows.
   */
  field: string;
}

/**
 * Detail of the `rowClick` event of the selectable row directive.
 */
export interface XdGridRowClickEvent {
  /**
   * The DOM event that clicked the row.
   */
  originalEvent: Event;
  /**
   * Position of the row among the sorted and filtered rows.
   */
  index: number;
  /**
   * The click follows a touch: no meta-key selection then.
   */
  touched: boolean;
}

/**
 * Detail of the events of the column resizer directive.
 */
export interface XdGridResizeEvent {
  /**
   * Pointer position, in the viewport.
   */
  clientX: number;
  /**
   * Horizontal distance from the position where the drag began (the writing direction applied).
   */
  delta: number;
  /**
   * Width of the column when the drag began.
   */
  width: number;
}

/**
 * Detail of the `columnDrop` event of the column reorder directive.
 */
export interface XdGridColumnDropEvent {
  /**
   * Position of the column that was dragged.
   */
  dragIndex: number;
  /**
   * Final position of the column, once it has left its old one.
   */
  dropIndex: number;
}

/**
 * A row ready to be rendered: the data, its position in `value` and the key naming its slots.
 */
export interface XdGridRow {
  /**
   * The row as it is in `value`.
   */
  data: unknown;
  /**
   * Position of the row in the `value` array.
   */
  index: number;
  /**
   * Value of `dataKey` in the row, or its position in `value` when there is no `dataKey`.
   */
  key: string;
}
