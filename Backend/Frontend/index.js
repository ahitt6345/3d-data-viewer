import * as THREE from '/ext/three.module.js';

// render a sphere
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.SphereGeometry(5, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

camera.position.z = 10;

function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.x += 0.01;
    sphere.rotation.y += 0.01;
    renderer.render(scene, camera);
}

animate();

// connect to the server
var localData = [];
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
