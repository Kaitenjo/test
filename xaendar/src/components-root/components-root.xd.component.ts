import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { Signal } from '@xaendar/core/signals';
import type { XdGridColumn } from 'ui-kit';
import type { Person } from '../types/person.types';

/**
 * The root of the application: it shows a grid filled with test data.
 */
@WebComponent({
  selector: 'components-root',
  styleUrl: './components-root.xd.component.scss',
  templateUrl: './components-root.xd.component.html'
})
export class ComponentsRootComponent extends CustomElement {
  /**
   * The test rows shown by the grid.
   */
  public readonly rows: Signal<Person[]>;
  /**
   * The columns of the grid.
   */
  public readonly columns: Signal<XdGridColumn[]>;

  private readonly _firstNames = ['Anna', 'Bruno', 'Carla', 'Dario', 'Elena', 'Fabio', 'Giulia', 'Hugo', 'Irene', 'Luca'];
  private readonly _lastNames = ['Rossi', 'Bianchi', 'Verdi', 'Neri', 'Ferrari', 'Esposito', 'Romano', 'Colombo'];
  private readonly _cities = ['Roma', 'Milano', 'Torino', 'Napoli', 'Bologna', 'Firenze', 'Genova', 'Palermo'];
  private readonly _roles = ['Developer', 'Designer', 'Product Manager', 'QA Engineer', 'DevOps', 'Analyst'];

  public constructor() {
    super();
    // Assigned here: the rows are built from the private lists above, which a field initializer would read too early
    this.rows = signal(this._createRows());
    this.columns = signal(this._createColumns());
  }

  private _createRows(): Person[] {
    const rows: Person[] = [];
    for (let i = 0; i < 1000; i++) {
      const firstName = this._firstNames[i % this._firstNames.length];
      const lastName = this._lastNames[(i * 3) % this._lastNames.length];
      rows.push({
        id: i + 1,
        name: `${firstName} ${lastName}`,
        email: `${firstName}.${lastName}${i + 1}@example.com`.toLowerCase(),
        city: this._cities[(i * 5) % this._cities.length]!,
        role: this._roles[(i * 7) % this._roles.length]!,
        age: 22 + ((i * 11) % 38),
        salary: 28000 + ((i * 2750) % 52000),
        active: i % 4 !== 0
      });
    }

    return rows;
  }

  private _createColumns(): XdGridColumn[] {
    return [
      { field: 'id', header: 'ID', sortable: true, width: '5rem' },
      { field: 'name', header: 'Name', sortable: true, filter: true },
      { field: 'email', header: 'E-mail', sortable: true, filter: true },
      { field: 'city', header: 'City', sortable: true, filter: true },
      { field: 'role', header: 'Role', sortable: true, filter: true },
      { field: 'age', header: 'Age', sortable: true, filter: true, filterType: 'numeric', align: 'end' },
      {
        field: 'salary',
        header: 'Salary',
        sortable: true,
        align: 'end',
        formatter: (value: unknown): string => `€ ${Number(value).toLocaleString('it-IT')}`
      },
      { field: 'active', header: 'Active', sortable: true, filter: true, filterType: 'boolean', formatter: (value: unknown): string => (value ? 'Yes' : 'No') }
    ];
  }
}
