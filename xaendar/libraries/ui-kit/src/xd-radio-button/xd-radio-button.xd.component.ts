import { CustomElement, Event, HostEvent, HostProperty, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { Aliased, InputSignal } from '@xaendar/core/signals';

/**
 * A radio button controlled by its parent: it emits `true` in `checkedChange` when the user picks it, and the parent
 * decides which button of the group is checked.
 */
@WebComponent({
  selector: 'xd-radio-button',
  styleUrl: './xd-radio-button.xd.component.scss',
  templateUrl: './xd-radio-button.xd.component.html'
})
export class XdRadioButtonComponent extends CustomElement {
  /**
   * Whether the radio button is the checked one of its group.
   */
  @Property(false)
  public accessor checked!: InputSignal<boolean>;
  /**
   * Whether the radio button ignores the user.
   */
  @Property(false)
  public accessor disabled!: InputSignal<boolean>;
  /**
   * The accessible name of the radio button.
   */
  @Property<Aliased<InputSignal<string>, 'ariaLabel'>>('', { alias: 'ariaLabel' })
  public accessor accessibleLabel!: Aliased<InputSignal<string>, 'ariaLabel'>;
  /**
   * Emitted with `true` when the user clicks an unchecked radio button or presses Space on it.
   */
  @Event()
  public accessor checkedChange!: Output<boolean>;

  /**
   * The ARIA role of the host.
   */
  @HostProperty('role')
  public readonly hostRole = 'radio';

  /**
   * The tab order of the host: focusable unless the radio button is disabled.
   */
  @HostProperty('tabindex')
  public get hostTabIndex(): number {
    return this.disabled() ? -1 : 0;
  }

  /**
   * The `aria-checked` state of the host: `true` or `false`.
   */
  @HostProperty('aria-checked')
  public get hostAriaChecked(): string {
    return String(this.checked());
  }

  /**
   * The `aria-disabled` state of the host, absent while the radio button is enabled.
   */
  @HostProperty('aria-disabled')
  public get hostAriaDisabled(): string | null {
    return this.disabled() ? 'true' : null;
  }

  /**
   * The `aria-label` of the host, absent when there is no accessible name.
   */
  @HostProperty('aria-label')
  public get hostAriaLabel(): string | null {
    return this.accessibleLabel() || null;
  }

  /**
   * The `checked` class of the host, for the styles of the checked button.
   */
  @HostProperty('class.checked')
  public get hostChecked(): boolean {
    return this.checked();
  }

  /**
   * The `disabled` class of the host, for the styles of the disabled button.
   */
  @HostProperty('class.disabled')
  public get hostDisabled(): boolean {
    return this.disabled();
  }

  /**
   * Picks the radio button when the host is clicked.
   */
  @HostEvent('click')
  public onClick(): void {
    this._pick();
  }

  /**
   * Picks the radio button when Space is pressed on the host.
   */
  @HostEvent('keydown')
  public onKeydown(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
      this._pick();
    }
  }

  private _pick(): void {
    if (!this.disabled() && !this.checked()) {
      this.checkedChange.emit(true);
    }
  }
}
