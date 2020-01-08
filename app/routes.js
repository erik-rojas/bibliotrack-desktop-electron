/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route, Redirect } from 'react-router';

import App from './containers/App';
import AmazonSearchesPage from './containers/AmazonSearchesPage';
import AmazonNewSearchPage from './containers/AmazonNewSearchPage';
import AmazonDataPage from './containers/AmazonDataPage';
import EbayDataPage from './containers/EbayDataPage';
import EbaySearchesPage from './containers/EbaySearchesPage';
import EbaySearchPage from './containers/EbaySearchPage';
import EbayNewSearchPage from './containers/EbayNewSearchPage';
import SettingsPage from './containers/SettingsPage';
import BooksPage from './containers/BooksPage';
import BookPage from './containers/BookPage';
import EditBookPage from './containers/EditBookPage';
import NewBookPage from './containers/NewBookPage';
import NewBookKeywordPage from './containers/NewBookKeywordPage';
import EditBookKeywordPage from './containers/EditBookKeywordPage';

export default () => (
  <App>
    <Switch>
      <Route path="/books" component={BooksPage} />
      <Route path="/book" component={BookPage} />
      <Route path="/edit-book" component={EditBookPage} />
      <Route path="/new-book" component={NewBookPage} />
      <Route path="/new-book-keyword" component={NewBookKeywordPage} />
      <Route path="/edit-book-keyword" component={EditBookKeywordPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/amazon-data" component={AmazonDataPage} />
      <Route path="/amazon-searches" component={AmazonSearchesPage} />
      <Route path="/amazon-new-search" component={AmazonNewSearchPage} />
      <Route path="/ebay-data" component={EbayDataPage} />
      <Route path="/ebay-searches" component={EbaySearchesPage} />
      <Route path="/ebay-search" component={EbaySearchPage} />
      <Route path="/ebay-new-search" component={EbayNewSearchPage} />
      <Redirect from="/" to="/books" />
    </Switch>
  </App>
);
