// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import EbayNewSearch from '../components/EbayNewSearch';
import * as EbayNewSearchActions from '../actions/ebay';

const mapStateToProps = (state) => (
  {
    status: state.ebay.status,
    message: state.ebay.message,
    description: state.ebay.description,
    isMessageShowed: state.ebay.isMessageShowed
  }
);

const mapDispatchToProps = (dispatch) => bindActionCreators(EbayNewSearchActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(EbayNewSearch);
