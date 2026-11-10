import { afterEach, describe, expect, it } from 'vitest';
import { XdPaginatorComponent } from './xd-paginator.xd.component';
import type { PaginatorState } from './xd-paginator.xd.component';

const elements: XdPaginatorComponent[] = [];

async function flush(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve));
}

async function create(inputs: Record<string, unknown>): Promise<XdPaginatorComponent> {
  const element = document.createElement('xd-paginator') as XdPaginatorComponent;
  Object.assign(element, inputs);
  document.body.append(element);
  elements.push(element);
  await flush();
  return element;
}

function pageLinks(element: XdPaginatorComponent): HTMLButtonElement[] {
  return Array.from(element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.page') ?? []);
}

function listen(element: XdPaginatorComponent): PaginatorState[] {
  const states: PaginatorState[] = [];
  element.addEventListener('pageChange', event => {
    states.push((event as CustomEvent<PaginatorState>).detail);
  });
  return states;
}

describe('XdPaginatorComponent', () => {
  afterEach(() => {
    while (elements.length) {
      elements.pop()?.remove();
    }
  });

  it('renders the page links around the current page', async () => {
    const element = await create({ totalRecords: 95, rows: 10 });
    const links = pageLinks(element);

    expect(element).toBeInstanceOf(XdPaginatorComponent);
    expect(element.pageCount()).toBe(10);
    expect(links.map(link => link.textContent?.trim())).toEqual(['1', '2', '3', '4', '5']);
    expect(links[0]?.getAttribute('aria-current')).toBe('page');
    expect(links[1]?.hasAttribute('aria-current')).toBe(false);
  });

  it('slides the window of links near the last page', async () => {
    const element = await create({ totalRecords: 95, rows: 10, first: 90 });

    expect(pageLinks(element).map(link => link.textContent?.trim())).toEqual(['6', '7', '8', '9', '10']);
    expect(element.isLastPage()).toBe(true);
  });

  it('emits pageChange when a page link is clicked', async () => {
    const element = await create({ totalRecords: 95, rows: 10 });
    const states = listen(element);

    pageLinks(element)[2]?.click();
    await flush();

    expect(states).toEqual([{ first: 20, rows: 10, page: 2, pageCount: 10 }]);
    expect(element.page()).toBe(2);
    expect(pageLinks(element)[2]?.getAttribute('aria-current')).toBe('page');
  });

  it('navigates to the previous, next, first and last page', async () => {
    const element = await create({ totalRecords: 95, rows: 10, first: 30 });
    const states = listen(element);

    element.changePageToNext();
    element.changePageToPrev();
    element.changePageToLast();
    element.changePageToFirst();

    expect(states.map(state => state.page)).toEqual([4, 3, 9, 0]);
  });

  it('ignores pages out of range', async () => {
    const element = await create({ totalRecords: 25, rows: 10 });
    const states = listen(element);

    element.changePage(-1);
    element.changePage(3);

    expect(states).toEqual([]);
  });

  it('follows the first and rows inputs', async () => {
    const element = await create({ totalRecords: 95, rows: 10 });

    Object.assign(element, { first: 50, rows: 5 });
    await flush();

    expect(element.page()).toBe(10);
    expect(element.pageCount()).toBe(19);
  });

  it('formats the current page report', async () => {
    const element = await create({
      totalRecords: 95,
      rows: 10,
      first: 20,
      showCurrentPageReport: true,
      currentPageReportTemplate: '{first} - {last} of {totalRecords} ({currentPage}/{totalPages}, {rows} rows)'
    });

    expect(element.shadowRoot?.querySelector('.current')?.textContent).toBe('21 - 30 of 95 (3/10, 10 rows)');
  });

  it('keeps the rows per page options, with the show all entry', async () => {
    const element = await create({ totalRecords: 95, rows: 10, rowsPerPageOptions: [10, 20, { showAll: 'All' }] });

    expect(element.rowsPerPageItems()).toEqual([
      { label: '10', value: 10 },
      { label: '20', value: 20 },
      { label: 'All', value: 95 }
    ]);
    expect(element.shadowRoot?.querySelector('.rows-per-page-dropdown')).not.toBeNull();
  });

  it('emits the new rows when the rows per page change', async () => {
    const element = await create({ totalRecords: 95, rows: 10, first: 20, rowsPerPageOptions: [10, 20] });
    const states = listen(element);

    element.onRowsChange(20);

    expect(states).toEqual([{ first: 20, rows: 20, page: 1, pageCount: 5 }]);
  });

  it('goes back when the records shrink under the first row', async () => {
    const element = await create({ totalRecords: 95, rows: 10, first: 90 });
    const states = listen(element);

    Object.assign(element, { totalRecords: 45 });
    await flush();

    expect(states.map(state => state.page)).toEqual([4]);
    expect(element.page()).toBe(4);
  });

  it('collapses when there is a single page and alwaysShow is off', async () => {
    const element = await create({ totalRecords: 5, rows: 10, alwaysShow: false });

    expect(element.classList.contains('collapsed')).toBe(true);

    Object.assign(element, { totalRecords: 50 });
    await flush();

    expect(element.classList.contains('collapsed')).toBe(false);
  });

  it('hides the page links and the first/last buttons on request', async () => {
    const element = await create({ totalRecords: 95, rows: 10, showPageLinks: false, showFirstLastIcon: false });

    expect(pageLinks(element)).toEqual([]);
    expect(element.shadowRoot?.querySelectorAll('xd-button').length).toBe(2);
  });

  it('formats the page numbers with the digits of a locale', async () => {
    const element = await create({ totalRecords: 95, rows: 10, locale: 'ar-EG' });

    expect(pageLinks(element)[0]?.textContent?.trim()).toBe('١');
  });
});
