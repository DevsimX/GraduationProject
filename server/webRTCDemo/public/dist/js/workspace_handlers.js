const database = require('./database');

/**
 * Handler for an updatePosition message. Update a user's position in the
 * users table and broadcast the PositionUpdate to all users except the
 * sender.
 * @param {!Object} user The user who sent the message.
 * @param {!PositionUpdate} positionUpdate The PositionUpdate with the new
 * position for a given user.
 * @param {!String} roomId, room's id
 * @param {!Function} callback The callback passed in by WorkspaceClient to
 * receive acknowledgement of the success of the write.
 * @private
 */
async function updatePositionHandler(user, positionUpdate,roomId, callback) {
  await database.updatePosition(positionUpdate,roomId);
  callback();
  user.to(roomId).emit("broadcastPosition",[positionUpdate]);
}

/**
 * Handler for a getPositionUpdates message. Query the database for a
 * PositionUpdate for the specified user or all if no user specified.
 * @param {string=} workspaceId The workspaceId for the specified user.
 * @param {!Function} callback The callback passed in by WorkspaceClient to
 * receive the PositionUpdates upon success of the query.
 * @private
 */
async function getPositionUpdatesHandler(workspaceId, callback) {
  const positionUpdates = await database.getPositionUpdates(workspaceId);
  callback(positionUpdates);
}

/**
 * Handler for a connectUser message. Attach the workspaceId to the user and
 * add the user to the users table.
 * @param {!Object} user The user connecting.
 * @param {string} workspaceId The workspaceId for the connecting user.
 * @param {!Function} callback The callback passed in by WorkspaceClient to
 * @param {string} roomId room's id
 * receive acknowledgement of the success of the connection.
 * @public
 */
async function connectUserHandler(user, workspaceId,roomId, callback) {
  user.workspaceId = workspaceId;
  const positionUpdate = {
    workspaceId: workspaceId,
    position: {
      type: null,
      blockId: null,
      fieldName: null
    },
  };
  await updatePositionHandler(user, positionUpdate,roomId, callback);
}

/**
 * Handler for a disconnect. Delete the user from the users table.
 * @param {string} workspaceId The workspaceId for the disconnecting user.
 * @param {!Function} callback The callback that broadcasts the disconnect to
 * the connected users.
 * @public
 */
async function disconnectUserHandler(workspaceId, callback) {
  await database.deleteUser(workspaceId);
  callback();
}

module.exports.updatePositionHandler = updatePositionHandler;
module.exports.getPositionUpdatesHandler = getPositionUpdatesHandler;
module.exports.disconnectUserHandler = disconnectUserHandler;
module.exports.connectUserHandler = connectUserHandler;
