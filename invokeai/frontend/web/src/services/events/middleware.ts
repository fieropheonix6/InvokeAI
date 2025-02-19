import { Middleware, MiddlewareAPI } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';

import {
  ClientToServerEvents,
  ServerToClientEvents,
} from 'services/events/types';
import { socketSubscribed, socketUnsubscribed } from './actions';
import { AppThunkDispatch, RootState } from 'app/store/store';
import { getTimestamp } from 'common/util/getTimestamp';
import { sessionCreated } from 'services/api/thunks/session';
// import { OpenAPI } from 'services/api/types';
import { setEventListeners } from 'services/events/util/setEventListeners';
import { log } from 'app/logging/useLogger';
import { $authToken, $baseUrl } from 'services/api/client';

const socketioLog = log.child({ namespace: 'socketio' });

export const socketMiddleware = () => {
  let areListenersSet = false;

  let socketUrl = `ws://${window.location.host}`;

  const socketOptions: Parameters<typeof io>[0] = {
    timeout: 60000,
    path: '/ws/socket.io',
    autoConnect: false, // achtung! removing this breaks the dynamic middleware
  };

  // if building in package mode, replace socket url with open api base url minus the http protocol
  if (['nodes', 'package'].includes(import.meta.env.MODE)) {
    const baseUrl = $baseUrl.get();
    if (baseUrl) {
      //eslint-disable-next-line
      socketUrl = baseUrl.replace(/^https?\:\/\//i, '');
    }

    const authToken = $authToken.get();
    if (authToken) {
      // TODO: handle providing jwt to socket.io
      socketOptions.auth = { token: authToken };
    }

    socketOptions.transports = ['websocket', 'polling'];
  }

  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    socketUrl,
    socketOptions
  );

  const middleware: Middleware =
    (storeApi: MiddlewareAPI<AppThunkDispatch, RootState>) =>
    (next) =>
    (action) => {
      const { dispatch, getState } = storeApi;

      // Set listeners for `connect` and `disconnect` events once
      // Must happen in middleware to get access to `dispatch`
      if (!areListenersSet) {
        setEventListeners({ storeApi, socket, log: socketioLog });

        areListenersSet = true;

        socket.connect();
      }

      if (sessionCreated.fulfilled.match(action)) {
        const sessionId = action.payload.id;
        const oldSessionId = getState().system.sessionId;

        if (oldSessionId) {
          socket.emit('unsubscribe', {
            session: oldSessionId,
          });

          dispatch(
            socketUnsubscribed({
              sessionId: oldSessionId,
              timestamp: getTimestamp(),
            })
          );
        }

        socket.emit('subscribe', { session: sessionId });

        dispatch(
          socketSubscribed({
            sessionId: sessionId,
            timestamp: getTimestamp(),
            boardId: getState().boards.selectedBoardId,
          })
        );
      }

      next(action);
    };

  return middleware;
};
