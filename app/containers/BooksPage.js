// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Books from '../components/Books';
import * as BooksActions from '../actions/books';

const mapStateToProps = (state) => (
  {
    status: state.books.status,
    message: state.books.message,
    description: state.books.description,
    isMessageShowed: state.books.isMessageShowed,
    booksTable: state.books.booksTable
  }
);

const mapDispatchToProps = (dispatch) => bindActionCreators(BooksActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Books);
