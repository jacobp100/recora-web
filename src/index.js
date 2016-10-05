// @flow
/* global document */
import 'babel-regenerator-runtime';
import { render } from 'react-dom';
import React from 'react';
import { Router, Route, IndexRoute, hashHistory } from 'react-router';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { includes } from 'lodash/fp';
import reducer, { loadDocument } from './redux';
import persistenceMiddleware from './redux/persistenceMiddleware';
import recoraMiddleware from './redux/recoraMiddleware';
import DocumentList from './components/DocumentList';
import DocumentView from './components/DocumentView';
import type { DocumentId } from './types';

const middlewares = applyMiddleware(
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
