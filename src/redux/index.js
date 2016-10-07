// @flow
import {
  get, set, unset, concat, update, mapValues, without, reduce, curry, flow, values, flatten,
  overEvery, uniqueId, includes, merge, propertyOf, map, intersection,
} from 'lodash/fp';
import type { State, SectionId, DocumentId, RecoraResult } from '../types';


const defaultState: State = {
  documents: [],
  documentTitles: {},
  documentSections: {},
  sectionTitles: {},
  sectionTextInputs: {},
  sectionResults: {},
  sectionTotals: {},
};

const MERGE_STATE = 'recora:MERGE_STATE';
const ADD_DOCUMENT = 'recora:ADD_DOCUMENT';
const SET_DOCUMENT_TITLE = 'recora:SET_DOCUMENT_TITLE';
const ADD_SECTION = 'recora:ADD_SECTION';
const SET_SECTION_TITLE = 'recora:SET_SECTION_TITLE';
const SET_TEXT_INPUTS = 'recora:SET_TEXT_INPUTS';
const SET_SECTION_RESULT = 'recora:SET_SECTION_RESULT';
const REORDER_SECTIONS = 'recora:REORDER_SECTIONS';
const DELETE_DOCUMENT = 'recora:DELETE_DOCUMENT';
const DELETE_SECTION = 'recora:DELETE_SECTION';

const getExistingIds = flow(
  overEvery([
    get('documents'),
    flow(get('documentSections'), values, flatten),
  ]),
  flatten,
);
const newId = (identifier, state) => {
  const existingIds = getExistingIds(state);
  let id;
  do {
    id = uniqueId(`${identifier}-`);
  } while (includes(id, existingIds));
  return id;
};


const removeIdWithinKeys = curry((keysToUpdate, idToRemove, state) => reduce(
  (state, keyToUpdate) => unset([keyToUpdate, idToRemove], state),
  state,
  keysToUpdate
));

const sectionKeys = [
  'sectionTitles',
  'sectionTextInputs',
  'sectionResults',
  'sectionTotals',
  'sectionTotalTexts',
];
const doDeleteSection = curry((sectionId, state) => flow(
  removeIdWithinKeys(sectionKeys, sectionId),
  update('documentSections', mapValues(without([sectionId])))
)(state));

const documentKeys = [
  'documentTitles',
  'documentSections',
];
const doDeleteDocument = curry((documentId, state) => flow(
  state => reduce(
    (state, sectionId) => doDeleteSection(sectionId, state),
    state,
    get(['documentSections', documentId], state)
  ),
  removeIdWithinKeys(documentKeys, documentId)
)(state));

const doAddSection = curry((documentId, state) => {
  const sectionId = newId('section');
  return update(
    ['documentSections', documentId],
    existingSections => (existingSections ? concat(existingSections, sectionId) : [sectionId]),
    state
  );
});


export default (state: State = defaultState, action: Object): State => {
  switch (action.type) {
    case MERGE_STATE:
      return merge(state, action.state);
    case ADD_DOCUMENT: {
      const id = newId('document', state);
      return flow(
        update('documents', concat(id)),
        set(['documentTitles', id], 'New Document'),
        doAddSection(id)
      )(state);
    }
    case SET_DOCUMENT_TITLE:
      return set(['documentTitles', action.documentId], action.title, state);
    case ADD_SECTION:
      return doAddSection(action.documentId, state);
    case SET_SECTION_TITLE:
      return set(['sectionTitles', action.sectionId], action.title, state);
    case SET_TEXT_INPUTS:
      return set(['sectionTextInputs', action.sectionId], action.textInputs, state);
    case SET_SECTION_RESULT:
      return flow(
        set(['sectionResults', action.sectionId], action.entries),
        set(['sectionTotals', action.sectionId], action.total)
      )(state);
    case REORDER_SECTIONS: {
      const { documentId, order } = action;
      const sectionIds = get(['documentSections', documentId], state);
      const orderedSectionIds = map(propertyOf(sectionIds), order);

      const noSectionsAddedRemoved =
        intersection(orderedSectionIds, sectionIds).length === sectionIds.length;

      return noSectionsAddedRemoved
        ? set(['documentSections', documentId], orderedSectionIds, state)
        : state;
    }
    case DELETE_DOCUMENT:
      return doDeleteDocument(action.documentId, state);
    case DELETE_SECTION:
      return doDeleteSection(action.sectionId, state);
    default:
      return state;
  }
};

/* eslint-disable max-len */
export const mergeState = (state: Object) =>
  ({ type: MERGE_STATE, state });
export const addDocument = () =>
  ({ type: ADD_DOCUMENT });
export const addSection = (documentId: DocumentId) =>
  ({ type: ADD_SECTION, documentId });
export const setSectionTitle = (sectionId: SectionId, title: string) =>
  ({ type: SET_SECTION_TITLE, sectionId, title });
export const setTextInputs = (sectionId: SectionId, textInputs: string[]) =>
  ({ type: SET_TEXT_INPUTS, sectionId, textInputs });
export const setSectionResult = (sectionId: SectionId, entries: RecoraResult[], total: RecoraResult) =>
  ({ type: SET_SECTION_RESULT, sectionId, entries, total });
export const reorderSections = (documentId: DocumentId, order: number[]) =>
  ({ type: REORDER_SECTIONS, documentId, order });
export const deleteDocument = (documentId: DocumentId) =>
  ({ type: DELETE_DOCUMENT, documentId });
export const deleteSection = (sectionId: SectionId) =>
  ({ type: DELETE_SECTION, sectionId });
export { loadDocuments, loadDocument } from './persistenceMiddleware';
/* eslint-enable */
