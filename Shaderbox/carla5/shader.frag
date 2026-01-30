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
    for(int a = -range; a < range; a++) {
        float fa = float(a);
        float ang = fa / frange;
        ang += (org.r + org.g * org.g - org.b * org.b * org.b);
        ang *= PI2;
        vec2 fxy = vec2(cos(ang), sin(ang));
        // Radius modulation
        fxy *= invNrm;
        // Normalize radius
        fxy *= res;
        // Offset coords
        fxy += vTexCoord;
        // wrap
        fxy = mod(fxy + 2.0, vec2(1.0));
        vec4 com = texture2D(tex0, fxy);
        float dot_prod = dot(org.rgb, com.rgb);
        // Accrue similar dot products
        if(dot_prod == min_dot) {
            max_ang += ang;
            ang_cnt += 1.0;
        }else 
        // Reset on new max
        if(dot_prod < min_dot) {
            max_dot = dot_prod;
            max_ang = ang;
            ang_cnt = 1.0;
        }
    }

    max_ang /= ang_cnt;

    float ang_a = max_ang;
    ang_a *= PI2;
    float off_rad = 1.0;
    off_rad *= max_dot + lvlNrm * 5.;
    vec2 coord_a = vec2(
        cos(ang_a) * off_rad, 
        sin(ang_a) * off_rad
    );
    coord_a *= res;
    coord_a += vTexCoord;
    coord_a = mod(coord_a + 10.0, vec2(1.0));
    vec4 samp_a = texture2D(tex0, coord_a);

    new.rgb = samp_a.rgb;

    if(new.r == new.g && new.g == new.b) {
        new.rgb = vec3(0.);
    }

    gl_FragColor = new;
}
