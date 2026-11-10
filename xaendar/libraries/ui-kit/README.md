# @xaendar/ui-kit

A library of Xaendar components and directives. The project at the root of the workspace imports it from its sources,
by the name of its package: `@import { … } from '@xaendar/ui-kit'`.

- `xd generate component <name> --library ui-kit` adds a component to it, exported by `src/public-api.ts`.
- `xd test` runs its specs, with the ones of the workspace.
- `xd build ui-kit` compiles it into `dist/ui-kit`, the folder to publish with `npm publish`.

The components are ported from [Optimus-ui](https://github.com/openng-org/optimus-ui) (the community continuation of
PrimeNG). Angular's `ng-template` / `pTemplate`, dependency injection and pass-through (`pt`) have no equivalent in
Xaendar: content is customised with named **slots**, and the look with CSS custom properties.

## Theming

Every component reads its colors, radius and spacing from custom properties with a default (`src/theme/_tokens.scss`):

```css
:root {
  --xd-primary-color: #0ea5e9;
  --xd-surface-border: #d4d4d8;
}
```

## Components

| Selector | Class | What it is |
| --- | --- | --- |
| `xd-grid` | `XdGridComponent` | Data grid (the Optimus-ui `p-table`) |
| `xd-paginator` | `XdPaginatorComponent` | Page navigation (`p-paginator`) |
| `xd-scroller` | `XdScrollerComponent` | Fixed-size window scroller (`p-scroller`, simplified) |
| `xd-select` | `XdSelectComponent` | Dropdown (`p-select`) |
| `xd-input-number` | `XdInputNumberComponent` | Number field (`p-inputnumber`, without currency / prefix / suffix) |
| `xd-button` | `XdButtonComponent` | Button |
| `xd-checkbox` | `XdCheckboxComponent` | Checkbox, controlled (`checked` + `checkedChange`) |
| `xd-radio-button` | `XdRadioButtonComponent` | Radio button, controlled |
| `xd-icon` | `XdIconComponent` | Inline SVG icons by name |

The directives `xdGridSortableColumn`, `xdGridSelectableRow`, `xdGridColumnResizer` and `xdGridColumnReorder` are the
behaviours the grid applies to its header cells, rows and resize handles.

## xd-grid

```html
@import { XdGridComponent } from '@xaendar/ui-kit'

<xd-grid
  value="{people()}"
  columns="{columns}"
  dataKey="id"
  paginator="{true}"
  rows="{10}"
  selectionMode="multiple"
  (selectionChange)="select($event.detail)"
>
  <h3 slot="caption">People</h3>
  <strong slot="cell-name-1">Carla</strong>
</xd-grid>
```

```ts
columns: XdGridColumn[] = [
  { field: 'select', type: 'checkbox' },
  { field: 'name', header: 'Name', sortable: true, filter: true },
  { field: 'age', header: 'Age', sortable: true, filter: true, filterType: 'numeric' },
  { field: 'city', header: 'City', footer: 'Cities' }
];
```

- **Data**: `value` and `columns`; `dataKey` makes selection and expansion survive a new `value`. Arrays and objects
  are never mutated: give the grid a new one.
- **Sorting**: `sortMode` (`single` / `multiple`, Ctrl / Meta adds a column), `sortField`, `sortOrder`, `multiSortMeta`,
  `customSort` (the grid only reports `sortChange`), `resetPageOnSort`. Event: `sortChange`.
- **Filtering**: `filter: true` on a column, `filterType` (`text` / `numeric` / `boolean`), `filterMatchMode`, the
  `filterGlobal(value, matchMode?)` method with `globalFilterFields`, `filterDelay`, `filters`. Event: `filtersChange`.
- **Pagination**: `paginator`, `rows`, `first`, `rowsPerPageOptions`, `paginatorPosition`, the page report options of
  `xd-paginator`. Events: `pageChange`, `firstChange`, `rowsChange`.
- **Selection**: `selectionMode` (`single` / `multiple`), `selection`, `metaKeySelection`, Shift range selection,
  `rowSelectable`, `compareSelectionBy`, `selectionPageOnly`; columns of `type` `checkbox` / `radio`. Events:
  `selectionChange`, `rowSelect`, `rowUnselect`, `selectAllChange`.
- **Row expansion**: a column of `type: 'expander'` (or `toggleRow(data)`), `expandedRowKeys`, `rowExpandMode`.
  Events: `rowExpand`, `rowCollapse`, `expandedRowKeysChange`.
- **Scrolling**: `scrollable` + `scrollHeight` (a CSS length, or `flex`); `virtualScroll` with `virtualScrollItemSize`
  (rows of one fixed height).
- **Lazy loading**: `lazy`, `totalRecords`, `lazyLoadOnInit`; `lazyLoad` carries `first`, `rows`, the sort and the
  filters. With `virtualScroll` it also reports the window of rows to load.
- **Columns**: `resizableColumns` (`columnResizeMode` `fit` / `expand`), `reorderableColumns`; events `columnResize`,
  `columnReorder`.
- **Look**: `loading`, `rowHover`, `size` (`small` / `large`), `showGridlines`, `stripedRows`, `tableStyleClass`.
- **Methods**: `filter`, `filterGlobal`, `clear`, `exportCSV`, `toggleRow`, `resetScrollTop`, `scrollToIndex`.

### Slots

`caption`, `summary`, `empty`, `paginator-left`, `paginator-right`, `header-<field>`, `footer-<field>`,
`cell-<field>-<rowKey>` and `expansion-<rowKey>`, where `rowKey` is the value of `dataKey` in the row (its position in
`value` when there is no `dataKey`).

### Not ported from the Optimus-ui table

Cell and row editing, row grouping, frozen rows and columns, the filter menu overlay (operators and several
constraints per column), row reordering, context menu, state storage and the responsive layout.
