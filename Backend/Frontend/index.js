import * as THREE from '/ext/three.module.js';
import { PointerLockControls } from '/ext/PointerLockControls.js';
import { TextGeometry } from '/ext/TextGeometry.js';
// render a sphere
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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

    const direction = controls.getDirection(new THREE.Vector3(0, 0, -1)).clone();
    const speed = 0.1;

    if (isPressed['W']) { // forward
        camera.position.add(direction.multiplyScalar(speed));
    }
    if (isPressed['S']) { // backward
        camera.position.add(direction.multiplyScalar(-speed));
    }
    if (isPressed['A']) { // left
        const left = new THREE.Vector3(-1, 0, 0);
        const leftDirection = left.applyQuaternion(controls.getObject().quaternion);
        camera.position.add(leftDirection.multiplyScalar(speed));
    }
    if (isPressed['D']) { // right
        const right = new THREE.Vector3(1, 0, 0);
        const rightDirection = right.applyQuaternion(controls.getObject().quaternion);
        camera.position.add(rightDirection.multiplyScalar(speed));
    }
    if (isPressed['Space']) { // up
        camera.position.y += speed;
    }
    if (isPressed['C']) { // down
        camera.position.y -= speed;
    }
    renderer.render(scene, camera);
    prevTime = time;
}

animate();
var CompanySphere = function(x,y,z,radius, companyData) {
    this.sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshBasicMaterial({color: 0xffff00}));
    this.sphere.position.set(x,y,z);
    // write the company name on the sphere using threejs text
    var text = new TextGeometry(companyData.company, {
        //font: 'helvetiker',
        size: 1,
        height: 0.1
    });
    var textMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
    var textMesh = new THREE.Mesh(text, textMaterial);
    textMesh.position.set(x, y, z);
    scene.add(textMesh);
    this.companyData = companyData;
    scene.add(this.sphere);
};
var ApplicationSphere = function(x,y,z,radius, application) {
    this.companies = [];
    this.sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 0.5, transparent: true}));
    this.sphere.position.set(x,y,z);
    this.application = application;
    scene.add(this.sphere);
};

ApplicationSphere.prototype.addCompany = function(companyData) { // add a CompanySphere to the ApplicationSphere located somewhere inside of the sphere
    var applicationSphereRadius = this.sphere.geometry.parameters.radius;
    var x = this.sphere.position.x + (Math.random() * (applicationSphereRadius * 2) - applicationSphereRadius);
    var y = this.sphere.position.y + (Math.random() * (applicationSphereRadius * 2) - applicationSphereRadius);
    var z = this.sphere.position.z + (Math.random() * (applicationSphereRadius * 2) - applicationSphereRadius);
    var newCompanySphere = new CompanySphere(x, y, z, (companyData.mosaic / 1000) * 5, companyData);
    this.companies.push(newCompanySphere);
    
}
var processData = function(data){
    var applications = {}; // This will be used to store the unique applications
    for (var i = 0; i < data.length; i++) {
        applications[data[i].applications] = 1;
    }
    applications = Object.keys(applications); // Get the array of unique applications
    console.log(applications);
    var applicationSpheres = [];
    for (var i = 0; i < applications.length; i++) {
        var newApplicationSphere = new ApplicationSphere(
            Math.random() * 100 - 50,
            Math.random() * 100 - 50,
            Math.random() * 100 - 50,
            10,
            applications[i]
        );
        applicationSpheres.push(newApplicationSphere);
    }

    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < applicationSpheres.length; j++) {
            if (data[i].applications === applicationSpheres[j].application) {
                applicationSpheres[j].addCompany(data[i]);
                break;
            }
        }
    }
    

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
            processData(localData);
        } else {
            // Handle the received data chunk
            localData = localData.concat(data);
            console.log("chunk received: ", data.length, "total: ", localData.length);
            socket.emit('nextchunk');
        }
    });
});