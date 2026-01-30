/*
2025.12.28 - Nicholas C. Barcomb
*/

config.debug = {
    shader: true,
    mic_level: true,
    analyze: true,
};
// config.debug.mic_level = false;
// config.debug.analyze = false;


config.mic_enabled = false;

config.width = window.innerWidth;
config.height = window.innerHeight;
const W2 = config.width / 2;
const H2 = config.height / 2;
const maxWH = Math.min(config.width, config.height);
const maxWH2 = maxWH / 2;
const maxWH4 = maxWH / 4;
const minWH = Math.min(config.width, config.height);
const minWH2 = minWH / 2;
const minWH4 = minWH / 4;
config.scale = 1920 / config.width;

config.density = 1;
// config.density = 2;
config.fps = 24
config.fps = 48
config.micMinMaxS = 1;
config.micMinMaxSinc = 1;
// config.fft_smooth = 0.015;
config.fft_smooth = 0;


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

const phi = (1 + Math.sqrt(5)) / 2;

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

    // // Load a config.json file
    // let cp_src = 'config';
    // if (config.checkpoint_src) {
    //     cp_src = config.checkpoint_src;
    // }

    // loadJSON(`${cp_src}.json`, (data) => {
    //     config = { ...config, ...data };
    //     // Additionally customize config here...
    //     if (config.width % 2 === 1) {
    //         config.width -= 1;
    //     }
    //     if (config.height % 2 === 1) {
    //         config.height -= 1;
    //     }
    // });
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
config.micLvl = 0;
config.micMax = 0;
config.micMin = 100;
config.micMaxS = 0; // Soft max, relaxes over time
config.micMinS = 100; // Soft min, relaxes over time
config.lvlMax = 0;
config.ilvlMax = 100;
config.lvlNrm = 0;
config.ilvlNrm = 100;

config.time = 0;
config.frame = 0;

function clrLoop(c) {
    return (c * 255 + config.time) % 255;
}
function draw() {
    config.frame += 1;
    config.frame %= config.width;

    // config.time += 1;
    // config.time += config.lvlNrm// * config.micMinMaxSinc;
    config.time += config.lvlNrm * 0.1;

    if (config.mic_enabled) {
        config.micLvl = mic.getLevel();

        // Normalize to max
        config.micMax = max(config.micMax, config.micLvl);
        config.micMin = min(config.micMin, config.micLvl);
        config.lvlMax = config.micMax != 0 ? config.micLvl / config.micMax : 0;
        config.ilvlMax = 1 - config.lvlMax;

        // Normalize to max/min with decay

        // config.micMaxS = max(config.micMaxS, config.micLvl);
        // config.micMinS = min(config.micMinS, config.micLvl);
        if (config.micLvl > config.micMaxS) {
            config.micMaxS = config.micLvl;
            config.micMinMaxSinc += config.micLvl;
            // console.log("UP", config.micMinMaxSinc);
        }
        if (config.micLvl < config.micMinS) {
            config.micMinS = config.micLvl;
            config.micMinMaxSinc -= config.micLvl;
            console.log("DN", config.micMinMaxSinc);
        }
        config.micMinMaxS = 1 / config.micMinMaxSinc;
        config.micMaxS *= 1 - config.micMinMaxS;
        config.micMinS *= 1 + config.micMinMaxS;
        config.lvlNrm = (config.micLvl - config.micMinS) / (config.micMaxS - config.micMinS);
        if (isNaN(config.lvlNrm)) {
            config.lvlNrm = 0;
        }
        config.ilvlNrm = 1 - config.lvlNrm;

        // scale(1 + config.micLvl);
        rotate((config.lvlNrm * 2 - 1) * Math.PI * 2);
        translate(-W2, -H2);

        // DEBUG: MIC LEVEL VISUALIZATION
        if (config.debug.mic_level) {

            let x = 0 + config.frame;

            // // Erase
            // push();
            // stroke(0, 0, 0);
            // strokeWeight(1);
            // line(x, 0, x, config.height);
            // pop();

            push();

            // // Mid line (clipping level for getLevel())
            // stroke(0, 128, 255);
            // strokeWeight(1);
            // line(0, H2, config.width, H2);

            // Mic level line
            stroke(clrLoop(config.micLvl), 255, 255);
            strokeWeight(8);
            let y = config.micLvl * config.height;
            point(x, y);
            // // Max marker
            // stroke(config.micMax * 255, 255, 255);
            // // stroke(0, 128, 0);
            // strokeWeight((config.lvlMax * 32));
            // y = config.micMax * config.height;
            // point(x, y);

            // lvlMax line
            // stroke(128, 128, 255);
            stroke(clrLoop(config.lvlMax), 255, 255);
            strokeWeight(8);
            y = config.lvlMax * config.height;
            point(x, y);

            // lvlNrm line
            // stroke(192, 128, 255);
            stroke(clrLoop(config.lvlNrm), 255, 255);
            strokeWeight(8);
            y = config.lvlNrm * config.height;
            point(x, y);

            pop();
        }



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

        max_val *= (1 - config.micMinMaxS);
        min_val *= (1 + config.micMinMaxS);


        // config.spread = 256;
        frag_shader.setUniform("lvlNrm", (config.lvlNrm + config.lvlMax) / 2);
        frag_shader.setUniform("invNrm", (config.ilvlNrm + config.ilvlMax) / 2);
        // frag_shader.setUniform("level", config.mic_enabled ? config.micLvl * config.spread : 0);
        // frag_shader.setUniform("inv_config.micLvl", 1 - config.micLvl * config.micLvl * config.micLvl * config.micLvl);





        new_spec.map((v, idx) => {
            push();
            const vNrm = v / max_val;
            let x = (config.width / new_spec.length * idx * v) % config.width;
            let y = vNrm * config.height;

            // scale(vNrm);
            // rotate(vNrm * Math.PI * 2);

            // blendMode(DIFFERENCE);
            // stroke(0, 0, 0);
            // strokeWeight(4);
            // point(x, y);

            stroke(255 - clrLoop(vNrm), 128, 255);
            // stroke(vNrm * 255, 128, 255);
            strokeWeight((config.lvlNrm * 2 + 2));
            point(x, y);

            pop();
        });

        filter(frag_shader);

        // console.log(config.micLvl);

        // if (config.img_src && !config.mic_enabled) {
        //     image(img, -width / 2, -height / 2, width, height, 0, 0, img.width, img.height, COVER);
        // }
    }
}

// function roundClr(c) {
//     const os = 2;
//     if (c[0] == c[1] && c[0] == c[2]) {
//         c[0] = random(0, 255);
//         c[1] = random(0, 255);
//         c[2] = random(0, 255);
//     }
//     return c.map(v => 255 - round(v / os) * os);
// }

function mousePressed() {
    config.mic_enabled = true;
    userStartAudio();
}