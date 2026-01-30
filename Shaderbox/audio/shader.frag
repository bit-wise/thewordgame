precision highp float;

uniform sampler2D tex0;
varying vec2 vTexCoord;
uniform vec2 res;
uniform float PI2;

void main() {
    const int range = 6;
    float frange = float(range);

    // Get the original color for this pixel
    vec4 org = texture2D(tex0, vTexCoord);
    vec4 new = org;

    // Avg neighbors
    vec3 avg_neighbors = vec3(0.0);

    float min_dot = 10.0;
    float ang_off = 0.0;
    float ang_cnt = 0.0;
    for(int a = 0; a < range * 2; a++) {
        float fa = float(a);
        float ang = fa / frange;
        vec2 fxy = vec2(cos(ang * PI2), sin(ang * PI2));
        // Normalize radius
        fxy *= res;
        // Offset coords
        fxy += vTexCoord;
        // wrap
        // fxy = mod(fxy + 2.0, vec2(1.0));
        // Sample
        vec4 com = texture2D(tex0, fxy);
        // Accrue similar dot products
        avg_neighbors += com.rgb;

        float dot_prod = dot(org.rgb, com.rgb);
        // Accrue similar dot products
        if(dot_prod == min_dot) {
            ang_off += ang;
            ang_cnt += 1.0;
        } else 
        // Reset on new min
        if(dot_prod < min_dot) {
            min_dot = dot_prod;
            ang_off = ang;
            ang_cnt = 1.0;
        }
    }

    avg_neighbors /= frange;

    // new.rgb = avg_neighbors;

    ang_off /= ang_cnt;
    // ang_off += 0.75;
    // ang_off += 0.5;
    ang_off += 0.25;

    vec2 coord_a = vec2(cos(ang_off * PI2), sin(ang_off * PI2));
    // Normalize radius
    coord_a *= res;
    // Offset coords
    coord_a += vTexCoord;
    // wrap
    // coord_a = mod(coord_a + 2.0, vec2(1.0));
    // Sample
    vec4 samp_a = texture2D(tex0, coord_a);

    new.rgb = samp_a.rgb * 0.195 + avg_neighbors * 0.8;
    new.rgb = samp_a.rgb;
    new.rgb *= 0.99;

    // if(new.r == new.g && new.g == new.b) {
    //     new.rgb = vec3(0.);
    // }

    gl_FragColor = new;
}
