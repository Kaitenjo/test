import { CustomElement, Event, Property, Query, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { Aliased, Computed, InputSignal, QuerySignal } from '@xaendar/core/signals';

/**
 * A numeric field with optional stacked increment and decrement buttons. It is controlled by its parent: it shows
 * `value` and emits the committed number in `valueChange`, clamped to `min` and `max`.
 * The value is committed on the native `change` of the field (Enter or blur after an edit), ArrowUp, ArrowDown and the
 * buttons.
 */
@WebComponent({
  selector: 'xd-input-number',
  styleUrl: './xd-input-number.xd.component.scss',
  templateUrl: './xd-input-number.xd.component.html'
})
export class XdInputNumberComponent extends CustomElement {
  /**
   * The number shown, `null` for an empty field.
   */
  @Property<InputSignal<number | null>>(null)
  public accessor value!: InputSignal<number | null>;
  /**
   * The smallest value accepted.
   */
  @Property<InputSignal<number | null>>(null)
  public accessor min!: InputSignal<number | null>;
  /**
   * The largest value accepted.
   */
  @Property<InputSignal<number | null>>(null)
  public accessor max!: InputSignal<number | null>;
  /**
   * The amount the buttons and the arrow keys add or subtract.
   */
  @Property(1)
  public accessor step!: InputSignal<number>;
  /**
   * Whether the increment and decrement buttons are shown.
   */
  @Property(false)
  public accessor showButtons!: InputSignal<boolean>;
  /**
   * The text shown when the field is empty.
   */
  @Property('')
  public accessor placeholder!: InputSignal<string>;
  /**
   * Whether the field ignores the user.
   */
  @Property(false)
  public accessor disabled!: InputSignal<boolean>;
  /**
   * The fewest fraction digits of the text shown.
   */
  @Property(0)
  public accessor minFractionDigits!: InputSignal<number>;
  /**
   * The most fraction digits kept in the value.
   */
  @Property(3)
  public accessor maxFractionDigits!: InputSignal<number>;
  /**
   * The accessible name of the field.
   */
  @Property<Aliased<InputSignal<string>, 'ariaLabel'>>('', { alias: 'ariaLabel' })
  public accessor accessibleLabel!: Aliased<InputSignal<string>, 'ariaLabel'>;
  /**
   * Emitted with the committed number, or `null` when the field was emptied.
   */
  @Event()
  public accessor valueChange!: Output<number | null>;
  /**
   * The native field, `null` until the template is rendered.
   */
  @Query.ref<HTMLInputElement>('field')
  public accessor inputElement!: QuerySignal<HTMLInputElement | null>;

  /**
   * The text of the value, formatted with the fraction digits of the component.
   */
  public readonly text: Computed<string> = computed(() => this._computeText());

  /**
   * Keeps the native field showing the formatted value: writing the `value` attribute only sets its initial state.
   */
  public afterRender(): void {
    this.effect(() => {
      const field = this.inputElement();
      const text = this.text();
      if (field && field.value !== text) {
        field.value = text;
      }
    });
  }

  /**
   * Parses the text of the field, clamps the number and emits it when it differs from the value.
   * Text that is not a number restores the current value.
   */
  public commit(text: string): void {
    const trimmed = text.trim();
    if (trimmed === '') {
      this._emit(null);
      return;
    }

    const parsed = Number(trimmed.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      this._emit(this._clamp(this._round(parsed)));
    } else {
      this._showText();
    }
  }

  /**
   * Adds `direction` steps (negative to subtract) to the value, starting from 0 when the field is empty.
   */
  public adjust(direction: number): void {
    if (!this.disabled()) {
      this._emit(this._clamp(this._round((this.value() ?? 0) + direction * this.step())));
    }
  }

  /**
   * Increments the value on ArrowUp and decrements it on ArrowDown.
   */
  public onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.adjust(1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.adjust(-1);
        break;
      default:
        break;
    }
  }

  private _computeText(): string {
    return this._format(this.value());
  }

  private _format(value: number | null): string {
    if (value === null) {
      return '';
    }

    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: this.minFractionDigits(),
      maximumFractionDigits: Math.max(this.minFractionDigits(), this.maxFractionDigits()),
      useGrouping: false
    }).format(value);
  }

  private _round(value: number): number {
    const factor = 10 ** this.maxFractionDigits();
    return Math.round(value * factor) / factor;
  }

  private _clamp(value: number): number {
    const min = this.min();
    const max = this.max();
    const lower = min === null ? value : Math.max(value, min);
    return max === null ? lower : Math.min(lower, max);
  }

  private _emit(next: number | null): void {
    if (next !== this.value()) {
      this.valueChange.emit(next);
    }

    // The parent may keep the value: the field shows what is committed until it sends another one
    this._showText(next);
  }

  private _showText(shown: number | null = this.value()): void {
    const field = this.inputElement();
    if (field) {
      field.value = this._format(shown);
    }
  }
}
