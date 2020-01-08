// @flow
import checkData from '../utils/checkData';

import {
  LOADING_SEARCHES, SEARCHES_LOADED, SEARCHES_LOADING_ERROR,
  ADDING_SEARCH, SEARCH_ADDED, SEARCH_ADDING_ERROR,
  DELETING_SEARCH, SEARCH_DELETED, SEARCH_DELETION_ERROR,
  STARTING_SEARCH, SEARCH_STARTED, SEARCH_STARTING_ERROR, SEARCHED_DATA_EXPORT_NO_DATA,
  EXPORTING_SEARCHES_DATA, SEARCHES_DATA_EXPORTED, SEARCHES_DATA_EXPORTING_ERROR,
  SELECT_TABLE_ROWS, SET_EXPORT_MODE, SET_TABLE_HEIGHT, SEARCH_IN_TABLE,
  RESET_STATUS, UPDATE_SEARCH_STATUS, SET_TABLE_SEARCH_VALUES, SET_TABLE_SEARCH_VISIBLE,
  SHOW_FAILED_MODAL, HIDE_FAILED_MODAL, LOADING_MODAL_DATA, MODAL_DATA_LOADING_ERROR,
  RESTARTING_FAILED_ITEMS, FAILED_ITEMS_RESTARTING_ERROR, SEARCHED_DATA_EXPORT_CANCELLED,
  INITIALIZE, DESTROY
} from '../actions/amazon';

export type searchFormStateType = {
  +form: {
    +search: {
      +values: {
        +name: string,
        +channels: Array<number>,
        +isAsins: boolean | void,
        +isbnsOrAsins: string
      }
    }
  }
};

export type amazonStateType = {
  +status: string,
  +message: string,
  +searches: [],
  +selectedRowsKeys: [],
  +tableHeight: number,
  +tableSearchValues: { +name: string },
  +tableSearchVisible: { +name: boolean },
  +failedModalVisible: boolean,
  +failedModalData: []
};

const initialState = {
  status: '',
  message: '',
  searches: [],
  selectedRowsKeys: [],
  tableHeight: 0,
  tableSearchValues: { name: '' },
  tableSearchVisible: { name: false },
  failedModalVisible: false,
  failedModalData: []
};

type actionType = {
  +type: string,
  +message: string | void,
  +description: string | void,
  +searches: [] | void,
  +selectedRowsKeys: [] | void,
  +tableHeight: number | void,
  +deletedId: string | void,
  +updatedSearch: {} | void,
  +searchData: {} | void,
  +tableSearchValues: {} | void,
  +tableSearchVisible: {} | void,
  +failedModalData: [] | void
};

export default function amazon(state: amazonStateType = initialState, action: actionType) {
  switch (action.type) {
    case UPDATE_SEARCH_STATUS:
      return {
        ...state,
        searches: state.searches.map(search => (
          search.id === action.searchData.id
            ? {
              ...search,
              inQueue: search.inQueue
                - checkData(action.searchData.finished, 0) - checkData(action.searchData.failed, 0),
              finished: search.finished + checkData(action.searchData.finished, 0),
              failed: search.failed + checkData(action.searchData.failed, 0)
            } : search
        ))
      };
    case SET_TABLE_SEARCH_VALUES:
      return {
        ...state,
        tableSearchValues: action.tableSearchValues
      };
    case SET_TABLE_SEARCH_VISIBLE:
      return {
        ...state,
        tableSearchVisible: action.tableSearchVisible
      };
    case SEARCH_IN_TABLE: // Only for "Name" field at this moment
      return {
        ...state,
        searches: state.searches.map(search => (
          search.name.toLowerCase().includes(state.tableSearchValues.name.toLowerCase())
            ? {
              ...search,
              visible: true
            } : {
              ...search,
              visible: false
            }
        )),
        tableSearched: state.tableSearchValues.name !== ''
      };
    case LOADING_SEARCHES:
    case ADDING_SEARCH:
    case DELETING_SEARCH:
    case STARTING_SEARCH:
    case EXPORTING_SEARCHES_DATA:
    case LOADING_MODAL_DATA:
    case RESTARTING_FAILED_ITEMS:
      return {
        ...state,
        status: 'loading',
        message: action.message
      };
    case SEARCH_STARTED:
      return {
        ...state,
        status: 'success',
        message: action.message,
        searches: state.searches.map(search => (
          search.id === action.updatedSearch.id
            ? { ...action.updatedSearch, visible: search.visible }
            : search
        ))
      };
    case SEARCH_ADDED:
    case SEARCHES_DATA_EXPORTED:
    case SEARCHED_DATA_EXPORT_CANCELLED:
    case SEARCHED_DATA_EXPORT_NO_DATA:
      return {
        ...state,
        status: 'success',
        message: action.message
      };
    case SEARCH_DELETED:
      return {
        ...state,
        status: 'success',
        message: action.message,
        searches: state.searches.filter(search => search.id !== action.deletedId),
        selectedRowsKeys: state.selectedRowsKeys.filter(key => key !== action.deletedId)
      };
    case SEARCHES_LOADED:
      return {
        ...state,
        status: 'success',
        message: action.message,
        searches: action.searches
      };
    case SEARCH_STARTING_ERROR:
    case SEARCH_ADDING_ERROR:
    case SEARCH_DELETION_ERROR:
    case SEARCHES_LOADING_ERROR:
    case SEARCHES_DATA_EXPORTING_ERROR:
    case MODAL_DATA_LOADING_ERROR:
    case FAILED_ITEMS_RESTARTING_ERROR:
      return {
        ...state,
        status: 'error',
        message: action.message,
        description: action.description
      };
    case SELECT_TABLE_ROWS:
      return {
        ...state,
        selectedRowsKeys: action.selectedRowsKeys,
      };
    case SET_TABLE_HEIGHT:
      return {
        ...state,
        tableHeight: action.tableHeight,
      };
    case SHOW_FAILED_MODAL:
      return {
        ...state,
        status: 'success',
        message: action.message,
        failedModalVisible: true,
        failedModalData: action.failedModalData
      };
    case HIDE_FAILED_MODAL:
      return {
        ...state,
        failedModalVisible: false
      };
    case RESET_STATUS:
      return {
        ...state,
        status: '',
        message: ''
      };
    case INITIALIZE:
    case DESTROY:
      return state;
    default:
      return state;
  }
}
