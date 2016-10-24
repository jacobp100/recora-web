// @flow
import { without, some, isEqual } from 'lodash/fp';
import type { State, DocumentId } from '../types';
import { unloadDocuments } from './index';

const SET_ACTIVE_DOCUMENT = 'cache-invalidation-middleware:SET_ACTIVE_DOCUMENT';

const cacheKeys = [
  'customUnits',
];

export default () => ({ getState, dispatch }) => {
  let activeDocument: ?DocumentId = null;

  const getInactiveDocuments = (state) =>
    (activeDocument ? without([activeDocument], state.documents) : []);

  return next => (action) => {
    const previousState: State = getState();
    const returnValue = next(action);
    const nextState: State = getState();

    if (action.type === SET_ACTIVE_DOCUMENT) {
      activeDocument = action.documentId;
    } else if (some(key => !isEqual(nextState[key], previousState[key]), cacheKeys)) {
      dispatch(unloadDocuments(getInactiveDocuments(nextState)));
    }

    return returnValue;
  };
};

export const setActiveDocument = (documentId) =>
  ({ type: SET_ACTIVE_DOCUMENT, documentId });
