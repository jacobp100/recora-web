// @flow
import { map, keys, difference, intersection, reject, isEqual } from 'lodash/fp';
import type { SectionId } from '../types';

/* eslint-disable import/prefer-default-export */
type Items = { [key: SectionId]: any };
export const getAddedChangedRemovedSectionItems = (nextItems: Items, previousItems: Items) => {
  if (previousItems === nextItems) {
    return { added: [], removed: [], changed: [] };
  }

  const previousSectionIds = keys(previousItems);
  const nextSectionIds = keys(nextItems);

  const removed = difference(previousSectionIds, nextSectionIds);

  const added = difference(nextSectionIds, previousSectionIds);
  const itemsThatMayHaveChanged = intersection(previousSectionIds, nextSectionIds);
  const changed = reject(sectionId => isEqual(
      previousItems[sectionId],
      nextItems[sectionId]
  ), itemsThatMayHaveChanged);

  return { added, removed, changed };
};

export type PromiseStorage = {
  getItem: (key: string) => Promise<any>,
  multiGet: (key: string[]) => Promise<any>,
  setItem: (key: string, value: string) => Promise<any>,
  multiSet: (pairs: [string, string][]) => Promise<any>,
  removeItem: (key: string) => Promise<any>,
  multiRemove: (key: string[]) => Promise<any>,
};

export const getPromiseStorage = (): PromiseStorage => ({
  getItem: key =>
    Promise.resolve(global.localStorage.getItem(key)),
  multiGet: keys =>
    Promise.resolve(map(key => [key, global.localStorage.getItem(key)], keys)),
  setItem: (key, value) =>
    Promise.resolve(global.localStorage.setItem(key, value)),
  multiSet: pairs =>
    Promise.resolve(map(([key, value]) => global.localStorage.setItem(key, value), pairs)),
  removeItem: key =>
    Promise.resolve(global.localStorage.removeItem(key)),
  multiRemove: keys =>
    Promise.resolve(map(key => global.localStorage.removeItem(key), keys)),
});
