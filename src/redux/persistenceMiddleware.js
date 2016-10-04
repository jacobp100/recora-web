// @flow
import { reduce, concat, map, compact, isEmpty, isEqual, curry } from 'lodash/fp';
import { getAddedChangedRemovedSectionItems } from './util';
import type { State } from './recora'; // eslint-disable-line

type Storage = {
  getItem: (key: string) => Promise<any>,
  multiGet: (key: string) => Promise<any>,
  setItem: (key: string, value: string) => Promise<any>,
  multiSet: (pairs: [string, string][]) => Promise<any>,
  removeItem: (key: string) => Promise<any>,
  multiRemove: (key: string) => Promise<any>,
};

const simpleKeys = [
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
      entries: map('pretty', state.sectionEntries[sectionId]),
      totals: map('pretty', state.sectionTotals[sectionId]),
    }),
  },
];

const getSectionStorageKey = curry((storagePrefix, sectionId) => `${storagePrefix}-${sectionId}`);

const getDefaultStorage = () => ({
  getItem: key =>
    Promise.resolve(global.localStorage.getItem(key)),
  multiGet: keys =>
    Promise.resolve(map(key => global.localStorage.getItem(key), keys)),
  setItem: (key, value) =>
    Promise.resolve(global.localStorage.setItem(key, value)),
  multiSet: pairs =>
    Promise.resolve(map(([key, value]) => global.localStorage.setItem(key, value), pairs)),
  removeItem: key =>
    Promise.resolve(global.localStorage.removeItem(key)),
  multiRemove: keys =>
    Promise.resolve(map(key => global.localStorage.removeItem(key), keys)),
});

export default (storage: Storage = getDefaultStorage()): any => ({ getState, dispatch }) => {
  let storagePromise = Promise.resolve();

  const queueStorageOperation = callback => {
    storagePromise = storagePromise.then(callback).catch(() => {});
  };

  const getDiffForStates = (nextState, previousState) => {
    let keysToRemove;
    let pairsToSet = map(key => (
      !isEqual(previousState[key], nextState[key]) ? [key, JSON.stringify(nextState[key])] : null
    ), simpleKeys);
    pairsToSet = compact(pairsToSet);

    ({
      keysToRemove, pairsToSet, // eslint-disable-line
    } = reduce(({ keysToRemove, pairsToSet }, { query, transform, storagePrefix }) => {
      const { added, changed, removed } =
        getAddedChangedRemovedSectionItems(nextState[query], previousState[query]);

      const newKeysToRemove = map(getSectionStorageKey(storagePrefix), removed);

      const sectionsToPersist = concat(added, changed);
      const newPairsToSet = map(sectionId => [
        getSectionStorageKey(storagePrefix, sectionId),
        JSON.stringify(transform(sectionId, nextState)),
      ], sectionsToPersist);

      return {
        keysToRemove: concat(keysToRemove, newKeysToRemove),
        pairsToSet: concat(pairsToSet, newPairsToSet),
      };
    }, {
      keysToRemove: [],
      pairsToSet,
    }, proxyKeys));

    return { pairsToSet, keysToRemove };
  };

  return next => (action) => {
    const previousState: State = getState();
    const returnValue = next(action);
    const nextState: State = getState();

    const { pairsToSet, keysToRemove } = getDiffForStates(nextState, previousState);
    if (!isEmpty(keysToRemove)) queueStorageOperation(() => storage.multiRemove(keysToRemove));
    if (!isEmpty(pairsToSet)) queueStorageOperation(() => storage.multiSet(pairsToSet));

    return returnValue;
  };
};
