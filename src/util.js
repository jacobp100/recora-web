// @flow
import { curry, concat, get, has, map, propertyOf, intersection } from 'lodash/fp';

export const getOrThrow = (path: string | string[], source: Object) => {
  if (!has(path, source)) {
    const message = `Expected ${path.toString()} to exist in ${JSON.stringify(source)}`;
    console.error(message); // eslint-disable-line
    throw new Error(message);
  }
  return get(path, source);
};

export const append = curry((value, array) => (
  array ? concat(array, value) : [value]
));

export const reorder = curry((order, elements) => {
  const orderedElements = map(propertyOf(elements), order);

  const noElementsAddedRemoved =
    intersection(orderedElements, elements).length === elements.length;

  return noElementsAddedRemoved ? orderedElements : elements;
});
