gb.Material = function()
{
    this.name;
    this.shader;
    this.mvp;
}
gb.material = 
{
    new: function(shader, name)
    {
        var m = new gb.Material();
        m.name = name || shader.name;
        m.shader = shader;
        for(var key in shader.uniforms)
        {
            var uniform = shader.uniforms[key];
            var size = uniform.size;
            var val;

            switch(uniform.type)
            {
                case 'FLOAT': 
                {
                    if(size > 1) val = new Float32Array(size);
                    else val = 0.0;
                    break;
                }
                case 'FLOAT_VEC2':
                {
                    val = new Float32Array(size * 2);
                    break;
                }
                case 'FLOAT_VEC3':
                {
                    val = new Float32Array(size * 3);
                    break;
                }
                case 'FLOAT_VEC4':
                {
                    val = new Float32Array(size * 4);
                    break;
                }
                case 'BOOL':
                {
                    val = true;
                    break;
                }
                case 'FLOAT_MAT4':
                {
                    if(size > 1) val = new Float32Array(size * 16);
                    else val = gb.mat4.new();
                    break;
                }
                case 'INT':
                {
                    val = 0;
                    break;
                }
                default:
                {
                    ASSERT(false, uniform.type + ' is an unsupported uniform type');
                }
            }
            m[key] = val
        }
        return m;
    },
    set_uniform: function(material, uniform, value)
    {
        if(material[uniform] !== undefined)
        {
            material[uniform] = value;
        }
    },
    set_matrix_uniforms: function(material, matrix, camera)
    {
        if(material.mvp !== undefined)
        {
            gb.mat4.mul(material.mvp, matrix, camera.view_projection);
        }
        if(material.model_view !== undefined)
        {
            gb.mat4.mul(material.model_view, matrix, camera.view);
        }
        if(material.model !== undefined)
        {
            material.model = matrix;
        }
    },
}