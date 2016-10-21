// @flow
import {
  map, isEmpty, compact, zip, flow, filter, get, concat, set, groupBy, values, omit,
} from 'lodash/fp';
import uuid from 'uuid';
import { STORAGE_ACTION_SAVE, STORAGE_ACTION_REMOVE, STORAGE_LOCAL } from '../../types';
import type { // eslint-disable-line
  StorageOperation, PromiseStorage, Document, StorageInterface, LocalStorageLocation,
  StorageAccount,
} from '../../types';


const generateStorageKey = () => uuid.v4();

export default (storage: PromiseStorage): StorageInterface => {
  const loadDocuments = async (account: StorageAccount): LocalStorageLocation[] => {
    const item = await storage.getItem(account.id);
    if (!item) return [];
    const items = JSON.parse(item);
    return map(set('accountId', account.id), items);
  };

  const loadDocument = async (
    account: StorageAccount,
    storageLocation: LocalStorageLocation
  ): Document => {
    const sectionPairs = await storage.multiGet(storageLocation.sectionStorageKeys);
    const sections = map(pair => JSON.parse(pair[1]), sectionPairs);
    const document = {
      id: null,
      title: storageLocation.title,
      sections,
    };

    return document;
  };

  const updateStore = async (storageOperations: StorageOperation[]) => {
    const documentsToSave = filter({ type: STORAGE_ACTION_SAVE }, storageOperations);
    const documentsToRemove = filter({ type: STORAGE_ACTION_REMOVE }, storageOperations);

    const now = Date.now();
    const storageLocations = map(storageOperation => ({
      accountId: storageOperation.account.id,
      storageKey: get(['storageLocation', 'storageKey'], storageOperation) || generateStorageKey(),
      title: storageOperation.document.title,
      lastModified: now,
    }), documentsToSave);

    const saveOperations = flow(
      zip(storageLocations),
      map(([storageLocation, storageOperation]) => [
        storageLocation.storageKey,
        JSON.stringify(storageOperation.document),
      ])
    )(documentsToSave);

    const removeOperations = flow(
      map('storageLocation'),
      map('storageKey')
    )(documentsToRemove);

    const storageLocationsByAccount = values(groupBy('accountId', storageLocations));
    const storageLocationOperations = map(storageLocations => [
      storageLocations[0].accountId,
      JSON.stringify(map(omit(['accountId']), storageLocations)),
    ], storageLocationsByAccount);

    await Promise.all(compact([
      !isEmpty(removeOperations) ? storage.multiRemove(removeOperations) : null,
      storage.multiSet(concat(saveOperations, [storageLocationOperations])),
    ]));
  };

  return {
    type: STORAGE_LOCAL,
    delay: 1000,
    maxWait: 2000,
    loadDocuments,
    loadDocument,
    updateStore,
  };
};
