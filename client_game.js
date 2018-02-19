var ctx;
var interval;

var FPS = 60;
var box_spd = core.getBoxSpeed();
var box = lw:core.getDefaultBox();
var others = [];

var key = {left:false, right:false, up:false, down:false}

var last_update = 0;
var delta_time = 0;

var socket = io.connect('http://10.37.145.23:4200/');
socket.on('connect', function(data) {
   socket.emit('join', 'Hello World from client');
   main();
});

function main(){
  document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('keyup', handleKeyUp);

  ctx = document.getElementById('canvas').getContext("2d");

  last_update = Date.now();
  curInterval = setInterval(function(){Update();Draw(ctx);}, 1000/FPS)

  socket.emit('init_client', box);
}

function Update(){
  delta_time = Date.now() - last_update;
  last_update = Date.now();

  box = core.moveBox(box, key, delta_time);

  var pack = {moves: key, timestamp:Date.now()}
  console.log(pack);
  socket.emit('update', pack);
}
socket.on('all', function(data) {
    others = data;
});


function Draw(){
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "blue";
	ctx.fillRect(box.x, box.y, box.lw, box.lw);
  for(var i=0; i<others.length; i++){
    ctx.fillRect(others[i].x, others[i].y,
      others[i].lw, others[i].lw);
  }
}


var KEY_UP=38, KEY_DOWN=40, KEY_LEFT=37, KEY_RIGHT=39;
function handleKeyDown(evt) {
  evt.preventDefault();
  if ( evt.keyCode == KEY_LEFT )
    key.left = true;
  if ( evt.keyCode == KEY_RIGHT )
    key.right = true;
  if ( evt.keyCode == KEY_UP )
    key.up = true;
  if ( evt.keyCode == KEY_DOWN )
    key.down = true;

}
function handleKeyUp(evt){
  evt.preventDefault();
  if ( evt.keyCode == KEY_LEFT )
    key.left = false;
  if ( evt.keyCode == KEY_RIGHT )
    key.right = false;
  if ( evt.keyCode == KEY_UP )
    key.up = false;
  if ( evt.keyCode == KEY_DOWN )
    key.down = false;
}
