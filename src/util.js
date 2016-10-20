// @flow
import { curry, concat } from 'lodash/fp';

export const append = curry((value, array) => ( // eslint-disable-line
  array ? concat(array, value) : [value]
));
