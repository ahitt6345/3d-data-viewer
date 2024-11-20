import * as THREE from "/ext/three.module.js";
import { TextGeometry } from "/ext/TextGeometry.js";
import { FontLoader } from "/ext/FontLoader.js";
import { PointerLockControls } from "/ext/PointerLockControls.js";

/*
	This application is a 3d data visualization tool. Each building is a specific company, the height of the building corresponds to the mosaic score of the company.
	We're going to organize the buildings in a grid of 'blocks' where each block is a grid of buildings matching companies in the same industry/application.

	We're going to use the following colors to represent the different industries. We'll just use a simple color scheme for now, but we can add more colors later.
	
*/

/* todo: add the name of the company near the top of each face and on top of the building.
		 
	todo: Switch from grid format to highway format. 

	
	*/
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
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / 2 / (window.innerHeight / 2),
	0.1,
	3000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
var isPressed = {};
var prevTime = performance.now();

var light = new THREE.AmbientLight(0xa1a1a1); // soft white light

window.camera = camera;
scene.add(light);

// add a random sphere to the scene
const geometry = new THREE.SphereGeometry(5, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sphere = new THREE.Mesh(geometry, material);

scene.add(sphere);
// add a gray ground plane, like a street
const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 32);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

//controls

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());
document.addEventListener("click", () => {
	controls.lock();
});

class Building {
	constructor(x, y, z, mosaic, color, name, data) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.height = Building.generateHeight(mosaic);
		this.color = 0xffffff;
		this.name = name;
		this.data = data;
		this.building; // the threejs object
	}
	initBuilding() {
		const geometry = new THREE.BoxGeometry(10, this.height, 10);
		const material = new THREE.MeshBasicMaterial({ color: this.color });
		this.building = new THREE.Mesh(geometry, material);
		this.building.position.set(this.x, this.y + this.height / 2, this.z);
		scene.add(this.building);

		// Add black border
		const edges = new THREE.EdgesGeometry(geometry);
		const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
		const wireframe = new THREE.LineSegments(edges, lineMaterial);
		this.building.add(wireframe);

		// add the company name to the building
		const textGeometry = new TextGeometry(this.name, {
			font: helvetikerFont,
			size: 1,
			depth: 0.1,
			curveSegments: 12,
			bevelEnabled: false,
		});
		const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
		const text = new THREE.Mesh(textGeometry, textMaterial);
		text.position.set(this.x, this.y + this.height + 1, this.z);
		scene.add(text);
	}
	static generateHeight(mosaicScore) {
		if (!rawData.minScore || !rawData.maxScore) {
			rawData.minScore =
				Math.min(...rawData.map((company) => company.mosaic)) | 0;
			rawData.maxScore = Math.max(
				...rawData.map((company) => company.mosaic)
			);
		}
		const minScore = rawData.minScore;
		// Define the minimum mosaic score
		const maxScore = rawData.maxScore;
		// Define the maximum mosaic score
		const minHeight = 1;
		const maxHeight = 25;

		// Normalize the mosaic score to a value between 0 and 1
		const normalizedScore =
			(mosaicScore - minScore) / (maxScore - minScore);

		// Scale the normalized score to the desired height range
		const height = normalizedScore * (maxHeight - minHeight) + minHeight;

		return height;
	}
}

/* 
	This is going to be a colored plane that buildings will be placed on. The color of the plane will correspond to the industry/application of the buildings on it.
	The blocks are going to be organized in a grid above the ground plane. 
*/
var SPACE_BETWEEN_BUILDINGS = 10;
class Block {
	constructor(x, y, z, category) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.category = category;
		this.buildings = [];
		this.block; // the threejs plane object
		Block.blocks.push(this);
	}
	// we have to initialize the block after we figure out how many buildings we have to fit inside of it
	initBlock() {
		const geometry = new THREE.PlaneGeometry(100, 100, 32);
		const material = new THREE.MeshBasicMaterial({ color: this.category });
		this.block = new THREE.Mesh(geometry, material);
		this.block.position.set(this.x, this.y, this.z);
		this.block.rotation.x = -Math.PI / 2; // Rotate the block to be parallel with the ground
		scene.add(this.block);
	}
	// we must generate the buildings after we've initialized the block
	addBuilding(companyData) {
		// we can place the first building at the corner of the block, but then we have to place the rest of the buildings in a grid pattern.
		// But since we are doing it iteratively we must place them based on the position of the last building in the buildings array.

		let building;
		if (this.buildings.length == 0) {
			building = new Building(
				this.x - 50,
				this.y + 5, // Move the block slightly above the ground
				this.z - 50,
				companyData.mosaic,
				companyData.color,
				companyData.company,
				companyData
			);
		} else {
			var lastBuilding = this.buildings[this.buildings.length - 1];
			if (lastBuilding.x + SPACE_BETWEEN_BUILDINGS > this.x + 50) {
				// Move to the next row
				building = new Building(
					this.x - 50,
					this.y + 5, // Move the block slightly above the ground
					lastBuilding.z +
						lastBuilding.building.geometry.parameters.depth +
						SPACE_BETWEEN_BUILDINGS,
					companyData.mosaic,
					companyData.color,
					companyData.company + " " + this.buildings.length,
					companyData
				);
			} else {
				building = new Building(
					lastBuilding.x +
						lastBuilding.building.geometry.parameters.width +
						SPACE_BETWEEN_BUILDINGS,
					this.y + 5, // Move the block slightly above the ground
					lastBuilding.z,
					companyData.mosaic,
					companyData.color,
					companyData.company + " " + this.buildings.length,
					companyData
				);
			}
		}

		// create the building object
		building.initBuilding();
		this.buildings.push(building);

		// draw a line from the building to the block
		const points = [];
		points.push(
			new THREE.Vector3(
				building.x,
				building.y + building.height,
				building.z
			)
		);
		points.push(new THREE.Vector3(this.x, this.y, this.z));
		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
		const line = new THREE.Line(geometry, material);
		scene.add(line);
	}
}

window.blocks = Block.blocks = [];
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
		default:
			break;
	}
});
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
		default:
			break;
	}
});
function animate() {
	requestAnimationFrame(animate);
	var time = performance.now();
	var delta = (time - prevTime) / 30;
	const speed = 2;
	// get direction the camera is facing
	const direction = new THREE.Vector3(0, 0, -1);
	const rotation = new THREE.Euler(0, 0, 0, "XYZ");
	rotation.set(
		controls.getObject().rotation.x,
		controls.getObject().rotation.y,
		controls.getObject().rotation.z
	);
	direction.applyEuler(rotation);

	if (isPressed["W"]) {
		// forward
		camera.position.add(direction.multiplyScalar(speed));

		//camera.position.x += speed;
	}
	if (isPressed["S"]) {
		// backward
		camera.position.add(direction.multiplyScalar(-speed));

		//camera.position.x -= speed;
	}

	if (isPressed["A"]) {
		// left
		const left = new THREE.Vector3(-1, 0, 0);
		const leftDirection = left.applyQuaternion(
			controls.getObject().quaternion
		);
		camera.position.add(leftDirection.multiplyScalar(speed));

		//camera.position.z -= speed;
	}
	if (isPressed["D"]) {
		// right
		const right = new THREE.Vector3(1, 0, 0);
		const rightDirection = right.applyQuaternion(
			controls.getObject().quaternion
		);
		camera.position.add(rightDirection.multiplyScalar(speed));

		//camera.position.z += speed;
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

document.body.onload = function () {
	var threejscontainer = document.getElementById("threejs-container");
	threejscontainer.appendChild(renderer.domElement);
	animate();
};

// connect to the server
var rawData = [];
function processRawData(data) {
	/* This is where we start populating the scene with Blocks and Buildings.
	
	First we must find every application by looping through each company in the data.
	To do this we'll have a javascript object where the key is the application name and the value is an array of companies that use that application.

	Then we'll loop through the applications and create a Block for each application. We'll also create a Building for each company in the application and add it to the Block.
	
	*/
	/* Sort so that it groups all the companies by their applications, and sort the individual companies by their mosaic score*/
	data.sort((a, b) => {
		// if (a.application < b.application) {
		// 	return -1;
		// } else if (a.application > b.application) {
		// 	return 1;
		// } else {
		if (a.mosaic < b.mosaic) {
			return -1;
		} else if (a.mosaic > b.mosaic) {
			return 1;
		} else {
			return 0;
		}
		// }
	});
	var applications = {};
	for (var i = 0; i < data.length; i++) {
		var company = data[i];
		var application = company.application;
		if (applications[application] == undefined) {
			applications[application] = [];
		}
		applications[application].push(company);
	}
	// Initialize a map of colors for each application
	var applicationColors = {};
	var colorIndex = 0;
	var colors = [
		0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0x800000,
		0x808000, 0x008000, 0x800080, 0x008080, 0x000080,
	];
	function generateColor(index, total) {
		const hue = (index / total) * 360;
		return new THREE.Color(`hsl(${hue}, 100%, 50%)`);
	}

	const totalApplications = Object.keys(applications).length;

	for (var application in applications) {
		applicationColors[application] = generateColor(
			colorIndex,
			totalApplications
		);
		colorIndex++;
	}

	// loop through the applications and create a block for each application
	var x = -500;
	var z = -500;
	colorIndex = 0;
	for (var application in applications) {
		var block = new Block(
			x,
			ground.position.y + 1,
			z,
			applicationColors[application]
		);
		block.initBlock();
		for (var i = 0; i < applications[application].length; i++) {
			block.addBuilding(applications[application][i]);
		}
		x += 100;
		if (x > 500) {
			x = -500;
			z += 100;
		}
		console.log(`${application} was processed successfully!`);
		console.log(applications[application]);
		colorIndex++;
	}
	window.blocks = Block.blocks;
}
const socket = io("http://localhost:3000");
socket.on("connect", () => {
	console.log("connected");
	socket.emit("needRawData");
	socket.on("rawdata", (data) => {
		rawData = data;
		//processData(rawData);
		//console.log(rawData);
		processRawData(rawData);
	});
	socket.on("rawPromptResponse", (data) => {
		// remove all spheres and cylinders from the scene
		scene.remove.apply(scene, scene.children);
		// add back the lighting
		scene.add(new THREE.AmbientLight(0x404040));
		var light = new THREE.DirectionalLight(0xffffff);
		light.position.set(1, 1, 1).normalize();
		scene.add(light);

		rawData = data;
	});
});
