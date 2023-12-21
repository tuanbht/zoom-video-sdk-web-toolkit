import axiosMiddleware from 'redux-axios-middleware';
import get from 'lodash/get';
import merge from 'lodash/merge';
import { createBrowserHistory } from 'history';
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import AxiosClient from './api-client';

import rootReducer from 'reducers';
import {
  CREATE_GIFT_CARD_APPEARANCE,
  CREATE_USER_PICTURE,
  UPDATE_GIFT_CARD_APPEARANCE,
  UPDATE_USER_PICTURE,
} from 'constants/redux-actions';
import { API_GET_CURRENT_SIGN_IN_AT, API_UPDATE_TRACKING_AUTHENTICATION } from 'constants/api-paths';
import { trackUserAuthentication } from 'utils/authentication';
import loadingApiActions from 'actions/loading-api-actions';
import authActions from 'actions/auth-actions';

const history = createBrowserHistory();

const persistConfig = {
  key: process.env.REACT_APP_WEBAPP_NAME,
  storage,
  whitelist: ['auth', 'lang', 'adminAuth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const axiosMiddlewareConfig = {
  interceptors: {
    request: [
      ({ getState, dispatch }, request) => {
        const token = get(getState(), 'auth.token');
        const adminToken = get(getState(), 'adminAuth.token');

        if (adminToken) {
          merge(request, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
        } else if (token) {
          if (request.url !== API_UPDATE_TRACKING_AUTHENTICATION && request.url !== API_GET_CURRENT_SIGN_IN_AT) {
            trackUserAuthentication();
          }

          merge(request, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }

        const selectedLanguage = get(getState(), 'lang');

        selectedLanguage &&
          merge(request, {
            headers: {
              Lang: selectedLanguage,
            },
          });

        dispatch(loadingApiActions.addLoadingApi());
        return request;
      },
    ],
    response: [
      {
        success: ({ dispatch }, response) => {
          dispatch(loadingApiActions.clearLoadedApi());
          return Promise.resolve(response);
        },
        error: ({ dispatch, getState }, response) => {
          const token = get(getState(), 'auth.token');
          // Sign out if token is expired
          if (get(response, 'response.status') === 401 && token) {
            dispatch(authActions.clearToken());
          }

          dispatch(loadingApiActions.clearLoadedApi());
          return Promise.reject(response);
        },
      },
    ],
  },
};

const middleware = (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [
        FLUSH,
        REHYDRATE,
        PAUSE,
        PERSIST,
        PURGE,
        REGISTER,
        CREATE_USER_PICTURE,
        UPDATE_USER_PICTURE,
        CREATE_GIFT_CARD_APPEARANCE,
        UPDATE_GIFT_CARD_APPEARANCE,
      ],
    },
  }).concat(axiosMiddleware(AxiosClient, axiosMiddlewareConfig));

const store = configureStore({
  reducer: persistedReducer,
  middleware,
  devTools: process.env.NODE_ENV !== 'production',
});

const persistor = persistStore(store);

export { history, store, persistor, middleware };
