/*
 * From https://www.redblobgames.com/maps/mapgen4/
 * Copyright 2018 Red Blob Games <redblobgames@gmail.com>
 * License: Apache v2.0 <http://www.apache.org/licenses/LICENSE-2.0.html>
 *
 * This module allows the user to paint constraints for the map generator
 */
'use strict';

/* global Draggable */

/*
 * The painting interface uses a square array of elevations. As you
 * drag the mouse it will paint filled circles into the elevation map,
 * then send the elevation map to the generator to produce the output.
 */

const Generator = require('./generator');

const CANVAS_SIZE = 128;

const currentStroke = {
    /* elevation before the current paint stroke began */
    previousElevation: new Float32Array(CANVAS_SIZE * CANVAS_SIZE),
    /* how long, in milliseconds, was spent painting */
    time: new Float32Array(CANVAS_SIZE * CANVAS_SIZE),
    /* maximum strength applied */
    strength: new Float32Array(CANVAS_SIZE * CANVAS_SIZE),
};

let heightMap = new Generator();

document.getElementById('button-reset').addEventListener('click', () => {
    heightMap.generate();
    exports.onUpdate();
});


const SIZES = {
    // rate is effect per second
    small:  {key: '1', rate: 8, innerRadius: 2, outerRadius: 6},
    medium: {key: '2', rate: 5, innerRadius: 5, outerRadius: 10},
    large:  {key: '3', rate: 3, innerRadius: 10, outerRadius: 16},
};

const TOOLS = {
    ocean:    {elevation: -0.25},
    shallow:  {elevation: -0.05},
    valley:   {elevation: +0.05},
    mountain: {elevation: +1.0},
};

let currentTool = 'mountain';
let currentSize = 'small';

function displayCurrentTool() {
    const className = 'current-control';
    for (let c of document.querySelectorAll("."+className)) {
        c.classList.remove(className);
    }
    document.getElementById(currentTool).classList.add(className);
    document.getElementById(currentSize).classList.add(className);
}

/** @type {[string, string, function][]} */
const controls = [
    ['1', "small",    () => { currentSize = 'small'; }],
    ['2', "medium",   () => { currentSize = 'medium'; }],
    ['3', "large",    () => { currentSize = 'large'; }],
    ['q', "ocean",    () => { currentTool = 'ocean'; }],
    ['w', "shallow",  () => { currentTool = 'shallow'; }],
    ['e', "valley",   () => { currentTool = 'valley'; }],
    ['r', "mountain", () => { currentTool = 'mountain'; }],
];

window.addEventListener('keydown', e => {
    for (let control of controls) {
        if (e.key === control[0]) { control[2](); displayCurrentTool(); }
    }
});

for (let control of controls) {
    document.getElementById(control[1]).addEventListener('click', () => { control[2](); displayCurrentTool(); } );
}
displayCurrentTool();

const output = document.getElementById('mapgen4');
new Draggable({
    el: output,
    start(event) {
        this.timestamp = Date.now();
        currentStroke.time.fill(0);
        currentStroke.strength.fill(0);
        currentStroke.previousElevation.set(heightMap.elevation);
        this.drag(event);
    },
    drag(event) {
        const nowMs = Date.now();
        let coords = [event.x / output.clientWidth,
                      event.y / output.clientHeight];
        coords = exports.screenToWorldCoords(coords);
        heightMap.paintAt(TOOLS[currentTool], coords[0], coords[1], SIZES[currentSize], nowMs - this.timestamp);
        this.timestamp = nowMs;
        exports.onUpdate();
    },
});

exports.screenToWorldCoords = coords => coords;
exports.onUpdate = () => {};
exports.size = CANVAS_SIZE;
exports.constraints = heightMap.elevation;
exports.setElevationParam = elevationParam => heightMap.setElevationParam(elevationParam);
exports.userHasPainted = () => heightMap.userHasPainted;
