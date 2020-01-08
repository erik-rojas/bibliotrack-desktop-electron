// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import EbayData from '../components/EbayData';
import * as EbayActions from '../actions/ebay';

const mapStateToProps = (state) => (
  {
    status: state.ebay.status,
    message: state.ebay.message,
    description: state.ebay.description,
    isMessageShowed: state.ebay.isMessageShowed,
    dataTable: state.ebay.dataTable,
    dataCollector: state.ebay.dataCollector
  }
);

const mapDispatchToProps = (dispatch) => bindActionCreators(EbayActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(EbayData);
