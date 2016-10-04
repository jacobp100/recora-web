// @flow
import {
  get, set, unset, concat, update, mapValues, without, reduce, curry, flow, values, flatten,
  overEvery, uniqueId, includes,
} from 'lodash/fp';
import type { DocumentId, SectionId, RecoraResult } from '../types';

export type State = {
  documents: DocumentId[],
  documentTitles: { [key:DocumentId]: string },
  documentSections: { [key:DocumentId]: SectionId[] },
  sectionTitles: { [key:SectionId]: string },
  sectionTextInputs: { [key:SectionId]: string[] },
  sectionEntries: { [key:SectionId]: RecoraResult[] },
  sectionTotals: { [key:SectionId]: RecoraResult },
};
const defaultState: State = {
  documents: [],
  documentTitles: {},
  documentSections: {},
  sectionTitles: {},
  sectionTextInputs: {},
  sectionEntries: {},
  sectionTotals: {},
};

const ADD_DOCUMENT = 'recora:ADD_DOCUMENT';
const SET_DOCUMENT_TITLE = 'recora:SET_DOCUMENT_TITLE';
const ADD_SECTION = 'recora:ADD_SECTION';
const SET_SECTION_TITLE = 'recora:SET_SECTION_TITLE';
const SET_TEXT_INPUTS = 'recora:SET_TEXT_INPUTS';
const SET_SECTION_RESULT = 'recora:SET_SECTION_RESULT';
const DELETE_DOCUMENT = 'recora:DELETE_DOCUMENT';
const DELETE_SECTION = 'recora:DELETE_SECTION';


const removeIdWithinKeys = curry((keysToUpdate, idToRemove, state) => reduce(
  (state, keyToUpdate) => unset([keyToUpdate, idToRemove], state),
  state,
  keysToUpdate
));

const sectionKeys = [
  'sectionTitles',
  'sectionTextInputs',
  'sectionEntries',
  'sectionTotals',
  'sectionTotalTexts',
];
const deleteSection = curry((sectionId, state) => flow(
  removeIdWithinKeys(sectionKeys, sectionId),
  update('documentSections', mapValues(without([sectionId])))
)(state));

const documentKeys = [
  'documentTitles',
  'documentSections',
];
const deleteDocument = curry((documentId, state) => flow(
  state => reduce(
    (state, sectionId) => deleteSection(sectionId, state),
    state,
    get(['documentSections', documentId], state)
  ),
  removeIdWithinKeys(documentKeys, documentId)
)(state));

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
};


export default (action: Object, state: State = defaultState): State => {
  switch (action.type) {
    case ADD_DOCUMENT:
      return update('documents', concat(newId('document', state)), state);
    case SET_DOCUMENT_TITLE:
      return set(['documentTitles', action.documentId], action.title, state);
    case ADD_SECTION:
      return update('sections', concat(newId('section', state)), state);
    case SET_SECTION_TITLE:
      return set(['sectionTitles', action.sectionId], action.title, state);
    case SET_TEXT_INPUTS:
      return set(['sectionTextInputs', action.sectionId], action.textInputs, state);
    case SET_SECTION_RESULT:
      return flow(
        set(['sectionEntries', action.sectionId], action.entries),
        set(['sectionTotals', action.sectionId], action.total)
      )(state);
    case DELETE_DOCUMENT:
      return deleteDocument(action.documentId, state);
    case DELETE_SECTION:
      return deleteSection(action.sectionId, state);
    default:
      return state;
  }
};

export const setSectionResult =
  (sectionId: SectionId, entries: RecoraResult[], total: RecoraResult) =>
    ({ type: SET_SECTION_RESULT, sectionId, entries, total });
