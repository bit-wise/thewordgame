precision highp float;

#define PI 3.1415926535897932384626433832795
#define non_zero 0.00001

uniform sampler2D tex0;
varying vec2 vTexCoord;
uniform vec2 res;
uniform float PI2;
uniform float time;
uniform float level;
uniform float lvlNrm;
uniform float invNrm;

void main() {
    // Get the original color for this pixel
    vec4 org = texture2D(tex0, vTexCoord);
    vec4 new = org;

    vec2 vxy = vTexCoord;
    // vxy *= sin(time - lvlNrm);
    vxy *= cos(lvlNrm * PI);
    vxy -= sin(lvlNrm * PI);
    vxy.x += lvlNrm * 0.8;
    vxy.y += lvlNrm * 0.2;

    vec2 xy = vec2(0.);
    // xy.x = level * cos(PI2 * (level + vxy.x));
    // xy.y = level * sin(PI2 * (level + vxy.y));
    xy.x = level * cos(PI2 * (vxy.x));
    xy.y = level * sin(PI2 * (vxy.y));
    xy *= res;
    xy += vTexCoord;

    xy = mod(xy + 1.0, vec2(1.0));

    vec4 com = texture2D(tex0, xy);

    vec3 avg_clr = vec3(0.0);
    const int N = 6;
    float fN = float(N);
    for (int i = 0; i < N; i++) {
        float ang = PI2 * (float(i) / fN + lvlNrm);
        float x;
        float y;
        // float x = sin(invNrm) * cos(ang);
        // float y = cos(invNrm) * sin(ang);
        x = invNrm * cos(ang);
        y = invNrm * sin(ang);
        vec2 off = vTexCoord + vec2(x, y) * res;
        // wrap around
        off = mod(off + 1.0, vec2(1.0));
        vec4 sample = texture2D(tex0, off);
        avg_clr += sample.rgb;
    }
    avg_clr /= fN;

    float rat = 0.8;
    float inv = 1.0 - rat;

    // com.rgb = com.rgb * rat + avg_clr * inv;
    com.rgb = com.rgb + avg_clr;

    new.rgb = com.gbr;

    new.rgb = mod(new.rgb, 1.0) + vec3(non_zero);

     rat = 1.0 - (lvlNrm * lvlNrm * 0.2);
     inv = 1.0 - rat;
    gl_FragColor = new * rat + org * inv;
}
