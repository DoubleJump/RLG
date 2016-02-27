gb.Rect = function()
{
	this.x;
	this.y;
	this.w;
	this.h;
	this.hw;
	this.hh;
	this.min_x;
	this.min_y;
	this.max_x;
	this.max_y;
	return this;
}

gb.rect = 
{
	new: function(ax,ay,bx,by)
	{
		var r = new gb.Rect();
		gb.rect.set_min_max(r, ax,ay,bx,by);
		return r;
	},
	set: function(r, x,y,w,h)
	{
		r.x = x;
		r.y = y;
		r.w = w;
		r.h = h;
		r.hw = w / 2;
		r.hh = h / 2;
		r.min_x = x - r.hw;
		r.min_y = y - r.hh;
		r.max_x = x + r.hw;
		r.max_y = y + r.hh;
	},
	set_min_max: function(r, ax,ay, bx,by)
	{
		r.x = (bx - ax) / 2;
		r.y = (by - ay) / 2;
		r.w = bx-ax;
		r.h = by-ay;
		r.hw = r.w / 2;
		r.hh = r.h / 2;
		r.min_x = ax;
		r.min_y = ay;
		r.max_x = bx;
		r.max_y = by;
	},
}