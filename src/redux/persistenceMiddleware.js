// @flow
import { forEach, concat } from 'lodash/fp';
import { getAddedChangedRemovedSectionItems } from './util';
import type { State } from './recora'; // eslint-disable-line

const localStorageKeys = [
  'documents',
  'documentTitles',
  'documentSections',
  'sectionTitles',
];
const proxyKeys = [
  {
    storagePrefix: 'section-',
    query: 'sectionTextInputs',
    transform: (sectionId, state) => state.sectionTextInputs[sectionId],
  },
  {
    storagePrefix: 'section-preview-',
    query: 'sectionEntries',
    transform: (sectionId, state) => ({
      entries: state.sectionEntries[sectionId],
      totals: state.sectionTotals[sectionId],
    }),
  },
];

const getSectionStorageKey = sectionId => `section-${sectionId}`;

export default (): any => ({ getState, dispatch }) => next => (action) => {
  const previousState: State = getState();
  const returnValue = next(action);
  const nextState: State = getState();

  forEach(key => {
    const nextValue = nextState[key];
    if (previousState[key] !== nextValue) {
      global.localStorage.setItem(key, JSON.stringify(nextValue));
    }
  }, localStorageKeys);

  forEach(({ query, transform, storagePrefix }) => {
    const { added, changed, removed } = getAddedChangedRemovedSectionItems(
      nextState[query],
      previousState[query]
    );

    forEach(sectionId => (
      global.localStorage.removeItem(getSectionStorageKey(sectionId))
    ), removed);

    const sectionsToPersist = concat(added, changed);
    forEach(sectionId => (
      global.localStorage.setItem(
        storagePrefix + sectionId,
        JSON.stringify(transform(sectionId, nextState))
      )
    ), sectionsToPersist);
  }, proxyKeys);

  return returnValue;
};
