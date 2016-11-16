// @flow
/* eslint-disable no-use-before-define */

export type DocumentId = string;
export type SectionId = string;
export type RecoraResult = {| text: string, pretty: string |};

export type StorageType = string;
export const STORAGE_LOCAL: StorageType = 'local';
export const STORAGE_DROPBOX: StorageType = 'dropbox';

export type State = {|
  documents: DocumentId[],
  documentStorageLocations: { [key:DocumentId]: StorageLocation },
  documentTitles: { [key:DocumentId]: string },
  documentSections: { [key:DocumentId]: SectionId[] },
  sectionTitles: { [key:SectionId]: string },
  sectionTextInputs: { [key:SectionId]: string[] },
  sectionResults: { [key:SectionId]: RecoraResult[] },
  sectionTotals: { [key:SectionId]: RecoraResult },
  customUnits: { [key:DocumentId]: Object },
  loadedDocuments: DocumentId[],

  quickCalculationInput: string,
  quickCalculationResult: ?Object,

  accounts: StorageAccountId[],
  accountNames: { [key:StorageAccountId]: string },
  accountTypes: { [key:StorageAccountId]: StorageType },
  accountTokens: { [key:StorageAccountId]: string },
|};

export type StorageAccountId = string;
export type StorageAccount = {|
  id: StorageAccountId,
  type: StorageType,
  name: string,
  token: ?string,
|};

export type StorageLocation = Object & {
  id: string,
  accountId: StorageAccountId,
  title: string,
  lastModified: number,
};

export type LocalStorageLocation = StorageLocation & { sectionStorageKeys: string[] };
export type DropBoxStorageBase = {| path: string, rev: string |};
export type DropBoxStorageLocation = StorageLocation & DropBoxStorageBase;

// Section:id and Document:id should only be used for diffing, and nothing else
// The ids are not persisted between saves
export type Section = {|
  id: ?SectionId,
  title: string,
  textInputs: string[],
|};
export type Document = {|
  id: ?DocumentId,
  title: string,
  sections: Section,
|};
export type StorageAction = string;
export const STORAGE_ACTION_SAVE: StorageAction = 'STORAGE_ACTION_SAVE';
export const STORAGE_ACTION_REMOVE: StorageAction = 'STORAGE_ACTION_REMOVE';
export type StorageOperation = {|
  action: StorageAction,
  storageLocation: ?StorageLocation,
  account: StorageAccount,
  document: Document, // If STORAGE_ACTION_REMOVE, document === previousDocument
  previousDocument: ?Document,
  lastRejection: any,
|};
export type StorageInterface = {|
  type: StorageType,
  delay: number,
  maxWait: number,
  loadDocuments: (account: StorageAccount) => Promise<StorageLocation[]>,
  loadDocument: (account: StorageAccount, location: StorageLocation) => Promise<Document>,
  updateStore: (operations: StorageOperation[], state: State) => Promise<(?StorageLocation)[]>,
|};
