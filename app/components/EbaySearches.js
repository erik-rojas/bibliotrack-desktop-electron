import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  message, notification, Row, Col,
  Icon, Table, Button, Badge
} from 'antd';

import styles from './EbaySearches.css';

class EbaySearches extends Component {
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
      fetchedAll: number,
      height: number,
      loading: boolean,
      data: []
    },
    setSearchTableHeight: (pixels: number) => void,
    loadSearchesTable: () => void,
    showSearch: (key: any) => void
  };

  componentDidMount() {
    this.props.initialize(this.props.location.pathname);
    this.props.loadSearchesTable();

    this.handleWindowResize();
    window.addEventListener('resize', this.handleWindowResize);
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
            duration: 0,
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
    window.removeEventListener('resize', this.handleWindowResize);

    this.props.destroy();
  }

  handleWindowResize = () => {
    const height = window.innerHeight
      || document.documentElement.clientHeight
      || document.getElementsByTagName('body')[0].clientHeight;

    this.props.setSearchTableHeight(height - 290);
  };

  handleTableReload = () => {
    this.props.loadSearchesTable();
  };

  handleRowClick = (record) => {
    console.log(`[${record.key}] Row clicked`);
    this.props.showSearch(record.key);
  };

  render() {
    const {
      searchTable
    } = this.props;

    const columns = [{
      title: 'Keywords',
      dataIndex: 'keywords',
      key: 'keywords',
      width: '28%',
      render: (item) => (
        <span>&quot;{item}&quot;</span>
      )
    }, {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (item) => {
        let status = '';

        if (item === 'Waiting') {
          status = 'success';
        } else if (item === 'Searching') {
          status = 'processing';
        } else {
          status = 'default';
        }

        return <span><Badge status={status} />{item}</span>;
      }
    }, {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '10%'
    }, {
      title: 'Channels',
      dataIndex: 'channels',
      key: 'channels',
      width: '8%',
      render: (items) => (
        <div style={{ display: 'grid' }}>
          {items.map(item => <span key={item.id}>{item.name}</span>)}
        </div>
      )
    }, {
      title: 'Categories',
      dataIndex: 'categories',
      key: 'categories',
      width: '10%',
      render: (items) => (
        <div style={{ display: 'grid' }}>
          {items.map(item => <span key={item.id}>{item.name}</span>)}
        </div>
      )
    }, {
      title: 'Min price',
      dataIndex: 'minPrice',
      key: 'minPrice',
      width: '8%',
      render: (item) => (
        <span>{item === null ? '\u2014' : item}</span>
      )
    }, {
      title: 'Max price',
      dataIndex: 'maxPrice',
      key: 'maxPrice',
      width: '8%',
      render: (item) => (
        <span>{item === null ? '\u2014' : item}</span>
      )
    }, {
      title: 'Last search',
      dataIndex: 'lastSearch',
      key: 'lastSearch',
      width: '10%',
      render: (item) => {
        const time = item === '' ? '\u2014' : item.split(' ')[0];
        const date = item === '' ? '\u2014' : item.split(' ')[1];

        if (time === date) {
          return (
            <span>{time}</span>
          );
        }

        return (
          <div>
            <span style={{ whiteSpace: 'nowrap' }}>{time}</span>
            <br />
            <span style={{ whiteSpace: 'nowrap' }}>{date}</span>
          </div>
        );
      }
    }, {
      title: 'Fetched',
      dataIndex: 'resultsFetched',
      key: 'resultsFetched',
      width: '8%',
      render: (item, record) => (
        <div>
          <span style={{ whiteSpace: 'nowrap' }}>{item}</span>
          <br />
          <span style={{ whiteSpace: 'nowrap' }}>({record.duplicatesFetched})</span>
        </div>
      )
    }];

    return (
      <div>
        <div className={styles.table}>
          <Row style={{ marginBottom: 10 }}>
            <Col span={12} />
            <Col span={12}>
              <Button onClick={this.handleTableReload} style={{ float: 'right' }}><Icon type="reload" /></Button>
              <Button type="primary" style={{ float: 'right', marginRight: 8 }}>
                <Link to="/ebay-new-search">
                  <Icon type="plus" /> New search
                </Link>
              </Button>
              <span style={{ float: 'right', marginRight: 15, lineHeight: 2.5 }}>Fetched all: <b>{searchTable.fetchedAll}</b></span>
            </Col>
          </Row>
          <Table
            columns={columns}
            dataSource={searchTable.data}
            pagination={{ pageSize: 10 }}
            scroll={{ y: searchTable.height }}
            bordered
            rowClassName={() => styles.tableRow}
            onRow={(record) => ({
              onClick: () => this.handleRowClick(record)
            })}
            loading={searchTable.loading}
          />
        </div>
      </div>
    );
  }
}

export default EbaySearches;
