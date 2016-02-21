gb.Canvas = function()
{
	this.ctx;
	this.element;
	this.container;
	this.width;
	this.height;
}

gb.canvas = 
{
	canvas: null,

	init: function(container)
	{
		var _t = gb.canvas;

		var canvas = new gb.Canvas();
		canvas.container = container;
		canvas.element = document.createElement('canvas');
		canvas.ctx = canvas.element.getContext('2d');
    	container.appendChild(canvas.element);

		_t.canvas = canvas;
		
		_t.resize();

		return canvas;
	},

	resize: function()
	{
		var canvas = gb.canvas.canvas;
		var w = canvas.container.offsetWidth;
		var h = canvas.container.offsetHeight;

		canvas.element.width = w;
		canvas.element.height = h;
		canvas.width = w;
		canvas.height = h;
	},

	clear: function(color)
	{
		var canvas = gb.canvas.canvas;
		var ctx = canvas.ctx;

		if(color)
		{
			ctx.fillStyle = color;
			ctx.rect(0,0,canvas.width, canvas.height);
			ctx.fill();
		}
		else 
		{
			ctx.clearRect(0,0, canvas.width, canvas.height);
		}
	},

	rect: function(ax,ay, bx,by)
	{
		var ctx = gb.canvas.canvas.ctx;
		ctx.beginPath();
		ctx.moveTo(ax,ay);
		ctx.lineTo(bx,ay);
		ctx.lineTo(bx,by);
		ctx.lineTo(ax,by);
	},

	line: function(ax,ay, bx,by)
	{
		var ctx = gb.canvas.canvas.ctx;
		ctx.beginPath();
		ctx.moveTo(ax,ay);
		ctx.lineTo(bx,by);
	},

	fill: function(color)
	{
		var ctx = gb.canvas.canvas.ctx;
		ctx.fillStyle = color;
		ctx.fill();
	},

	stroke: function(width, color)
	{
		var ctx = gb.canvas.canvas.ctx;
		ctx.strokeWidth = width;
		ctx.strokeStyle = color;
		ctx.stroke();
	},
}