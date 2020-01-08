// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import AmazonSearches from '../components/AmazonSearches';
import * as AmazonSearchesActions from '../actions/amazon';

const mapStateToProps = (state) => (
  {
    status: state.amazon.status,
    message: state.amazon.message,
    description: state.amazon.description,
    searches: state.amazon.searches,
    selectedRowsKeys: state.amazon.selectedRowsKeys,
    tableHeight: state.amazon.tableHeight,
    tableSearchValues: state.amazon.tableSearchValues,
    tableSearchVisible: state.amazon.tableSearchVisible,
    failedModalVisible: state.amazon.failedModalVisible,
    failedModalData: state.amazon.failedModalData,
    tableSearched: state.amazon.tableSearched || false
  }
);

const mapDispatchToProps = (dispatch) => bindActionCreators(AmazonSearchesActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(AmazonSearches);
