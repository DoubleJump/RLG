gb.time = 
{
	start: 0,
    elapsed: 0,
    now: 0,
    last: 0,
    dt: 0,
    paused: false,

    init: function(t)
    {
        var _t = gb.time;
    	_t.elapsed = 0;
        _t.start = t;
        _t.now = t;
        _t.last = t;
        _t.paused = false;
    },
    update: function(t)
    {
        var _t = gb.time;
    	_t.now = t;
    	_t.dt = ((t - _t.last) / 1000);
    	_t.last = t;
        _t.elapsed += _t.dt;
    },
}