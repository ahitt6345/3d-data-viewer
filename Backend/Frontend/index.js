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
	3000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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

var light = new THREE.AmbientLight(0x404040); // soft white light

window.camera = camera;
scene.add(light);
var isPressed = {};
//scene.background = new THREE.Color(0xffffff);
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
		// controls.lock();
	},
	false
);

scene.add(controls.getObject());
var prevTime = performance.now();

// cover the lower parts of the cylinders that are going to be generated in the future by creating a large black box

var geometry = new THREE.BoxGeometry(12000, 1, 3000);
var material = new THREE.MeshBasicMaterial({ color: 0x000000 });
var coverbox = new THREE.Mesh(geometry, material);

coverbox.position.set(-2300, 204, -206);

// rotate coverbox 90 degrees in the xz axis
coverbox.rotation.y = Math.PI / 2;

scene.add(coverbox);

function animate() {
	requestAnimationFrame(animate);
	var time = performance.now();
	var delta = (time - prevTime) / 30;

	const direction = controls
		.getDirection(new THREE.Vector3(0, 0, -1))
		.clone();
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

	var slider = document.getElementById("range");
	slider.oninput = function () {
		// get the value of the slider
		var value = +this.value;

		// set the camera position to the value of the slider
		camera.position.z = 300 + value * 75;
	};
};
animate();
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
	var segmentIndexes = new Array(splines.length).fill(segments - 0);

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
		diskHeight = 30,
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
				128,
				1,
				true,
				0,
				Math.PI * 2
			);

			// Create the texture for the text
			var str = applicationSphere.application;
			while (str.length < 10) {
				str = "*" + str + "*";
			}
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
		diskHeight = 30,
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
		128,
		1,
		true,
		0,
		Math.PI * 2
	);

	// Create the texture for the text
	var str = applicationSphere.application;
	while (str.length < 10) {
		str = "*" + str + "*";
	}
	const texture = createTextTexture(str, 100, 3000, 200, true);
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
		}
		//segment iteration
		companyIndex -= 2;
	}
	return companyIndex;
}

// Your function to create the texture
function createTextTexture(
	text,
	fontSize = 100,
	width = 3000,
	height = 200,
	upsideDown = false
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
		diskHeight = 30,
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
					128,
					1,
					true,
					0,
					Math.PI * 2
				);

				// Create the texture for the text
				var str = appSphere.application;
				while (str.length < 10) {
					str = "*" + str + "*";
				}
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
function placeDiskAt(
	position,
	radius,
	height,
	material,
	quaternion,
	diskHeight = 0.2
) {
	const diskGeometry = new THREE.CylinderGeometry(radius, radius, height, 32);
	const disk = new THREE.Mesh(diskGeometry, material);
	disk.position.copy(position);
	disk.position.y += diskHeight / 2; // Adjust vertical position to sit on the spline
	disk.quaternion.copy(quaternion);
	scene.add(disk);
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

var isMosaic = true;

var generateNextSpiralPoint = function (
	currentPoint,
	currentRadius,
	nextRadius,
	index
) {
	// Spiral parameters
	var spacing = 1.3; // Additional spacing to make it look nice (you can adjust this value)
	var angle = 125.5 * (Math.PI / 180); // Fixed angle in radians (110 degrees)

	// Calculate the distance needed to avoid overlap
	var r = (currentRadius + nextRadius) * spacing;

	// Calculate the angle relative to the origin
	var dx = currentPoint.x;
	var dz = currentPoint.z;
	var currentAngle = Math.atan2(dz, dx);

	// Calculate the new angle by adding the fixed angle to the current angle
	var newAngle = currentAngle + angle;

	// Calculate the new coordinates in the spiral (X-Z plane)
	var x = currentPoint.x + r * index; //Math.cos(newAngle);
	var z = currentPoint.z + r * index; //Math.sin(newAngle);
	var y = 0; // Keeping y constant

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
		//currentSphere.quaternion.copy(quaternion);
	}
}

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
