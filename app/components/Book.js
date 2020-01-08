// @flow
const { shell } = require('electron');
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
const queryString = require('query-string');
import {
  message, notification, Breadcrumb, Popconfirm,
  Icon, Tabs, Row, Col, Input, Select,
  List, Table, Button, Modal, Card, Radio
} from 'antd';
import BookEbayDataTable from './BookEbayDataTable';

import styles from './Book.css';

const ButtonGroup = Button.Group;
const Option = Select.Option;
const TabPane = Tabs.TabPane;

class Book extends Component {
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
    selectedBookTab: string,
    keywordsTable: {
      data: [],
      height: number,
      isLoading: boolean,
      autoComplete: {
        filtered: []
      }
    },
    dataTable: {
      data: [],
      height: number,
      isLoading: boolean,
      selectedRowsKeys: [],
      selectedType: string,
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
      count: {
        pending: number | null,
        approved: number | null,
        rejected: number | null
      },
      searched: [],
      searchVisible: string
    },
    setKeywordsTableHeight: (pixels: number) => void,
    setDataTableHeight: (pixels: number) => void,
    setDataTableSearchTitle: (title: string) => void,
    setDataTableSearchSellerName: (sellerName: string) => void,
    setDataTableSearchVisible: (column: string) => void,
    setDataTableSearched: (value: []) => void,
    setKeywordFieldValue: (field: string, value: any) => void,
    editKeyword: (id: string) => void,
    deleteKeyword: (id: string, bookId: string) => void,
    loadKeywords: (withoutMessage: boolean) => void,
    loadEbayData: (withoutMessage: boolean, type: string | void, options: {} | void) => void,
    selectDataTableRows: (selectedRowsKeys: []) => void,
    setDataTableType: (type: string) => void,
    changeEbayData: (action: string) => void,
    searchKeywords: () => void,
    previewSearchKeywords: () => void,
    recalculateBookPrices: () => void,
    deleteBook: (id: string) => void,
    autoCompleteKeywords: (value: string) => void,
    changeBook: (string: type) => void,
    changeBookTab: (string: type) => void
  };

  dataTableRef = null;

  scrollToTop = () => {
    if (this.dataTableRef !== null) {
      console.log(this.dataTableRef);
      const container = ReactDOM.findDOMNode(this.dataTableRef).getElementsByClassName('ant-table-tbody')[0];

      container.scrollIntoView({ behavior: "smooth" });
    }
  };

  componentDidMount() {
    this.props.initialize(this.props.location.pathname);
    this.props.loadKeywords(true);
    this.props.setDataTableType('Pending');

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
    this.props.changeBookTab('info');
    this.props.destroy();
  }

  handleWindowResize = () => {
    const height = window.innerHeight
      || document.documentElement.clientHeight
      || document.getElementsByTagName('body')[0].clientHeight;

    this.props.setKeywordsTableHeight(this.props.keywordsTable.data.length > 0 ? height - 280 : 0);
    this.props.setDataTableHeight(this.props.dataTable.data.length > 0 ? height - 280 : 0);
  };

  handleTableSearch = (data: any) => {
    this.scrollToTop();

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

    this.props.loadEbayData(false, null, {
      ...this.props.dataTable.pagination,
      filterTitle: data !== undefined && data.reset === 'title' ? '' : this.props.dataTable.pagination.filterTitle,
      filterSellerName: data !== undefined && data.reset === 'seller_name'
        ? ''
        : this.props.dataTable.pagination.filterSellerName
    })
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

  handleTableChange = (pagination: any, filters: any, sorter: any) => {
    this.scrollToTop();

    if (this.props.dataTable.pagination.filterTitle === '' && this.props.dataTable.pagination.filterSellerName === '') {
      this.props.setDataTableSearched([]);
    } else if (this.props.dataTable.pagination.filterTitle === '') {
      this.props.setDataTableSearched(['seller_name']);
    } else if (this.props.dataTable.pagination.filterSellerName === '') {
      this.props.setDataTableSearched(['title']);
    } else {
      this.props.setDataTableSearched(['title', 'seller_name']);
    }

    this.props.loadEbayData(false, null, {
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

  render() {
    const {
      status, deleteBook, setDataTableSearchTitle, setDataTableSearchSellerName, setDataTableSearchVisible, changeBook,
      searchKeywords, recalculateBookPrices, selectedBook, selectDataTableRows, setDataTableType, changeEbayData, changeBookTab,
      keywordsTable, dataTable, loadKeywords, loadEbayData, deleteKeyword, editKeyword, previewSearchKeywords, selectedBookTab
    } = this.props;

    const actionButtons = (
      <div>
        <Popconfirm title="Are you sure?" onConfirm={() => deleteBook(selectedBook.id)}>
          <Button
            type="danger"
            style={{ float: 'right', marginRight: 60, marginTop: 10 }}
          >
            <Icon type="delete" />Delete
          </Button>
        </Popconfirm>
        <Button
          type="primary"
          style={{ float: 'right', marginRight: 10, marginTop: 10 }}
        >
          <Link to="/edit-book"><Icon type="edit" />Edit</Link>
        </Button>
      </div>
    );

    const bookData = [
      {
        title: 'Year',
        description: selectedBook.year === null || selectedBook.year === '' ? '\u2014' : selectedBook.year
      },
      {
        title: 'Title',
        description: selectedBook.title === null || selectedBook.title === '' ? '\u2014' : selectedBook.title
      },
      {
        title: 'Author',
        description: selectedBook.author === null || selectedBook.author === '' ? '\u2014' : selectedBook.author
      },
      {
        title: 'Publisher',
        description: selectedBook.publisher === null || selectedBook.publisher === '' ? '\u2014' : selectedBook.publisher
      },
      {
        title: 'Language',
        description: selectedBook.language === null || selectedBook.language === '' ? '\u2014' : selectedBook.language
      },
      {
        title: '',
        description: ''
      }
    ];

    const secondBookData = [
      {
        title: 'ISBN 13',
        description: selectedBook.isbn_13 === null || selectedBook.isbn_13 === '' ? '\u2014' : selectedBook.isbn_13
      },
      {
        title: 'ISBN 10',
        description: selectedBook.isbn_10 === null || selectedBook.isbn_10 === '' ? '\u2014' : selectedBook.isbn_10
      },
      {
        title: 'ASIN',
        description: selectedBook.asin === null || selectedBook.asin === '' ? '\u2014' : selectedBook.asin
      },
      {
        title: 'Series',
        description: selectedBook.series === null || selectedBook.series === '' ? '\u2014' : selectedBook.series
      },
      {
        title: '# in series',
        description: selectedBook.series_number === null || selectedBook.series_number === ''
          ? '\u2014' : selectedBook.series_number
      },
      {
        title: '',
        description: actionButtons
      }
    ];

    const ebayKeywordsColumns = [{
      title: '',
      dataIndex: 'key',
      key: 'key',
      width: '11%',
      render: (key) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          <Button type="primary" onClick={() => editKeyword(key)}>
            <Icon type="edit" />
          </Button>
          <Popconfirm title="Are you sure?" onConfirm={() => deleteKeyword(key, selectedBook.id)}>
            <Button
              type="danger"
              style={{ marginLeft: 10 }}
            >
              <Icon type="delete" />
            </Button>
          </Popconfirm>
        </span>
      )
    }, {
      title: 'Shared',
      dataIndex: 'isShared',
      key: 'isShared',
      width: '7%',
      render: (key) => (
        <span>{key === true ? 'Yes' : 'No'}</span>
      )
    }, {
      title: 'Keyword',
      dataIndex: 'keyword',
      key: 'keyword',
      width: '33%'
    }, {
      title: 'Categories',
      dataIndex: 'categories',
      key: 'categories',
      width: '12%',
      render: (items) => (
        <div style={{ display: 'grid' }}>
          {items.map(item => <span key={item.id}>{item.name}</span>)}
        </div>
      )
    }, {
      title: 'Channels',
      dataIndex: 'channels',
      key: 'channels',
      width: '12%',
      render: (items) => (
        <div style={{ display: 'grid' }}>
          {items.map(item => <span key={item.id}>{item.name}</span>)}
        </div>
      )
    }, {
      title: 'Min price',
      dataIndex: 'minPrice',
      key: 'minPrice',
      width: '10%',
      render: (item) => (
        <span>{item === null ? '\u2014' : item}</span>
      )
    }, {
      title: 'Max price',
      dataIndex: 'maxPrice',
      key: 'maxPrice',
      width: '10%',
      render: (item) => (
        <span>{item === null ? '\u2014' : item}</span>
      )
    }];

    const searchIconTitle = dataTable.searched.includes('title')
      ? <Icon type="search" style={{ color: '#108ee9' }} />
      : <Icon type="search" />;

    const searchIconSellerName = dataTable.searched.includes('seller_name')
      ? <Icon type="search" style={{ color: '#108ee9' }} />
      : <Icon type="search" />;

    const ebayDataColumns = [{
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
    }, {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: '10%',
      render: (data, record) => `${data} ${record.currency_code}`,
      sorter: true,
      className: styles.alignCenter
    }, {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: '31%',
      sorter: true,
      render: (data, record) => <a onClick={() => shell.openExternal(record.view_url)}>
        {record.is_needed_checking === true ? <Icon type="question-circle" /> : ''} {data}
      </a>,
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
            >
              Reset
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
      }
    }, {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: '11%',
      sorter: true,
      filters: [
        { text: 'ebay.co.uk', value: 'ebay.co.uk' },
        { text: 'ebay.de', value: 'ebay.de' },
        { text: 'ebay.it', value: 'ebay.it' },
        { text: 'ebay.fr', value: 'ebay.fr' },
        { text: 'ebay.es', value: 'ebay.es' },
        { text: 'ebay.com', value: 'ebay.com' }
      ],
      filterMultiple: false
    }, {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '11%',
      sorter: true,
      filters: [
        { text: 'Books', value: 267 },
        { text: 'Comic Books', value: 63 }
      ],
      filterMultiple: false
    }, {
      title: 'Seller',
      dataIndex: 'seller_name',
      key: 'seller_name',
      width: '17%',
      sorter: true,
      render: (data, record) => {
        if ((data !== null && data !== '') && record.seller_feedback !== null) {
          return (
            <div>
              <span>{data}</span>
              <br />
              <span style={{ whiteSpace: 'nowrap' }}>({record.seller_feedback})</span>
            </div>
          );
        }

        return (<span>{'\u2014'}</span>);
      },
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
      }
    }];

    return (
      <div>
        <Breadcrumb className={styles.breadcrumb}>
          <Breadcrumb.Item><Link to="/books">Books</Link></Breadcrumb.Item>
          <Breadcrumb.Item>{`${selectedBook.id || ''} ("${selectedBook.title || ''}")`}</Breadcrumb.Item>
        </Breadcrumb>
        <div style={{ position: 'absolute', right: 10, zIndex: 999 }}>
          <Button style={{ marginRight: 10 }} onClick={() => changeBook('previous')}>
            Previous
          </Button>
          <Button onClick={() => changeBook('next')}>
            Next
          </Button>
        </div>
        <div className={styles.form}>
          <Tabs onChange={activeKey => changeBookTab(activeKey)} activeKey={this.props.location.search !== ''
            ? queryString.parse(this.props.location.search).tabName
            : selectedBookTab }>
            <TabPane tab="Info" key="info">
              <Row gutter={20}>
                <Col span={8} style={{ float: 'left' }}>
                  <img
                    style={{ cursor: 'pointer', marginLeft: 20 }}
                    alt="No image"
                    src={`data:${selectedBook.cover}`}
                    onClick={() => this.showZoomedImage(`data:${selectedBook.cover}`)}
                    className={styles.image}
                  />
                </Col>
                <Col span={4} style={{ float: 'right' }}>
                  <Card title="Max price" bordered={false}>{selectedBook.max_price === null
                    || selectedBook.max_price === undefined
                    ? '\u2014' : selectedBook.max_price}
                  </Card>
                </Col>
                <Col span={4} style={{ float: 'right' }}>
                  <Card title="Min price" bordered={false}>{selectedBook.min_price === null
                  || selectedBook.min_price === undefined
                    ? '\u2014' : selectedBook.min_price}
                  </Card>
                </Col>
                <Col span={4} style={{ float: 'right' }}>
                  <Card title="Avg price" bordered={false}>{selectedBook.avg_price === null
                  || selectedBook.avg_price === undefined
                    ? '\u2014' : selectedBook.avg_price}
                  </Card>
                </Col>
                <Col span={2} style={{ float: 'right', marginRight: 30 }}>
                  <Button type="primary" onClick={recalculateBookPrices} loading={status === 'loading'}>
                    <Icon type="calculator" />
                    Recalculate
                  </Button>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={12}>
                  <List
                    itemLayout="horizontal"
                    dataSource={bookData}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          className={styles.tabContent}
                          title={item.title}
                          description={item.description}
                        />
                      </List.Item>
                    )}
                  />
                </Col>
                <Col span={12}>
                  <List
                    itemLayout="horizontal"
                    dataSource={secondBookData}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          className={styles.tabContent}
                          title={item.title}
                          description={item.description}
                        />
                      </List.Item>
                    )}
                  />
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="Keywords" key="keywords">
              <Row style={{ marginBottom: 10, marginRight: 10, marginLeft: 10 }}>
                <Col span={12} />
                <Col span={12}>
                  <Button style={{ float: 'right' }} onClick={() => loadKeywords()}>
                    <Icon type="reload" />
                  </Button>
                  <Button style={{ float: 'right', marginRight: 10 }}>
                    <Link to="/new-book-keyword">
                      <Icon type="plus" /> New
                    </Link>
                  </Button>
                  <ButtonGroup style={{ float: 'right', marginRight: 10 }}>
                    <Button type="primary" onClick={previewSearchKeywords}>
                      <Icon type="retweet" />
                    </Button>
                    <Button type="primary" onClick={searchKeywords}>
                      <Icon type="search" />Search
                    </Button>
                  </ButtonGroup>
                  <span style={{ float: 'right', marginRight: 10, lineHeight: 2.5 }}>
                    Results: <b>{dataTable.possibleSearchSize === null
                    ? '\u2014'
                    : dataTable.possibleSearchSize}</b>
                  </span>
                </Col>
              </Row>
              <Table
                style={{ marginLeft: 10, marginRight: 10 }}
                columns={ebayKeywordsColumns}
                dataSource={keywordsTable.data}
                pagination={{ pageSize: 10 }}
                bordered
                scroll={{ y: keywordsTable.height }}
                loading={keywordsTable.isLoading}
              />
            </TabPane>
            <TabPane tab="eBay data" key="ebay-data">
              <Row style={{ marginBottom: 10, marginRight: 10, marginLeft: 10 }}>
                <Col span={16}>
                  <Button
                    type="primary"
                    style={{ float: 'left' }}
                    onClick={() => changeEbayData('Approve')}
                    disabled={!(dataTable.selectedRowsKeys.length > 0 && dataTable.selectedType === 'Pending')}
                  >
                    Approve
                  </Button>
                  <Button
                    type="danger"
                    style={{ float: 'left', marginLeft: 10 }}
                    onClick={() => changeEbayData('Reject')}
                    disabled={!(dataTable.selectedRowsKeys.length > 0 && (dataTable.selectedType === 'Pending'
                      || dataTable.selectedType === 'Approved'))}
                  >
                    Reject
                  </Button>
                  <Button
                    style={{ float: 'left', marginLeft: 10 }}
                    onClick={() => changeEbayData('Restore')}
                    disabled={!(dataTable.selectedRowsKeys.length > 0 && (dataTable.selectedType === 'Approved'
                      || dataTable.selectedType === 'Rejected'))}
                  >
                    Restore
                  </Button>
                  <Button
                    type="danger"
                    style={{ float: 'left', marginLeft: 20 }}
                    onClick={() => changeEbayData('Delete')}
                    disabled={!(dataTable.selectedRowsKeys.length > 0)}
                  >
                    <Icon type="delete" />
                    Delete
                  </Button>
                  <Button
                    type="danger"
                    style={{ float: 'left', marginLeft: 10 }}
                    onClick={() => changeEbayData('Fake')}
                    disabled={!(dataTable.selectedRowsKeys.length > 0)}
                  >
                    <Icon type="cross" />
                    Fake
                  </Button>
                  <Button
                    type="danger"
                    style={{ float: 'left', marginLeft: 10 }}
                    onClick={() => changeEbayData('Spam')}
                    disabled={!(dataTable.selectedRowsKeys.length > 0)}
                  >
                    <Icon type="cross" />
                    Spam
                  </Button>
                  <span style={{ marginLeft: 10, lineHeight: 2.2 }}>
                    {dataTable.selectedRowsKeys.length > 0
                      ? `Selected ${dataTable.selectedRowsKeys.length} items`
                      : ''}
                  </span>
                </Col>
                <Col span={8}>
                  <Button style={{ float: 'right' }} onClick={() => loadEbayData()}>
                    <Icon type="reload" />
                  </Button>
                  <Radio.Group
                    // size="small"
                    value={dataTable.selectedType}
                    onChange={(e) => setDataTableType(e.target.value)}
                    style={{ float: 'right', marginRight: 10 }}
                    disabled={dataTable.loading}
                  >
                    <Radio.Button value="Pending">Pending{dataTable.count.pending !== null ? ` (${dataTable.count.pending})` : ''}</Radio.Button>
                    <Radio.Button value="Approved">Approved{dataTable.count.approved !== null ? ` (${dataTable.count.approved})` : ''}</Radio.Button>
                    <Radio.Button value="Rejected">Rejected{dataTable.count.rejected !== null ? ` (${dataTable.count.rejected})` : ''}</Radio.Button>
                  </Radio.Group>
                </Col>
              </Row>
              <div style={{float: "left", clear: "both"}}  />
              <BookEbayDataTable
                ref={(el) => { this.dataTableRef = el; }}
                columns={ebayDataColumns}
                dataTable={dataTable}
                selectDataTableRows={selectDataTableRows}
                onChange={this.handleTableChange}
              />
            </TabPane>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default Book;
