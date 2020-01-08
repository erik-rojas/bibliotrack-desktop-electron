import {
  // CORE
  INITIALIZE, DESTROY, SET_MESSAGE_SHOWED,
  // BOOKS
  SET_BOOKS_TABLE_HEIGHT, LOADING_BOOKS, BOOKS_LOADED, BOOKS_LOADING_ERROR,
  // BOOK
  SELECT_BOOK, SET_BOOK_EBAY_TAB, RECALCULATING_BOOK_PRICES, BOOK_PRICES_RECALCULATED,
  ADDING_BOOK, BOOK_ADDED, BOOK_ADDING_ERROR, BOOK_DELETED, ADDING_KEYWORD_INPUT_ERRORS,
  LOADING_KEYWORDS, KEYWORDS_LOADED, ADDING_KEYWORD, KEYWORD_ADDED, KEYWORD_UPDATED,
  DELETING_KEYWORD, KEYWORD_DELETED, LOADING_EBAY_DATA, EBAY_DATA_LOADED,
  SET_KEYWORDS_TABLE_HEIGHT, SET_DATA_TABLE_HEIGHT, SET_DATA_TABLE_TYPE,
  SET_KEYWORD_FIELD_VALUE, SELECT_DATA_TABLE_ROWS, NEW_BOOK_AUTOCOMPLETE, SET_AUTHORS_SIZE_FOR_SELECTED_BOOK,
  NEW_BOOK_AUTOCOMPLETE_DATA_LOADING, NEW_BOOK_AUTOCOMPLETE_DATA_LOADED, KEYWORDS_PREVIEW_SEARCHED,
  SAVING_BOOK, BOOK_UPDATING_ERROR, BOOK_UPDATED, SAVING_KEYWORD, SELECT_KEYWORD, CHANGE_BOOK_TAB,
  KEYWORDS_AUTOCOMPLETE, KEYWORDS_AUTOCOMPLETE_DATA_LOADED, KEYWORDS_AUTOCOMPLETE_DATA_LOADING,
  SET_DATA_TABLE_SEARCH_VISIBLE, SET_DATA_TABLE_SEARCH_TITLE, SET_DATA_TABLE_SEARCH_SELLER_NAME,
  SET_DATA_TABLE_SEARCHED, SET_SERIALS_SIZE_FOR_SELECTED_BOOK
} from '../actions/books';

export type stateType = {
  +status: string,
  +message: string,
  +description: string,
  +isMessageShowed: boolean,
  +selectedBook: {} | null,
  +selectedBookId: string | null,
  +selectedBookTab: string,
  +selectedKeywordId: string | null,
  +selectedKeyword: {} | null,
  +activeEbayTab: string | void,
  +autoCompleteData: {
    +isLoading: boolean,
    +isLoaded: boolean,
    +authors: [],
    +publishers: [],
    +filtered: {
      +authors: [],
      +publishers: []
    }
  },
  +booksTable: {
    +data: [],
    +height: number,
    +isLoading: boolean
  },
  +keywordsTable: {
    +data: [],
    +height: number,
    +isLoading: boolean,
    +autoComplete: {
      +isLoading: boolean,
      +isLoaded: boolean,
      +data: [],
      +filtered: []
    }
  },
  +dataTable: {
    +data: [],
    +height: number,
    +isLoading: boolean,
    +selectedRowsKeys: [],
    +selectedType: string,
    +pagination: {
      +pageSize: number,
      +current: number,
      +total: number,
      +sortField: string,
      +sortOrder: string,
      +filterTitle: string,
      +filterSellerName: string,
      +filterChannel: string,
      +filterCategory: string
    },
    +count: {
      pending: number | null,
      approved: number | null,
      rejected: number | null
    },
    +searched: [],
    +searchVisible: string,
    +possibleSearchSize: number | string | null
  }
};

const initialState = {
  status: '',
  message: '',
  description: '',
  isMessageShowed: true,
  selectedBook: null,
  selectedBookId: null,
  selectedBookTab: 'info',
  selectedKeywordId: null,
  selectedKeyword: null,
  activeEbayTab: 'keywords',
  autoCompleteData: {
    isLoading: false,
    isLoaded: false,
    authors: [],
    publishers: [],
    filtered: {
      authors: [],
      publishers: []
    }
  },
  booksTable: {
    data: [],
    height: 0,
    isLoading: false
  },
  keywordsTable: {
    data: [],
    height: 0,
    isLoading: false,
    autoComplete: {
      isLoading: false,
      isLoaded: false,
      data: [],
      filtered: []
    }
  },
  dataTable: {
    data: [],
    height: 0,
    isLoading: false,
    selectedRowsKeys: [],
    selectedType: 'Pending',
    pagination: {
      pageSize: 100,
      current: 1,
      total: 0,
      sortField: '',
      sortOrder: '',
      filterTitle: '',
      filterSellerName: '',
      filterChannel: '',
      filterCategory: ''
    },
    count: {
      pending: null,
      approved: null,
      rejected: null
    },
    searched: [],
    searchVisible: '',
    possibleSearchSize: null
  }
};

type actionType = {
  +type: string,
  +message: string | void,
  +description: string | void,
  +selectedBook: {} | null | void,
  +selectedBookId: string | null | void,
  +selectedBookTab: string | void,
  +selectedKeywordId: string | null | void,
  +selectedKeyword: {} | null | void,
  +activeEbayTab: string | void,
  +autoCompleteData: {
    +isLoading: boolean | void,
    +isLoaded: boolean | void,
    +authors: [] | void,
    +publishers: [] | void,
    +filtered: {
      +authors: [] | void,
      +publishers: [] | void
    } | void
  } | void,
  +booksTable: {
    +removedItem: string | void,
    +data: [] | void,
    +height: number | void,
    +isLoading: boolean | void,
    +newPrices: {
      +avgPrice: string,
      +minPrice: string,
      +maxPrice: string
    } | void
  } | void,
  +keywordsTable: {
    +newItem: {} | void,
    +removedItem: string | void,
    +data: [] | void,
    +height: number | void,
    +isLoading: boolean | void,
    +autoComplete: {
      +isLoading: boolean | void,
      +isLoaded: boolean | void,
      +data: [] | void,
      +filtered: [] | void
    } | void
  } | void,
  +dataTable: {
    +data: [] | void,
    +height: number | void,
    +isLoading: boolean | void,
    +selectedRowsKeys: [] | void,
    +selectedType: string | void,
    +pagination: {
      +pageSize: number | void,
      +current: number | void,
      +total: number | void,
      +sortField: string | void,
      +sortOrder: string | void,
      +filterTitle: string | void,
      +filterSellerName: string | void,
      +filterChannel: string | void,
      +filterCategory: string | void
    } | void,
    count: {
      pending: number | null | void,
      approved: number | null | void,
      rejected: number | null | void
    } | void,
    +searched: [] | void,
    +searchVisible: string | void,
    +possibleSearchSize: number | null | void
  } | void
};

export default function books(state: stateType = initialState, action: actionType) {
  switch (action.type) {
    case SET_SERIALS_SIZE_FOR_SELECTED_BOOK:
    case SET_AUTHORS_SIZE_FOR_SELECTED_BOOK:
      return {
        ...state,
        selectedBook: {
          ...state.selectedBook,
          ...action.selectedBook
        }
      };
    case CHANGE_BOOK_TAB:
      return {
        ...state,
        selectedBookTab: action.selectedBookTab
      };
    case KEYWORDS_PREVIEW_SEARCHED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        dataTable: {
          ...state.dataTable,
          ...action.dataTable
        }
      };
    case SET_DATA_TABLE_SEARCHED:
      return {
        ...state,
        dataTable: {
          ...state.dataTable,
          searched: action.dataTable.searched
        }
      };
    case SET_DATA_TABLE_SEARCH_SELLER_NAME:
    case SET_DATA_TABLE_SEARCH_TITLE:
      return {
        ...state,
        dataTable: {
          ...state.dataTable,
          pagination: {
            ...state.dataTable.pagination,
            ...action.dataTable.pagination
          }
        }
      };
    case NEW_BOOK_AUTOCOMPLETE_DATA_LOADING:
      return {
        ...state,
        status: 'loading',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        autoCompleteData: {
          ...state.autoCompleteData,
          ...action.autoCompleteData
        }
      };
    case NEW_BOOK_AUTOCOMPLETE_DATA_LOADED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        autoCompleteData: {
          ...state.autoCompleteData,
          ...action.autoCompleteData
        }
      };
    case NEW_BOOK_AUTOCOMPLETE:
      return {
        ...state,
        autoCompleteData: {
          ...state.autoCompleteData,
          filtered: {
            ...state.autoCompleteData.filtered,
            ...action.autoCompleteData.filtered
          }
        }
      };
    case KEYWORDS_AUTOCOMPLETE_DATA_LOADING:
      return {
        ...state,
        status: 'loading',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        keywordsTable: {
          ...state.keywordsTable,
          autoComplete: {
            ...state.keywordsTable.autoComplete,
            ...action.keywordsTable.autoComplete
          }
        }
      };
    case KEYWORDS_AUTOCOMPLETE_DATA_LOADED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        keywordsTable: {
          ...state.keywordsTable,
          autoComplete: {
            ...state.keywordsTable.autoComplete,
            ...action.keywordsTable.autoComplete
          }
        }
      };
    case KEYWORDS_AUTOCOMPLETE:
      return {
        ...state,
        keywordsTable: {
          ...state.keywordsTable,
          autoComplete: {
            ...state.keywordsTable.autoComplete,
            ...action.keywordsTable.autoComplete
          }
        }
      };
    case SET_BOOK_EBAY_TAB:
      return {
        ...state,
        activeEbayTab: action.activeEbayTab
      };
    case SET_MESSAGE_SHOWED:
      return {
        ...state,
        isMessageShowed: true
      };
    case SET_BOOKS_TABLE_HEIGHT:
      return {
        ...state,
        booksTable: {
          ...state.booksTable,
          ...action.booksTable
        }
      };
    case SET_KEYWORDS_TABLE_HEIGHT:
      return {
        ...state,
        keywordsTable: {
          ...state.keywordsTable,
          ...action.keywordsTable
        }
      };
    case SET_DATA_TABLE_HEIGHT:
      return {
        ...state,
        dataTable: {
          ...state.dataTable,
          height: action.dataTable.height
        }
      };
    case SET_KEYWORD_FIELD_VALUE:
      return {
        ...state,
        keywordFields: {
          ...state.keywordFields,
          ...action.keywordFields
        }
      };
    case SELECT_DATA_TABLE_ROWS:
      return {
        ...state,
        dataTable: {
          ...state.dataTable,
          selectedRowsKeys: action.dataTable.selectedRowsKeys
        }
      };
    case SET_DATA_TABLE_TYPE:
    case SET_DATA_TABLE_SEARCH_VISIBLE:
      return {
        ...state,
        dataTable: {
          ...state.dataTable,
          ...action.dataTable
        }
      };
    case SELECT_BOOK:
      return {
        ...state,
        selectedBookId: action.selectedBookId,
        selectedBook: state.booksTable.data.filter(item => item.id === action.selectedBookId)[0]
      };
    case SELECT_KEYWORD:
      return {
        ...state,
        selectedKeywordId: action.selectedKeywordId,
        selectedKeyword: action.selectedKeyword
      };
    case BOOK_PRICES_RECALCULATED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        booksTable: {
          ...state.booksTable,
          data: state.booksTable.data.map(item => {
            if (item.key === state.selectedBookId) {
              return {
                ...item,
                avg_price: action.booksTable.newPrices.avgPrice,
                min_price: action.booksTable.newPrices.minPrice,
                max_price: action.booksTable.newPrices.maxPrice
              };
            }

            return item;
          })
        },
        selectedBook: {...state.selectedBook,
          avg_price: action.booksTable.newPrices.avgPrice,
          min_price: action.booksTable.newPrices.minPrice,
          max_price: action.booksTable.newPrices.maxPrice
        }
      };
    case ADDING_KEYWORD_INPUT_ERRORS:
      return {
        ...state,
        keywordFields: {
          ...state.keywordFields,
          errors: action.keywordFields.errors
        }
      };
    case LOADING_BOOKS:
    case ADDING_BOOK:
    case SAVING_BOOK:
    case SAVING_KEYWORD:
    case LOADING_KEYWORDS:
    case ADDING_KEYWORD:
    case DELETING_KEYWORD:
    case RECALCULATING_BOOK_PRICES:
      return {
        ...state,
        status: 'loading',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false
      };
    case LOADING_EBAY_DATA:
      return {
        ...state,
        status: 'loading',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        dataTable: {
          ...state.dataTable,
          isLoading: true
        }
      };
    case EBAY_DATA_LOADED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        dataTable: {
          ...state.dataTable,
          data: [...action.dataTable.data],
          pagination: {
            ...state.dataTable.pagination,
            ...action.dataTable.pagination
          },
          count: action.dataTable.count,
          selectedRowsKeys: [],
          isLoading: false
        }
      };
    case BOOKS_LOADED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        booksTable: {
          ...state.booksTable,
          data: [...action.booksTable.data]
        }
      };
    case BOOK_ADDED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        booksTable: {
          ...state.booksTable,
          ...action.booksTable
        }
      };
    case BOOK_UPDATED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        booksTable: {
          ...state.booksTable,
          data: [...state.booksTable.data.filter(item => item.id !== action.booksTable.data[0].id),
            ...action.booksTable.data]
        },
        selectedBook: action.booksTable.data[0]
      };
    case KEYWORDS_LOADED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        keywordsTable: {
          ...state.keywordsTable,
          data: [...action.keywordsTable.data]
        }
      };
    case KEYWORD_ADDED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        keywordsTable: {
          ...state.keywordsTable,
          data: [
            ...state.keywordsTable.data,
            action.keywordsTable.newItem
          ]
        }
      };
    case KEYWORD_UPDATED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false
      };
    case BOOK_DELETED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        booksTable: {
          ...state.booksTable,
          data: state.booksTable.data
            .filter(item => item.id !== action.booksTable.removedItem)
        }
      };
    case KEYWORD_DELETED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        keywordsTable: {
          ...state.keywordsTable,
          data: state.keywordsTable.data
            .filter(item => item.id !== action.keywordsTable.removedItem)
        }
      };
    case BOOKS_LOADING_ERROR:
    case BOOK_ADDING_ERROR:
    case BOOK_UPDATING_ERROR:
      return {
        ...state,
        status: 'error',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false
      };
    case INITIALIZE:
    case DESTROY:
    default:
      return state;
  }
}
