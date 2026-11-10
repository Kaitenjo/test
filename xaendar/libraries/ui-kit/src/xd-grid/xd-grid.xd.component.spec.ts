import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { XdGridColumn, XdGridLazyLoadEvent } from '../types/xd-grid.types';
import { XdGridComponent } from './xd-grid.xd.component';

interface Person {
  id: number;
  name: string;
  age: number;
  city: string;
}

const people: Person[] = [
  { id: 1, name: 'Carla', age: 41, city: 'Torino' },
  { id: 2, name: 'Anna', age: 29, city: 'Roma' },
  { id: 3, name: 'Bruno', age: 35, city: 'Milano' },
  { id: 4, name: 'Dario', age: 52, city: 'Roma' }
];

const columns: XdGridColumn[] = [
  { field: 'name', header: 'Name', sortable: true, filter: true },
  { field: 'age', header: 'Age', sortable: true },
  { field: 'city', header: 'City', footer: 'Cities' }
];

const elements: XdGridComponent[] = [];

async function flush(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve));
}

async function create(inputs: Record<string, unknown> = {}): Promise<XdGridComponent> {
  const element = document.createElement('xd-grid') as XdGridComponent;
  Object.assign(element, { value: people, columns, dataKey: 'id', ...inputs });
  document.body.append(element);
  elements.push(element);
  await flush();

  return element;
}

function bodyRows(element: XdGridComponent): HTMLTableRowElement[] {
  return Array.from(element.shadowRoot?.querySelectorAll<HTMLTableRowElement>('tbody > tr.xd-grid-row') ?? []);
}

function names(element: XdGridComponent): (string | undefined)[] {
  return bodyRows(element).map(row => row.querySelector('td')?.textContent?.trim());
}

function headerCell(element: XdGridComponent, index: number): HTMLTableCellElement {
  return element.headerCells()[index] as HTMLTableCellElement;
}

describe('XdGridComponent', () => {
  beforeAll(() => {
    // happy-dom lacks moveBefore, which the keyed @for blocks use to reorder their rows
    if (!('moveBefore' in Node.prototype)) {
      Object.defineProperty(Node.prototype, 'moveBefore', {
        configurable: true,
        value(this: Node, node: Node, reference: Node | null): void {
          this.insertBefore(node, reference);
        }
      });
    }
  });

  afterEach(() => {
    while (elements.length) {
      elements.pop()?.remove();
    }
  });

  it('renders the header, the rows and the footer of its columns', async () => {
    const element = await create();
    const headers = Array.from(element.shadowRoot?.querySelectorAll('thead th.xd-grid-header-cell') ?? []).map(cell => cell.textContent?.trim());

    expect(element).toBeInstanceOf(XdGridComponent);
    expect(headers).toEqual(['Name', 'Age', 'City']);
    expect(names(element)).toEqual(['Carla', 'Anna', 'Bruno', 'Dario']);
    expect(element.shadowRoot?.querySelector('tfoot')?.textContent).toContain('Cities');
  });

  it('shows the empty message when there are no rows', async () => {
    const element = await create({ value: [], emptyMessage: 'Nothing here' });

    expect(element.shadowRoot?.querySelector('.xd-grid-empty-row')?.textContent).toContain('Nothing here');
  });

  it('formats a cell with the formatter of its column', async () => {
    const element = await create({ columns: [{ field: 'age', formatter: (value: unknown) => `${String(value)} years` }] });

    expect(bodyRows(element)[0]?.textContent).toContain('41 years');
  });

  it('sorts a column on click, then reverses it, without changing value', async () => {
    const element = await create();
    const events: unknown[] = [];
    element.addEventListener('sortChange', event => events.push((event as CustomEvent).detail));

    headerCell(element, 0).click();
    await flush();
    expect(names(element)).toEqual(['Anna', 'Bruno', 'Carla', 'Dario']);
    expect(headerCell(element, 0).getAttribute('aria-sort')).toBe('ascending');

    headerCell(element, 0).click();
    await flush();
    expect(names(element)).toEqual(['Dario', 'Carla', 'Bruno', 'Anna']);
    expect(events).toEqual([[{ field: 'name', order: 1 }], [{ field: 'name', order: -1 }]]);
    expect((element.value() as Person[]).map(person => person.name)).toEqual(['Carla', 'Anna', 'Bruno', 'Dario']);
  });

  it('sorts by several columns with the Ctrl key', async () => {
    const element = await create({ sortMode: 'multiple', columns: columns.map(column => ({ ...column, sortable: true })) });

    headerCell(element, 2).click();
    headerCell(element, 0).dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true }));
    await flush();

    expect(names(element)).toEqual(['Bruno', 'Anna', 'Dario', 'Carla']);
  });

  it('filters the rows with the filter of a column, after the delay', async () => {
    const element = await create({ filterDelay: 0 });
    const input = element.shadowRoot?.querySelector<HTMLInputElement>('input.xd-grid-filter-input') as HTMLInputElement;

    input.value = 'b';
    input.dispatchEvent(new Event('input'));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(names(element)).toEqual(['Bruno']);
  });

  it('filters every column with the global filter', async () => {
    const element = await create({ filterDelay: 0 });

    element.filterGlobal('roma');
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(names(element)).toEqual(['Anna', 'Dario']);
  });

  it('shows the page of the paginator and follows its page changes', async () => {
    const element = await create({ paginator: true, rows: 3 });
    const events: unknown[] = [];
    element.addEventListener('pageChange', event => events.push((event as CustomEvent).detail));

    expect(names(element)).toEqual(['Carla', 'Anna', 'Bruno']);

    element.shadowRoot?.querySelector('xd-paginator')?.dispatchEvent(new CustomEvent('pageChange', { detail: { first: 3, rows: 3, page: 1, pageCount: 2 } }));
    await flush();

    expect(names(element)).toEqual(['Dario']);
    expect(events).toEqual([{ first: 3, rows: 3 }]);
  });

  it('selects a row on click, and a second one on a single selection replaces it', async () => {
    const element = await create({ selectionMode: 'single' });
    const selections: unknown[] = [];
    element.addEventListener('selectionChange', event => selections.push((event as CustomEvent).detail));

    bodyRows(element)[1]?.click();
    await flush();
    expect(bodyRows(element)[1]?.classList.contains('xd-grid-row-selected')).toBe(true);

    bodyRows(element)[2]?.click();
    await flush();
    expect(bodyRows(element)[1]?.classList.contains('xd-grid-row-selected')).toBe(false);
    expect(selections).toEqual([people[1], people[2]]);
  });

  it('selects the rows with the checkboxes and the header checkbox', async () => {
    const element = await create({ columns: [{ field: 'select', type: 'checkbox' }, ...columns], selectionMode: 'multiple' });
    const selections: unknown[] = [];
    element.addEventListener('selectionChange', event => selections.push((event as CustomEvent).detail));

    element.shadowRoot?.querySelector('thead xd-checkbox')?.dispatchEvent(new CustomEvent('checkedChange', { detail: true }));
    await flush();

    expect(selections[0]).toEqual(people);
    expect(element.headerChecked()).toBe(true);
    expect(element.isSelected(people[0])).toBe(true);
  });

  it('expands a row and shows its slot', async () => {
    const element = await create({ columns: [{ field: 'expand', type: 'expander' }, ...columns] });

    element.toggleRow(people[0]);
    await flush();

    expect(element.isExpanded(people[0])).toBe(true);
    expect(element.shadowRoot?.querySelector('tr.xd-grid-expansion-row slot')?.getAttribute('name')).toBe('expansion-1');
  });

  it('names the slot of a cell by field and row key', async () => {
    const element = await create();

    expect(bodyRows(element)[0]?.querySelector('slot')?.getAttribute('name')).toBe('cell-name-1');
  });

  it('asks for the rows to show when it is lazy', async () => {
    const element = await create({ lazy: true, paginator: true, rows: 2, totalRecords: 40, value: people.slice(0, 2) });
    const events: XdGridLazyLoadEvent[] = [];
    element.addEventListener('lazyLoad', event => events.push((event as CustomEvent<XdGridLazyLoadEvent>).detail));

    headerCell(element, 1).click();
    await flush();

    expect(events[0]).toMatchObject({ first: 0, rows: 2, sortField: 'age', sortOrder: 1 });
    expect(element.totalCount()).toBe(40);
  });

  it('reorders its columns when one is dropped on another', async () => {
    const element = await create({ reorderableColumns: true });

    headerCell(element, 0).dispatchEvent(new CustomEvent('columnDrop', { detail: { dragIndex: 0, dropIndex: 2 } }));
    await flush();

    expect(element.displayColumns().map(column => column.field)).toEqual(['age', 'city', 'name']);
  });

  it('exports the rows as CSV', async () => {
    const element = await create();
    const csv = (element as unknown as { _buildCSV(): string })._buildCSV();

    expect(csv.split('\n')[0]).toBe('"Name","Age","City"');
    expect(csv.split('\n')).toHaveLength(5);
  });
});
