// @flow
import { curry, concat, get, has } from 'lodash/fp';

export const append = curry((value, array) => (
  array ? concat(array, value) : [value]
));

export const getOrThrow = (path, source) => {
  if (!has(path, source)) {
    const message = `Expected ${path} to exist in ${JSON.stringify(source)}`;
    console.error(message); // eslint-disable-line
    throw new Error(message);
  }
  return get(path, source);
};
