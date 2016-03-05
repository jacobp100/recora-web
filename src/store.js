import {
  pathOr, dissoc, assoc, assocPath, append, forEach, reduce, evolve, over, lensProp, curry,
  unless, isNil, reject, equals,
} from 'ramda';

const defaultState = {
  // Array of ids to link document__ entries to
  documents: [],
  documentLocales: {},
  documentConfigs: {},
  documentTitles: {},
  // Object of document id to array section ids (which in turn link section__ entries)
  documentSections: {},
  sectionLocals: {},
  sectionInstances: {}, // Recora instances
  sectionTitles: {},
  sectionTextInputs: {},
  sectionEntries: {}, // Recora outputs
  sectionTotals: {}, // Recora outputs
  sectionTotalTexts: {},
};

const localStorageKeys = [
  'documents',
  'documentLocales',
  'documentConfigs',
  'documentTitles',
  'documentSections',
  'sectionLocals',
  'sectionTitles',
  'sectionTextInputs',
  // Note that we save total texts this so totals are displayed whilst the page is loading
  // to avoid reflowing content afterwards
  'sectionTotalTexts',
];

// Old version of Ramda...
const without = curry((value, list) => reject(equals(value), list));

function saveToLocalStorage(state) {
  forEach(storageKey => {
    localStorage.setItem(storageKey, JSON.stringify(state[storageKey]));
  }, localStorageKeys);
}

function loadFromLocalStorage() {
  return reduce((state, storageKey) => {
    let value = localStorage.getItem(storageKey);
    if (value !== null) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        value = null;
      }
    }
    if (value !== null) {
      return assoc(storageKey, value, state);
    }
    return state;
  }, defaultState, localStorageKeys);
}

function reducer(action, state) {
  const { type, documentId, sectionId } = action || {};

  switch (type) {
    case 'ADD_DOCUMENT':
      const documentPath = ['documents'];
      const existingDocuments = pathOr([], documentPath, state);
      return assocPath(documentPath, append(documentId, existingDocuments), state);
    case 'SET_LOCALE':
      return assocPath(['documentLocales', documentId], action.locale, state);
    case 'SET_CONFIG':
      return assocPath(['documentConfigs', documentId], action.config, state);
    case 'SET_DOCUMENT_TITLE':
      return assocPath(['documentTitles', documentId], action.title, state);
    case 'ADD_SECTION':
      const sectionPath = ['documentSections', documentId];
      const existingSections = pathOr([], sectionPath, state);
      return assocPath(sectionPath, append(sectionId, existingSections), state);
    case 'SET_LOCALS':
      return assocPath(['sectionLocals', sectionId], action.locals, state);
    case 'SET_INSTANCE':
      return assocPath(['sectionInstances', sectionId], action.instance, state);
    case 'SET_SECTION_TITLE':
      return assocPath(['sectionTitles', sectionId], action.title, state);
    case 'SET_TEXT_INPUTS':
      return assocPath(['sectionTextInputs', sectionId], action.textInputs, state);
    case 'SET_ENTRIES':
      return assocPath(['sectionEntries', sectionId], action.entries, state);
    case 'SET_TOTAL':
      return assocPath(['sectionTotals', sectionId], action.total, state);
    case 'SET_TOTAL_TEXT':
      return assocPath(['sectionTotalTexts', sectionId], action.totalText, state);
    case 'SET_SECTIONS':
      return assocPath(['documentSections', documentId], action.sectionIds, state);
    case 'DELETE_DOCUMENT':
      const dropDocumentId = dissoc(documentId);
      return evolve({
        documents: without(documentId),
        documentLocales: dropDocumentId,
        documentConfigs: dropDocumentId,
        documentTitles: dropDocumentId,
        documentSections: dropDocumentId,
      }, state);
    case 'DELETE_SECTION':
      const dropSectionId = dissoc(sectionId);
      return evolve({
        documentSections: over(
          lensProp(documentId),
          unless(isNil, without(sectionId))
        ),
        sectionLocals: dropSectionId,
        sectionInstances: dropSectionId,
        sectionTitles: dropSectionId,
        sectionTextInputs: dropSectionId,
        sectionEntries: dropSectionId,
        sectionTotals: dropSectionId,
        sectionTotalTexts: dropSectionId,
      }, state);
    default:
      return state;
  }
}

let timeout = null;
export default function store(state = loadFromLocalStorage(), action) {
  const newState = reducer(action, state);
  if (state !== newState) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      saveToLocalStorage(newState);
    }, 50);
  }
  return newState;
}
