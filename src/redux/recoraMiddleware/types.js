// @flow
import type { SectionId, RecoraResult } from '../../types';

export type ResultListenerCallback = (
  sectionId: SectionId,
  entries: RecoraResult[],
  total: RecoraResult
) => void;
export type BatchImplementation = {
  loadSection: (sectionId: SectionId, inputs: string[]) => void,
  unloadSection: (sectionId: SectionId) => void,
  setCustomUnits: (units: Object) => void,
  addResultListener: (callback: ResultListenerCallback) => void,
};
export type Result = {
  input: string,
  result: ?RecoraResult,
  removedAssignment: ?RecoraResult,
};
export type FiberOptions = {
  requestIdleCallback: (fn: () => void) => any,
  frameBudget: number,
};
export type FiberFunction<T> = (state: T, next: (state: T) => void, initialState: T) => void;
export type Fiber<T> = {
  getState: () => T,
  cancel: () => void,
};
export type FiberRunner<T> = (fn: FiberFunction<T>, initialState: T) => Fiber<T>;
