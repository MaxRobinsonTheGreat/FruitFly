/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/client/client_game.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/client/client_game.js":
/*!***********************************!*\
  !*** ./src/client/client_game.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("//client_game.js\r\n\r\n\r\nconst game_core = __webpack_require__(/*! ../shared/game_core */ \"./src/shared/game_core.js\");\r\nconst Sprite = __webpack_require__(/*! ./rendering/sprite */ \"./src/client/rendering/sprite.js\");\r\nconst Player = __webpack_require__(/*! ../shared/player */ \"./src/shared/player.js\");\r\nconst image_container = __webpack_require__(/*! ./rendering/image_container */ \"./src/client/rendering/image_container.js\").getImageContainer();\r\n\r\nvar interval;\r\n\r\nvar FPS = 60;\r\nvar mouse_x = 0;\r\nvar mouse_y = 0;\r\n\r\nvar main_player = new Player();\r\nmain_player.sprite = new Sprite(\"Alien\", main_player.dimensions, 2);\r\n\r\nvar others = [];\r\n\r\nvar self_index = -1;\r\n\r\nvar last_update = 0;\r\nvar delta_time = 0;\r\n\r\nvar update_queue = [];\r\nvar oldest_update;\r\nvar update_delay = 100; //millis\r\nvar correction_counter = 0;\r\n\r\n// set to true if you want to see the most recent server's version of the main players box\r\nvar draw_self_debugger = false;\r\n\r\n// connects at the ip addess and port of the page\r\nvar socket = io.connect();\r\n\r\nsocket.on('connect', function(data) {\r\n   main();\r\n});\r\n\r\nfunction intializeCanvasControls() {\r\n  document.addEventListener('keydown', checkKeyDown);\r\n\tdocument.addEventListener('keyup', checkKeyUp);\r\n}\r\n\r\nfunction main(){\r\n  intializeCanvasControls();\r\n\r\n  last_update = Date.now();\r\n  interval = setInterval(function(){Update();Draw(ctx);}, 1000/FPS);\r\n\r\n  //make sure the default position is not colliding with anything\r\n  socket.emit('init_client', main_player.location);\r\n}\r\n\r\n//        --- UPDATE ---\r\nfunction Update(){\r\n  updateDeltaTime();\r\n\r\n  updatePlayerPosition();\r\n\r\n  updateOthers();\r\n\r\n  socket.emit('move', {loc: main_player.location, cc: correction_counter});\r\n}\r\n\r\nfunction updateDeltaTime() {\r\n  delta_time = Date.now() - last_update;\r\n  last_update = Date.now();\r\n}\r\n\r\nfunction updatePlayerPosition() {\r\n  var old_loc = main_player.move(delta_time);\r\n\r\n  if(game_core.anyIntersect(main_player, others, self_index)){\r\n    main_player.location = old_loc;\r\n  }\r\n\r\n  var boundry_result = game_core.checkBoundry(main_player.location, main_player.dimensions);\r\n  main_player.location = boundry_result.loc;\r\n\r\n  main_player.setOrientation(mouse_x, mouse_y);\r\n}\r\n\r\nfunction updateOthers(){\r\n  if(oldest_update === undefined || update_queue === undefined) return;\r\n\r\n\r\n  setState(oldest_update.state);\r\n\r\n  if(update_queue.length === 0) return;\r\n\r\n  let current_time = Date.now();\r\n\r\n  for(var i in others){\r\n    if (i >= update_queue[0].state.locations.length)\r\n      break;\r\n    if(i != self_index)\r\n      interpolateEntityAt(i, current_time);\r\n    else{\r\n      var index = update_queue[update_queue.length-1].state.self_index;\r\n      others[i].location = update_queue[update_queue.length-1].state.locations[index];\r\n    }\r\n  }\r\n\r\n\r\n  while(update_queue.length > 0 && current_time-update_queue[0].timestamp >= update_delay){\r\n    oldest_update = update_queue.shift();\r\n  }\r\n}\r\n\r\n\r\nfunction interpolateEntityAt(i, current_time){\r\n  let startloc = oldest_update.state.locations[i];\r\n  let endloc = update_queue[0].state.locations[i];\r\n  let time_dif = update_queue[0].timestamp - oldest_update.timestamp;\r\n\r\n  // we divide by time_dif, so make sure it's not zero\r\n  if(time_dif === 0) return;\r\n\r\n  others[i].location.x += ( ((endloc.x - startloc.x) / (time_dif))*\r\n                 (current_time - update_delay - oldest_update.timestamp));\r\n\r\n  others[i].location.y += ( ((endloc.y - startloc.y) / (time_dif))*\r\n                (current_time - update_delay - oldest_update.timestamp));\r\n}\r\n\r\nfunction setState(state){\r\n  if(others.length !== state.locations.length){\r\n    others = []; //clear others[]\r\n\r\n    for(var i in state.locations){\r\n\r\n      others.push({\r\n        location: state.locations[i],\r\n        dimensions: game_core.getDimensionsObj(100, 50),\r\n      });\r\n\r\n      var s = new Sprite(\"Person\", others[i].dimensions, .5);\r\n\r\n      others[i].sprite = s;\r\n    }\r\n  }\r\n  else{\r\n    for(var i in others){\r\n      others[i].location = state.locations[i];\r\n    }\r\n  }\r\n\r\n  self_index = state.self_index;\r\n}\r\n\r\n\r\n//        --- SERVER LISTENERS ---\r\n/* API 'all'\r\n   input: {locations: [{x,y},{x,y},...]}\r\n    - pushes the new state into the update queue\r\n*/\r\nsocket.on('all', function(state) {\r\n    if(oldest_update === undefined){\r\n      setState(state);\r\n      oldest_update = {state, timestamp: Date.now()};\r\n    }\r\n    else{\r\n      update_queue.push({state, timestamp: Date.now()});\r\n    }\r\n\r\n});\r\n/* API 'correction'\r\n   input: {x,y}\r\n    - pushes the new state into the update queue\r\n*/\r\nsocket.on('correction', function(pack){\r\n  if(pack.cc !== correction_counter) return;\r\n\r\n  main_player.location = pack.corrected_location;\r\n  correction_counter++;\r\n});\r\n\r\n\r\n\r\n//      --- DRAW ---\r\nfunction Draw(){\r\n  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);\r\n\r\n\tdrawBox(main_player, \"blue\");\r\n  main_player.sprite.drawDirectional(main_player.location.x, main_player.location.y, main_player.orientation);\r\n\r\n  for(var i in others){\r\n    if (i != self_index || draw_self_debugger && i < others.length){\r\n       drawBox(others[i], \"red\");\r\n       others[i].sprite.draw(others[i].location.x, others[i].location.y);\r\n    }\r\n  }\r\n  ctx.beginPath();\r\n  ctx.moveTo(main_player.center.x, main_player.center.y);\r\n  ctx.lineTo(mouse_x, mouse_y);\r\n  ctx.stroke();\r\n}\r\nfunction drawBox(box, color){\r\n  ctx.fillStyle = color;\r\n  ctx.fillRect(box.location.x, box.location.y,\r\n               box.dimensions.w, box.dimensions.h);\r\n}\r\n\r\n\r\n\r\n//      --- CONTROL LISTENERS ---\r\nconst KEY_UP=87, KEY_DOWN=83, KEY_LEFT=65, KEY_RIGHT=68;\r\nfunction checkKeyDown(evt) {\r\n  evt.preventDefault();\r\n  if (evt.keyCode === KEY_LEFT)\r\n    main_player.commands.left = true;\r\n  if (evt.keyCode === KEY_RIGHT)\r\n    main_player.commands.right = true;\r\n  if (evt.keyCode === KEY_UP)\r\n    main_player.commands.up = true;\r\n  if (evt.keyCode === KEY_DOWN)\r\n    main_player.commands.down = true;\r\n}\r\n\r\nfunction checkKeyUp(evt){\r\n  evt.preventDefault();\r\n  if (evt.keyCode === KEY_LEFT)\r\n    main_player.commands.left = false;\r\n  if (evt.keyCode === KEY_RIGHT)\r\n    main_player.commands.right = false;\r\n  if (evt.keyCode === KEY_UP)\r\n    main_player.commands.up = false;\r\n  if (evt.keyCode === KEY_DOWN)\r\n    main_player.commands.down = false;\r\n}\r\n\r\n$(\"body\").mousemove(function(e) {\r\n  var rect = canvas.getBoundingClientRect();\r\n  mouse_x = e.clientX - rect.left;\r\n  mouse_y = e.clientY - rect.top;\r\n});\r\n\n\n//# sourceURL=webpack:///./src/client/client_game.js?");

/***/ }),

/***/ "./src/client/rendering/image_container.js":
/*!*************************************************!*\
  !*** ./src/client/rendering/image_container.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const image_list = __webpack_require__(/*! ./image_list */ \"./src/client/rendering/image_list.js\");\r\n\r\nvar image_container = module.exports = {\r\n\r\n  getImageContainer: function() {\r\n    if(this.instance) {\r\n      return this.instance;\r\n    }\r\n    else {\r\n      this.image_map = new Map();\r\n      this.loaded_image_counter = 0;\r\n      this.outdated_sprites = [];\r\n      this.loadImages();\r\n    }\r\n  },\r\n\r\n\tloadImages: function(){\r\n\t\tfor(let info of image_list){\r\n\r\n\t\t\tlet img = new Image();\r\n\r\n\t\t\timg.onload = () => {\r\n\t\t\t\tthis.imageLoaded();\r\n\t\t\t}\r\n\r\n\t\t\timg.src = \"./img/\" + info.src;\r\n\t\t\tinfo.img = img;\r\n\r\n\t\t\tthis.image_map.set(info.title, info);\r\n\t\t}\r\n\t\timages_info = [];\r\n\t},\r\n\r\n\timageLoaded: function(){\r\n\t\t// is this the last image to load?\r\n\t\tif(this.loaded_image_counter++ != images_info.length) return;\r\n\t\t// at this point we know that all images have been loaded\r\n\r\n\t\tthis.updateSprites();\r\n\t},\r\n\r\n\tupdateSprites: function(){\r\n\t\tfor(let s of this.outdated_sprites){\r\n\t\t\ts.imageFinished();\r\n\t\t}\r\n\t},\r\n\r\n\tget: function(title){\r\n\t\treturn this.image_map.get(title);\r\n\t},\r\n\r\n  pushOutDated: function(sprite){\r\n    this.outdated_sprites.push(sprite);\r\n  }\r\n}\r\n\n\n//# sourceURL=webpack:///./src/client/rendering/image_container.js?");

/***/ }),

/***/ "./src/client/rendering/image_list.js":
/*!********************************************!*\
  !*** ./src/client/rendering/image_list.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\r\nmodule.exports = [\r\n\t{\r\n\t\ttitle: \"Alien\",\r\n\t\tsrc: \"Alien.png\",\r\n\t\ttype: \"sprite\",\r\n\t\trows: 4,\r\n\t\tcols: 4,\r\n\t\tfps: 5\r\n\t},\r\n\t{\r\n\t\ttitle: \"Person\",\r\n\t\tsrc: \"character.png\",\r\n\t\ttype: \"sprite\",\r\n\t\trows: 2,\r\n\t\tcols: 8,\r\n\t\tfps: 10\r\n\t},\r\n\t{\r\n\t\ttitle: \"Pixels\",\r\n\t\tsrc: \"movers.png\",\r\n\t\ttype: \"sprite\",\r\n\t\trows: 3,\r\n\t\tcols: 2,\r\n\t\tfps: 4\r\n\t}\r\n]\r\n\n\n//# sourceURL=webpack:///./src/client/rendering/image_list.js?");

/***/ }),

/***/ "./src/client/rendering/sprite.js":
/*!****************************************!*\
  !*** ./src/client/rendering/sprite.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\r\n\r\nconst image_container = __webpack_require__(/*! ./image_container */ \"./src/client/rendering/image_container.js\");\r\n\r\nmodule.exports = class {\r\n\r\n\tconstructor(title, container, resize_factor){\r\n\t\tlet s = image_container.get(title);\r\n\r\n\t\tthis.container = container;\r\n\r\n\t\tthis.resize_factor = resize_factor;\r\n\r\n\t\tthis.rows = s.rows;\r\n\t\tthis.cols = s.cols;\r\n\t\tthis.ctx = s.ctx;\r\n\t\tthis.wait_time = 1000/s.fps;\r\n\t\tthis.img = s.img;\r\n\r\n\t\tthis.cur_frame = 0;\r\n\t\tthis.cur_row = 0;\r\n\t\tthis.srcX = 0;\r\n\t\tthis.srcY = 0;\r\n\t\tthis.last_update_time = Date.now();\r\n\t\tthis.off_set_x = 0;\r\n\t\tthis.off_set_y = 0;\r\n\r\n\t\tif(!this.img.complete){\r\n\t\t\tconsole.log(\"Image \\\"\"+title+\"\\\" was NOT loaded in time\");\r\n\t\t\timage_container.pushOutDated(this);\r\n\t\t\tthis.title = title//delete this var when the error has been found\r\n\t\t}\r\n\t\telse{\r\n\t\t\tconsole.log(\"Image \\\"\"+title+\"\\\" was loaded in time\");\r\n\t\t\tthis.frame_width = this.img.width/this.cols;\r\n\t\t\tthis.frame_height = this.img.height/this.rows;\r\n\r\n\t\t\tthis.width = this.frame_width;\r\n\t\t\tthis.height = this.frame_height;\r\n\t\t\tif(this.resize_factor) {\r\n\t\t\t\tthis.resizeBy(this.resize_factor);\r\n\t\t\t}\r\n\t\t\tthis.center();\r\n\t\t\tconsole.log(\"Image \\\"\"+title+\"\\\" (w, h):(\"+this.frame_width+\", \"+this.frame_height+\")\");\r\n\t\t}\r\n\t}\r\n\r\n\timageFinished(){\r\n\t\tconsole.log(\"Image \\\"\"+this.title+\"\\\" was loaded after the sprite was instantiated\");\r\n\r\n\t\tif(!this.frame_width){\r\n\t\t\tthis.frame_width = this.img.width/this.cols;\r\n\t\t\tthis.frame_height = this.img.height/this.rows;\r\n\t\t}\r\n\r\n\t\tthis.width = this.frame_width;\r\n\t\tthis.height = this.frame_height;\r\n\r\n\t\tif(this.resize_factor){\r\n\t\t\tthis.resizeBy(this.resize_factor);\r\n\t\t}\r\n\t\tif(this.container){\r\n\t\t\tthis.center();\r\n\t\t}\r\n\t\tconsole.log(\"Image \\\"\"+this.title+\"\\\" (w, h):(\"+this.frame_width+\", \"+this.frame_height+\")\");\r\n\t}\r\n\r\n\r\n\r\n\tresizeTo(h, w){\r\n\t\tthis.width = w;\r\n\t\tthis.height = h;\r\n\t}\r\n\r\n\tresizeBy(factor){\r\n\t\tthis.width = this.frame_width*factor;\r\n\t\tthis.height = this.frame_height*factor;\r\n\t\tMath.round(this.height);\r\n\t\tMath.round(this.width);\r\n\t\tthis.resize_factor = factor;\r\n\t}\r\n\r\n\tcenter(){\r\n\t\tthis.off_set_x = this.container.w/2 - this.width/2;\r\n\t\tthis.off_set_y = this.container.h/2 - this.height/2;\r\n\t\t// this.container = {h, w};\r\n\t}\r\n\r\n\tsetRow(r){\r\n\t\tif(r < 0 || r >= this.rows) return;\r\n\t\tthis.cur_row = r;\r\n\t\tthis.srcY = this.cur_row * this.frame_height;\r\n\t}\r\n\r\n\tupdateFrame(){\r\n\t\tvar delta_time = Date.now()-this.last_update_time;\r\n\t\tif(delta_time < this.wait_time)\r\n\t\t\treturn;\r\n\t\tthis.last_update_time = Date.now();\r\n\r\n\t\tif(++this.cur_frame >= this.cols){\r\n\t\t\tthis.cur_frame = 0;\r\n\t\t}\r\n\r\n\t\t//Calculating the x coordinate for spritesheet\r\n\t\tthis.srcX = this.cur_frame * this.frame_width;\r\n\t}\r\n\r\n\tdrawDirectional(x, y, theta){\r\n\r\n\t\tif(theta >= 315 || theta <= 45)\r\n\t\t\tthis.setRow(2); //right\r\n\t\telse if(theta > 45 && theta <= 135)\r\n\t\t\tthis.setRow(0); //down\r\n\t\telse if(theta > 135 && theta <= 225)\r\n\t\t\tthis.setRow(1); //left\r\n\t\telse\r\n\t\t\tthis.setRow(3); //up\r\n\t\tthis.draw(x, y);\r\n\t}\r\n\r\n\tdraw(x, y){\r\n\t\tif(!this.img.complete) return;\r\n\r\n\t\tthis.updateFrame();\r\n\t\tctx.drawImage(this.img,this.srcX,this.srcY,\r\n\t\tthis.frame_width,this.frame_height,\r\n\t\tx+this.off_set_x,y+this.off_set_y,\r\n\t\tthis.width,this.height);\r\n\t}\r\n\r\n\tdrawStatic(x, y, r, c){\r\n\t\tif(!this.img.complete) return;\r\n\r\n\t\tthis.srcX = c * this.frame_width;\r\n\t\tthis.srcY = r * this.frame_height;\r\n\r\n\t\tctx.drawImage(this.img,this.srcX,this.srcY,\r\n\t\tthis.frame_width,this.frame_height,\r\n\t\tx+this.off_set_x,y+this.off_set_y,\r\n\t\tthis.width,this.height);\r\n\t}\r\n}\r\n\n\n//# sourceURL=webpack:///./src/client/rendering/sprite.js?");

/***/ }),

/***/ "./src/shared/game_core.js":
/*!*********************************!*\
  !*** ./src/shared/game_core.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("/*\r\n    The game core contains code that is shared between the server and the client, such as:\r\n        -default values\r\n        -classes/object structures\r\n        -behavior functions\r\n\r\n    This avoids code duplication and ensures that the code is EXACTLY the same between the server and client where it matters.\r\n    It's important to note that no DATA is being shared (or even could be shared) through this file, only functionality.\r\n    The server and client(s) have their own copies of this file and cannot communicate through the core.\r\n*/\r\nconst Player = __webpack_require__(/*! ./player */ \"./src/shared/player.js\");\r\n\r\nmodule.exports = {\r\n\r\n  getLocationObj: function(x, y) {\r\n    return {x, y};\r\n  },\r\n  getDimensionsObj: function(h, w) {\r\n    return {h, w};\r\n  },\r\n  getCommandsObj: function(){\r\n    return {left: false, right: false, up: false, down: false};\r\n  },\r\n\r\n  checkBoundry: function(loc, dim){\r\n    var was_correction = false;\r\n    if(loc.x + dim.w > 600) {loc.x = 600-dim.w;was_correction = true}\r\n    if(loc.y + dim.h > 400) {loc.y = 400-dim.h;was_correction = true}\r\n    if(loc.x < 0) {loc.x = 0;was_correction = true}\r\n    if(loc.y < 0) {loc.y = 0;was_correction = true}\r\n    return {loc, was_correction};\r\n  },\r\n\r\n  checkIntersect: function(obj1, obj2){\r\n    let loc1 = obj1.location;\r\n    let dim1 = obj1.dimensions;\r\n    let loc2 = obj2.location;\r\n    let dim2 = obj2.dimensions;\r\n\r\n    return (loc1.x+dim1.w > loc2.x && loc1.x < loc2.x+dim2.w &&\r\n            loc1.y+dim1.h > loc2.y && loc1.y < loc2.y+dim2.h)\r\n  },\r\n\r\n\r\n  anyIntersect: function(primary, list, to_ignore) {\r\n      for(i in list){\r\n        if(i!=to_ignore && this.checkIntersect(primary, list[i])){\r\n          return true;\r\n        }\r\n      }\r\n      return false;\r\n  },\r\n\r\n  connection: function() {\r\n      return \"core module connected\";\r\n  }\r\n}\r\n\n\n//# sourceURL=webpack:///./src/shared/game_core.js?");

/***/ }),

/***/ "./src/shared/player.js":
/*!******************************!*\
  !*** ./src/shared/player.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = class {\r\n  constructor() {\r\n    this.location = {x:20, y:20};\r\n    this.dimensions = {h:100, w:50};\r\n    this.center = this.getCenter();\r\n    this.commands = {left: false, right: false, up: false, down: false};\r\n    this.speed = 100; //pixels per second\r\n    this.last_update = Date.now();\r\n    this.orientation = 0;\r\n  }\r\n\r\n  getCenter(){\r\n    let x = this.location.x + this.dimensions.w / 2;\r\n    let y = this.location.y + this.dimensions.h / 2;\r\n    return {x, y}\r\n  }\r\n\r\n  move(time){\r\n    var old_loc = Object.assign({}, this.location);\r\n    var dist = (time/1000)*this.speed;\r\n    if(this.commands.left) this.location.x-=dist;\r\n    if(this.commands.right) this.location.x+=dist;\r\n    if(this.commands.up) this.location.y-=dist;\r\n    if(this.commands.down) this.location.y+=dist;\r\n    return(old_loc);\r\n  }\r\n\r\n  setOrientation(mouse_x, mouse_y){\r\n    this.center = this.getCenter();\r\n\r\n    let adjacent = mouse_x - this.center.x;\r\n    let opposite = mouse_y - this.center.y;\r\n\r\n    let rad2deg = 180/Math.PI;\r\n    if (adjacent === 0) {\r\n      return;\r\n    }\r\n    else if (adjacent > 0 && opposite < 0) { //First Quadrant\r\n      let orientation = Math.atan(-opposite/-adjacent) * rad2deg;\r\n      this.orientation = orientation + 360;\r\n    }\r\n    else if (adjacent > 0 && opposite > 0) { //Second Quadrant\r\n      this.orientation = Math.atan(opposite/adjacent) * rad2deg;\r\n    }\r\n    else if (adjacent < 0 && opposite > 0) { //Third Quadrant\r\n      let orientation = Math.atan(opposite/adjacent) * rad2deg;\r\n      this.orientation = orientation + 180;\r\n    }\r\n    else if (adjacent < 0 && opposite < 0) { //Fourth Quadrant\r\n      let orientation = Math.atan(opposite/adjacent) * rad2deg;\r\n      this.orientation = orientation + 180;\r\n    }\r\n  }\r\n}\r\n\n\n//# sourceURL=webpack:///./src/shared/player.js?");

/***/ })

/******/ });