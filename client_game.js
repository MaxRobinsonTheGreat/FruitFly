var ctx;
var interval;

var FPS = 60;
var box_spd = core.getBoxSpeed();
var box = core.getDefaultBox();
var others = [];

var key = {left:false, right:false, up:false, down:false}

var last_update = 0;
var delta_time = 0;

var socket = io.connect('http://192.168.16.87:4200/');
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
  curInterval = setInterval(function(){Update();Draw(ctx);}, 1000/FPS)

  socket.emit('init_client', box);
}

function updateDeltaTime() {
  delta_time = Date.now() - last_update;
  last_update = Date.now();
}

function updateBoxPositions() {
  box = core.moveBox(box, key, delta_time);
  var boundry_result = core.checkBoundry(box);
  box = boundry_result.box;
  if(boundry_result.was_correction){
    console.log(boundry_result.box);
    prediction_queue.push(boundry_result.box);
  }
}

//This looks really similar to sendStopToClients. Can we combine them?
// function sendMoveToClients() {
//   var pack = {moves: key, timestamp:Date.now()};
//   socket.emit('move', pack);
// }


//Does Update and the three socket functions represent a bigger idea?
function Update(){
  updateDeltaTime();

  updateBoxPositions();

  emitToServer('move');
}
socket.on('all', function(data) {
    others = data;
    // console.log(data);
});
socket.on('correction', function(new_box){
  box = new_box;
  console.log("correction");
});
socket.on('boundry', function(new_box){
  // var prediction = prediction_queue.shift();
  // //console.log(new_box +", "+ prediction);
  // if(prediction !== new_box){
  //   box = new_box;
  // }
});


function Draw(){
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "blue";
	ctx.fillRect(box.x, box.y, box.lw, box.lw);
  ctx.fillStyle = "red";
  for(var i=0; i < others.length; i++){
    ctx.fillRect(others[i].box.x, others[i].box.y,
      others[i].box.lw, others[i].box.lw);
  }
}


var KEY_UP=38, KEY_DOWN=40, KEY_LEFT=37, KEY_RIGHT=39;
function checkKeyDown(evt) {
  evt.preventDefault();
  if (evt.keyCode == KEY_UP)
    key.left = true;
  if (evt.keyCode == KEY_RIGHT)
    key.right = true;
  if (evt.keyCode == KEY_UP)
    key.up = true;
  if (evt.keyCode == KEY_DOWN)
    key.down = true;
}

//Looks really similar to sendMoveToClients. Can we combine them?
//Used to be sendStopToClients (remove comment)
function emitToServer(emitName) {
  var pack = {box: box, moves: key, timestamp:Date.now()};
  socket.emit(emitName, pack);
}

function checkKeyUp(evt){
  evt.preventDefault();
  if (evt.keyCode == KEY_LEFT)
    key.left = false;
  if (evt.keyCode == KEY_RIGHT)
    key.right = false;
  if (evt.keyCode == KEY_UP)
    key.up = false;
  if (evt.keyCode == KEY_DOWN)
    key.down = false;

  emitToServer('stop');
}
