gb.mesh.quad = function(width, height)
{
    var P = gb.vec2.tmp(width / 2, height / 2);
    var C = gb.color.tmp(1,1,1,1);

    var vb = gb.vertex_buffer.new(
    [
    	// POS  COLOR
        -P[0],-P[1], C[0], C[1], C[2], C[3],
         P[0],-P[1], C[0], C[1], C[2], C[3],
        -P[0], P[1], C[0], C[1], C[2], C[3],
         P[0], P[1], C[0], C[1], C[2], C[3]
    ]);

    gb.vertex_buffer.add_attribute(vb, 'position', 2);
    gb.vertex_buffer.add_attribute(vb, 'color', 4);

    var ib = gb.index_buffer.new([0,1,3,0,3,2]);

    return gb.mesh.new(vb, ib);
}