// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import {
  message, notification, Popconfirm, Affix, Input, Modal, Badge,
  Icon, Table, Button, Row, Col, InputNumber, Tag
} from 'antd';

import styles from './AmazonSearches.css';

const ButtonGroup = Button.Group;

class AmazonSearches extends Component {
  props: {
    init: (path: string) => void,
    location: { pathname: string },
    destroy: () => void,
    exportSearchesData: () => void,
    runJobHandler: () => void,
    stopJobHandler: () => void,
    loadSearches: () => void,
    startSearch: (id: string) => void,
    deleteSearch: (id: string) => void,
    selectTableRows: (selectedRowsKeys: []) => void,
    setTableSearchValues: (values: {}) => void,
    setTableSearchVisible: (visible: {}) => void,
    searchInTable: () => void,
    loadFailedModal: (searchId: string) => void,
    hideFailedModal: () => void,
    restartFailedItems: (searchId: string) => void,
    failedModalVisible: boolean,
    failedModalData: [],
    tableHeight: number,
    setTableHeight: (height: number) => void,
    status: string,
    message: string,
    description: string | void,
    searches: [],
    selectedRowsKeys: [],
    tableSearchValues: {},
    tableSearchVisible: {},
    tableSearched: boolean
  };

  componentDidMount() {
    this.props.init(this.props.location.pathname);
    this.props.loadSearches();

    this.handleWindowResize();
    window.addEventListener('resize', this.handleWindowResize);
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
    window.removeEventListener('resize', this.handleWindowResize);
    this.props.destroy();
  }

  handleWindowResize = () => {
    const height = window.innerHeight
      || document.documentElement.clientHeight
      || document.getElementsByTagName('body')[0].clientHeight;

    this.props.setTableHeight(height - 180);
  };

  render() {
    const {
      searches, selectedRowsKeys, failedModalVisible,
      tableHeight, tableSearchValues, tableSearchVisible, tableSearched, failedModalData,

      selectTableRows, startSearch, deleteSearch, exportSearchesData,
      loadSearches, runJobHandler, stopJobHandler,
      setTableSearchValues, setTableSearchVisible, searchInTable,
      loadFailedModal, hideFailedModal, restartFailedItems
    } = this.props;

    const rowSelection = {
      selectedRowsKeys,
      onChange: (rowsKeys) => {
        selectTableRows(rowsKeys);
      }
    };

    const filteredSearches = searches.filter(search => search.visible);
    const searchIcon = tableSearched === true
      ? <Icon type="search" style={{ color: '#108ee9' }} />
      : <Icon type="search" />;

    const hasSelected = selectedRowsKeys.length > 0;

    const columns = [{
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '13%',
      // width: 250,
      // fixed: 'left',
      filterDropdown: (
        <div className={styles.tableSearchName}>
          <Input
            placeholder="Search..."
            value={tableSearchValues.name}
            onChange={(event) => setTableSearchValues({ name: event.target.value })}
            onPressEnter={searchInTable}
          />

          <div>
            <a role="button" onClick={searchInTable}>Search</a>
            <a
              role="button"
              style={{ float: 'right' }}
              onClick={() => {
                setTableSearchValues({ name: '' });
                setTableSearchVisible({ name: false });
                searchInTable();
              }}
            >Clear
            </a>
          </div>
        </div>
      ),
      filterIcon: searchIcon,
      filterDropdownVisible: tableSearchVisible.name,
      onFilterDropdownVisibleChange: (visible) => {
        if (!visible) searchInTable();
        setTableSearchVisible({ name: visible });
      },
    }, {
      title: 'Channels',
      dataIndex: 'channels',
      key: 'channels',
      width: '10%',
      // width: 150,
      // fixed: 'left',
      filters: [
        { text: 'amazon.co.uk', value: 'amazon.co.uk' },
        { text: 'amazon.de', value: 'amazon.de' },
        { text: 'amazon.it', value: 'amazon.it' },
        { text: 'amazon.fr', value: 'amazon.fr' },
        { text: 'amazon.es', value: 'amazon.es' },
        { text: 'amazon.com', value: 'amazon.com' }
      ],
      onFilter: (value, record) => record.channels.indexOf(value) !== -1,
      render: (items) => (
        <div style={{ display: 'grid' }}>
          {items.map(item => <span key={item.id}>{item.name}</span>)}
        </div>
      )
    }, {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '7%',
      // width: 100,
      // fixed: 'left',
      filters: [
        { text: 'ISBNs', value: 'ISBNs' },
        { text: 'ASINs', value: 'ASINs' },
      ],
      onFilter: (value, record) => record.type.indexOf(value) === 0
    }, {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      // width: 130,
      width: '8%',
      sorter: (a, b) => a.id - b.id
    }, {
      title: 'Duplicates',
      dataIndex: 'duplicates',
      key: 'duplicates',
      // width: 130,
      width: '10%',
      sorter: (a, b) => a.id - b.id
    }, {
      title: 'Queued',
      dataIndex: 'queued',
      key: 'queued',
      // width: 130,
      width: '9%',
      sorter: (a, b) => a.id - b.id
    }, {
      title: 'In queue',
      dataIndex: 'inQueue',
      key: 'inQueue',
      // width: 130,
      width: '9%',
      sorter: (a, b) => a.id - b.id
    }, {
      title: 'Ok',
      dataIndex: 'finished',
      key: 'finished',
      // width: 130,
      width: '7%',
      sorter: (a, b) => a.id - b.id
    }, {
      title: 'Failed',
      dataIndex: 'failed',
      key: 'failed',
      // width: 130,
      width: '8%',
      sorter: (a, b) => a.id - b.id,
      render: (text, record) => {
        if (text !== 0) {
          return (
            <Tag color="orange" onClick={() => loadFailedModal(record.id)}>{text}</Tag>
          );
        } return text;
      }
    }, {
      title: 'Action',
      key: 'action',
      // width: '12%',
      // width: 200,
      // fixed: 'right',
      render: (text, record) => {
        const search = record.inQueue === 0
          ? <a role="button" onClick={() => startSearch(record.id)} style={{ whiteSpace: 'nowrap' }}>{record.queued === 0 ? 'Start' : 'Restart'} search</a>
          : <span style={{ whiteSpace: 'nowrap' }}>Search started</span>;

        return (
          <span>
            {search}
            <br />
            <Popconfirm title="Are you sure? Related data will be deleted too." onConfirm={() => deleteSearch(record.id)}>
              <a style={{ whiteSpace: 'nowrap' }}>Delete</a>
            </Popconfirm>
          </span>
        );
      },
    }];

    const expandedRowRender = (record) => (
      <div>
        <span>
          <span style={{ fontWeight: 'bold' }}>ID: </span>
          <span style={{ marginLeft: 8, marginRight: 8 }}>
            {record.id}
          </span>
        </span>
        <span className="ant-divider" />
        <span>
          <span style={{ fontWeight: 'bold' }}>Created: </span>
          <span style={{ marginLeft: 8, marginRight: 8 }}>
            {moment(new Date(record.createdAt)).format('hh:mm MM/DD/YYYY')}
          </span>
        </span>
        <span className="ant-divider" />
        <span style={{ marginLeft: 8 }}>
          <span style={{ fontWeight: 'bold' }}>Last search: </span>
          <span style={{ marginLeft: 8, marginRight: 8 }}>
            {record.searchedAt !== null
              ? moment(new Date(record.searchedAt)).format('hh:mm MM/DD/YYYY')
              : '\u2014'
            }
          </span>
        </span>
        <span className="ant-divider" />
        <span style={{ marginLeft: 8 }}>
          <span style={{ fontWeight: 'bold' }}>Searched: </span>
          <span style={{ marginLeft: 8, marginRight: 8 }}>{record.searchedCount}</span>
        </span>
        <span className="ant-divider" />
        <span style={{ marginLeft: 8 }}>
          <span style={{ fontWeight: 'bold' }}>Status: </span>
          {
            record.inQueue === 0
              ? <span style={{ marginLeft: 8 }}><Badge status="success" />{record.queued === 0 ? 'Ready' : 'Finished'}</span>
              : <span style={{ marginLeft: 8 }}><Badge status="processing" />Processing</span>
          }
        </span>
      </div>
    );

    const modalColumns = [
      {
        title: 'ISBN (ASIN)',
        dataIndex: 'isbn_asin',
        key: 'isbn_asin',
      },
      {
        title: 'Channel',
        dataIndex: 'channel_name',
        key: 'channel_name',
      },
      {
        title: 'Status',
        dataIndex: 'status_code',
        key: 'status_code',
      },
    ];

    return (
      <div>
        <div className={styles.table}>
          <Row>
            <Col span={12}>
              <Button
                disabled={this.props.status === 'loading'}
                onClick={() => exportSearchesData()}
              >
                <Icon type="export" />
                Export data
              </Button>
              <span style={{ marginLeft: 8 }}>
                {hasSelected ? `Selected ${selectedRowsKeys.length} items` : ''}
              </span>
            </Col>
            <Col span={12}>
              <Button onClick={() => loadSearches()} style={{ float: 'right', marginLeft: 8 }}><Icon type="reload" /></Button>
              <Button type="primary" style={{ float: 'right', marginLeft: 8 }}>
                <Link to="/amazon-new-search">
                  <Icon type="plus" /> New search
                </Link>
              </Button>
              {/* {process.env.NODE_ENV !== 'production' ? */}
              {/* <ButtonGroup style={{ float: 'right' }}> */}
              {/* <Button onClick={() => runJobHandler()}>Handle Jobs</Button> */}
              {/* <Button onClick={() => stopJobHandler()} type="danger">Stop</Button> */}
              {/* </ButtonGroup> */}
              {/* : '' */}
              {/* } */}
            </Col>
          </Row>
          <Table
            style={{ marginTop: 15 }}
            pagination={{ pageSize: 20 }}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredSearches}
            expandedRowRender={expandedRowRender}
            scroll={{ y: tableHeight }}
            bordered
          />
        </div>
        <Modal
          key="failedModal"
          title={<span style={{ display: 'flex', alignItems: 'center' }}>
            <Icon type="exclamation-circle" style={{ marginRight: 8, color: 'rgb(255, 191, 0)', fontSize: 18 }} />
                  Failed items
                 </span>}
          visible={failedModalVisible}
          footer={[
            <Button
              key="retry_failed"
              type="primary"
              loading={this.props.status === 'loading'}
              onClick={() => restartFailedItems(failedModalData[0].search_id)}
            >
              Retry
            </Button>,
            <Button key="cancel" onClick={() => hideFailedModal()}>Cancel</Button>
          ]}
          onCancel={() => hideFailedModal()}
        >
          <Table
            pagination={{ pageSize: 5 }}
            columns={modalColumns}
            dataSource={failedModalData}
            bordered
          />
        </Modal>
      </div>
    );
  }
}

export default AmazonSearches;
