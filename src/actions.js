import {
  map, reduce, head, tail, contains, flatten, values, forEach, groupBy, prop, pipe, toPairs,
  fromPairs,
} from 'ramda';
import Recora from 'recora';
import { ADD as add } from 'recora/src/math';
import { toString as typeToString } from 'recora/src/types/types';
import defaultSi from 'recora/src/data/environment/si';

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
    const { sectionInstances, sectionEntries } = getState();
    const instance = sectionInstances[sectionId];
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
    dispatch({ type: 'SET_TEXT_INPUTS', sectionId, textInputs });
    dispatch({ type: 'SET_ENTRIES', sectionId, entries });
    dispatch({ type: 'SET_TOTAL', sectionId, total });
    dispatch({ type: 'SET_TOTAL_TEXT', sectionId, totalText });
  };

export const setSectionLocals = (documentId, sectionId, locals) => (dispatch, getState) => {
  const { documentLocales, documentConfigs, sectionTextInputs } = getState();
  const locale = documentLocales[documentId];
  const config = documentConfigs[documentId];

  const instance = new Recora(locale, {
    units: fromPairs(config.unitPairs),
    si: config.si,
    currentTime: config.currentTime,
    constants: locals || {},
  });

  dispatch({ type: 'SET_LOCALS', sectionId, locals });
  dispatch({ type: 'SET_INSTANCE', sectionId, instance });
  // Force recalculate section
  const textInputs = sectionTextInputs[sectionId] || [];
  dispatch(setTextInputs(documentId, sectionId, textInputs, false));
};

export const addSection = (documentId) => (dispatch, getState) => {
  const { documentSections } = getState();
  const sectionId = nextId('section-', flatten(values(documentSections)));
  dispatch({ type: 'ADD_SECTION', documentId, sectionId });
  dispatch(setSectionLocals(documentId, sectionId, {})); // calls setTextInputs
};

export const setConfig = (documentId, locale, config) => (dispatch, getState) => {
  const { documentSections, sectionLocals } = getState();
  dispatch({ type: 'SET_LOCALE', documentId, locale });
  dispatch({ type: 'SET_CONFIG', documentId, config });

  const sections = documentSections[documentId] || [];
  forEach(sectionId => {
    const sectionConfig = sectionLocals[sectionId] || {};
    dispatch(setSectionLocals(documentId, sectionId, sectionConfig));
  }, sections);
};

export const setTitle = (documentId, title) => (
  { type: 'SET_TITLE', documentId, title }
);

export const addDocument = () => (dispatch, getState) => {
  const { documents } = getState();
  const documentId = nextId('document-', documents);
  dispatch(setTitle(documentId, 'New Document'));
  const now = new Date();
  const config = {
    unitPairs: [],
    si: defaultSi,
    currentTime: {
      year: now.getFullYear(),
      month: now.getMonth(),
      date: now.getDate(),
    },
  };
  dispatch(setConfig(documentId, 'en', config));
  dispatch(addSection(documentId));
  dispatch({ type: 'ADD_DOCUMENT', documentId });
};

export const loadDocument = (documentId) => (dispatch, getState) => {
  const { documentLocales, documentConfigs } = getState();
  const locale = documentLocales[documentId];
  const config = documentConfigs[documentId];
  // Calls into setTextInputs, causing entire the document to be calculated
  dispatch(setConfig(documentId, locale, config));
};
