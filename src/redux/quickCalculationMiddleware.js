// @flow
import Recora from 'recora';
import { setQuickCalculationResult } from './index';


export default () => ({ getState, dispatch }) => {
  const now = new Date();
  const nowString = String(now);
  let timezone = nowString.indexOf('(') > -1
    ? nowString.match(/\([^\)]+\)/)[0].match(/[A-Z]/g).join('')
    : nowString.match(/[A-Z]{3,4}/)[0];
  if (/[^a-z]/i.test(timezone)) timezone = 'UTC';

  const dateObject = {
    second: now.getSeconds(),
    minute: now.getMinutes(),
    hour: now.getHours(),
    date: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    timezone,
  };
  const instance = new Recora();
  instance.setDate(dateObject);

  const doCalculation = (input) => {
    const result = instance.parse(input);
    dispatch(setQuickCalculationResult(result));
  };

  return next => (action) => {
    const previousState = getState();
    const returnValue = next(action);
    const nextState = getState();

    const customUnitsChanged = previousState.customUnits !== nextState.customUnits;
    const inputChanged = previousState.quickCalculationInput !== nextState.quickCalculationInput;

    if (customUnitsChanged) instance.setCustomUnits(nextState.customUnits);
    if (customUnitsChanged || inputChanged) doCalculation(nextState.quickCalculationInput);

    return returnValue;
  };
};
