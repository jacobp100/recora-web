// @flow

export type DocumentId = string;
export type SectionId = string;
export type RecoraResult = { text: string, pretty: string };
export type State = {
  documents: DocumentId[],
  documentTitles: { [key:DocumentId]: string },
  documentSections: { [key:DocumentId]: SectionId[] },
  sectionTitles: { [key:SectionId]: string },
  sectionTextInputs: { [key:SectionId]: string[] },
  sectionResults: { [key:SectionId]: RecoraResult[] },
  sectionTotals: { [key:SectionId]: RecoraResult },
};

export type StorageType = string;
export const STORAGE_LOCAL: StorageType = 'local';
export const STORAGE_DROPBOX: StorageType = 'dropbox';

export type StorageAccountId = string;
export type StorageAccount = {
  id: StorageAccountId,
  type: StorageType,
  name: string,
  token: ?string,
}

export type StorageLocation = {
  accountId: StorageAccountId,
  title: string,
  lastModified: number,
};

export type LocalStorageLocation = StorageLocation & { storageKey: string };
export type DropBoxStorageBase = { path: string, rev: string };
export type DropBoxStorageLocation = StorageLocation & DropBoxStorageBase;

// Section:id and Document:id should only be used for diffing, and nothing else
// The ids are not persisted between saves
export type Section = {
  id: ?SectionId,
  title: string,
  textInputs: string[],
};
export type Document = {
  id: ?DocumentId,
  title: string,
  sections: Section,
};
export type StorageAction = string;
export const STORAGE_ACTION_SAVE: StorageAction = 'STORAGE_ACTION_SAVE';
export const STORAGE_ACTION_REMOVE: StorageAction = 'STORAGE_ACTION_REMOVE';
export type StorageOperotaion = {
  action: StorageAction,
  storageLocation: ?StorageLocation,
  document: Document, // If STORAGE_ACTION_REMOVE, document === previousDocument
  previousDocument: ?Document,
  lastRejection: any,
};
export type StorageInterface = {
  type: StorageType,
  delay: Number,
  maxWait: Number,
  loadDocuments: (state: State) => Promise<StorageLocation[]>,
  loadDocument: (location: StorageLocation, state: State) => Promise<Document>,
  updateStore: (operations: StorageOperotaion[], state: State) => Promise<(?StorageLocation)[]>,
};
