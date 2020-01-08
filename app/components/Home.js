// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import styles from './Home.css';

export default class Home extends Component {
  render() {
    return (
      <div className={styles.container} data-tid="container">
        <div className={styles.list}>
          <Link to="/books">Books</Link>
          <br />
          <Link to="/amazon-searches">Amazon Searches</Link>
          <Link disabled to="/amazon-data">Amazon Data</Link>
          <br />
          <Link to="/ebay-searches">eBay Searches</Link>
          <Link to="/ebay-data">eBay Data</Link>
          <br />
          <Link to="/settings">Settings</Link>
        </div>
      </div>
    );
  }
}
