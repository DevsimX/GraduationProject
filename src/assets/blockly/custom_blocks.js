
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
