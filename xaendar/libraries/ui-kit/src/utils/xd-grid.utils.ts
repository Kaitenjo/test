/**
 * Reads a value by its path (`address.city`); `null` when a step of the path is missing.
 */
export function resolveFieldData(data: unknown, field: string | undefined): unknown {
  if (data === null || data === undefined || !field) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const direct = record[field];
  if (direct !== undefined && direct !== null && direct !== '') {
    return direct;
  }

  if (!field.includes('.')) {
    return direct;
  }

  const steps = field.split('.');
  let value: unknown = data;
  for (let i = 0; i < steps.length; i++) {
    if (value === null || value === undefined) {
      return null;
    }
    value = (value as Record<string, unknown>)[steps[i] as string];
  }

  return value;
}

/**
 * True for `null`, `undefined`, an empty string and an empty array.
 */
export function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

/**
 * Structural equality of two values (arrays, dates and plain objects included).
 */
export function deepEquals(first: unknown, second: unknown, visited: WeakSet<object> = new WeakSet()): boolean {
  if (first === second) {
    return true;
  }
  if (!first || !second || typeof first !== 'object' || typeof second !== 'object') {
    return false;
  }
  if (visited.has(first) || visited.has(second)) {
    return false;
  }
  visited.add(first).add(second);

  const firstIsArray = Array.isArray(first);
  if (firstIsArray !== Array.isArray(second)) {
    return false;
  }
  if (firstIsArray) {
    const firstItems = first as unknown[];
    const secondItems = second as unknown[];
    if (firstItems.length !== secondItems.length) {
      return false;
    }
    for (let i = 0; i < firstItems.length; i++) {
      if (!deepEquals(firstItems[i], secondItems[i], visited)) {
        return false;
      }
    }

    return true;
  }

  const firstIsDate = first instanceof Date;
  if (firstIsDate !== second instanceof Date) {
    return false;
  }
  if (firstIsDate) {
    return first.getTime() === (second as Date).getTime();
  }

  const firstRecord = first as Record<string, unknown>;
  const secondRecord = second as Record<string, unknown>;
  const keys = Object.keys(firstRecord);
  if (keys.length !== Object.keys(secondRecord).length) {
    return false;
  }
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as string;
    if (!Object.prototype.hasOwnProperty.call(secondRecord, key) || !deepEquals(firstRecord[key], secondRecord[key], visited)) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two rows by the value of `field` when it is given, structurally otherwise.
 */
export function equals(first: unknown, second: unknown, field?: string): boolean {
  return field ? resolveFieldData(first, field) === resolveFieldData(second, field) : deepEquals(first, second);
}

/**
 * Lower-cases a text and strips its accents, to compare texts as a user does.
 */
export function normalizeText(text: unknown, locale?: string): string {
  return String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase(locale);
}

/**
 * Sorting comparison of two values: `order` is `1` or `-1`. Empty values always go last, whatever the order.
 */
export function compareValues(first: unknown, second: unknown, order: number, locale?: string): number {
  const firstEmpty = isEmptyValue(first);
  const secondEmpty = isEmptyValue(second);
  let result: number;

  if (firstEmpty && secondEmpty) {
    result = 0;
  } else if (firstEmpty) {
    result = order;
  } else if (secondEmpty) {
    result = -order;
  } else if (typeof first === 'string' && typeof second === 'string') {
    result = first.localeCompare(second, locale);
  } else {
    result = (first as number) < (second as number) ? -1 : (first as number) > (second as number) ? 1 : 0;
  }

  return order * result;
}

/**
 * The controls inside a header cell or a row whose own click must not sort the column or select the row.
 */
export const INTERACTIVE_SELECTOR = 'input, button, a, select, textarea, label, xd-checkbox, xd-radio-button, xd-select, xd-input-number, xd-button, .xd-grid-column-resizer';
