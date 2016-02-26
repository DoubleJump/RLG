gb.time = 
{
	start: 0,
    elapsed: 0,
    now: 0,
    frame: 0,
    last: 0,
    next: 0,
    dt: 0,
    paused: false,
    step: 1 / 60,
    sub_step: 1 / 16384,

    init: function(t)
    {
        var now = performance.now() / 1000;
        //else use t

        var _t = gb.time;
        _t.elapsed = 0;
        _t.frame = 0;
        _t.start = t;
        _t.now = t;
        _t.last = t;
        _t.next = t;
        _t.paused = false;
    },
    update: function(t)
    {
        var _t = gb.time;

        /*
        var now = performance.now() / 1000;
        while(_t.time < now)
        {
            while(_t.time < _t.next)
            {
                _t.time += _t.sub_step;
            }
            _t.frame++;
            _t.next += _t.step;
        }
        */

        _t.frame++;
        _t.now = t;
        _t.dt = t - _t.last;
        _t.last = t;
        _t.elapsed += _t.dt;
    },
}