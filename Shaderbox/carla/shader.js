/*
2025.12.28 - Nicholas C. Barcomb
*/

config.debug = {
    shader: true,
};
config.loop = false;
config.mic_enabled = false;

// config.dim_multi = 4;
// // config.dim_multi = 2;
// // config.dim_multi = 1;
// config.width_base = 960 * config.dim_multi;
// config.height_base = 540 * config.dim_multi;
// // config.height_base = config.width_base;
// config.width = Math.min(config.width_base, window.innerWidth * config.dim_multi);
// config.height = Math.min(config.height_base, window.innerHeight * config.dim_multi);
config.density = 1;
config.batch_size = 6;
config.batch_size = 1;
config.fps = 24
config.fps = 48
config.reset = 0.0025;
// config.reset = 0.025;
config.reset = 0.00125;
// config.reset = 0.125;
config.fft_smooth = 0.015;
config.fft_smooth = config.reset;

config.width = window.innerWidth;
config.height = window.innerHeight;
const W2 = config.width / 2;
const H2 = config.height / 2;
const maxWH = Math.min(config.width, config.height);
const maxWH2 = maxWH / 2;
const minWH = Math.min(config.width, config.height);
const minWH2 = minWH / 2;

// config.wrap_x = false;
// config.wrap_y = false;

config.img_src = '';
config.img_src = '_img/v_8K.png';
config.img_src = '_img/sum_to_one_0005.jpg';
// config.img_src = '_img/ChatGPT Image Nov 21, 2025, 08_01_13 AM.png';
config.img_src = '_img/ChatGPT Image Nov 16, 2025, 06_36_03 AM.png';
// config.img_src = '_img/sum_to_one_0004.jpg';
// config.img_src = '_img/ChatGPT Image Nov 16, 2025, 06_44_36 AM.png';
// config.img_src = '_img/img_00000.png';

config.img_src = '/' + config.img_src;

config.img_src = false;


// SETUP FUNCTIONS

let frag_shader_src;
let img;
let mic;
let micMax = 0;
let micMin = 100;
let fft;

function preload() {
    // Load an image
    if (config.img_src) {
        img = loadImage(config.img_src);
    }

    // Load fragment shader source
    frag_shader_src = loadStrings(config.src);

    // Load a config.json file
    let cp_src = 'config';
    if (config.checkpoint_src) {
        cp_src = config.checkpoint_src;
    }

    loadJSON(`${cp_src}.json`, (data) => {
        config = { ...config, ...data };
        // Additionally customize config here...
        if (config.width % 2 === 1) {
            config.width -= 1;
        }
        if (config.height % 2 === 1) {
            config.height -= 1;
        }
    });
}

function canvas_setup() {
    frameRate(config.fps);
    pixelDensity(config.density);
    createCanvas(config.width, config.height, WEBGL);
    noSmooth();
}

let frag_shader;
function shader_setup() {
    // Shader
    frag_shader_src = frag_shader_src.filter(line => {
        const trimmed = line.trim();
        const comment = trimmed.startsWith('//');
        return !comment && trimmed.length > 0;
    });
    frag_shader = createFilterShader(frag_shader_src.join('\n'));

    // Debug
    if (config.debug.shader) {
        const frag_shader_src_debug = frag_shader_src.map((line, index) => {
            index = (index + 1).toString().padEnd(4, " ");
            return `${index} ${line}`;
        });
        console.log(frag_shader_src_debug.join('\n'));
    }
}

function setup() {
    canvas_setup();
    shader_setup();
    colorMode(HSB);
    noStroke();
    background(1);
    if (config.img_src) {
        image(img, -width / 2, -height / 2, width, height, 0, 0, img.width, img.height, COVER);
    }
    mic = new p5.AudioIn();
    mic.start();

    fft = new p5.FFT(config.fft_smooth);
    fft.setInput(mic);

    // Set shader uniforms
    frag_shader.setUniform("res", [1 / (config.width * config.density), 1 / (config.height * config.density)]);
    frag_shader.setUniform("PI", Math.PI);
    frag_shader.setUniform("PI2", Math.PI * 2);

    // noLoop();
}

// DRAW LOOP
config.time = 0;
config.frame = 0;
const phi = (1 + Math.sqrt(5)) / 2;
function draw() {
    // config.frame += 1;
    // if (config.img_src) {
    //     push();
    //     blendMode(DIFFERENCE);
    //     image(img, -width / 2, -height / 2, width, height, 0, 0, img.width, img.height, COVER);
    //     pop();
    // }
    const micLvl = mic.getLevel();
    // config.reset = (1 - micLvl)// * 0.1;
    config.reset = 1 - micLvl;
    config.reset *= 0.1;
    config.reset *= 0.1;
    // config.reset += 0.0001;
    micMax = max(micMax, micLvl) * (1 - config.reset);
    // micMax = min(micMax, 0.9);
    micMin = min(micMin, micLvl) * (1 + config.reset);
    // micMin = max(micMin, 0.1);
    let lvlNrm = (micLvl - micMin) / (micMax - micMin);
    if (isNaN(lvlNrm)) {
        lvlNrm = 0;
    }
    // lvlNrm = constrain(lvlNrm, 0, 1);
    const invNrm = 1 - lvlNrm;

    // config.frame += micLvl;
    config.frame += lvlNrm;

    const spectrum = fft.analyze();

    let new_spec = [];
    let max_val = 0;
    let min_val = 255000;
    spectrum.map((v, idx) => {
        if (v > 0) {
            v *= Math.log(idx);
            new_spec.push(v);
            if (v > max_val) {
                max_val = v;
            }
            if (v < min_val) {
                min_val = v;
            }
        }
    });

    max_val *= (1 - config.reset);
    min_val *= (1 + config.reset);

    // micMax = max_val;
    // micMin = min_val;
    // const lvlNrm = (micLvl - micMin) / (micMax - micMin);
    // const invNrm = 1 - lvlNrm;

    // push();
    // stroke(250);
    // point(0, 0);
    // pop();

    config.spread = 256;
    // config.time = millis() / 1000 / 1000;
    // config.time += phi;
    // config.time += phi - 1;
    config.time += micLvl;
    // frag_shader.setUniform("time", 1 / Math.log(config.time));
    // frag_shader.setUniform("time", config.time / (config.fps * config.fps));
    // frag_shader.setUniform("time", Math.log(config.time) / 360);
    frag_shader.setUniform("time", config.time);
    frag_shader.setUniform("lvlNrm", lvlNrm);
    frag_shader.setUniform("invNrm", invNrm);
    frag_shader.setUniform("level", config.mic_enabled ? micLvl * config.spread : 0);
    frag_shader.setUniform("inv_micLvl", 1 - micLvl * micLvl * micLvl * micLvl);
    // frag_shader.setUniform("invNrm", lvlNrm);
    // frag_shader.setUniform("lvlNrm", invNrm);
    // frag_shader.setUniform("level", config.mic_enabled ? config.spread - micLvl * config.spread : 0);

    // if (micLvl > micMax * 0.5) {
    new_spec.map((v, idx) => {
        push();
        const vNrm = v / max_val;
        let x = config.width / new_spec.length * idx - W2;
        let y = sin(config.PI2 * v / max_val) * H2;
        y = (cos(config.PI2 * v / max_val) * 0.5 + 0.5) * config.height - H2;
        // x = ((config.width / new_spec.length * idx * v) % config.width) - W2;
        // x = ((config.width / new_spec.length * idx * 7) % config.width) - W2;
        // x = sin(config.PI2 * (v * 2) / max_val) * W2;
        // y = config.height / new_spec.length * idx - H2;

        const radius = maxWH / new_spec.length / 2;
        const rotat = (idx / new_spec.length) * config.PI2;

        // // x = x * invNrm + sin(rotat + config.frame) * (micLvl * maxWH) * lvlNrm;
        // // y = y * invNrm + cos(rotat + config.time) * (micLvl * maxWH) * lvlNrm;
        // x += config.width;
        // y += config.height;
        // // x += config.frame / 2;
        // // y += config.frame / 2;
        // x -= W2;
        // y -= H2;
        // x = (x % config.width);
        // y = (y % config.height);
        // x -= W2;
        // y -= H2;

        const ang = config.PI2 * (idx * v / new_spec.length + 0.25);
        const offset = vNrm * minWH;
        const frame_mic = config.time * 10 * lvlNrm;
        let x2 = cos(ang) * offset;
        let y2 = sin(ang) * offset;
        const ang2 = config.PI2 * (frameCount / (config.fps * 2));
        x2 += cos(ang2) * W2 * lvlNrm;
        // y2 += sin(ang2) * H2 * invNrm;
        // y2 += config.frame;
        // y2 += frame_mic;
        x2 += config.width;
        y2 += config.height;
        x2 -= W2;
        y2 -= H2;
        x2 = (x2 % config.width);
        y2 = (y2 % config.height);
        x2 -= W2;
        y2 -= H2;

        // x2 += cos(rotat) * (lvlNrm * minWH2);
        // y2 += sin(rotat) * (lvlNrm * minWH2);

        fill((255 - v * lvlNrm + config.time) % 255, 128, 255, 255);
        arc(x2, y2, radius, radius, rotat, config.PI2 + rotat, CHORD, 3);
        // fill((v * lvlNrm + config.time * 0.5) % 255, v, v, 255);
        // arc(x, y, radius, radius, rotat, config.PI2 + rotat, CHORD);

        pop();
    });
    // }

    filter(frag_shader);

    // console.log(micLvl);

    if (config.img_src && !config.mic_enabled) {
        image(img, -width / 2, -height / 2, width, height, 0, 0, img.width, img.height, COVER);
    }
}

function roundClr(c) {
    const os = 2;
    if (c[0] == c[1] && c[0] == c[2]) {
        c[0] = random(0, 255);
        c[1] = random(0, 255);
        c[2] = random(0, 255);
    }
    return c.map(v => 255 - round(v / os) * os);
}

function mousePressed() {
    config.mic_enabled = true;
    userStartAudio();
}