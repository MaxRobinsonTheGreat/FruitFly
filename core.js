(function(exports){


    var box_spd = 100; //px per second
    var default_box = {x:20, y:20, lw:20}; //intitial box pos/size

    exports.getBoxSpeed = function(){return box_spd;};
    exports.getDefaultBox = function(){return {x: 20, y:20, lw:20};};

    exports.moveBox = function(box, key, time){
      dist = (time/1000)*box_spd;
      if(key.left) box.x-=dist;
      if(key.right) box.x+=dist;
      if(key.up) box.y-=dist;
      if(key.down) box.y+=dist;
      return(box);
    }

    exports.checkBoundry = function(box){
      var was_correction = false;
      if(box.x + box.lw > 600) {box.x = 600-box.lw;was_correction = true}
      if(box.y + box.lw > 400) {box.y = 400-box.lw;was_correction = true}
      if(box.x < 0) {box.x = 0;was_correction = true}
      if(box.y < 0) {box.y = 0;was_correction = true}
      return {box, was_correction};
    }

    exports.connection = function(){
        return "core module connected";
    };



})(typeof exports === 'undefined'? this['core']={}: exports);
