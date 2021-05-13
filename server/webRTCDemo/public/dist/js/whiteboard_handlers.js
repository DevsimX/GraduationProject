const database = require('./database');

async function getWhiteBoardEvent(roomId,serverId,callback) {
  const events = await database.getWhiteBoardEvent(roomId,serverId);
  callback(JSON.stringify(events));
}

async function updateWhiteBoardEvent(uuid,roomId,socketId,event) {
  await database.updateWhiteBoardEvent(uuid,roomId,socketId,event);
}

async function clearEvent(roomId) {
  await database.clearWhiteBoardEvent(roomId);
}

async function undoEvent(uuid,roomId,callback) {
  const serverId = await database.undoWhiteboardEvent(uuid,roomId);
  let res = serverId[0]['MAX(serverId)'];
  res = res? res : 0;
  console.log(res)
  return res;
}

async function deleteRoom(roomId) {
  await database.clearWhiteBoardEvent(roomId);
}

module.exports.getWhiteBoardEvent = getWhiteBoardEvent;
module.exports.updateWhiteBoardEvent = updateWhiteBoardEvent;
module.exports.clearEvent = clearEvent;
module.exports.undoEvent = undoEvent;
module.exports.deleteRoom = deleteRoom;
