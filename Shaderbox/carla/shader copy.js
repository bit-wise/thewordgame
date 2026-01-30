/*
2025.12.28 - Nicholas C. Barcomb
*/

config.debug = {
    shader: true,
};
config.loop = false;
config.microphone_enabled = false;

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
config.reset = 0.025;

config.width = window.innerWidth;
config.height = window.innerHeight;
const W2 = config.width / 2;
const H2 = config.height / 2;
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

    fft = new p5.FFT(0.5, 1024);
    fft.setInput(mic);

    // Set shader uniforms
    frag_shader.setUniform("u_time", 0);
    frag_shader.setUniform("res", [1 / (config.width * config.density), 1 / (config.height * config.density)]);
    frag_shader.setUniform("PI", Math.PI);
    frag_shader.setUniform("PI2", Math.PI * 2);

    // noLoop();
}

// DRAW LOOP
config.time = 0;
const phi = (1 + Math.sqrt(5)) / 2;
let max_vals = [];
let min_vals = [];
let max_val = 0;
let min_val = 255;
function draw() {
    // if (config.img_src) {
    //     push();
    //     blendMode(MULTIPLY);
    //     image(img, -width / 2, -height / 2, width, height, 0, 0, img.width, img.height, COVER);
    //     pop();
    // }
    const micLevel = mic.getLevel();
    micMax = max(micMax, micLevel) * (1 - config.reset);
    micMin = min(micMin, micLevel) * (1 + config.reset);
    const lvlNrm = (micLevel - micMin) / (micMax - micMin);
    const invNrm = 1 - lvlNrm;

    const spectrum = fft.analyze();

    let new_spec = [];
    // max_val = 0;
    // min_val = 255;
    const reset = config.reset * 0.001;
    max_val *= (1 - reset);
    min_val *= (1 + reset);
    spectrum.map(v => {
        if (v > 0) {
            new_spec.push(v);
            if (v > max_val) {
                max_val = v;
            }
            if (v < min_val) {
                min_val = v;
            }

        }
    });
    // new_spec.map((v, idx) => {
    //     max_vals[idx] = max_vals[idx] ? max(max_vals[idx], v) * (1 - reset) : v;
    //     min_vals[idx] = min_vals[idx] ? min(min_vals[idx], v) * (1 + reset) : v;
    //     max_vals[idx] = constrain(max_vals[idx], 0, 255);
    //     min_vals[idx] = constrain(min_vals[idx], 0, 255);
    // });

    for (let i = 0; i < config.batch_size; i++) {
        // push();
        // stroke(250);
        // point(0, 0);
        // pop();

        // config.time = millis() / 1000 / 1000;
        // config.time += phi;
        config.time += phi - 1;
        // frag_shader.setUniform("time", 1 / Math.log(config.time));
        // frag_shader.setUniform("time", config.time / (config.fps * config.fps));
        // frag_shader.setUniform("time", Math.log(config.time) / 360);
        frag_shader.setUniform("time", config.time);
        frag_shader.setUniform("level", config.microphone_enabled ? micLevel * 256 : 0);
        frag_shader.setUniform("lvlNrm", lvlNrm);
        frag_shader.setUniform("invNrm", invNrm);

        // if (micLevel > micMax * 0.5) {
        new_spec.map((v, idx) => {
            push();
            // noFill();
            const vNrm = v / max_val;
            // const vNrm = (v - min_val) / (max_val - min_val);
            // const vNrm = (v - min_vals[idx]) / (max_vals[idx] - min_vals[idx]);
            const inv_vNrm = 1 - vNrm;
            v = vNrm * max_val;

            // strokeWeight(inv_vNrm * inv_vNrm);

            const rad = config.width / new_spec.length;
            const x = (rad * idx) - W2;
            const y = sin(config.PI2 * (v * 2) / max_val) * H2;
            fill(v, 128, invNrm * 255, 255);
            // stroke(v, 128, invNrm * 255, 255);
            const radius = rad;
            circle(x, y, radius);

            // const ang = config.PI2 * (idx * v / new_spec.length + 0.25);
            // // const offset = minWH2 * 0.75 - (vNrm * minWH2)// % minWH;
            // // const offset = minWH2 * 0.75 - (vNrm * minWH2) + v// % minWH;
            // // const offset = vNrm * minWH;
            // const offset = vNrm * config.width;
            // // const ang = config.PI2 * (idx * v / new_spec.length + 0.25);
            // // const offset = (sin(config.PI2 * (v * 1) / max_val) * minWH2) % minWH2;
            // const x2 = cos(ang) * offset;
            // const y2 = sin(ang) * offset;
            // // fill(v, lvlNrm * 255, invNrm * 255, 255);
            // // fill(v, 128, invNrm * 255, 255);
            // // stroke(255 - v, 128, lvlNrm * 255, 255);
            // fill(255 - v, 128, invNrm * 255, 255);
            // // circle(x2, y2, (config.width * vNrm) / new_spec.length);
            // // circle(x2, y2, 2);
            // circle(x2, y2, radius);

            pop();
        });
        // }

        filter(frag_shader);
        // filter(frag_shader);
        // filter(frag_shader);
        // filter(frag_shader);
        // filter(frag_shader);
        // filter(frag_shader);
    }
    // console.log(micLevel);

    if (config.img_src && !config.microphone_enabled) {
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
    config.microphone_enabled = true;
    userStartAudio();
}