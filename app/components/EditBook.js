// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  message, notification,
  Breadcrumb
} from 'antd';

import EditBookForm from './EditBookForm';
import styles from './EditBook.css';

class EditBook extends Component {
  props: {
    location: { pathname: string },
    initialize: (path: string) => void,
    destroy: () => void,
    status: string,
    message: string,
    description: string,
    isMessageShowed: boolean,
    selectedBook: {} | null,
    setMessageShowed: () => void,
    autoCompleteData: {
      authors: [],
      publishers: [],
      filtered: {
        authors: [],
        publishers: []
      }
    },
    updateBook: () => void,
    autoCompleteBook: (field: string, value: string) => void,
    setAuthorsSizeForSelectedBook: (size: number) => void,
    setSerialsSizeForSelectedBook: (size: number) => void
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
      updateBook, status, setAuthorsSizeForSelectedBook,
      autoCompleteData, autoCompleteBook, selectedBook, setSerialsSizeForSelectedBook
    } = this.props;

    return (
      <div>
        <Breadcrumb className={styles.breadcrumb}>
          <Breadcrumb.Item><Link to="/books">Books</Link></Breadcrumb.Item>
          <Breadcrumb.Item><Link to="/book">{`${selectedBook.id || ''} ("${selectedBook.title || ''}")`}</Link></Breadcrumb.Item>
          <Breadcrumb.Item>Edit</Breadcrumb.Item>
        </Breadcrumb>
        <div className={styles.form}>
          <EditBookForm
            bookData={selectedBook}
            setAuthorsSizeForSelectedBook={setAuthorsSizeForSelectedBook}
            setSerialsSizeForSelectedBook={setSerialsSizeForSelectedBook}
            onAutoComplete={autoCompleteBook}
            autoCompleteData={autoCompleteData}
            loading={status === 'loading'}
            onSubmit={updateBook}
          />
        </div>
      </div>
    );
  }
}

export default EditBook;
