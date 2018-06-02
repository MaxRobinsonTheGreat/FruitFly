'use strict'

class Sprite{

	constructor(s){
		this.rows = s.rows;
		this.cols = s.cols;
		this.ctx = s.ctx;
		this.wait_time = 1000/s.fps;
		this.img = s.img;

		this.cur_frame = 0;
		this.cur_row = 0;
		this.srcX = 0;
		this.srcY = 0;
		this.last_update_time = Date.now();
		this.Xoffset = 0;
		this.Yoffset = 0;

		if(!this.img.complete){
			image_container.outdated_sprites.push(this);
		}
		else{
			this.width = this.img.width/this.cols;
			this.height = this.img.height/this.rows;

			this.rescaled_width = this.width;
			this.rescaled_height = this.height;
		}
	}

	imageFinished(){
		if(!this.width){
			this.width = this.img.width/this.cols;
			this.height = this.img.height/this.rows;
		}

		this.rescaled_width = this.width;
		this.rescaled_height = this.height;

		if(this.resize_factor){
			this.resizeBy(this.resize_factor);
		}
		if(this.container){
			this.center(this.container.h, this.container.w)
		}
	}



	resizeTo(h, w){
		this.rescaled_width = w;
		this.rescaled_height = h;
	}

	resizeBy(factor){
		this.rescaled_width*=factor;
		this.rescaled_height*=factor;
		Math.round(this.rescaled_height);
		Math.round(this.rescaled_width);
		this.resize_factor = factor;
	}

	center(h, w){
		this.Xoffset = w/2 - this.rescaled_width/2;
		this.Yoffset = h/2 - this.rescaled_height/2;
		this.container = {h, w};
	}

	setRow(r){
		if(r < 0 || r >= this.rows) return;
		this.cur_row = r;
		this.srcY = this.cur_row * this.height;
	}

	updateFrame(){
		var delta_time = Date.now()-this.last_update_time;
		if(delta_time < this.wait_time)
			return;
		this.last_update_time = Date.now();

		if(++this.cur_frame >= this.cols){
			this.cur_frame = 0;
		}

		//Calculating the x coordinate for spritesheet
		this.srcX = this.cur_frame * this.width;
	}

	draw(x, y){
		if(!this.img.complete) return;

		this.updateFrame();
		ctx.drawImage(this.img,this.srcX,this.srcY,
		this.width,this.height,
		x+this.Xoffset,y+this.Yoffset,
		this.rescaled_width,this.rescaled_height);
	}

	drawStatic(x, y, r, c){
		if(!this.img.complete) return;

		this.srcX = c * this.width;
		this.srcY = r * this.height;

		ctx.drawImage(this.img,this.srcX,this.srcY,
		this.width,this.height,
		x+this.Xoffset,y+this.Yoffset,
		this.rescaled_width,this.rescaled_height);
	}
}
