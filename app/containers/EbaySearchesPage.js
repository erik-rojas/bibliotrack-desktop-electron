// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import EbaySearches from '../components/EbaySearches';
import * as EbayActions from '../actions/ebay';

const mapStateToProps = (state) => (
  {
    status: state.ebay.status,
    message: state.ebay.message,
    description: state.ebay.description,
    isMessageShowed: state.ebay.isMessageShowed,
    searchTable: state.ebay.searchTable
  }
);

const mapDispatchToProps = (dispatch) => bindActionCreators(EbayActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(EbaySearches);
