// @flow
import {
  __, map, concat, isEqual, flow, matchesProperty, filter, assign, omit, get, keyBy, mapValues,
  some, reduce,
} from 'lodash/fp';
import type { RecoraResult } from '../../types';

const NODE_ASSIGNMENT = 'NODE_ASSIGNMENT';
const resultIsAssignment = matchesProperty(['result', 'value', 'type'], NODE_ASSIGNMENT);

const createReassignmentResult = existingResult => ({
  ...existingResult,
  value: null,
  pretty: `[reassignment of ${existingResult.value.identifier}]`,
});

export const getAssignments = flow(
  map(get(['result', 'value'])),
  filter(matchesProperty('type', NODE_ASSIGNMENT))
);

export const removeDuplicateAssignments = reduce((outputResults, result) => {
  let isDuplicateAssignment;
  if (resultIsAssignment(result)) {
    const identifier = result.result.value.identifier;

    isDuplicateAssignment = flow(
      getAssignments,
      some({ identifier })
    )(outputResults);
  }

  const outputResult = isDuplicateAssignment
    ? {
      input: result.input,
      result: createReassignmentResult(result.result),
      removedAssignment: result.result,
    }
    : result;

  return concat(outputResults, outputResult);
}, []);

export const getNewChangedAssignments = (
  constants: Object,
  results: RecoraResult[]
): RecoraResult[] => flow(
  getAssignments,
  filter(({ identifier, value }) => !isEqual(constants[identifier], value))
)(results);

export const getNextConstants = (
  constants: Object,
  newChangedAssignments: RecoraResult[],
  removedAssignments: RecoraResult[]
): Object => {
  const newConstants = flow(keyBy('identifier'), mapValues('value'))(newChangedAssignments);
  const removedConstantNames = map('identifier', removedAssignments);

  const nextConstants = flow(
    omit(removedConstantNames),
    assign(__, newConstants)
  )(constants);

  return nextConstants;
};
