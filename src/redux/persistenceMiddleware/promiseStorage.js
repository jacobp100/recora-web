// @flow
import { map } from 'lodash/fp';

export type PromiseStorage = {
  getItem: (key: string) => Promise<any>,
  multiGet: (key: string[]) => Promise<any>,
  setItem: (key: string, value: string) => Promise<any>,
  multiSet: (pairs: [string, string][]) => Promise<any>,
  removeItem: (key: string) => Promise<any>,
  multiRemove: (key: string[]) => Promise<any>,
};

export const getPromiseStorage = (): PromiseStorage => ({
  getItem: key =>
    Promise.resolve(global.localStorage.getItem(key)),
  multiGet: keys =>
    Promise.resolve(map(key => [key, global.localStorage.getItem(key)], keys)),
  setItem: (key, value) =>
    Promise.resolve(global.localStorage.setItem(key, value)),
  multiSet: pairs =>
    Promise.resolve(map(([key, value]) => global.localStorage.setItem(key, value), pairs)),
  removeItem: key =>
    Promise.resolve(global.localStorage.removeItem(key)),
  multiRemove: keys =>
    Promise.resolve(map(key => global.localStorage.removeItem(key), keys)),
});
