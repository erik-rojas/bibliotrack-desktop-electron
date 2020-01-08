// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import NewBook from '../components/NewBook';
import * as NewBookActions from '../actions/books';

const mapStateToProps = (state) => (
  {
    status: state.books.status,
    message: state.books.message,
    description: state.books.description,
    isMessageShowed: state.books.isMessageShowed,
    autoCompleteData: state.books.autoCompleteData,
    selectedBook: state.books.selectedBook
  }
);

const mapDispatchToProps = (dispatch) => bindActionCreators(NewBookActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(NewBook);
