// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  message, notification,
  Breadcrumb
} from 'antd';

import NewBookKeywordForm from './NewBookKeywordForm';
import styles from './NewBookKeyword.css';

class NewBookKeyword extends Component {
  props: {
    location: {
      pathname: string,
      search: string
    },
    initialize: (path: string) => void,
    destroy: () => void,
    status: string,
    message: string,
    description: string,
    isMessageShowed: boolean,
    setMessageShowed: () => void,
    selectedBook: {} | null,
    addKeyword: () => void
  };

  componentDidMount() {
    this.props.initialize(this.props.location.pathname);
  }

  componentDidUpdate() {
    if (this.props.isMessageShowed === false) {
      if (this.props.status === 'loading') {
        if (this.props.description !== '') {
          notification.info({
            message: this.props.message,
            description: this.props.description,
            duration: 10,
            placement: 'BottomRight'
          });
        } else if (this.props.message !== '') {
          message.destroy();
          message.loading(this.props.message, 3);
        }
      } else if (this.props.status === 'success') {
        if (this.props.description !== '') {
          notification.success({
            message: this.props.message,
            description: this.props.description,
            duration: 10,
            placement: 'BottomRight'
          });
        } else if (this.props.message !== '') {
          message.destroy();
          message.success(this.props.message, 3);
        }
      } else if (this.props.status === 'error') {
        if (this.props.description !== '') {
          notification.error({
            message: this.props.message,
            description: this.props.description,
            duration: 10,
            placement: 'BottomRight'
          });
        } else if (this.props.message !== '') {
          message.destroy();
          message.error(this.props.message, 3);
        }
      }

      this.props.setMessageShowed();
    }
  }

  componentWillUnmount() {
    this.props.destroy();
  }

  render() {
    const {
      addKeyword, status, selectedBook
    } = this.props;

    return (
      <div>
        <Breadcrumb className={styles.breadcrumb}>
          <Breadcrumb.Item key="1"><Link to="/books">Books</Link></Breadcrumb.Item>
          <Breadcrumb.Item key="2"><Link to="/book">{`${selectedBook.id || ''} ("${selectedBook.title || ''}")`}</Link></Breadcrumb.Item>
          <Breadcrumb.Item key="3"><Link to="/book?tabName=keywords">Keywords</Link></Breadcrumb.Item>
          <Breadcrumb.Item key="4">New keyword</Breadcrumb.Item>
        </Breadcrumb>
        <div className={styles.form}>
          <NewBookKeywordForm
            loading={status === 'loading'}
            onSubmit={addKeyword}
          />
        </div>
      </div>
    );
  }
}

export default NewBookKeyword;
