/*
2025.12.28 - Nicholas C. Barcomb
*/

config.debug = {
    shader: true,
    mic_level: true,
    analyze: true,
    meter_info: true,
    config_info: true,
};
// config.debug.shader = false;
config.debug.mic_level = false;
// config.debug.analyze = false;
// config.debug.meter_info = false;
// config.debug.config_info = false;

if (!config.debug.meter_info) {
    document.getElementById('info').style.display = 'none';
}
// if(!config.debug.config_info){
//     document.getElementById('config').style.display = 'none';
// }
config.scaler = window.innerWidth / 1920;
document.getElementById('info').style.fontSize = config.scaler + 'em';
document.getElementById('config').style.fontSize = config.scaler + 'em';

config.mic_enabled = false;

config.width = window.innerWidth;
config.height = window.innerHeight;
const W2 = config.width / 2;
const H2 = config.height / 2;

// config.density = 2;
config.fps = 48
config.micMinMaxS = 1;
config.micMinMaxSinc = 512;
config.fft_smooth = 0;

// You keep the frinds you want to meet. You meet the friends you want to keep. 
// I, is an emergent property of this reality. You, are just as valid as I.

config.img_src = '';
config.img_src = '_img/v_8K.png';
// config.img_src = '_img/sum_to_one_0005.jpg';
// config.img_src = '_img/ChatGPT Image Nov 16, 2025, 06_36_03 AM.png';

config.img_src = '/' + config.img_src;

config.img_src = false;


// SETUP FUNCTIONS

let frag_shader_src;
let frag_shader_2_src;
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
    // Load fragment shader_2 source
    frag_shader_2_src = loadStrings('shader_2.frag');
}

function canvas_setup() {
    frameRate(config.fps);
    pixelDensity(config.density);
    createCanvas(config.width, config.height, WEBGL);
    noSmooth();
}

let frag_shader;
let frag_shader_2;
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

    // Shader Jumble
    frag_shader_2_src = frag_shader_2_src.filter(line => {
        const trimmed = line.trim();
        const comment = trimmed.startsWith('//');
        return !comment && trimmed.length > 0;
    });
    frag_shader_2 = createFilterShader(frag_shader_2_src.join('\n'));

    // Debug
    if (config.debug.shader) {
        const frag_shader_2_src_debug = frag_shader_2_src.map((line, index) => {
            index = (index + 1).toString().padEnd(4, " ");
            return `${index} ${line}`;
        });
        console.log(frag_shader_2_src_debug.join('\n'));
    }
}

// Shader 2 stuff
config.mix = 1;
config.mix /= 2;
config.mix /= 2;
config.mix /= 2;
config.mix /= 2;
config.mix /= 2;


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
    const invRes = [
        1 / (config.width * config.density * config.scaler * 2), 
        1 / (config.height * config.density * config.scaler * 2)
    ];
    frag_shader.setUniform("res", invRes);
    frag_shader.setUniform("PI", config.PI);
    frag_shader.setUniform("PI2", config.PI2);

    frag_shader_2.setUniform("PI2", config.PI2);
    frag_shader_2.setUniform("res", invRes);
    frag_shader_2.setUniform("mix", config.mix);

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
config.scl_min = 0.5;
config.scl_lvl = 0.5;
config.scl_max = 0.5;
config.fft_max = 0;
config.fft_min = 2550;

config.time = 0;
config.frame = 0;

function clrLoop(c) {
    return (c * 255 + config.time) % 255;
}
function draw() {
    config.frame += 1;
    config.frame %= config.width;

    config.time += config.lvlNrm * 0.1;

    if (config.mic_enabled) {
        // Raw mic input
        config.micLvl = mic.getLevel();
        // Logarithmic scale
        config.micLvl = Math.log(config.micLvl * config.micMinMaxSinc + 1) / Math.log(config.micMinMaxSinc + 1);

        // Normalize to max
        config.micMax = max(config.micMax, config.micLvl);
        config.micMin = min(config.micMin, config.micLvl);
        config.lvlMax = config.micMax != 0 ? config.micLvl / config.micMax : 0;
        config.ilvlMax = 1 - config.lvlMax;

        // Max check
        if (config.micLvl > config.micMaxS) {
            config.micMaxS = config.micLvl;
            config.micMinMaxSinc += config.micLvl;
        }
        // Min check
        if (config.micLvl < config.micMinS) {
            config.micMinS = config.micLvl;
            config.micMinMaxSinc -= config.micLvl;
        }
        // Decay
        config.micMinMaxS = 1 / config.micMinMaxSinc;
        config.micMaxS *= 1 - config.micMinMaxS;
        config.micMinS *= 1 + config.micMinMaxS;

        // Reset scale
        config.scl_min = normalize(config.micMinS, config.micMin, config.micMax);
        config.scl_lvl = normalize(config.micLvl, config.micMin, config.micMax);
        config.scl_max = normalize(config.micMaxS, config.micMin, config.micMax);
        if (config.scl_max < 0.5) {
            config.micMax *= 0.9;
            // console.log('reset max', config.micMaxS, config.micMax);
        }
        if (config.scl_min > 0.5) {
            config.micMin *= 1.1;
            // console.log('reset min', config.micMinS, config.micMin);
        }

        // Prevent min zero
        if (config.micMin <= 0) {
            config.micMin = 0.0001;
        }
        if (config.micMinS <= 0) {
            config.micMinS = 0.0001;
        }

        // Normalized level
        config.lvlNrm = normalize(config.micLvl, config.micMinS, config.micMaxS);
        if (isNaN(config.lvlNrm)) {
            config.lvlNrm = 0;
        }
        config.ilvlNrm = 1 - config.lvlNrm;

        scale(2 - constrain(config.lvlNrm, 0.2, 0.8));
        rotate((config.lvlNrm * 2 - 1) * Math.PI * 2);
        translate(-W2, -H2);

        // DEBUG: MIC LEVEL VISUALIZATION
        if (config.debug.mic_level) {

            let x = 0 + config.frame;

            push();

            // Mic level line
            stroke(clrLoop(config.micLvl), 255, 255);
            strokeWeight(8);
            let y = config.micLvl * config.height;
            point(x, y);

            // lvlMax line
            stroke(clrLoop(config.lvlMax), 255, 255);
            strokeWeight(8);
            y = config.lvlMax * config.height;
            point(x, y);

            // lvlNrm line
            stroke(clrLoop(config.lvlNrm), 255, 255);
            strokeWeight(8);
            y = config.lvlNrm * config.height;
            point(x, y);

            pop();
        }


        // AUDIO ANALYSIS AND DRAWING
        const spectrum = fft.analyze();
        let new_fft = [];
        config.fft_max = 0;
        config.fft_min = 2550;
        // Reduce spectrum to only audible frequencies
        if (config.debug.analyze) {
            spectrum.map((v, idx) => {
                if (v > 0) {
                    v *= Math.log(idx + 1);
                    new_fft.push(v);
                    if (v > config.fft_max) {
                        config.fft_max = v;
                    }
                    if (v < config.fft_min) {
                        config.fft_min = v;
                    }
                }
            });
        }

        // FFT decay
        config.fft_max *= (1 - config.micMinMaxS);
        config.fft_min *= (1 + config.micMinMaxS);

        // Draw spectrum points
        new_fft.map((v, idx) => {
            push();
            const vNrm = v / config.fft_max;
            let x = (config.width / new_fft.length * idx * v) % config.width;
            let y = vNrm * config.height;

            blendMode(DIFFERENCE);
            let clr = vNrm;
            clr += config.lvlNrm * config.lvlMax;
            stroke(255 - clrLoop(clr) % 255, vNrm * 255, 255);
            strokeWeight((config.lvlNrm * 4 * config.scaler));
            point(x, y);

            pop();
        });

        frag_shader_2.setUniform("lvlNrm", config.lvlNrm);
        frag_shader_2.setUniform("time", config.micMinMaxSinc);
        filter(frag_shader_2);

        const por_a = 0.5;
        const por_b = 1 - por_a;
        frag_shader.setUniform("lvlNrm", config.lvlNrm);
        frag_shader.setUniform("invNrm", config.ilvlNrm * por_a + config.ilvlMax * por_b);
        filter(frag_shader);

        // DEBUG: METER INFO
        if (config.debug.meter_info) {
            const info_min = document.getElementById('min');
            const info_lvl = document.getElementById('lvl');
            const info_max = document.getElementById('max');
            if (info_min) {
                info_min.style.left = config.scl_min * 100 + '%';
            }
            if (info_lvl) {
                info_lvl.style.left = config.scl_lvl * 100 + '%';
            }
            if (info_max) {
                info_max.style.left = config.scl_max * 100 + '%';
            }
        }
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