import * as THREE from "/ext/three.module.js";
import { TextGeometry } from "/ext/TextGeometry.js";
import { FontLoader } from "/ext/FontLoader.js";
import { PointerLockControls } from "/ext/PointerLockControls.js";
import { Water } from "/ext/water.js";
import { LineMaterial } from "/ext/LineMaterial.js";
/*
	This application is a 3d data visualization tool. Each building is a specific company, the height of the building corresponds to the mosaic score of the company.
	We're going to organize the buildings in a grid of 'blocks' where each block is a grid of buildings matching companies in the same industry/application.

	We're going to use the following colors to represent the different industries. We'll just use a simple color scheme for now, but we can add more colors later.
	
*/

/* todo: add the name of the company near the top of each face and on top of the building.
		 
	todo: Switch from grid format to highway format. 

	The highway format will still use blocks but the blocks will have a maximum width(assuming the width is going away from the highway and the length is parallel to the highway). 
    Each block will have a maximum width and length. The blocks will always be next to the highway, and there's only a one block depth away from the highway. The highway is imaginary
    and is just a plane separating the two lines of blocks on either side of the highway. We don't need to worry about it right now, but we can add it later.

    For now, we'll just have a grid of blocks. We'll have a maximum width and length for each block. The blocks will be organized in a grid pattern with two columns, one for each side of the highway.

    We'll have a maximum width. The length can extend as far as needed.

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
	// Use the font data as needed
	helvetikerFont = new FontLoader().parse(helvetiker);
})();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	45,
	window.innerWidth / 2 / (window.innerHeight / 2),
	0.1,
	3000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setAnimationLoop(animate);
var isPressed = {};
var prevTime = performance.now();

const light = new THREE.DirectionalLight(0xffffff, 1); // white directional light
light.position.set(1, 1, 1).normalize();
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040); // soft ambient light
scene.add(ambientLight);
scene.background = new THREE.Color(0x87ceeb); // Sky blue color

window.camera = camera;

// add a gray ground plane, like a street
// const groundGeometry = new THREE.PlaneGeometry(1000, 10000, 32);
// const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
// const ground = new THREE.Mesh(groundGeometry, groundMaterial);
// ground.rotation.x = -Math.PI / 2;
// scene.add(ground);

// I want a red arrow pointing towards the positive x direction
const arrowHelper = new THREE.ArrowHelper(
	new THREE.Vector3(1, 0, 0),
	new THREE.Vector3(0, 0, 0),
	10,
	0xff0000
);

scene.add(arrowHelper);

// I want a green arrow pointing towards the positive y direction
const arrowHelper2 = new THREE.ArrowHelper(
	new THREE.Vector3(0, 1, 0),
	new THREE.Vector3(0, 0, 0),
	10,
	0x00ff00
);

scene.add(arrowHelper2);

// I want a blue arrow pointing towards the positive z direction
const arrowHelper3 = new THREE.ArrowHelper(
	new THREE.Vector3(0, 0, 1),
	new THREE.Vector3(0, 0, 0),
	10,
	0x0000ff
);
scene.add(arrowHelper3);

// move all the arrows above the ground plane
arrowHelper.position.y = 10;
arrowHelper2.position.y = 10;
arrowHelper3.position.y = 10;
// const waterGeometry = new THREE.PlaneGeometry(80, 1300);
// const water = new Water(waterGeometry, {
// 	color: 0x87ceeb,
// 	scale: 25,
// 	flowDirection: new THREE.Vector2(0, 1),
// 	textureWidth: 128, // Reduce texture size
// 	textureHeight: 512, // Reduce texture size
// 	reflectivity: 0.7, // Reduce reflectivity
// 	shininess: 10, // Reduce shininess
// });
// water.rotation.x = -Math.PI / 2; // Lay flat
// water.position.set(0, 0, 0);
// scene.add(water);
//controls

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());
document.addEventListener("click", () => {
	controls.lock();
});
const FLOOR_HEIGHT = 2;
class Building {
	constructor(mosaic, color, name, data) {
		this.height = Building.generateHeight(mosaic);
		this.color = color;
		this.name = name || "Company";
		this.data = data;
		this.building; // the threejs object
	}
	initBuilding(x, y, z) {
		const geometry = new THREE.BoxGeometry(
			BUILDING_WIDTH,
			this.height,
			BUILDING_WIDTH
		);
		// const material = new THREE.MeshBasicMaterial({ color: this.color });
		// this.building = new THREE.Mesh(geometry, material);
		// this.building.position.set(x, y + this.height / 2, z);
		// scene.add(this.building);

		var materials = [];
		for (let i = 0; i < 6; i++) {
			if (i === 3 || i === 2) {
				// Top and bottom faces: use a simple color material
				const texture = this.createRoofTexture(this.name);
				materials.push(
					new THREE.MeshBasicMaterial({
						map: texture,
						transparent: true,
					})
				);
			} else {
				// Side faces: use a material with text
				const texture = this.createTextTexture(this.name);
				materials.push(
					new THREE.MeshBasicMaterial({
						map: texture,
						transparent: true,
					})
				);
			}
		}
		this.building = new THREE.Mesh(geometry, materials);
		this.building.position.set(x, y + this.height / 2, z);
		scene.add(this.building);
		this.building.userData.building = this;
		// Add black border
		const edges = new THREE.EdgesGeometry(geometry);
		const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
		const wireframe = new THREE.LineSegments(edges, lineMaterial);
		this.building.add(wireframe);
	}
	createTextTexture(text) {
		// Create a canvas element
		const canvas = document.createElement("canvas");
		canvas.width = 256; // Width of the texture
		canvas.height = this.height; // Height of the texture
		const ctx = canvas.getContext("2d");

		// Fill the background (optional)

		ctx.fillStyle = `rgb(${Math.floor(this.color.r * 255)}, ${Math.floor(
			this.color.g * 255
		)}, ${Math.floor(this.color.b * 255)})`;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw the floors of the building based on FLOOR_HEIGHT
		const numFloors = Math.floor(this.height / (FLOOR_HEIGHT * 2));
		for (let i = 0; i < numFloors; i++) {
			const floorY = canvas.height - (i + 1) * (FLOOR_HEIGHT * 2);

			// Draw the floor
			ctx.fillStyle = "#494949"; // dark grey color in hex code
			ctx.fillRect(0, floorY, canvas.width, FLOOR_HEIGHT);
			//add grey cuts in the windows
			ctx.fillStyle = "black";
			for (let j = 0; j < 5; j++) {
				ctx.fillRect(j * 50, floorY, 0.5, FLOOR_HEIGHT);
			}
		}
		// Create a texture from the canvas
		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		return texture;
	}

	createRoofTexture(text) {
		// Create a canvas element
		const canvas = document.createElement("canvas");
		canvas.width = 512; // Width of the texture
		canvas.height = 512; // Height of the texture
		const ctx = canvas.getContext("2d");

		// Fill the background (optional)
		ctx.fillStyle = `rgb(${Math.floor(this.color.r * 255)}, ${Math.floor(
			this.color.g * 255
		)}, ${Math.floor(this.color.b * 255)})`;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw the text in the top-left corner
		ctx.fillStyle = "black";
		ctx.font = "bold 50px Arial";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText(text, 10, 10); // Position at (10, 10)

		// Make canvas texture
		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		return texture;
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
		const minHeight = FLOOR_HEIGHT * 2;
		const maxHeight = 30;

		// Normalize the mosaic score to a value between 0 and 1
		const normalizedScore =
			(mosaicScore - minScore) / (maxScore - minScore);

		// Scale the normalized score to the desired height range
		const height = normalizedScore * (maxHeight - minHeight) + minHeight;

		return height;
	}
}

/* 
	We're going to organize the buildings in a grid of 'blocks' where each block is a grid of buildings matching companies in the same industry/application.
    
*/

const MAX_BUILDINGS_PER_ROW = 5;
const BUILDING_WIDTH = 10;
const BUILDING_SPACING = 4;
class Block {
	constructor(x, y, z, category, categoryName) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.category = category;
		this.categoryName = categoryName;
		this.buildings = [];
		this.block; // the threejs plane object
		Block.blocks.push(this);
	}
	// we have to initialize the block after we figure out how many buildings we have to fit inside of it
	initBlock(isLeftSide, lastBlock) {
		// Constants for spacing and block dimensions
		const spacing = BUILDING_SPACING; // Space between buildings
		const columns = Math.min(MAX_BUILDINGS_PER_ROW, this.buildings.length); // Max buildings per row
		const rows = Math.ceil(this.buildings.length / columns);

		// Calculate block dimensions
		const blockWidth = columns * (BUILDING_WIDTH + spacing) - spacing;
		const blockLength = rows * (BUILDING_WIDTH + spacing) - spacing;
		const blockHeight = 1; // Platform height
		if (lastBlock) {
			this.z =
				lastBlock.block.position.z +
				(columns > 1 ? blockLength / 2 - BUILDING_WIDTH / 2 : 0) +
				lastBlock.block.geometry.parameters.depth / 2 +
				blockLength / 2 +
				5;
		}
		// Platform position
		const sideMultiplier = isLeftSide ? -1 : 1;
		const platformCenterX =
			this.x +
			(sideMultiplier * blockWidth) / 2 -
			(BUILDING_WIDTH / 2) * sideMultiplier;
		const platformY = this.y - blockHeight / 2; // Platform height adjustment
		var platformZ =
			this.z - (columns > 1 ? blockLength / 2 - BUILDING_WIDTH / 2 : 0); // Centered in Z

		// Create a platform for the block
		const platformGeometry = new THREE.BoxGeometry(
			blockWidth + 10,
			blockHeight + 5,
			blockLength + 10
		);
		const platformMaterial = new THREE.MeshBasicMaterial({
			color: 0x808080, // gray color
		});
		this.block = new THREE.Mesh(platformGeometry, platformMaterial);
		this.block.position.set(platformCenterX, platformY, platformZ);

		// Add outline to the top platform
		const edges1 = new THREE.EdgesGeometry(platformGeometry);
		const lineMaterial1 = new THREE.LineBasicMaterial({ color: 0x000000 });
		const wireframe1 = new THREE.LineSegments(edges1, lineMaterial1);
		this.block.add(wireframe1);
		scene.add(this.block);

		// Add text in front of the block facing the highway
		const textGeometry = new TextGeometry(this.categoryName, {
			font: helvetikerFont,
			size: 1,
			depth: 0.2, // Reduced depth of the letters
			curveSegments: 12,
			bevelEnabled: false,
		});
		const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
		const textMesh = new THREE.Mesh(textGeometry, textMaterial);
		textMesh.position.set(
			platformCenterX -
				((sideMultiplier * blockWidth) / 2 +
					5 +
					(sideMultiplier > 0 ? 0 : -10)),

			platformY + 5,
			platformZ
		);
		// If on the right side, rotate the text to face +x axis (right), otherwise -x axis (left)
		textMesh.rotation.y = isLeftSide ? Math.PI / 2 : -Math.PI / 2;

		scene.add(textMesh);
		// Arrange buildings in a grid starting near the highway
		for (let i = 0; i < this.buildings.length; i++) {
			const row = Math.floor(i / columns);
			const col = i % columns;

			// For left side, buildings expand outward negatively; for right side, positively
			const buildingX =
				this.x + sideMultiplier * (col * (BUILDING_WIDTH + spacing));
			const buildingZ = this.z - row * (BUILDING_WIDTH + spacing);
			const buildingY = this.y;

			// Initialize the building
			this.buildings[i].initBuilding(buildingX, buildingY, buildingZ);
		}
	}

	getNumColumns() {
		return Math.min(MAX_BUILDINGS_PER_ROW, this.buildings.length);
	}
	getNumRows() {
		return Math.ceil(this.buildings.length / this.getNumColumns());
	}
	getBlockWidth() {
		const columns = this.getNumColumns();
		return columns * (BUILDING_WIDTH + BUILDING_SPACING) - BUILDING_SPACING;
	}
	getBlockLength() {
		const rows = this.getNumRows();
		return rows * (BUILDING_WIDTH + BUILDING_SPACING) - BUILDING_SPACING;
	}

	// we must generate the buildings before we can initialize the block
	addBuilding(companyData) {
		const building = new Building(
			companyData.mosaic,
			this.category,
			companyData.company,
			companyData
		);
		this.buildings.push(building);
	}
}

window.blocks = Block.blocks = [];

// connect to the server
var rawData = [];
function processRawData(data) {
	/* This is where we start populating the scene with Blocks and Buildings.
	
	First we must find every application by looping through each company in the data.
	To do this we'll have a javascript object where the key is the application name and the value is an array of companies that use that application.

	Then we'll loop through the applications and create a Block for each application. We'll also create a Building for each company in the application and add it to the Block.
	
	*/

	var applications = {};

	for (var i = 0; i < data.length; i++) {
		var company = data[i];
		var application = company.application;
		if (applications[application] == undefined) {
			applications[application] = [];
		}
		applications[application].push(company);
	}
	var appKeys = Object.keys(applications);
	// Initialize a map of colors for each application
	var applicationColors = {};
	var colorIndex = 0;
	function generateColor(index, total) {
		const hue = (index / total) * 360;
		return new THREE.Color(`hsl(${hue}, 100%, 40%)`); // Adjusted lightness to 30% for darker colors
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

	// sort appKeys by the number of companies in each application
	appKeys.sort((a, b) => applications[b].length - applications[a].length);

	// This section works for both sides of the highway
	var leftX = -20;
	var rightX = 20;

	var leftZ = -400;
	var rightZ = -400;

	var y = 5;
	var leftBlocks = [];
	var rightBlocks = [];
	for (var i = 0; i < appKeys.length; i++) {
		var application = appKeys[i];
		var companies = applications[application];
		var category = applicationColors[application];
		if (leftZ <= rightZ) {
			var block = new Block(leftX, y, leftZ, category, application);
			for (var j = 0; j < companies.length; j++) {
				block.addBuilding(companies[j]);
			}
			leftBlocks.push(block);
			var lastBlock = leftBlocks[leftBlocks.length - 2];
			block.initBlock(true, lastBlock);
			leftZ = block.block.position.z + block.getBlockLength();
		} else {
			var block = new Block(rightX, y, rightZ, category, application);
			for (var j = 0; j < companies.length; j++) {
				block.addBuilding(companies[j]);
			}
			rightBlocks.push(block);
			var lastBlock = rightBlocks[rightBlocks.length - 2];
			block.initBlock(false, lastBlock);
			rightZ = block.block.position.z + block.getBlockLength();
		}
	}

	window.blocks = Block.blocks;
}

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
	var time = performance.now();
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
var threejscontainer;
document.body.onload = function () {
	threejscontainer = document.getElementById("threejs-container");
	threejscontainer.appendChild(renderer.domElement);
	document.body.addEventListener("mousemove", (event) => {
		// consider changing this to a click event, lots of lag with mousemove
		const rect = renderer.domElement.getBoundingClientRect();
		const mouse = {
			x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
			y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
		};

		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);

		const intersects = raycaster.intersectObjects(
			scene.children.filter((obj) => obj instanceof THREE.Mesh)
		);

		if (intersects.length > 0) {
			const intersectedObject = intersects[0].object;
			if (
				intersectedObject.userData &&
				intersectedObject.userData.building
			) {
				// console.log(
				// 	`Looking at building: ${intersectedObject.userData.building.name}`
				// );
				const buildingData = intersectedObject.userData.building.data;
				const infoDiv = document.getElementById("overlay");
				infoDiv.innerHTML = `
					<h3>${buildingData.company}</h3>
				`;
				// loop through all the other properties in the buildingData object and add them to the infoDiv
				for (var key in buildingData) {
					if (key != "company") {
						infoDiv.innerHTML += `<p>${key}: ${buildingData[key]}</p>`;
					}
				}
			}
		}
	});
	animate();
};

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
