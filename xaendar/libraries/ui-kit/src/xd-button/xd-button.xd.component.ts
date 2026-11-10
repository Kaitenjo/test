import { CustomElement, HostProperty, Property, WebComponent } from '@xaendar/core';
import type { Aliased, InputSignal } from '@xaendar/core/signals';

/**
 * The color set of a button.
 */
export type XdButtonSeverity = 'primary' | 'secondary' | 'danger';
/**
 * The side of the label an icon can be on.
 */
export type XdButtonIconPosition = 'left' | 'right';
/**
 * The `type` of the native button: `submit` submits the form the button is in.
 */
export type XdButtonType = 'button' | 'submit';

/**
 * A button with an optional icon and label. The default slot adds any other content after them.
 * A native `click` of the inner button reaches the parent as `(click)`.
 */
@WebComponent({
  selector: 'xd-button',
  styleUrl: './xd-button.xd.component.scss',
  templateUrl: './xd-button.xd.component.html'
})
export class XdButtonComponent extends CustomElement {
  /**
   * The text of the button.
   */
  @Property('')
  public accessor label!: InputSignal<string>;
  /**
   * The name of the icon of `xd-icon` shown next to the label.
   */
  @Property('')
  public accessor icon!: InputSignal<string>;
  /**
   * The side of the label the icon is on.
   */
  @Property<InputSignal<XdButtonIconPosition>>('left')
  public accessor iconPos!: InputSignal<XdButtonIconPosition>;
  /**
   * Whether the button ignores the user.
   */
  @Property(false)
  public accessor disabled!: InputSignal<boolean>;
  /**
   * The color set of the button.
   */
  @Property<InputSignal<XdButtonSeverity>>('primary')
  public accessor severity!: InputSignal<XdButtonSeverity>;
  /**
   * Whether the button has no background until it is hovered.
   */
  @Property(false)
  public accessor text!: InputSignal<boolean>;
  /**
   * Whether the button has fully rounded corners.
   */
  @Property(false)
  public accessor rounded!: InputSignal<boolean>;
  /**
   * The accessible name of the button, for the ones without a label.
   */
  @Property<Aliased<InputSignal<string>, 'ariaLabel'>>('', { alias: 'ariaLabel' })
  public accessor accessibleLabel!: Aliased<InputSignal<string>, 'ariaLabel'>;
  /**
   * The type of the native button.
   */
  @Property<InputSignal<XdButtonType>>('button')
  public accessor type!: InputSignal<XdButtonType>;

  /**
   * The `disabled` class of the host, which blocks the clicks that reach it.
   */
  @HostProperty('class.disabled')
  public get hostDisabled(): boolean {
    return this.disabled();
  }

  /**
   * Whether the button shows an icon only: its label is empty (content of the slot makes it wider).
   */
  public get iconOnly(): boolean {
    return this.icon() !== '' && this.label() === '';
  }
}
