gb.intersect = 
{
	point_rect: function(x,y, r)
	{
		return (x < r.max_x && x > r.min_x && y < r.max_y && y > r.min_y);
	},

	line_line: function(ax,ay,bx,by,cx,cy,dx,dy)
	{
		var lax = bx - ax;
		var lay = by - ay;
		var lbx = dx - cx;  
		var lby = dy - cy;

		var d = -lbx * lay + lax * lby;

		var s = (-lay * (ax - cx) + lax * (ay - cy)) / d;
		var t = ( lbx * (ay - cy) - lby * (ax - cx)) / d;

		return (s >= 0 && s <= 1 && t >= 0 && t <= 1)
	},

	line_rect: function(ax,ay,bx,by, r)
	{
		if(gb.intersect.line_line(ax,ay,bx,by, r.min_x, r.min_y, r.min_x, r.max_y) === true) return true;
		if(gb.intersect.line_line(ax,ay,bx,by, r.min_x, r.max_y, r.max_x, r.max_y) === true) return true;
		if(gb.intersect.line_line(ax,ay,bx,by, r.max_x, r.max_y, r.max_x, r.min_y) === true) return true;
		if(gb.intersect.line_line(ax,ay,bx,by, r.max_x, r.min_y, r.min_x, r.min_y) === true) return true;

		return false;
	},

	rect_rect: function(a, b)
    {
       	if(a.min_x > b.max_x) return false;
       	if(a.max_x < b.min_x) return false;
       	if(a.min_y > b.max_y) return false;
       	if(a.max_y < b.min_y) return false;

        return true;
    },
}
