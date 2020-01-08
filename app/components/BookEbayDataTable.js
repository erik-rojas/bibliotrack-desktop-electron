// @flow
import React, { Component } from 'react';
import {
  Table
} from 'antd';

class BookEbayDataTable extends Component {
  props: {
    columns: [],
    selectDataTableRows: (selectedRowsKeys: []) => void,
    onChange: (pagination: any, filters: any, sorter: any) => void,
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
      searched: [],
      searchVisible: string
    }
  };

  tableUnselected = false;
  tableRef = null;

  onTableSelectChange = (selectedRowsKeys) => {
    this.props.selectDataTableRows(selectedRowsKeys);
  };

  componentDidUpdate() {
    if (this.props.dataTable.selectedRowsKeys.length === 0 && !this.tableUnselected) {
      this.tableRef.store.setState({ selectedRowKeys: [], selectionDirty: true });

      this.tableUnselected = true;
    } else if (this.props.dataTable.selectedRowsKeys.length > 0) {
      this.tableUnselected = false;
    }
  }

  render() {
    const {
      onChange, dataTable, columns
    } = this.props;

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

    return (
      <Table
        ref={(el) => { this.tableRef = el; }}
        style={{ marginLeft: 10, marginRight: 10 }}
        columns={columns}
        rowSelection={ebayDataRowSelection}
        dataSource={dataTable.data}
        pagination={dataTable.pagination}
        onChange={onChange}
        scroll={{ y: dataTable.height }}
        loading={dataTable.isLoading}
        bordered
      />
    );
  }
}

export default BookEbayDataTable;
