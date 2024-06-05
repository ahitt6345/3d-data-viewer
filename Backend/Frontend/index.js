import * as THREE from '/ext/three.module.js';
import {
    PointerLockControls
} from '/ext/PointerLockControls.js';
// render a sphere
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.SphereGeometry(5, 32, 32);
const material = new THREE.MeshBasicMaterial({
    color: 0xffff00
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

camera.position.z = 10;

var isPressed = {};
document.addEventListener('keydown', (event) => {
    const keyCode = event.keyCode;

    switch (keyCode) {
        case 87: // W key
            isPressed['W'] = true;
            break;
        case 83: // S key
            isPressed['S'] = true;
            break;
        case 65: // A key
            isPressed['A'] = true;
            break;
        case 68: // D key
            isPressed['D'] = true;
            break;
        case 32: // Space bar
            isPressed['Space'] = true;
            break;
        case 67: // C key
            isPressed['C'] = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    const keyCode = event.keyCode;

    switch (keyCode) {
        case 87: // W key
            isPressed['W'] = false;
            break;
        case 83: // S key
            isPressed['S'] = false;
            break;
        case 65: // A key
            isPressed['A'] = false;
            break;
        case 68: // D key
            isPressed['D'] = false;
            break;
        case 32: // Space bar
            isPressed['Space'] = false;
            break;
        case 67: // C key
            isPressed['C'] = false;
            break;
    }
});


var controls = new PointerLockControls(camera, document.body);

document.addEventListener('click', () => { // Lock the pointer when the user clicks on the screen
    controls.lock();
}, false);


scene.add(controls.getObject());
var prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    var time = performance.now();
    var delta = (time - prevTime) / 30;

    if (isPressed['W']) {
        camera.position.z -= 0.1;
    }
    if (isPressed['S']) {
        camera.position.z += 0.1;
    }
    if (isPressed['A']) {
        camera.position.x -= 0.1;
    }
    if (isPressed['D']) {
        camera.position.x += 0.1;
    }
    if (isPressed['Space']) {
        camera.position.y += 0.1;
    }
    if (isPressed['C']) {
        camera.position.y -= 0.1;
    }
    renderer.render(scene, camera);
    prevTime = time;
}

animate();
var CompanySphere = function() {
    
};
var ApplicationSphere = function() {
    this.companies = [];

};
var processData = function(data){
    var applications = {}; // This will be used to store the unique applications
    for (var i = 0; i < data.length; i++) {
        applications[data[i].applications] = 1;
    }
    applications = Object.keys(applications); // Get the array of unique applications
    console.log(applications);


};
// connect to the server
var localData = [];
// localData is structured as follows: [ { company: '...', industry: '...', mosaic: '...', applications: '...', total_funding: '...' }, ...]
const socket = io('http://localhost:3000');
socket.on('connect', () => {
    console.log('connected');
    socket.emit('getdata');
    socket.on('data', (data) => {
        if (data === 'End of data') {
            console.log('All data received');
        } else {
            // Handle the received data chunk
            localData = localData.concat(data);
            console.log("chunk received: ", data.length, "total: ", localData.length);
            socket.emit('nextchunk');
        }
    });
});