// app namespace
var paintr = paintr || {};

/**
 * Memento stores state for undo redo (memento design pattern)
 * @param canvas the canvas (current state of the diagram)
 * @constructor
 */
paintr.Memento = function (canvas) {
  var serialized_canvas = JSON.stringify(canvas);
  this.state = serialized_canvas;
};

/**
 * Originator keeps track of the current state of the canvas (memento design pattern)
 * @constructor
 */
paintr.Originator = function () {
};

/**
 * Caretaker keeps track of states needed for undo and redo (memento design pattern)
 * @constructor
 */
paintr.Caretaker = function () {
  this.undo_stack = [];
  this.redo_stack = [];
};

/**
 * Returns the result of an undo action
 * @returns {Memento}
 */
paintr.Caretaker.prototype.getUndoMemento = function () {
  if (this.undo_stack.length >= 2) {
    this.redo_stack.push(this.undo_stack.pop());
    return this.undo_stack[this.undo_stack.length - 1];
  } else {
    return null;
  }
};

/**
 * Returns the result of a redo action
 * @returns {Memento}
 */
paintr.Caretaker.prototype.getRedoMemento = function () {
  if (this.redo_stack.length != 0) {
    var memento = this.redo_stack.pop();
    this.undo_stack.push(memento);
    return memento;
  } else {
    return null;
  }
};

/**
 * Inserts a new memento into the undo stack. Called when actions occur
 * @param canvas the current canvas
 */
paintr.Caretaker.prototype.insertMemento = function (canvas) {
  if (canvas) {
    var memento = new paintr.Memento(canvas);
    this.undo_stack.push(memento);
    this.redo_stack = [];
  }
};

/**
 * Checks to see if undo operation is possible
 * @returns {boolean}
 */
paintr.Caretaker.prototype.canUndo = function () {
  return this.undo_stack.length >= 2;
};

/**
 * Checks to see if the redo operation is possible
 * @returns {boolean}
 */
paintr.Caretaker.prototype.canRedo = function () {
  return this.redo_stack.length != 0;
};

/**
 * UndoRedo handles undo and redo operations for paintr
 * @constructor
 */
paintr.UndoRedo = function () {
  this.caretaker = new paintr.Caretaker();
  this.originator = new paintr.Originator();
};

/**
 * Calls the caretaker insert with the current canvas
 * @param canvas
 */
paintr.UndoRedo.prototype.insert = function (canvas) {
  this.caretaker.insertMemento(canvas);
};

/**
 * Gets the next memento from the undo stack
 * @returns {Object} Returns the state of the memento which is a JSON representation of a canvas
 */
paintr.UndoRedo.prototype.undo = function () {
  this.originator.state = this.caretaker.getUndoMemento();
  return this.originator.state;
};

/**
 * Gets the next memento from the redo stack
 * @returns {Object} Returns the state of the memento which is a JSON representation of a canvas
 */
paintr.UndoRedo.prototype.redo = function () {
  this.originator.state = this.caretaker.getRedoMemento();
  return this.originator.state;
};

/**
 * Checks if undo is possible
 * @returns {boolean}
 */
paintr.UndoRedo.prototype.canUndo = function () {
  return this.caretaker.canUndo();
};

/**
 * Checks if redo is possible
 * @returns {boolean}
 */
paintr.UndoRedo.prototype.canRedo = function () {
  return this.caretaker.canRedo();
};

//app attributes

paintr.clipboard = []; // stores cut, copy, and paste items
paintr.undo_redo_manager = new paintr.UndoRedo(); // Handles undo redo operations for app
paintr.savedCanvases = []; // local storage for saved canvases

/**
 * Handler for drawing rectangles and squares
 */
paintr.drawRect = function () {
  paintr.toggleMode();
  var isDrawing = false;
  var rect,
    mousePos,
    x0, y0;
  paintr.canvas.on('mouse:down', function (e) {
    mousePos = paintr.canvas.getPointer(e.e);
    x0 = mousePos.x;
    y0 = mousePos.y;
    isDrawing = true;
    rect = new fabric.Rect({
      width: 0,
      height: 0,
      left: x0,
      top: y0,
      fill: '',
      stroke: paintr.penColor
    });
    if (paintr.mode === 'square') {
      rect.lockUniScaling = true;
    }
    paintr.canvas.add(rect);
  });

  paintr.canvas.on('mouse:move', function (e) {
    if (!isDrawing) return;
    mousePos = paintr.canvas.getPointer(e.e);
    var w = mousePos.x - x0,
      h;
    if (paintr.mode === 'rectangle') {
      h = mousePos.y - y0;
    } else {
      h = w;
    }
    rect.set({width: w, height: h});
    paintr.canvas.renderAll();
  });

  paintr.canvas.on('mouse:up', function (e) {
    isDrawing = false;
    paintr.undo_redo_manager.caretaker.insertMemento(paintr.canvas);
  });
};

/**
 * Handler to draw a circle.
 */
paintr.drawCircle = function () {
  paintr.toggleMode();
  var isDrawing = false;
  var circle,
    mousePos,
    x0, y0;

  paintr.canvas.on('mouse:down', function (e) {
    mousePos = paintr.canvas.getPointer(e.e);
    x0 = mousePos.x;
    y0 = mousePos.y;
    isDrawing = true;
    circle = new fabric.Circle({
      radius: 0,
      left: x0,
      top: y0,
      fill: '',
      stroke: paintr.penColor
    });
    paintr.canvas.add(circle);
  });

  paintr.canvas.on('mouse:move', function (e) {
    if (!isDrawing) return;
    mousePos = paintr.canvas.getPointer(e.e);
    var w = mousePos.x - x0;
    h = mousePos.y - y0;
    var diameter = Math.sqrt(w * w + h * h);
    circle.set({radius: diameter / 2});
    paintr.canvas.renderAll();
  });

  paintr.canvas.on('mouse:up', function (e) {
    isDrawing = false;
    paintr.undo_redo_manager.caretaker.insertMemento(paintr.canvas);
  });
};

/**
 * Handler to draw a ellipse. Mouse down, move, and up events handle
 */
paintr.drawEllipse = function () {
  paintr.toggleMode();
  var isDrawing = false;
  var ellipse,
    mousePos,
    x0, y0;

  paintr.canvas.on('mouse:down', function (e) {
    mousePos = paintr.canvas.getPointer(e.e);
    x0 = mousePos.x;
    y0 = mousePos.y;
    isDrawing = true;
    ellipse = new fabric.Ellipse({
      rx: 0,
      ry: 0,
      left: x0,
      top: y0,
      fill: '',
      stroke: paintr.penColor
    });
    paintr.canvas.add(ellipse);
  });

  paintr.canvas.on('mouse:move', function (e) {
    if (!isDrawing) return;
    mousePos = paintr.canvas.getPointer(e.e);
    var radius_a = Math.abs(mousePos.x - x0),
      radius_b = Math.abs(mousePos.y - y0);
    ellipse.set({rx: radius_a, ry: radius_b});
    paintr.canvas.renderAll();
  });

  paintr.canvas.on('mouse:up', function (e) {
    isDrawing = false;
    paintr.undo_redo_manager.caretaker.insertMemento(paintr.canvas);
  });
}

/**
 * Handler to draw a straight line. Mouse down, move, and up events handled
 */
paintr.drawLine = function () {
  paintr.toggleMode();
  var isDrawing = false;
  var line;

  paintr.canvas.on('mouse:down', function (e) {
    var mousePos = paintr.canvas.getPointer(e.e);
    isDrawing = true;
    line = new fabric.Line([mousePos.x, mousePos.y, mousePos.x, mousePos.y], {
      strokeWidth: 2,
      fill: paintr.penColor,
      stroke: paintr.penColor
    });
    paintr.canvas.add(line);
  });

  paintr.canvas.on('mouse:move', function (e) {
    if (!isDrawing) return;
    var mousePos = paintr.canvas.getPointer(e.e);
    line.set({x2: mousePos.x, y2: mousePos.y});
    paintr.canvas.renderAll();
    paintr.canvas.calcOffset();
  });

  paintr.canvas.on('mouse:up', function (e) {
    isDrawing = false;
    paintr.undo_redo_manager.caretaker.insertMemento(paintr.canvas);
  });
};

/**
 * Handler for draw a polygon. Mouse down and events handle
 */
paintr.drawPolygon = function () {
  paintr.toggleMode();
  var isDrawing = true,
    currentLine,
    mousePos,
    polygon,
    justFinishedPolygon = false;


  paintr.canvas.on('mouse:move', function (e) {
    if (!isDrawing || !currentLine || justFinishedPolygon) return;
    mousePos = paintr.canvas.getPointer(e.e);
    currentLine.set({x2: mousePos.x, y2: mousePos.y});
    paintr.canvas.renderAll();
    paintr.canvas.calcOffset();
  });

  paintr.canvas.on('mouse:up', function (e) {
    if (justFinishedPolygon) {
      justFinishedPolygon = false;
      return;
    }
    mousePos = paintr.canvas.getPointer(e.e);
    currentLine = new fabric.Line([mousePos.x, mousePos.y, mousePos.x, mousePos.y], {
      strokeWidth: 2,
      fill: paintr.penColor,
      stroke: paintr.penColor
    });
    if (!polygon) {
      polygon = [];
    }
    polygon.push(currentLine);
    paintr.canvas.add(currentLine);
    isDrawing = true;
  });

  var endThisPolygon = function(e) {
    isDrawing = false;
    currentLine = new fabric.Line([mousePos.x, mousePos.y, mousePos.x, mousePos.y], {
      strokeWidth: 2,
      fill: paintr.penColor,
      stroke: paintr.penColor
    });
    paintr.canvas.add(currentLine);
    paintr.canvas.add(new fabric.Group(polygon, { selectable: false }));
    currentLine = null;
    polygon = null;
    justFinishedPolygon = true;
    paintr.undo_redo_manager.caretaker.insertMemento(paintr.canvas);
    return false;
  }

  document.body.oncontextmenu = endThisPolygon;
};

/**
 * Handler for freehand drawing
 */
paintr.drawFreehand = function () {
  paintr.toggleMode();
  paintr.canvas.isDrawingMode = true;
  paintr.canvas.renderAll();
  paintr.undo_redo_manager.caretaker.insertMemento(paintr.canvas);
};

/**
 * Handler for selection and moving
 */
paintr.select = function () {
  paintr.toggleMode();
  paintr.canvas.selection = true;
  paintr.canvas.forEachObject(function (obj) {
    obj.selectable = true;
    obj.setCoords();
  });
  paintr.canvas.calcOffset();
  paintr.canvas.renderAll();
};

/**
 * Resets canvas handlers. Should be called whenever the mode is changed
 */
paintr.toggleMode = function () {
  paintr.canvas.off('mouse:down');
  paintr.canvas.off('mouse:up');
  paintr.canvas.off('mouse:move');

  paintr.canvas.isDrawingMode = false;
  paintr.canvas.selection = false;
  paintr.canvas.forEachObject(function (obj) {
    obj.selectable = false;
  });
};

/**
 * Changes the pen color
 * @param color - color to be changed to
 */
paintr.setColor = function (color) {
  paintr.penColor = color;
  paintr.canvas.freeDrawingBrush.color = paintr.penColor;
};

/**
 * Cuts the currently selected objects
 */
paintr.cut = function () {
  if (paintr.canvas.getActiveGroup()) {
    paintr.clipboard = [];
    for (var i in paintr.canvas.getActiveGroup().objects) {
      paintr.clipboard[i] = paintr.canvas.getActiveGroup().objects[i];
    }
    paintr.canvas.getActiveGroup().forEachObject(function (o) {
      paintr.canvas.remove(o)
    });
    paintr.canvas.discardActiveGroup().renderAll();
  } else if (paintr.canvas.getActiveObject()) {
    paintr.clipboard = [paintr.canvas.getActiveObject()];
    paintr.canvas.remove(paintr.canvas.getActiveObject());
    paintr.canvas.discardActiveObject().renderAll();
  }
};

/**
 * Copies the currently selected objects to the clipboard
 */
paintr.copy = function () {
  if (paintr.canvas.getActiveGroup()) {
    for (var i in paintr.canvas.getActiveGroup().objects) {
      paintr.clipboard[i] = paintr.canvas.getActiveGroup().objects[i];
    }
  } else if (paintr.canvas.getActiveObject()) {
    paintr.clipboard = [paintr.canvas.getActiveObject()];
  }
};

/**
 * Pastes the objects that are currently on the clipboard
 */
paintr.paste = function () {
  if (paintr.clipboard.length > 1) {
    for (var i = 0; i < paintr.clipboard.length; i++) {
      var object = fabric.util.object.clone(paintr.clipboard[i]);
      paintr.canvas.add(object);
      object.setCoords();
      if (paintr.mode !== 'select') {
        object.selectable = false;
      }
    }
  } else if (paintr.clipboard.length > 0) {
    var object = fabric.util.object.clone(paintr.clipboard[0]);
    paintr.canvas.add(object);
    object.setCoords();
    if (paintr.mode !== 'select') {
      object.selectable = false;
    }
  }
  paintr.canvas.renderAll();
};

/**
 * Handler for undo and redo - called every time an object is modified
 * @param e - event
 */
paintr.undoRedoHandler = function (e) {
  var object = e.target;
  paintr.undo_redo_manager.insert(paintr.canvas);
};


/**
 * Handler for cutting and pasting
 * @param event
 */
paintr.onKeyDownHandler = function (event) {
  var key;
  if (window.event) {
    key = window.event.keyCode;
  } else {
    key = event.keyCode;
  }
  switch (key) {
    case 67: // Copy (Ctrl+C)
      if (event.ctrlKey) {
        event.preventDefault();
        paintr.copy();
      }
      break;
    case 88: // Cut (Ctrl+X)
      if (event.ctrlKey) {
        event.preventDefault();
        paintr.cut();
      }
      break;
    case 86: // Paste (Ctrl+V)
      if (event.ctrlKey) {
        event.preventDefault();
        paintr.paste();
      }
      break;
    case 89: // Redo (Ctrl+Y)
      if (event.ctrlKey) {
        event.preventDefault();
        if (paintr.undo_redo_manager.canRedo()) {
          var memento = paintr.undo_redo_manager.redo();
          paintr.canvas.loadFromJSON(memento.state);
        }
      }
      break;
    case 90: // Undo (Ctrl+Z)
      if (event.ctrlKey) {
        event.preventDefault();
        if (paintr.undo_redo_manager.canUndo()) {
          var memento = paintr.undo_redo_manager.undo();
          paintr.canvas.loadFromJSON(memento.state);
        }
      }
      break;
    default:
      break;
  }
};

/**
 * Clears the canvas of all objects
 */
paintr.clear = function () {
  paintr.canvas.clear();

};

/**
 * Sets the mode for drawing and highlights the mode
 * @param mode to be set
 */
paintr.setMode = function (mode) {
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
paintr.removeClass = function (elem, to_remove) {
  return elem.className.replace(to_remove, '');
};

/**
 * Save the current canvas
 */
paintr.saveCanvas = function () {
  var canvasName = prompt("Please enter your canvas name", "");
  for (var i = 0; i < paintr.savedCanvases.length; i++) {
    if (paintr.savedCanvases[i].name == canvasName) {
      canvasName = prompt("Name taken. Please enter an unused canvas name", "");
      i = -1;
    }
  }
  if (canvasName) {
    var serializedCanvas = JSON.stringify(paintr.canvas);
    paintr.savedCanvases.push({
      name: canvasName,
      canvas: serializedCanvas
    });
    paintr.loadCanvasList();
  } else {
    alert("Name not given. Save cancelled.");
  }
};

/**
 * Load the drop down menu with all saved canvases
 */
paintr.loadCanvasList = function () {
  var ul = document.getElementById("saved-list");
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }
  for (var i = 0; i < paintr.savedCanvases.length; i++) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.setAttribute("id", "canvas" + i);
    a.setAttribute("onclick", "paintr.loadCanvas(this.id)");
    a.appendChild(document.createTextNode(paintr.savedCanvases[i].name));
    li.appendChild(a);
    ul.appendChild(li);
  }
}

/**
 * Load the canvas that is selected from the drop down menu
 * @param canvasId The canvas ID of the serialized canvas to be loaded
 */
paintr.loadCanvas = function (canvasId) {
  paintr.canvas.loadFromJSON(paintr.savedCanvases[parseInt(canvasId.charAt(canvasId.length - 1))].canvas);
}

// Setup the canvas
window.onload = function () {
  paintr.canvas = new fabric.Canvas('canvas');
  paintr.undo_redo_manager.insert(paintr.canvas); // Store the blank canvas for undo redo
  paintr.canvas.on("object:modified", paintr.undoRedoHandler);
  paintr.canvas.backgroundColor = 'white';
  paintr.penColor = 'black';
  paintr.mode = 'select';
  paintr.canvas.freeDrawingBrush.width = 2;
  paintr.canvas.renderAll();

  // EVENT LISTENERS
  document.getElementById('line').addEventListener('click', paintr.drawLine);
  document.getElementById('freehand').addEventListener('click', paintr.drawFreehand);
  document.getElementById('select').addEventListener('click', paintr.select);
  document.getElementById('clear').addEventListener('click', paintr.clear);
  document.getElementById('rectangle').addEventListener('click', paintr.drawRect);
  document.getElementById('square').addEventListener('click', paintr.drawRect);
  document.getElementById('circle').addEventListener('click', paintr.drawCircle);
  document.getElementById('ellipse').addEventListener('click', paintr.drawEllipse);
  document.getElementById('polygon').addEventListener('click', paintr.drawPolygon);
  document.getElementById('save').addEventListener('click', paintr.saveCanvas);
  //$('.upper-canvas').bind('contextmenu', function () { return false; }); // couldn't get this to work with pure js
  document.onkeydown = paintr.onKeyDownHandler;
};