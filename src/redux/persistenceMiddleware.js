// @flow
import {
  reduce, concat, map, fromPairs, isEmpty, isEqual, curry, over, constant, partial, flow, assign,
  pickBy, omitBy, keys, toPairs, mapValues, zip, get, pick, mapKeys, isNil,
} from 'lodash/fp';
import { debounce } from 'lodash';
import { getAddedChangedRemovedSectionItems, getPromiseStorage } from './util';
import { mergeState } from '.';
import type { PromiseStorage } from './util'; // eslint-disable-line
import type { State, DocumentId } from '../types';


const LOAD_DOCUMENT = 'persintance-middleware:LOAD_DOCUMENT';

const sectionTextInputStoragePrefix = 'section';
const sectionPreviewPrefix = 'section-preview';

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
      resultTexts: map('pretty', state.sectionResults[sectionId]),
      totalTexts: map('pretty', state.sectionTotals[sectionId]),
    }),
  },
];

const getSectionStorageKey =
  curry((storagePrefix, sectionId) => `${storagePrefix}::${sectionId}`);
const getSectionFromStorageKey =
  curry((storagePrefix, storageKey) => storageKey.substring(storagePrefix.length + 2));


const getPatchForStates = (nextState, previousState) => {
  const simplePatch = flow(
    map(key => [key, !isEqual(previousState[key], nextState[key]) ? nextState[key] : null]),
    fromPairs,
    omitBy(isNil)
  )(simpleKeys);

  const proxyPatch = reduce((proxyPatch, { query, transform, storagePrefix }) => {
    const getStorageKey = getSectionStorageKey(storagePrefix);
    const { added, changed, removed } =
      getAddedChangedRemovedSectionItems(nextState[query], previousState[query]);

    const removePatch = flow(
      map(over([getStorageKey, constant(null)])),
      fromPairs
    )(removed);

    const sectionsToPersist = concat(added, changed);
    const setPatch = flow(
      map(over([getStorageKey, partial(transform, [nextState])])),
      fromPairs,
    )(sectionsToPersist);

    const newPatch = assign(setPatch, removePatch);
    return assign(proxyPatch, newPatch);
  }, {}, proxyKeys);

  return assign(simplePatch, proxyPatch);
};

const storagePairsToMap = flow(
  fromPairs,
  omitBy(isNil),
  mapValues(JSON.parse)
);

export default (storage: PromiseStorage = getPromiseStorage()): any => ({ getState, dispatch }) => {
  let storagePromise = Promise.resolve();
  let storagePatch = {};

  const queueStorageOperation = callback => {
    storagePromise = storagePromise.then(callback).catch(() => {});
  };

  const doSave = async () => {
    try {
      if (isEmpty(storagePatch)) return;

      const keysToRemove = flow(pickBy(isNil), keys)(storagePatch);
      const pairsToSet = flow(omitBy(isNil), mapValues(JSON.stringify), toPairs)(storagePatch);

      if (keysToRemove) await storage.multiRemove(keysToRemove);
      if (pairsToSet) await storage.multiSet(pairsToSet);
      // Only clear the patch if we successfuly write the operations
      storagePatch = {};
    } catch (e) {
      return;
    }
  };

  const doLoadSimpleState = async () => {
    const values = await storage.multiGet(simpleKeys);
    const patch = flow(
      zip(simpleKeys),
      storagePairsToMap
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

    const allMap = flow(
      zip(allKeys),
      storagePairsToMap
    )(allValues);

    const sectionTextInputs = flow(
      pick(sectionStorageKeys),
      mapKeys(getSectionFromStorageKey(sectionTextInputStoragePrefix))
    )(allMap);

    const textToRecoraResult = pretty => ({ pretty });
    const { resultTexts: sectionResults, totalTexts: sectionTotals } = flow(
      pick(sectionPreviewStorageKeys),
      mapKeys(getSectionFromStorageKey(sectionPreviewPrefix)),
      mapValues(map(textToRecoraResult))
    )(allMap);

    const patch = omitBy(isNil, { sectionTextInputs, sectionResults, sectionTotals });
    if (!isEmpty(patch)) dispatch(mergeState(patch));
  };

  const queuePatch = debounce(() => {
    queueStorageOperation(doSave);
  }, 1000, { maxWait: 2000 });

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
