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

