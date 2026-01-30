/*
2026.01.03 - Nicholas C. Barcomb
*/

config.audio_debug = false;
// config.audio_debug = true;

// config.audio_active = false;
config.audio_use_time = false;

// config.distorton_level = 0;

config.repeat = 2;
config.audio_frameCount = 0;

const NOTE = {
    A: [27.5, 55, 110, 220, 440]
};

// DRAW LOOP

// function draw() {
//     // -- PLAY SOUND --
//     if (config.audio_active) {
//         play_sound(10, 5, NOTE.A[0]);
//     }
// }

function toggle_audio() {
    config.audio_active = !config.audio_active;
}

function toggle_audio_time() {
    config.audio_use_time = !config.audio_use_time;
}

// --- AUDIO SECTION

let canPlaying = false;

function mousePressed() {
    start_synth();
    loop();
}

function start_synth() {
    // Start audio context (must be triggered by user gesture)
    userStartAudio();
    canPlaying = true;
}

// Sum parameters
config.sum_area_a = {
    val: 0,
    min: Infinity,
    max: -Infinity,
    avg: 0,
    act: 0,
    nrm: 0,
    adj: 0
}
config.sum_area_b = {
    val: 0,
    min: Infinity,
    max: -Infinity,
    avg: 0,
    act: 0,
    nrm: 0,
    adj: 0
}

// Dot product parameters
config.dot_product = {
    val: 0,
    min: Infinity,
    max: -Infinity,
    avg: 0,
    act: 0,
    nrm: 0,
    adj: 0
}
config.dot_product_norm = {
    val: 0,
    min: Infinity,
    max: -Infinity,
    avg: 0,
    act: 0,
    nrm: 0,
    adj: 0
}
config.dot_angle = {
    val: 0,
    min: Math.PI,
    max: -Math.PI,
    avg: 0,
    act: 0,
    nrm: 0,
    adj: 0
}
config.dot_ma = { b: 0.01 }; // moving average factor
config.dot_ma.a = 1 - config.dot_ma.b;

// Audio note parameters
config.note = [];
config.note_in_key = [];
config.note_delay = [];
config.audio_ticker = [];
config.note_attack = [];
config.note_decay = [];
config.note_sustain = [];
config.note_release = [];
config.note_velocity = [];
config.note_pan = [];
config.note_velocity_avg = 0;
config.noise_floor = 1e-7;

let prev_a = [];

// Play sound based on canvas content

function play_sound(note_count = 1, octaves = 3, base_note = 110) {
    const y_os = 0 / 1080 * config.height;
    const note_count_xy_offset = note_count * 1;
    const note_spacing_y = Math.round((config.height - y_os) / note_count_xy_offset);
    const note_spacing_x = Math.round((config.width) / note_count_xy_offset);

    // -- AUDIO GENERATION --
    for (let n = 0; n < note_count_xy_offset; n++) {
        if (config.audio_ticker[n] === undefined) {
            config.audio_ticker[n] = 0;
        }
        if (config.note_delay[n] === undefined) {
            config.note_delay[n] = 0;
        }
        const n1 = n + 1;
        const key_range = 12 * octaves;
        let sample_area_a_coords, sample_area_b_coords;
        let note_width = config.width;
        const center_y_offset = note_spacing_y / 4;
        sample_area_a_coords = {
            x: 0,
            y: Math.min(2 + note_spacing_y * n + center_y_offset, config.height - 2),
            w: note_width,
            h: 1
        };
        const sample_area_offset = Math.floor(note_spacing_y * 0.5);
        sample_area_b_coords = {
            x: 0,
            y: Math.min(2 + note_spacing_y * n + sample_area_offset + center_y_offset, config.height - 1),
            w: note_width,
            h: 1
        };

        // DEBUG
        // show location of sample areas
        // config.audio_debug = true;
        if (config.audio_debug) {
            push();
            noFill();
            stroke(0, 255, 0);
            rectMode(CORNER);
            rect(sample_area_a_coords.x - config.width / 2, sample_area_a_coords.y - config.height / 2, sample_area_a_coords.w, sample_area_a_coords.h);
            stroke(0, 255, 255);
            rect(sample_area_b_coords.x - config.width / 2, sample_area_b_coords.y - config.height / 2, sample_area_b_coords.w, sample_area_b_coords.h);
            pop();
        }

        let debug_audio = false;
        // debug_audio = true;

        if (debug_audio || config.audio_ticker[n] >= config.note_delay[n] && canPlaying) {
            const sample_area_a = get(sample_area_a_coords.x, sample_area_a_coords.y, sample_area_a_coords.w, sample_area_a_coords.h);
            const sample_area_a_flat = sample_area_a.width * sample_area_a.height;
            const sample_area_b = config.audio_use_time && prev_a[n] !== undefined ? prev_a[n] : get(sample_area_b_coords.x, sample_area_b_coords.y, sample_area_b_coords.w, sample_area_b_coords.h);
            const sample_area_b_flat = sample_area_b.width * sample_area_b.height;
            if (config.audio_use_time) {
                prev_a[n] = sample_area_a;
            }

            // Reset ticker
            config.audio_ticker[n] = 0;

            // Construct note parameters
            try {
                // Route notes through WebAudio StereoPannerNode per-note to guarantee panning
                const audioCtx = (typeof getAudioContext === 'function') ? getAudioContext() : (window && window.AudioContext ? new window.AudioContext() : null);
                if (audioCtx) {

                    // Analyze sample area
                    let sample_area_array_a = [];
                    let sample_area_array_b = [];
                    sample_area_a.loadPixels();
                    for (let i = 0; i < sample_area_a_flat; i++) {
                        let r = map(sample_area_a.pixels[i * 4], 0, 255, 0, 1);
                        sample_area_array_a[i] = r;
                    }
                    sample_area_b.loadPixels();
                    for (let i = 0; i < sample_area_b_flat; i++) {
                        let r = map(sample_area_b.pixels[i * 4], 0, 255, 0, 1);
                        sample_area_array_b[i] = r;
                    }

                    // Sum area a
                    let sum_area_a = sample_area_array_a.reduce((acc, val) => acc + val, 0);
                    config.sum_area_a.val = sum_area_a;
                    config.sum_area_a.act++;
                    config.sum_area_a.min = Math.min(config.sum_area_a.min, sum_area_a);
                    config.sum_area_a.max = Math.max(config.sum_area_a.max, sum_area_a);
                    config.sum_area_a.avg = moving_average(config.sum_area_a.avg, sum_area_a);
                    config.sum_area_a.nrm = map(sum_area_a, 0, sample_area_a_flat, 0, 1);
                    if (config.sum_area_a.min < config.sum_area_a.max) {
                        config.sum_area_a.adj = map(sum_area_a, config.sum_area_a.min, config.sum_area_a.max, -1, 1);
                    }

                    // Sum area b
                    let sum_area_b = sample_area_array_b.reduce((acc, val) => acc + val, 0);
                    config.sum_area_b.val = sum_area_b;
                    config.sum_area_b.act++;
                    config.sum_area_b.min = Math.min(config.sum_area_b.min, sum_area_b);
                    config.sum_area_b.max = Math.max(config.sum_area_b.max, sum_area_b);
                    config.sum_area_b.avg = moving_average(config.sum_area_b.avg, sum_area_b);
                    config.sum_area_b.nrm = map(sum_area_b, 0, sample_area_b_flat, 0, 1);
                    if (config.sum_area_b.min < config.sum_area_b.max) {
                        config.sum_area_b.adj = map(sum_area_b, config.sum_area_b.min, config.sum_area_b.max, -1, 1);
                    }

                    // Dot product of two halves
                    let dot_product = 0;
                    const sample_area_array_a_length = sample_area_array_a.length;
                    for (let i = 0; i < sample_area_array_a_length; i++) {
                        dot_product += sample_area_array_a[i] * sample_area_array_b[i];
                    }
                    config.dot_product.val = dot_product;
                    config.dot_product.act++;
                    config.dot_product.min = Math.min(config.dot_product.min, dot_product);
                    config.dot_product.max = Math.max(config.dot_product.max, dot_product);
                    config.dot_product.avg = moving_average(config.dot_product.avg, dot_product);
                    if (config.dot_product.min < config.dot_product.max) {
                        config.dot_product.adj = map(dot_product, config.dot_product.min, config.dot_product.max, -1, 1);
                    }

                    // Get distance of a and b
                    const distance_a = sample_area_array_a.reduce((acc, val) => acc + val * val, 0) ** 0.5;
                    const distance_b = sample_area_array_b.reduce((acc, val) => acc + val * val, 0) ** 0.5;
                    const distance_ab = distance_a * distance_b;

                    // Normalize dot product to -1 to 1
                    let dot_product_norm = 0;
                    if (distance_ab != 0) {
                        // acos input -1 ≤ x ≤ 1, output 0 ≤ x ≤ π
                        dot_product_norm = (dot_product / distance_ab);
                    }
                    config.dot_product_norm.val = dot_product_norm;
                    config.dot_product_norm.act++;
                    config.dot_product_norm.min = Math.min(config.dot_product_norm.min, dot_product_norm);
                    config.dot_product_norm.max = Math.max(config.dot_product_norm.max, dot_product_norm);
                    config.dot_product_norm.avg = moving_average(config.dot_product_norm.avg, dot_product_norm);
                    config.dot_product_norm.nrm = map(dot_product_norm, -1, 1, 0, 1);
                    if (config.dot_product_norm.min < config.dot_product_norm.max) {
                        config.dot_product_norm.adj = map(dot_product_norm, config.dot_product_norm.min, config.dot_product_norm.max, -1, 1);
                    }

                    // // TEST: MANUAL ADJUSTMENTS
                    // config.dot_product_norm.min = config.dot_product_norm.avg - config.dot_product_norm.max;
                    // if (config.dot_product_norm.min < config.dot_product_norm.max) {
                    //     dot_product_norm = map(dot_product_norm, -1, 1, config.dot_product_norm.min, config.dot_product_norm.max);
                    // }


                    // Get dot product angle
                    let dot_angle = Math.acos(dot_product_norm); // (radians, 0 to π)
                    config.dot_angle.val = dot_angle;
                    config.dot_angle.act++;
                    config.dot_angle.min = Math.min(config.dot_angle.min, dot_angle);
                    config.dot_angle.max = Math.max(config.dot_angle.max, dot_angle);
                    config.dot_angle.avg = moving_average(config.dot_angle.avg, dot_angle);
                    config.dot_angle.nrm = map(dot_angle, 0, Math.PI, 0, 1);
                    if (config.dot_angle.min < config.dot_angle.max) {
                        config.dot_angle.adj = map(dot_angle, config.dot_angle.min, config.dot_angle.max, -1, 1);
                        // config.dot_angle.adj = map(dot_angle, 0, Math.PI, -1, 1);
                    }

                    // SET NOTE PARAMETERS BASED ON DOT ANGLE
                    let note_source = config.sum_area_a.adj;
                    if (n % 5 == 1) {
                        note_source = config.sum_area_b.adj;
                    }
                    if (n % 5 == 2) {
                        note_source = config.dot_product.adj;
                    }
                    if (n % 5 == 3) {
                        note_source = config.dot_product_norm.adj;
                    }
                    if (n % 5 == 4) {
                        note_source = config.dot_angle.adj;
                    }

                    // Add wiggle to parameters
                    const wiggle = { b: 0.05 };
                    wiggle.a = 1 - wiggle.b;

                    // Next note delay (in frames)
                    const min_delay = 1 * note_count * 0.5;
                    const max_delay = 3 * note_count * 0.5;
                    // const min_delay = 0.25 * note_count;
                    // const max_delay = 0.75 * note_count;
                    // Aligned notes get longer delays
                    // config.note_delay[n] = map(note_source ** 2, 0, 1, min_delay, max_delay);
                    config.note_delay[n] = map(note_source ** 2, 0, 1, max_delay, min_delay);
                    const delay_wiggle = Math.sin(config.audio_frameCount + n);
                    config.note_delay[n] = Math.ceil(config.note_delay[n] * wiggle.a + delay_wiggle * wiggle.b);
                    let note_delay_influence = 1e-10;

                    // Note attack (in seconds)
                    note_delay_influence = 0.00035 * 2;
                    config.note_attack[n] = config.note_delay[n] * note_delay_influence;
                    const attack_wiggle = Math.cos(config.audio_frameCount + n) * note_delay_influence;
                    config.note_attack[n] = config.note_attack[n] * wiggle.a + attack_wiggle * wiggle.b;

                    // Note decay (in seconds)
                    note_delay_influence = 0.0035 * 0.1;
                    config.note_decay[n] = config.note_delay[n] * note_delay_influence;
                    const decay_wiggle = Math.sin(config.audio_frameCount + n) * note_delay_influence;
                    config.note_decay[n] = config.note_decay[n] * wiggle.a + decay_wiggle * wiggle.b;

                    // Note sustain (in seconds) 
                    note_delay_influence = 0.035 * 0.5;
                    config.note_sustain[n] = config.note_delay[n] * note_delay_influence;
                    const sustain_wiggle = Math.cos(config.audio_frameCount + n) * note_delay_influence;
                    config.note_sustain[n] = config.note_sustain[n] * wiggle.a + sustain_wiggle * wiggle.b;

                    // Note release (in seconds)
                    note_delay_influence = 0.35;
                    config.note_release[n] = config.note_delay[n] * note_delay_influence;
                    const release_wiggle = Math.sin(config.audio_frameCount + n) * note_delay_influence;
                    config.note_release[n] = config.note_release[n] * wiggle.a + release_wiggle * wiggle.b;

                    config.note_delay[n] += config.note_attack[n];
                    config.note_delay[n] += config.note_decay[n];
                    config.note_delay[n] += config.note_sustain[n];
                    // config.note_delay[n] += config.note_release[n];

                    // Velocity (volume, from 0 to 1)
                    note_delay_influence = 0.005;
                    const volume = config.note_delay[n] * note_delay_influence;
                    // const velocity_wiggle = Math.sin(config.audio_frameCount + n) * note_delay_influence;
                    // config.note_velocity_avg = moving_average(config.note_velocity_avg, volume);
                    // config.note_velocity[n] = map(volume, 0, config.note_velocity_avg, 0, 1);
                    // config.note_velocity[n] = config.note_velocity[n] * wiggle.a + velocity_wiggle * wiggle.b;
                    // // config.note_velocity[n] *= 0.05;
                    // // config.note_velocity[n] = map(note_source, -1, 1, 0, 0.05)
                    // config.note_velocity[n] = map(Math.abs(note_source), 0, 1, 0.2, config.noise_floor * 0.1) * 0.9
                    // // config.note_velocity[n] += map(note_source, -1, 1, config.noise_floor * 0.1, 0.2) * 0.1;
                    config.note_velocity[n] = volume * 2.5;

                    // Pan (Left: -1, Right: 1)
                    if (n % 2 == 1) {
                        config.note_pan[n] = map(note_source, -1, 1, 1, -1);
                    } else {
                        config.note_pan[n] = map(note_source, -1, 1, -1, 1);
                    }
                    const pan_wiggle = Math.cos(config.audio_frameCount + n);
                    config.note_pan[n] = config.note_pan[n] * wiggle.a + pan_wiggle * wiggle.b;

                    // PREPARE NOTE

                    // Map integer note counts to frequencies (semitone steps from C0 = 16.35Hz)
                    const note_to_freq = (n2f) => base_note * Math.pow(2, n2f / 12);

                    // Map note_source to note
                    config.note[n] = Math.floor(map(note_source, -1, 1, 0, key_range));
                    config.note_in_key[n] = config.note[n];

                    // Limit note to key of C major
                    const chromatic_scale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // Chromatic
                    const major_scale = [0, 2, 4, 5, 7, 9, 11]; // Ionian (Major)
                    const minor_scale = [0, 2, 3, 5, 7, 8, 10]; // Aeolian (Natural Minor)
                    const pentatonic_scale = [0, 2, 4, 7, 9]; // Major Pentatonic
                    const blues_scale = [0, 3, 5, 6, 7, 10]; // Minor Blues
                    const whole_tone_scale = [0, 2, 4, 6, 8, 10]; // Whole Tone
                    const dorian_scale = [0, 2, 3, 5, 7, 9, 10]; // Dorian

                    // Choose scale
                    let scale = major_scale;
                    scale = pentatonic_scale;
                    scale = whole_tone_scale;
                    scale = dorian_scale;

                    // Adjust note to fit scale
                    const note_mod = config.note[n] % 12;
                    if (!scale.includes(note_mod)) {
                        const note_oct = Math.floor(config.note[n] / 12) * 12;
                        // // Find the closest note in the scale
                        // const closest_note = scale.reduce((prev, curr) => {
                        //     return (Math.abs(curr - note_mod) < Math.abs(prev - note_mod) ? curr : prev);
                        // });
                        // Find the closest note in the scale
                        let temp_scale = scale.concat(scale.map(v => v + 12));
                        let closest_note = 0;
                        for (let s = 1; s < temp_scale.length; s++) {
                            let check_a = temp_scale[s - 1];
                            let check_b = temp_scale[s];
                            if (Math.abs(check_a - note_mod) < Math.abs(check_b - note_mod)) {
                                closest_note = check_a % 12;
                                break;
                            }
                        }
                        config.note_in_key[n] = note_oct + closest_note;
                    }

                    // Fade in
                    const fade_in = Math.min(1, (config.audio_frameCount + 1) / config.height);
                    config.note_velocity[n] *= fade_in;

                    // Play note
                    let freq = note_to_freq(config.note_in_key[n]);
                    const freq_wiggle = Math.sin(config.audio_frameCount + n) * 0.5;
                    freq = freq * wiggle.a + freq_wiggle * wiggle.b;
                    // if (config.note_in_key[n] < (octaves - 1) * 12) {
                    play_note(audioCtx, freq, config.note_velocity[n], config.note_attack[n], config.note_decay[n], config.note_sustain[n], config.note_release[n], config.note_pan[n],
                        // concat(sample_area_array_a,  sample_area_array_b)
                    );
                    // }
                }
            } catch (e) {
                console.warn('Playback failed:', e);
            }
        }

        // Increment ticker
        config.audio_ticker[n]++;
    }

    config.audio_frameCount++;
}

// Helper: play a note using raw WebAudio nodes and a StereoPannerNode
function play_note(audioCtx, freq, velocity, attack, decay, sustain, release, panValue, curve = [], type = 'sine') {
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const panner = audioCtx.createStereoPanner();
        // const distortion = audioCtx.createWaveShaper();

        // Set up oscillator

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        // Simple ADSR-like envelope
        const noise_floor = config.noise_floor;
        let ramp_time = now;
        gain.gain.setValueAtTime(0, now);
        // Initial ramp to noise floor
        ramp_time = ramp_time + 0.01;
        gain.gain.linearRampToValueAtTime(noise_floor, ramp_time);
        // Attack
        ramp_time = ramp_time + attack;
        gain.gain.linearRampToValueAtTime(velocity, ramp_time);
        // Decay
        ramp_time = ramp_time + decay;
        const valley = velocity * 0.5//Math.PHIb;
        gain.gain.exponentialRampToValueAtTime(valley, ramp_time);
        // Sustain
        ramp_time = ramp_time + sustain;
        gain.gain.linearRampToValueAtTime(valley, ramp_time);
        // Release
        ramp_time = ramp_time + release;
        gain.gain.exponentialRampToValueAtTime(noise_floor, ramp_time);
        // Final cutoff
        ramp_time = ramp_time + 0.095;
        gain.gain.linearRampToValueAtTime(0, ramp_time);
        // Connect nodes

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(audioCtx.destination);

        // distortion.curve = makeDistortionCurve(config.distorton_level, curve);
        // distortion.oversample = "4x";
        // osc.connect(distortion);
        // distortion.connect(gain);
        // gain.connect(panner);
        // panner.connect(audioCtx.destination);

        if (typeof panner.pan !== 'undefined') panner.pan.setValueAtTime(panValue, now);

        osc.start(now);
        osc.stop(ramp_time + 0.1);
        // Cleanup
        osc.onended = () => {
            osc.disconnect();
            // distortion.disconnect();
            gain.disconnect();
            panner.disconnect();
        };
    } catch (err) {
        console.warn('play_note failed:', err);
    }
}

// function makeDistortionCurve(amount, curve_input) {
//     const k = typeof amount === "number" ? amount : 50;
//     const numSamples = 44100;
//     const curve = new Float32Array(numSamples);

//     for (let i = 0; i < numSamples; i++) {
//         const x = (i * 2) / numSamples - 1;
//         // Use input curve to modulate distortion
//         const input_mod = curve_input !== undefined ? curve_input[i % curve_input.length] : x;
//         // curve[i] = ((3 + k) * input_mod * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(input_mod));
//         curve[i] = 1 - (input_mod - 0.5) * amount;
//     }

//     return curve;
// }


function moving_average(old_avg, new_val) {
    return old_avg * config.dot_ma.a + new_val * config.dot_ma.b;
}