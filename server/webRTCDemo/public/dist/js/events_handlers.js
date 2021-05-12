const database = require('./database');

/**
 * Handler for a getEvents message. Query the database for events since the
 * last serverId.
 * @param {number} serverId serverId for the lower bound of the query.
 * @param {!String} roomId
 * @param {!Function} callback The callback passed in by WorkspaceClient to
 * receive acknowledgement of the success of the write.
 * @private
 */
async function getEventsHandler(serverId,roomId, callback) {
  const entries = await database.query(serverId,roomId);
  callback(entries);
}

/**
 * Handler for an addEvents message. Add an entry to the database.
 * @param {!LocalEntry} entry The entry to be added to the database.
 * @param {!String} roomId
 * @param {!Function} callback The callback passed in by the server to broadcast
 * the event.
 * @private
 */
async function addEventsHandler(entry,roomId, callback) {
  const serverId = await database.addToServer(entry,roomId);
  callback(serverId);
}

/**
 * Handler for a getSnapshot message. Get the latest snapshot of the workspace.
 * @param {!Function} callback The callback passed in by WorkspaceClient to
 * @param {!String} roomId
 * recieve the snapshot.
 * @public
 */
async function getSnapshotHandler(roomId,callback) {
  const snapshot = await database.getSnapshot(roomId);
  callback(snapshot);
}

async function deleteFromSnapShotMap(roomId) {
  delete database.snapshotMap[roomId]
  await database.deleteRoom(roomId)
}

module.exports.getEventsHandler = getEventsHandler;
module.exports.addEventsHandler = addEventsHandler;
module.exports.getSnapshotHandler = getSnapshotHandler;
module.exports.deleteFromSnapShotMap = deleteFromSnapShotMap;
