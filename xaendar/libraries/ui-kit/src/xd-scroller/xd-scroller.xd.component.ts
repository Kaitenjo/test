import { CustomElement, Event, HostEvent, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { computed, signal, untracked } from '@xaendar/core/signals';
import type { Computed, InputSignal, Signal } from '@xaendar/core/signals';

/**
 * A window of items: `first` is inclusive, `last` exclusive.
 */
export interface XdScrollerRange {
  /**
   * Position of the first item of the window (inclusive).
   */
  first: number;
  /**
   * Position after the last item of the window (exclusive).
   */
  last: number;
}

/**
 * Vertical window scroller with a fixed item size.
 *
 * The parent renders only the items of the current range (`first` … `last`) as children of the element: they are
 * slotted into the scroller, which reserves the space of the items left out with the padding of its content. Put
 * the items in a single slotted element (typically a `<table>`): a `position: sticky` header works only when it is
 * inside that element, since the scroller itself is the scroll container.
 *
 * `scrollHeight` is an `Element` member, so the height of the viewport is bound as `viewportHeight`.
 */
@WebComponent({
  selector: 'xd-scroller',
  styleUrl: './xd-scroller.xd.component.scss',
  templateUrl: './xd-scroller.xd.component.html'
})
export class XdScrollerComponent extends CustomElement {
  /**
   * Total number of items, the ones not rendered included.
   */
  @Property(0)
  public accessor itemCount!: InputSignal<number>;
  /**
   * Height in pixels of one item.
   */
  @Property(40)
  public accessor itemSize!: InputSignal<number>;
  /**
   * Height of the viewport, as a CSS length.
   */
  @Property('400px')
  public accessor viewportHeight!: InputSignal<string>;
  /**
   * Items rendered above and below the viewport; by default half of the ones fitting in it, at least one.
   */
  @Property<InputSignal<number | undefined>>(undefined)
  public accessor numToleratedItems!: InputSignal<number | undefined>;
  /**
   * Milliseconds a scroll is throttled by.
   */
  @Property(0)
  public accessor delay!: InputSignal<number>;
  /**
   * Whether `lazyLoad` is emitted with the range to load.
   */
  @Property(false)
  public accessor lazy!: InputSignal<boolean>;
  /**
   * Items per lazy page: the range of `lazyLoad` is aligned to it. 0 uses the range of the items rendered.
   */
  @Property(0)
  public accessor step!: InputSignal<number>;
  /**
   * The range of items to render changed.
   */
  @Event()
  public accessor rangeChange!: Output<XdScrollerRange>;
  /**
   * The range of items to load changed (with `lazy`).
   */
  @Event()
  public accessor lazyLoad!: Output<XdScrollerRange>;

  /**
   * First item to render (inclusive).
   */
  public readonly first: Computed<number> = computed(() => this._computeFirst());
  /**
   * End of the items to render (exclusive).
   */
  public readonly last: Computed<number> = computed(() => this._computeLast());
  /**
   * Style of the content: the space reserved for the items before and after the range.
   */
  public readonly contentStyle: Computed<string> = computed(() => this._computeContentStyle());

  private readonly _scrollOffset: Signal<number> = signal(0);
  private readonly _viewportSize: Signal<number> = signal(0);
  private _resizeObserver: ResizeObserver | null = null;
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _lastRange: XdScrollerRange | null = null;
  private _lastLazyRange: XdScrollerRange | null = null;

  /**
   * Applies the height of the viewport, emits the ranges and watches the size of the viewport.
   */
  public afterRender(): void {
    this.effect(() => {
      this._applyHeight(this.viewportHeight());
    });
    this.effect(() => {
      this._emitRanges(this.first(), this.last(), this.lazy(), this.step(), this.itemCount());
    });
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => {
        this._viewportSize.set(this.clientHeight);
      });
      this._resizeObserver.observe(this);
    }
  }

  /**
   * Scrolls so that an item is at the top of the viewport; the index is clamped to the items.
   */
  public scrollToIndex(index: number, behavior: ScrollBehavior = 'auto'): void {
    const maximum = Math.max(0, this.itemCount() - 1);
    const clamped = Math.min(Math.max(0, index), maximum);
    this.scrollTo({ top: clamped * this.itemSize(), behavior });
  }

  /**
   * Scrolls back to the first item.
   */
  public scrollToTop(): void {
    this.scrollTo({ top: 0 });
  }

  /**
   * Stops watching the size of the viewport and drops the pending scroll.
   */
  public onDestroy(): void {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  @HostEvent('scroll', { passive: true })
  private _handleScroll(): void {
    const delay = this.delay();
    if (delay <= 0) {
      this._scrollOffset.set(this.scrollTop);
    } else if (this._timer === null) {
      this._timer = setTimeout(() => {
        this._timer = null;
        this._scrollOffset.set(this.scrollTop);
      }, delay);
    }
  }

  private _applyHeight(height: string): void {
    this.style.height = height;
    this._viewportSize.set(this.clientHeight);
  }

  private _emitRanges(first: number, last: number, lazy: boolean, step: number, itemCount: number): void {
    const previous = this._lastRange;
    if (previous === null || previous.first !== first || previous.last !== last) {
      this._lastRange = { first, last };
      untracked(() => {
        this.rangeChange.emit({ first, last });
      });
    }

    if (!lazy) {
      return;
    }

    const lazyFirst = step > 0 ? Math.floor(first / step) * step : first;
    const lazyLast = step > 0 ? Math.min(Math.ceil(last / step) * step, itemCount) : last;
    const previousLazy = this._lastLazyRange;
    if (previousLazy === null || previousLazy.first !== lazyFirst || previousLazy.last !== lazyLast) {
      this._lastLazyRange = { first: lazyFirst, last: lazyLast };
      untracked(() => {
        this.lazyLoad.emit({ first: lazyFirst, last: lazyLast });
      });
    }
  }

  private _computeViewportItems(): number {
    const measured = this._viewportSize();
    const size = measured > 0 ? measured : this._parsePixels(this.viewportHeight());
    return Math.max(1, Math.ceil(size / Math.max(1, this.itemSize())));
  }

  private _computeTolerated(): number {
    const tolerated = this.numToleratedItems();
    return tolerated === undefined ? Math.max(1, Math.floor(this._computeViewportItems() / 2)) : Math.max(0, tolerated);
  }

  private _computeFirstVisible(): number {
    const itemCount = this.itemCount();
    const firstVisible = Math.floor(this._scrollOffset() / Math.max(1, this.itemSize()));
    return Math.min(Math.max(0, firstVisible), Math.max(0, itemCount - 1));
  }

  private _computeFirst(): number {
    return Math.max(0, this._computeFirstVisible() - this._computeTolerated());
  }

  private _computeLast(): number {
    const end = this._computeFirstVisible() + this._computeViewportItems() + this._computeTolerated();
    return Math.min(Math.max(0, this.itemCount()), end);
  }

  private _computeContentStyle(): string {
    const itemSize = this.itemSize();
    const before = this.first() * itemSize;
    const after = Math.max(0, this.itemCount() - this.last()) * itemSize;
    return `padding-block-start: ${before}px; padding-block-end: ${after}px;`;
  }

  private _parsePixels(length: string): number {
    return length.endsWith('px') ? parseFloat(length) || 0 : 0;
  }
}
