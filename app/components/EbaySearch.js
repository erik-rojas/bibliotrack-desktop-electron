import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import {
  message, notification, Breadcrumb
} from 'antd';

import EbaySearchForm from './EbaySearchForm';

import styles from './EbaySearch.css';

class EbaySearch extends Component {
  props: {
    location: { pathname: string },
    initialize: (path: string) => void,
    destroy: () => void,
    status: string,
    message: string,
    description: string,
    isMessageShowed: boolean,
    setMessageShowed: () => void,
    searchTable: {
      data: []
    },
    updateSearch: () => void,
    deleteSearch: (searchId: any) => void
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
      status, location, searchTable,
      updateSearch, deleteSearch
    } = this.props;

    const searchKey = queryString.parse(location.search).searchKey;
    const selectedSearch = searchTable.data.filter(item => item.key === searchKey)[0];

    return (
      <div>
        <Breadcrumb className={styles.breadcrumb}>
          <Breadcrumb.Item><Link to="/ebay-searches">eBay searches</Link></Breadcrumb.Item>
          <Breadcrumb.Item>
            {selectedSearch.id} (&quot;{selectedSearch.keywords}&quot;)
          </Breadcrumb.Item>
        </Breadcrumb>
        <div className={styles.form}>
          <EbaySearchForm
            search={selectedSearch}
            onSubmit={updateSearch}
            onDelete={deleteSearch}
            loading={status === 'loading'}
          />
        </div>
      </div>
    );
  }
}

export default EbaySearch;
