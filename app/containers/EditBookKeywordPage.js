// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import EditBookKeyword from '../components/EditBookKeyword';
import * as EditBookKeywordActions from '../actions/books';

const mapStateToProps = (state) => (
  {
    status: state.books.status,
    message: state.books.message,
    description: state.books.description,
    isMessageShowed: state.books.isMessageShowed,
    selectedBook: state.books.selectedBook,
    selectedKeyword: state.books.selectedKeyword
  }
);

const mapDispatchToProps = (dispatch) => bindActionCreators(EditBookKeywordActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(EditBookKeyword);
