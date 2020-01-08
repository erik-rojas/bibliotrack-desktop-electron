// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { message, notification, Breadcrumb } from 'antd';

import AmazonNewSearchForm from './AmazonNewSearchForm';

import styles from './AmazonNewSearch.css';

class AmazonNewSearch extends Component {
  props: {
    init: (path: string) => void,
    location: { pathname: string },
    destroy: () => void,
    addSearch: () => void,
    status: string,
    message: string,
    description: string | void
  };

  componentDidMount() {
    this.props.init(this.props.location.pathname);
  }

  componentDidUpdate() {
    if (((this.props.status !== '') && (this.props.message !== ''))) {
      message.destroy();
      notification.destroy();

      if (this.props.status === 'loading') {
        message.loading(this.props.message, 10);
      } else if (this.props.status === 'success') {
        message.success(this.props.message, 1.7);
      } else if (this.props.status === 'error') {
        notification.error({
          message: this.props.message,
          description: this.props.description,
          duration: 10
        });
      }
    }
  }

  componentWillUnmount() {
    this.props.destroy();
  }

  handleSubmit = () => {
    this.props.addSearch();
  };

  render() {
    const { status } = this.props;

    return (
      <div>
        <Breadcrumb className={styles.breadcrumb}>
          <Breadcrumb.Item><Link to="/amazon-searches">Amazon</Link></Breadcrumb.Item>
          <Breadcrumb.Item>New search</Breadcrumb.Item>
        </Breadcrumb>
        <AmazonNewSearchForm loading={status === 'loading'} formReset={status === 'success'} onSubmit={this.handleSubmit} />
      </div>
    );
  }
}

export default AmazonNewSearch;
