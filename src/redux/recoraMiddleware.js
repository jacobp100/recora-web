// @flow
import { map, findIndex, isEmpty, concat, first, keys, getOr, forEach, get } from 'lodash/fp';
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
type Result = { input: string, result: RecoraResult };
type Fiber = {
  sectionId: SectionId,
  start: number,
  previous: Result[],
  results: Result[],
};

const getDefaultBatchImpl = ({
  requestIdleCallback = global.requestAnimationFrame,
  frameBudget = 8,
} = {}): BatchImplementation => {
  let resultListeners = [];

  // Lazy map
  const instancesPerSection: { [key:SectionId]: Recora } = {};

  // Global state
  const queuedInputs: { [key:SectionId]: string[] } = {};
  const previousResultsPerSection: { [key:SectionId]: Result[] } = {};
  const forceRecalculationPerSection: { [key:SectionId]: bool } = {};
  let fiber: ?Fiber = null; // Note that all the properties of fiber are mutated in place
  let idleCallback = null;

  const generateFiberFor = (sectionId, start = Date.now()) => {
    const forceRecalculation = forceRecalculationPerSection[sectionId] || false;
    const previous = !forceRecalculation
      ? getOr([], sectionId, previousResultsPerSection).slice()
      : [];
    return { sectionId, start, previous, results: [] };
  };

  const setFiberIfEmpty = () => {
    if (fiber !== null) return;
    const sectionId = first(keys(queuedInputs));
    if (!sectionId) return;
    fiber = generateFiberFor(sectionId);
  };

  const cancelFiberFor = (sectionId) => {
    if (fiber && fiber.sectionId === sectionId) fiber = null;
  };

  const getInstanceFor = (sectionId) => {
    if (sectionId in instancesPerSection) return instancesPerSection[sectionId];
    const instance = new Recora();
    instancesPerSection[sectionId] = instance;
    return instance;
  };

  const performSectionComputation = () => {
    setFiberIfEmpty();
    if (!fiber) return;

    if (fiber.start === -1) fiber.start = Date.now();
    const { sectionId, start, previous, results } = fiber;
    const remainingInputs = queuedInputs[sectionId].slice(results.length);
    const instance = getInstanceFor(sectionId);

    const forceRecalculation = forceRecalculationPerSection[sectionId];

    for (const input of remainingInputs) {
      const previousEntryIndex = findIndex({ input }, previous);

      let result;
      if (previousEntryIndex !== -1) {
        // Almost free, do even if we've exceeded the frame budget
        result = previous[previousEntryIndex].result;
        previous.splice(previousEntryIndex, 1);
      } else if (Date.now() - start < frameBudget) {
        // Expensive, don't do if we've exceeded the frame budget
        result = instance.parse(input);

        if (forceRecalculation && get(['value', 'type'], result) === 'NODE_ASSIGNMENT') {
          const { identifier, value } = result.value;
          instance.setConstant(identifier, value);

          forceRecalculationPerSection[sectionId] = true;
          fiber = generateFiberFor(sectionId, start);
          performSectionComputation();
          return;
        }
      } else {
        // Exceeded the frame budget, continue in next frame
        // We'll use the same fiber as here
        idleCallback = requestIdleCallback(performSectionComputation);
        // Renew frame budget on continuation
        fiber.start = -1;
        return;
      }

      results.push({ input, result });
    }

    previousResultsPerSection[sectionId] = results;
    if (sectionId in forceRecalculationPerSection) forceRecalculationPerSection[sectionId] = false;

    const entries = map('result', results);
    const total = instance.parse('');
    forEach(resultListener => resultListener(sectionId, entries, total), resultListeners);

    delete queuedInputs[sectionId];
    fiber = null;
    idleCallback = !isEmpty(queuedInputs)
      ? requestIdleCallback(performSectionComputation)
      : null;
  };

  const queueSection = (sectionId, inputs) => {
    queuedInputs[sectionId] = inputs;
    cancelFiberFor(sectionId);
    if (idleCallback === null) idleCallback = requestIdleCallback(performSectionComputation);
  };

  const unqueueSection = (sectionId) => {
    delete queuedInputs[sectionId];
    cancelFiberFor(sectionId);
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
