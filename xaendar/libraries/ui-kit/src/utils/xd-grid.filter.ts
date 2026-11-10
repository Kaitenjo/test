import type { XdGridFilterMatchMode } from '../types/xd-grid.types';
import { deepEquals, normalizeText } from './xd-grid.utils';

/**
 * A filter constraint: true when `value` satisfies `filter`.
 */
export type XdGridFilterConstraint = (value: any, filter: any, locale?: string) => boolean;

const filterIsBlank = (filter: unknown): boolean => filter === undefined || filter === null || (typeof filter === 'string' && filter.trim() === '');

const timeOf = (value: unknown): number | undefined => (value instanceof Date ? value.getTime() : undefined);

const matchEquals: XdGridFilterConstraint = (value, filter, locale) => {
  if (filterIsBlank(filter)) {
    return true;
  }
  if (value === undefined || value === null) {
    return false;
  }
  const valueTime = timeOf(value);
  const filterTime = timeOf(filter);
  if (valueTime !== undefined && filterTime !== undefined) {
    return valueTime === filterTime;
  }

  return value == filter || normalizeText(value, locale) === normalizeText(filter, locale);
};

const matchNotEquals: XdGridFilterConstraint = (value, filter, locale) => {
  if (filterIsBlank(filter)) {
    return false;
  }
  if (value === undefined || value === null) {
    return true;
  }

  return !matchEquals(value, filter, locale);
};

/**
 * Compares with `<`, `<=`, `>`, `>=` by the timestamp when both are dates.
 */
const compareWith = (test: (value: any, filter: any) => boolean): XdGridFilterConstraint => (value, filter) => {
  if (filter === undefined || filter === null) {
    return true;
  }
  if (value === undefined || value === null) {
    return false;
  }
  const valueTime = timeOf(value);
  const filterTime = timeOf(filter);

  return valueTime !== undefined && filterTime !== undefined ? test(valueTime, filterTime) : test(value, filter);
};

const matchLessThan = compareWith((value, filter) => value < filter);
const matchGreaterThan = compareWith((value, filter) => value > filter);

const textConstraint = (test: (value: string, filter: string) => boolean, whenBlank: boolean, stringOnly: boolean): XdGridFilterConstraint => (value, filter, locale) => {
  if (filter === undefined || filter === null || ((stringOnly || typeof filter === 'string') && String(filter).trim() === '')) {
    return whenBlank;
  }
  if (value === undefined || value === null) {
    return false;
  }

  return test(normalizeText(value, locale), normalizeText(filter, locale));
};

/**
 * The match modes of the column filters and of the global filter, by name.
 */
export const filterConstraints: Record<XdGridFilterMatchMode, XdGridFilterConstraint> = {
  startsWith: textConstraint((value, filter) => value.startsWith(filter), true, true),
  contains: textConstraint((value, filter) => value.includes(filter), true, false),
  notContains: textConstraint((value, filter) => !value.includes(filter), true, false),
  endsWith: textConstraint((value, filter) => value.endsWith(filter), true, true),
  equals: matchEquals,
  notEquals: matchNotEquals,
  in: (value, filter) => {
    if (!Array.isArray(filter) || filter.length === 0) {
      return true;
    }
    for (let i = 0; i < filter.length; i++) {
      if (deepEquals(value, filter[i])) {
        return true;
      }
    }

    return false;
  },
  between: (value, filter) => {
    if (!Array.isArray(filter) || filter[0] === null || filter[0] === undefined || filter[1] === null || filter[1] === undefined) {
      return true;
    }
    if (value === undefined || value === null) {
      return false;
    }
    const valueTime = timeOf(value);

    return valueTime === undefined ? filter[0] <= value && value <= filter[1] : filter[0].getTime() <= valueTime && valueTime <= filter[1].getTime();
  },
  lt: matchLessThan,
  lte: compareWith((value, filter) => value <= filter),
  gt: matchGreaterThan,
  gte: compareWith((value, filter) => value >= filter),
  is: matchEquals,
  isNot: matchNotEquals,
  before: matchLessThan,
  after: matchGreaterThan,
  dateIs: (value, filter) => filter === undefined || filter === null || (value !== undefined && value !== null && value.toDateString() === filter.toDateString()),
  dateIsNot: (value, filter) => filter === undefined || filter === null || (value !== undefined && value !== null && value.toDateString() !== filter.toDateString()),
  dateBefore: (value, filter) => filter === undefined || filter === null || (value !== undefined && value !== null && value.getTime() < filter.getTime()),
  dateAfter: (value, filter) => filter === undefined || filter === null || (value !== undefined && value !== null && value.getTime() > filter.getTime())
};
