var ctx;
var interval;

var FPS = 60;
var box = {x:20, y:20, lw:20, spd:2};
var others = [];

var key = {left:false, right:false, up:false, down:false}



var socket = io.connect('http://10.24.222.132:4200/');
socket.on('connect', function(data) {
   socket.emit('join', 'Hello World from client');
   main();
});

function main(){
  document.addEventListener('keydown', handleKeyDown); //these are key control set up code.
	document.addEventListener('keyup', handleKeyUp);

  ctx = document.getElementById('canvas').getContext("2d");

  curInterval = setInterval(function(){Update();Draw(ctx);}, 1000/FPS)

  socket.emit('init_client', box);
}

function Update(){
  if(key.left) box.x-=box.spd;
  if(key.right) box.x+=box.spd;
  if(key.up) box.y-=box.spd;
  if(key.down) box.y+=box.spd;

  socket.emit('update', box);
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



// socket.on('broad', function(data) {
//         $('#future').append(data+ "<br/>");
//   });
//
// $('form').submit(function(e){
//     e.preventDefault();
//     var message = $('#chat_input').val();
//     socket.emit('messages', message);
 //  $('chat_input').val("");
// });
