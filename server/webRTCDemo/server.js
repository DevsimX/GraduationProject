const fs = require('fs');
const socket = require('socket.io');
const https = require('https');

// const EventsHandlers = require('./public/dist/js/events_handlers');
// const UsersHandlers = require('./public/dist/js/workspace_handlers');

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
    origin: "*",//depends on your own origin,example, when i do it on local,its value should be http://localhost:2345
    methods: ["GET", "POST"]
  }
});

let roomList = [];

function WebRtcClient(socket,username,name){
  this.socket = socket;
  this.username = username;
  this.name = name;
  this.id = socket.id;
  this.room_id = "";
}

function Room(room_id){
  this.id = room_id;
  this.client_list = [];
}

function getRoomByRoomId(room_id) {
  for (let i of roomList){
    if(i.id === room_id){
      return i;
    }
  }
  return null;
}

function deleteRoomFromList(roomId) {
  for(let i = 0 ; i < roomList.length; i++){
    if(roomList[i].id === roomId){
      roomList.splice(i,1);
      console.log('因为房间人数不足，房间'+roomId+'被删除')
    }
  }
}

function deleteClientFromRoom(socketId,username,room) {
  for(let i = 0 ; i < room.client_list.length ; i++){
    if(room.client_list[i].id === socketId){
      room.client_list.splice(i,1);
      console.log(username+'离开了房间'+room.id)
      return;
    }
  }
  if(room.client_list.length === 0)
    deleteRoomFromList(room.id);
}

function getWebRtcClientBySocketId(socketId,room_id) {
  let client_list = getRoomByRoomId(room_id).client_list;
  for(let i of client_list){
    if(socketId === i.id)
      return i;
  }
  return null;
}


io.on('connection', (user) => {
  onConnect_(user)
});

/**
 * Handler for listening to and emitting messages between the server and
 * connected users.
 * @param {!Object} user The user connecting.
 * @private
 */
async function onConnect_(user) {
  user.on('joinRoom', async (room_id,name,username, callback) => {
    await user.join(room_id);
    const ids = await io.in(room_id).allSockets();
    if(ids.size === 1){
      //create room
      let room = new Room(room_id);
      room.client_list.push(new WebRtcClient(user,username,name));
      roomList.push(room)
    }else {
      //TODO error handle
      //join room
      let room = getRoomByRoomId(room_id);
      room.client_list.push(new WebRtcClient(user,username,name));
    }
    //TODO peer and new peer
    newPeerEvent(room_id,user.id,name,username);

    callback(getAllNeighboursInfo(room_id,user.id));
  });

  // user.on('connectUser', async (workspaceId, callback) => {
  //   await UsersHandlers.connectUserHandler(user, workspaceId, callback);
  // });

  user.on('disconnect', async () => {
    userDisconnect(user.id,user);
    // await UsersHandlers.disconnectUserHandler(user.workspaceId, () => {
    //   io.emit('disconnectUser', user.workspaceId);
    // });
  });

  user.on('_ice_candidate',async (data) => {
    let socket = getWebRtcClientBySocketId(data.socketId,getRoomId(user)).socket;

    if(socket){
      socket.emit('ice_candidate',JSON.stringify({
        "data": {
          "id": data.id,
          "label": data.label,
          "sdpMLineIndex" :data.label,
          "candidate": data.candidate,
          "socketId": user.id
        }
      }))
    }
  })

  user.on('_offer',async (data) => {
    let socket = getWebRtcClientBySocketId(data.socketId,getRoomId(user)).socket;

    if(socket){
      socket.emit('offer',JSON.stringify({
        "data": {
          "sdp": data.sdp,
          "socketId": user.id,
        }
      }))
    }
  })

  user.on('_answer',async (data) => {
    let socket = getWebRtcClientBySocketId(data.socketId,getRoomId(user)).socket;

    if(socket){
      socket.emit('ice_candidate',JSON.stringify({
        "data": {
          "sdp": data.sdp,
          "socketId": user.id,
        }
      }))
    }
  })

  // user.on('addEvents', async (entry, callback) => {
  //   await EventsHandlers.addEventsHandler(entry, (serverId) => {
  //     entry.serverId = serverId;
  //     io.emit('broadcastEvents', [entry]);
  //     callback(serverId);
  //   });
  // });

  // user.on('getEvents', async (serverId, callback) => {
  //   await EventsHandlers.getEventsHandler(serverId, callback);
  // });
  //
  // user.on('sendPositionUpdate', async (positionUpdate, callback) => {
  //   await UsersHandlers.updatePositionHandler(user, positionUpdate, callback);
  // });
  //
  // user.on('getPositionUpdates', async (workspaceId, callback) => {
  //   await UsersHandlers.getPositionUpdatesHandler(workspaceId, callback);
  // });
  //
  // user.on('getSnapshot', async (callback) => {
  //   await EventsHandlers.getSnapshotHandler(callback);
  // });
}

function newPeerEvent(room_Id,socketId,name,username) {
  let room = getRoomByRoomId(room_Id);
  let client_list = room.client_list;

  for(let client of client_list){
    if(client.id === socketId)
      continue;
    let socket = client.socket;
    let data = {
      socketId: socketId,
      name: name,
      username: username,
    }
    socket.emit("new_peer",data);
  }
}

function getAllNeighboursInfo(room_id,socket_id) {
  let list = {}
  for(let i of getRoomByRoomId(room_id).client_list){
    if(i.id === socket_id){
      continue;
    }
    list[i.id] = {
      name: i.name,
      username: i.username
    }
  }
  return list;
}

function userDisconnect(socketId,socket) {
  let room_id = getRoomId(socket)
  let room = getRoomByRoomId(room_id);
  let client = getWebRtcClientBySocketId(socketId,room_id)
  deleteClientFromRoom(socketId,client.username,room)

  io
}

function getRoomId(socket) {
  let rooms = socket.rooms;

  if(rooms.size === 2){
    const iterator = rooms.values();
    iterator.next();
    return iterator.next().value
  }
  return null;
}
