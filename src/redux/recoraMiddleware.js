// @flow
import {
  __, map, findIndex, pullAt, concat, first, keys, getOr, forEach, isEqual, flow, matchesProperty,
  filter, assign, omit, isEmpty, get, keyBy, mapValues, some, reduce,
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
type Result = {
  input: string,
  result: ?RecoraResult,
  removedAssignment: ?RecoraResult,
};
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

const NODE_ASSIGNMENT = 'NODE_ASSIGNMENT';

const createFiberRunner = ({
  requestIdleCallback = global.requestAnimationFrame,
  frameBudget = 8,
}: FiberOptions = {}): FiberRunner<any> => (fn, initialState) => {
  let cancelled = false;
  let state = initialState;
  let lastContinuationTime;

  const next = (nextState) => {
    state = nextState;
    if (Date.now() - lastContinuationTime < frameBudget) {
      continueFiber();  // eslint-disable-line
    } else {
      requestIdleCallback(continueFiber); // eslint-disable-line
    }
  };

  const continueFiber = () => {
    if (cancelled) return;
    lastContinuationTime = Date.now();
    fn(state, next);
  };

  requestIdleCallback(continueFiber);

  return {
    getState: () => state,
    cancel: () => { cancelled = true; },
  };
};


const getAssignments = flow(
  map(get(['result', 'value'])),
  filter(matchesProperty('type', NODE_ASSIGNMENT))
);
const resultIsAssignment = matchesProperty(['result', 'value', 'type'], NODE_ASSIGNMENT);

const removeDuplicateAssignments = reduce((outputResults, result) => {
  let isDuplicateAssignment;
  if (resultIsAssignment(result)) {
    const identifier = result.result.value.identifier;

    isDuplicateAssignment = flow(
      getAssignments,
      some({ identifier })
    )(outputResults);
  }

  const outputResult = isDuplicateAssignment
    ? { input: result.input, result: null, removedAssignment: result.result }
    : result;

  return concat(outputResults, outputResult);
}, []);

const getDefaultBatchImpl = ({
  requestIdleCallback = global.requestAnimationFrame,
  frameBudget = 8,
} = {}): BatchImplementation => {
  const runFiber: FiberRunner<CalculationState> = createFiberRunner({
    requestIdleCallback,
    frameBudget,
  });

  let resultListeners = [];

  // Global state (All objects mutable)
  const queuedInputs: { [key:SectionId]: string[] } = {};
  const previousResultsPerSection: { [key:SectionId]: Result[] } = {};
  const constantsPerSection: { [key:SectionId]: ImmutableConstants } = {};
  const instancesPerSection: { [key:SectionId]: Recora } = {};
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

  const getStateForRecalculation = (
    { sectionId, inputs }: CalculationState,
    constants
  ): CalculationState => ({
    sectionId,
    forceRecalculation: true,
    constants,
    instance: new Recora().setConstants(constants),
    inputs,
    previous: [],
    results: [],
  });

  const sectionComputation = (state: CalculationState, next) => {
    const { sectionId, forceRecalculation, constants, instance, inputs } = state;
    let { previous, results } = state;
    const getCurrentState = (): CalculationState =>
      ({ sectionId, forceRecalculation, instance, constants, inputs, previous, results });
    const remainingInputs = inputs.slice(results.length);

    let didPerformExpensiveComputation = false;

    for (const input of remainingInputs) {
      const previousEntryIndex = findIndex({ input }, previous);

      let result;
      if (previousEntryIndex !== -1) {
        // Almost free, do even if we've exceeded the frame budget
        const previousValue = previous[previousEntryIndex];
        result = previousValue.removedAssignment || previousValue.result;
        previous = pullAt(previousEntryIndex, previous);
      } else if (!didPerformExpensiveComputation) {
        // Expensive, don't do if we've exceeded the frame budget
        result = instance.parse(input);
        didPerformExpensiveComputation = true;
      } else {
        next(getCurrentState());
        return;
      }

      results = concat(results, { input, result, removedAssignment: null });
    }

    results = removeDuplicateAssignments(results);

    const newChangedAssignments = flow(
      getAssignments,
      filter(({ identifier, value }) => !isEqual(constants[identifier], value))
    )(results);

    const removedAssignments = getAssignments(previous);

    if (!isEmpty(newChangedAssignments) || !isEmpty(removedAssignments)) {
      const newConstants = flow(keyBy('identifier'), mapValues('value'))(newChangedAssignments);
      const removedConstantNames = map('identifier', removedAssignments);

      const nextConstants = flow(
        omit(removedConstantNames),
        assign(__, newConstants)
      )(constants);

      next(getStateForRecalculation(getCurrentState(), nextConstants));
      return;
    }

    const entries = map('result', results);
    const total = instance.parse('');
    forEach(resultListener => resultListener(sectionId, entries, total), resultListeners);

    delete queuedInputs[sectionId];
    previousResultsPerSection[sectionId] = results;
    constantsPerSection[sectionId] = constants;
    instancesPerSection[sectionId] = instance;
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
