import { ipcRenderer } from 'electron';
import { initialize as formInitialize } from 'redux-form';
import { push } from 'react-router-redux';

// CORE
export const INITIALIZE = 'INITIALIZE';
export const DESTROY = 'DESTROY';
export const SET_MESSAGE_SHOWED = 'SET_MESSAGE_SHOWED';
// BOOKS
export const SET_BOOKS_TABLE_HEIGHT = 'SET_BOOKS_TABLE_HEIGHT';
export const LOADING_BOOKS = 'LOADING_BOOKS';
export const BOOKS_LOADED = 'BOOKS_LOADED';
export const BOOKS_LOADING_ERROR = 'BOOKS_LOADING_ERROR';
// BOOK
export const SET_DATA_TABLE_SEARCHED = 'SET_DATA_TABLE_SEARCHED';
export const SET_DATA_TABLE_SEARCH_VISIBLE = 'SET_DATA_TABLE_SEARCH_VISIBLE';
export const SET_DATA_TABLE_SEARCH_SELLER_NAME = 'SET_DATA_TABLE_SEARCH_SELLER_NAME';
export const SET_DATA_TABLE_SEARCH_TITLE = 'SET_DATA_TABLE_SEARCH_TITLE';
export const NEW_BOOK_AUTOCOMPLETE = 'NEW_BOOK_AUTOCOMPLETE';
export const NEW_BOOK_AUTOCOMPLETE_DATA_LOADING = 'NEW_BOOK_AUTOCOMPLETE_DATA_LOADING';
export const NEW_BOOK_AUTOCOMPLETE_DATA_LOADED = 'NEW_BOOK_AUTOCOMPLETE_DATA_LOADED';
export const KEYWORDS_AUTOCOMPLETE = 'KEYWORDS_AUTOCOMPLETE';
export const KEYWORDS_AUTOCOMPLETE_DATA_LOADING = 'KEYWORDS_AUTOCOMPLETE_DATA_LOADING';
export const KEYWORDS_AUTOCOMPLETE_DATA_LOADED = 'KEYWORDS_AUTOCOMPLETE_DATA_LOADED';
export const RECALCULATING_BOOK_PRICES = 'RECALCULATING_BOOK_PRICES';
export const BOOK_PRICES_RECALCULATED = 'BOOK_PRICES_RECALCULATED';
export const SET_BOOK_EBAY_TAB = 'SET_BOOK_EBAY_TAB';
export const SELECT_BOOK = 'SELECT_BOOK';
export const SELECT_KEYWORD = 'SELECT_KEYWORD';
export const ADDING_BOOK = 'ADDING_BOOK';
export const BOOK_ADDED = 'BOOK_ADDED';
export const BOOK_ADDING_ERROR = 'BOOK_ADDING_ERROR';
export const SAVING_BOOK = 'SAVING_BOOK';
export const SAVING_KEYWORD = 'SAVING_KEYWORD';
export const BOOK_UPDATED = 'BOOK_UPDATED';
export const BOOK_UPDATING_ERROR = 'BOOK_UPDATING_ERROR';
export const DELETING_BOOK = 'DELETING_BOOK';
export const BOOK_DELETED = 'BOOK_DELETED';
export const LOADING_KEYWORDS = 'LOADING_KEYWORDS';
export const KEYWORDS_LOADED = 'KEYWORDS_LOADED';
export const ADDING_KEYWORD = 'ADDING_KEYWORD';
export const ADDING_KEYWORD_INPUT_ERRORS = 'ADDING_KEYWORD_INPUT_ERRORS';
export const KEYWORD_ADDED = 'KEYWORD_ADDED';
export const KEYWORD_UPDATED = 'KEYWORD_UPDATED';
export const DELETING_KEYWORD = 'DELETING_KEYWORD';
export const KEYWORD_DELETED = 'KEYWORD_DELETED';
export const LOADING_EBAY_DATA = 'LOADING_EBAY_DATA';
export const EBAY_DATA_LOADED = 'EBAY_DATA_LOADED';
export const KEYWORDS_PREVIEW_SEARCHED = 'KEYWORDS_PREVIEW_SEARCHED';
export const SET_KEYWORDS_TABLE_HEIGHT = 'SET_KEYWORDS_TABLE_HEIGHT';
export const SET_DATA_TABLE_HEIGHT = 'SET_DATA_TABLE_HEIGHT';
export const SET_KEYWORD_FIELD_VALUE = 'SET_KEYWORD_FIELD_VALUE';
export const SELECT_DATA_TABLE_ROWS = 'SELECT_DATA_TABLE_ROWS';
export const SET_DATA_TABLE_TYPE = 'SET_DATA_TABLE_TYPE';
export const CHANGE_BOOK_TAB = 'CHANGE_BOOK_TAB';
export const SET_AUTHORS_SIZE_FOR_SELECTED_BOOK = 'SET_AUTHORS_SIZE_FOR_SELECTED_BOOK';
export const SET_SERIALS_SIZE_FOR_SELECTED_BOOK = 'SET_SERIALS_SIZE_FOR_SELECTED_BOOK';

export function initialize(path: string) {
  return (dispatch: (action: any) => void) => {
    if (path === '/books') {
      ipcRenderer.on('books-loaded', (event, books) => {
        console.log('Books loaded:'); // DEBUG
        console.log(books); // DEBUG

        dispatch(booksLoaded(books));
      });

      ipcRenderer.on('books-loading-error', (event, err) => {
        console.log('Books loading Error:'); // DEBUG
        console.log(err); // DEBUG

        dispatch(booksLoadingError());
      });
    } else if (path === '/new-book') {
      dispatch(formInitialize(
        'newBook', {
          title: '',
          language: '',
          author: '',
          year: '',
          publisher: '',
          isbn_10: '',
          isbn_13: '',
          asin: '',
          series: '',
          seriesNumber: '',
          notes: '',
          coverPrice: '',
          cover: ''
        },
        ['title', 'language', 'author', 'year', 'publisher', 'isbn_10', 'isbn_13',
          'asin', 'series', 'seriesNumber', 'notes', 'coverPrice', 'cover']
      ));

      dispatch(loadingBookAutoCompleteData());

      ipcRenderer.on('book-autocomplete-data-loaded', (event, data) => {
        dispatch(bookAutoCompleteDataLoaded(data));
      });

      ipcRenderer.on('book-added', () => {
        console.log('Book added!'); // DEBUG

        dispatch(bookAdded());
        dispatch(push('/books'));
      });

      ipcRenderer.on('book-adding-error', (event, err) => {
        console.log('Books adding Error:'); // DEBUG
        console.log(err); // DEBUG

        dispatch(bookUpdatingError());
      });
    } else if (path === '/edit-book') {
      dispatch(loadingBookAutoCompleteData());

      ipcRenderer.on('book-autocomplete-data-loaded', (event, data) => {
        dispatch(bookAutoCompleteDataLoaded(data));
      });

      ipcRenderer.on('book-updated', (event, newBook) => {
        console.log('Book updated!'); // DEBUG
        console.log(newBook);

        dispatch(bookUpdated(newBook));
        dispatch(push('/book'));
      });

      ipcRenderer.on('book-updating-error', (event, err) => {
        console.log('Books updating Error:'); // DEBUG
        console.log(err); // DEBUG

        // dispatch(bookUpdatingError());
      });
    } else if (path === '/book') {
      dispatch(keywordsPreviewSearched(null));
      ipcRenderer.on('book-keywords-loaded', (event, keywords) => {
        console.log('Keywords loaded:'); // DEBUG
        console.log(keywords); // DEBUG

        dispatch(keywordsLoaded(keywords));
      });

      ipcRenderer.on('book-keywords-loading-error', (event, err) => {
        console.log('Keywords loading Error:'); // DEBUG
        console.log(err); // DEBUG

        // TODO dispatch(keywordsLoadingError());
      });

      ipcRenderer.on('book-keyword-deleted', (event, keywordId) => {
        console.log('Keyword deleted:'); // DEBUG
        console.log(keywordId); // DEBUG

        dispatch(keywordDeleted(keywordId));
      });

      ipcRenderer.on('book-keyword-deleting-error', (event, err) => {
        console.log('Keyword deleting Error:'); // DEBUG
        console.log(err); // DEBUG

        // TODO dispatch(keywordDeletingError());
      });

      ipcRenderer.on('book-ebay-data-loaded', (event, ebayData, pagination, count) => {
        console.log('eBay data loaded:'); // DEBUG
        console.log(ebayData); // DEBUG

        dispatch(ebayDataLoaded(ebayData, pagination, count));
      });

      ipcRenderer.on('book-ebay-data-loading-error', (event, err) => {
        console.log('eBay data loading Error:'); // DEBUG
        console.log(err); // DEBUG

        // TODO dispatch(keywordsLoadingError());
      });

      ipcRenderer.on('book-ebay-data-changed', () => {
        console.log('eBay data changed!'); // DEBUG

        // dispatch(ebayDataLoaded(ebayData));
        dispatch(loadEbayData());
      });

      ipcRenderer.on('book-ebay-data-changing-error', (event, err) => {
        console.log('eBay data changing Error:'); // DEBUG
        console.log(err); // DEBUG

        // TODO dispatch(keywordsLoadingError());
      });

      ipcRenderer.on('book-keywords-searched', () => {
        console.log('Keywords was searched!');
        dispatch(loadEbayData());
      });

      ipcRenderer.on('book-keywords-searching-error', (event, err) => {
        console.log('Keywords searching Error:'); // DEBUG
        console.log(err); // DEBUG

        // TODO dispatch(keywordsSearchingError());
      });

      ipcRenderer.on('book-keywords-preview-searched', (event, numberOfItems) => {
        console.log('Keywords preview was searched!');
        dispatch(keywordsPreviewSearched(numberOfItems));
      });

      ipcRenderer.on('book-keywords-preview-searching-error', (event, err) => {
        console.log('Keywords searching Error:'); // DEBUG
        console.log(err); // DEBUG

        // TODO dispatch(keywordsSearchingError());
      });

      ipcRenderer.on('book-prices-recalculated', (event, prices) => {
        console.log('Book prices was recalculated:');
        console.log(prices);
        dispatch(bookPricesRecalculated(prices));
      });

      ipcRenderer.on('book-prices-recalculation-error', (event, err) => {
        console.log('Book prices recalculation Error:'); // DEBUG
        console.log(err); // DEBUG

        // TODO dispatch(bookPricesRecalculationError());
      });

      ipcRenderer.on('book-deleted', (event, id) => {
        console.log('Book deleted:'); // DEBUG
        console.log(id); // DEBUG

        // dispatch(bookDeleted(id));
        dispatch(push('/books'));
      });

      ipcRenderer.on('book-deleting-error', (event, err) => {
        console.log('Book deleting Error:'); // DEBUG
        console.log(err); // DEBUG

        // TODO dispatch(bookDeletingError());
      });
    } else if (path === '/new-book-keyword') {
      dispatch(formInitialize(
        'newBookKeyword', {
          keyword: '',
          isShared: '',
          minPrice: '',
          maxPrice: '',
          categories: [],
          channels: []
        },
        ['keyword', 'isShared', 'minPrice', 'maxPrice', 'categories', 'channels']
      ));

      ipcRenderer.on('book-keyword-added', (event, keyword) => {
        console.log('Keyword added:'); // DEBUG
        console.log(keyword); // DEBUG

        dispatch(keywordAdded(keyword));
        dispatch(push('/book?tabName=keywords'))
      });

      ipcRenderer.on('book-keyword-adding-error', (event, err) => {
        console.log('Keyword adding Error:'); // DEBUG
        console.log(err); // DEBUG

        // TODO dispatch(keywordAddingError());
      });
    } else if (path === '/edit-book-keyword') {
      ipcRenderer.on('book-keyword-updated', (event, keyword) => {
        console.log('Keyword updated:'); // DEBUG
        console.log(keyword); // DEBUG

        dispatch(keywordUpdated());
        dispatch(push('/book?tabName=keywords'))
      });

      ipcRenderer.on('book-keyword-updating-error', (event, err) => {
        console.log('Keyword updating Error:'); // DEBUG
        console.log(err); // DEBUG

        // TODO dispatch(keywordAddingError());
      });
    }

    dispatch({ type: INITIALIZE });
  };
}

export function destroy() {
  ipcRenderer.removeAllListeners('books-loaded');
  ipcRenderer.removeAllListeners('books-loading-error');
  ipcRenderer.removeAllListeners('book-added');
  ipcRenderer.removeAllListeners('book-adding-error');
  ipcRenderer.removeAllListeners('book-updated');
  ipcRenderer.removeAllListeners('book-updating-error');
  ipcRenderer.removeAllListeners('book-deleted');
  ipcRenderer.removeAllListeners('book-deleting-error');
  ipcRenderer.removeAllListeners('book-keywords-loaded');
  ipcRenderer.removeAllListeners('book-keywords-loading-error');
  ipcRenderer.removeAllListeners('book-keyword-added');
  ipcRenderer.removeAllListeners('book-keyword-adding-error');
  ipcRenderer.removeAllListeners('book-keyword-updated');
  ipcRenderer.removeAllListeners('book-keyword-updating-error');
  ipcRenderer.removeAllListeners('book-keyword-deleted');
  ipcRenderer.removeAllListeners('book-keyword-deleting-error');
  ipcRenderer.removeAllListeners('book-ebay-data-loaded');
  ipcRenderer.removeAllListeners('book-ebay-data-loading-error');
  ipcRenderer.removeAllListeners('book-ebay-data-changed');
  ipcRenderer.removeAllListeners('book-ebay-data-changing-error');
  ipcRenderer.removeAllListeners('book-keywords-searched');
  ipcRenderer.removeAllListeners('book-keywords-searching-error');
  ipcRenderer.removeAllListeners('book-keywords-preview-searched');
  ipcRenderer.removeAllListeners('book-keywords-preview-searching-error');
  ipcRenderer.removeAllListeners('book-prices-recalculated');
  ipcRenderer.removeAllListeners('book-prices-recalculation-error');
  ipcRenderer.removeAllListeners('book-autocomplete-data-loaded');
  ipcRenderer.removeAllListeners('book-autocomplete-data-loading-error');

  return { type: DESTROY };
}

export function setAuthorsSizeForSelectedBook(size: number) {
  return {
    type: SET_AUTHORS_SIZE_FOR_SELECTED_BOOK,
    selectedBook: {
      additional_authors_count: size < 0 ? 0 : size
    }
  };
}

export function setSerialsSizeForSelectedBook(size: number) {
  return {
    type: SET_SERIALS_SIZE_FOR_SELECTED_BOOK,
    selectedBook: {
      additional_serial_numbers_count: size < 0 ? 0 : size
    }
  };
}

export function changeBookTab(type: string) {
  return {
    type: CHANGE_BOOK_TAB,
    selectedBookTab: type
  };
}

export function changeBook(type: string) {
  return (
    dispatch: (action: any) => void,
    getState: () => { books: { booksTable: { data: [] } }, selectedBookId: string }
  ) => {
    const selectedId = getState().books.selectedBookId;
    const books = getState().books.booksTable.data;

    if (type === 'next') {
      books.forEach((book, index) => {
        if (book.id === selectedId && books[index + 1] !== undefined) {
          dispatch(selectBook(books[index + 1].id));
          dispatch(loadKeywords());
          dispatch(loadEbayData());
        }
      });
    } else if (type === 'previous') {
      books.forEach((book, index) => {
        if (book.id === selectedId && books[index - 1] !== undefined) {
          dispatch(selectBook(books[index - 1].id));
          dispatch(loadKeywords());
          dispatch(loadEbayData());
        }
      });
    }
  }
}

export function keywordsPreviewSearched(numberOfItems: null | number) {
  return {
    type: KEYWORDS_PREVIEW_SEARCHED,
    message: 'Data loaded!',
    dataTable: {
      possibleSearchSize: numberOfItems,
      isLoading: false
    }
  };
}

export function setMessageShowed() {
  return {
    type: SET_MESSAGE_SHOWED
  };
}

export function setBooksTableHeight(pixels: number) {
  return {
    type: SET_BOOKS_TABLE_HEIGHT,
    booksTable: {
      height: pixels
    }
  };
}

export function showBook(key: string) {
  return (dispatch: (action: actionType) => void) => {
    dispatch(destroy());
    dispatch(selectBook(key));
    dispatch(push('/book'));
  };
}

export function editKeyword(id: string) {
  return (
    dispatch: (action: any) => void,
    getState: () => { books: { keywordsTable: { data: [] } } }
  ) => {
    const keyword = getState().books.keywordsTable.data.filter(item => item.id === id);

    dispatch({
      type: SELECT_KEYWORD,
      selectedKeywordId: id,
      selectedKeyword: keyword[0] || null
    });

    dispatch(push('/edit-book-keyword'));
  }
}

export function selectBook(key: string) {
  return {
    type: SELECT_BOOK,
    selectedBookId: key
  };
}

export function loadBooks() {
  ipcRenderer.send('load-books');

  return {
    type: LOADING_BOOKS
  };
}

export function booksLoaded(books: []) {
  return (
    dispatch: (action: any) => void
  ) => {
    const height = window.innerHeight
      || document.documentElement.clientHeight
      || document.getElementsByTagName('body')[0].clientHeight;

    dispatch(setBooksTableHeight(books.length > 0 ? height - 180 : 0));
    dispatch({
      type: BOOKS_LOADED,
      message: 'Data loaded!',
      booksTable: {
        data: books
      }
    });
  };
}

export function booksLoadingError() {
  return {
    type: BOOKS_LOADING_ERROR,
    message: 'Table loading error!',
    description: 'Check the console output...'
  };
}

export function bookDeleted(id: string) {
  return (
    dispatch: (action: any) => void,
    getState: () => { books: { booksTable: { data: [], height: number } } }
  ) => {
    const table = getState().books.booksTable;
    dispatch(setBooksTableHeight(table.data.length > 0 ? table.height : 0));
    dispatch({
      type: BOOK_DELETED,
      message: 'Book deleted!',
      booksTable: {
        removedItem: id
      }
    });
  };
}

export function addBook() {
  return (
    dispatch: (action: any) => void,
    getState: () => { form: { newBook: { values: {} } } }
  ) => {
    const book = getState().form.newBook.values;

    console.log(book);
    dispatch(addingBook());

    ipcRenderer.send('add-book', book);
  };
}

export function addingBook() {
  return {
    type: ADDING_BOOK,
    message: 'Adding book...'
  };
}

export function bookAdded() {
  return {
    type: BOOK_ADDED,
    message: 'Book added!'
  };
}

export function bookAddingError() {
  return {
    type: BOOK_ADDING_ERROR,
    message: 'Book adding error!',
    description: 'Check the console output...'
  };
}

export function deleteBook(id: string) {
  ipcRenderer.send('delete-book', id);

  return {
    type: DELETING_BOOK,
    message: 'Deleting book...'
  };
}

export function updateKeyword() {
  return (
    dispatch: (action: any) => void,
    getState: () => { form: { editBookKeyword: { values: {} } } }
  ) => {
    const keyword = getState().form.editBookKeyword.values;

    dispatch(savingKeyword());

    ipcRenderer.send('update-book-keyword', keyword.id, keyword);
  };
}

export function savingKeyword() {
  return {
    type: SAVING_KEYWORD,
    message: 'Saving keyword...'
  };
}

export function updateBook() {
  return (
    dispatch: (action: any) => void,
    getState: () => { form: { editBook: { values: {} } } }
  ) => {
    const book = getState().form.editBook.values;

    dispatch(savingBook());

    console.log(book);
    ipcRenderer.send('update-book', book);
  };
}

export function savingBook() {
  return {
    type: SAVING_BOOK,
    message: 'Saving book...'
  };
}

export function bookUpdated(newBook: {}) {
  return {
    type: BOOK_UPDATED,
    message: 'Book updated!',
    booksTable: {
      data: [newBook]
    }
  };
}

export function bookUpdatingError() {
  return {
    type: BOOK_UPDATING_ERROR,
    message: 'Book updating error!',
    description: 'Check the console output...'
  };
}

export function setKeywordsTableHeight(pixels: number) {
  return {
    type: SET_KEYWORDS_TABLE_HEIGHT,
    keywordsTable: {
      height: pixels
    }
  };
}

export function setDataTableHeight(pixels: number) {
  return {
    type: SET_DATA_TABLE_HEIGHT,
    dataTable: {
      height: pixels
    }
  };
}

export function setDataTableSearched(value: []) {
  return {
    type: SET_DATA_TABLE_SEARCHED,
    dataTable: {
      searched: value
    }
  };
}

export function setDataTableSearchTitle(title: string) {
  return {
    type: SET_DATA_TABLE_SEARCH_TITLE,
    dataTable: {
      pagination: {
        filterTitle: title
      }
    }
  };
}

export function setDataTableSearchSellerName(sellerName: string) {
  return {
    type: SET_DATA_TABLE_SEARCH_SELLER_NAME,
    dataTable: {
      pagination: {
        filterSellerName: sellerName
      }
    }
  };
}

export function setDataTableSearchVisible(column: string) {
  return {
    type: SET_DATA_TABLE_SEARCH_VISIBLE,
    dataTable: {
      searchVisible: column
    }
  };
}

export function setKeywordFieldValue(field: string, value: any) {
  const fields = {};

  fields[field] = value;

  return {
    type: SET_KEYWORD_FIELD_VALUE,
    keywordFields: fields
  };
}

export function clearKeywordFields() {
  return (dispatch: (action: any) => void) => {
    dispatch(setKeywordFieldValue('keyword', ''));
    dispatch(setKeywordFieldValue('minPrice', ''));
    dispatch(setKeywordFieldValue('maxPrice', ''));
    dispatch(setKeywordFieldValue('categories', []));
    dispatch(setKeywordFieldValue('channels', []));
  };
}

export function loadKeywords(withoutMessage: boolean = false) {
  return (
    dispatch: (action: any) => void,
    getState: () => { books: { selectedBookId: string | null } }
  ) => {
    const bookId = getState().books.selectedBookId;

    dispatch(loadingKeywords(withoutMessage));

    ipcRenderer.send('load-book-keywords', bookId);
  };
}

export function loadingKeywords(withoutMessage: boolean = false) {
  const message = withoutMessage === true ? '' : 'Loading keywords...';

  return {
    type: LOADING_KEYWORDS,
    message
  };
}

export function keywordsLoaded(keywords: any) {
  return (dispatch: (action: any) => void) => {
    const height = window.innerHeight
      || document.documentElement.clientHeight
      || document.getElementsByTagName('body')[0].clientHeight;

    dispatch(setKeywordsTableHeight(keywords.length > 0 ? height - 280 : 0));
    dispatch({
      type: KEYWORDS_LOADED,
      message: 'Data loaded!',
      keywordsTable: {
        data: keywords
      }
    });
  };
}

export function addKeyword() {
  return (
    dispatch: (action: any) => void,
    getState: () => {
      books: {
        selectedBookId: string | null
      },
      form: {
        newBookKeyword: { values: {} }
      }
    }
  ) => {
    const bookId = getState().books.selectedBookId;
    const keywordValues = getState().form.newBookKeyword.values;

    dispatch(addingKeyword());
    console.log(keywordValues);

    ipcRenderer.send('add-book-keyword', bookId, keywordValues);
  };
}


export function addingKeyword() {
  return {
    type: ADDING_KEYWORD,
    message: 'Adding keyword...'
  };
}

export function addingKeywordInputErrors(errors: []) {
  return {
    type: ADDING_KEYWORD_INPUT_ERRORS,
    keywordFields: {
      errors
    }
  };
}

export function keywordAdded(keyword: {}) {
  return {
    type: KEYWORD_ADDED,
    message: 'Keyword added!',
    keywordsTable: {
      newItem: keyword
    }
  };
}

export function keywordUpdated() {
  return {
    type: KEYWORD_UPDATED,
    message: 'Keyword updated!'
  };
}

export function deleteKeyword(id: string, bookId: string) {
  ipcRenderer.send('delete-book-keyword', id, bookId);

  return {
    type: DELETING_KEYWORD,
    message: 'Deleting keyword...'
  };
}

export function keywordDeleted(id: string) {
  return (
    dispatch: (action: any) => void,
    getState: () => { books: { keywordsTable: { data: [], height: number } } }
  ) => {
    const table = getState().books.keywordsTable;
    dispatch(setKeywordsTableHeight(table.data.length > 0 ? table.height : 0));
    dispatch({
      type: KEYWORD_DELETED,
      message: 'Keyword deleted!',
      keywordsTable: {
        removedItem: id
      }
    });
  };
}

export function loadEbayData(
  withoutMessage: boolean = false,
  type: string | void | null,
  options: {} | void
) {
  return (
    dispatch: (action: any) => void,
    getState: () => {
      books: { selectedBookId: string | null, dataTable: { selectedType: string, pagination: {} } }
    }
  ) => {
    const bookId = getState().books.selectedBookId;
    const dataType = type === undefined || type === null
      ? getState().books.dataTable.selectedType : type;
    const bookOptions = options === undefined
      ? getState().books.dataTable.pagination : options;

    if (typeof type === 'string') {
      bookOptions.current = 1;
      bookOptions.sortField = '';
      bookOptions.sortOrder = '';
      bookOptions.total = 0;
    }

    dispatch(loadingEbayData(withoutMessage));

    ipcRenderer.send('load-book-ebay-data', bookId, dataType, bookOptions);
  };
}

export function loadingEbayData(withoutMessage: boolean = false) {
  const message = withoutMessage === true ? '' : 'Loading eBay data...';

  return {
    type: LOADING_EBAY_DATA,
    message
  };
}

export function ebayDataLoaded(data: [], pagination: {}, count: {}) {
  return (dispatch: (action: any) => void) => {
    const height = window.innerHeight
      || document.documentElement.clientHeight
      || document.getElementsByTagName('body')[0].clientHeight;

    dispatch(setDataTableHeight(data.length > 0 ? height - 280 : 0));
    dispatch({
      type: EBAY_DATA_LOADED,
      message: 'Data loaded!',
      dataTable: {
        data,
        pagination,
        count
      }
    });
  };
}

export function selectDataTableRows(selectedRowsKeys: []) {
  return {
    type: SELECT_DATA_TABLE_ROWS,
    dataTable: {
      selectedRowsKeys
    }
  };
}

export function setDataTableType(type: string) {
  return (dispatch: (action: any) => void) => {
    dispatch(selectDataTableRows([]));
    dispatch(loadEbayData(false, type));

    dispatch({
      type: SET_DATA_TABLE_TYPE,
      dataTable: {
        selectedType: type
      }
    });
  };
}

export function changeEbayData(action: string) {
  return (
    dispatch: (action: any) => void,
    getState: () => {
      books: {
        selectedBookId: string | null,
        dataTable: { selectedType: string, selectedRowsKeys: [] }
      }
    }
  ) => {
    const bookId = getState().books.selectedBookId;
    const dataAction = action;
    const dataType = getState().books.dataTable.selectedType;
    const keys = getState().books.dataTable.selectedRowsKeys;

    dispatch(selectDataTableRows([]));
    dispatch(loadingEbayData(false));

    ipcRenderer.send('book-change-ebay-data', bookId, dataType, dataAction, keys);
  };
}

export function searchKeywords() {
  return (
    dispatch: (action: any) => void,
    getState: () => {
      books: {
        selectedBookId: string | null
      }
    }
  ) => {
    const bookId = getState().books.selectedBookId;

    dispatch({
      type: LOADING_EBAY_DATA,
      message: 'Searching for data...'
    });
    dispatch(changeBookTab('ebay-data'));

    ipcRenderer.send('book-search-keywords', bookId);
  };
}

export function previewSearchKeywords() {
  return (
    dispatch: (action: any) => void,
    getState: () => {
      books: {
        selectedBookId: string | null
      }
    }
  ) => {
    const bookId = getState().books.selectedBookId;

    dispatch({
      type: LOADING_EBAY_DATA,
      message: 'Searching for preview...'
    });

    ipcRenderer.send('book-preview-search-keywords', bookId);
  };
}

export function recalculateBookPrices() {
  return (
    dispatch: (action: any) => void,
    getState: () => {
      books: {
        selectedBookId: string | null
      }
    }
  ) => {
    const bookId = getState().books.selectedBookId;

    dispatch(recalculatingBookPrices());

    ipcRenderer.send('book-recalculate-prices', bookId);
  };
}

export function recalculatingBookPrices() {
  return {
    type: RECALCULATING_BOOK_PRICES,
    message: 'Recalculating...'
  };
}

export function bookPricesRecalculated(prices: {}) {
  return {
    type: BOOK_PRICES_RECALCULATED,
    message: 'Prices recalculated!',
    booksTable: {
      newPrices: prices
    }
  };
}

export function autoCompleteBook(field: string, value: string) {
  return (
    dispatch: (action: any) => void,
    getState: () => {
      autoCompleteData: {
        isLoading: false,
        isLoaded: false,
        authors: [],
        publishers: []
      }
    }
  ) => {
    const autoCompleteData = getState().books.autoCompleteData;

    if (autoCompleteData.isLoaded === false && autoCompleteData.isLoading === false) {
      dispatch(loadingBookAutoCompleteData());
    }

    if (field === 'authors') {
      dispatch({
        type: NEW_BOOK_AUTOCOMPLETE,
        autoCompleteData: {
          filtered: {
            authors: !value
              ? []
              : autoCompleteData.authors.filter(item => item.toLowerCase()
                .includes(value.toLowerCase())).slice(0, 10)
          }
        }
      });
    } else if (field === 'publishers') {
      dispatch({
        type: NEW_BOOK_AUTOCOMPLETE,
        autoCompleteData: {
          filtered: {
            publishers: !value
              ? []
              : autoCompleteData.publishers.filter(item => item.toLowerCase()
                .includes(value.toLowerCase())).slice(0, 10)
          }
        }
      });
    }
  };
}

export function loadingBookAutoCompleteData() {
  ipcRenderer.send('load-book-autocomplete-data');

  return {
    type: NEW_BOOK_AUTOCOMPLETE_DATA_LOADING,
    message: 'Loading...',
    autoCompleteData: {
      isLoading: true,
      isLoaded: false
    }
  };
}

export function bookAutoCompleteDataLoaded(data: { authors: [], publishers: [] }) {
  return {
    type: NEW_BOOK_AUTOCOMPLETE_DATA_LOADED,
    message: 'Data loaded!',
    autoCompleteData: {
      isLoading: false,
      isLoaded: true,
      ...data
    }
  };
}

export function autoCompleteKeywords(value: string) {
  return (
    dispatch: (action: any) => void,
    getState: () => {
      keywordsTable: {
        autoComplete: {
          isLoading: false,
          isLoaded: false,
          data: [],
          filtered: []
        }
      }
    }
  ) => {
    const autoCompleteData = getState().books.keywordsTable.autoComplete;

    if (autoCompleteData.isLoaded === false && autoCompleteData.isLoading === false) {
      dispatch(loadingKeywordsAutoCompleteData());
    }

    dispatch({
      type: KEYWORDS_AUTOCOMPLETE,
      keywordsTable: {
        autoComplete: {
          filtered: !value
            ? []
            : autoCompleteData.data.filter(item => item.toLowerCase()
              .includes(value.toLowerCase())).slice(0, 10)
        }
      }
    });
  };
}

export function loadingKeywordsAutoCompleteData() {
  ipcRenderer.send('load-keywords-autocomplete-data');

  return {
    type: KEYWORDS_AUTOCOMPLETE_DATA_LOADING,
    message: 'Loading...',
    keywordsTable: {
      autoComplete: {
        isLoading: true,
        isLoaded: false
      }
    }
  };
}

export function keywordsAutoCompleteDataLoaded(data: []) {
  return {
    type: KEYWORDS_AUTOCOMPLETE_DATA_LOADED,
    message: 'Data loaded!',
    keywordsTable: {
      autoComplete: {
        isLoading: false,
        isLoaded: true,
        data
      }
    }
  };
}
