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
    float min_dot = 10.0;
    float max_ang = 0.0;
    float ang_cnt = 0.0;
    float frange = float(range);
    for(int a = 0; a < range; a++) {
        float fa = float(a);
        float ang = fa / frange;
        // ang += cos(lvlNrm * vTexCoord.x * vTexCoord.y * PI2);
        // ang += sin(lvlNrm * frange * PI2);
        ang += (org.r + org.g * org.g - org.b * org.b * org.b) * lvlNrm;
        ang *= PI2;
        vec2 fxy = vec2(cos(ang), sin(ang));
        // fxy *= 1.0 + lvlNrm;
        fxy *= res;
        fxy += vTexCoord;
        // wrap
        fxy = mod(fxy + 2.0, vec2(1.0));
        vec4 com = texture2D(tex0, fxy);
        float dot_prod = dot(org.rgb, com.rgb);
        // if(dot_prod == max_dot) {
        //     max_ang += ang;
        //     ang_cnt += 1.0;
        // }else if(dot_prod > max_dot) {
        //     max_dot = dot_prod;
        //     max_ang = ang;
        //     ang_cnt = 1.0;
        // }
        if(dot_prod == min_dot) {
            max_ang += ang;
            ang_cnt += 1.0;
        }else if(dot_prod < min_dot) {
            max_dot = dot_prod;
            max_ang = ang;
            ang_cnt = 1.0;
        }
    }

    max_ang /= ang_cnt;

    float ang_a = max_ang;
    // ang_a += lvlNrm * 2.0 - 1.0;
    ang_a *= PI2;
    float off_rad = 1.0;
    // off_rad = -max_dot / 3.0;
    off_rad *= lvlNrm;
    off_rad *= 10.0;
    // off_rad *= max_dot;
    vec2 coord_a = vec2(
        cos(ang_a) * off_rad, 
        sin(ang_a) * off_rad
    );
    // coord_a = floor(coord_a + 1.0);
    coord_a *= res;
    coord_a += vTexCoord;
    coord_a = mod(coord_a + 3.0, vec2(1.0));
    vec4 samp_a = texture2D(tex0, coord_a);

    new.rgb = samp_a.rgb;

    if(new.r == new.g && new.g == new.b) {
        new.rgb = vec3(0.);
    }

    gl_FragColor = new;
}
