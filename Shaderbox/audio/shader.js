/*
2025.12.28 - Nicholas C. Barcomb
*/

config.debug = {
    shader: false,
    mic_level: false,
    analyze: false,
    meter_info: false,
    config_info: false,
};
config.debug.shader = true;
// config.debug.mic_level = true;
config.debug.analyze = true;
// config.debug.meter_info = true;
config.debug.config_info = true;

// if (!config.debug.meter_info) {
//     document.getElementById('info').style.display = 'none';
// }

config.scaler = window.innerWidth / 1920;
// if (config.debug.meter_info) {
//     document.getElementById('info').style.fontSize = config.scaler + 'em';
// }
if (config.debug.config_info) {
    document.getElementById('config').style.fontSize = config.scaler + 'em';
}

config.mic_enabled = false;

config.width = window.innerWidth;
config.height = window.innerHeight;
const W2 = config.width / 2;
const H2 = config.height / 2;

// config.density = 2;
config.fps = 48
config.fft_smooth = 0;

config.img_src = '';
config.img_src = '_img/ChatGPT Image Nov 16, 2025, 06_36_03 AM.png';

config.img_src = '/' + config.img_src;

config.img_src = false;


// SETUP FUNCTIONS

let frag_shader_src;
let img;
let mic;
let fft;

function preload() {
    // Load an image
    if (config.img_src) {
        img = loadImage(config.img_src);
    }

    // Load fragment shader source
    frag_shader_src = loadStrings(config.src);
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

function mic_setup() {
    mic = new p5.AudioIn();
    mic.start();

    fft = new p5.FFT(config.fft_smooth);
    fft.setInput(mic);
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
    mic_setup()

    // Set shader uniforms
    const invRes = [
        1 / (config.width * config.density),
        1 / (config.height * config.density)
    ];
    frag_shader.setUniform("res", invRes);
    frag_shader.setUniform("PI", config.PI);
    frag_shader.setUniform("PI2", config.PI2);

    // noLoop();
}

// DRAW LOOP
config.mic_lvl = 0; // [0..1] exp
config.mic_lvl_log = 0; // [0..1] linear
config.mic_max = 0;
config.mic_min = 10;
config.lvl_max = 0;
config.lvl_max_inv = 10;
config.fft_max = 0; // [0..255] linear
config.fft_min = 2550;

let clr_os = [];
let clr_os_log = [];
// let clr_os = 0;
// let clr_os_log = 0;

function draw() {

    if (config.mic_enabled) {
        // Raw mic input
        config.mic_lvl = mic.getLevel();
        // Logarithmic scale
        config.mic_lvl_log = Math.log(config.mic_lvl * 100 + 1) / Math.log(101);

        // Normalize to max
        config.mic_max = max(config.mic_max, config.mic_lvl);
        config.mic_min = min(config.mic_min, config.mic_lvl);
        config.lvl_max = config.mic_max != 0 ? config.mic_lvl / config.mic_max : 0;
        config.lvl_max_inv = 1 - config.lvl_max;

        translate(-W2, -H2);

        // // DEBUG: MIC LEVEL VISUALIZATION
        // if (config.debug.mic_level) {

        //     let x = 0 + config.frame;

        //     push();

        //     // Mic level line
        //     stroke(clrLoop(config.mic_lvl), 255, 255);
        //     strokeWeight(8);
        //     let y = config.mic_lvl * config.height;
        //     point(x, y);

        //     // lvl_max line
        //     stroke(clrLoop(config.lvl_max), 255, 255);
        //     strokeWeight(8);
        //     y = config.lvl_max * config.height;
        //     point(x, y);

        //     pop();
        // }


        // AUDIO ANALYSIS AND DRAWING
        const spectrum = fft.analyze();
        let new_fft = [];
        // config.fft_max = 0;
        // config.fft_min = 2550;
        // Reduce spectrum to only audible frequencies
        // clr_os = [];
        // clr_os_log = [];
        spectrum.map(v => {
            if (v > 0) {
                new_fft.push(v);
                if (clr_os.length <= spectrum.length) {
                    clr_os.push(0);
                }
                if (clr_os_log.length <= spectrum.length) {
                    clr_os_log.push(0);
                }
                if (v > config.fft_max) {
                    config.fft_max = v;
                }
                if (v < config.fft_min) {
                    config.fft_min = v;
                }
            }
        });

        // Draw spectrum points
        if (config.debug.analyze) {
            push();
            new_fft.map((v, idx) => {
                const vNrm = config.fft_max != 0 ? v / config.fft_max : 0;
                const vNrm_log = Math.log(vNrm * 100 + 1) / Math.log(101);
                let x = map(idx, 0, new_fft.length, 0, config.width);
                let y = map(vNrm, 0, 1, config.height, 0);

                clr_os[idx] += vNrm;
                clr_os_log[idx] += vNrm_log;
                // clr_os += vNrm / new_fft.length;
                // clr_os_log += vNrm_log / new_fft.length;

                let clr = map(idx, 0, new_fft.length, 0, 255);
                // stroke(0, 0, 64);
                stroke((clr + clr_os[idx]) % 255, 128, 128);
                // stroke((clr + clr_os) % 255, 128, 128);
                strokeWeight(4);
                point(x, y);

                y = map(vNrm_log, 0, 1, config.height, 0);
                stroke((clr + clr_os_log[idx]) % 255, 128, 128);
                // stroke((clr + clr_os_log) % 255, 128, 128);
                strokeWeight(4);
                point(x, y);
            });
            pop();
        }

        // const por_a = 0.5;
        // const por_b = 1 - por_a;
        // frag_shader.setUniform("lvlNrm", config.lvlNrm);
        // frag_shader.setUniform("invNrm", config.ilvlNrm * por_a + config.lvl_max_inv * por_b);
        filter(frag_shader);

        // // DEBUG: METER INFO
        // if (config.debug.meter_info) {
        //     const info_min = document.getElementById('min');
        //     const info_lvl = document.getElementById('lvl');
        //     const info_max = document.getElementById('max');
        //     if (info_min) {
        //         info_min.style.left = config.scl_min * 100 + '%';
        //     }
        //     if (info_lvl) {
        //         info_lvl.style.left = config.scl_lvl * 100 + '%';
        //     }
        //     if (info_max) {
        //         info_max.style.left = config.scl_max * 100 + '%';
        //     }
        // }
        // DEBUG: CONFIG INFO
        if (config.debug.config_info) {
            const info_config = document.getElementById('config');
            if (info_config) {
                // Display config as JSON
                info_config.innerText = JSON.stringify(config, null, 2);
            }
        }
    }
}

function mousePressed() {
    config.mic_enabled = true;
    userStartAudio();
}