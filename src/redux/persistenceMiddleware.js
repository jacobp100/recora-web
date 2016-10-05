// @flow
import {
  reduce, concat, map, fromPairs, isEmpty, isEqual, curry, over, constant, partial, flow, assign,
  pickBy, omitBy, isNull, keys, toPairs, mapValues, zip, get, pick,
} from 'lodash/fp';
import { debounce } from 'lodash';
import { getAddedChangedRemovedSectionItems, getPromiseStorage } from './util';
import { mergeState } from '.';
import type { PromiseStorage } from './util'; // eslint-disable-line
import type { State, DocumentId } from '../types';


const LOAD_DOCUMENT = 'persintance-middleware:LOAD_DOCUMENT';

const sectionTextInputStoragePrefix = 'section-';
const sectionPreviewPrefix = 'section-preview-';

const simpleKeys = [
  'documents',
  'documentTitles',
  'documentSections',
  'sectionTitles',
];
const proxyKeys = [
  {
    storagePrefix: sectionTextInputStoragePrefix,
    query: 'sectionTextInputs',
    transform: (state, sectionId) => state.sectionTextInputs[sectionId],
  },
  {
    storagePrefix: sectionPreviewPrefix,
    query: 'sectionResults',
    transform: (state, sectionId) => ({
      entries: map('pretty', state.sectionResults[sectionId]),
      totals: map('pretty', state.sectionTotals[sectionId]),
    }),
  },
];

const getSectionStorageKey = curry((storagePrefix, sectionId) => `${storagePrefix}-${sectionId}`);


const getPatchForStates = (nextState, previousState) => {
  const simplePatch = flow(
    map(key => (!isEqual(previousState[key], nextState[key]) ? [key, nextState[key]] : null)),
    fromPairs,
  )(simpleKeys);

  const proxyPatch = reduce((pairsToSet, { query, transform, storagePrefix }) => {
    const getStorageKey = getSectionStorageKey(storagePrefix);
    const { added, changed, removed } =
      getAddedChangedRemovedSectionItems(nextState[query], previousState[query]);

    const removePatch = map(over([
      getStorageKey,
      constant(null),
    ]), removed);

    const sectionsToPersist = concat(added, changed);
    const setPatch = map(over([
      getStorageKey,
      partial(transform, [nextState]),
    ]), sectionsToPersist);

    return assign(setPatch, removePatch);
  }, {}, proxyKeys);

  return assign(simplePatch, proxyPatch);
};

export default (storage: PromiseStorage = getPromiseStorage()): any => ({ getState, dispatch }) => {
  let storagePromise = Promise.resolve();
  let storagePatch = {};

  const queueStorageOperation = callback => {
    storagePromise = storagePromise.then(callback).catch(() => {});
  };

  const doSave = async () => {
    try {
      if (isEmpty(storagePatch)) return;

      const keysToRemove = flow(pickBy(isNull), keys)(storagePatch);
      const pairsToSet = flow(omitBy(isNull), mapValues(JSON.stringify), toPairs)(storagePatch);

      if (keysToRemove) await storage.multiRemove(keysToRemove);
      if (pairsToSet) await storage.multiSet(pairsToSet);
      // Only clear the patch if we successfuly write the operations
      storagePatch = {};
    } catch (e) {
      return;
    }
  };

  const doLoadSimpleState = async () => {
    const values = storage.multiGet(simpleKeys);
    const patch = flow(
      zip(simpleKeys),
      omitBy(isNull)
    )(values);
    if (!isEmpty(patch)) dispatch(mergeState(patch));
  };

  const doLoadDocument = async (documentId, state) => {
    const sectionIds = get(['documentSections', documentId], state);

    if (!sectionIds) return;

    const sectionStorageKeys = map(getSectionStorageKey(sectionTextInputStoragePrefix), sectionIds);
    const sectionPreviewStorageKeys = map(getSectionStorageKey(sectionPreviewPrefix), sectionIds);
    const allKeys = concat(sectionStorageKeys, sectionPreviewStorageKeys);
    const allValues = await storage.multiGet(allKeys);

    const toSectionIdMap = flow(
      zip(sectionIds),
      fromPairs
    );

    const sectionTextInputs = flow(
      pick(sectionStorageKeys),
      toSectionIdMap
    )(allValues);

    const toRecoraResult = pretty => ({ pretty });
    const { entries: sectionResults, totals: sectionTotals } = flow(
      pick(sectionPreviewStorageKeys),
      toSectionIdMap,
      mapValues(map(toRecoraResult))
    )(allValues);

    const patch = { sectionTextInputs, sectionResults, sectionTotals };
    dispatch(mergeState(patch));
  };

  const queuePatch = debounce(() => {
    queueStorageOperation(doSave);
  }, 2000, { maxWait: 5000 });

  const applyPatch = patch => {
    if (!isEmpty(patch)) {
      storagePatch = assign(storagePatch, patch);
      queuePatch();
    }
  };

  queueStorageOperation(doLoadSimpleState);


  return next => (action) => {
    const previousState: State = getState();
    const returnValue = next(action);

    if (action.type === LOAD_DOCUMENT) {
      doLoadDocument(action.documentId, previousState);
    } else {
      const nextState: State = getState();
      const patch = getPatchForStates(nextState, previousState);
      applyPatch(patch);
    }

    return returnValue;
  };
};

export const loadDocument = (documentId: DocumentId) =>
  ({ type: LOAD_DOCUMENT, documentId });
