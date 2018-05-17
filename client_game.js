//client_game.js

'use strict';

var ctx;
var interval;

var FPS = 60;

var main_player = new game_core.Player();
var others = [];

var self_index = -1;

var last_update = 0;
var delta_time = 0;

var update_queue = [];
var oldest_update;
var update_delay = 100; //millis

// set to true if you want to see the most recent server's version of the main players box
var draw_self_debugger = false;

// connects at the ip addess and port of the page
var socket = io.connect();

socket.on('connect', function(data) {
   socket.emit('join', 'Hello World from client');
   main();
});

function intializeCanvasControls() {
  document.addEventListener('keydown', checkKeyDown);
	document.addEventListener('keyup', checkKeyUp);

  ctx = document.getElementById('canvas').getContext("2d");
}

function main(){
  intializeCanvasControls();

  last_update = Date.now();
  interval = setInterval(function(){Update();Draw(ctx);}, 1000/FPS);

  //make sure the default position is not collideing with anything
  socket.emit('init_client', main_player.location);
}

//        --- UPDATE ---
function Update(){
  updateDeltaTime();

  updateOthers();

  updatePlayerPosition();

  // socket.emit('move', main_player.commands);
}

function updateDeltaTime() {
  delta_time = Date.now() - last_update;
  last_update = Date.now();
}

function updatePlayerPosition() {
  var old_loc = main_player.move(delta_time);

  if(game_core.anyIntersect(main_player, others, self_index)){
    main_player.location = old_loc;
  }

  var boundry_result = game_core.checkBoundry(main_player.location, main_player.dimensions);
  main_player.location = boundry_result.loc;
}

function updateOthers(){
  if(oldest_update === undefined || update_queue === undefined) return;


  setState(oldest_update.state);

  if(update_queue.length === 0) return;

  let current_time = Date.now();

  for(var i in others){
    if (i >= update_queue[0].state.locations.length)
      break;
    if(i != self_index)
      interpolateEntityAt(i, current_time);
    else{
      var index = update_queue[update_queue.length-1].state.self_index;
      others[i].location = update_queue[update_queue.length-1].state.locations[index];
    }
  }


  while(update_queue.length !== 0 && current_time-update_queue[0].timestamp >= update_delay){
    oldest_update = update_queue.shift();
  }
}


function interpolateEntityAt(i, current_time){
  let startloc = oldest_update.state.locations[i];
  let endloc = update_queue[0].state.locations[i];
  let time_dif = update_queue[0].timestamp - oldest_update.timestamp;

  // we divide by time_dif, so make sure it's not zero
  if(time_dif === 0) return;

  others[i].location.x += ( ((endloc.x - startloc.x) / (time_dif))*
                 (current_time - update_delay - oldest_update.timestamp));

  others[i].location.y += ( ((endloc.y - startloc.y) / (time_dif))*
                (current_time - update_delay - oldest_update.timestamp));
}

function setState(state){
  if(others.length !== state.locations.length){
    others = []; //clear others[]

    for(var i in state.locations){
      others.push({
        location: state.locations[i],
        dimensions: game_core.getDimensionsObj(20, 20)
      });
    }
  }
  else{
    for(var i in others){
      others[i].location = state.locations[i];
    }
  }

  self_index = state.self_index;
}


//        --- SERVER LISTENERS ---
/* API 'all'
   input: {locations: [{x,y},{x,y},...]}
    - pushes the new state into the update queue
*/
socket.on('all', function(state) {
    if(oldest_update === undefined){
      setState(state);
      oldest_update = {state, timestamp: Date.now()};
    }
    else{
      update_queue.push({state, timestamp: Date.now()});
    }

});
/* API 'correction'
   input: {x,y}
    - pushes the new state into the update queue
*/
socket.on('correction', function(corrected_location){
  main_player.location = corrected_location;
});



//      --- DRAW ---
function Draw(){
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	drawBox(main_player, "blue");

  for(var i in others){
    if (i != self_index || draw_self_debugger && i < others.length){
       drawBox(others[i], "red");
    }
  }
}
function drawBox(box, color){
  ctx.fillStyle = color;
  ctx.fillRect(box.location.x, box.location.y,
               box.dimensions.l, box.dimensions.w);
}



//      --- CONTROL LISTENERS ---
var KEY_UP=38, KEY_DOWN=40, KEY_LEFT=37, KEY_RIGHT=39;
function checkKeyDown(evt) {
  evt.preventDefault();
  if (evt.keyCode == KEY_LEFT)
    main_player.commands.left = true;
  if (evt.keyCode == KEY_RIGHT)
    main_player.commands.right = true;
  if (evt.keyCode == KEY_UP)
    main_player.commands.up = true;
  if (evt.keyCode == KEY_DOWN)
    main_player.commands.down = true;

  socket.emit('move', main_player.commands);
}

function checkKeyUp(evt){
  evt.preventDefault();
  if (evt.keyCode == KEY_LEFT)
    main_player.commands.left = false;
  if (evt.keyCode == KEY_RIGHT)
    main_player.commands.right = false;
  if (evt.keyCode == KEY_UP)
    main_player.commands.up = false;
  if (evt.keyCode == KEY_DOWN)
    main_player.commands.down = false;

  socket.emit('move', main_player.commands);
  socket.emit('stop', main_player.location);
}
