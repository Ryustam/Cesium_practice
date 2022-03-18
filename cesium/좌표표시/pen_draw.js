/**
 * 
 */
var toolbar_drawing = {

	canvas : null,
	context : null,
	tool : null,
	isOpen : false,
	drawable : false,
	penStyle : -1,
	parentDiv : null,
	drawPosX : 0,
	drawPosY : 0,
	
	setDrawCanvasBorder : function(){

		var ctx = this.context,
			drawCanvas = this.canvas
			;
		
		if (drawCanvas == null || ctx == null) {
			return;
		}
		var drawLineWidth = ctx.lineWidth,
			drawLineColor = ctx.strokeStyle;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.rect(0, 0, drawCanvas.width, drawCanvas.height);
		ctx.stroke();
		ctx.lineWidth = drawLineWidth;
		ctx.strokeStyle = drawLineColor;
	},

	open : function(_mapCanvas){

		if (_mapCanvas == null) {
			return;
		}

		if (this.canvas == null) {
			
			// 그리기용 캔버스 생성
			var drawCanvas = document.createElement("canvas");
			
			// 지도 캔버스 위에 그릴 수 있도록 위치와 크기 맞춤
			var mapCanvasRect = _mapCanvas.getBoundingClientRect();
			this.drawPosX = mapCanvasRect.left;
			this.drawPosY = mapCanvasRect.top;
			
			drawCanvas.width = _mapCanvas.width;
			drawCanvas.height = _mapCanvas.height;
			drawCanvas.style = "display:block;position:absolute;left:0px;top:0px;zIndex:90;z-Index:1;";
			drawCanvas.id = "UserDrawCanvas";
			_mapCanvas.parentElement.appendChild(drawCanvas);

			// 그리기용 캔버스 이벤트 설정
			if (document.addEventListener) { 	// IE 9이상 & 그 외 브라우저
				drawCanvas.addEventListener('contextmenu', function(e) {
					e.preventDefault();
				}, false);
			} else { // IE 9 이하
				drawCanvas.attachEvent('oncontextmenu', function() {
					window.event.returnValue = false;
				});
			}
			
			drawCanvas.addEventListener('mousedown', this.ev_canvas, false);
			drawCanvas.addEventListener('mousemove', this.ev_canvas, false);
			drawCanvas.addEventListener('mouseup',   this.ev_canvas, false);
			drawCanvas.addEventListener('touchstart', this.ev_canvas, false);
			drawCanvas.addEventListener('touchmove', this.ev_canvas, false);
			drawCanvas.addEventListener('toucnend',   this.ev_canvas, false);
			
			this.canvas = drawCanvas;
		}
		
		if (this.tool == null) {
			this.tool = new this.createPencil();
		}
		
		if (this.context == null){
			this.context = this.canvas.getContext('2d');
			this.context.lineCap = 'round';
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.context.strokeStyle = "#FF0000";
		}

		viewer.scene.screenSpaceCameraController.enableInputs = false;
		
		toolbar_drawing.drawable = true;
		toolbar_drawing.setDrawCanvasBorder();
		toolbar_drawing.isOpen = true;
	},

	createPencil : function(){

		var tool = this;
		this.started = false;

		// 마우스를 누르는 순간 그리기 작업을 시작 한다.
		this.mousedown = this.touchstart = function (ev) {
			if(toolbar_drawing.drawable){
				
				viewer.scene.screenSpaceCameraController.enableInputs = false;
//				Module.XDIsMouseOverDiv(true);
				toolbar_drawing.context.beginPath();
				//toolbar_drawing.context.moveTo(ev._x+this.drawPosX, ev._y+this.drawPosY);
				toolbar_drawing.context.moveTo(ev._x, ev._y);
				tool.started = true;
			}
		};

	   // 마우스가 이동하는 동안 계속 호출하여 Canvas에 Line을 그려 나간다
		this.mousemove = this.touchmove = function (ev) {
			
			viewer.scene.screenSpaceCameraController.enableInputs = false;
//			Module.XDIsMouseOverDiv(true);
			/*console.log("마우스 이동:",ev._x);
			console.log("drawPosX 이동:",this.drawPosX);
			console.log("마우스 이동 + drawPosX",ev._x+this.drawPosX);*/
			if (tool.started) {
				//toolbar_drawing.context.lineTo(ev._x+this.drawPosX, ev._y+this.drawPosY);
				toolbar_drawing.context.lineTo(ev._x, ev._y);
				toolbar_drawing.context.stroke();
			}
		};

	   // 마우스 떼면 그리기 작업을 중단한다
		this.mouseup = this.touchend = function (ev) {
			if (tool.started){
				tool.mousemove(ev);
				tool.started = false;
			}
		};
	},

	ev_canvas : function(ev) {

		if (ev.touches) {
			if (ev.touches.length != 1){
				return;
			}
			ev._x = parseInt(ev.touches[0].clientX+this.drawPosX);
			ev._y = parseInt(ev.touches[0].clientY+this.drawPosY);

		} else {
			if (ev.layerX || ev.layerX == 0) { // Firefox 브라우저
			  ev._x = ev.layerX;
			  ev._y = ev.layerY;
			}
			else if (ev.offsetX || ev.offsetX == 0) { // Opera 브라우저
			  ev._x = ev.offsetX;
			  ev._y = ev.offsetY;
			}
		}

		// tool의 이벤트 핸들러를 호출한다.
		var func = toolbar_drawing.tool[ev.type];
		if (func) {
			func(ev);
		}
	},

	setPenColor : function(_color){
		this.context.strokeStyle = _color;
		this.setDrawCanvasBorder();
	},


	close : function(){
		
		this.isOpen = false;
		this.drawable = false;
		
		this.canvas.parentElement.removeChild(this.canvas);
		this.canvas = null;
		this.context = null;
		
		viewer.scene.screenSpaceCameraController.enableInputs = true;
	}
};