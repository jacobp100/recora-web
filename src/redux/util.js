// @flow
import { keys, difference, intersection, reject, isEqual } from 'lodash/fp';
import type { SectionId } from '../types';
import type { State } from './recora'; // eslint-disable-line

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
