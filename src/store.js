import { pathOr, assoc, assocPath, append, forEach, reduce } from 'ramda';

const defaultState = {
  // Array of ids to link document__ entries to
  documents: [],
  documentLocales: {},
  documentConfigs: {},
  documentTitles: {},
  documentInstances: {}, // Recora instances
  // Object of document id to array section ids (which in turn link section__ entries)
  documentSections: {},
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
  'sectionTextInputs',
  // Note that we save total texts this so totals are displayed whilst the page is loading
  // to avoid reflowing content afterwards
  'sectionTotalTexts',
];

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
    case 'SET_TITLE':
      return assocPath(['documentTitles', documentId], action.title, state);
    case 'SET_INSTANCE':
      return assocPath(['documentInstances', documentId], action.instance, state);
    case 'ADD_SECTION':
      const sectionPath = ['documentSections', documentId];
      const existingSections = pathOr([], sectionPath, state);
      return assocPath(sectionPath, append(sectionId, existingSections), state);
    case 'SET_TEXT_INPUTS':
      return assocPath(['sectionTextInputs', sectionId], action.textInputs, state);
    case 'SET_ENTRIES':
      return assocPath(['sectionEntries', sectionId], action.entries, state);
    case 'SET_TOTAL':
      return assocPath(['sectionTotals', sectionId], action.total, state);
    case 'SET_TOTAL_TEXT':
      return assocPath(['sectionTotalTexts', sectionId], action.totalText, state);
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
    });
  }
  return newState;
}
