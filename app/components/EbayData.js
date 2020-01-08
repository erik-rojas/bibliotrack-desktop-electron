// @flow
const { shell } = require('electron');
import React, { Component } from 'react';
import getCurrencyCode from '../utils/getCurrencyCode';
import {
  notification, message, Icon, Popover, Popconfirm,
  Table, Button, Input, Row, Col, Modal, Select
} from 'antd';

import styles from './EbayData.css';

const { Option } = Select;

export default class EbayData extends Component {
  props: {
    location: { pathname: string },
    initialize: (path: string) => void,
    destroy: () => void,
    status: string,
    message: string,
    description: string,
    isMessageShowed: boolean,
    setMessageShowed: () => void,
    dataTable: {
      selectedType: string,
      height: number,
      data: [],
      pagination: {
        pageSize: number,
        current: number,
        total: number,
        sortField: string,
        sortOrder: string,
        filterTitle: string,
        filterSellerName: string,
        filterChannel: string,
        filterCategory: string
      },
      loading: boolean,
      searched: [],
      searchVisible: string,
      selectedRowsKeys: []
    },
    dataCollector: {
      completed: {
        status: string
      },
      live: {
        status: string
      }
    },
    changeEbayData: (type: string) => void,
    resaveCover: (id: string) => void,
    loadDataTable: (options: {}) => void,
    setDataTableSearchTitle: (title: string) => void,
    setDataTableSearchSellerName: (sellerName: string) => void,
    setDataTableSearchVisible: (column: string) => void,
    setDataTableSearched: (value: []) => void,
    setDataTableHeight: (pixels: number) => void,
    setDataTableType: (type: string) => void,
    startSearch: () => void,
    stopSearch: () => void,
    setDataTableCoverURL: (key: string, value: string) => void,
    exportData: () => void,
    restoreItem: (id: string) => void,
    deleteItem: (id: string) => void,
    selectDataTableRows: (keys: []) => void
  };

  tableUnselected = false;
  tableRef = null;

  componentDidMount() {
    this.props.initialize(this.props.location.pathname);
    this.props.setDataTableType('Default');

    this.handleWindowResize();
    window.addEventListener('resize', this.handleWindowResize);
  }

  componentDidUpdate() {
    if (this.props.dataTable.selectedRowsKeys.length === 0 && !this.tableUnselected) {
      this.tableRef.store.setState({ selectedRowKeys: [], selectionDirty: true });

      this.tableUnselected = true;
    } else if (this.props.dataTable.selectedRowsKeys.length > 0) {
      this.tableUnselected = false;
    }

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
    window.removeEventListener('resize', this.handleWindowResize);

    this.props.destroy();
  }

  refreshTable = () => {
    this.props.loadDataTable(this.props.dataTable.pagination);
  };

  handleWindowResize = () => {
    const height = window.innerHeight
      || document.documentElement.clientHeight
      || document.getElementsByTagName('body')[0].clientHeight;

    this.props.setDataTableHeight(this.props.dataTable.data.length > 0 ? height - 175 : 0);
  };

  handleTableChange = (pagination: any, filters: any, sorter: any) => {
    console.log(pagination);
    console.log(filters);
    console.log(sorter);

    if (this.props.dataTable.pagination.filterTitle === '' && this.props.dataTable.pagination.filterSellerName === '') {
      this.props.setDataTableSearched([]);
    } else if (this.props.dataTable.pagination.filterTitle === '') {
      this.props.setDataTableSearched(['seller_name']);
    } else if (this.props.dataTable.pagination.filterSellerName === '') {
      this.props.setDataTableSearched(['title']);
    } else {
      this.props.setDataTableSearched(['title', 'seller_name']);
    }

    this.props.loadDataTable({
      pageSize: pagination.pageSize,
      current: pagination.current,
      sortField: sorter.field || '',
      sortOrder: sorter.order || '',
      filterTitle: this.props.dataTable.pagination.filterTitle,
      filterSellerName: this.props.dataTable.pagination.filterSellerName,
      filterChannel: filters.channel !== undefined && filters.channel.length > 0 ? filters.channel[0] : '',
      filterCategory: filters.category !== undefined && filters.category.length > 0 ? filters.category[0] : ''
    });
  };

  handleTableSearch = (data: any) => {
    if (data !== undefined) {
      if (data.hide === true) {
        this.props.setDataTableSearchVisible('');
      }

      if (data.reset === 'title') {
        this.props.setDataTableSearchTitle('');
      } else if (data.reset === 'seller_name') {
        this.props.setDataTableSearchSellerName('');
      }
    }

    if ((this.props.dataTable.pagination.filterTitle === '' && this.props.dataTable.pagination.filterSellerName === '')
      || (data !== undefined && (data.reset === 'title' || data.reset === 'seller_name'))) {
      this.props.setDataTableSearched([]);
    } else if (this.props.dataTable.pagination.filterTitle === '' || (data !== undefined && data.reset === 'title')) {
      this.props.setDataTableSearched(['seller_name']);
    } else if (this.props.dataTable.pagination.filterSellerName === ''
      || (data !== undefined && data.reset === 'seller_name')) {
      this.props.setDataTableSearched(['title']);
    } else {
      this.props.setDataTableSearched(['title', 'seller_name']);
    }

    this.props.loadDataTable({
      ...this.props.dataTable.pagination,
      filterTitle: data !== undefined && data.reset === 'title' ? '' : this.props.dataTable.pagination.filterTitle,
      filterSellerName: data !== undefined && data.reset === 'seller_name'
        ? ''
        : this.props.dataTable.pagination.filterSellerName
    });
  };

  showZoomedImage = (image: any) => {
    Modal.info({
      iconType: '',
      content: <img
        style={{ marginLeft: '-40px' }}
        alt=""
        src={image}
      />,
      width: 'max-content',
      style: { top: 20 },
      okText: 'Cancel',
      onOk() {}
    });
  };

  onTableSelectChange = (selectedRowsKeys) => {
    this.props.selectDataTableRows(selectedRowsKeys);
  };

  render() {
    const {
      dataTable, setDataTableType, changeEbayData,
      setDataTableSearchTitle, setDataTableSearchSellerName, setDataTableSearchVisible
    } = this.props;

    const searchIconTitle = dataTable.searched.includes('title')
      ? <Icon type="search" style={{ color: '#108ee9' }} />
      : <Icon type="search" />;

    const searchIconSellerName = dataTable.searched.includes('seller_name')
      ? <Icon type="search" style={{ color: '#108ee9' }} />
      : <Icon type="search" />;

    const columns = [
      {
        title: 'Cover',
        dataIndex: 'cover',
        key: 'cover',
        width: '15%',
        render: (data, record) => {
          if (data !== null && record.image_type !== null) {
            return (<img
              style={{ cursor: 'pointer' }}
              alt=""
              src={`data:${record.image_type};${data}`}
              onClick={() => this.showZoomedImage(`data:${record.image_type};${data}`)}
              className={styles.image}
            />);
          }
          return <span>Image getting error</span>;
        },
        sorter: true
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        width: '8%',
        render: (data, record) => `${getCurrencyCode(record.currency_code)} ${data}`,
        sorter: true,
        className: styles.alignCenter
      },
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        width: '41%',
        sorter: true,
        render: (data, record) => <a onClick={() => shell.openExternal(record.view_url)}>
          {data}</a>,
        filterDropdown: (
          <div className={styles.tableSearch}>
            <Input
              placeholder="Search for title..."
              value={dataTable.pagination.filterTitle}
              onChange={(event) => setDataTableSearchTitle(event.target.value)}
              onPressEnter={() => this.handleTableSearch({ hide: true })}
            />

            <div>
              <a role="button" onClick={() => this.handleTableSearch({ hide: true })}>Search</a>
              <a
                role="button"
                style={{ float: 'right' }}
                onClick={() => this.handleTableSearch({ reset: 'title', hide: true })}
              >Reset
              </a>
            </div>
          </div>
        ),
        filterIcon: searchIconTitle,
        filterDropdownVisible: dataTable.searchVisible === 'title',
        onFilterDropdownVisibleChange: (visible) => {
          if (!visible) {
            this.handleTableSearch({ hide: true });
          } else {
            setDataTableSearchVisible('title');
          }
        },
      },
      {
        title: 'Channel',
        dataIndex: 'channel',
        key: 'channel',
        width: '11%',
        filters: [
          { text: 'ebay.co.uk', value: 'ebay.co.uk' },
          { text: 'ebay.de', value: 'ebay.de' },
          { text: 'ebay.it', value: 'ebay.it' },
          { text: 'ebay.fr', value: 'ebay.fr' },
          { text: 'ebay.es', value: 'ebay.es' },
          { text: 'ebay.com', value: 'ebay.com' }
        ],
        filterMultiple: false,
        sorter: true
      },
      {
        title: 'Seller',
        dataIndex: 'seller_name',
        key: 'seller_name',
        width: '20%',
        render: (data, record) => {
          if ((data !== null && data !== '') && record.seller_feedback !== null) {
            return (
              <div>
                <span>{data + ' (' + record.seller_feedback + ')'}</span>
              </div>
            );
          }

          return (<span>{'\u2014'}</span>);
        },
        sorter: true,
        filterDropdown: (
          <div className={styles.tableSearch}>
            <Input
              placeholder="Search for seller..."
              value={dataTable.pagination.filterSellerName}
              onChange={(event) => setDataTableSearchSellerName(event.target.value)}
              onPressEnter={() => this.handleTableSearch({ hide: true })}
            />

            <div>
              <a role="button" onClick={() => this.handleTableSearch({ hide: true })}>Search</a>
              <a
                role="button"
                style={{ float: 'right' }}
                onClick={() => this.handleTableSearch({ reset: 'seller_name', hide: true })}
              >Reset
              </a>
            </div>
          </div>
        ),
        filterIcon: searchIconSellerName,
        filterDropdownVisible: dataTable.searchVisible === 'seller_name',
        onFilterDropdownVisibleChange: (visible) => {
          if (!visible) {
            this.handleTableSearch({ hide: true });
          } else {
            setDataTableSearchVisible('seller_name');
          }
        },
      }
    ];

    const ebayDataRowSelection = {
      selectedRowsKeys: dataTable.selectedRowsKeys,
      onChange: this.onTableSelectChange,
      onSelect: (record, selected, selectedRows) => {
        console.log('Selected:');
        console.log(selected);

        console.log('Selected Rows:');
        console.log(selectedRows);
      }
    };

    let restoreDisabled = true;

    if (dataTable.selectedRowsKeys.length > 0) {
      restoreDisabled = !(dataTable.selectedType === 'Fake'
        || dataTable.selectedType === 'Spam'
        || dataTable.selectedType === 'No image');
    } else {
      restoreDisabled = true;
    }

    return (
      <div>
        <div className={styles.table}>
          <Row style={{ marginBottom: 10 }}>
            <Col span={12}>
              <Button
                type="danger"
                style={{ float: 'left' }}
                onClick={() => changeEbayData('Delete')}
                disabled={!(dataTable.selectedRowsKeys.length > 0)}
              >
                <Icon type="delete" />
                Delete
              </Button>
              <Button
                type="primary"
                style={{ float: 'left', marginLeft: 10 }}
                onClick={() => dataTable.selectedType === 'No image'
                  ? changeEbayData('Resave') : changeEbayData('Restore')}
                disabled={restoreDisabled}
              >
                Restore
              </Button>
              <span style={{ marginLeft: 10, lineHeight: 2.3 }}>
                {dataTable.selectedRowsKeys.length > 0
                  ? `Selected ${dataTable.selectedRowsKeys.length} items`
                  : ''}
              </span>
            </Col>
            <Col span={12}>
              <Button onClick={this.refreshTable} style={{ float: 'right' }}>
                <Icon type="reload" />
              </Button>
              <Select
                style={{ float: 'right', width: 250, marginRight: 10 }}
                placeholder="Type"
                value={dataTable.selectedType}
                onChange={(value) => setDataTableType(value)}
                disabled={dataTable.loading}
              >
                <Option key="Default">Default</Option>
                <Option key="No image">No image</Option>
                <Option key="Fake">Fake</Option>
                <Option key="Spam">Spam</Option>
              </Select>
            </Col>
          </Row>
          <Table
            ref={(el) => { this.tableRef = el; }}
            columns={columns}
            dataSource={dataTable.data}
            pagination={dataTable.pagination}
            rowSelection={ebayDataRowSelection}
            onChange={this.handleTableChange}
            scroll={{ y: dataTable.height }}
            bordered
            loading={dataTable.loading}
          />
        </div>
      </div>
    );
  }
}
