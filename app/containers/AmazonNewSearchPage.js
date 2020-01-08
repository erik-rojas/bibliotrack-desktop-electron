// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import AmazonNewSearch from '../components/AmazonNewSearch';
import * as AmazonNewSearchActions from '../actions/amazon';

const mapStateToProps = (state) => (
  {
    status: state.amazon.status,
    message: state.amazon.message,
    description: state.amazon.description
  }
);

const mapDispatchToProps = (dispatch) => (
  bindActionCreators(AmazonNewSearchActions, dispatch)
);

export default connect(mapStateToProps, mapDispatchToProps)(AmazonNewSearch);
