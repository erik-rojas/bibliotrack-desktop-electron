// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Affix, Icon } from 'antd';

import styles from './AmazonData.css';

export default class AmazonData extends Component {
  render() {
    return (
      <div>
        <Affix offsetTop={17} className={styles.backButton}>
          <Link to="/">
            <Icon type="left" />
            Back
          </Link>
        </Affix>
      </div>
    );
  }
}
