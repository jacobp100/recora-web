// @flow
import {
  update, union, map, findIndex, pullAt, isEmpty, concat, first, keys, unset, getOr, flow, zip, set,
  forEach,
} from 'lodash/fp';
import Recora from 'recora';
import type { State, SectionId, RecoraResult } from '../types';
import { getAddedChangedRemovedSectionItems } from './util';
import { setSectionResult } from '.';

type ResultListenerCallback = (
  sectionId: SectionId,
  entries: RecoraResult[],
  total: RecoraResult
) => void;
type BatchImplementation = {
  queueSection: (sectionId: SectionId, inputs: string[]) => void,
  unqueueSection: (sectionId: SectionId) => void,
  addResultListener: (callback: ResultListenerCallback) => void,
};

const recora = new Recora();

const getDefaultBatchImpl = (): BatchImplementation => {
  let resultListeners = [];

  let queuedInputs: { [key:SectionId]: string[] } = {};
  let previousResults: { [key:SectionId]: { input: string, result: RecoraResult }[] } = {};
  let idleCallback = null;

  const performSectionComputation = () => {
    const sectionId = first(keys(queuedInputs));
    if (!sectionId) return;
    const inputs = getOr([], sectionId, queuedInputs);
    let previous = getOr([], sectionId, previousResults).slice();

    const entries = map(input => {
      // FIXME: text, not input
      const previousEntryIndex = findIndex({ input }, previous);

      if (previousEntryIndex !== -1) {
        const { result } = previous[previousEntryIndex];
        previous = pullAt([previousEntryIndex], previous);
        return result;
      }
      return recora.parse(input);
    }, inputs);

    const total = recora.parse('');

    const results = flow(
      zip(inputs),
      map(([result, input]) => ({ result, input }))
    )(entries);

    previousResults = set(sectionId, results, previousResults);
    queuedInputs = unset(sectionId, queuedInputs);

    forEach(resultListener => resultListener(sectionId, entries, total), resultListeners);

    idleCallback = !isEmpty(queuedInputs)
      ? global.requestAnimationFrame(performSectionComputation)
      : null;
  };

  const queueSection = (sectionId, inputs) => {
    queuedInputs = update(
      sectionId,
      existingInputs => (existingInputs ? union(existingInputs, inputs) : inputs),
      queuedInputs
    );

    if (idleCallback === null) {
      idleCallback = global.requestAnimationFrame(performSectionComputation);
    }
  };

  const unqueueSection = (sectionId) => {
    queuedInputs = unset(sectionId, queuedInputs);
  };

  return {
    queueSection,
    unqueueSection,
    addResultListener: callback => {
      resultListeners = concat(resultListeners, callback);
    },
  };
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

    const { added, changed, removed } = getAddedChangedRemovedSectionItems(
      nextState.sectionTextInputs,
      previousState.sectionTextInputs
    );

    forEach(batchImplementation.unqueueSection, removed);

    const sectionsToQueue = concat(added, changed);
    forEach(sectionId => (
      batchImplementation.queueSection(sectionId, nextState.sectionTextInputs[sectionId])
    ), sectionsToQueue);

    return returnValue;
  };
};
export default middleware;
