// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { reducer as form } from 'redux-form';

import settings from './settings';
import amazon from './amazon';
import ebay from './ebay';
import books from './books';

const rootReducer = combineReducers({
  settings,
  amazon,
  ebay,
  books,
  form,
  router
});

export default rootReducer;
