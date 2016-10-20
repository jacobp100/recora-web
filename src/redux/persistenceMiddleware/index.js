// @flow
import {
  __, isEqual, some, get, isEmpty, filter, difference, intersection, every, overSome, propertyOf,
  forEach, mapValues, curry, keys, keyBy, map, concat, fromPairs, zip, flow, assign, pick, omit,
  overEvery, has, includes,
} from 'lodash/fp';
import { debounce } from 'lodash';
import { STORAGE_ACTION_SAVE, STORAGE_ACTION_REMOVE } from '../../types';
import { updateDocumentStorageLocations, setDocuments, setDocument } from '../index';
import { getPromiseStorage } from './promiseStorage';
import asyncStorageImplementation from './asyncStorageImplementation';
import type { // eslint-disable-line
  State, DocumentId, Document, StorageType, StorageAction, StorageOperation,
} from '../../types';

/*
This handles both saving the documents records (only the ids, storage locations, and titles) to the
local storage, and the contents of the documents (ids, titles, sections, sectionTitles,
sectionTextInputs) to whatever implementation they use. The implementation could simply be local
storage, or it could be something like Dropbox or Google Drive.

For both document records and document contents, diffing between two states is used to determine
what changed.

For the saving of the document records, we just use the next and previous state.

For document contents, we work out if a document changed using the next and previous state, and
create a timeout for the implementation to save all changed documents after a certain time. When
the timeout is fired, we use what the state was the last time the implementation saved and the
now current state to determine what documents changed, and request that the implementation saves
those documents. For the first timeout, we use the previous redux state in the reducer.

All document updates are sent as a batch, and we don't allow a single implementation to have
multiple requests happening at a time.
*/

const LOAD_DOCUMENTS = 'persistence-middleware:LOAD_DOCUMENTS';
const LOAD_DOCUMENT = 'persistence-middleware:LOAD_DOCUMENT';

const documentsStorageKey = 'documents';
const keysToCheckForSave = ['documents', 'documentStorageLocations', 'documentTitles'];

// TODO: Disable on prod
const getOrThrow = (path, source) => {
  if (!has(path, source)) {
    const message = `Expected ${path} to exist in ${JSON.stringify(source)}`;
    console.error(message); // eslint-disable-line
    throw new Error(message);
  }
  return get(path, source);
};

const documentsListNeedsUpdating = (nextState, previousState) => (
  some(key => !isEqual(nextState[key], previousState[key]), keysToCheckForSave)
);

// The document *should* be loaded to call this: deliberately use stuff that will throw if not
// the case
const getDocumentFromState = curry((state: State, documentId: DocumentId): ?Document => ({
  id: documentId,
  title: state.documentTitles[documentId],
  sections: map(sectionId => ({
    id: sectionId,
    title: getOrThrow(['sectionTitles', sectionId], state),
    textInputs: getOrThrow(['sectionTextInputs', sectionId], state),
  }), state.documentSections[documentId]),
}));

// TODO: if a storage location changes by type, persist; change in any other way, ignore
const documentKeysToPersist = ['documentTitles', 'documentSections'];
const sectionKeysToPersist = ['sectionTitles', 'sectionTextInputs'];

const loadedDocumentsForType = (state, storageType) => flow(
  filter(id => get(['documentStorageLocations', id, 'type'], state) === storageType),
  filter(id => includes(id, state.loadedDocuments))
)(state.documents);

const addedDocuments = (
  nextState,
  previousState,
  nextDocuments,
  previousDocuments
) => {
  // Document wasn't loaded via loadDocuments
  const documentIsNew = documentId => !(documentId in previousState.documentStorageLocations);
  return filter(documentIsNew, difference(nextDocuments, previousDocuments));
};

const removedDocuments = (
  nextState,
  previousState,
  nextDocuments,
  previousDocuments
) => difference(previousDocuments, nextDocuments);

const changedDocuments = (
  nextState,
  previousState,
  nextDocuments,
  previousDocuments,
) => {
  const possiblyChanged = intersection(nextDocuments, previousDocuments);

  const valuesChangedBetweenStates = curry((keys, id) => !every(key => (
    isEqual(get([key, id], nextState), get([key, id], previousState))
  ), keys));

  const documentChanged = valuesChangedBetweenStates(documentKeysToPersist);
  const sectionsChanged = documentId => some(
    valuesChangedBetweenStates(sectionKeysToPersist),
    nextState.documentSections[documentId]
  );

  const changed = filter(overSome([
    documentChanged,
    sectionsChanged,
  ]), possiblyChanged);

  return changed;
};

const noChangeInDocuments = overEvery([
  flow(addedDocuments, isEmpty),
  flow(removedDocuments, isEmpty),
  flow(changedDocuments, isEmpty),
]);

const addedRemovedChangedArgsForType = (nextState, previousState, storageType) => {
  const previousDocumentsForStorageType =
    loadedDocumentsForType(previousState, storageType);
  const nextDocumentsForStorageType =
    loadedDocumentsForType(nextState, storageType);

  const args = [
    nextState,
    previousState,
    nextDocumentsForStorageType,
    previousDocumentsForStorageType,
  ];

  return args;
};

const hasDocumentChangesForStorageType = (
  nextState: State,
  previousState: State,
) => (storageType: StorageType) => {
  const args = addedRemovedChangedArgsForType(nextState, previousState, storageType);

  return !noChangeInDocuments(...args);
};

const getChangedDocumentsForStorageType = (
  nextState: State,
  previousState: State,
  storageType: StorageType,
) => {
  const args = addedRemovedChangedArgsForType(nextState, previousState, storageType);

  return {
    added: addedDocuments(...args),
    removed: removedDocuments(...args),
    changed: changedDocuments(...args),
  };
};

export default (
  storage = getPromiseStorage(),
  storageImplementations = [asyncStorageImplementation(storage)]
): any => ({ getState, dispatch }) => {
  const storages = keyBy('type', storageImplementations);
  const storageTypes = keys(storages);

  let storagePromise = Promise.resolve();
  const promisesPerStorageType = {};

  // Used by storage implementations to work out *how* a document changed
  let lastDocumentById = {};
  // Used by storage implementation to attempt recovery
  const lastRejectionPerStorageType = {};
  // Used by this middleware to work out *what* documents changed
  const lastStatePerStorageType = {};

  const queueStorageOperation = callback => {
    storagePromise = storagePromise.then(callback, () => {});
  };

  const queueImplementationStorageOperation = (storageType, callback) => {
    const existingPromise = promisesPerStorageType[storageType] || Promise.resolve();
    const returnValue = existingPromise.then(() => callback(storageType));
    promisesPerStorageType[storageType] = returnValue.catch(() => {});
    return returnValue;
  };

  const doLoadDocument = async (documentId) => {
    const storageLocation = get(['documentStorageLocations', documentId], getState());
    const storageType = get('type', storageLocation);
    const storageImplementation = getOrThrow(storageType, storages);

    const document = await queueImplementationStorageOperation(storageType, () => (
      storageImplementation.loadDocument(storageLocation)
    ));

    // document is sent without ids, and when we dispatch setDocument, they are set
    dispatch(setDocument(documentId, document));

    // Reconstruct the document from the state to get a document with ids
    const documentWithFixedIds = getDocumentFromState(getState(), documentId);
    lastDocumentById[documentId] = documentWithFixedIds;

    return documentWithFixedIds;
  };

  const doLoadDocumentsList = async () => {
    const savedDocuments = await storage.getItem(documentsStorageKey);
    if (!savedDocuments) return;
    const documentRecords = JSON.parse(savedDocuments);
    dispatch(setDocuments(documentRecords));
  };

  const doSaveDocumentsList = async () => {
    const { documents, documentStorageLocations } = getState();
    const documentRecords = map(propertyOf(documentStorageLocations), documents);
    await storage.setItem(documentsStorageKey, JSON.stringify(documentRecords));
  };

  const doUpdateStorageImplementation = async (storageType) => {
    const lastState = lastStatePerStorageType[storageType];
    const currentState = getState();

    const { added, changed, removed } = getChangedDocumentsForStorageType(
      currentState,
      lastState,
      storageType
    );

    const addedChanged = concat(added, changed);

    const currentDocumentById = flow(
      map(getDocumentFromState(currentState)),
      zip(addedChanged),
      fromPairs
    )(addedChanged);

    const getStorageOperation = curry((
      action: StorageAction,
      documentId: DocumentId
    ): StorageOperation => ({
      action,
      storageLocation: get(['documentStorageLocations', documentId], currentState),
      document: action !== STORAGE_ACTION_REMOVE
        ? getOrThrow(documentId, currentDocumentById)
        : getOrThrow(documentId, lastDocumentById),
      previousDocument: lastDocumentById[documentId],
      lastRejection: lastRejectionPerStorageType[storageType],
    }));

    const storageOperations = concat(
      map(getStorageOperation(STORAGE_ACTION_SAVE), addedChanged),
      map(getStorageOperation(STORAGE_ACTION_REMOVE), removed)
    );

    try {
      const storageLocations = !isEmpty(storageOperations)
        ? await storages[storageType].updateStore(storageOperations)
        : null;

      lastDocumentById = flow(
        omit(removed),
        assign(__, pick(addedChanged, currentDocumentById))
      )(lastDocumentById);

      lastStatePerStorageType[storageType] = currentState;
      lastRejectionPerStorageType[storageType] = null;

      if (storageLocations) {
        const documents = map('document', storageOperations);
        const documentIds = map('id', documents);

        const newStorageLocations = fromPairs(zip(documentIds, storageLocations));
        dispatch(updateDocumentStorageLocations(newStorageLocations));

        if (documentsListNeedsUpdating(getState(), currentState)) await doSaveDocumentsList();
      }
    } catch (e) {
      // leave lastStatePerStorageType so we can pick up from there
      lastRejectionPerStorageType[storageType] = e;
    }
  };

  const storageImplementationQueueMap = mapValues(storageImplementation => (
    debounce(() => {
      queueImplementationStorageOperation(
        storageImplementation.type,
        doUpdateStorageImplementation
      );
    }, storageImplementation.delay, { maxWait: storageImplementation.maxWait })
  ), storages);

  const queueUpdateStorageImplementation = previousState => storageType => {
    if (!lastStatePerStorageType[storageType]) lastStatePerStorageType[storageType] = previousState;

    // Can we set a list of all storageTypes that will be updated so that between now and until the
    // debounce callback is called, we don't bother checking for the document changes for this type
    storageImplementationQueueMap[storageType]();
  };

  return next => (action) => {
    const previousState: State = getState();
    const returnValue = next(action);

    if (action.type === LOAD_DOCUMENT) return doLoadDocument(action.documentId);
    if (action.type === LOAD_DOCUMENTS) return queueStorageOperation(doLoadDocumentsList);

    const nextState: State = getState();

    const storageTypesWithChanges = filter(
      hasDocumentChangesForStorageType(nextState, previousState),
      storageTypes
    );
    forEach(queueUpdateStorageImplementation(previousState), storageTypesWithChanges);

    return returnValue;
  };
};

export const loadDocuments = () =>
  ({ type: LOAD_DOCUMENTS });
export const loadDocument = (documentId: DocumentId) =>
  ({ type: LOAD_DOCUMENT, documentId });
