// @flow
import type { FiberOptions, FiberRunner } from './types';

export default ({
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
