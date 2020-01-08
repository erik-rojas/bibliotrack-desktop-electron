// @flow
import { ipcRenderer } from 'electron';

import checkData from '../utils/checkData';

import type { settingsFormStateType } from '../reducers/settings';

type actionType = {
  +type: string
};

export const INITIALIZE = 'INITIALIZE';
export const DESTROY = 'DESTROY';
export const LOAD_SETTINGS = 'LOAD_SETTINGS';
export const LOADING_SETTINGS = 'LOAD_SETTINGS';
export const SETTINGS_LOADED = 'SETTINGS_LOADED';
export const SETTINGS_LOADING_ERROR = 'SETTINGS_LOADING_ERROR';
export const SAVE_SETTINGS = 'SAVE_SETTINGS';
export const SAVING_SETTINGS = 'SAVING_SETTINGS';
export const SETTINGS_SAVED = 'SETTINGS_SAVED';
export const SETTINGS_SAVING_ERROR = 'SETTINGS_SAVING_ERROR';
export const TEST_DATABASE_CONNECTION = 'TEST_DATABASE_CONNECTION';
export const CONNECTING_TO_DATABASE = 'CONNECTING_TO_DATABASE';
export const CONNECTED_TO_DATABASE = 'CONNECTED_TO_DATABASE';
export const DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR';
export const INITIALIZE_DATABASE = 'INITIALIZE_DATABASE';
export const INITIALIZING_DATABASE = 'INITIALIZING_DATABASE';
export const DATABASE_INITIALIZED = 'DATABASE_INITIALIZED';
export const DATABASE_INITIALIZATION_ERROR = 'DATABASE_INITIALIZATION_ERROR';
export const RUNNING_MIGRATIONS = 'RUNNING_MIGRATIONS';
export const MIGRATIONS_RUNNING_SUCCESS = 'MIGRATIONS_RUNNING_SUCCESS';
export const MIGRATIONS_NOT_FOUND = 'MIGRATIONS_NOT_FOUND';
export const MIGRATIONS_RUNNING_ERROR = 'MIGRATIONS_RUNNING_ERROR';
export const RESET_STATUS = 'RESET_STATUS';
export const FIXING_PROBLEM = 'FIXING_PROBLEM';
export const PROBLEM_FIXED = 'PROBLEM_FIXED';

export function init() {
  return (dispatch: (action: actionType) => void) => {
    ipcRenderer.on('ebay-approved-items-fixed', () => {
      dispatch(problemFixed());
      dispatch(resetStatus());
    });

    ipcRenderer.on('settings-loaded', (event, data) => {
      dispatch(settingsLoaded(data));
      dispatch(resetStatus());
    });

    ipcRenderer.on('settings-loading-error', (event, error) => {
      dispatch(settingsLoadingError(error.message));
      dispatch(resetStatus());
    });

    ipcRenderer.on('settings-saved', () => {
      dispatch(settingsSaved());
      dispatch(resetStatus());
    });

    ipcRenderer.on('settings-saving-error', (event, error) => {
      dispatch(settingsSavingError(error.message));
      dispatch(resetStatus());
    });

    dispatch({ type: INITIALIZE });
  };
}

export function destroy() {
  ipcRenderer.removeAllListeners('settings-loaded');
  ipcRenderer.removeAllListeners('settings-loading-error');
  ipcRenderer.removeAllListeners('settings-saved');
  ipcRenderer.removeAllListeners('ebay-approved-items-fixed');
  ipcRenderer.removeAllListeners('settings-saving-error');

  return { type: DESTROY };
}

export function fixEbayApprovedItems() {
  return (dispatch: (action: actionType) => void) => {
    dispatch(fixingProblem());

    ipcRenderer.send('fix-ebay-approved-items');
  };
}

export function problemFixed() {
  return {
    type: PROBLEM_FIXED,
    message: 'Problem fixed!'
  };
}

export function fixingProblem() {
  return {
    type: FIXING_PROBLEM,
    message: 'Fixing problem...'
  };
}

export function loadSettings() {
  return (dispatch: (action: actionType) => void) => {
    dispatch(loadingSettings());

    ipcRenderer.send('load-settings');
  };
}

export function loadingSettings() {
  return {
    type: LOADING_SETTINGS,
    message: 'Loading settings...'
  };
}

export function settingsLoaded(settings: {}) {
  return {
    type: SETTINGS_LOADED,
    message: 'Settings loaded!',
    values: settings
  };
}

export function settingsLoadingError(error: string) {
  return {
    type: SETTINGS_LOADING_ERROR,
    message: 'Settings loading error!',
    description: error
  };
}

export function saveSettings() {
  return (dispatch: (action: actionType) => void, getState: () => settingsFormStateType) => {
    const {
      host, databaseName, login, password,
      associateTag, accessKey, secretKey, appId, useLog, ebayFakePeriod
    } = getState().form.settings.values;

    dispatch(savingSettings());

    const settings = {
      host: checkData(host),
      databaseName: checkData(databaseName),
      login: checkData(login),
      password: checkData(password),
      associateTag: checkData(associateTag),
      accessKey: checkData(accessKey),
      secretKey: checkData(secretKey),
      appId: checkData(appId),
      useLog: checkData(useLog),
      ebayFakePeriod: checkData(ebayFakePeriod)
    };

    ipcRenderer.send('save-settings', settings);
  };
}

export function savingSettings() {
  return {
    type: SAVING_SETTINGS,
    message: 'Saving settings...'
  };
}

export function settingsSaved() {
  return {
    type: SETTINGS_SAVED,
    message: 'Settings saved!'
  };
}

export function settingsSavingError(error: string) {
  return {
    type: SETTINGS_SAVING_ERROR,
    message: 'Settings saving error!',
    description: error
  };
}

export function resetStatus() {
  return {
    type: RESET_STATUS
  };
}
