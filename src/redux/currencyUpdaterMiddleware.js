// @flow
/* global fetch */
import { mapValues } from 'lodash/fp';
import { setCustomUnits } from './index';

const currencyBase = 'EUR';

const fetchCurrencies = async () => {
  const response = await fetch('https://api.fixer.io/latest');
  const body = await response.json();

  const multiplier = body.base !== currencyBase ? body.rates[currencyBase] : 1;
  return mapValues(value => [multiplier / value, { currency: 1 }], body.rates);
};

export default (AppState: any): any => ({ dispatch }) => {
  let lastCurrencyUpdate = -Infinity;
  const currencyUpdateThreshold = 60 * 60 * 1000;

  const updateCurrencies = async () => {
    if (Date.now() - lastCurrencyUpdate < currencyUpdateThreshold) return;

    const customUnits = await fetchCurrencies();
    lastCurrencyUpdate = Date.now();
    dispatch(setCustomUnits(customUnits));
  };

  if (AppState) {
    AppState.addEventListener('change', appState => {
      if (appState === 'active') updateCurrencies();
    });
  }

  updateCurrencies();

  return next => action => next(action);
} ;
