/* eslint no-use-before-define: [0] */

import {
  map, reduce, head, tail, contains, flatten, values, forEach, groupBy, prop, pipe, fromPairs,
  reject, flip, concat, filter, equals, unless, ifElse, always, isNil,
} from 'ramda';
import Recora from 'recora';
import { ADD as add } from 'recora/src/math';
import { toString as typeToString } from 'recora/src/types/types';
import { isEntity, isValueAssignment } from 'recora/src/types/util';
import defaultSi from 'recora/src/data/environment/si';

const keyBy = pipe(groupBy, map(head));
const entryResult = unless(isNil, prop('result'));
const entryResultIsValueAssignmentToEntity = pipe(
  entryResult,
  unless(isNil, unless(isValueAssignment, always(null))),
  unless(isNil, prop('value')),
  ifElse(isNil, always(false), isEntity)
);
const keyLocals = pipe(
  map(prop('result')),
  groupBy(prop('key')),
  map(head),
  map(prop('value'))
);

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

    const assignmentsBefore = filter(entryResultIsValueAssignmentToEntity, existingEntries);
    const assignmentsAfter = filter(entryResultIsValueAssignmentToEntity, entries);

    if (useCache && !equals(assignmentsBefore, assignmentsAfter)) {
      const locals = keyLocals(assignmentsAfter);
      dispatch(setSectionLocalsWithTextInputs(documentId, sectionId, locals, textInputs));
      return;
    }

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

const setSectionLocalsWithTextInputs = (documentId, sectionId, locals, textInputs) =>
  (dispatch, getState) => {
    const { documentLocales, documentConfigs, sectionInstances } = getState();
    const locale = documentLocales[documentId];
    const config = documentConfigs[documentId];
    const useCache = !(sectionId in sectionInstances);

    const instance = new Recora(locale, {
      units: fromPairs(config.unitPairs),
      si: config.si,
      currentTime: config.currentTime,
      constants: locals || {},
    });

    dispatch({ type: 'SET_LOCALS', sectionId, locals });
    dispatch({ type: 'SET_INSTANCE', sectionId, instance });
    dispatch(setTextInputs(documentId, sectionId, textInputs, useCache));
  };

export const setSectionLocals = (documentId, sectionId, locals) => (dispatch, getState) => {
  const { sectionTextInputs } = getState();
  const textInputs = sectionTextInputs[sectionId] || [];
  dispatch(setSectionLocalsWithTextInputs(documentId, sectionId, locals, textInputs));
};

export const setSectionTitle = (sectionId, title) => (
  { type: 'SET_SECTION_TITLE', sectionId, title }
);

export const deleteSection = (documentId, sectionId) => (
  { type: 'DELETE_SECTION', documentId, sectionId }
);

export const addSection = (documentId) => (dispatch, getState) => {
  const { documentSections } = getState();
  const sectionId = nextId('section-', flatten(values(documentSections)));
  dispatch({ type: 'ADD_SECTION', documentId, sectionId });
  dispatch(setSectionTitle(sectionId, ''));
  dispatch(setSectionLocals(documentId, sectionId, {})); // calls setTextInputs
};

export const reorderSections = (documentId, orderedSectionIds) => (dispatch, getState) => {
  const { documentSections } = getState();
  const existingSections = documentSections[documentId];
  const sectionIdsNotIncluded = reject(flip(contains)(orderedSectionIds), existingSections);
  const sectionIds = concat(orderedSectionIds, sectionIdsNotIncluded);
  dispatch({ type: 'SET_SECTIONS', documentId, sectionIds });
};

const recomputeDocument = (documentId) => (dispatch, getState) => {
  const { documentSections, sectionLocals } = getState();
  const sections = documentSections[documentId] || [];
  forEach(sectionId => {
    const sectionConfig = sectionLocals[sectionId] || {};
    dispatch(setSectionLocals(documentId, sectionId, sectionConfig));
  }, sections);
};

export const setLocale = (documentId, locale) => (dispatch) => {
  dispatch({ type: 'SET_LOCALE', documentId, locale });
  dispatch(recomputeDocument(documentId));
};

export const setConfig = (documentId, config) => (dispatch) => {
  dispatch({ type: 'SET_CONFIG', documentId, config });
  dispatch(recomputeDocument(documentId));
};

export const setDocumentTitle = (documentId, title) => (
  { type: 'SET_DOCUMENT_TITLE', documentId, title }
);

export const deleteDocument = (documentId) => (dispatch, getState) => {
  const { documentSections } = getState();
  const sections = documentSections[documentId];
  forEach(sectionId => {
    dispatch(deleteSection(documentId, sectionId));
  }, sections);
  dispatch({ type: 'DELETE_DOCUMENT', documentId });
};

export const addDocument = () => (dispatch, getState) => {
  const { documents } = getState();
  const documentId = nextId('document-', documents);
  dispatch(setDocumentTitle(documentId, 'New Document'));
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
  dispatch({ type: 'SET_LOCALE', documentId, locale: 'en' });
  dispatch({ type: 'SET_CONFIG', documentId, config });
  dispatch(addSection(documentId));
  dispatch({ type: 'ADD_DOCUMENT', documentId });
  dispatch(recomputeDocument(documentId));
};

export const loadDocument = (documentId) => (dispatch, getState) => {
  const { documentLocales, documentConfigs } = getState();
  const locale = documentLocales[documentId];
  const config = documentConfigs[documentId];
  // Duplication as to not compute the document twice
  dispatch({ type: 'SET_LOCALE', documentId, locale });
  dispatch({ type: 'SET_CONFIG', documentId, config });
  dispatch(recomputeDocument(documentId));
};
