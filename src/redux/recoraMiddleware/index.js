// @flow
import { concat, forEach, isEqual, keys, difference, intersection, reject } from 'lodash/fp';
import getDefaultBatchImpl from './batchImplementation';
import { setSectionResult } from '../index';
import type { BatchImplementation } from './types';
import type { State, SectionId } from '../../types';


type Items = { [key:SectionId]: any };
const getAddedChangedRemovedSectionItems = (nextItems: Items, previousItems: Items) => {
  if (previousItems === nextItems) {
    return { added: [], removed: [], changed: [] };
  }

  const previousSectionIds = keys(previousItems);
  const nextSectionIds = keys(nextItems);

  const removed = difference(previousSectionIds, nextSectionIds);

  const added = difference(nextSectionIds, previousSectionIds);
  const itemsThatMayHaveChanged = intersection(previousSectionIds, nextSectionIds);
  const changed = reject(sectionId => isEqual(
      previousItems[sectionId],
      nextItems[sectionId]
  ), itemsThatMayHaveChanged);

  return { added, removed, changed };
};

const middleware = (
  batchImplementation: BatchImplementation = getDefaultBatchImpl()
): any => ({ getState, dispatch }) => {
  batchImplementation.addResultListener((sectionId, entries, total) => {
    dispatch(setSectionResult(sectionId, entries, total));
  });

  return next => (action) => {
    const previousState: State = getState();
    const returnValue = next(action);
    const nextState: State = getState();

    if (!isEqual(nextState.customUnits, previousState.customUnits)) {
      batchImplementation.setCustomUnits(nextState.customUnits);
    }

    const { added, changed, removed } = getAddedChangedRemovedSectionItems(
      nextState.sectionTextInputs,
      previousState.sectionTextInputs
    );

    forEach(batchImplementation.unloadSection, removed);

    const sectionsToLoad = concat(added, changed);
    forEach(sectionId => (
      batchImplementation.loadSection(sectionId, nextState.sectionTextInputs[sectionId])
    ), sectionsToLoad);

    return returnValue;
  };
};
export default middleware;
