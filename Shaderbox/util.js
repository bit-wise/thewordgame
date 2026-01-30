Math.RT5 = Math.sqrt(5)
Math.PHI = (1 + Math.RT5) / 2; // Approx. 1.6180339887
Math.PHIb = Math.PHI - 1; // Approx. 0.6180339887

function normalize(v, n, x){
    // Avoid division by zero
    if((x - n) == 0){
        return 0;
    }
    return (v - n) / (x - n);
}


function get_timestamp() {
    const timestamp = new Date().toLocaleString().replace(/[\/]/g, '.').replace(/[:]/g, '-').replace(/[,]/g, '');
    return timestamp;
}

function save_Json(timestamp = null) {
    noLoop();
    if (!timestamp) {
        timestamp = get_timestamp();
    }
    // Save a json file with the seed data
    const json_filename = `${config.id}_${timestamp}.json`;
    saveJSON(config, json_filename);
    console.log(`Saved seed data: ${json_filename}`);
    // loop();
}

function save_Image(timestamp = null) {
    noLoop();
    console.log('Saving image...');
    // Save the canvas as a PNG file
    if (!timestamp) {
        timestamp = get_timestamp();
    }
    const filename = `${config.id}_${timestamp}.png`;
    saveCanvas(filename);
    console.log(`Saved image: ${filename}`);
    // Save a json file with the seed data
    save_Json(timestamp);
    // // Resume looping
    loop();
    // console.log('Resumed.');
}

function keyPressed() {
    if (key === 's' || key === 'S') {
        save_Image();
    } else if (key === '.') {
        draw();
    } else if (key === 'l' || key === 'L') {
        config.loop = !config.loop;
        console.log(`Looping: ${config.loop}`);
        if (config.loop) {
            loop();
        }
    } else if (key === 'a' || key === 'A') {
        // User allow microphone access
        console.log('Requesting microphone access...');
        getAudioContext().resume().then(() => {
            console.log('Microphone access granted.');
        });
    } else if (key === 'r' || key === 'R') {
        // Reload the page
        console.log('Reloading page...');
        noLoop();
        // wait 2 seconds before reloading
        setTimeout(() => {
            location.reload(true);
        }, 2000);
    } else if (key === 'p' || key === 'P') {
        if (isLooping()) {
            noLoop();
            console.log('Paused.');
        } else {
            loop();
            console.log('Resumed.');
            // playSynth();
        }
    } else if (key === 'c' || key === 'C') {
        // Clear the canvas
        console.log('Clearing canvas...');
        // background(0);
        loop();
    } else if (key === 'd' || key === 'D') {
        // Debug: Output shader code with line numbers
        console.log('Shader code with line numbers:');
        const frag_shader_src_debug = frag_shader_src.map((line, index) => {
            index = (index + 1).toString().padEnd(4, " ");
            return `${index} ${line}`;
        });
        config.debug = !config.debug;
        console.log(frag_shader_src_debug.join('\n'));
    }
}

const generateHash = (string) => {
    let hash = 0;
    for (const char of string) {
        hash = (hash << 5) - hash + char.charCodeAt(0);
        hash |= 0; // Constrain to 32bit integer
    }
    return hash;
};
