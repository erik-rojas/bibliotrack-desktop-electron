// @flow
import {
  LOADING_SETTINGS, SETTINGS_LOADED, SETTINGS_LOADING_ERROR, PROBLEM_FIXED,
  SAVING_SETTINGS, SETTINGS_SAVED, SETTINGS_SAVING_ERROR, FIXING_PROBLEM,
  CONNECTING_TO_DATABASE, CONNECTED_TO_DATABASE, DATABASE_CONNECTION_ERROR,
  INITIALIZING_DATABASE, DATABASE_INITIALIZED, DATABASE_INITIALIZATION_ERROR,
  RUNNING_MIGRATIONS, MIGRATIONS_RUNNING_SUCCESS, MIGRATIONS_NOT_FOUND, MIGRATIONS_RUNNING_ERROR,
  RESET_STATUS
} from '../actions/settings';

export type settingsFormStateType = {
  +form: {
    +settings: {
      +values: {
        +host: string,
        +databaseName: string,
        +login: string,
        +password: string,
        +associateTag: string,
        +accessKey: string,
        +secretKey: string,
        +appId: string,
        +useLog: boolean,
        +ebayFakePeriod: number
      }
    }
  }
};

export type settingsStateType = {
  +status: string,
  +message: string
};

const initialState = {
  status: '',
  message: ''
};

type actionType = {
  +type: string,
  +message: string | void,
  +description: string | void,
  +values: {} | void
};

export default function settings(state: settingsStateType = initialState, action: actionType) {
  switch (action.type) {
    case LOADING_SETTINGS:
    case SAVING_SETTINGS:
    case CONNECTING_TO_DATABASE:
    case INITIALIZING_DATABASE:
    case RUNNING_MIGRATIONS:
    case FIXING_PROBLEM:
      return {
        status: 'loading',
        message: action.message
      };
    case SETTINGS_LOADED:
      return {
        status: 'success',
        message: action.message,
        values: action.values
      };
    case SETTINGS_SAVED:
    case CONNECTED_TO_DATABASE:
    case DATABASE_INITIALIZED:
    case MIGRATIONS_RUNNING_SUCCESS:
    case MIGRATIONS_NOT_FOUND:
    case PROBLEM_FIXED:
      return {
        status: 'success',
        message: action.message
      };
    case SETTINGS_LOADING_ERROR:
    case SETTINGS_SAVING_ERROR:
    case DATABASE_CONNECTION_ERROR:
    case DATABASE_INITIALIZATION_ERROR:
    case MIGRATIONS_RUNNING_ERROR:
      return {
        status: 'error',
        message: action.message,
        description: action.description
      };
    case RESET_STATUS:
      return {
        status: '',
        message: ''
      };
    default:
      return initialState;
  }
}
