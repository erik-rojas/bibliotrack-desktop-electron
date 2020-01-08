// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  message, notification,
  Breadcrumb
} from 'antd';

import EditBookKeywordForm from './EditBookKeywordForm';
import styles from './EditBookKeyword.css';

class EditBookKeyword extends Component {
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
    selectedKeyword: {} | null,
    updateKeyword: (type: string | void) => void
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
      updateKeyword, status, selectedBook, selectedKeyword
    } = this.props;

    return (
      <div>
        <Breadcrumb className={styles.breadcrumb}>
          <Breadcrumb.Item><Link to="/books">Books</Link></Breadcrumb.Item>
          <Breadcrumb.Item><Link to="/book">{`${selectedBook.id || ''} ("${selectedBook.title || ''}")`}</Link></Breadcrumb.Item>
          <Breadcrumb.Item><Link to="/book?tabName=keywords">Keywords</Link></Breadcrumb.Item>
          <Breadcrumb.Item>{`${selectedKeyword.id || ''} ("${selectedKeyword.keyword || ''}")`}</Breadcrumb.Item>
          <Breadcrumb.Item>Edit</Breadcrumb.Item>
        </Breadcrumb>
        <div className={styles.form}>
          <EditBookKeywordForm
            keywordData={selectedKeyword}
            loading={status === 'loading'}
            onSubmit={updateKeyword}
            bookId={selectedBook.id}
          />
        </div>
      </div>
    );
  }
}

export default EditBookKeyword;
