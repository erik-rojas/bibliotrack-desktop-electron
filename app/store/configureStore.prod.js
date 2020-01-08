// @flow
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createBrowserHistory } from 'history';
import { routerMiddleware } from 'react-router-redux';

import rootReducer from '../reducers';

const history = createBrowserHistory();
const router = routerMiddleware(history);
const enhancer = applyMiddleware(thunk, router);

// eslint-disable-next-line flowtype-errors/show-errors
const configureStore = (initialState?: {}) => createStore(rootReducer, initialState, enhancer);

export default { configureStore, history };
