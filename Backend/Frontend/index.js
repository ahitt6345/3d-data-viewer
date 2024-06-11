import * as THREE from '/ext/three.module.js';
import { PointerLockControls } from '/ext/PointerLockControls.js';
import { TextGeometry } from '/ext/TextGeometry.js';
import { FontLoader } from '/ext/FontLoader.js';
import helvetiker from '/ext/helvetiker_regular.typeface.json' assert { type: 'json' };
// Chrome browser version: 125.0.6422.142 (Official Build) (64-bit) (cohort: Stable) seems to make the pointer controls work better
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 10;
var helvetikerFont = new FontLoader().parse(helvetiker);
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

var dist = function(x,x1,y,y1,z,z1){
    return Math.sqrt(Math.pow(x-x1,2)+Math.pow(y-y1,2)+Math.pow(z-z1,2));
}
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
    const speed = 5;

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
    // display camera coordinates in the bottom right corner of the canvas
    var cameraPosition = camera.position;
    var cameraPositionString = "Camera position: (" + cameraPosition.x.toFixed(2) + ", " + cameraPosition.y.toFixed(2) + ", " + cameraPosition.z.toFixed(2) + ")";
    var cameraPositionElement = document.getElementById("cameraPosition");
    cameraPositionElement.innerHTML = cameraPositionString;
    prevTime = time;
}

animate();
var CompanySphere = function(x,y,z,radius, companyData, application) {
    this.sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshBasicMaterial({color: 0xffff00, opacity: 0.5, transparent: true}));
    // check if coordinates are real numbers
    // search for the application sphere with the same name as the applicationName
    var appSphere = application.sphere;
    this.sphere.position.set(x,y,z);
    var material = new THREE.LineBasicMaterial({color: 0x0000ff});
    var points = [];
    points.push(new THREE.Vector3(appSphere.position.x, appSphere.position.y, appSphere.position.z));
    points.push(new THREE.Vector3(x, y, z));
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var line = new THREE.Line(geometry, material);
    scene.add(line);
    // write the company name on the sphere using threejs text
    var text = new TextGeometry(companyData.company, {
        font: helvetikerFont,
        size: 1,
        depth: 0.1
    });
    var textMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
    var textMesh = new THREE.Mesh(text, textMaterial);
    textMesh.position.set(x, y, z);
    scene.add(textMesh);
    this.companyData = companyData;
    scene.add(this.sphere);
    this.applicationSphere = appSphere;
    // link text to this sphere
    this.textMesh = textMesh;
};

CompanySphere.fromTuple = function(tuple) {
    return new CompanySphere(tuple[0], tuple[1], tuple[2], tuple[3], tuple[4], tuple[5]);
};
class ApplicationSphere {
    constructor(x, y, z, radius, application) {
        this.companies = [];
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            console.log("Invalid coordinates for application sphere: ", application);
        }
        this.sphere = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 32), new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 0.5, transparent: true}));
        this.sphere.position.set(x, y, z);
        this.application = application;
        scene.add(this.sphere);
        var text = new TextGeometry(application, {
            font: helvetikerFont,
            size: 1,
            depth: 0.1
        });
        var textMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
        var textMesh = new THREE.Mesh(text, textMaterial);
        textMesh.position.set(x + radius, y, z);
        scene.add(textMesh);
        this.textMesh = textMesh;
    }
}
ApplicationSphere.fromTuple = function(tuple) {
    var applicationSphere = new ApplicationSphere(tuple[0], tuple[1], tuple[2], tuple[3], tuple[4]);
    // use addCompany to add all the companies
    for (var i = 0; i < tuple[5].length; i++) {
        applicationSphere.addCompany(tuple[5][i]);
    }
    return applicationSphere;
};



ApplicationSphere.prototype.addCompany = function(companyDataTuple) {
    // companyDataTuple is a tuple of the form [x, y, z, radius, companyData]
    // companyData is an object with the following properties: [company, mosaic, industry, total_funding, applications]
    var companyData = companyDataTuple[4];
    var applicationSphereRadius = this.radius;
    var newCompanySphereRadius = Math.max(1,(companyData.mosaic / 1000) * 5);
    var spawnRadius = applicationSphereRadius - newCompanySphereRadius;
    var x = companyDataTuple[0], y = companyDataTuple[1], z = companyDataTuple[2];
    var newCompanySphere = new CompanySphere(x, y, z, newCompanySphereRadius, companyData, this);
    this.companies.push(newCompanySphere);
};
var applicationSpheres = [];
var processData = function(data) {
    // data is structured as an array of application sphere tuples
    for (var i = 0; i < data.length; i++) {
        applicationSpheres.push(ApplicationSphere.fromTuple(data[i]));
        //console.log("Application sphere added: ", data[i]);
    }
    window.applicationSpheres = applicationSpheres;
};

// The updated distance function using objects
var distObj = function(point1, point2) {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2) + Math.pow(point2.z - point1.z, 2));
}


// connect to the server
var localData = [];

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
            localData = localData.concat(data); // data is an array of tuple'ized' application spheres
            console.log("chunk received: ", data.length, "total: ", localData.length);
            socket.emit('nextchunk');
        }
    });
});