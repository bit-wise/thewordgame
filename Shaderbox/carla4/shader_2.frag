precision highp float;

uniform sampler2D tex0;
varying vec2 vTexCoord;
uniform float PI2;
uniform vec2 res;
uniform float mix;
uniform float lvlNrm;
uniform float time;

float os(float v) {
    return mod(v + 10.0 + time, 1.0);
}

void main() {
    vec3 avg = vec3(0.0);

    // CHECK NEIGHBORS

    const int v = 3;
    float fv = 1.0 / float(v);
    float PI2_fv = PI2 * fv;
    vec2 vt = vec2(os(vTexCoord.x), os(vTexCoord.y));
    for(int i = 0; i < v; i++) {
        float angle = float(i) * PI2_fv;
        // Get neighbor coords
        vec2 xy = vec2(cos(angle) * res.x, sin(angle) * res.y);
        // Offset coords
        vec2 os = vec2(vTexCoord.x + xy.x, vTexCoord.y + xy.y);
        // Wrap around edges
        os.x = mod(os.x + 1.0, 1.0);
        os.y = mod(os.y + 1.0, 1.0);
        vec4 c = texture2D(tex0, os);

        // avg += vec3(c.g + vt.x + vt.x, c.b *3.0, c.r + vt.y + vt.y);
        avg += vec3(c.g, c.b, c.r);
        avg += vec3(vt.x, c.b, vt.y);
    }

    // APPLY RULE

    // avg *= 1.0 / 3.0;
    // avg *= 0.5;
    avg *= fv;
    avg = sin(PI2 * avg);
    avg += 1.0;
    avg *= 0.5;

    // Get the original color for this pixel
    vec4 org = texture2D(tex0, vTexCoord);
    vec4 new = vec4(avg, org.a);

    float mixx = lvlNrm * mix;
    float imixx = 1.0 - mixx;

    gl_FragColor = new * mixx + org * imixx;
}
