import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  message, notification,
  Icon, Row, Col, Button, Table
} from 'antd';

import styles from './Books.css';

class Books extends Component {
  props: {
    location: { pathname: string },
    initialize: (path: string) => void,
    destroy: () => void,
    status: string,
    message: string,
    description: string,
    isMessageShowed: boolean,
    setMessageShowed: () => void,
    booksTable: {
      data: [],
      height: number,
      isLoading: boolean
    },
    setBooksTableHeight: () => void,
    loadBooks: () => void,
    showBook: (key: any) => void
  };

  componentDidMount() {
    this.props.initialize(this.props.location.pathname);
    this.handleTableReload();

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
    window.removeEventListener('resize', this.handleWindowResize);

    this.props.destroy();
  }

  handleWindowResize = () => {
    const height = window.innerHeight
      || document.documentElement.clientHeight
      || document.getElementsByTagName('body')[0].clientHeight;

    this.props.setBooksTableHeight(this.props.booksTable.data.length > 0 ? height - 180 : 0);
  };

  handleTableReload = () => {
    this.props.loadBooks();
  };

  render() {
    const {
      booksTable, showBook
    } = this.props;

    const columns = [{
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: '30%'
    }, {
      title: 'Author',
      dataIndex: 'author',
      key: 'author',
      width: '18%',
      render: (item) => (
        <span>{item === null ? '\u2014' : item}</span>
      )
    }, {
      title: 'ISBN/ASIN',
      dataIndex: 'asin',
      key: 'asin',
      width: '12%',
      render: (item, row) => {
        let value = '\u2014';

        if (row.isbn_13 !== null) {
          value = row.isbn_13;
        } else if (row.isbn_10 !== null) {
          value = row.isbn_10;
        } else if (item !== null) {
          value = item;
        }

        return <span>{value}</span>;
      }
    }, {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      width: '10%',
      render: (item) => (
        <span>{item === null ? '\u2014' : item}</span>
      )
    }, {
      title: 'Language',
      dataIndex: 'language',
      key: 'language',
      width: '10%',
      render: (item) => (
        <span>{item === null ? '\u2014' : item}</span>
      )
    }, {
      title: 'Publisher',
      dataIndex: 'publisher',
      key: 'publisher',
      width: '18%',
      render: (item) => (
        <span>{item === null ? '\u2014' : item}</span>
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
                <Link to="/new-book">
                  <Icon type="plus" /> New book
                </Link>
              </Button>
            </Col>
          </Row>
          <Table
            columns={columns}
            dataSource={booksTable.data}
            pagination={{ pageSize: 20 }}
            scroll={{ y: booksTable.height }}
            rowClassName={() => styles.tableRow}
            onRow={(record) => ({
              onClick: () => showBook(record.id)
            })}
            bordered
            loading={booksTable.isLoading}
          />
        </div>
      </div>
    );
  }
}

export default Books;
