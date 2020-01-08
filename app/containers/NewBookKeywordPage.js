// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import NewBookKeyword from '../components/NewBookKeyword';
import * as NewBookKeywordActions from '../actions/books';

const mapStateToProps = (state) => (
  {
    status: state.books.status,
    message: state.books.message,
    description: state.books.description,
    isMessageShowed: state.books.isMessageShowed,
    selectedBook: state.books.selectedBook
  }
);

const mapDispatchToProps = (dispatch) => bindActionCreators(NewBookKeywordActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(NewBookKeyword);
