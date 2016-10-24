// @flow
/* global document, window */
import 'babel-regenerator-runtime';
import { render } from 'react-dom';
import React from 'react';
import { Router, Route, IndexRoute, hashHistory } from 'react-router';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { includes, flow, split, map, fromPairs, some, isNil } from 'lodash/fp';
import reducer, { loadDocuments, loadDocument, addAccount } from './redux';
import cacheInvalidationMiddleware from './redux/cacheInvalidationMiddleware';
import currencyUpdaterMiddleware from './redux/currencyUpdaterMiddleware';
import persistenceMiddleware from './redux/persistenceMiddleware';
import recoraMiddleware from './redux/recoraMiddleware';
import DocumentList from './components/DocumentList';
import DocumentView from './components/DocumentView';
import type { DocumentId } from './types';

const getParams = flow(
  value => value.substring(1),
  split('&'),
  map(split('=')),
  map(map(decodeURIComponent)),
  fromPairs
);

const accountParams = getParams(window.location.search);
const authenticationParams = getParams(window.location.hash);

const middlewares = applyMiddleware(
  cacheInvalidationMiddleware(),
  currencyUpdaterMiddleware(),
  persistenceMiddleware(),
  recoraMiddleware(),
);
const store = createStore(
  reducer,
  middlewares,
);

const history = hashHistory;
let documentId: ?DocumentId = null;

const onEnterDocumentList = () => {
  documentId = null;
};

const onEnterDocument = (state) => {
  const id: DocumentId = state.params.documentId;
  documentId = id;
  const { documents } = store.getState();

  if (includes(id, documents)) {
    Promise.resolve().then(() => {
      store.dispatch(loadDocument(id));
    });
  } else {
    history.push('/');
  }
};

const getAccountParams = {
  dropbox: (params) => [params.account_id, params.access_token, 'Dropbox'],
};

if (accountParams.account in getAccountParams) {
  const params = getAccountParams[accountParams.account](authenticationParams);
  if (!some(isNil, params)) store.dispatch(addAccount(accountParams.account, ...params));
}

store.dispatch(loadDocuments());

store.subscribe(() => {
  if (documentId) return;
  const { documents } = store.getState();
  if (!includes(documentId, documents)) history.push('/');
});

render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/">
        <Route path=":documentId" component={DocumentView} onEnter={onEnterDocument} />
        <IndexRoute component={DocumentList} onEnter={onEnterDocumentList} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('main')
);
