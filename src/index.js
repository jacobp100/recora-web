// @flow
/* global document */
import { render } from 'react-dom';
import React from 'react';
import { Router, Route, IndexRoute, hashHistory } from 'react-router';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import reducer, { loadDocument } from './redux';
import persistenceMiddleware from './redux/persistenceMiddleware';
import recoraMiddleware from './redux/recoraMiddleware';
import DocumentList from './components/DocumentList';
import DocumentView from './components/DocumentView';

const middlewares = applyMiddleware(
  persistenceMiddleware(),
  recoraMiddleware(),
);
const store = createStore(
  reducer,
  middlewares,
);

const onEnterDocument = (state) => Promise.resolve().then(() => {
  store.dispatch(loadDocument(state.params.documentId));
});

render(
  <Provider store={store}>
    <Router history={hashHistory}>
      <Route path="/">
        <Route path=":documentId" component={DocumentView} onEnter={onEnterDocument} />
        <IndexRoute component={DocumentList} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('main')
);
