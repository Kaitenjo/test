import { CustomElement, Event, Property, Query, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { computed, signal, untracked } from '@xaendar/core/signals';
import type { Aliased, Computed, InputSignal, QuerySignal, Signal } from '@xaendar/core/signals';

/**
 * An option of the list, ready to be rendered.
 */
export interface XdSelectEntry {
  /**
   * The text shown for the option.
   */
  label: string;
  /**
   * Whether the option is the selected one.
   */
  selected: boolean;
  /**
   * The value the option stands for.
   */
  value: any;
}

let nextId = 0;

/**
 * A drop-down list to pick one value among a list of options.
 *
 * Primitive options are their own label and value. For objects, `optionLabel` and `optionValue` name the properties to
 * read (dotted paths work); without `optionValue` the object itself is the value.
 */
@WebComponent({
  selector: 'xd-select',
  styleUrl: './xd-select.xd.component.scss',
  templateUrl: './xd-select.xd.component.html'
})
export class XdSelectComponent extends CustomElement {
  /**
   * The options to choose from.
   */
  @Property<InputSignal<any[]>>([])
  public accessor options!: InputSignal<any[]>;
  /**
   * The property of an object option read as its label.
   */
  @Property<InputSignal<string | undefined>>(undefined)
  public accessor optionLabel!: InputSignal<string | undefined>;
  /**
   * The property of an object option read as its value.
   */
  @Property<InputSignal<string | undefined>>(undefined)
  public accessor optionValue!: InputSignal<string | undefined>;
  /**
   * The selected value, compared with the values of the options by deep equality.
   */
  @Property<InputSignal<any>>(null)
  public accessor value!: InputSignal<any>;
  /**
   * The text shown while nothing is selected.
   */
  @Property('')
  public accessor placeholder!: InputSignal<string>;
  /**
   * Whether the user can not open the list.
   */
  @Property(false)
  public accessor disabled!: InputSignal<boolean>;
  /**
   * Whether a button clears the selection.
   */
  @Property(false)
  public accessor showClear!: InputSignal<boolean>;
  /**
   * Whether a field filters the options by their label.
   */
  @Property(false)
  public accessor filter!: InputSignal<boolean>;
  /**
   * The text shown when no option is left.
   */
  @Property('No results found')
  public accessor emptyMessage!: InputSignal<string>;
  /**
   * The maximum height of the list, scrolling beyond it.
   */
  @Property<Aliased<InputSignal<string>, 'scrollHeight'>>('200px', { alias: 'scrollHeight' })
  public accessor listHeight!: Aliased<InputSignal<string>, 'scrollHeight'>;
  /**
   * The accessible name of the field.
   */
  @Property<Aliased<InputSignal<string>, 'ariaLabel'>>('', { alias: 'ariaLabel' })
  public accessor accessibleLabel!: Aliased<InputSignal<string>, 'ariaLabel'>;
  /**
   * Emitted with the new value when the user picks an option, or with `null` when they clear the selection.
   */
  @Event()
  public accessor valueChange!: Output<any>;
  /**
   * The box showing the selection, `null` until the template is rendered.
   */
  @Query.ref<HTMLDivElement>('trigger')
  public accessor trigger!: QuerySignal<HTMLDivElement | null>;
  /**
   * The list, `null` while it is closed.
   */
  @Query.ref<HTMLDivElement>('panel')
  public accessor panel!: QuerySignal<HTMLDivElement | null>;
  /**
   * The field filtering the options, `null` while the list is closed or `filter` is off.
   */
  @Query.ref<HTMLInputElement>('filterField')
  public accessor filterField!: QuerySignal<HTMLInputElement | null>;

  /**
   * Whether the list is open.
   */
  public readonly isOpen = signal(false);
  /**
   * The position, among the visible options, of the one the keyboard is on (-1 for none).
   */
  public readonly activeIndex = signal(-1);
  /**
   * What the user typed in the filter field.
   */
  public readonly filterText = signal('');
  /**
   * The inline style placing the list under (or over) the field.
   */
  public readonly panelStyle = signal('');
  /**
   * The identifier of the list: the ones of the options derive from it.
   */
  public readonly listId = `xd-select-${nextId++}`;
  /**
   * Every option, as rendered.
   */
  public readonly entries: Computed<XdSelectEntry[]> = computed(() => this._computeEntries());
  /**
   * The options left once the filter is applied.
   */
  public readonly visibleItems: Computed<XdSelectEntry[]> = computed(() => this._computeVisibleItems());
  /**
   * The selected option, `undefined` when the value matches none.
   */
  public readonly selectedEntry: Computed<XdSelectEntry | undefined> = computed(() => this._computeSelectedEntry());
  /**
   * Whether an option is selected.
   */
  public readonly hasValue: Computed<boolean> = computed(() => this._computeHasValue());
  /**
   * The text of the field: the label of the selection, or the placeholder.
   */
  public readonly displayLabel: Computed<string> = computed(() => this._computeDisplayLabel());
  /**
   * The identifier of the option the keyboard is on, empty while the list is closed.
   */
  public readonly activeId: Computed<string> = computed(() => this._computeActiveId());

  private readonly _current: Signal<any> = signal(null);
  private _typed = '';
  private _typeTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly _onDocumentPointerDown = (event: Event): void => {
    if (!event.composedPath().includes(this)) {
      this.hide();
    }
  };
  private readonly _onViewportChange = (): void => {
    this.hide();
  };

  /**
   * Keeps the selection in line with the `value` input.
   */
  public onInit(): void {
    this.effect(() => {
      this._current.set(this.value());
    });
  }

  /**
   * Places the list when it opens, focuses the filter field and scrolls the list to the active option.
   */
  public afterRender(): void {
    this.effect(() => {
      const panel = this.panel();
      if (panel) {
        untracked(() => this._positionPanel(panel));
      }
    });
    this.effect(() => {
      const field = this.filterField();
      if (field) {
        field.focus();
      }
    });
    this.effect(() => {
      this._revealActive(this.panel(), this.activeIndex());
    });
  }

  /**
   * The tab stop of the field: none while it is disabled.
   */
  public triggerTabIndex(): number {
    return this.disabled() ? -1 : 0;
  }

  /**
   * Opens the list when it is closed, closes it otherwise.
   */
  public toggle(): void {
    this.isOpen() ? this.hide() : this.show();
  }

  /**
   * Opens the list, with the keyboard on the selected option.
   */
  public show(): void {
    if (this.disabled() || this.isOpen()) {
      return;
    }

    this.filterText.set('');
    this._positionPanel(null);
    this.activeIndex.set(this._selectedPosition());
    this.isOpen.set(true);
    document.addEventListener('pointerdown', this._onDocumentPointerDown);
    window.addEventListener('resize', this._onViewportChange);
    window.addEventListener('scroll', this._onViewportChange, true);
  }

  /**
   * Closes the list.
   */
  public hide(): void {
    this._removeListeners();
    this.isOpen.set(false);
    this.filterText.set('');
  }

  /**
   * Picks an option: closes the list and emits the new value when it changed.
   */
  public selectItem(entry: XdSelectEntry): void {
    if (!entry.selected) {
      this._current.set(entry.value);
      this.valueChange.emit(entry.value);
    }

    this.hide();
    this._focusTrigger();
  }

  /**
   * Clears the selection.
   */
  public clear(event: Event): void {
    event.stopPropagation();
    this._current.set(null);
    this.valueChange.emit(null);
    this._focusTrigger();
  }

  /**
   * Puts the keyboard on an option.
   */
  public setActive(index: number): void {
    this.activeIndex.set(index);
  }

  /**
   * Filters the options by what is typed in the field, with the keyboard on the first one left.
   */
  public onFilterInput(field: HTMLInputElement): void {
    this.filterText.set(field.value);
    this.activeIndex.set(this.visibleItems().length > 0 ? 0 : -1);
  }

  /**
   * Handles the keyboard of the field and, with `fromFilter`, of the filter field: arrows, Home, End, Enter, Space,
   * Escape, Tab and type-ahead.
   */
  public onKeyDown(event: KeyboardEvent, fromFilter: boolean = false): void {
    if (this.disabled()) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.isOpen() ? this._move(1) : this.show();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.isOpen() ? this._move(-1) : this.show();
        break;
      case 'Home':
      case 'End':
        // In the filter field they move the caret
        if (!fromFilter && this.isOpen()) {
          event.preventDefault();
          this.activeIndex.set(event.key === 'Home' ? 0 : this.visibleItems().length - 1);
        }
        break;
      case 'Enter':
      case 'NumpadEnter':
        event.preventDefault();
        this.isOpen() ? this._chooseActive() : this.show();
        break;
      case ' ':
        // In the filter field it is a character
        if (!fromFilter) {
          event.preventDefault();
          this.isOpen() ? this._chooseActive() : this.show();
        }
        break;
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.hide();
          this._focusTrigger();
        }
        break;
      case 'Tab':
        this.hide();
        break;
      default:
        if (!fromFilter) {
          this._typeAhead(event);
        }
    }
  }

  private _computeEntries(): XdSelectEntry[] {
    const options = this.options();
    const labelKey = this.optionLabel();
    const valueKey = this.optionValue();
    const current = this._current();
    const entries: XdSelectEntry[] = [];
    if (options?.length) {
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const value = valueKey ? this._resolve(option, valueKey) : option;
        const label = labelKey ? this._resolve(option, labelKey) : option;
        entries.push({ label: String(label ?? ''), selected: this._equals(value, current), value });
      }
    }

    return entries;
  }

  private _computeVisibleItems(): XdSelectEntry[] {
    const entries = this.entries();
    const query = this.filterText().trim().toLowerCase();
    if (!this.filter() || !query) {
      return entries;
    }

    return entries.filter(entry => entry.label.toLowerCase().includes(query));
  }

  private _computeSelectedEntry(): XdSelectEntry | undefined {
    return this.entries().find(entry => entry.selected);
  }

  private _computeHasValue(): boolean {
    return this.selectedEntry() !== undefined;
  }

  private _computeDisplayLabel(): string {
    return this.selectedEntry()?.label ?? this.placeholder();
  }

  private _computeActiveId(): string {
    const index = this.activeIndex();
    return this.isOpen() && index >= 0 ? `${this.listId}-${index}` : '';
  }

  private _resolve(source: any, path: string): any {
    const keys = path.split('.');
    let result = source;
    for (let i = 0; i < keys.length && result != null; i++) {
      result = result[keys[i] as string];
    }

    return result;
  }

  private _equals(left: any, right: any): boolean {
    if (Object.is(left, right)) {
      return true;
    }

    if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) {
      return false;
    }

    if (left instanceof Date || right instanceof Date) {
      return left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
    }

    const leftKeys = Object.keys(left);
    if (Array.isArray(left) !== Array.isArray(right) || leftKeys.length !== Object.keys(right).length) {
      return false;
    }

    for (let i = 0; i < leftKeys.length; i++) {
      const key = leftKeys[i] as string;
      if (!Object.prototype.hasOwnProperty.call(right, key) || !this._equals(left[key], right[key])) {
        return false;
      }
    }

    return true;
  }

  private _selectedPosition(): number {
    const items = this.visibleItems();
    for (let i = 0; i < items.length; i++) {
      if (items[i]?.selected) {
        return i;
      }
    }

    return items.length > 0 ? 0 : -1;
  }

  private _move(step: number): void {
    const count = this.visibleItems().length;
    if (count === 0) {
      return;
    }

    const current = this.activeIndex();
    if (current < 0) {
      this.activeIndex.set(step > 0 ? 0 : count - 1);
    } else {
      this.activeIndex.set(Math.min(count - 1, Math.max(0, current + step)));
    }
  }

  private _chooseActive(): void {
    const entry = this.visibleItems()[this.activeIndex()];
    if (entry) {
      this.selectItem(entry);
    }
  }

  private _typeAhead(event: KeyboardEvent): void {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    clearTimeout(this._typeTimer);
    this._typed += event.key.toLowerCase();
    this._typeTimer = setTimeout(() => {
      this._typed = '';
    }, 500);

    const items = this.visibleItems();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.label.toLowerCase().startsWith(this._typed)) {
        this.isOpen() ? this.activeIndex.set(i) : this.selectItem(item);
        return;
      }
    }
  }

  /**
   * Places the list under the field, or over it when it does not fit below and there is more room above.
   */
  private _positionPanel(panel: HTMLElement | null): void {
    const trigger = this.trigger();
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const panelHeight = panel ? panel.offsetHeight : 0;
    const vertical =
      panelHeight > below && rect.top > below ? `bottom: ${window.innerHeight - rect.top}px` : `top: ${rect.bottom}px`;
    this.panelStyle.set(`${vertical}; left: ${rect.left}px; min-width: ${rect.width}px`);
  }

  /**
   * Scrolls the list, and only the list, until the option the keyboard is on shows.
   */
  private _revealActive(panel: HTMLElement | null, index: number): void {
    if (!panel || index < 0) {
      return;
    }

    const scroller = panel.querySelector<HTMLElement>('.scroller');
    const option = panel.querySelector<HTMLElement>(`[id="${this.listId}-${index}"]`);
    if (!scroller || !option) {
      return;
    }

    if (option.offsetTop < scroller.scrollTop) {
      scroller.scrollTop = option.offsetTop;
    } else if (option.offsetTop + option.offsetHeight > scroller.scrollTop + scroller.clientHeight) {
      scroller.scrollTop = option.offsetTop + option.offsetHeight - scroller.clientHeight;
    }
  }

  private _focusTrigger(): void {
    this.trigger()?.focus();
  }

  private _removeListeners(): void {
    document.removeEventListener('pointerdown', this._onDocumentPointerDown);
    window.removeEventListener('resize', this._onViewportChange);
    window.removeEventListener('scroll', this._onViewportChange, true);
  }

  /**
   * Closes the list and drops the type-ahead timer and the listeners of the page.
   */
  public onDestroy(): void {
    clearTimeout(this._typeTimer);
    this._removeListeners();
  }
}
