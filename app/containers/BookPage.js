// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Book from '../components/Book';
import * as BookActions from '../actions/books';

const mapStateToProps = (state) => (
  {
    status: state.books.status,
    message: state.books.message,
    description: state.books.description,
    isMessageShowed: state.books.isMessageShowed,
    selectedBook: state.books.selectedBook,
    selectedBookTab: state.books.selectedBookTab,
    keywordsTable: state.books.keywordsTable,
    dataTable: state.books.dataTable
  }
);

const mapDispatchToProps = (dispatch) => bindActionCreators(BookActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Book);
