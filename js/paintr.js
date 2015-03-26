// app namespace
var paintr = paintr || {};

//app attributes
paintr.clipboardArray = new Array();
paintr.clipboardObject = null;

/**
 * Handler for drawing rectangles and squares
 */
paintr.drawRect = function() {
  paintr.toggleMode();
  var is_drawing = false;
  var rect,
      mouse_pos,
      x0, y0;
  paintr.canvas.on('mouse:down', function(e) {
    mouse_pos = paintr.canvas.getPointer(e.e);
    x0 = mouse_pos.x;
    y0 = mouse_pos.y;
    is_drawing = true;
    rect = new fabric.Rect({
      width: 0,
      height: 0,
      left: x0,
      top: y0,
      fill: '',
      stroke: paintr.pen_color
    });
    if (paintr.mode === 'square') {
      rect.lockUniScaling = true;
    }
    paintr.canvas.add(rect);
  });

  paintr.canvas.on('mouse:move', function(e) {
    if (!is_drawing) return;
    mouse_pos = paintr.canvas.getPointer(e.e);
    var w = mouse_pos.x - x0,
        h;
    if (paintr.mode === 'rectangle') {
      h = mouse_pos.y - y0;
    } else {
      h = w;
    }
    rect.set({ width: w, height: h});
    paintr.canvas.renderAll();
  });

  paintr.canvas.on('mouse:up', function(e) {
    is_drawing = false;
  });
};

/**
 * Handler to draw a circle.
 */
paintr.drawCircle = function () {
  paintr.toggleMode();
  var is_drawing = false;
  var circle,
      mouse_pos,
      x0, y0;

  paintr.canvas.on('mouse:down', function(e) {
    mouse_pos = paintr.canvas.getPointer(e.e);
    x0 = mouse_pos.x;
    y0 = mouse_pos.y;
    is_drawing = true;
    circle = new fabric.Circle({
      radius: 0,
      left: x0,
      top: y0,
      fill: '',
      stroke: paintr.pen_color
    });
    paintr.canvas.add(circle);
  });

  paintr.canvas.on('mouse:move', function(e) {
    if (!is_drawing) return;
    mouse_pos = paintr.canvas.getPointer(e.e);
    var w = mouse_pos.x - x0;
        h = mouse_pos.y - y0;
    var diameter = Math.sqrt(w * w + h * h);
    circle.set({ radius: diameter });
    paintr.canvas.renderAll();
  });

  paintr.canvas.on('mouse:up', function(e) {
    is_drawing = false;
  });
};

/**
 * Handler to draw a ellipse. Mouse down, move, and up events handle
 */
paintr.drawEllipse = function() {
  paintr.toggleMode();
  var is_drawing = false;
  var ellipse,
      mouse_pos,
      x0, y0;

  paintr.canvas.on('mouse:down', function(e) {
    mouse_pos = paintr.canvas.getPointer(e.e);
    x0 = mouse_pos.x;
    y0 = mouse_pos.y;
    is_drawing = true;
    ellipse = new fabric.Ellipse({
      rx: 0,
      ry: 0,
      left: x0,
      top: y0,
      fill: '',
      stroke: paintr.pen_color
    });
    paintr.canvas.add(ellipse);
  });

  paintr.canvas.on('mouse:move', function(e) {
    if (!is_drawing) return;
    mouse_pos = paintr.canvas.getPointer(e.e);
    var radius_a = Math.abs(mouse_pos.x - x0);
        radius_b = Math.abs(mouse_pos.y - y0);
    ellipse.set({ rx: radius_a, ry: radius_b});
    paintr.canvas.renderAll();    
  });

  paintr.canvas.on('mouse:up', function(e) {
    is_drawing = false;
  });
}

/**
 * Handler to draw a straight line. Mouse down, move, and up events handled
 */
paintr.drawLine = function() {
  paintr.toggleMode();
  var is_drawing = false;
  var line;

  paintr.canvas.on('mouse:down', function(e) {
    var mouse_pos = paintr.canvas.getPointer(e.e);
    is_drawing = true;
    line = new fabric.Line([mouse_pos.x, mouse_pos.y, mouse_pos.x, mouse_pos.y], {
      strokeWidth: 2,
      fill: paintr.pen_color,
      stroke: paintr.pen_color
    });
    paintr.canvas.add(line);
  });

  paintr.canvas.on('mouse:move', function(e) {
    if (!is_drawing) return;
    var mouse_pos = paintr.canvas.getPointer(e.e);
    line.set({ x2: mouse_pos.x, y2: mouse_pos.y });
    paintr.canvas.renderAll();
    paintr.canvas.calcOffset();
  });

  paintr.canvas.on('mouse:up', function(e) {
    is_drawing = false;
  });
};


/**
 * Handler for freehand drawing
 */
paintr.drawFreehand = function() {
  paintr.toggleMode();
  paintr.canvas.isDrawingMode = true;
  paintr.canvas.renderAll();
};

/**
 * Handler for selection and moving
 */
paintr.select = function() {
  paintr.toggleMode();
  paintr.canvas.selection = true;
  paintr.canvas.forEachObject(function(obj) {
    obj.selectable = true;
    obj.setCoords();
  });
  paintr.canvas.calcOffset();
  paintr.canvas.renderAll();
};


/**
 * Resets canvas handlers. Should be called whenever the mode is changed
 */
paintr.toggleMode = function() {
  paintr.canvas.off('mouse:down');
  paintr.canvas.off('mouse:up');
  paintr.canvas.off('mouse:move');
  paintr.canvas.isDrawingMode = false;
  paintr.canvas.selection = false;
  paintr.canvas.forEachObject(function(obj) {
    obj.selectable = false;
  });
};

/**
 * Changes the pen color
 * @param color - color to be changed to
 */
paintr.setColor = function(color) {
  paintr.pen_color = color;
  paintr.canvas.freeDrawingBrush.color = paintr.pen_color;
};

paintr.cut = function(){
      clipboardArray = new Array();

  if(paintr.canvas.getActiveGroup()){
    for(var i in paintr.canvas.getActiveGroup().objects){
      //var object = fabric.util.object.clone(paintr.canvas.getActiveGroup().objects[i]);
      paintr.clipboardArray[i] = paintr.canvas.getActiveGroup().objects[i];
    }
    paintr.canvas.getActiveGroup().forEachObject(function(o){ paintr.canvas.remove(o) });
    paintr.canvas.discardActiveGroup().renderAll();                    
  }else if(paintr.canvas.getActiveObject()){
    //var object = fabric.util.object.clone(paintr.canvas.getActiveObject());
    paintr.clipboardObject = paintr.canvas.getActiveObject();
    paintr.canvas.remove(paintr.canvas.getActiveObject());
    paintr.canvas.discardActiveObject().renderAll();                    
  }
}

paintr.paste = function(){
  if(paintr.clipboardArray.length > 0){
    for(var i in paintr.clipboardArray){
      paintr.canvas.add(paintr.clipboardArray[i]);
      paintr.clipboardArray[i].setCoords();
    }                    
  }else if(paintr.clipboardObject){
    paintr.canvas.add(paintr.clipboardObject);
    paintr.clipboardObject.setCoords();
  }
  paintr.canvas.renderAll();    
}


paintr.onKeyDownHandler=function(event) {
    var key;
    if(window.event){
        key = window.event.keyCode;
    }
    else{
        key = event.keyCode;
    }
    switch(key){

        case 88: // Cut (Ctrl+X)
            if(event.ctrlKey){
                event.preventDefault();
                paintr.cut();
            }
            break;
        case 86: // Paste (Ctrl+V)
            if(event.ctrlKey){
                event.preventDefault();
                paintr.paste();
            }
            break;
        default:
            break;
    }
}


/**
 * Clears the canvas of all objects
 */
paintr.clear = function() {
  paintr.canvas.clear();
};

/**
 * Sets the mode for drawing and highlights the mode
 * @param mode to be set
 */
paintr.setMode = function(mode) {
  var elem = document.getElementById(paintr.mode);
  elem.className = paintr.removeClass(elem, 'active');
  document.getElementById(mode).className += 'active';
  paintr.mode = mode;
};

/**
 * Remove one class from an element
 * @param elem The element to remove the class from
 * @param to_remove The class to be removed
 * @returns {string} The resultant class name
 */
paintr.removeClass = function(elem, to_remove) {
  return elem.className.replace(to_remove, '');
};

paintr.save = function() {

};

// Setup the canvas
window.onload = function() {
  paintr.canvas = new fabric.Canvas('canvas', { selection: true });
  paintr.canvas.backgroundColor = 'white';
  paintr.pen_color = 'black';
  paintr.mode = 'select';
  paintr.canvas.freeDrawingBrush.width = 2;
  paintr.canvas.renderAll();

  // EVENT LISTENERS
  document.getElementById('line').addEventListener('click', paintr.drawLine);
  document.getElementById('freehand').addEventListener('click', paintr.drawFreehand);
  document.getElementById('select').addEventListener('click', paintr.select);
  document.getElementById('clear').addEventListener('click', paintr.clear);
  document.getElementById('rectangle').addEventListener('click', paintr.drawRect);
  document.onkeydown = paintr.onKeyDownHandler;
  document.getElementById('square').addEventListener('click', paintr.drawRect);
  document.getElementById('circle').addEventListener('click', paintr.drawCircle);
  document.getElementById('ellipse').addEventListener('click', paintr.drawEllipse);
};
