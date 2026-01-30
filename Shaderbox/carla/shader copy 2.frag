precision highp float;

#define non_zero 0.00001

uniform sampler2D tex0;
varying vec2 vTexCoord;
uniform vec2 res;
uniform float PI2;
uniform float lvlNrm;
uniform float invNrm;

void main() {
    // Get the original color for this pixel
    vec4 org = texture2D(tex0, vTexCoord);
    vec4 new = org;

    // Find max aligned neighbor
    float max_dot = 0.0;
    vec2 max_coord = vec2(0.0);
    float max_ang = 0.0;
    const int range = 3;
    float frange = float(range);
    for(int a = -range; a < range; a++) {
        float fa = float(a);
        float ang = fa / frange;
        ang += vTexCoord.x * invNrm + vTexCoord.y * invNrm;
        // ang += vTexCoord.x * lvlNrm + vTexCoord.y * lvlNrm;
        vec2 fxy = vec2(cos(ang * PI2), sin(ang * PI2)) * res;
        fxy += vTexCoord;
        // wrap
        fxy = mod(fxy + 10.0, vec2(1.0));
        vec4 com = texture2D(tex0, fxy);
        float dot_prod = dot(org.rgb, com.rgb);
        if(dot_prod == max_dot) {
            max_ang = ang;
            break;
        }
        if(dot_prod > max_dot) {
            max_dot = dot_prod;
            max_ang = ang;
        }
    }

    float off_ang = 1.0;
    off_ang = invNrm * 0.5;
    // off_ang = lvlNrm * 0.5;
    float off_rad = 1. + invNrm * 2.;
    // off_rad = 1. + lvlNrm * 2.;
    float ang_a = max_ang + off_ang;
    vec2 coord_a = vec2(cos(ang_a * PI2) * off_rad, sin(ang_a * PI2) * off_rad) * res + vTexCoord;
    coord_a = mod(coord_a + 10.0, vec2(1.0));
    vec4 samp_a = texture2D(tex0, coord_a);

    new.rgb = samp_a.rgb;
    // new.rgb *= 0.999;

    float rat = 0.5;
    rat = 1.0;
    // rat = 0.25;
    float inv = 1.0 - rat;
    gl_FragColor = new * rat + org * inv;
}
