// @flow
import { getOr, without, flow, values, flatten, any, isEqual } from 'lodash/fp';
import type { State, DocumentId } from '../types';
import { unloadSections } from './index';

const SET_ACTIVE_DOCUMENT = 'cache-invalidation-middleware:SET_ACTIVE_DOCUMENT';

const cacheKeys = [
  'customUnits',
];

export default () => ({ getState, dispatch }) => {
  let activeDocument: ?DocumentId = null;

  const getInactiveSections = (state) => {
    if (!activeDocument) return [];
    const sectionsInActiveDocument = getOr([], ['documentSections', activeDocument], state);
    const allSections = flow(values, flatten)(state.documentSections);
    const inactiveSections = without(sectionsInActiveDocument, allSections);
    return inactiveSections;
  };

  return next => (action) => {
    const previousState: State = getState();
    const returnValue = next(action);
    const nextState: State = getState();

    if (action.type === SET_ACTIVE_DOCUMENT) {
      activeDocument = action.documentId;
    } else if (any(key => !isEqual(nextState[key], previousState[key]), cacheKeys)) {
      dispatch(unloadSections(getInactiveSections(nextState)));
    }

    return returnValue;
  };
};

export const setActiveDocument = (documentId) =>
  ({ type: SET_ACTIVE_DOCUMENT, documentId });
