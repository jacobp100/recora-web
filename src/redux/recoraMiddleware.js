// @flow
import {
  map, findIndex, pullAt, concat, first, keys, getOr, forEach, get, set,
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
type Result = { input: string, result: ?RecoraResult };
type ImmutableConstants = Object;
type FiberOptions = {
  requestIdleCallback: (fn: () => void) => any,
  frameBudget: number,
};
type FiberFunction<T> = (state: T, next: (state: T) => void, initialState: T) => void;
type Fiber<T> = {
  getState: () => T,
  cancel: () => void,
};
type FiberRunner<T> = (fn: FiberFunction<T>, initialState: T) => Fiber<T>;
type CalculationState = {
  sectionId: SectionId,
  forceRecalculation: bool,
  instance: Recora,
  constants: Object,
  inputs: string[],
  previous: Result[],
  results: Result[],
};

const createFiberRunner = ({
  requestIdleCallback = global.requestAnimationFrame,
  frameBudget = 8,
}: FiberOptions = {}): FiberRunner<any> => (fn, initialState) => {
  let cancelled = false;
  let currentState = initialState;
  let lastContinuationTime;

  const next = (state) => {
    currentState = state;
    if (Date.now() - lastContinuationTime < frameBudget) {
      continueFiber();  // eslint-disable-line
    } else {
      requestIdleCallback(continueFiber); // eslint-disable-line
    }
  };

  const continueFiber = () => {
    if (cancelled) return;
    lastContinuationTime = Date.now();
    fn(currentState, next);
  };

  continueFiber();

  return {
    getState: () => currentState,
    cancel: () => { cancelled = true; },
  };
};


const getDefaultBatchImpl = ({
  requestIdleCallback = global.requestAnimationFrame,
  frameBudget = 8,
} = {}): BatchImplementation => {
  const runFiber: FiberRunner<CalculationState> = createFiberRunner({
    requestIdleCallback,
    frameBudget,
  });

  let resultListeners = [];

  // Lazy map
  const instancesPerSection: { [key:SectionId]: Recora } = {};

  // Global state (All objects mutable)
  const queuedInputs: { [key:SectionId]: string[] } = {};
  const previousResultsPerSection: { [key:SectionId]: Result[] } = {};
  const constantsPerSection: { [key:SectionId]: ImmutableConstants } = {};
  let fiber: ?Fiber<CalculationState> = null;


  const getInstanceFor = (sectionId) => {
    if (sectionId in instancesPerSection) return instancesPerSection[sectionId];
    const instance = new Recora();
    const constants = constantsPerSection[sectionId];
    if (constants) instance.setConstants(constants);
    return instance;
  };

  const queueComputation = () => {
    if (fiber !== null) return;
    const sectionId = first(keys(queuedInputs));
    if (!sectionId) return;

    /* eslint-disable no-use-before-define */
    fiber = runFiber(sectionComputation, ({
      sectionId,
      forceRecalculation: false,
      instance: getInstanceFor(sectionId),
      constants: getOr({}, sectionId, constantsPerSection),
      inputs: getOr([], sectionId, queuedInputs),
      previous: getOr([], sectionId, previousResultsPerSection),
      results: [],
    }: CalculationState));
    /* eslint-enable */
  };

  const cancelFiberFor = (sectionId) => {
    if (fiber && fiber.getState().sectionId === sectionId) {
      fiber.cancel();
      fiber = null;
    }
    queueComputation();
  };

  const updateInstanceWithAssignmentResult = (instance, constants, result) => {
    const { identifier, value } = result.value;

    // Ignore subsequent assignments if they type something like, test = 3; test = 4
    if (identifier in constants) return { result: null, constants };

    const newConstants = set(identifier, value, constants);
    instance.setConstants(newConstants);
    return { result, constants: newConstants };
  };

  const sectionComputation = (state: CalculationState, next) => {
    const { sectionId, forceRecalculation, instance, inputs } = state;
    let { constants, previous, results } = state;
    const remainingInputs = inputs.slice(results.length);

    let didPerformExpensiveComputation = false;

    for (const input of remainingInputs) {
      const previousEntryIndex = findIndex({ input }, previous);

      let result;
      if (previousEntryIndex !== -1) {
        // Almost free, do even if we've exceeded the frame budget
        result = previous[previousEntryIndex].result;
        previous = pullAt(1, previousEntryIndex);
      } else if (!didPerformExpensiveComputation) {
        // Expensive, don't do if we've exceeded the frame budget
        result = instance.parse(input);
        didPerformExpensiveComputation = true;

        const isAssignment = get(['value', 'type'], result) === 'NODE_ASSIGNMENT';

        if (isAssignment) {
          if (!forceRecalculation) {
            next(({
              sectionId,
              forceRecalculation: true,
              constants: {},
              instance: new Recora(),
              inputs,
              previous: [],
              results: [],
            }: CalculationState));
            return;
          }

          const update = updateInstanceWithAssignmentResult(instance, constants, result);
          result = update.result;
          constants = update.constants;
        }
      } else {
        next(({
          sectionId,
          forceRecalculation,
          instance,
          constants,
          inputs,
          previous,
          results,
        }: CalculationState));
        return;
      }

      results = concat(results, { input, result });
    }

    const entries = map('result', results);
    const total = instance.parse('');
    forEach(resultListener => resultListener(sectionId, entries, total), resultListeners);

    delete queuedInputs[sectionId];
    previousResultsPerSection[sectionId] = results;
    constantsPerSection[sectionId] = constants;
    fiber = null;
    queueComputation();
  };

  const resetFiberFor = (sectionId) => {
    cancelFiberFor(sectionId);
    queueComputation();
  };

  const queueSection = (sectionId, inputs) => {
    queuedInputs[sectionId] = inputs;
    resetFiberFor(sectionId);
  };

  const unqueueSection = (sectionId) => {
    delete queuedInputs[sectionId];
    resetFiberFor(sectionId);
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
