import * as THREE from "/ext/three.module.js";
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
	window.innerWidth / 2 / (window.innerHeight / 2),
	0.1,
	3000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth * 0.75, window.innerHeight / 2);
//document.body.appendChild(renderer.domElement);

camera.position.z = 10;
camera.quaternion.set(0.5, 0.5, 0.5, -0.5);
camera.position.set(-250, 1788, 300);
camera.setFocalLength(50);
var light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, 120);
light.target.position.set(0, 0, 0);
window.light = light;
scene.add(light);

light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(-580, 300, 135);
light.target.position.set(0, 0, 0);
window.light = light;
scene.add(light);

var light = new THREE.AmbientLight(0xa1a1a1); // soft white light

window.camera = camera;
scene.add(light);
var isPressed = {};
// scene.background = new THREE.Color(0xffffff);
// document.addEventListener("keydown", (event) => {
// 	const keyCode = event.keyCode;
// 	switch (keyCode) {
// 		case 87: // W key
// 			isPressed["W"] = true;
// 			break;
// 		case 83: // S key
// 			isPressed["S"] = true;
// 			break;
// 		case 65: // A key
// 			isPressed["A"] = true;
// 			break;
// 		case 68: // D key
// 			isPressed["D"] = true;
// 			break;
// 		case 32: // Space bar
// 			isPressed["Space"] = true;
// 			break;
// 		case 67: // C key
// 			isPressed["C"] = true;
// 			break;
// 	}
// });

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

var prevTime = performance.now();

// cover the lower parts of the cylinders that are going to be generated in the future by creating a large black box

var geometry = new THREE.BoxGeometry(12000, 1, 3000);
var material = new THREE.MeshBasicMaterial({ color: 0x000000 });
var coverbox = new THREE.Mesh(geometry, material);

coverbox.position.set(-2000, 204, -206);

// rotate coverbox 90 degrees in the xz axis
coverbox.rotation.y = Math.PI / 2;

scene.add(coverbox);
var cameraPositionToGoTo = 300;
var timeToMove = false;
var currentCameraSpeed = 1;

function animate() {
	requestAnimationFrame(animate);
	var time = performance.now();
	var delta = (time - prevTime) / 30;
	const speed = 2;

	if (isPressed["W"]) {
		// forward
		// camera.position.add(direction.multiplyScalar(speed));

		camera.position.x += speed;
	}
	if (isPressed["S"]) {
		// backward
		// camera.position.add(direction.multiplyScalar(-speed));

		camera.position.x -= speed;
	}

	if (isPressed["A"]) {
		// left
		// const left = new THREE.Vector3(-1, 0, 0);
		// const leftDirection = left.applyQuaternion(
		// 	controls.getObject().quaternion
		// );
		// camera.position.add(leftDirection.multiplyScalar(speed));

		camera.position.z -= speed;
	}
	if (isPressed["D"]) {
		// right
		// const right = new THREE.Vector3(1, 0, 0);
		// const rightDirection = right.applyQuaternion(
		// 	controls.getObject().quaternion
		// );
		// camera.position.add(rightDirection.multiplyScalar(speed));

		camera.position.z += speed;
	}

	if (isPressed["Space"]) {
		// up
		camera.position.y += speed;
	}
	if (isPressed["C"]) {
		// down
		camera.position.y -= speed;
	}
	var blah; // to separate the if statements from the rest of the code
	if (timeToMove) {
		if (camera.position.z < cameraPositionToGoTo) {
			camera.position.z += Math.min(
				currentCameraSpeed,
				Math.abs(camera.position.z - cameraPositionToGoTo)
			);
		} else if (camera.position.z > cameraPositionToGoTo) {
			camera.position.z -= Math.min(
				currentCameraSpeed,
				Math.abs(camera.position.z - cameraPositionToGoTo)
			);
		} else {
			timeToMove = false;
		}
		currentCameraSpeed = 5;
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
	// we have a input range slider that we want to control how far we can move the camera from left to right
	animate();
	var slider = document.getElementById("range");
	slider.oninput = function () {
		// get the value of the slider
		var value = +this.value;

		// set the camera position to the value of the slider
		cameraPositionToGoTo = 300 + value * 60;
		timeToMove = true;
		currentCameraSpeed = 5;
	};

	var threejscontainer = document.getElementById("threejs-container");
	threejscontainer.appendChild(renderer.domElement);

	var chatSubmitButton = document.getElementById("submitChat");

	var userInput = document.getElementById("clientChatText");
	var chatBox = document.getElementById("message_container");

	chatSubmitButton.onclick = function () {
		var message = userInput.value;
		var messageElement = document.createElement("div");
		messageElement.innerHTML = message;
		messageElement.className = "chat_message";
		chatBox.appendChild(messageElement);
		socket.emit("chat message", message);
	};

	renderer.domElement.addEventListener("mousemove", (event) => {
		const rect = renderer.domElement.getBoundingClientRect();
		const mouse = new THREE.Vector2();
		mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);

		const intersects = raycaster.intersectObjects(scene.children, true);
		if (intersects.length > 0) {
			const intersectedObject = intersects[0].object;
			if (intersectedObject.geometry instanceof THREE.BoxGeometry) {
				console.log("Intersected object is a cube");

				// Find the intersected CompanySphere
				const intersectedCompanySphere = applicationSpheres
					.flatMap((appSphere) => appSphere.companies)
					.find((company) => company.sphere === intersectedObject);

				if (intersectedCompanySphere) {
					const companyInfoContent = document.getElementById(
						"company-info-content"
					);
					companyInfoContent.innerHTML = Object.entries(
						intersectedCompanySphere.companyData
					)
						.map(([key, value]) => `<p>${key}: ${value}</p>`)
						.join("");
				}
			}
		}
	});
};

var CompanySphere = function (x, y, z, radius, companyData, application) {
	// load company logo as texture from /ext/logos/{companyname}.png
	var companystr = companyData.company.split(" ").join("_");
	var texture = new THREE.TextureLoader().load(
		"/ext/logos/" + companystr + ".png"
	);
	this.sphere = new THREE.Mesh(
		new THREE.BoxGeometry(25, 25, 25),
		new THREE.MeshBasicMaterial({ map: texture })
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

	// Add the sphere to the scene
	scene.add(this.sphere);
	this.companyData = companyData;
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
	//this.textMesh.position.set(x, y, z);

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
			size: 5,
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
var processData1 = function (data) {
	// data is structured as an array of application sphere tuples
	for (var i = 0; i < data.length; i++) {
		applicationSpheres.push(ApplicationSphere.fromTuple(data[i]));
	}

	const { spline, segments } = createSpiralTube(applicationSpheres);
	placeCompaniesAndInsertDisks(applicationSpheres, spline, segments);
	// remove all applicationcylinders from the scene
	applicationSpheres.forEach((appSphere) => {
		scene.remove(appSphere.sphere);
		scene.remove(appSphere.textMesh);
		// remove all the company sphere's lines from the scene
		appSphere.companies.forEach((company) => {
			scene.remove(company.line);
		});
	});
	window.applicationSpheres = applicationSpheres;
};

var processData = function (data) {
	// data is structured as an array of application sphere tuples
	for (var i = 0; i < data.length; i++) {
		applicationSpheres.push(ApplicationSphere.fromTuple(data[i]));
	}

	straightSpheresIntoSplinesBackward(applicationSpheres);

	// find which splines are not getting used and remove them from the scene

	// remove all applicationcylinders from the scene
	applicationSpheres.forEach((appSphere) => {
		scene.remove(appSphere.sphere);
		scene.remove(appSphere.textMesh);
		// remove all the company sphere's lines from the scene
		appSphere.companies.forEach((company) => {
			scene.remove(company.line);
		});
	});
	window.applicationSpheres = applicationSpheres;
};
function calculateSegmentCountPerApplicationSphere(
	applicationSphere,
	segments
) {
	// an equation that will help determine how many segments each application sphere will take up on the spline, measured in spline segments
	const start = 0;
	const end = segments;
	const companies = applicationSphere.companies.length;
	const companiesPerSegment = 10;
	const segmentIterationPerCompany = 2;
	return (
		Math.ceil(companies / companiesPerSegment) * segmentIterationPerCompany
	);
}
function straightSpheresIntoSplinesForward(applicationSpheres) {
	var spheresPerRow = 10;
	var rowSpacing = 200;
	let applicationSphereRadius =
		applicationSpheres[0].sphere.geometry.parameters.radiusTop;
	var columnSpacing = applicationSphereRadius * 2 + 50;
	var numRows = Math.ceil(applicationSpheres.length / spheresPerRow);

	// create splines for each row of application spheres each row will be one spline
	var splines = [];
	for (var i = 0; i < numRows; i++) {
		var points = [];
		var rowStart = i * spheresPerRow;
		var rowEnd = Math.min(
			rowStart + spheresPerRow,
			applicationSpheres.length
		);
		for (var j = rowStart; j < rowEnd; j++) {
			var appSphere = applicationSpheres[j];
			points.push(appSphere.sphere.position);
		}
		var spline = new THREE.CatmullRomCurve3(points);
		splines.push(spline);
	}

	// create tubes for each spline
	var tubeRadius = applicationSpheres[0].sphere.geometry.parameters.radiusTop;
	var radialSegments = 128;
	var segments = 115;
	var tubeMaterial = new THREE.MeshStandardMaterial({
		color: 0xff0000,
		opacity: 0.95,
		transparent: true,
		roughness: 0.75,
	});

	var tubeGeometries = splines.map((spline) => {
		return new THREE.TubeGeometry(
			spline,
			segments,
			tubeRadius,
			radialSegments
		);
	});
	var tempApplicationSpheres = applicationSpheres.slice();
	var segmentIndexes = new Array(splines.length).fill(2);

	splines.forEach((spline, splineIndex) => {
		const tubeGeometry = tubeGeometries[splineIndex];
		const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
		scene.add(tubeMesh);
	});
	var currentSplineIndex = 0;
	while (tempApplicationSpheres.length > 0) {
		var spline = splines[currentSplineIndex];
		var segmentIndex = segmentIndexes[currentSplineIndex];
		var splineIdx = segmentIndex;

		//tempApplicationSpheres = tempApplicationSpheres.slice(spheresPerRow);
		if (
			segmentIndexes[currentSplineIndex] +
				calculateSegmentCountPerApplicationSphere(
					tempApplicationSpheres[0],
					segments
				) <
			segments
		) {
			segmentIndexes[currentSplineIndex] =
				placeCompaniesAndInsertDisksPerApplicationSphereForward(
					tempApplicationSpheres[0],
					spline,
					segments,
					segmentIndexes[currentSplineIndex],
					{
						radiusOffset: 132,
						diskRadius: 121,
						diskHeight: 30,
						companiesPerSegment: 10,
					}
				);

			tempApplicationSpheres.shift();
		}

		currentSplineIndex++;
		currentSplineIndex = currentSplineIndex % splines.length;
	}
}

function straightSpheresIntoSplinesBackward(applicationSpheres) {
	var spheresPerRow = 10;
	var rowSpacing = 200;
	let applicationSphereRadius =
		applicationSpheres[0].sphere.geometry.parameters.radiusTop;
	var columnSpacing = applicationSphereRadius * 2 + 50;
	var numRows = Math.ceil(applicationSpheres.length / spheresPerRow);

	// create splines for each row of application spheres each row will be one spline
	var splines = [];

	// for (var i = 0; i < numRows; i++) {
	// 	var points = [];
	// 	var rowStart = i * spheresPerRow;
	// 	var rowEnd = Math.min(
	// 		rowStart + spheresPerRow,
	// 		applicationSpheres.length
	// 	);
	// 	for (var j = rowStart; j < rowEnd; j++) {
	// 		var appSphere = applicationSpheres[j];
	// 		points.push(appSphere.sphere.position);
	// 	}
	// 	console.log(points);
	// 	var spline = new THREE.CatmullRomCurve3(points);
	// 	splines.push(spline);
	// }

	// the length of each spline is 3060
	// the x of the points goes from 0 to -3060
	// the y is constant at 0
	// the z is 300 * i where i is the row number

	for (var i = 0; i < 20; i++) {
		var points = [];
		for (var j = 0; j < 10; j++) {
			points.push(new THREE.Vector3(-340 * j, 0, 300 * i));
		}
		var spline = new THREE.CatmullRomCurve3(points.reverse());
		splines.push(spline);
	}
	window.splines = splines;
	// create tubes for each spline
	var tubeRadius = applicationSpheres[0].sphere.geometry.parameters.radiusTop;
	var radialSegments = 128;
	var segments = 115;
	var tubeMaterial = new THREE.MeshStandardMaterial({
		color: 0xff0000,
		opacity: 0.95,
		transparent: true,
		roughness: 0.25,
	});

	var tubeGeometries = splines.map((spline) => {
		return new THREE.TubeGeometry(
			spline,
			segments,
			tubeRadius,
			radialSegments
		);
	});
	var tempApplicationSpheres = applicationSpheres.slice();
	var segmentIndexes = new Array(splines.length).fill(segments - 0);
	var tubes = [];
	splines.forEach((spline, splineIndex) => {
		const tubeGeometry = tubeGeometries[splineIndex];
		const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
		tubes.push(tubeMesh);
		scene.add(tubeMesh);
	});
	var currentSplineIndex = 0;
	while (tempApplicationSpheres.length > 0) {
		var spline = splines[currentSplineIndex];
		var segmentIndex = segmentIndexes[currentSplineIndex];
		var splineIdx = segmentIndex;

		//tempApplicationSpheres = tempApplicationSpheres.slice(spheresPerRow);
		if (
			segmentIndexes[currentSplineIndex] -
				calculateSegmentCountPerApplicationSphere(
					tempApplicationSpheres[0],
					segments
				) >
			3
		) {
			segmentIndexes[currentSplineIndex] =
				placeCompaniesAndInsertDisksPerApplicationSphereBackward(
					tempApplicationSpheres[0],
					spline,
					segments,
					segmentIndexes[currentSplineIndex],
					{
						radiusOffset: 132,
						diskRadius: 145,
						diskHeight: 30,
						companiesPerSegment: 10,
					}
				);

			tempApplicationSpheres.shift();
		}

		if (segmentIndexes[currentSplineIndex] < 100) {
			currentSplineIndex++;
		}
		currentSplineIndex = currentSplineIndex % splines.length;
	}
	// remove splines that aren't used from the scene
	var lastUnusedSplineIndex = 0;
	for (var i = 0; i < splines.length; i++) {
		if (segmentIndexes[i] === segments) {
			lastUnusedSplineIndex = i;
			break;
		}
	}
	var unusedTubeSplines = tubes.slice(lastUnusedSplineIndex);
	unusedTubeSplines.forEach((tube) => {
		scene.remove(tube);
	});

	// If the last spline that is used is  does not reach the end of the spline, add a black box to cover the end of the spline
	var lastUsedSplineIndex = splines.length - 1;
	for (var i = splines.length - 1; i >= 0; i--) {
		if (segmentIndexes[i] !== segments) {
			lastUsedSplineIndex = i;
			break;
		}
	}
	console.log(segmentIndexes[lastUsedSplineIndex]);
	if (segmentIndexes[lastUsedSplineIndex] < segments) {
		console.log("adding cover box");
		var spline = splines[lastUsedSplineIndex];
		var lastUsedSplineSegmentIndex = segmentIndexes[lastUsedSplineIndex];
		var point = spline.getPointAt(
			(lastUsedSplineSegmentIndex - 1) / segments
		);
		var coverbox = new THREE.Mesh(
			new THREE.BoxGeometry(300, 100, 1000),
			new THREE.MeshBasicMaterial({ color: 0x000000 })
		);
		//coverbox.position.copy(point);
		coverbox.position.set(point.x - 500, point.y + 150, point.z);
		coverbox.rotation.y = Math.PI / 2;
		scene.add(coverbox);
	}
}
function placeCompaniesAndInsertDisksPerApplicationSphereForward(
	applicationSphere,
	spline,
	segments,
	companyIdx,
	options = {}
) {
	const {
		radiusOffset = 132,
		diskRadius = 121,
		diskHeight = 50,
		companiesPerSegment = 10,
	} = options;

	// Calculate FrenetFrames for the spline
	const frames = spline.computeFrenetFrames(segments, true);

	// Material for disks
	const diskMaterial = new THREE.MeshBasicMaterial({
		color: 0x0000ff,
		opacity: 0.5,
		transparent: true,
	});

	let companyIndex = companyIdx;
	if (!applicationSphere) {
		return -1;
	}
	const numCompanies = applicationSphere.companies.length;
	let remainingCompanies = numCompanies;
	while (remainingCompanies > 0) {
		if (companyIndex >= segments) break;

		const point = spline.getPointAt(companyIndex / segments);
		const tangent = frames.tangents[companyIndex];
		const normal = frames.normals[companyIndex];
		const binormal = frames.binormals[companyIndex];
		var currcompaniespersegment = companiesPerSegment;
		if (remainingCompanies < companiesPerSegment) {
			currcompaniespersegment = remainingCompanies;
		}
		for (let i = 0; i < companiesPerSegment; i++) {
			if (remainingCompanies <= 0) {
				break;
			}

			var angle = (i / currcompaniespersegment) * Math.PI;
			angle = angle % Math.PI; // + Math.PI / 2;

			if (numCompanies === 1) {
				angle = Math.PI;
			}

			const xOffset = radiusOffset * Math.cos(angle);
			const zOffset = radiusOffset * Math.sin(angle);

			const position = new THREE.Vector3()
				.copy(point)
				.addScaledVector(normal, xOffset)
				.addScaledVector(binormal, zOffset);

			// Update the company's position
			const company =
				applicationSphere.companies[numCompanies - remainingCompanies];
			company.updatePosition(position.x, position.y, position.z);
			remainingCompanies--;

			// Orient the company to face the correct direction
			company.sphere.lookAt(point);

			// if this is the middle company of the segment, align it with the previous company and the company in front of it
			if (
				i === Math.floor(currcompaniespersegment / 2) &&
				angle > Math.PI * 0.9 &&
				angle < Math.PI * 1.1
			) {
				const nextPoint = spline.getPointAt(
					(companyIndex + 1) / segments
				);
				const nextTangent = frames.tangents[companyIndex + 1];
				const nextNormal = frames.normals[companyIndex + 1];
				const nextBinormal = frames.binormals[companyIndex + 1];

				const nextPosition = new THREE.Vector3()
					.copy(nextPoint)
					.addScaledVector(nextNormal, xOffset)
					.addScaledVector(nextBinormal, zOffset);

				company.sphere.lookAt(nextPosition);
			}
		}
		//segment iteration
		companyIndex += 2;

		if (remainingCompanies <= 0) {
			// Insert a disk at this segment
			const diskGeometry = new THREE.CylinderGeometry(
				diskRadius,
				diskRadius,
				diskHeight,
				256,
				1,
				true,
				0,
				Math.PI * 2
			);

			// Create the texture for the text
			var str = applicationSphere.application;

			const texture = createTextTexture(str);
			const textMaterial = new THREE.MeshBasicMaterial({
				map: texture,
				side: THREE.DoubleSide,
			});

			const materials = [
				textMaterial, // side material
				diskMaterial, // top material
				diskMaterial, // bottom material
			];

			const disk = new THREE.Mesh(diskGeometry, materials);

			// Position the disk
			var n = 1;
			var pointAhead = spline.getPointAt((companyIndex - n) / segments);

			disk.position.copy(pointAhead);

			// Align the disk with the tangent using Frenet frames
			const tangent = frames.tangents[companyIndex - n];
			const normal = frames.normals[companyIndex - n];
			const binormal = frames.binormals[companyIndex - n];

			// Create a quaternion from the Frenet frame
			const m1 = new THREE.Matrix4().makeBasis(binormal, tangent, normal);
			const quaternion = new THREE.Quaternion().setFromRotationMatrix(m1);
			disk.setRotationFromQuaternion(quaternion);

			// Add the disk to the scene
			scene.add(disk);
		}
	}
	return companyIndex;
}
function placeCompaniesAndInsertDisksPerApplicationSphereBackward(
	applicationSphere,
	spline,
	segments,
	companyIdx,
	options = {}
) {
	const {
		radiusOffset = 132,
		diskRadius = 130,
		diskHeight = 50,
		companiesPerSegment = 10,
	} = options;

	// Calculate FrenetFrames for the spline
	const frames = spline.computeFrenetFrames(segments, true);

	// Material for disks
	const diskMaterial = new THREE.MeshBasicMaterial({
		color: 0x0000ff,
		opacity: 0.5,
		transparent: true,
	});

	let companyIndex = companyIdx;
	if (!applicationSphere) {
		return -1;
	}
	const numCompanies = applicationSphere.companies.length;
	let remainingCompanies = numCompanies;

	// if (remainingCompanies <= 0) {
	// Insert a disk at this segment
	console.log(diskRadius, diskHeight);
	const diskGeometry = new THREE.CylinderGeometry(
		diskRadius,
		diskRadius,
		diskHeight,
		256,
		1,
		true,
		0,
		Math.PI * 2
	);

	// Create the texture for the text
	var str = applicationSphere.application;

	const texture = createTextTexture(str);
	const textMaterial = new THREE.MeshBasicMaterial({
		map: texture,
		side: THREE.DoubleSide,
	});

	const materials = [
		textMaterial, // side material
		diskMaterial, // top material
		diskMaterial, // bottom material
	];

	const disk = new THREE.Mesh(diskGeometry, materials);

	// Position the disk
	var n = 0;
	var pointAhead = spline.getPointAt((companyIndex - n) / segments);

	disk.position.copy(pointAhead);

	// Align the disk with the tangent using Frenet frames
	const tangent = frames.tangents[companyIndex - n];
	const normal = frames.normals[companyIndex - n];
	const binormal = frames.binormals[companyIndex - n];

	// Create a quaternion from the Frenet frame
	// const m1 = new THREE.Matrix4().makeBasis(binormal, tangent, normal);
	const m1 = new THREE.Matrix4().makeBasis(binormal, normal, tangent);
	const quaternion = new THREE.Quaternion().setFromRotationMatrix(m1);
	disk.setRotationFromQuaternion(quaternion);

	// Add the disk to the scene
	scene.add(disk);
	// }
	companyIndex -= 1;
	while (remainingCompanies > 0) {
		if (companyIndex >= segments) break;

		const point = spline.getPointAt(companyIndex / segments);
		const tangent = frames.tangents[companyIndex];
		const normal = frames.normals[companyIndex];
		const binormal = frames.binormals[companyIndex];
		var currcompaniespersegment = companiesPerSegment;
		if (remainingCompanies < companiesPerSegment) {
			currcompaniespersegment = remainingCompanies;
		}
		for (let i = 1; i < companiesPerSegment; i++) {
			if (remainingCompanies <= 0) {
				break;
			}

			var angle = (i / companiesPerSegment) * Math.PI;
			if (currcompaniespersegment < companiesPerSegment) {
				angle = angle + Math.PI / (currcompaniespersegment + 1);
			}

			if (numCompanies === 1) {
				angle = Math.PI / 2;
			}

			const xOffset = radiusOffset * Math.cos(angle);
			const zOffset = radiusOffset * Math.sin(angle);

			const position = new THREE.Vector3()
				.copy(point)
				.addScaledVector(normal, xOffset)
				.addScaledVector(binormal, zOffset);

			// Update the company's position
			const company =
				applicationSphere.companies[numCompanies - remainingCompanies];
			company.updatePosition(position.x, position.y, position.z);
			remainingCompanies--;

			// Orient the company to face the correct direction
			company.sphere.lookAt(point);

			// if this is the middle company of the segment, align it with the previous company and the company in front of it
			if (
				i === Math.floor(currcompaniespersegment / 2) &&
				angle > Math.PI * 0.9 &&
				angle < Math.PI * 1.1
			) {
				const numOfNext = -1;
				const nextPoint = spline.getPointAt(
					(companyIndex + numOfNext) / segments
				);
				const nextTangent = frames.tangents[companyIndex + numOfNext];
				const nextNormal = frames.normals[companyIndex + numOfNext];
				const nextBinormal = frames.binormals[companyIndex + numOfNext];

				const nextPosition = new THREE.Vector3()
					.copy(nextPoint)
					.addScaledVector(nextNormal, xOffset)
					.addScaledVector(nextBinormal, zOffset);

				company.sphere.lookAt(nextPosition);
			}
			if (angle <= Math.PI / 2) {
				company.sphere.rotation.y += (Math.PI * 3) / 2;
				company.sphere.rotation.x += (Math.PI * 3) / 2;
			}
			if (angle > Math.PI / 2) {
				company.sphere.rotation.y += (Math.PI * 3) / 2;
				company.sphere.rotation.z += (Math.PI * 3) / 2;
			}
		}

		//segment iteration
		companyIndex -= 2;
	}
	return companyIndex;
}

// Your function to create the texture
function createTextTexture( // , 100, 3000, 200, true
	text,
	fontSize = 100,
	width = 3000,
	height = 200,
	upsideDown = true
) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");

	// Draw the background
	context.fillStyle = "blue";
	context.fillRect(0, 0, width, height);

	// Draw guide lines
	context.strokeStyle = "red";
	context.lineWidth = 5;
	context.beginPath();
	context.moveTo(0, 0);
	context.lineTo(0, height);
	context.stroke();

	// Set the font and draw the text
	context.fillStyle = "white";
	context.font = `${fontSize}px Arial`;
	context.textAlign = "center";
	context.textBaseline = "middle";
	if (upsideDown) {
		context.translate(width / 2, height / 2);
		context.rotate(Math.PI);
		context.fillText(text, 0, 0);
	}
	// Create a texture from the canvas
	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.needsUpdate = true;
	return texture;
}

function placeCompaniesAndInsertDisks(
	applicationSpheres,
	spline,
	segments,
	options = {}
) {
	const {
		radiusOffset = 132,
		diskRadius = 121,
		diskHeight = 50,
		companiesPerSegment = 10,
	} = options;

	// Calculate FrenetFrames for the spline
	const frames = spline.computeFrenetFrames(segments, true);

	// Material for disks
	const diskMaterial = new THREE.MeshBasicMaterial({
		color: 0x0000ff,
		opacity: 0.5,
		transparent: true,
	});

	let companyIndex = 2;

	applicationSpheres.forEach((appSphere, appIndex) => {
		const numCompanies = appSphere.companies.length;
		let remainingCompanies = numCompanies;
		while (remainingCompanies > 0) {
			if (companyIndex >= segments) break;

			const point = spline.getPointAt(companyIndex / segments);
			const tangent = frames.tangents[companyIndex];
			const normal = frames.normals[companyIndex];
			const binormal = frames.binormals[companyIndex];
			var currcompaniespersegment = companiesPerSegment;
			if (remainingCompanies < companiesPerSegment) {
				currcompaniespersegment = remainingCompanies;
			}
			for (let i = 0; i < companiesPerSegment; i++) {
				if (remainingCompanies <= 0) {
					break;
				}

				var angle = (i / currcompaniespersegment) * Math.PI;
				angle = angle % Math.PI; // + Math.PI / 2;

				if (numCompanies === 1) {
					angle = Math.PI;
				}

				const xOffset = radiusOffset * Math.cos(angle);
				const zOffset = radiusOffset * Math.sin(angle);

				const position = new THREE.Vector3()
					.copy(point)
					.addScaledVector(normal, xOffset)
					.addScaledVector(binormal, zOffset);

				// Update the company's position
				const company =
					appSphere.companies[numCompanies - remainingCompanies];
				company.updatePosition(position.x, position.y, position.z);
				remainingCompanies--;

				// Orient the company to face the correct direction
				company.sphere.lookAt(point);

				// if this is the middle company of the segment, align it with the previous company and the company in front of it
				if (
					i === Math.floor(currcompaniespersegment / 2) &&
					angle > Math.PI * 0.9 &&
					angle < Math.PI * 1.1
				) {
					const nextPoint = spline.getPointAt(
						(companyIndex + 1) / segments
					);
					const nextTangent = frames.tangents[companyIndex + 1];
					const nextNormal = frames.normals[companyIndex + 1];
					const nextBinormal = frames.binormals[companyIndex + 1];

					const nextPosition = new THREE.Vector3()
						.copy(nextPoint)
						.addScaledVector(nextNormal, xOffset)
						.addScaledVector(nextBinormal, zOffset);

					company.sphere.lookAt(nextPosition);
				}
			}

			companyIndex += 2;

			if (remainingCompanies <= 0) {
				// Insert a disk at this segment
				const diskGeometry = new THREE.CylinderGeometry(
					diskRadius,
					diskRadius,
					diskHeight,
					256,
					1,
					true,
					0,
					Math.PI * 2
				);

				// Create the texture for the text
				var str = appSphere.application;

				const texture = createTextTexture(str);
				const textMaterial = new THREE.MeshBasicMaterial({
					map: texture,
					side: THREE.DoubleSide,
				});

				const materials = [
					textMaterial, // side material
					diskMaterial, // top material
					diskMaterial, // bottom material
				];

				const disk = new THREE.Mesh(diskGeometry, materials);

				// Position the disk
				var n = 1;
				var pointAhead = spline.getPointAt(
					(companyIndex - n) / segments
				);

				disk.position.copy(pointAhead);

				// Align the disk with the tangent using Frenet frames
				const tangent = frames.tangents[companyIndex - n];
				const normal = frames.normals[companyIndex - n];
				const binormal = frames.binormals[companyIndex - n];

				// Create a quaternion from the Frenet frame
				const m1 = new THREE.Matrix4().makeBasis(
					binormal,
					tangent,
					normal
				);
				const quaternion = new THREE.Quaternion().setFromRotationMatrix(
					m1
				);
				disk.setRotationFromQuaternion(quaternion);

				// Add the disk to the scene
				scene.add(disk);
			}
		}
	});
	return companyIndex;
}

function createSpiralTube(applicationSpheres, options = {}) {
	const {
		initialRadius = 1,
		finalRadius = 1,
		segments = applicationSpheres.length * 4,
		radialSegments = 128,
	} = options;

	// Collect the center points of all application spheres
	const points = applicationSpheres.map((appSphere) =>
		appSphere.sphere.position.clone()
	);
	points.splice(0, 5);
	// Create a CatmullRomCurve3 spline from the points
	const spline = new THREE.CatmullRomCurve3(points);

	// Define the radius for the TubeGeometry
	const tubeRadius =
		applicationSpheres[0].sphere.geometry.parameters.radiusTop;

	// Create the TubeGeometry by extruding a cylinder along the spline
	const tubeGeometry = new THREE.TubeGeometry(
		spline,
		segments,
		tubeRadius,
		radialSegments,
		false
	);

	// Create the mesh material
	const tubeMaterial = new THREE.MeshStandardMaterial({
		color: 0xff0000,
		opacity: 0.95,
		transparent: true,
		roughness: 0.75,
	});

	// Create the tube mesh
	const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

	// Add the tube mesh to the scene
	scene.add(tubeMesh);

	return { spline, segments };
}

// connect to the server
var rawData = [];

const socket = io("http://localhost:3000");
socket.on("connect", () => {
	console.log("connected");
	socket.emit("getdata");
	socket.on("data", (data) => {
		rawData = data;
		processData(rawData);
	});
	socket.on("PromptResponse", (data) => {
		// remove all spheres and cylinders from the scene
		scene.remove.apply(scene, scene.children);
		// add back the lighting
		scene.add(new THREE.AmbientLight(0x404040));
		var light = new THREE.DirectionalLight(0xffffff);
		light.position.set(1, 1, 1).normalize();
		scene.add(light);
		// clear the applicationSpheres and splines
		applicationSpheres.splice(0, applicationSpheres.length);
		window.splines.splice(0, window.splines.length);
		rawData = [];

		processData(data);
	});
});
