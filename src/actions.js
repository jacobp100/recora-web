import {
  map, reduce, head, tail, contains, flatten, values, forEach, groupBy, prop, pipe,
} from 'ramda';
import Recora from 'recora';
import { ADD as add } from 'recora/src/math';
import { toString as typeToString } from 'recora/src/types/types';

const keyBy = pipe(groupBy, map(head));
const entryResult = entry => entry && entry.result;

const nextId = (key, existingIds) => {
  let newId;
  let i = 0;
  do {
    i += 1;
    newId = key + String(i);
  } while (contains(newId, existingIds));
  return newId;
};

export const setTextInputs = (documentId, sectionId, textInputs, useCache = true) =>
  (dispatch, getState) => {
    const { sectionEntries, documentInstances } = getState();
    const instance = documentInstances[documentId];
    const existingEntries = sectionEntries[sectionId] || [];
    const entryCache = useCache ? keyBy(prop('text'), existingEntries) : {};
    const entries = map(textInput => (
      entryCache[textInput] || instance.parse(textInput)
    ), textInputs);
    const context = instance && instance.getContext();
    const total = reduce(
      (lhs, rhs) => (lhs && rhs) ? add(context, lhs, rhs) : lhs,
      entryResult(head(entries)),
      map(entryResult, tail(entries))
    );
    const totalText = total && typeToString(context, total);
    dispatch({ type: 'SET_TEXT_INPUTS', documentId, sectionId, textInputs });
    dispatch({ type: 'SET_ENTRIES', documentId, sectionId, entries });
    dispatch({ type: 'SET_TOTAL', documentId, sectionId, total });
    dispatch({ type: 'SET_TOTAL_TEXT', documentId, sectionId, totalText });
  };

export const addSection = (documentId) => (dispatch, getState) => {
  const { documentSections } = getState();
  const sectionId = nextId('section-', flatten(values(documentSections)));
  dispatch({ type: 'ADD_SECTION', documentId, sectionId });
  dispatch(setTextInputs(documentId, sectionId, []));
};

export const setConfig = (documentId, locale, config) => (dispatch, getState) => {
  const { documentSections, sectionTextInputs } = getState();
  const instance = new Recora(locale, config);
  dispatch({ type: 'SET_LOCALE', documentId, locale });
  dispatch({ type: 'SET_CONFIG', documentId, config });
  dispatch({ type: 'SET_INSTANCE', documentId, instance });

  // Force recalculate all sections
  const sections = documentSections[documentId];
  forEach(sectionId => {
    const textInputs = sectionTextInputs[sectionId];
    dispatch(setTextInputs(documentId, sectionId, textInputs, false));
  }, sections);
};

export const setTitle = (documentId, title) => (
  { type: 'SET_TITLE', documentId, title }
);

export const addDocument = () => (dispatch, getState) => {
  const { documents } = getState();
  const documentId = nextId('document-', documents);
  dispatch({ type: 'ADD_DOCUMENT', documentId });
  dispatch(setTitle(documentId, 'New Document'));
  dispatch(addSection(documentId));
  // FIXME
  dispatch(setConfig(documentId, 'en', { currentYear: 2016, currentMonth: 1, currentDate: 1 }));
};

export const loadDocument = (documentId) => (dispatch, getState) => {
  const { documentLocales, documentConfigs, documentInstances } = getState();
  if (documentInstances[documentId]) {
    return;
  }
  const locale = documentLocales[documentId];
  const config = documentConfigs[documentId];
  // Calls into setTextInputs, causing entire the document to be calculated
  dispatch(setConfig(documentId, locale, config));
};
