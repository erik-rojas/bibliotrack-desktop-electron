// @flow
import {
  INITIALIZE, DESTROY, SET_MESSAGE_SHOWED, SCHEDULER_ERROR, JOB_HANDLER_ERROR,
  DATA_TABLE_LOADED, LOADING_DATA_TABLE, SET_DATA_TABLE_SEARCH_SELLER_NAME, SET_SEARCH_TABLE_HEIGHT,
  SET_DATA_TABLE_SEARCH_TITLE, SET_DATA_TABLE_SEARCH_VISIBLE, SET_DATA_TABLE_SEARCHED,
  SET_DATA_TABLE_HEIGHT, RESAVING_COVER, COVER_RESAVED, COVER_RESAVING_ERROR, SEARCHES_TABLE_LOADED,
  ADDING_SEARCH, SEARCHES_TABLE_ERROR, SEARCH_ADDED, DELETING_SEARCH, SEARCH_DELETED,
  SEARCH_DELETING_ERROR, UPDATING_SEARCH, SEARCH_UPDATED, SEARCH_UPDATING_ERROR, SET_DATA_TABLE_TYPE,
  DATA_TABLE_LOADING_ERROR, LOADING_SEARCHES_TABLE, SET_DATA_TABLE_COVER_URL, EXPORTING_EBAY_DATA,
  RESTORING_ITEM, DELETING_ITEM, ITEM_DELETED, ITEM_RESTORED, SELECT_DATA_TABLE_ROWS
} from '../actions/ebay';

export type ebayStateType = {
  +status: string,
  +message: string,
  +description: string,
  +isMessageShowed: boolean,
  +dataCollector: {
    completed: {
      status: string
    },
    live: {
      status: string
    }
  },
  +searchTable: {
    +fetchedAll: number,
    +height: number,
    +loading: boolean,
    +data: []
  },
  +dataTable: {
    +height: number,
    +data: [],
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
    +selectedType: string,
    +loading: boolean,
    +searched: [],
    +searchVisible: string,
    +selectedRowsKeys: []
  }
};

const initialState = {
  status: '',
  message: '',
  description: '',
  isMessageShowed: true,
  dataCollector: {
    completed: {
      status: 'disabled'
    },
    live: {
      status: 'disabled'
    }
  },
  searchTable: {
    fetchedAll: 0,
    height: 530,
    loading: false,
    data: []
  },
  dataTable: {
    height: 530,
    data: [],
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
    selectedType: 'Default',
    loading: false,
    searched: [],
    searchVisible: '',
    selectedRowsKeys: []
  }
};

type actionType = {
  +type: string,
  +message: string | void,
  +description: string | void,
  +dataCollector: {
    +completed: {
      +status: string | void
    } | void,
    +live: {
      +status: string | void
    } | void
  } | void,
  +searchTable: {
    +fetchedAll: number | void,
    +height: number | void,
    +loading: boolean | void,
    +data: [] | void
  } | void,
  +dataTable: {
    +height: number | void,
    +data: [] | void,
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
    +selectedType: string | void,
    +loading: boolean | void,
    +searched: [] | void,
    +searchVisible: string | void,
    +cover: {} | void,
    +selectedRowsKeys: [] | void
  } | void
};

export default function ebay(state: ebayStateType = initialState, action: actionType) {
  switch (action.type) {
    case SELECT_DATA_TABLE_ROWS:
      return {
        ...state,
        dataTable: {
          ...state.dataTable,
          selectedRowsKeys: action.dataTable.selectedRowsKeys
        }
      };
    case SET_DATA_TABLE_COVER_URL:
      return {
        ...state,
        dataTable: {
          ...state.dataTable,
          data: action.dataTable.data
        }
      };
    case SET_DATA_TABLE_SEARCH_TITLE:
    case SET_DATA_TABLE_SEARCH_SELLER_NAME:
      return {
        ...state,
        dataTable: {
          ...state.dataTable,
          ...action.dataTable,
          pagination: {
            ...state.dataTable.pagination,
            ...action.dataTable.pagination
          }
        }
      };
    case SET_SEARCH_TABLE_HEIGHT:
      return {
        ...state,
        searchTable: {
          ...state.searchTable,
          ...action.searchTable
        }
      };
    case SET_DATA_TABLE_SEARCH_VISIBLE:
    case SET_DATA_TABLE_SEARCHED:
    case SET_DATA_TABLE_HEIGHT:
      return {
        ...state,
        dataTable: {
          ...state.dataTable,
          ...action.dataTable
        }
      };
    case LOADING_SEARCHES_TABLE:
      return {
        ...state,
        status: 'loading',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        searchTable: {
          ...state.searchTable,
          loading: true
        }
      };
    case SET_DATA_TABLE_TYPE:
      return {
        ...state,
        dataTable: {
          ...state.dataTable,
          ...action.dataTable
        }
      };
    case LOADING_DATA_TABLE:
      return {
        ...state,
        status: 'loading',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        dataTable: {
          ...state.dataTable,
          loading: true
        }
      };
    case SEARCHES_TABLE_LOADED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        searchTable: {
          ...state.searchTable,
          ...action.searchTable
        }
      };
    case DATA_TABLE_LOADED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        dataTable: {
          ...state.dataTable,
          ...action.dataTable,
          pagination: {
            ...state.dataTable.pagination,
            ...action.dataTable.pagination
          }
        },
        dataCollector: {
          ...state.dataCollector,
          ...action.dataCollector
        }
      };
    case SET_MESSAGE_SHOWED:
      return {
        ...state,
        isMessageShowed: true
      };
    case UPDATING_SEARCH:
    case ADDING_SEARCH:
    case RESAVING_COVER:
    case DELETING_SEARCH:
    case EXPORTING_EBAY_DATA:
    case RESTORING_ITEM:
    case DELETING_ITEM:
      return {
        ...state,
        status: 'loading',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false
      };
    case SEARCH_UPDATED:
    case SEARCH_DELETED:
    case SEARCH_ADDED:
    case ITEM_DELETED:
    case ITEM_RESTORED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false
      };
    case COVER_RESAVED:
      return {
        ...state,
        status: 'success',
        message: action.message || '',
        description: action.description || '',
        isMessageShowed: false,
        dataTable: {
          ...state.dataTable,
          data: state.dataTable.data.map(item => (item.key === action.dataTable.cover.id
            ? {
              ...item,
              image_type: action.dataTable.cover.image.contentType,
              cover: action.dataTable.cover.image.data
            }
            : item))
        }
      };
    case SEARCH_UPDATING_ERROR:
    case SEARCHES_TABLE_ERROR:
    case JOB_HANDLER_ERROR:
    case SCHEDULER_ERROR:
    case COVER_RESAVING_ERROR:
    case SEARCH_DELETING_ERROR:
    case DATA_TABLE_LOADING_ERROR:
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
