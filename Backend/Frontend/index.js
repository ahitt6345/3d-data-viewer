import * as THREE from '/ext/three.module.js';
import { PointerLockControls } from '/ext/PointerLockControls.js';
import { TextGeometry } from '/ext/TextGeometry.js';
import { FontLoader } from '/ext/FontLoader.js';
import helvetiker from '/ext/helvetiker_regular.typeface.json' assert { type: 'json' };
// render a sphere
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
    const speed = 0.5;

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
var CompanySphere = function(x,y,z,radius, companyData, applicationSphere) {
    this.sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshBasicMaterial({color: 0xffff00, opacity: 0.5, transparent: true}));
    // check if coordinates are real numbers
    var appSphere = applicationSphere.sphere;
    
    // if (isNaN(x) || isNaN(y) || isNaN(z) || dist(x, applicationSphere.sphere.position.x, y, applicationSphere.sphere.position.y, z, applicationSphere.sphere.position.z) > applicationSphere.sphere.geometry.parameters.radius) {
    //     console.log("Invalid coordinates for company sphere: ", companyData.company, "At applicationSpher: ", applicationSphere.application);
        
    //     // change appSphere's color to green
    //     appSphere.material.color.setHex(0x00ff00);
        
    //     //draw a blue line from the application sphere to the company sphere
    //     // var material = new THREE.LineBasicMaterial({color: 0x0000ff});
    //     // var points = [];
    //     // points.push(new THREE.Vector3(appSphere.position.x, appSphere.position.y, appSphere.position.z));
    //     // points.push(new THREE.Vector3(x, y, z));
    //     // var geometry = new THREE.BufferGeometry().setFromPoints(points);
    //     // var line = new THREE.Line(geometry, material);
    //     // scene.add(line);

    //     // generate new coordinates for the company sphere that are contained within the radius of the application sphere
    //     var spawnRadius = appSphere.geometry.parameters.radius - radius;
    //     var attempts = 0;
    //     do {
    //         x = Math.random() * 2 - 1;
    //         y = Math.random() * 2 - 1;
    //         z = Math.random() * 2 - 1;

    //         var length = Math.sqrt(x * x + y * y + z * z);
    //         if (length > 1) continue;
    //         x = appSphere.position.x + (x / length) * spawnRadius;
    //         y = appSphere.position.y + (y / length) * spawnRadius;
    //         z = appSphere.position.z + (z / length) * spawnRadius;

    //         attempts++;
    //     } while (attempts < 100 && dist(x, appSphere.position.x, y, appSphere.position.y, z, appSphere.position.z) > appSphere.geometry.parameters.radius);

    //     if (attempts >= 100) {
    //         console.log("Failed to place company sphere within application sphere after 100 attempts.");
    //         return;
    //     }

    //     // final check

    //     if (isNaN(x) || isNaN(y) || isNaN(z) || dist(x, appSphere.position.x, y, appSphere.position.y, z, appSphere.position.z) > appSphere.geometry.parameters.radius) {
    //         console.log("Invalid coordinates for company sphere: ", companyData.company, "At applicationSpher: ", applicationSphere.application, "Even after corrective measures.");
    //         //return;
    //     }
    // }
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
    this.applicationSphere = applicationSphere;
};
var ApplicationSphere = function(x,y,z,radius, application) {
    this.companies = [];
    // check if coordinates are real numbers
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
        console.log("Invalid coordinates for application sphere: ", application);
        //return;
    }
    this.sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 0.5, transparent: true}));
    this.sphere.position.set(x,y,z);
    this.application = application;
    scene.add(this.sphere);
    // Write the application in the sphere using threejs text
    var text = new TextGeometry(application, {
        font: helvetikerFont,
        size: 1,
        depth: 0.1
    });
    var textMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
    var textMesh = new THREE.Mesh(text, textMaterial);
    textMesh.position.set(x, y, z);
    scene.add(textMesh);
};

function randomPointInSphere(center, R) {
    // Generate a random angle θ between 0 and 2π
    let theta = Math.random() * 2 * Math.PI;

    // Generate a random angle φ between 0 and π
    let phi = Math.random() * Math.PI;

    // Generate a random value u between 0 and 1 and compute the radius r
    let u = Math.random();
    let r = R * Math.cbrt(u); // Use the cube root of u to ensure uniform distribution

    // Convert spherical coordinates to Cartesian coordinates
    let x = r * Math.sin(phi) * Math.cos(theta);
    let y = r * Math.sin(phi) * Math.sin(theta);
    let z = r * Math.cos(phi);

    // Translate the point to be centered at (center.x, center.y, center.z)
    x += center.x;
    y += center.y;
    z += center.z;

    return { x: x, y: y, z: z };
}

ApplicationSphere.prototype.addCompany = function(companyData) {
    var applicationSphereRadius = this.sphere.geometry.parameters.radius;
    var newCompanySphereRadius = (companyData.mosaic / 1000) * 5;
    var spawnRadius = applicationSphereRadius - newCompanySphereRadius;

    var x, y, z;
    var attempts = 0; // Prevent infinite loop
    do {
        // Generate random point within the application sphere
        var randomPoint = randomPointInSphere(this.sphere.position, spawnRadius);
        x = randomPoint.x;
        y = randomPoint.y;
        z = randomPoint.z;

        attempts++;
    } while (attempts < 100 && this.companies.some((sphere) => {
        // Make sure the spheres don't overlap
        var distance = dist(x, sphere.sphere.position.x, y, sphere.sphere.position.y, z, sphere.sphere.position.z);
        return distance < sphere.sphere.geometry.parameters.radius + newCompanySphereRadius;
    }));

    if (attempts < 100) {
        var newCompanySphere = new CompanySphere(x, y, z, newCompanySphereRadius, companyData, this);
        this.companies.push(newCompanySphere);
    } else {
        console.log("Failed to place company sphere within application sphere after 100 attempts.");
    }
};

var processData = function(data) {
    var applications = {}; // This will be used to store the unique applications
    for (var i = 0; i < data.length; i++) {
        applications[data[i].applications] = 1;
    }
    applications = Object.keys(applications); // Get the array of unique applications
    console.log(applications);
    var applicationSpheres = [];
    var applicationSphereRadius = 50;

    for (var i = 0; i < applications.length; i++) {
        var x, y, z;
        var attempts = 0;
        var tooClose;
        do {
            var randomPoint = randomPointInSphere({ x: 0, y: 0, z: 0 }, 500);
            x = randomPoint.x;
            y = randomPoint.y;
            z = randomPoint.z;
            attempts++;

            tooClose = applicationSpheres.some((sphere) => {
                return distObj({ x: x, y: y, z: z }, sphere.sphere.position) < applicationSphereRadius * 2;
            });
        } while (attempts < 100 && tooClose);

        if (!tooClose) {
            var newApplicationSphere = new ApplicationSphere(
                x, y, z,
                applicationSphereRadius,
                applications[i]
            );
            applicationSpheres.push(newApplicationSphere);
        } else {
            console.log("Failed to place application sphere after 100 attempts.");
        }
    }

    for (var i = 0; i < data.length; i++) {
        var foundApplicationSphere = false;
        for (var j = 0; j < applicationSpheres.length; j++) {
            if (data[i].applications === applicationSpheres[j].application) {
                applicationSpheres[j].addCompany(data[i]);
                foundApplicationSphere = true;
                break;
            }
        }
        if (!foundApplicationSphere) {
            console.log("Failed to find application sphere for company: ", data[i].company);
        }
    }
};

// The updated distance function using objects
var distObj = function(point1, point2) {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2) + Math.pow(point2.z - point1.z, 2));
}


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