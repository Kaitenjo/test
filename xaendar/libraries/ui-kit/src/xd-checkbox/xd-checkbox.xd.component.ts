import { CustomElement, Event, HostEvent, HostProperty, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { Aliased, InputSignal } from '@xaendar/core/signals';

/**
 * A checkbox controlled by its parent: it emits the value the user asks for in `checkedChange` and shows `checked`.
 */
@WebComponent({
  selector: 'xd-checkbox',
  styleUrl: './xd-checkbox.xd.component.scss',
  templateUrl: './xd-checkbox.xd.component.html'
})
export class XdCheckboxComponent extends CustomElement {
  /**
   * Whether the checkbox is checked.
   */
  @Property(false)
  public accessor checked!: InputSignal<boolean>;
  /**
   * Whether the state is mixed (some of a group is checked): it is shown instead of `checked`.
   */
  @Property(false)
  public accessor indeterminate!: InputSignal<boolean>;
  /**
   * Whether the checkbox ignores the user.
   */
  @Property(false)
  public accessor disabled!: InputSignal<boolean>;
  /**
   * The accessible name of the checkbox.
   */
  @Property<Aliased<InputSignal<string>, 'ariaLabel'>>('', { alias: 'ariaLabel' })
  public accessor accessibleLabel!: Aliased<InputSignal<string>, 'ariaLabel'>;
  /**
   * Emitted with the new value when the user clicks the checkbox or presses Space on it.
   */
  @Event()
  public accessor checkedChange!: Output<boolean>;

  /**
   * The ARIA role of the host.
   */
  @HostProperty('role')
  public readonly hostRole = 'checkbox';

  /**
   * The tab order of the host: focusable unless the checkbox is disabled.
   */
  @HostProperty('tabindex')
  public get hostTabIndex(): number {
    return this.disabled() ? -1 : 0;
  }

  /**
   * The `aria-checked` state of the host: `mixed`, `true` or `false`.
   */
  @HostProperty('aria-checked')
  public get hostAriaChecked(): string {
    return this.indeterminate() ? 'mixed' : String(this.checked());
  }

  /**
   * The `aria-disabled` state of the host, absent while the checkbox is enabled.
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
   * The `checked` class of the host, for the styles of the checked box.
   */
  @HostProperty('class.checked')
  public get hostChecked(): boolean {
    return this.checked() && !this.indeterminate();
  }

  /**
   * The `indeterminate` class of the host, for the styles of the mixed box.
   */
  @HostProperty('class.indeterminate')
  public get hostIndeterminate(): boolean {
    return this.indeterminate();
  }

  /**
   * The `disabled` class of the host, for the styles of the disabled box.
   */
  @HostProperty('class.disabled')
  public get hostDisabled(): boolean {
    return this.disabled();
  }

  /**
   * Asks for the opposite value when the host is clicked.
   */
  @HostEvent('click')
  public onClick(): void {
    this._toggle();
  }

  /**
   * Asks for the opposite value when Space is pressed on the host.
   */
  @HostEvent('keydown')
  public onKeydown(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
      this._toggle();
    }
  }

  private _toggle(): void {
    if (!this.disabled()) {
      this.checkedChange.emit(!this.checked());
    }
  }
}
