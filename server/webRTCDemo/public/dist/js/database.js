/**
 * @license
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
 * @fileoverview Wrapper class for the SQLite database.
 * @author navil@google.com (Navil Perez)
 */
var Interpreter = function() {
  this.stepIndex = 0;
  this.steps = [];
  this.objects = {variables:{}, moveObject:{}}
};

Interpreter.prototype.run = function() {
  this.steps[this.stepIndex].run();
};

Interpreter.prototype.next = function() {
  return this.stepIndex <= this.steps.length - 1 && this.stepIndex >= 0;
};

Interpreter.prototype.addStep = function(step) {
  this.steps.push(step);
};

Interpreter.prototype.stepLength = function(){
  return this.steps.length;
};

Interpreter.prototype.newSingleStep = function(name, run) {
  let step = {};
  step.name = name;
  let that = this;
  step.run = function() {
    let objects = that.objects;
    if(typeof run === 'string') {
      eval(run);
    } else if(typeof run === 'function') {
      run()
    }
    that.stepIndex ++;
  };
  return step;
};

Interpreter.prototype.forStepFirst = function(name,rdi) {
  let step = {};
  step.name = name;
  step.rdi = rdi;
  step.index = 0;
  let that = this;
  step.run = function() {
    // 不满足循环条件后跳跃到循环后
    if(step.index >= step.rdi){
      that.stepIndex = step.go;
    } else {
      that.stepIndex ++;
    }
    step.index ++;
  };
  return step;
};

Interpreter.prototype.forStepSecond = function(name,rdi) {
  let step = {};
  step.name = name;
  step.rdi = rdi;
  let that = this;
  step.run = function() {
    that.stepIndex = rdi;
  };
  return step;
};

Interpreter.prototype.forWhileFirst = function(name,rdi) {
  let step = {};
  step.name = name;
  step.rdi = rdi;
  let that = this;
  step.run = function() {
    let objects = that.objects;
    // 不满足循环条件后跳跃到循环后
    if(eval(rdi)){
      that.stepIndex = step.go;
    } else {
      that.stepIndex ++;
    }
  };
  return step;
};

Interpreter.prototype.forWhileSecond = function(name,rdi) {
  let step = {};
  step.name = name;
  step.rdi = rdi;
  let that = this;
  step.run = function() {
    that.stepIndex = rdi;
  };
  return step;
};

Interpreter.prototype.ifStep = function(name,rdi) {
  let step = {};
  step.name = name;
  step.rdi = rdi;
  let that = this;
  step.run = function() {
    let objects = that.objects;
    // 不满足循环条件后跳跃到循环后
    if(!eval(rdi)){
      that.stepIndex = step.go;
    } else {
      that.stepIndex ++;
    }
  };
  return step;
};

Interpreter.prototype.setGo = function(index, go) {
  if(index < this.steps.length){
    this.steps[index].go = go;
  }
};

Interpreter.prototype.setObjects = function(objects) {
  this.objects = objects;
  if(!this.objects.variables){
    this.objects.variables = {};
  }
  if(!this.objects.moveObject){
    this.objects.moveObject = {};
  }
};
Interpreter.prototype.nop = function() {
  let step = {};
  step.name = 'nop';
  let that = this;
  step.run = function() {
    // 不满足循环条件后跳跃到循环后
    if(step.go){
      that.stepIndex = step.go;
    } else {
      that.stepIndex ++;
    }
  };
  return step;
};

const db = require('./db');
const Blockly = require('blockly');

/**
 * Class for managing interactions between the server and the database.
 */
class Database {
  constructor() {
    this.db = db;
    this.snapshotMap = {}//key is room, value is snapshot//TODO
    this.config()
  }

  /**
   * Query the database for entries since the given server id.
   * @param {number} serverId serverId for the lower bound of the query.
   * @param {!String} roomId
   * @return {!Promise} Promise object represents the entries since the last
   * given serverId.
   * @public
   */
  query(serverId, roomId) {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * from events
                   WHERE
                   serverId > ?
                   AND roomId = ?;`,[serverId,roomId],
        (err, entries) => {
          if (err) {
            console.error(err)
            console.error(err.message);
            reject('Failed to query the database.');
          } else {
            entries.forEach((entry) => {
              entry.events = JSON.parse(entry.events);
            });
            resolve(entries);
          }
        });
    });
  };

  /**
   * Add entry to the database if the entry is a valid next addition.
   * For each user, an addition is valid if the entryNumber is greater than the
   * entryNumber of its last added entry.
   * @param {!LocalEntry} entry The entry to be added to the database.
   * @param {!String} roomId
   * @return {!Promise} Promise object with the serverId of the entry written to
   * the database.
   * @public
   */
  async addToServer(entry, roomId) {
    return new Promise(async (resolve, reject) => {
      const lastEntryNumber = await this.getLastEntryNumber_(entry.workspaceId, roomId);
      if (entry.entryNumber > lastEntryNumber) {
        try {
          const serverId = await this.runInsertQuery_(entry, roomId);
          await this.updateLastEntryNumber_(entry.workspaceId, entry.entryNumber);
          resolve(serverId);
        } catch {
          reject('Failed to write to the database');
        }
      } else if (entry.entryNumber == lastEntryNumber) {
        resolve(null);
      } else {
        reject('Entry is not valid.');
      }
    });
  };

  /**
   * Run query to add an entry to the database.
   * @param {!LocalEntry} entry The entry to be added to the database.
   * @param {!String} roomId
   * @return {!Promise} Promise object with the serverId for the entry if the
   * write succeeded.
   * @private
   */
  runInsertQuery_(entry, roomId) {
    return new Promise((resolve, reject) => {
      // console.log(105)
      this.db.serialize(() => {
        this.db.run(`INSERT INTO events
            (events, workspaceId, entryNumber,roomId) VALUES(?,?,?,?)`,
          [JSON.stringify(entry.events), entry.workspaceId, entry.entryNumber, roomId],
          (err) => {
            if (err) {
              console.error(err.message);
              reject('Failed to write to the database.');
            }
          });
        this.db.each(`SELECT last_insert_rowid() as serverId;`, (err, lastServerId) => {
          if (err) {
            console.error(err.message);
            reject('Failed to retrieve serverId.');
          }
          resolve(lastServerId.serverId);
        });
      });
      // console.log(124)
    });
  };

  /**
   * Update lastEntryNumber in the users table for a given user.
   * @param {!string} workspaceId The workspaceId of the user.
   * @param {!number} entryNumber The numeric ID assigned to an entry by the
   * user.
   * @return {!Promise} Promise object represents the success of the update.
   * @private
   */
  updateLastEntryNumber_(workspaceId, entryNumber) {
    return new Promise((resolve, reject) => {
      // console.log(138)
      this.db.run(`UPDATE workspaces SET lastEntryNumber = ?
          WHERE workspaceId = ?;`,
        [entryNumber, workspaceId],
        async (err) => {
          if (err) {
            console.error(err.message);
            reject('Failed update users table.');
          }
          resolve();
        });
      // console.log(149)
    });
  };

  /**
   * Get the lastEntryNumber for a given user.
   * @param {!string} workspaceId The workspaceId of the user.
   * @param {!String} roomId
   * @return {!Promise} Promise object with the the numeric ID assigned to an
   * entry by the user.
   * @private
   */
  getLastEntryNumber_(workspaceId, roomId) {
    return new Promise((resolve, reject) => {
      // console.log(163)
      this.db.serialize(() => {

        // Ensure user is in the database, otherwise add it.
        this.db.all(
          `SELECT * from workspaces
            WHERE (EXISTS (SELECT 1 from workspaces WHERE workspaceId == ?));`,
          [workspaceId],
          (err, entries) => {
            if (err) {
              console.error(err.message);
              reject('Failed to get last entry number.');
            } else if (entries.length == 0) {
              this.db.run(`INSERT INTO workspaces(workspaceId, lastEntryNumber, roomId)
                VALUES(?, -1,?)`, [workspaceId, roomId]);
            }
          });

        this.db.each(
          `SELECT lastEntryNumber from workspaces WHERE workspaceId = ?;`,
          [workspaceId],
          (err, result) => {
            if (err) {
              console.error(err.message);
              reject('Failed to get last entry number.');
            } else {
              resolve(result.lastEntryNumber);
            }
          });
      });
      // console.log(193)
    });
  };

  /**
   * Query the position for the given user. If no user is specified will
   * return the positions of all users.
   * @param {string=} workspaceId workspaceId of the user.
   * @return {!Promise} Promise object with an array of positionUpdate objects.
   * @public
   */
  getPositionUpdates(workspaceId) {
    return new Promise((resolve, reject) => {
      // console.log(206)
      const sql = workspaceId ?
        `SELECT workspaceId, position from workspaces
          WHERE
          (EXISTS (SELECT 1 from workspaces WHERE workspaceId == ${workspaceId}))
          AND workspaceId = ${workspaceId};` :
        `SELECT workspaceId, position from workspaces;`;
      this.db.all(sql, (err, positionUpdates) => {
        if (err) {
          console.error(err.message);
          reject('Failed to get positions.');
        } else {
          positionUpdates.forEach((positionUpdate) => {
            positionUpdate.position = JSON.parse(positionUpdate.position);
          });
          resolve(positionUpdates);
        }
      });
      // console.log(224)
    });
  };

  /**
   * Update the position in the users table for a given user.
   * @param {!Object} positionUpdate The positionUpdate with the new
   * @param {!String} roomId room's id
   * position for a given user.
   * @return {!Promise} Promise object represents the success of the update.
   * @public
   */
  updatePosition(positionUpdate, roomId) {
    return new Promise((resolve, reject) => {
      // console.log(238)
      this.db.run(
        `INSERT INTO workspaces(workspaceId, lastEntryNumber, position, roomId)
          VALUES(?, -1, ?, ?)
          ON CONFLICT(workspaceId)
          DO UPDATE SET position = ?`,
        [
          positionUpdate.workspaceId,
          JSON.stringify(positionUpdate.position),
          roomId,
          JSON.stringify(positionUpdate.position)
        ],
        (err) => {
          if (err) {
            console.error(err.message);
            reject();
          }
          resolve();
        });
      // console.log(257)
    });
  };

  /**
   * Delete a user from the users table.
   * @param {string} workspaceId The workspaceId of the user to be removed from
   * the users table.
   * @return {!Promise} Promise object represents the success of the deletion.
   * @public
   */
  deleteUser(workspaceId) {
    return new Promise((resolve, reject) => {
      // console.log(270)
      this.db.run(
        `DELETE FROM workspaces WHERE workspaceId = '${workspaceId}';`,
        (err) => {
          if (err) {
            console.error(err.message);
            reject();
          }
          resolve();
        });
      // console.log(280)
    });
  };

  deleteRoom(roomId){
    return new Promise((resolve, reject) => {
      // console.log(270)
      this.db.run(
        `DELETE FROM events WHERE roomId = '${roomId}';`,
        (err) => {
          if (err) {
            console.error(err.message);
            reject();
          }
          resolve();
        });
      // console.log(280)
    });
  }

  /**
   * Retrieve the latest snapshot of the workspace.
   * @param {!String} roomId room's id
   * @return {!Snapshot} The latest snapshot of the workspace.
   * @public
   */
  async getSnapshot(roomId) {
    if(!this.snapshotMap[roomId])
      this.snapshotMap[roomId] = {
        serverId: 0,
        xml: '<xml xmlns="https://developers.google.com/blockly/xml"/>'
      }
    await this.updateSnapshot_(roomId);
    return this.snapshotMap[roomId];
  };

  /**
   * Update the snapshot of the workspace.
   * @param {!String} roomId room's id
   * @return {!Promise} Promise object that represents the success of the
   * update.
   * @private
   */
  updateSnapshot_(roomId) {
    return new Promise(async (resolve, reject) => {
      const newEntries = await this.query(this.snapshotMap[roomId].serverId, roomId);
      if (newEntries.length == 0) {
        resolve();
        return;
      }
      // Load last stored snapshot of the workspace.
      const workspace = new Blockly.Workspace();
      if (this.snapshotMap[roomId].xml) {
        const xml = Blockly.Xml.textToDom(this.snapshotMap[roomId].xml);
        Blockly.Xml.domToWorkspace(xml, workspace);
      }
      // Play events since the last time the snapshot was generated.
      newEntries.forEach((entry) => {
        entry.events.forEach((event) => {
          console.log(event)
          const blocklyEvent = Blockly.Events.fromJson(event, workspace);
          blocklyEvent.run(true);
        });
      });
      // Store the new snapshot object.
      const newSnapshotXml = Blockly.Xml.workspaceToDom(workspace, false);
      const newSnapshotText = Blockly.Xml.domToText(newSnapshotXml);
      this.snapshotMap[roomId].xml = newSnapshotText;
      this.snapshotMap[roomId].serverId = newEntries[newEntries.length - 1].serverId;
      resolve();
    });
  };

  async getWhiteBoardEvent (roomId,serverId) {
    this.db.all(`SELECT * from whiteboard;`,
      (err, entries) => {
        if (err) {
          console.error(err)
          console.error(err.message);
        } else {
          entries.forEach((entry) => {
            console.log(entries)
          });
        }
      });
    let res = [];
    this.db.all(`SELECT event,serverId from whiteboard
                   WHERE
                   serverId > ?
                   AND roomId = ?;`,[serverId,roomId],
      (err, entries) => {
        if (err) {
          console.error(err)
          console.error(err.message);
        } else {
          entries.forEach((entry) => {
            res.push({
              event: entry.event,
              serverId: entry.serverId,
            })
          });
        }
      });
    return JSON.stringify(res);
  }

  updateWhiteBoardEvent(uuid,roomId,socketId,event){
    this.db.run(`INSERT INTO whiteboard
            (uuid, roomId, socketId,event) VALUES(?,?,?,?)`,
      [uuid,roomId,socketId,event],
      (err) => {
        if (err) {
          console.error(err.message);
        }
      });
  }

  clearWhiteBoardEvent(roomId){
    this.db.run(
      `DELETE FROM whiteboard WHERE roomId = '${roomId}';`,
      (err) => {
        if (err) {
          console.error(err.message);
        }
      });
  }

  undoWhiteboardEvent(uuid,roomId){
    this.db.run(
      `DELETE FROM whiteboard WHERE roomId = ? AND uuid = ?;`,[roomId,uuid],
      (err) => {
        if (err) {
          console.error(err.message);
        }
      });
  }

  config(){
    var interpreter = new Interpreter();

    Blockly.defineBlocksWithJsonArray([
      {
        "type": "right_rotate",
        "message0": "右转 %1 度",
        "args0": [
          {
            "type": "field_angle",
            "name": "angle",
            "angle": 15
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "action_blocks",
        "tooltip": "顺时针旋转角度",
        "helpUrl": ""
      },
      {
        "type": "left_rotate",
        "message0": "左转 %1 度",
        "args0": [
          {
            "type": "field_angle",
            "name": "angle",
            "angle": 15
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "action_blocks",
        "tooltip": "逆时针旋转角度",
        "helpUrl": ""
      },
      {
        "type": "face_to",
        "message0": "面向 %1 方向",
        "args0": [
          {
            "type": "field_angle",
            "name": "angle",
            "angle": 15
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "action_blocks",
        "tooltip": "面向指定角度",
        "helpUrl": ""
      },
      {
        "type": "move",
        "message0": "移动 %1 步",
        "args0": [
          {
            "type": "field_number",
            "name": "distance",
            "value": 10,
            "min": -1000,
            "max": 1000
          }
        ],
        "style": "action_blocks",
        "previousStatement": null,
        "nextStatement": null
      },
      {
        "type": "next_style",
        "message0": "下一个造型",
        "previousStatement": null,
        "nextStatement": null,
        "style": "action_blocks",
        "tooltip": "下一个造型",
        "helpUrl": ""
      },
      {
        "type": "loop_times",
        "message0": "重复执行 %1 次 %2 %3",
        "args0": [
          {
            "type": "field_number",
            "name": "times",
            "value": 10
          },
          {
            "type": "input_dummy"
          },
          {
            "type": "input_statement",
            "name": "loop_statement"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "control_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "loop_while",
        "message0": "重复执行直到 %1 %2",
        "args0": [
          {
            "type": "input_value",
            "name": "condition",
            "check": "Boolean"
          },
          {
            "type": "input_statement",
            "name": "loop_statement"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "control_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "true",
        "message0": "真",
        "output": "Boolean",
        "style": "math_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "false",
        "message0": "假",
        "output": "Boolean",
        "style": "math_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "variable",
        "message0": "%1",
        "args0": [
          {
            "type": "field_variable",
            "name": "variable",
            "variable": "a"
          }
        ],
        "output": "Number",
        "style": "variable_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "set_variable",
        "message0": "将变量 %1 设为 %2",
        "args0": [
          {
            "type": "field_variable",
            "name": "variable",
            "variable": "a"
          },
          {
            "type": "field_number",
            "name": "value",
            "value": 0
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "variable_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "add_variable",
        "message0": "将变量 %1 增加 %2",
        "args0": [
          {
            "type": "field_variable",
            "name": "variable",
            "variable": "a"
          },
          {
            "type": "field_number",
            "name": "value",
            "value": 1
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "variable_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "eq",
        "message0": "%1 = %2 %3",
        "args0": [
          {
            "type": "input_value",
            "name": "eq_left",
          },
          {
            "type": "input_dummy"
          },
          {
            "type": "input_value",
            "name": "eq_right",
          },
        ],
        "output": "Boolean",
        "style": "math_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "larger",
        "message0": "%1 > %2 %3",
        "args0": [
          {
            "type": "input_value",
            "name": "eq_left",
          },
          {
            "type": "input_dummy"
          },
          {
            "type": "input_value",
            "name": "eq_right",
          },
        ],
        "output": "Boolean",
        "style": "math_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "smaller",
        "message0": "%1 < %2 %3",
        "args0": [
          {
            "type": "input_value",
            "name": "eq_left",
          },
          {
            "type": "input_dummy"
          },
          {
            "type": "input_value",
            "name": "eq_right",
          },
        ],
        "output": "Boolean",
        "style": "math_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "not",
        "message0": "%1 不成立",
        "args0": [
          {
            "type": "input_value",
            "name": "condition",
            "check": "Boolean"
          }
        ],
        "output": "Boolean",
        "style": "math_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "show_variable",
        "message0": "显示变量 %1",
        "args0": [
          {
            "type": "field_variable",
            "name": "variable",
            "variable": "a"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "variable_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "if",
        "message0": "如果 %1 那么 %2 %3",
        "args0": [
          {
            "type": "input_value",
            "name": "condition",
            "check": "Boolean"
          },
          {
            "type": "input_dummy"
          },
          {
            "type": "input_statement",
            "name": "if_statement"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "control_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "if_else",
        "message0": "如果 %1 那么 %2 %3 否则   %4 %5",
        "args0": [
          {
            "type": "input_value",
            "name": "condition",
            "check": "Boolean"
          },
          {
            "type": "input_dummy"
          },
          {
            "type": "input_statement",
            "name": "if_statement"
          },
          {
            "type": "input_dummy"
          },
          {
            "type": "input_statement",
            "name": "else_statement"
          },
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "control_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "hide",
        "message0": "%1 隐藏",
        "args0": [
          {
            "type": "input_value",
            "name": "object",
            "check": "String"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "action_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "show",
        "message0": "%1 显示",
        "args0": [
          {
            "type": "input_value",
            "name": "object",
            "check": "String"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "action_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "set_x",
        "message0": "将 %1 %2 x坐标设为 %3",
        "args0": [
          {
            "type": "input_dummy"
          },
          {
            "type": "input_value",
            "name": "object",
            "check": "String"
          },
          {
            "type": "field_number",
            "name": "x",
            "value": 0
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "action_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "x_of",
        "message0": "%1 的x坐标",
        "args0": [
          {
            "type": "input_value",
            "name": "object",
            "check": "String"
          }
        ],
        "output": "Number",
        "style": "action_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "y_of",
        "message0": "%1 的y坐标",
        "args0": [
          {
            "type": "input_value",
            "name": "object",
            "check": "String"
          }
        ],
        "output": "Number",
        "style": "action_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "set_y",
        "message0": "将 %1 %2 y坐标设为 %3",
        "args0": [
          {
            "type": "input_dummy"
          },
          {
            "type": "input_value",
            "name": "object",
            "check": "String"
          },
          {
            "type": "field_number",
            "name": "x",
            "value": 0
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "style": "action_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "object_name",
        "message0": "对象 %1",
        "args0": [
          {
            "type": "field_input",
            "name": "object_name",
            "text": "moveObject"
          }
        ],
        "output": "String",
        "style": "variable_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "bump_object",
        "message0": "碰到 %1",
        "args0": [
          {
            "type": "input_value",
            "name": "object",
            "check": "String"
          }
        ],
        "output": "Boolean",
        "style": "check_blocks",
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "bump_wall",
        "message0": "碰到墙壁",
        "output": "Boolean",
        "style": "check_blocks",
        "tooltip": "",
        "helpUrl": ""
      }
    ]);
    Blockly.JavaScript['right_rotate'] = function(block) {
      var angle_angle = block.getFieldValue('angle');
      var code = "    objects.moveObject.rotation -= " +  angle_angle + ';\n';
      interpreter.addStep(interpreter.newSingleStep('right_rotate', code));
      return code;
    };
    Blockly.JavaScript['left_rotate'] = function(block) {
      var angle_angle = block.getFieldValue('angle');
      var code = "    objects.moveObject.rotation += " +  angle_angle + ';\n';
      interpreter.addStep(interpreter.newSingleStep('left_rotate', code));
      return code;
    };
    Blockly.JavaScript['next_style'] = function(block) {
      var code = "    objects.moveObject.p = 1 - objects.moveObject.p;\n";
      interpreter.addStep(interpreter.newSingleStep('next_style', code));
      return code;
    };
    Blockly.JavaScript['move'] = function(block) {
      var number_distance = block.getFieldValue('distance');
      var code = "    objects.moveObject.x += " + number_distance + " * Math.cos(objects.moveObject.rotation * Math.PI / 180);\n" +
        "    objects.moveObject.y += " + number_distance + " * Math.sin(objects.moveObject.rotation * Math.PI / 180);\n";
      var noTransboundary =
        `    if(objects.moveObject.x <= - objects.cWidth / 2 && Math.abs(objects.moveObject.rotation) % 360 < 270 && Math.abs(objects.moveObject.rotation) % 360 > 90){
      objects.moveObject.x = objects.cWidth / 2;
    }

    if(objects.moveObject.x >= objects.cWidth / 2 && (Math.abs(objects.moveObject.rotation) % 360 < 90 || Math.abs(objects.moveObject.rotation) % 360 > 270)){
      objects.moveObject.x = -objects.cWidth / 2;
    }

    if(objects.moveObject.y <= - objects.cHeight / 2 && Math.abs(objects.moveObject.rotation) % 360 < 360 && Math.abs(objects.moveObject.rotation) % 360 > 180){
      objects.moveObject.y = objects.cHeight / 2;
    }
    if(objects.moveObject.y >= objects.cHeight / 2 && Math.abs(objects.moveObject.rotation) % 360 < 180 && Math.abs(objects.moveObject.rotation) % 360 > 0){
      objects.moveObject.y = -objects.cHeight / 2;
    }`;
      interpreter.addStep(interpreter.newSingleStep('move', code + noTransboundary));
      return code;
    };
    Blockly.JavaScript['face_to'] = function(block) {
      var angle_angle = block.getFieldValue('angle');
      var code = "objects.moveObject.rotation = " +  angle_angle + ';\n';
      interpreter.addStep(interpreter.newSingleStep('face_to', code));
      return code;
    };

    Blockly.JavaScript['loop_times'] = function(block) {
      var number_times = block.getFieldValue('times');
      interpreter.addStep(interpreter.forStepFirst('loop_times',number_times));
      let index = interpreter.stepLength() - 1;
      var statements_loop_statement = Blockly.JavaScript.statementToCode(block, 'loop_statement');
      var code =
        `  for (var index = 0; index < ${number_times}; index++) {\n` +
        `    ${statements_loop_statement}` +
        `  }\n`;
      interpreter.addStep(interpreter.forStepSecond('loop_times',index));
      interpreter.setGo(index, interpreter.stepLength());
      return code;
    };

    Blockly.JavaScript['loop_while'] = function(block) {
      var value_condition = Blockly.JavaScript.valueToCode(block, 'condition', Blockly.JavaScript.ORDER_ATOMIC);
      interpreter.addStep(interpreter.forWhileFirst('loop_while',value_condition));
      let index = interpreter.stepLength() - 1;
      var statements_loop_statement = Blockly.JavaScript.statementToCode(block, 'loop_statement');
      var code =
        `  while (!${value_condition}) {\n` +
        `    ${statements_loop_statement}` +
        `  }\n`;
      interpreter.addStep(interpreter.forWhileSecond('loop_while',index));
      interpreter.setGo(index, interpreter.stepLength());
      return code;
    };

    Blockly.JavaScript['true'] = function(block) {
      return [`true`, Blockly.JavaScript.ORDER_NONE];
    };

    Blockly.JavaScript['false'] = function(block) {
      return [`false`, Blockly.JavaScript.ORDER_NONE];
    };

    Blockly.JavaScript['variable'] = function(block) {
      var variable_variable = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('variable'),Blockly.Variables.NAME_TYPE);
      return [ `objects.variables.${variable_variable}`, Blockly.JavaScript.ORDER_NONE];
    };

    Blockly.JavaScript['set_variable'] = function(block) {
      var variable_variable = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('variable'),Blockly.Variables.NAME_TYPE);
      var number_value = block.getFieldValue('value');
      let code = `objects.variables.${variable_variable} = ${number_value};\n`;
      interpreter.addStep(interpreter.newSingleStep('set_variable',code));
      return code;
    };

    Blockly.JavaScript['add_variable'] = function(block) {
      var variable_variable = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('variable'),Blockly.Variables.NAME_TYPE);
      var number_value = block.getFieldValue('value');
      let code = `objects.variables.${variable_variable} += ${number_value};\n`;
      interpreter.addStep(interpreter.newSingleStep('set_variable',code));
      return code;
    };

    Blockly.JavaScript['show_variable'] = function(block) {
      var variable_variable = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('variable'),Blockly.Variables.NAME_TYPE);
      let code = `objects.show.blank('显示变量','变量${variable_variable}的值为' + objects.variables.${variable_variable}, {nzDuration:3000});\n`;
      interpreter.addStep(interpreter.newSingleStep('set_variable',code));
      return code;
    };

    Blockly.JavaScript['eq'] = function(block) {
      var value_eq_left = Blockly.JavaScript.valueToCode(block, 'eq_left', Blockly.JavaScript.ORDER_ATOMIC);
      var value_eq_right = Blockly.JavaScript.valueToCode(block, 'eq_right', Blockly.JavaScript.ORDER_ATOMIC);
      var code = `${value_eq_left} == ${value_eq_right}`;
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    Blockly.JavaScript['larger'] = function(block) {
      var value_eq_left = Blockly.JavaScript.valueToCode(block, 'eq_left', Blockly.JavaScript.ORDER_ATOMIC);
      var value_eq_right = Blockly.JavaScript.valueToCode(block, 'eq_right', Blockly.JavaScript.ORDER_ATOMIC);
      var code = `${value_eq_left} > ${value_eq_right}`;
      return [code, Blockly.JavaScript.ORDER_NONE];
    };
    Blockly.JavaScript['smaller'] = function(block) {
      var value_eq_left = Blockly.JavaScript.valueToCode(block, 'eq_left', Blockly.JavaScript.ORDER_ATOMIC);
      var value_eq_right = Blockly.JavaScript.valueToCode(block, 'eq_right', Blockly.JavaScript.ORDER_ATOMIC);
      var code = `${value_eq_left} > ${value_eq_right}`;
      return [code, Blockly.JavaScript.ORDER_NONE];
    };
    Blockly.JavaScript['if'] = function(block) {
      var value_condition = Blockly.JavaScript.valueToCode(block, 'condition', Blockly.JavaScript.ORDER_ATOMIC);
      interpreter.addStep(interpreter.ifStep('if', value_condition));
      let index = interpreter.stepLength() - 1;
      var statements_if_statement = Blockly.JavaScript.statementToCode(block, 'if_statement');
      interpreter.setGo(index, interpreter.stepLength());
      return `if${value_condition}{
        ${statements_if_statement}
     }\n`;
    };

    Blockly.JavaScript['if_else'] = function(block) {
      var value_condition = Blockly.JavaScript.valueToCode(block, 'condition', Blockly.JavaScript.ORDER_ATOMIC);
      interpreter.addStep(interpreter.ifStep('if_else', value_condition));
      let index = interpreter.stepLength() - 1;
      var statements_if_statement = Blockly.JavaScript.statementToCode(block, 'if_statement');
      interpreter.setGo(index, interpreter.stepLength() + 1);
      interpreter.addStep(interpreter.nop());
      index = interpreter.stepLength() - 1;
      var statements_else_statement = Blockly.JavaScript.statementToCode(block, 'else_statement');
      interpreter.setGo(index, interpreter.stepLength());
      return `if${value_condition}{
        ${statements_if_statement}
     } else {
        ${statements_else_statement}
     }\n`;
    };

    Blockly.JavaScript['not'] = function(block) {
      var value_condition = Blockly.JavaScript.valueToCode(block, 'condition', Blockly.JavaScript.ORDER_ATOMIC);
      var code = `!${value_condition}`;
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    Blockly.JavaScript['hide'] = function(block) {
      var value_object = Blockly.JavaScript.valueToCode(block, 'object', Blockly.JavaScript.ORDER_ATOMIC);
      let object_name = value_object.replace('(','').replace(')','');
      var code =  `objects.${object_name}.hide = true;\n`;
      interpreter.addStep(interpreter.newSingleStep('hide',code));
      return code;
    };
    Blockly.JavaScript['show'] = function(block) {
      var value_object = Blockly.JavaScript.valueToCode(block, 'object', Blockly.JavaScript.ORDER_ATOMIC);
      let object_name = value_object.replace('(','').replace(')','');
      var code =  `objects.${object_name}.hide = false;\n`;
      interpreter.addStep(interpreter.newSingleStep('show',code));
      return code;
    };
    Blockly.JavaScript['object_name'] = function(block) {
      var text_object_name = block.getFieldValue('object_name');
      return [text_object_name, Blockly.JavaScript.ORDER_NONE];
    };

    Blockly.JavaScript['set_x'] = function(block) {
      var value_object = Blockly.JavaScript.valueToCode(block, 'object', Blockly.JavaScript.ORDER_ATOMIC);
      let object_name = value_object.replace('(','').replace(')','');
      var number_x = block.getFieldValue('x');
      var code =  `objects.${object_name}.x = ${number_x};\n`;
      var noTransboundary =
        `if(objects.${object_name}.x > objects.cWidth/2){
      objects.${object_name}.x = objects.cWidth/2;
    }
    if(objects.${object_name}.x < - objects.cWidth/2){
      objects.${object_name}.x = - objects.cWidth/2;
    }`;
      interpreter.addStep(interpreter.newSingleStep('set_x',code + noTransboundary));
      return code;
    };
    Blockly.JavaScript['set_y'] = function(block) {
      var value_object = Blockly.JavaScript.valueToCode(block, 'object', Blockly.JavaScript.ORDER_ATOMIC);
      let object_name = value_object.replace('(','').replace(')','');
      var number_y = block.getFieldValue('y');
      var code =  `objects.${object_name}.y = ${number_y};\n`;
      var noTransboundary =
        `if(objects.${object_name}.y > objects.cHeight/2){
      objects.${object_name}.y = objects.cHeight/2;
    }
    if(objects.${object_name}.y < - objects.cHeight/2){
      objects.${object_name}.y = - objects.cHeight/2;
    }`;
      interpreter.addStep(interpreter.newSingleStep('set_y',code + noTransboundary));
      return code;
    };
    Blockly.JavaScript['bump_object'] = function(block) {
      var value_object = Blockly.JavaScript.valueToCode(block, 'object', Blockly.JavaScript.ORDER_ATOMIC);
      let object_name = value_object.replace('(','').replace(')','');
      var code = `objects.${object_name} &&
          typeof objects.${object_name} === "object" && Math.abs(objects.${object_name}.x - objects.moveObject.x) < 10
          && Math.abs(objects.${object_name}.y - objects.moveObject.y) < 10`;
      return [code, Blockly.JavaScript.ORDER_NONE];
    };
    Blockly.JavaScript['bump_wall'] = function(block) {
      var code = ` objects.moveObject.x <= -objects.cWidth/2 || objects.moveObject.x >= objects.cWidth/2
  || objects.moveObject.y >= objects.cHeight/2 || objects.moveObject.y <= -objects.cHeight/2`;
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    Blockly.JavaScript['x_of'] = function(block) {
      var value_object = Blockly.JavaScript.valueToCode(block, 'object', Blockly.JavaScript.ORDER_ATOMIC);
      let object_name = value_object.replace('(','').replace(')','');
      var code = `objects.${object_name} && typeof objects.${object_name} === "object" ?objects.${object_name}.x:0`;
      return [code, Blockly.JavaScript.ORDER_NONE];
    };
    Blockly.JavaScript['y_of'] = function(block) {
      var value_object = Blockly.JavaScript.valueToCode(block, 'object', Blockly.JavaScript.ORDER_ATOMIC);
      let object_name = value_object.replace('(','').replace(')','');
      var code = `objects.${object_name} && typeof objects.${object_name} === "object" ?objects.${object_name}.y:0`;
      return [code, Blockly.JavaScript.ORDER_NONE];
    };
  }
}

module.exports = new Database();
