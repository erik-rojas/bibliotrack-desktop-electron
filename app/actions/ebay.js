// @flow
import { ipcRenderer } from 'electron';
import { initialize as formInitialize } from 'redux-form';
import { push } from 'react-router-redux';

type actionType = {
  +type: string
} | any;

export const INITIALIZE = 'INITIALIZE';
export const DESTROY = 'DESTROY';
export const SET_MESSAGE_SHOWED = 'SET_MESSAGE_SHOWED';
export const SCHEDULER_ERROR = 'SCHEDULER_ERROR';
export const JOB_HANDLER_ERROR = 'JOB_HANDLER_ERROR';
export const SEARCHES_TABLE_ERROR = 'SEARCHES_TABLE_ERROR';

export const START_SEARCH = 'START_SEARCH';
export const STOP_SEARCH = 'STOP_SEARCH';
export const RESAVING_COVER = 'RESAVING_COVER';
export const COVER_RESAVED = 'COVER_RESAVED';
export const COVER_RESAVING_ERROR = 'COVER_RESAVING_ERROR';
export const DELETING_SEARCH = 'DELETING_SEARCH';
export const SEARCH_DELETED = 'SEARCH_DELETED';
export const SEARCH_DELETING_ERROR = 'SEARCH_DELETING_ERROR';
export const UPDATING_SEARCH = 'UPDATING_SEARCH';
export const SEARCH_UPDATED = 'SEARCH_UPDATED';
export const SEARCH_UPDATING_ERROR = 'SEARCH_UPDATING_ERROR';

export const EXPORTING_EBAY_DATA = 'EXPORTING_EBAY_DATA';
export const SET_DATA_TABLE_TYPE = 'SET_DATA_TABLE_TYPE';
export const RESTORING_ITEM = 'RESTORING_ITEM';
export const DELETING_ITEM = 'DELETING_ITEM';
export const ITEM_RESTORED = 'ITEM_RESTORED';
export const ITEM_DELETED = 'ITEM_DELETED';

export const LOADING_SEARCHES_TABLE = 'LOADING_SEARCHES_TABLE';
export const SEARCHES_TABLE_LOADED = 'SEARCHES_TABLE_LOADED';
export const LOADING_DATA_TABLE = 'LOADING_DATA_TABLE';
export const DATA_TABLE_LOADED = 'DATA_TABLE_LOADED';
export const DATA_TABLE_LOADING_ERROR = 'DATA_TABLE_LOADING_ERROR';

export const SET_DATA_TABLE_SEARCH_TITLE = 'SET_DATA_TABLE_SEARCH_TITLE';
export const SET_DATA_TABLE_SEARCH_SELLER_NAME = 'SET_DATA_TABLE_SEARCH_SELLER_NAME';
export const SET_DATA_TABLE_SEARCH_VISIBLE = 'SET_DATA_TABLE_SEARCH_VISIBLE';
export const SET_DATA_TABLE_SEARCHED = 'SET_DATA_TABLE_SEARCHED';
export const SET_DATA_TABLE_HEIGHT = 'SET_DATA_TABLE_HEIGHT';
export const SET_SEARCH_TABLE_HEIGHT = 'SET_SEARCH_TABLE_HEIGHT';
export const ADDING_SEARCH = 'ADDING_SEARCH';
export const SEARCH_ADDED = 'SEARCH_ADDED';
export const SEARCH_ADDING_ERROR = 'SEARCH_ADDING_ERROR';
export const SET_DATA_TABLE_COVER_URL = 'SET_DATA_TABLE_COVER_URL';
export const SELECT_DATA_TABLE_ROWS = 'SELECT_DATA_TABLE_ROWS';

export function initialize(path: string) {
  return (dispatch: (action: actionType) => void) => {
    if (path === '/ebay-searches') {
      if (process.env.NODE_ENV !== 'production') {
        ipcRenderer.on('ebay-job-handler-request', (event, request) => {
          console.log('[eBay Job Handler] request:');
          console.log(request);
        });

        ipcRenderer.on('ebay-job-handler-response', (event, response) => {
          console.log('[eBay Job Handler] response:');
          console.log(response);
        });
      }

      ipcRenderer.on('ebay-searches-table-loaded', (event, searches, fetchedAll) => {
        dispatch(searchesTableLoaded(searches, fetchedAll));
      });

      ipcRenderer.on('ebay-searches-table-loading-error', (event, error) => {
        dispatch(searchesTableError());

        console.log('[eBay Searches Table] error:');
        console.log(error);
      });

      ipcRenderer.on('ebay-scheduler-error', (event, error) => {
        dispatch(schedulerError());

        console.log('[eBay Scheduler] error:');
        console.log(error);
      });

      ipcRenderer.on('ebay-job-handler-error', (event, error) => {
        dispatch(jobHandlerError(error));

        console.log('[eBay Job Handler] error:');
        console.log(error);
      });
    } else if (path === '/ebay-data') {
      ipcRenderer.on('ebay-data-changed', () => {
        dispatch(loadDataTable(null, null));
      });

      ipcRenderer.on('ebay-data-table-loaded', (event, data, pagination, isSearching) => {
        dispatch(dataTableLoaded(data, pagination, isSearching));
      });

      ipcRenderer.on('ebay-data-table-loading-error', (event, error) => {
        console.log(error);
        dispatch(dataTableLoadingError());
      });

      ipcRenderer.on('ebay-cover-resaving-error', (event, err) => {
        console.log(err);
        dispatch(coverResavingError());
      });

      ipcRenderer.on('ebay-cover-resaved', (event, cover) => {
        dispatch(coverResaved(cover));
      });

      ipcRenderer.on('ebay-data-item-restoring-error', (event, err) => {
        console.log(err);
        // dispatch(itemRestoringError());
      });

      ipcRenderer.on('ebay-data-item-restored', () => {
        dispatch(itemRestored());
        dispatch(loadDataTable(null))
      });

      ipcRenderer.on('ebay-data-item-deleting-error', (event, err) => {
        console.log(err);
        // dispatch(itemDeletingError());
      });

      ipcRenderer.on('ebay-data-item-deleted', () => {
        dispatch(itemDeleted());
        dispatch(loadDataTable(null))
      });
    } else if (path === '/ebay-new-search') {
      dispatch(formInitialize(
        'ebayNewSearch', {
          isActive: false,
          type: 'Completed',
          keywords: '',
          searchPeriod: '',
          useSmartStop: true,
          useExtendedInitial: true,
          minPrice: '',
          maxPrice: '',
          categories: [],
          channels: []
        },
        ['isActive', 'type', 'keywords', 'searchPeriod', 'useSmartStop', 'useExtendedInitial',
          'minPrice', 'maxPrice', 'categories', 'channels']
      ));

      ipcRenderer.on('ebay-search-added', () => {
        dispatch(searchAdded());
        dispatch(push('/ebay-searches'));
      });

      ipcRenderer.on('ebay-search-adding-error', (event, err) => {
        console.log(err);
        dispatch(searchAddingError());
      });
    } else if (path === '/ebay-search') {
      ipcRenderer.on('ebay-search-updated', () => {
        dispatch(searchUpdated());
        dispatch(push('/ebay-searches'));
      });

      ipcRenderer.on('ebay-search-saved', () => {
        dispatch(searchUpdated());
        dispatch(push('/ebay-searches'));
      });

      ipcRenderer.on('ebay-search-updating-error', (event, err) => {
        console.log(err);
        dispatch(searchUpdatingError());
      });

      ipcRenderer.on('ebay-search-saving-error', (event, err) => {
        console.log(err);
        dispatch(searchUpdatingError());
      });

      ipcRenderer.on('ebay-search-deleted', () => {
        dispatch(searchDeleted());
        dispatch(push('/ebay-searches'));
      });

      ipcRenderer.on('ebay-search-deleting-error', (event, err) => {
        console.log(err);
        dispatch(searchDeletingError());
      });
    }

    dispatch({ type: INITIALIZE });
  };
}

export function destroy() {
  ipcRenderer.removeAllListeners('ebay-job-handler-request');
  ipcRenderer.removeAllListeners('ebay-job-handler-response');

  ipcRenderer.removeAllListeners('ebay-scheduler-error');
  ipcRenderer.removeAllListeners('ebay-job-handler-error');
  ipcRenderer.removeAllListeners('ebay-data-changed');

  ipcRenderer.removeAllListeners('ebay-data-table-loaded');
  ipcRenderer.removeAllListeners('ebay-data-table-loading-error');

  ipcRenderer.removeAllListeners('ebay-cover-resaving-error');
  ipcRenderer.removeAllListeners('ebay-cover-resaved');
  ipcRenderer.removeAllListeners('ebay-data-item-restored');
  ipcRenderer.removeAllListeners('ebay-data-item-restoring-error');
  ipcRenderer.removeAllListeners('ebay-data-item-deleted');
  ipcRenderer.removeAllListeners('ebay-data-item-deleting-error');

  ipcRenderer.removeAllListeners('ebay-search-added');
  ipcRenderer.removeAllListeners('ebay-search-adding-error');
  ipcRenderer.removeAllListeners('ebay-search-updated');
  ipcRenderer.removeAllListeners('ebay-search-updating-error');
  ipcRenderer.removeAllListeners('ebay-search-saved');
  ipcRenderer.removeAllListeners('ebay-search-saving-error');
  ipcRenderer.removeAllListeners('ebay-search-deleted');
  ipcRenderer.removeAllListeners('ebay-search-deleting-error');

  return { type: DESTROY };
}

export function changeEbayData(type: string) {
  return (
    dispatch: (action: any) => void,
    getState: () => {
      books: {
        selectedBookId: string | null,
        dataTable: { selectedType: string, selectedRowsKeys: [] }
      }
    }
  ) => {
    const keys = getState().books.dataTable.selectedRowsKeys;

    dispatch(selectDataTableRows([]));
    dispatch(loadingDataTable());

    ipcRenderer.send('change-ebay-data', type, keys);
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

export function itemRestored() {
  return {
    type: ITEM_RESTORED,
    message: 'Restored!'
  };
}

export function itemDeleted() {
  return {
    type: ITEM_DELETED,
    message: 'Deleted!'
  };
}

export function exportData() {
  ipcRenderer.send('export-ebay-data');

  return exportingData();
}

export function exportingData() {
  return {
    type: EXPORTING_EBAY_DATA,
    message: 'Exporting data...'
  };
}

export function setDataTableType(type: string) {
  return (dispatch: (action: any) => void) => {
    dispatch(selectDataTableRows([]));
    dispatch(loadDataTable(null, type));

    dispatch({
      type: SET_DATA_TABLE_TYPE,
      dataTable: {
        selectedType: type
      }
    });
  };
}

export function showSearch(key: any) {
  return (dispatch: (action: actionType) => void) => {
    dispatch(destroy());
    dispatch(push(`/ebay-search?searchKey=${key}`));
  };
}

export function updateSearch() {
  return (
    dispatch: (action: actionType) => void,
    getState: () => { form: { ebaySearch: { values: {} } } }
  ) => {
    const search = getState().form.ebaySearch.values;

    console.log(search);
    if (search.restartSearch === true) {
      ipcRenderer.send('update-ebay-search', search);
    } else {
      ipcRenderer.send('save-ebay-search', search);
    }

    dispatch(updatingSearch());
  };
}

export function updatingSearch() {
  return {
    type: UPDATING_SEARCH,
    message: 'Saving search...'
  };
}

export function searchUpdated() {
  return {
    type: SEARCH_UPDATED,
    message: 'Saved!'
  };
}

export function searchUpdatingError() {
  return {
    type: SEARCH_UPDATING_ERROR,
    message: 'Search saving error!',
    description: 'Check the console output...'
  };
}

export function deleteSearch(searchId: any) {
  return (dispatch: (action: actionType) => void) => {
    ipcRenderer.send('delete-ebay-search', searchId);

    dispatch(deletingSearch());
  };
}

export function deletingSearch() {
  return {
    type: DELETING_SEARCH,
    message: 'Deleting search...'
  };
}

export function searchDeleted() {
  return {
    type: SEARCH_DELETED,
    message: 'Search deleted!'
  };
}

export function searchDeletingError() {
  return {
    type: SEARCH_DELETING_ERROR,
    message: 'Search deleting error!',
    description: 'Check the console output...'
  };
}

export function stopSearch() {
  ipcRenderer.send('ebay-stop-handling-searches');

  return {
    type: STOP_SEARCH
  };
}

export function startSearch() {
  ipcRenderer.send('ebay-start-handling-searches');

  return {
    type: START_SEARCH
  };
}

export function resaveCover(id: string) {
  return (
    dispatch: (action: actionType) => void,
    getState: () => { ebay: { dataTable: { data: [{ key: string, image_url: string }] } } }
  ) => {
    const imageURL = getState().ebay.dataTable.data.filter(item => item.key === id)[0].image_url;

    console.log(imageURL);
    ipcRenderer.send('ebay-resave-cover', id, imageURL);

    dispatch(resavingCover());
  };
}

export function resavingCover() {
  return {
    type: RESAVING_COVER,
    message: 'Resaving cover...'
  };
}

export function coverResavingError() {
  return {
    type: COVER_RESAVING_ERROR,
    message: 'Cover resaving error!',
    description: 'Check the console output...'
  };
}

export function coverResaved(cover: {}) {
  return {
    type: COVER_RESAVED,
    message: 'Cover resaved!',
    dataTable: {
      cover
    }
  };
}

export function setSearchTableHeight(pixels: number) {
  return {
    type: SET_SEARCH_TABLE_HEIGHT,
    searchTable: {
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

export function addSearch() {
  return (
    dispatch: (action: actionType) => void,
    getState: () => { form: { ebayNewSearch: { values: {} } } }
  ) => {
    const search = getState().form.ebayNewSearch.values;

    dispatch(addingSearch());

    ipcRenderer.send('add-ebay-search', search);
  };
}

export function addingSearch() {
  return {
    type: ADDING_SEARCH,
    message: 'Adding search...'
  };
}

export function searchAdded() {
  return {
    type: SEARCH_ADDED,
    message: 'Search added!'
  };
}

export function searchAddingError() {
  return {
    type: SEARCH_ADDING_ERROR,
    message: 'Search adding error!',
    description: 'Check the console output...'
  };
}

export function loadSearchesTable() {
  ipcRenderer.send('load-ebay-searches-table');

  return loadingSearchesTable();
}

export function loadingSearchesTable() {
  return {
    type: LOADING_SEARCHES_TABLE,
    message: 'Loading table...'
  };
}

export function searchesTableLoaded(searches: [], fetchedAll: number) {
  console.log(searches);
  return {
    type: SEARCHES_TABLE_LOADED,
    message: 'Table loaded!',
    searchTable: {
      fetchedAll,
      data: searches,
      loading: false
    }
  };
}

export function restoreItem(id: string) {
  ipcRenderer.send('restore-ebay-data-item', id);

  return restoringItem();
}

export function restoringItem() {
  return {
    type: RESTORING_ITEM,
    message: 'Restoring item...'
  };
}

export function deleteItem(id: string) {
  ipcRenderer.send('delete-ebay-data-item', id);

  return deletingItem();
}

export function deletingItem() {
  return {
    type: DELETING_ITEM,
    message: 'Deleting item...'
  };
}

export function loadDataTable(
  options: {} | null,
  type: string | null | void,
) {
  return (
    dispatch: (action: any) => void,
    getState: () => {
      ebay: { dataTable: { selectedType: string, pagination: {} } }
    }
  ) => {
    const dataType = type === undefined || type === null
      ? getState().books.dataTable.selectedType : type;
    const preparedOptions = options === null
      ? getState().books.dataTable.pagination : options;

    if (typeof type === 'string') {
      preparedOptions.current = 1;
      preparedOptions.sortField = '';
      preparedOptions.sortOrder = '';
      preparedOptions.total = 0;
    }

    dispatch(loadingDataTable());

    ipcRenderer.send('load-ebay-data-table', preparedOptions, dataType);
  };
}

export function loadingDataTable() {
  return {
    type: LOADING_DATA_TABLE,
    message: 'Loading table...'
  };
}

export function dataTableLoaded(data: [], pagination: {}, isSearching: boolean) {
  return (
    dispatch: (action: any) => void
  ) => {
    console.log(data);
    console.log(pagination);

    const height = window.innerHeight
      || document.documentElement.clientHeight
      || document.getElementsByTagName('body')[0].clientHeight;

    dispatch(setDataTableHeight(data.length > 0 ? height - 175 : 0));
    dispatch({
      type: DATA_TABLE_LOADED,
      message: 'Table loaded!',
      dataTable: {
        data,
        pagination,
        loading: false
      },
      dataCollector: {
        completed: {
          status: isSearching === true ? 'searching' : 'disabled'
        }
      }
    });
  };
}

export function dataTableLoadingError() {
  return {
    type: DATA_TABLE_LOADING_ERROR,
    message: 'Table loading error!',
    description: 'Check the console output...'
  };
}

export function setMessageShowed() {
  return {
    type: SET_MESSAGE_SHOWED
  };
}

export function searchesTableError() {
  return {
    type: SEARCHES_TABLE_ERROR,
    message: 'Table loading error!',
    description: 'Check the console output...'
  };
}

export function schedulerError() {
  return {
    type: SCHEDULER_ERROR,
    message: '[eBay Scheduler] error!',
    description: 'Check the console output...'
  };
}

export function jobHandlerError(error: any) {
  return {
    type: JOB_HANDLER_ERROR,
    message: '[eBay Job Handler] error!',
    description: error || 'Check the console output...'
  };
}

export function setDataTableCoverURL(key: string, value: string) {
  return (
    dispatch: (action: actionType) => void,
    getState: () => { ebay: { dataTable: { data: [] } } }
  ) => {
    const data = getState().ebay.dataTable.data;

    const newData = data.map(item => (item.key === key
      ? { ...item, image_url: value }
      : item
    ));

    dispatch({
      type: SET_DATA_TABLE_COVER_URL,
      dataTable: {
        data: newData
      }
    });
  };
}
