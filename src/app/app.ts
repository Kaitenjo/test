import { CUSTOM_ELEMENTS_SCHEMA, Component, signal } from '@angular/core';
import type { XdGridColumn } from '@xaendar/ui-kit';
import type { Person } from './person';

/**
 * The root of the application: it shows the Xaendar grid (xd-grid) filled with test data.
 */
@Component({
  selector: 'app-root',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /**
   * The test rows shown by the grid.
   */
  protected readonly rows = signal<Person[]>(this._createRows());
  /**
   * The columns of the grid.
   */
  protected readonly columns = signal<XdGridColumn[]>(this._createColumns());

  private _createRows(): Person[] {
    const firstNames = ['Anna', 'Bruno', 'Carla', 'Dario', 'Elena', 'Fabio', 'Giulia', 'Hugo', 'Irene', 'Luca'];
    const lastNames = ['Rossi', 'Bianchi', 'Verdi', 'Neri', 'Ferrari', 'Esposito', 'Romano', 'Colombo'];
    const cities = ['Roma', 'Milano', 'Torino', 'Napoli', 'Bologna', 'Firenze', 'Genova', 'Palermo'];
    const roles = ['Developer', 'Designer', 'Product Manager', 'QA Engineer', 'DevOps', 'Analyst'];
    const rows: Person[] = [];
    for (let i = 0; i < 10000; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[(i * 3) % lastNames.length];
      rows.push({
        id: i + 1,
        name: `${firstName} ${lastName}`,
        email: `${firstName}.${lastName}${i + 1}@example.com`.toLowerCase(),
        city: cities[(i * 5) % cities.length]!,
        role: roles[(i * 7) % roles.length]!,
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
