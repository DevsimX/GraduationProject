import Blockly from "blockly";

const blockStyles = {
  "list_blocks": {
    "colourPrimary": "#EBCB3C",
  },
  "logic_blocks": {
    "colourPrimary": "#E8AA1C"
  },
  "loop_blocks": {
    "colourPrimary": "#E8AA1C",
  },
  "variable_blocks": {
    "colourPrimary": "#E28B17",
  },
  "math_blocks": {
    "colourPrimary": "#7BBF50",
  },
  "action_blocks": {
    "colourPrimary": "#6E98FE"
  },
  "control_blocks": {
    "colourPrimary": "#E8AA1C"
  },
  "check_blocks": {
    "colourPrimary": "#935BA4"
  },
};

const categoryStyles = {
  "variable_category": {
    "colour": "#E28B17"
  },
  "control_category": {
    "colour": "#E8AA1C"
  },
  "math_category": {
    "colour": "#7BBF50"
  },
  "event_category": {
    "colour": "rgb(96, 143, 238)"
  },
  "action_category": {
    "colour": "#6E98FE"
  },
  "check_category": {
    "colour": "#935BA4"
  },
};

const componentStyles = {
  'base': Blockly.Themes.Classic,
  "workspaceBackgroundColour": "#FCF8EF",
  "toolboxBackgroundColour": "#FEFCF7",
  'flyoutBackgroundColour': '#FEFCF7',
};

export const blockly_options = {
  readOnly: false,
  media: 'assets/blockly/media/',
  grid: {
    spacing: 20,
    length: 3,
    colour: '#ccc',
    snap: true
  },
  trashcan: true,
  move: {
    scrollbars: true,
    drag: true,
    wheel: true
  },
  theme: Blockly.Theme.defineTheme('themeName', {
    'blockStyles': blockStyles,
    'categoryStyles': categoryStyles,
    'componentStyles': componentStyles
  }),
  toolbox: `
      <xml id="toolbox-simple" style="display: none">
        <category name="动作" categorystyle="action_category">
            <block type="right_rotate"></block>
            <block type="left_rotate"></block>
            <block type="next_style"></block>
            <block type="face_to"></block>
            <block type="move"></block>
            <block type="hide"></block>
            <block type="show"></block>
            <block type="set_x"></block>
            <block type="set_y"></block>
            <block type="x_of"></block>
            <block type="y_of"></block>
        </category>

        <category name="控制" categorystyle="control_category">
          <block type="loop_times"></block>
          <block type="loop_while"></block>
          <block type="if"></block>
          <block type="if_else"></block>
        </category>

        <category name="运算" categorystyle="math_category">
           <block type="math_number"></block>
           <block type="true"></block>
           <block type="false"></block>
           <block type="eq"></block>
           <block type="larger"></block>
           <block type="smaller"></block>
           <block type="not"></block>
        </category>
        <category name="变量"  categorystyle="variable_category">
          <block type="variable"></block>
          <block type="set_variable"></block>
          <block type="add_variable"></block>
          <block type="show_variable"></block>
          <block type="object_name"></block>
        </category>
        <category name="侦测" categorystyle="check_category">
          <block type="bump_object"></block>
          <block type="bump_wall"></block>
        </category>

      </xml>
        `,

};
