import { CustomElement, Event, HostProperty, Property, Query, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { computed, signal, untracked } from '@xaendar/core/signals';
import type { Computed, InputSignal, QuerySignal } from '@xaendar/core/signals';

/**
 * The state of the paginator, emitted by `pageChange`.
 */
export interface PaginatorState {
  /**
   * Zero-relative number of the first row of the page.
   */
  first: number;
  /**
   * Number of rows per page.
   */
  rows: number;
  /**
   * Zero-relative number of the page.
   */
  page: number;
  /**
   * Number of pages.
   */
  pageCount: number;
}

/**
 * An entry of the "rows per page" and "jump to page" dropdowns.
 */
export interface PaginatorOption {
  /**
   * The text shown for the entry.
   */
  label: string;
  /**
   * The number of rows per page, or the zero-relative page, the entry stands for.
   */
  value: number;
}

/**
 * Paginator displays a paged navigation: page links, first/previous/next/last buttons, a rows per page dropdown,
 * a jump to page dropdown or input and a current page report. Content for its two sides goes in the `left` and
 * `right` slots.
 */
@WebComponent({
  selector: 'xd-paginator',
  styleUrl: './xd-paginator.xd.component.scss',
  templateUrl: './xd-paginator.xd.component.html'
})
export class XdPaginatorComponent extends CustomElement {
  /**
   * Zero-relative number of the first row to be displayed.
   */
  @Property(0)
  public accessor first!: InputSignal<number>;
  /**
   * Number of rows to display per page.
   */
  @Property(10)
  public accessor rows!: InputSignal<number>;
  /**
   * Number of total records.
   */
  @Property(0)
  public accessor totalRecords!: InputSignal<number>;
  /**
   * Number of page links to display.
   */
  @Property(5)
  public accessor pageLinkSize!: InputSignal<number>;
  /**
   * Whether to show the paginator even when there is only one page.
   */
  @Property(true)
  public accessor alwaysShow!: InputSignal<boolean>;
  /**
   * Values of the "rows per page" dropdown: numbers, `{ label, value }` objects, or `{ showAll: 'All' }` to
   * display every record.
   */
  @Property<InputSignal<any[] | undefined>>(undefined)
  public accessor rowsPerPageOptions!: InputSignal<any[] | undefined>;
  /**
   * Template of the current page report. Placeholders: {currentPage}, {totalPages}, {rows}, {first}, {last}, {totalRecords}.
   */
  @Property('{currentPage} of {totalPages}')
  public accessor currentPageReportTemplate!: InputSignal<string>;
  /**
   * Whether to display the buttons going to the first and the last page.
   */
  @Property(true)
  public accessor showFirstLastIcon!: InputSignal<boolean>;
  /**
   * Whether to display the current page report.
   */
  @Property(false)
  public accessor showCurrentPageReport!: InputSignal<boolean>;
  /**
   * Whether to display a dropdown to navigate to any page.
   */
  @Property(false)
  public accessor showJumpToPageDropdown!: InputSignal<boolean>;
  /**
   * Whether to display an input to navigate to any page.
   */
  @Property(false)
  public accessor showJumpToPageInput!: InputSignal<boolean>;
  /**
   * Whether to display the page links.
   */
  @Property(true)
  public accessor showPageLinks!: InputSignal<boolean>;
  /**
   * Locale used to format the page numbers.
   */
  @Property<InputSignal<string | undefined>>(undefined)
  public accessor locale!: InputSignal<string | undefined>;
  /**
   * Emitted when the page or the rows per page change.
   */
  @Event()
  public accessor pageChange!: Output<PaginatorState>;
  /**
   * The `left` slot, `null` until the template is rendered.
   */
  @Query.ref<HTMLSlotElement>('leftSlot')
  public accessor leftSlot!: QuerySignal<HTMLSlotElement | null>;
  /**
   * The `right` slot, `null` until the template is rendered.
   */
  @Query.ref<HTMLSlotElement>('rightSlot')
  public accessor rightSlot!: QuerySignal<HTMLSlotElement | null>;
  /**
   * The labels of the controls, read by assistive technologies.
   */
  public readonly labels = {
    first: 'First Page',
    previous: 'Previous Page',
    next: 'Next Page',
    last: 'Last Page',
    rowsPerPage: 'Rows per page',
    jumpToPageDropdown: 'Jump to Page Dropdown',
    jumpToPageInput: 'Jump to Page Input'
  };
  /**
   * The zero-relative first row currently displayed: the `first` input, moved by the navigation.
   */
  public readonly currentFirst = signal(0);
  /**
   * The rows per page currently used: the `rows` input, changed by the rows per page dropdown.
   */
  public readonly currentRows = signal(10);
  /**
   * Whether something is projected in the `left` slot.
   */
  public readonly hasLeft = signal(false);
  /**
   * Whether something is projected in the `right` slot.
   */
  public readonly hasRight = signal(false);
  /**
   * The number of pages.
   */
  public readonly pageCount: Computed<number> = computed(() => this._computePageCount());
  /**
   * The zero-relative number of the current page.
   */
  public readonly page: Computed<number> = computed(() => this._computePage());
  /**
   * The one-relative number of the current page, 0 when there are no pages.
   */
  public readonly currentPage: Computed<number> = computed(() => this._computeCurrentPage());
  /**
   * Whether the current page is the first one.
   */
  public readonly isFirstPage: Computed<boolean> = computed(() => this._computeIsFirstPage());
  /**
   * Whether the current page is the last one.
   */
  public readonly isLastPage: Computed<boolean> = computed(() => this._computeIsLastPage());
  /**
   * Whether there are no pages.
   */
  public readonly isEmpty: Computed<boolean> = computed(() => this._computeIsEmpty());
  /**
   * The one-relative numbers of the page links shown, around the current page.
   */
  public readonly pageLinks: Computed<number[]> = computed(() => this._computePageLinks());
  /**
   * The entries of the jump to page dropdown, `undefined` when it is not shown.
   */
  public readonly pageItems: Computed<PaginatorOption[] | undefined> = computed(() => this._computePageItems());
  /**
   * The entries of the rows per page dropdown, `undefined` without `rowsPerPageOptions`.
   */
  public readonly rowsPerPageItems: Computed<PaginatorOption[] | undefined> = computed(() =>
    this._computeRowsPerPageItems()
  );
  /**
   * The text of the current page report, with the placeholders of its template replaced.
   */
  public readonly currentPageReport: Computed<string> = computed(() => this._computeCurrentPageReport());
  /**
   * Whether the paginator is hidden: it has a single page and `alwaysShow` is off.
   */
  @HostProperty('class.collapsed')
  public readonly isCollapsed: Computed<boolean> = computed(() => this._computeIsCollapsed());

  /**
   * Starts from the inputs and keeps the current position in line with them.
   */
  public onInit(): void {
    this.currentFirst.set(this.first());
    this.currentRows.set(this.rows());
    this.effect(() => {
      this.currentFirst.set(this.first());
    });
    this.effect(() => {
      this.currentRows.set(this.rows());
    });
    this.effect(() => {
      this._moveBackWhenBeyondTheEnd();
    });
  }

  /**
   * Reads which slots have content once the template is rendered.
   */
  public afterRender(): void {
    this.onSlotChange();
  }

  /**
   * Goes to a zero-relative page, when it exists, and emits `pageChange`.
   */
  public changePage(page: number): void {
    const pageCount = this.pageCount();
    if (page >= 0 && page < pageCount) {
      const rows = this.currentRows();
      const first = rows * page;
      this.currentFirst.set(first);
      this.pageChange.emit({ first, rows, page, pageCount });
    }
  }

  /**
   * Goes to the first page, unless it is the current one.
   */
  public changePageToFirst(event?: Event): void {
    if (!this.isFirstPage()) {
      this.changePage(0);
    }
    event?.preventDefault();
  }

  /**
   * Goes to the previous page, when there is one.
   */
  public changePageToPrev(event?: Event): void {
    this.changePage(this.page() - 1);
    event?.preventDefault();
  }

  /**
   * Goes to the next page, when there is one.
   */
  public changePageToNext(event?: Event): void {
    this.changePage(this.page() + 1);
    event?.preventDefault();
  }

  /**
   * Goes to the last page, unless it is the current one.
   */
  public changePageToLast(event?: Event): void {
    if (!this.isLastPage()) {
      this.changePage(this.pageCount() - 1);
    }
    event?.preventDefault();
  }

  /**
   * Applies a new number of rows per page, staying on the page of the same first row.
   */
  public onRowsChange(rows: number): void {
    this.currentRows.set(Number(rows));
    this.changePage(this.page());
  }

  /**
   * Goes to a page typed in the jump to page input (one-relative).
   */
  public onPageInputChange(pageNumber: number | null): void {
    if (pageNumber !== null) {
      this.changePage(pageNumber - 1);
    }
  }

  /**
   * Keeps `hasLeft` and `hasRight` in line with the content projected in the slots.
   */
  public onSlotChange(): void {
    this.hasLeft.set(!!this.leftSlot()?.assignedNodes().length);
    this.hasRight.set(!!this.rightSlot()?.assignedNodes().length);
  }

  /**
   * Formats a number with the digits of the locale.
   */
  public localize(digit: number): string {
    return new Intl.NumberFormat(this.locale(), { useGrouping: false }).format(digit);
  }

  /**
   * The accessible label of the link of a one-relative page.
   */
  public pageLabel(page: number): string {
    return `Page ${page}`;
  }

  private _computePageCount(): number {
    const rows = this.currentRows();
    return rows > 0 ? Math.ceil(this.totalRecords() / rows) : 0;
  }

  private _computePage(): number {
    const rows = this.currentRows();
    return rows > 0 ? Math.floor(this.currentFirst() / rows) : 0;
  }

  private _computeCurrentPage(): number {
    return this.pageCount() > 0 ? this.page() + 1 : 0;
  }

  private _computeIsFirstPage(): boolean {
    return this.page() === 0;
  }

  private _computeIsLastPage(): boolean {
    return this.page() === this.pageCount() - 1;
  }

  private _computeIsEmpty(): boolean {
    return this.pageCount() === 0;
  }

  private _computePageLinks(): number[] {
    const pageCount = this.pageCount();
    const pageLinkSize = this.pageLinkSize();
    const visiblePages = Math.min(pageLinkSize, pageCount);

    // The current page stays in the middle when possible
    let start = Math.max(0, Math.ceil(this.page() - visiblePages / 2));
    const end = Math.min(pageCount - 1, start + visiblePages - 1);

    // Close to the last page the range slides back
    start = Math.max(0, start - (pageLinkSize - (end - start + 1)));

    const links: number[] = [];
    for (let i = start; i <= end; i++) {
      links.push(i + 1);
    }

    return links;
  }

  private _computePageItems(): PaginatorOption[] | undefined {
    if (!this.showJumpToPageDropdown()) {
      return undefined;
    }

    const pageCount = this.pageCount();
    const items: PaginatorOption[] = [];
    for (let i = 0; i < pageCount; i++) {
      items.push({ label: this.localize(i + 1), value: i });
    }

    return items;
  }

  private _computeRowsPerPageItems(): PaginatorOption[] | undefined {
    const options = this.rowsPerPageOptions();
    if (!options?.length) {
      return undefined;
    }

    const items: PaginatorOption[] = [];
    let showAllItem: PaginatorOption | undefined;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (typeof option !== 'object' || option === null) {
        items.push({ label: this.localize(option), value: option });
      } else if (option.showAll) {
        showAllItem = { label: String(option.showAll), value: this.totalRecords() };
      } else {
        items.push({ label: String(option.label), value: option.value });
      }
    }

    if (showAllItem) {
      items.push(showAllItem);
    }

    return items;
  }

  private _computeCurrentPageReport(): string {
    const first = this.currentFirst();
    const rows = this.currentRows();
    const totalRecords = this.totalRecords();

    return this.currentPageReportTemplate()
      .replace('{currentPage}', String(this.currentPage()))
      .replace('{totalPages}', String(this.pageCount()))
      .replace('{first}', String(totalRecords > 0 ? first + 1 : 0))
      .replace('{last}', String(Math.min(first + rows, totalRecords)))
      .replace('{rows}', String(rows))
      .replace('{totalRecords}', String(totalRecords));
  }

  private _computeIsCollapsed(): boolean {
    return !this.alwaysShow() && this.pageLinks().length <= 1;
  }

  /**
   * When the records shrink under the first row, the last page that still exists is shown.
   */
  private _moveBackWhenBeyondTheEnd(): void {
    const totalRecords = this.totalRecords();
    const first = this.currentFirst();
    const pageCount = this.pageCount();
    if (pageCount > 0 && totalRecords > 0 && first >= totalRecords) {
      untracked(() => {
        this.changePage(pageCount - 1);
      });
    }
  }
}
