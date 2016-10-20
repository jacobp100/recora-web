// @flow
import {
  __, concat, map, fromPairs, isEmpty, isEqual, compact, zip, propertyOf, over, flow, reduce, pick,
  mapValues, toPairs, update, get, curry, assign, keyBy, difference, intersection, every, filter,
  spread,
} from 'lodash/fp';
import uuid from 'uuid';
import { STORAGE_ACTION_SAVE, STORAGE_ACTION_REMOVE, STORAGE_LOCAL } from '../../types';
import type { // eslint-disable-line
  SectionId, StorageOperation, PromiseStorage, Document, StorageInterface, LocalStorageLocation,
} from '../../types';


/*
When saving the document lists, we save the document title, and a LocalStorageLocation object.
The LocalStorageLocation contains a key, sectionStorageKeys, which is pointers to the locations of
the sections local storage.

We simply save the title and text inputs of each section in a separate location, so that when
editing a document, you'll only save the sections you need to, rather than the entire document
every time.

We don't save ids for anything, that's handled by the redux reducer.

sectionStorageKeys are generated using uuid v4, so if you had 10^36 sections, there's only a 1%
chance of a collision.
*/

type Patch = {
  keysToRemove: string[],
  objToSet: { [key:string]: any },
};

const generateNewSectionId = () => uuid.v4();

const getSectionStorageKeyMap = (storageOperation: StorageOperation) => {
  const previousSectionIds = map('id', get(['previousDocument', 'sections'], storageOperation));
  const previousSectionStorageKeys = storageOperation.storageLocation.sectionStorageKeys;
  const previousSectionStorageKeyMap =
    fromPairs(zip(previousSectionIds, previousSectionStorageKeys));

  const sectionIds = map('id', get(['document', 'sections'], storageOperation));
  const nextSectionStorageValues = map(sectionId => (
    previousSectionStorageKeyMap[sectionId] || generateNewSectionId()
  ), sectionIds);
  const nextSectionStorageKeyMap = fromPairs(zip(sectionIds, nextSectionStorageValues));

  return assign(previousSectionStorageKeyMap, nextSectionStorageKeyMap);
};

const getStorageLocation = (storageOperation, sectionStorageKeyMap): LocalStorageLocation => ({
  type: STORAGE_LOCAL,
  title: storageOperation.title,
  sectionStorageKeys: flow(
    map('id'),
    map(propertyOf(sectionStorageKeyMap))
  )(storageOperation.document.sections),
});

const getStoragePairs = flow(
  mapValues(JSON.stringify),
  toPairs
);

const saveSections: (
  storageOperation: StorageOperation,
  sectionStorageKeyMap: Object,
  sectionsToSave: SectionId,
  patch: Patch
) => Patch = curry((
  storageOperation: StorageOperation,
  sectionStorageKeyMap: Object,
  sectionsToSave: SectionId,
  patch: Patch
): Patch => {
  const sectionsById = flow(
    keyBy('id'),
    mapValues(pick(['title', 'textInputs']))
  )(storageOperation.document.sections);

  const storagePairs = map(over([
    propertyOf(sectionStorageKeyMap),
    propertyOf(sectionsById),
  ]), sectionsToSave);
  const storageObj = fromPairs(storagePairs);

  return update('objToSet', assign(__, storageObj), patch);
});

const removeSections: (
  storageOperation: StorageOperation,
  sectionStorageKeyMap: Object,
  sectionsToRemove: SectionId,
  patch: Patch
) => Patch = curry((
  storageOperation: StorageOperation,
  sectionStorageKeyMap: Object,
  sectionsToRemove: SectionId,
  patch: Patch
): Patch => {
  const keysToRemove = map(propertyOf(sectionStorageKeyMap), sectionsToRemove);
  return update('keysToRemove', concat(keysToRemove), patch);
});

const sectionKeysToCheck = ['title', 'textInputs'];

const applySavePatch = (
  patch: Patch,
  storageOperation: StorageOperation,
  sectionStorageKeyMap: Object
): Patch => {
  const { document, previousDocument } = storageOperation;
  const { sections } = document;
  const sectionIds = map('id', sections);

  let addedChanged;
  let removed;

  if (previousDocument) {
    const previousSectionIds = map('id', get('sections', previousDocument));

    const sectionsById = keyBy('id', sections);
    const previousSectionsById = keyBy('id', previousDocument.sections);

    const added = difference(sectionIds, previousSectionIds);
    removed = difference(previousSectionIds, sectionIds);

    const possiblyChanged = intersection(sectionIds, previousSectionIds);

    const sectionChanged = sectionId => !every(key => (
      isEqual(get([sectionId, key], sectionsById), get([sectionId, key], previousSectionsById))
    ), sectionKeysToCheck);

    const changed = filter(sectionChanged, possiblyChanged);

    addedChanged = concat(added, changed);
  } else {
    addedChanged = sectionIds;
    removed = [];
  }

  return flow(
    saveSections(storageOperation, sectionStorageKeyMap, addedChanged),
    removeSections(storageOperation, sectionStorageKeyMap, removed)
  )(patch);
};

const applyRemovePatch = (
  patch: Patch,
  storageOperation: StorageOperation,
  sectionStorageKeyMap: Object
): Patch => {
  const allSections = map('id', storageOperation.document.sections);
  return removeSections(storageOperation, sectionStorageKeyMap, allSections, patch);
};


const storageModes = {
  [STORAGE_ACTION_SAVE]: applySavePatch,
  [STORAGE_ACTION_REMOVE]: applyRemovePatch,
};

export default (storage: PromiseStorage): StorageInterface => {
  const loadDocument = async (storageLocation: LocalStorageLocation): Document => {
    const sectionPairs = await storage.getItems(storageLocation.sectionStorageKeys);
    // Get correct ids
    const sections = map(pair => pair[1], sectionPairs);
    const document = {
      id: null,
      title: storageLocation.title,
      sections,
    };

    return document;
  };

  const updateStore = async (storageOperations: StorageOperation[]): LocalStorageLocation[] => {
    const sectionStorageKeyMaps = map(getSectionStorageKeyMap, storageOperations);
    const storageOpsSectionStorageKeys = zip(storageOperations, sectionStorageKeyMaps);

    const patch: Patch = reduce((patch, [storageOperation, sectionStorageKeyMap]) => (
      storageModes[storageOperation.action](patch, storageOperation, sectionStorageKeyMap)
    ), ({
      keysToRemove: [],
      objToSet: {},
    }: Patch), storageOpsSectionStorageKeys);

    const { keysToRemove, objToSet } = patch;

    const promises = compact([
      !isEmpty(keysToRemove) ? storage.multiRemove(keysToRemove) : null,
      !isEmpty(objToSet) ? storage.multiSet(getStoragePairs(objToSet)) : null,
    ]);

    if (!isEmpty(promises)) await Promise.all(promises);

    const storageLocations: LocalStorageLocation[] = map(
      spread(getStorageLocation),
      storageOpsSectionStorageKeys
    );

    return storageLocations;
  };

  return {
    type: 'local',
    delay: 1000,
    maxWait: 2000,
    loadDocument,
    updateStore,
  };
};
