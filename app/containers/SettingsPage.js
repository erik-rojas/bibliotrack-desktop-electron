// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Settings from '../components/Settings';
import * as SettingsActions from '../actions/settings';

const mapStateToProps = (state) => (
  {
    status: state.settings.status,
    message: state.settings.message,
    description: state.settings.description,
    values: state.settings.values
  }
);

const mapDispatchToProps = (dispatch) => (
  bindActionCreators(SettingsActions, dispatch)
);

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
