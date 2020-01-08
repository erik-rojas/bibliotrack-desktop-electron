// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import EditBook from '../components/EditBook';
import * as EditBookActions from '../actions/books';

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

const mapDispatchToProps = (dispatch) => bindActionCreators(EditBookActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(EditBook);
