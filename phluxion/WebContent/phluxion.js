/**
 * "Pluxion block popping game by WhosPlayin? Copyright 2017 by SagePost,
 * Inc.
 */
var levels=[{
	n: 100,
	time: 60,
	colors: 3
},{
	n:100,
	time: 60,
	colors: 4
},{
	n:100,
	time: 100,
	colors: 4
},{
	n:100,
	time: 100,
	colors: 5
},{
	n:100,
	time: 120,
	colors: 6
},{
	n:75,
	time: 120,
	colors: 6
},{
	n:50,
	time: 150,
	colors: 7
},{
	n:200,
	time: 150,
	colors: 5
},{
	n:300,
	time: 150,
	colors: 4
}];
var colors=["#cc0000","#00cc33","#3333ff","#ffff33","#101010","#00d6d6","#990099","#ff6633"];
var specials=[
	{
		name: "colorbomb",
	 	class: "colorbomb",
	 	freq: 80,
	 	symbol: "X",
	 	droppable: true,
	 	clickable: true,
	 	points: 50
	},{
		name: "joker",
		class: "wild",
		freq: 30,
		symbol: "O",
		droppable: true,
		clickable: false,
		points: 5
	},{
		name: "bomb",
		class: "bomb",
		freq: 30,
		symbol: "B",
		droppable: true,
		clickable: true,
		pattern: 8,
		points: 10
	},{
		name: "rock",
		class: "rock",
		freq: 150,
		symbol: "*",
		color: "#999999",
		droppable: false,
		clickable: true,
		points: 500
	},{
		name: "anchor",
		class: "rock",
		freq: 50,
		symbol: "V",
		color: "#999999",
		droppable: true,
		clickable: false,
		autoclear: true,
		points: 100
	}
]
var board;
var puzzle;
var squareCount = 0;
var squares = [];

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}
function Square(p,x,y,color,spl) {
	this.puzzle = p;
	this.x = x;
	this.y = y;
	this.color = color;
	this.spl = spl;
	this.id = squareCount++;
	this.defunct = false;
	this.element = document.createElement("div");
	this.element.id = "sq_" + this.id;
	this.element.className = "square";
	this.j = $(this.element);
	this.clickable = true;
	this.droppable = true;
	this.autoclear = false;
	this.points = 1;
	this.pattern = 4;
	// Determine special squares
	if (this.spl == null) {
		for (var i=0;i<specials.length;i++) {
			var p=getRndInteger(0,specials[i].freq);
			if (p==0) {
				this.spl = specials[i].name;
				this.j.html(specials[i].symbol);
				this.j.addClass(specials[i].class);
				this.clickable = specials[i].clickable;
				this.droppable = specials[i].droppable;
				this.autoclear = specials[i].autoclear;
				this.points = specials[i].points || this.points;
				if(specials[i].pattern) {this.pattern=specials[i].pattern};
				if (specials[i].color) {this.color = specials[i].color};
				break;
			}
		}
	}
	
	this.j.css("background-color",this.color);	
	if (this.spl == "" || this.spl == null) {
		this.j.addClass("normal");
	}
	this.j.css("top",(this.y * 40));
	this.j.css("left",(this.x * 40));
	if (! this.clickable) {this.j.css("cursor","default")}
	this.render = function() {
		board.append(this.j);
	}
	var that = this;
	squares.push(this);
	this.j.click(function(){
		if (that.puzzle.inplay && that.clickable) {
			squareClick(that);			
		}
	});
	this.changeColor = function(color) {
		this.color = color;
		if (this.j) {
			this.j.css("background-color",this.color);			
		}
	}
	this.getNeighbors = function() {
		var neighbors = [];
		var sq;
		if (this.y > 0) {
			sq = this.puzzle.grid[this.y - 1][this.x];
			if (sq) {neighbors.push(sq);} 
		}
		if (this.x < this.puzzle.width - 1) {
			sq = this.puzzle.grid[this.y][this.x + 1];
			if (sq) {neighbors.push(sq);} 
		}
		if (this.y < this.puzzle.height - 1) {
			sq = this.puzzle.grid[this.y + 1][this.x]
			if (sq) {neighbors.push(sq); }
		}
		if (this.x > 0) {
			sq = this.puzzle.grid[this.y][this.x - 1]
			if (sq) {neighbors.push(sq); }
		}
		if (this.pattern >= 8) {
			if (this.y > 0 && this.x < this.puzzle.width - 1) {
				sq = this.puzzle.grid[this.y - 1][this.x + 1];
				if (sq) {neighbors.push(sq);} 
			}
			if (this.y < this.puzzle.height - 1 && this.x < this.puzzle.width - 1) {
				sq = this.puzzle.grid[this.y + 1][this.x + 1];
				if (sq) {neighbors.push(sq);} 
			}
			if (this.y < this.puzzle.height - 1 && this.x > 0) {
				sq = this.puzzle.grid[this.y + 1][this.x - 1]
				if (sq) {neighbors.push(sq); }
			}
			if (this.y > 0 && this.x > 0) {
				sq = this.puzzle.grid[this.y - 1][this.x - 1]
				if (sq) {neighbors.push(sq); }
			}
		}

		
		return neighbors;
	}
	this.burst = function(mates){
		this.j.fadeOut()
		setTimeout(this.j.remove,400);
		this.defunct = true;
		this.puzzle.decrement();
		if (this.j.html() == "X") {
			// Pop all the same color
			squares.forEach(function(square){
				if (square.color == that.color && square.defunct == false && mates.indexOf(square) < 0) {
					mates.push(square);
				}
			})
		}
		var mate;
		while (typeof mates == "object" && (mate = mates.shift()) !== undefined ) {
			mate.burst([]);
		}
	};
	// Fall one row down
	this.down = function() {
		if (this.droppable == false) {return false;} // rocks
		var onebelow = this.puzzle.grid[this.y + 1][this.x];
		if (onebelow) {
		console.log("Can't drop into ",onebelow,onebelow.defuct,onebelow.j);
			return false;
		} // can't
																	// fall into
																	// another
																	// square
		this.y++
		this.puzzle.grid[this.y][this.x] = this;
		this.puzzle.grid[this.y - 1][this.x] = null;
		this.j.animate({top: (this.y * 40)},100	);
		if (this.y > 1) {
			var above = this.puzzle.grid[this.y - 2][this.x];
			if (above != null) {above.down();}
		}
		if (this.autoclear && this.y == this.puzzle.height - 1) {
			this.burst();
			this.puzzle.scoreIt(this.points);
			window.setTimeout(this.puzzle.gravity,400);
		}
	}
}
function Puzzle(x,y) {
	var that=this;
	this.width = x;
	this.height = y;
	this.grid = [];
	this.score = 0;
	this.blocksleft;
	this.secsleft;
	this.t;
	this.level = 1;
	this.inplay = false;
	this.cc = 0

	this.fillboard = function() {
		for (i=0;i<that.height;i++) {
			that.grid[i] = [];
			for (j=0;j<that.width;j++) {
				var color = colors[getRndInteger(0,that.cc)];
				that.grid[i][j] = new Square(that,j,i,color,null);
			}
		}		
	}
	this.loadLevel = function(level) {
		console.log("level change to",level);
		console.log("should pick", level % levels.length);
		var myLevel = levels[level % levels.length];
		this.level = level;
		this.blocksleft = myLevel.n;
		this.secsleft = myLevel.time;
		this.cc = myLevel.colors;
		$("#level").html("Level: " + this.level);
	}
	this.render = function() {
		for (i=0;i<this.grid.length;i++) {
			for (j=0;j<this.grid[i].length;j++) {
				this.grid[i][j].render();
			}
		}
	}
	this.mode = "multibust";
	this.start = function() {
		if (that.grid[0] && that.grid[0][0]) {
			that.clearboard();
		}
		that.score=0;
		$("#score").html(that.score);
		that.loadLevel(that.level);
		that.fillboard();	
		that.render();
		that.t = setInterval(that.timer,1000);
		that.inplay = true;
		$("#remaining")
			.html("Blocks to next level: " + that.blocksleft)
			.css("cursor","default")
			.off("click");
	}
	this.gameover = function() {
		clearInterval(that.t);
		$("#timer").html("GAME OVER");
		$("#lastscore").html("GAME OVER").show();
		$("#lastscore").hide(1000);
		$("#remaining").html("Play again").click(function(){
			that.start();
		}).css("cursor","pointer");
		that.inplay = false;
	};
	this.timer = function() {
		that.secsleft--;
		if (that.secsleft <= 0) {
			that.gameover();
			return;
		}
		$("#timer").html("Time remaining: " + that.secsleft);
		$("#remaining").html("Blocks to next level: " + that.blocksleft);
	};
	this.decrement = function() {
		that.blocksleft--;
		$("#remaining").html("Blocks to next level: " + that.blocksleft);
		if (that.blocksleft <= 0) {
			that.loadLevel(that.level + 1);
		}
	};
	this.gravity = function() {
		for (var j=0;j<that.width;j++) {
			var needfill = false;
			for (var i=that.height-1;i>=0;i--) {
				while (that.grid[i][j] != null && that.grid[i][j].defunct) {
					that.grid[i][j] = null;
					needfill = true;
					if (i>0 && that.grid[i-1][j] != null) {
						that.grid[i-1][j].down();						
					} 
				}
			}
			if (needfill) {
				setTimeout(that.fill,500,j);
			}
		}
	};
	this.clearboard = function() {
		for (var i=0;i<that.height;i++) {
			for (var j=0;j<that.width;j++) {
				var k = that.grid[i][j];
				if (k && k.j) {
					k.j.fadeOut((i+j) * 50,function(){
						this.remove()});
				}
				k = null;
			}
		}	
	};
	
	// Now fill from the top if needed.
	this.fill = function(column) {
		for (var i=that.height-1;i>=0;i--) {
			if (that.grid[i][column] == null) {
				if (that.grid[0][column]) {break;} // No new block if one
													// sitting in 0 position
				var color = colors[getRndInteger(0,that.cc)];
				var mynew = new Square(that,column,0,color,null);
				mynew.render();
				that.grid[0][column] = mynew;
				while(i>mynew.y) {
					if (mynew.down() == false) {break;}}
			}
		}
	}
	// Given an array of everything that is going to burst, calculate a score
	this.calcScore = function(mates) {
		var count=0, score=0;
		mates.forEach(function(square){
			count++;
			score+=square.points+count-1;
		});
		return score;
	}
	this.scoreIt = function(increase) {
		this.score += increase;
		$("#score").html(this.score);
		$("#lastscore")
		.html(increase)
		.show();
		$("#lastscore").hide(500);
	};
}

function squareClick (square) {
	var n = square.getNeighbors();
	switch(square.puzzle.mode) {
		case "multibust":
			var burst = 1;
			var mates = [square];
			
			// Bombs
			if (square.spl == "bomb") {
				mates = mates.concat(n); // all regardless of color
				n.forEach(function(x) {
				    x.changeColor(square.color);
				    burst++
				});
				
			}
			
			
			// Now find your mates' mates:
			for (var i=0;i<mates.length;i++) {
				n = mates[i].getNeighbors();
				for (var h=0;h<n.length;h++) {
					// Bombs
					if (n[h] && n[h].spl == "bomb" && n[h].color==square.color) {
						var b = n[h].getNeighbors();
						b.forEach(function(x) {
						    x.changeColor(square.color);
						    if (mates.indexOf(x) < 0) {
						    	mates.push(x);
						    	burst++    	
						    }
						});
						
					}

					if (n[h] && 
							(n[h].color==square.color || n[h].spl == "joker") 
							&& mates.indexOf(n[h]) < 0) {
						burst++;
						n[h].j.animate({backgroundColor: "#ffffff"},100);
						mates.push(n[h]);
					}
					
				}
				
			}	
			
			
			
			if (burst >= 2) {
				square.j.animate({backgroundColor: "#ffffff"},100);
				var increase=this.puzzle.calcScore(mates);
				this.puzzle.scoreIt(increase);
				square.burst(mates);
				window.setTimeout(this.puzzle.gravity,400);
			}
		break;
	
	}
}
