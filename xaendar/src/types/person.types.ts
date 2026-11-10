/**
 * A person of the test data shown by the grid.
 */
export interface Person {
  /**
   * The unique identifier of the person.
   */
  id: number;
  /**
   * The full name.
   */
  name: string;
  /**
   * The e-mail address.
   */
  email: string;
  /**
   * The city of residence.
   */
  city: string;
  /**
   * The job role.
   */
  role: string;
  /**
   * The age in years.
   */
  age: number;
  /**
   * The yearly salary in euros.
   */
  salary: number;
  /**
   * Whether the person is currently active.
   */
  active: boolean;
}
