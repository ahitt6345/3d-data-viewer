import * as THREE from "/ext/three.module.js";
import { PointerLockControls } from "/ext/PointerLockControls.js";
import { TextGeometry } from "/ext/TextGeometry.js";
import { FontLoader } from "/ext/FontLoader.js";

//import helvetiker from "/ext/helvetiker_regular.typeface.json" assert { type: "json" };
async function loadFont() {
	try {
		const response = await fetch("/ext/helvetiker_regular.typeface.json");
		const helvetiker = await response.json();
		return helvetiker;
	} catch (error) {
		console.error("Error loading JSON:", error);
	}
}

// Using an IIFE to handle async/await at the top level
var helvetiker;
var helvetikerFont;
(async () => {
	helvetiker = await loadFont();
	console.log(helvetiker);
	// Use the font data as needed
	helvetikerFont = new FontLoader().parse(helvetiker);
})();
// Chrome browser version: 125.0.6422.142 (Official Build) (64-bit) (cohort: Stable) seems to make the pointer controls work better
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 10;

var isPressed = {};

document.body.onload = function () {
	document.getElementById("order").onclick =
		reorderAndRepositionCompanySpheres;
};
document.addEventListener("keydown", (event) => {
	const keyCode = event.keyCode;
	switch (keyCode) {
		case 87: // W key
			isPressed["W"] = true;
			break;
		case 83: // S key
			isPressed["S"] = true;
			break;
		case 65: // A key
			isPressed["A"] = true;
			break;
		case 68: // D key
			isPressed["D"] = true;
			break;
		case 32: // Space bar
			isPressed["Space"] = true;
			break;
		case 67: // C key
			isPressed["C"] = true;
			break;
	}
});

var dist = function (x, x1, y, y1, z, z1) {
	return Math.sqrt(
		Math.pow(x - x1, 2) + Math.pow(y - y1, 2) + Math.pow(z - z1, 2)
	);
};
document.addEventListener("keyup", (event) => {
	const keyCode = event.keyCode;
	switch (keyCode) {
		case 87: // W key
			isPressed["W"] = false;
			break;
		case 83: // S key
			isPressed["S"] = false;
			break;
		case 65: // A key
			isPressed["A"] = false;
			break;
		case 68: // D key
			isPressed["D"] = false;
			break;
		case 32: // Space bar
			isPressed["Space"] = false;
			break;
		case 67: // C key
			isPressed["C"] = false;
			break;
	}
});

var controls = new PointerLockControls(camera, document.body);

document.addEventListener(
	"click",
	() => {
		// Lock the pointer when the user clicks on the screen
		controls.lock();
	},
	false
);

scene.add(controls.getObject());
var prevTime = performance.now();

function animate() {
	requestAnimationFrame(animate);
	var time = performance.now();
	var delta = (time - prevTime) / 30;

	const direction = controls
		.getDirection(new THREE.Vector3(0, 0, -1))
		.clone();
	const speed = 5;

	if (isPressed["W"]) {
		// forward
		camera.position.add(direction.multiplyScalar(speed));
	}
	if (isPressed["S"]) {
		// backward
		camera.position.add(direction.multiplyScalar(-speed));
	}
	if (isPressed["A"]) {
		// left
		const left = new THREE.Vector3(-1, 0, 0);
		const leftDirection = left.applyQuaternion(
			controls.getObject().quaternion
		);
		camera.position.add(leftDirection.multiplyScalar(speed));
	}
	if (isPressed["D"]) {
		// right
		const right = new THREE.Vector3(1, 0, 0);
		const rightDirection = right.applyQuaternion(
			controls.getObject().quaternion
		);
		camera.position.add(rightDirection.multiplyScalar(speed));
	}
	if (isPressed["Space"]) {
		// up
		camera.position.y += speed;
	}
	if (isPressed["C"]) {
		// down
		camera.position.y -= speed;
	}
	renderer.render(scene, camera);
	// display camera coordinates in the bottom right corner of the canvas for debugging purposes
	var cameraPosition = camera.position;
	var cameraPositionString =
		"Camera position: (" +
		cameraPosition.x.toFixed(2) +
		", " +
		cameraPosition.y.toFixed(2) +
		", " +
		cameraPosition.z.toFixed(2) +
		")";
	var cameraPositionElement = document.getElementById("cameraPosition");
	cameraPositionElement.innerHTML = cameraPositionString;
	prevTime = time;
}

animate();
var CompanySphere = function (x, y, z, radius, companyData, application) {
	this.sphere = new THREE.Mesh(
		new THREE.SphereGeometry(radius, 32, 32),
		new THREE.MeshBasicMaterial({
			color: 0xffff00,
			opacity: 0.5,
			transparent: true,
		})
	);
	this.sphere.position.set(x, y, z);

	var appSphere = application.sphere;
	this.applicationSphere = appSphere;

	// Create the initial line
	var material = new THREE.LineBasicMaterial({ color: 0x0000ff });
	var points = [];
	points.push(
		new THREE.Vector3(
			appSphere.position.x,
			appSphere.position.y,
			appSphere.position.z
		)
	);
	points.push(new THREE.Vector3(x, y, z));
	var geometry = new THREE.BufferGeometry().setFromPoints(points);
	this.line = new THREE.Line(geometry, material);

	// Add the initial line to the scene
	scene.add(this.line);

	// Create and position the text mesh
	var text = new TextGeometry(companyData.company, {
		font: helvetikerFont,
		size: 1,
		depth: 0.1,
	});
	var textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
	this.textMesh = new THREE.Mesh(text, textMaterial);
	this.textMesh.position.set(x, y, z);
	scene.add(this.textMesh);

	this.companyData = companyData;

	// Add the sphere to the scene
	scene.add(this.sphere);
};

CompanySphere.fromTuple = function (tuple) {
	return new CompanySphere(...tuple);
};

CompanySphere.prototype.updatePosition = function (x, y, z) {
	if (isNaN(x) || isNaN(y) || isNaN(z)) {
		console.log(
			"Invalid coordinates for company sphere: ",
			this.companyData
		);
	}

	// Update position of the sphere and text mesh
	this.sphere.position.set(x, y, z);
	this.textMesh.position.set(x, y, z);

	// Remove the old line
	if (this.line) {
		scene.remove(this.line);
	}

	// Create a new line from the application sphere to the new position
	var appSphere = this.applicationSphere;
	var material = new THREE.LineBasicMaterial({ color: 0x0000ff });
	var points = [];
	points.push(
		new THREE.Vector3(
			appSphere.position.x,
			appSphere.position.y,
			appSphere.position.z
		)
	);
	points.push(new THREE.Vector3(x, y, z));
	var geometry = new THREE.BufferGeometry().setFromPoints(points);
	this.line = new THREE.Line(geometry, material);

	// Add the new line to the scene
	scene.add(this.line);
};

class ApplicationSphere {
	constructor(x, y, z, radius, application) {
		this.companies = [];
		if (isNaN(x) || isNaN(y) || isNaN(z)) {
			console.log(
				"Invalid coordinates for application sphere: ",
				application
			);
		}
		var height = radius * 2.5;
		this.sphere = new THREE.Mesh(
			new THREE.CylinderGeometry(radius, radius, height, 32),
			new THREE.MeshBasicMaterial({
				color: 0xff0000,
				opacity: 0.5,
				transparent: true,
			})
		);
		this.sphere.position.set(x, y, z);
		this.application = application;
		scene.add(this.sphere);
		var text = new TextGeometry(application, {
			font: helvetikerFont,
			size: 1,
			depth: 0.1,
		});
		var textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		var textMesh = new THREE.Mesh(text, textMaterial);
		textMesh.position.set(x + radius, y, z);
		scene.add(textMesh);
		this.textMesh = textMesh;
	}
}
ApplicationSphere.fromTuple = function (tuple) {
	var applicationSphere = new ApplicationSphere(...tuple);
	// use addCompany to add all the companies
	for (var i = 0; i < tuple[5].length; i++) {
		applicationSphere.addCompany(tuple[5][i]);
	}
	return applicationSphere;
};

ApplicationSphere.prototype.addCompany = function (companyDataTuple) {
	// companyDataTuple is a tuple of the form [x, y, z, radius, companyData]
	// companyData is an object with the following properties: [company, mosaic, industry, total_funding, applications]
	var companyData = companyDataTuple[4];
	var applicationSphereRadius = this.radius;
	var newCompanySphereRadius = Math.max(1, (companyData.mosaic / 1000) * 5);
	var spawnRadius = applicationSphereRadius - newCompanySphereRadius;
	var x = companyDataTuple[0],
		y = companyDataTuple[1],
		z = companyDataTuple[2];
	var newCompanySphere = new CompanySphere(
		x,
		y,
		z,
		newCompanySphereRadius,
		companyData,
		this
	);
	this.companies.push(newCompanySphere);
};
var applicationSpheres = [];
var processData = function (data) {
	// data is structured as an array of application sphere tuples
	for (var i = 0; i < data.length; i++) {
		applicationSpheres.push(ApplicationSphere.fromTuple(data[i]));
		//console.log("Application sphere added: ", applicationSpheres[i]);
	}
	rotateSpheresToFaceNext(applicationSpheres);
	positionCompaniesAroundCylinder(applicationSpheres);
	window.applicationSpheres = applicationSpheres;
};

var isMosaic = true;
function reorderAndRepositionCompanySpheres() {
	// By default the company spheres are ordered by their mosaic value, we want to be able to toggle between ordering by moasic score and by total funding.
	// The "order" value affects four things in the company sphere object: the position of the sphere, the position of the text, the position of the line connecting the company sphere to the application sphere, and the company sphere's radius.
	// First we have to sort the company spheres by the desired value, then we have to reposition the company spheres based on the new order.
	// The company spheres are ordered by their mosaic value by default
	var order = isMosaic ? "total_funding" : "mosaic";
	isMosaic = !isMosaic;
	// Sort the company spheres by the desired value
	// Reposition the company spheres based on the new order
	var translateToOrigin = function (point, origin) {
		return {
			x: point.x - origin.x,
			y: point.y - origin.y,
			z: point.z - origin.z,
		};
	};

	// Function to translate a point back to the original position
	var translateFromOrigin = function (point, origin) {
		return {
			x: point.x + origin.x,
			y: point.y + origin.y,
			z: point.z + origin.z,
		};
	};
	applicationSpheres.forEach((applicationSphere) => {
		applicationSphere.companies.sort((b, a) => {
			return a.companyData[order] - b.companyData[order];
		});

		// reposition the first company sphere to the center of the application sphere
		// console.log(applicationSphere.sphere);
		//console.log(applicationSphere.sphere.position);
		applicationSphere.companies[0].updatePosition(
			applicationSphere.sphere.position.x,
			applicationSphere.sphere.position.y,
			applicationSphere.sphere.position.z
		);
		//console.log(applicationSphere.companies[0].sphere.position);
		// // update the first company sphere's radius to reflect the new order
		// let firstCompany = applicationSphere.companies[0];
		// // dispose old geometry
		// firstCompany.sphere.geometry.dispose();
		// // create new geometry
		// firstCompany.sphere.geometry = new THREE.SphereGeometry(
		// 	order === "mosaic"
		// 		? (firstCompany.companyData.mosaic / 1000) * 5
		// 		: firstCompany.companyData.total_funding / 100000000,
		// 	32,
		// 	32
		// );
		let companies = applicationSphere.companies;
		// reposition the rest of the company spheres to spiral out from the center of the application sphere
		for (var i = 1; i < companies.length; i++) {
			var prevCompanySphere = companies[i - 1];
			var curCompanySphere = companies[i];
			// console.log(
			// 	"prevCompanySphere: ",
			// 	prevCompanySphere.sphere.position
			// );
			// console.log("curCompanySphere: ", curCompanySphere.sphere.position);
			// Translate the previous company sphere to the origin

			var origin = {
				x: applicationSphere.sphere.position.x,
				y: applicationSphere.sphere.position.y,
				z: applicationSphere.sphere.position.z,
			};

			var translatedPrevPoint = translateToOrigin(
				{
					x: prevCompanySphere.sphere.position.x,
					y: prevCompanySphere.sphere.position.y,
					z: prevCompanySphere.sphere.position.z,
				},
				origin
			);

			// console.log("origin", origin);
			// console.log("translatedPrevPoint", translatedPrevPoint);
			// Calculate the next point in the spiral at the origin
			var currentRadius =
				prevCompanySphere.sphere.geometry.parameters.radius;
			var nextRadius = curCompanySphere.sphere.geometry.parameters.radius;
			// console.log(translatedPrevPoint, origin);
			var nextPoint = generateNextSpiralPoint(
				translatedPrevPoint,
				currentRadius,
				nextRadius,
				i
			);
			// console.log("nextPoint:", nextPoint);
			// Translate the next point back to the original position
			var nextPosition = translateFromOrigin(nextPoint, origin);

			// Update the position of the current company sphere

			curCompanySphere.updatePosition(
				nextPosition.x,
				nextPosition.y,
				nextPosition.z
			);

			// Update the radius of the current company sphere using resize
		}
	});

	document.getElementById("order").innerHTML = isMosaic
		? "Order by total funding"
		: "Order by mosaic score";
}

var generateNextSpiralPoint = function (
	currentPoint,
	currentRadius,
	nextRadius,
	index
) {
	// if (!generateNextSpiralPoint.logged) {
	// 	generateNextSpiralPoint.logged = true;
	// 	console.log("currentPoint: ", currentPoint);
	// 	console.log("currentRadius: ", currentRadius);
	// 	console.log("nextRadius: ", nextRadius);
	// }
	// Spiral parameters
	var spacing = 1.3; // Additional spacing to make it look nice (you can adjust this value)
	var angle = 90.5 * (Math.PI / 180); // Fixed angle in radians (110 degrees)

	// Calculate the distance needed to avoid overlap
	var r = (currentRadius + nextRadius) * spacing;

	// Calculate the angle relative to the origin
	var dx = currentPoint.x;
	var dz = currentPoint.z;
	var currentAngle = Math.atan2(dz, dx);

	// Calculate the new angle by adding the fixed angle to the current angle
	var newAngle = currentAngle + angle;

	// Calculate the new coordinates in the spiral (X-Z plane)
	var x = currentPoint.x + r * Math.cos(newAngle);
	var z = currentPoint.z + r * Math.sin(newAngle);
	var y = index * 0.75; // Keeping y constant

	return { x: x, y: y, z: z };
};
function positionCompaniesAroundCylinder(applicationSpheres) {
	const heightStep = 2; // Distance between each company along the height of the cylinder
	const radiusOffset = 1.2; // Offset from the surface of the cylinder

	applicationSpheres.forEach((appSphere) => {
		const appRadius = appSphere.sphere.geometry.parameters.radiusTop; // Assuming the cylinder's top radius
		const appHeight = appSphere.sphere.geometry.parameters.height;
		const numberOfCompanies = appSphere.companies.length; // Dynamic number of companies

		appSphere.companies.forEach((company, index) => {
			const angle = (index / numberOfCompanies) * Math.PI * 2;
			const height = ((index * heightStep) % appHeight) - appHeight / 2;

			const localX = (appRadius + radiusOffset) * Math.cos(angle);
			const localY = height;
			const localZ = (appRadius + radiusOffset) * Math.sin(angle);

			const position = new THREE.Vector3(localX, localY, localZ);
			position.applyQuaternion(appSphere.sphere.quaternion); // Rotate to match the cylinder's orientation
			position.add(appSphere.sphere.position); // Translate to the cylinder's position

			company.updatePosition(position.x, position.y, position.z);
		});
	});
}
function rotateSpheresToFaceNext(spheres) {
	for (let i = 1; i < spheres.length - 1; i++) {
		let currentSphere = spheres[i].sphere;
		let nextSphere = spheres[i + 1].sphere;

		// Calculate the direction vector from current to next sphere
		let direction = new THREE.Vector3();
		direction
			.subVectors(nextSphere.position, currentSphere.position)
			.normalize();

		// Calculate the quaternion to rotate the cylinder
		let up = new THREE.Vector3(0, 1, 0); // Assuming the cylinder is initially aligned with the Y-axis
		let quaternion = new THREE.Quaternion();
		quaternion.setFromUnitVectors(up, direction);

		// Apply the quaternion rotation to the current sphere
		currentSphere.quaternion.copy(quaternion);
	}
}

// used on the server end to generate the spiral points
// function placeSpheresInSpiral(cylinder, spheres) {
// 	const cylinderHeight = cylinder.height;
// 	const cylinderRadius = cylinder.radius;
// 	const numSpheres = spheres.length;
// 	const turns = 3; // Number of complete turns around the cylinder
// 	const angleStep = (2 * Math.PI * turns) / numSpheres;
// 	const heightStep = cylinderHeight / numSpheres;

// 	for (let i = 0; i < numSpheres; i++) {
// 		const angle = i * angleStep;
// 		const y = cylinderHeight / 2 - i * heightStep;
// 		const x = cylinderRadius * Math.cos(angle);
// 		const z = cylinderRadius * Math.sin(angle);

// 		spheres[i].sphere.position.set(x, y, z);
// 	}
// }

// The updated distance function using objects
var distObj = function (point1, point2) {
	return Math.sqrt(
		Math.pow(point2.x - point1.x, 2) +
			Math.pow(point2.y - point1.y, 2) +
			Math.pow(point2.z - point1.z, 2)
	);
};

// connect to the server
var rawData = [];

const socket = io("http://localhost:3000");
socket.on("connect", () => {
	console.log("connected");
	socket.emit("getdata");
	socket.on("data", (data) => {
		if (data === "End of data") {
			console.log("All data received");
			processData(rawData);
		} else {
			// Handle the received data chunk
			rawData = rawData.concat(data); // data is an array of tuple'ized' application spheres
			console.log(
				"chunk received: ",
				data.length,
				"total: ",
				rawData.length
			);
			socket.emit("nextchunk");
		}
	});
});
