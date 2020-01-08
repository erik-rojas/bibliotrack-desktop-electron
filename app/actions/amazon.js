// @flow
import { ipcRenderer } from 'electron';
import { push } from 'react-router-redux';

import type { amazonStateType, searchFormStateType } from '../reducers/amazon';

type actionType = {
  +type: string
} | any;

export const INITIALIZE = 'INITIALIZE';
export const DESTROY = 'DESTROY';
export const LOAD_SEARCHES = 'LOAD_SEARCHES';
export const LOADING_SEARCHES = 'LOADING_SEARCHES';
export const SEARCHES_LOADED = 'SEARCHES_LOADED';
export const SEARCHES_LOADING_ERROR = 'SEARCHES_LOADING_ERROR';
export const ADD_SEARCH = 'ADD_SEARCH';
export const ADDING_SEARCH = 'ADDING_SEARCH';
export const SEARCH_ADDED = 'SEARCH_ADDED';
export const SEARCH_ADDING_ERROR = 'SEARCH_ADDING_ERROR';
export const DELETING_SEARCH = 'DELETING_SEARCH';
export const SEARCH_DELETED = 'SEARCH_DELETED';
export const SEARCH_DELETION_ERROR = 'SEARCH_DELETION_ERROR';
export const START_SEARCH = 'START_SEARCH';
export const STARTING_SEARCH = 'STARTING_SEARCH';
export const SEARCH_STARTED = 'SEARCH_STARTED';
export const SEARCH_STARTING_ERROR = 'SEARCH_STARTING_ERROR';
export const SELECT_TABLE_ROWS = 'SELECT_TABLE_ROWS';
export const SET_TABLE_HEIGHT = 'SET_TABLE_HEIGHT';
export const SET_TABLE_SEARCH_VALUES = 'SET_TABLE_SEARCH_VALUES';
export const SET_TABLE_SEARCH_VISIBLE = 'SET_TABLE_SEARCH_VISIBLE';
export const SEARCH_IN_TABLE = 'SEARCH_IN_TABLE';
export const UPDATE_SEARCH_STATUS = 'UPDATE_SEARCH_STATUS';
export const EXPORT_SEARCHES_DATA = 'EXPORT_SEARCHES_DATA';
export const EXPORTING_SEARCHES_DATA = 'EXPORTING_SEARCHES_DATA';
export const SEARCHES_DATA_EXPORTED = 'SEARCHES_DATA_EXPORTED';
export const SEARCHED_DATA_EXPORT_NO_DATA = 'SEARCHED_DATA_EXPORT_NO_DATA';
export const SEARCHED_DATA_EXPORT_CANCELLED = 'SEARCHED_DATA_EXPORT_CANCELLED';
export const SEARCHES_DATA_EXPORTING_ERROR = 'SEARCHES_DATA_EXPORTING_ERROR';
export const SHOW_FAILED_MODAL = 'SHOW_FAILED_MODAL';
export const HIDE_FAILED_MODAL = 'HIDE_FAILED_MODAL';
export const LOADING_MODAL_DATA = 'LOADING_MODAL_DATA';
export const MODAL_DATA_LOADING_ERROR = 'MODAL_DATA_LOADING_ERROR';
export const RESTARTING_FAILED_ITEMS = 'RESTARTING_FAILED_ITEMS';
export const FAILED_ITEMS_RESTARTING_ERROR = 'FAILED_ITEMS_RESTARTING_ERROR';
export const RESET_STATUS = 'RESET_STATUS';

export function init(path: string) {
  return (dispatch: (action: actionType) => void) => {
    if (path === '/amazon-searches') {
      if (process.env.NODE_ENV !== 'production') {
        ipcRenderer.on('amazon-search-request', (event, request) => {
          console.log('Amazon request:');
          console.log(request);
        });

        ipcRenderer.on('amazon-search-response', (event, result, isRaw) => {
          console.log(`Amazon response${isRaw ? ' (RAW)' : ''}:`);
          console.log(result);
        });

        ipcRenderer.on('amazon-search-handling-error', (event, error) => {
          console.log('Amazon response ERROR:');
          console.log(error);
        });
      }

      ipcRenderer.on('searches-loaded', (event, searches) => {
        dispatch(searchesLoaded(searches));
        dispatch(resetStatus());
      });

      ipcRenderer.on('searches-loading-error', (event, err) => {
        dispatch(searchesLoadingError(err.message));
        dispatch(resetStatus());
      });

      ipcRenderer.on('search-deleted', (event, deletedId) => {
        dispatch(searchDeleted(deletedId));
        dispatch(resetStatus());
      });

      ipcRenderer.on('search-deletion-error', (event, err) => {
        dispatch(searchDeletionError(err.message));
      });

      ipcRenderer.on('search-started', (event, search) => {
        dispatch(searchStarted(search));
        dispatch(resetStatus());
        ipcRenderer.send('amazon-handle-searches');
      });

      ipcRenderer.on('search-starting-error', (event, err) => {
        dispatch(searchStartingError(err.name));
        dispatch(resetStatus());
      });

      ipcRenderer.on('searches-data-exported', () => {
        dispatch(searchesDataExported());
        dispatch(resetStatus());
      });

      ipcRenderer.on('searches-data-export-no-data', () => {
        dispatch(searchesDataExportNoData());
        dispatch(resetStatus());
      });

      ipcRenderer.on('searches-data-export-cancelled', () => {
        dispatch(searchesDataExportCancelled());
        dispatch(resetStatus());
      });

      ipcRenderer.on('searches-data-exporting-error', (event, error) => {
        dispatch(searchesDataExportingError(error.message));
        dispatch(resetStatus());
      });

      ipcRenderer.on('failed-items-loaded', (event, items) => {
        dispatch(showFailedModal(items));
        dispatch(resetStatus());
      });

      ipcRenderer.on('failed-items-loading-error', (event, error) => {
        dispatch(modalDataLoadingError(error.message));
        dispatch(resetStatus());
      });

      ipcRenderer.on('failed-items-restarted', () => {
        dispatch(hideFailedModal());
        ipcRenderer.send('amazon-handle-searches');
      });

      ipcRenderer.on('failed-items-restarting-error', (event, error) => {
        dispatch(failedItemsRestartingError(error.message));
      });

      ipcRenderer.on('amazon-search-handled', (event, data) => {
        dispatch(updateSearchesStatus(data));
      });

      ipcRenderer.send('amazon-handle-searches');
    } else if (path === '/amazon-new-search') {
      ipcRenderer.on('search-added', () => {
        dispatch(searchAdded());
        dispatch(resetStatus());

        dispatch(push('/amazon-searches'));
      });

      ipcRenderer.on('search-adding-error', (event, err) => {
        dispatch(searchAddingError(err.message));
        dispatch(resetStatus());
      });
    }

    dispatch({ type: INITIALIZE });
  };
}

export function destroy() {
  ipcRenderer.removeAllListeners('amazon-search-handling-error');
  ipcRenderer.removeAllListeners('amazon-search-request');
  ipcRenderer.removeAllListeners('amazon-search-response');

  ipcRenderer.removeAllListeners('searches-loaded');
  ipcRenderer.removeAllListeners('searches-loading-error');
  ipcRenderer.removeAllListeners('search-added');
  ipcRenderer.removeAllListeners('search-adding-error');
  ipcRenderer.removeAllListeners('search-deleted');
  ipcRenderer.removeAllListeners('search-deletion-error');
  ipcRenderer.removeAllListeners('search-started');
  ipcRenderer.removeAllListeners('search-starting-error');
  ipcRenderer.removeAllListeners('searches-data-exported');
  ipcRenderer.removeAllListeners('searches-data-export-no-data');
  ipcRenderer.removeAllListeners('searches-data-export-cancelled');
  ipcRenderer.removeAllListeners('searches-data-exporting-error');
  ipcRenderer.removeAllListeners('failed-items-loaded');
  ipcRenderer.removeAllListeners('failed-items-loading-error');
  ipcRenderer.removeAllListeners('failed-items-restarted');
  ipcRenderer.removeAllListeners('failed-items-restarting-error');

  ipcRenderer.removeAllListeners('amazon-search-handled');


  return { type: DESTROY };
}

export function updateSearchesStatus(data: {}) {
  return {
    type: UPDATE_SEARCH_STATUS,
    searchData: data
  };
}

export function runJobHandler(debug: boolean = false) {
  ipcRenderer.send('amazon-handle-searches', debug);

  return { type: 'START_JOB_HANDLER' };
}

export function stopJobHandler() {
  ipcRenderer.send('amazon-stop-handling-searches');

  return { type: 'STOP_JOB_HANDLER' };
}

export function exportSearchesData() {
  return (dispatch: (action: actionType) => void, getState: () => { amazon: amazonStateType }) => {
    const { selectedRowsKeys } = getState().amazon;

    dispatch(exportingSearchesData());
    console.log(selectedRowsKeys);

    ipcRenderer.send(
      'export-searches-data',
      selectedRowsKeys.length > 0
        ? selectedRowsKeys
        : 'all'
    );
  };
}

export function exportingSearchesData() {
  return {
    type: EXPORTING_SEARCHES_DATA,
    message: 'Exporting data...'
  };
}

export function searchesDataExported() {
  return {
    type: SEARCHES_DATA_EXPORTED,
    message: 'Data exported!',
  };
}

export function searchesDataExportNoData() {
  return {
    type: SEARCHED_DATA_EXPORT_NO_DATA,
    message: 'No data to export!'
  };
}

export function searchesDataExportCancelled() {
  return {
    type: SEARCHED_DATA_EXPORT_CANCELLED,
    message: 'Export cancelled!'
  };
}

export function searchesDataExportingError(error: string) {
  return {
    type: SEARCHES_DATA_EXPORTING_ERROR,
    message: 'Data export error!',
    description: error
  };
}

export function loadSearches() {
  return (dispatch: (action: actionType) => void) => {
    dispatch(loadingSearches());

    ipcRenderer.send('load-searches');
  };
}

export function loadingSearches() {
  return {
    type: LOADING_SEARCHES,
    message: 'Loading data...'
  };
}

export function searchesLoaded(searches: []) {
  console.log(searches);
  return {
    type: SEARCHES_LOADED,
    searches,
    message: 'Data loaded!'
  };
}

export function searchesLoadingError(error: string) {
  return {
    type: SEARCHES_LOADING_ERROR,
    message: 'Data loading error!',
    description: error
  };
}

export function selectTableRows(selectedRowsKeys: []) {
  return {
    type: SELECT_TABLE_ROWS,
    selectedRowsKeys
  };
}

export function setTableHeight(height: number) {
  return {
    type: SET_TABLE_HEIGHT,
    tableHeight: height
  };
}

export function setTableSearchValues(values: {}) {
  return {
    type: SET_TABLE_SEARCH_VALUES,
    tableSearchValues: values
  };
}

export function setTableSearchVisible(visible: {}) {
  return {
    type: SET_TABLE_SEARCH_VISIBLE,
    tableSearchVisible: visible
  };
}
export function searchInTable() {
  return {
    type: SEARCH_IN_TABLE
  };
}

export function addSearch() {
  return (dispatch: (action: actionType) => void, getState: () => searchFormStateType) => {
    const {
      name, channels, isAsins, isbnsOrAsins
    } = getState().form.search.values;

    dispatch(addingSearch());

    ipcRenderer.send('add-search', {
      name, channels, isAsins: isAsins !== undefined ? isAsins : false, isbnsOrAsins
    });
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

export function searchAddingError(error: string) {
  return {
    type: SEARCH_ADDING_ERROR,
    message: 'Search adding error!',
    description: error
  };
}

export function deleteSearch(id: string) {
  return (dispatch: (action: actionType) => void) => {
    dispatch(deletingSearch());

    ipcRenderer.send('delete-search', id);
  };
}

export function deletingSearch() {
  return {
    type: DELETING_SEARCH,
    message: 'Deleting search...'
  };
}

export function searchDeleted(id: string) {
  return {
    type: SEARCH_DELETED,
    message: 'Search deleted!',
    deletedId: id
  };
}

export function searchDeletionError(error: string) {
  return {
    type: SEARCH_DELETION_ERROR,
    message: 'Search deletion error!',
    description: error
  };
}

export function startSearch(id: string) {
  return (dispatch: (action: actionType) => void) => {
    dispatch(startingSearch());

    ipcRenderer.send('start-search', id);
  };
}

export function startingSearch() {
  return {
    type: STARTING_SEARCH,
    message: 'Starting search...'
  };
}

export function searchStarted(search: {}) {
  return {
    type: SEARCH_STARTED,
    message: 'Search started!',
    updatedSearch: search
  };
}

export function searchStartingError(error: string) {
  return {
    type: SEARCH_STARTING_ERROR,
    message: 'Search starting error!',
    description: error
  };
}

export function loadFailedModal(searchId: string) {
  return (dispatch: (action: actionType) => void) => {
    dispatch(loadingModalData());

    ipcRenderer.send('load-failed-items', searchId);
  };
}

export function loadingModalData() {
  return {
    type: LOADING_MODAL_DATA,
    message: 'Loading data...'
  };
}

export function modalDataLoadingError(error: string) {
  return {
    type: MODAL_DATA_LOADING_ERROR,
    message: 'Data loading error!',
    description: error
  };
}

export function showFailedModal(items: []) {
  return {
    type: SHOW_FAILED_MODAL,
    message: 'Data loaded!',
    failedModalData: items
  };
}

export function hideFailedModal() {
  return {
    type: HIDE_FAILED_MODAL
  };
}

export function restartFailedItems(searchId: string) {
  return (dispatch: (action: actionType) => void) => {
    dispatch(restartingFailedItems());

    ipcRenderer.send('restart-failed-items', searchId);
  };
}

export function restartingFailedItems() {
  return {
    type: RESTARTING_FAILED_ITEMS,
    message: 'Restarting failed items...'
  };
}

export function failedItemsRestartingError(error: string) {
  return {
    type: FAILED_ITEMS_RESTARTING_ERROR,
    message: 'Restarting error!',
    description: error
  };
}

export function resetStatus() {
  return {
    type: RESET_STATUS
  };
}
