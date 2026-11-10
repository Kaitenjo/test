import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * An inline SVG icon, sized as the text around it and drawn in the current text color.
 */
@WebComponent({
  selector: 'xd-icon',
  styleUrl: './xd-icon.xd.component.scss',
  templateUrl: './xd-icon.xd.component.html'
})
export class XdIconComponent extends CustomElement {
  /**
   * The icon to draw (`check`, `chevron-down`, `sort-alt`, …). An unknown name draws nothing.
   */
  @Property('')
  public accessor name!: InputSignal<string>;
  /**
   * Whether the icon rotates (for loading indicators).
   */
  @Property(false)
  public accessor spin!: InputSignal<boolean>;
}
