/**
 * @license
 *
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Node.js HTTP server for realtime collaboration.
 * @author navil@google.com (Navil Perez)
 */
const fs = require('fs');
const socket = require('socket.io');
const https = require('https');

// const EventsHandlers = require('./websocket/events_handlers');
// const UsersHandlers = require('./websocket/users_handlers');

const WS_PORT = 4433;

const options = {
  key: fs.readFileSync('./cert/2_xytcloud.ltd.key'),
  cert: fs.readFileSync('./cert/1_xytcloud.ltd_bundle.crt')
}

const server = https.createServer(options);

server.listen(WS_PORT, function () {
  console.log('server start at port ' + WS_PORT);
});

io = socket(server, {
  path: '/blockly',
  cors: {
    origin: "http://localhost:2345",//depends on your own origin,example, when i do it on local,its value should be http://localhost:2345
    methods: ["GET", "POST"]
  }
});

io.on('connection', (user) => {
  onConnect(user)
  // onConnect_(user);
});


async function onConnect(user) {
  user.on('joinRoom', async (room,name, callback) => {
    await user.join(room);
    //TODO store the name and socket id in database

    //info client
    callback();
  });
}

/**
 * Handler for listening to and emitting messages between the server and
 * connected users.
 * @param {!Object} user The user connecting.
 * @private
 */
async function onConnect_(user) {


  user.on('connectUser', async (workspaceId, callback) => {
    await UsersHandlers.connectUserHandler(user, workspaceId, callback);
  });

  user.on('disconnect', async () => {
    await UsersHandlers.disconnectUserHandler(user.workspaceId, () => {
      io.emit('disconnectUser', user.workspaceId);
    });
  });

  user.on('addEvents', async (entry, callback) => {
    await EventsHandlers.addEventsHandler(entry, (serverId) => {
      entry.serverId = serverId;
      io.emit('broadcastEvents', [entry]);
      callback(serverId);
    });
  });

  user.on('getEvents', async (serverId, callback) => {
    await EventsHandlers.getEventsHandler(serverId, callback);
  });

  user.on('sendPositionUpdate', async (positionUpdate, callback) => {
    await UsersHandlers.updatePositionHandler(user, positionUpdate, callback);
  });

  user.on('getPositionUpdates', async (workspaceId, callback) => {
    await UsersHandlers.getPositionUpdatesHandler(workspaceId, callback);
  });

  user.on('getSnapshot', async (callback) => {
    await EventsHandlers.getSnapshotHandler(callback);
  });
};
