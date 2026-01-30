precision highp float;

#define non_zero 0.00001
#define PHI 1.61803398875

uniform sampler2D tex0;
varying vec2 vTexCoord;
uniform vec2 res;
uniform float PI2;
uniform float lvlNrm;
uniform float invNrm;

void main() {
    const int range = 3;

    // Get the original color for this pixel
    vec4 org = texture2D(tex0, vTexCoord);
    vec4 new = org;

    // Find max aligned neighbor
    float max_dot = 0.0;
    float max_ang = 0.0;
    float frange = float(range);
    float lvlNrm_2 = abs(invNrm);
    // lvlNrm_2 = abs(lvlNrm);
    lvlNrm_2 = lvlNrm * 2.0 - 1.0;
    vec2 lvlNrm_xy = vec2(vTexCoord.x * lvlNrm_2, vTexCoord.y * lvlNrm_2);
    for(int a = 0; a < range; a++) {
        float fa = float(a);
        float ang = fa / frange;
        ang += lvlNrm_xy.x;
        ang += lvlNrm_xy.y;
        vec2 fxy = vec2(cos(ang * PI2), sin(ang * PI2)) * res;
        fxy += vTexCoord;
        // wrap
        fxy = mod(fxy + 2.0, vec2(1.0));
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

    float off_ang = invNrm * 0.5;
    float off_rad = 1. + invNrm * PHI;
    float ang_a = max_ang + off_ang;
    vec2 coord_a = vec2(cos(ang_a * PI2) * off_rad, sin(ang_a * PI2) * off_rad) * res + vTexCoord;
    coord_a = mod(coord_a + 10.0, vec2(1.0));
    vec4 samp_a = texture2D(tex0, coord_a);

    new.rgb = samp_a.rgb;

    if(new.r == new.g && new.g == new.b) {
        new.rgb = vec3(0.);
    }

    gl_FragColor = new;
}
