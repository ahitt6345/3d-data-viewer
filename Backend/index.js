const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
var fs = require("fs");
var path = require("path");

var io = require("socket.io")(server);

// simple file hosting
// frontend files are in ../Frontend
app.get("*", (req, res) => {
	// This is a catch all for all requests, however we need to restructure this so that it only serves files from the frontend folder.
	var dir = path.join(__dirname, "./Frontend");
	res.sendFile(dir + req.url);
});

server.listen(3000, () => {
	console.log("listening on *:3000");
});

// read csv file

var csv = require("csv-parser");

// file name: gendata.csv
var filename = "De No Finance 2.csv";
var data = [];
var dist = function (x, x1, y, y1, z, z1) {
	return Math.sqrt(
		Math.pow(x - x1, 2) + Math.pow(y - y1, 2) + Math.pow(z - z1, 2)
	);
};
var distObj = function (point1, point2) {
	return Math.sqrt(
		Math.pow(point2.x - point1.x, 2) +
			Math.pow(point2.y - point1.y, 2) +
			Math.pow(point2.z - point1.z, 2)
	);
};

// Its first line is the head of each column
// Companies,URL,Description,Industry,Latest Funding Round,Latest Funding Date,Total Funding,All Investors,Latest Valuation,Latest Funding Amount,Exit Round,Exit Date,Acquirers,Mosaic (Overall),Date Added,Country,Applications,Text,Speech & audio,Code,Visual media
// we are only interested in: Companies, Industry, Mosaic, Applications, total funding
// we want to create a data structure like this:
// data = [ { company: '...', industry: '...', mosaic: '...', applications: '...', total_funding: '...' }, ...]

// Stream the data from gendata.csv into data[]
var s = 0;
var companySphereServerSide = function (
	x,
	y,
	z,
	radius,
	companyData,
	applicationSphere
) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.radius = radius;
	this.companyData = companyData;
	this.applicationSphere = applicationSphere.application;
};
companySphereServerSide.prototype.toTuple = function () {
	return [
		this.x,
		this.y,
		this.z,
		this.radius,
		this.companyData,
		this.applicationSphere.application,
	];
};

var applicationSphereServerSide = function (x, y, z, radius, application) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.radius = 120;
	this.application = application;
	this.companies = [];
};
applicationSphereServerSide.prototype.addCompany = function (companyData) {
	var applicationSphereRadius = this.radius;
	var newCompanySphereRadius = 30;
	var x, y, z;
	[x, y, z] = [0, 0, 0];
	var newCompanySphere = new companySphereServerSide(
		x,
		y,
		z,
		newCompanySphereRadius,
		companyData,
		this
	);
	this.companies.push(newCompanySphere);
};
applicationSphereServerSide.prototype.toTuple = function () {
	return [
		this.x,
		this.y,
		this.z,
		this.radius,
		this.application,
		this.companies.map((company) => company.toTuple()),
	];
};

/*  We will be placing application spheres spiraling out from the center of the scene. 
    Each application sphere's radius will be based on the number of companies that use that application. 
    We need a function that generates the next point on the spiral based off of the radius of the 
    current application sphere and the radius of the next application sphere in order for the spheres
    to not overlap.We are spiraling outward from the origin, so we can use the equation of a spiral
*/

var generateNextSpiralPoint = function (
	currentPoint,
	currentRadius,
	nextRadius,
	index
) {
	// Spiral parameters
	var spacing = 0.55; // Additional spacing to make it look nice (you can adjust this value)
	var angle = 90.05 * (Math.PI / 180); // Fixed angle in radians (90.05 degrees)

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
	var y = currentPoint.y; // Keeping y constant

	return { x: x, y: y, z: z };
};

var generateApplicationSpheres = function (data) {
	var applications = {}; // This will be used to store the unique applications
	for (var i = 0; i < data.length; i++) {
		applications[data[i].applications] = applications[data[i].applications]
			? applications[data[i].applications] + 1
			: 1; // Count the number of companies that use each application
	}
	var applicationsArray = Object.keys(applications); // Get the array of unique applications
	console.log(applicationsArray);
	var applicationSpheres = [];
	for (let i = 0; i < applicationsArray.length; i++) {
		// generate the application spheres, we dont care where they are positioned currently. initialize them all at (0,0,0)
		let x = 0,
			y = 0,
			z = 0;
		let applicationSphereRadius =
			Math.min(60, Math.max(5, applications[applicationsArray[i]] * 3)) *
			2;
		let applicationSphere = new applicationSphereServerSide(
			x,
			y,
			z,
			applicationSphereRadius,
			applicationsArray[i]
		);
		applicationSpheres.push(applicationSphere);
	}
	// sort the applicationspheres from most companies to least companies
	applicationSpheres.sort(
		(a, b) => applications[b.application] - applications[a.application]
	);
	// reassign the positions of the application spheres to be in a spiral
	for (var i = 1; i < applicationSpheres.length; i++) {
		var curApplicationSphere = applicationSpheres[i - 1];
		var currentPoint = {
			x: curApplicationSphere.x,
			y: curApplicationSphere.y,
			z: curApplicationSphere.z,
		};
		var currentRadius = curApplicationSphere.radius;
		var nextRadius = applicationSpheres[i].radius;
		var nextPoint = generateNextSpiralPoint(
			currentPoint,
			currentRadius,
			nextRadius,
			i
		);
		applicationSpheres[i].x = nextPoint.x;
		applicationSpheres[i].y = nextPoint.y;
		applicationSpheres[i].z = nextPoint.z;
	}
	// assign companies to application spheres
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
			console.log(
				"Failed to find application sphere for company: ",
				data[i].company
			);
		}
	}
	// applicationSpheres = applicationSpheres.slice(0, 20);

	applicationSpheres.forEach((sphere) => {
		sphere.companies.sort(
			(a, b) => a.companyData.mosaic - b.companyData.mosaic
		);
		// only save the first 20 companies
		// sphere.companies = sphere.companies.slice(0, 20);
	});

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
	// Have the company spheres spiral out from the center of the application spheres by changing the coordinates of the company spheres using the generateNextSpiralPoint function
	for (var i = 0; i < applicationSpheres.length; i++) {
		var applicationSphere = applicationSpheres[i];
		var companies = applicationSphere.companies;
		var cylinderHeight = Math.max(applicationSphere.radius, 40); //applicationSphere.radius;
		var cylinderRadius = applicationSphere.radius;
		placeSpheresInSpiral(
			{
				height: cylinderHeight,
				radius: cylinderRadius,
				x: applicationSphere.x,
				y: applicationSphere.y,
				z: applicationSphere.z,
			},
			companies
		);
		// if (companies.length > 0) {
		// 	// Set the initial position of the first company sphere to the center of the application sphere
		// 	companies[0].x = applicationSphere.x;
		// 	companies[0].y = applicationSphere.y;
		// 	companies[0].z = applicationSphere.z;

		// 	for (var j = 1; j < companies.length; j++) {
		// 		var prevCompanySphere = companies[j - 1];
		// 		var curCompanySphere = companies[j];

		// 		// Translate the previous company sphere to the origin
		// 		var origin = {
		// 			x: applicationSphere.x,
		// 			y: applicationSphere.y,
		// 			z: applicationSphere.z,
		// 		};
		// 		var translatedPrevPoint = translateToOrigin(
		// 			{
		// 				x: prevCompanySphere.x,
		// 				y: prevCompanySphere.y,
		// 				z: prevCompanySphere.z,
		// 			},
		// 			origin
		// 		);

		// 		// Calculate the next point in the spiral at the origin
		// 		var currentRadius = prevCompanySphere.radius;
		// 		var nextRadius = curCompanySphere.radius;
		// 		var nextPoint = generateNextSpiralPoint(
		// 			translatedPrevPoint,
		// 			currentRadius,
		// 			nextRadius,
		// 			j
		// 		);

		// 		// Translate the next point back from the origin
		// 		var finalNextPoint = translateFromOrigin(nextPoint, origin);

		// 		// Update the current company sphere's position
		// 		curCompanySphere.x = finalNextPoint.x;
		// 		curCompanySphere.y = finalNextPoint.y;
		// 		curCompanySphere.z = finalNextPoint.z;
		// 	}
		// }
	}

	// Structured as: [x, y, z, radius, application, [companies]]
	var result = applicationSpheres.map((sphere) => sphere.toTuple());
	console.log(JSON.stringify(result));
	return result;
};
class categorySphere {
	constructor(x, y, z, radius, category) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.radius = radius;
		this.category = category;
		this.subcategories = [];
	}

	addSubcategory(subcategory) {
		this.subcategories.push(subcategory);
	}

	toTuple() {
		return [
			this.x,
			this.y,
			this.z,
			this.radius,
			this.category,
			this.subcategories.map((subcategory) => subcategory.toTuple()),
		];
	}
}

function generateApplicationSpheresForSplines(data) {
	var applications = {}; // This will be used to store the unique applications
	for (var i = 0; i < data.length; i++) {
		applications[data[i].applications] = applications[data[i].applications]
			? applications[data[i].applications] + 1
			: 1; // Count the number of companies that use each application
	}
	var applicationsArray = Object.keys(applications); // Get the array of unique applications
	console.log(applicationsArray);
	var applicationSpheres = [];
	let applicationSphereRadius = 120;
	for (let i = 0; i < applicationsArray.length; i++) {
		// generate the application spheres, we dont care where they are positioned currently. initialize them all at (0,0,0)
		let x = 0,
			y = 0,
			z = 0;

		let applicationSphere = new applicationSphereServerSide(
			x,
			y,
			z,
			applicationSphereRadius,
			applicationsArray[i]
		);
		applicationSpheres.push(applicationSphere);
	}
	// sort the applicationspheres from most companies to least companies
	applicationSpheres.sort(
		(a, b) => applications[b.application] - applications[a.application]
	);

	// Reassign the application sphere positions to represent multiple straight lines next to each other

	var spheresPerRow = 10;
	var rowSpacing = 200;
	var columnSpacing = applicationSphereRadius * 2 + 100;
	var numRows = Math.ceil(applicationSpheres.length / spheresPerRow);

	applicationSpheres.forEach((sphere, index) => {
		var row = Math.floor(index / spheresPerRow);
		var col = index % spheresPerRow;
		var x = col * columnSpacing - (spheresPerRow - 1) * columnSpacing;
		var z = row * rowSpacing * 1.5;
		sphere.x = x;
		sphere.z = z;
	});

	// Assign companies to application spheres
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
			console.log(
				"Failed to find application sphere for company: ",
				data[i].company
			);
		}
	}

	var result = applicationSpheres.map((sphere) => sphere.toTuple());
	console.log(JSON.stringify(result));
	return result;
}
function placeSpheresInSpiral(cylinder, spheres) {
	const cylinderHeight = cylinder.height;
	const cylinderRadius = cylinder.radius;
	const numSpheres = spheres.length;
	const turns = 3; // Number of complete turns around the cylinder
	const angleStep = (2 * Math.PI * turns) / numSpheres;
	const heightStep = cylinderHeight / numSpheres;

	for (let i = 0; i < numSpheres; i++) {
		const angle = i * angleStep;
		const y = cylinder.y + cylinderHeight / 2 - i * heightStep;
		const x = cylinder.x + cylinderRadius * Math.cos(angle);
		const z = cylinder.z + cylinderRadius * Math.sin(angle);

		spheres[i].x = x;
		spheres[i].y = y;
		spheres[i].z = z;
	}
}

var dataAvailable = false;
var applicationSpheres = [];
var initialDataFunction = function (row) {
	var applications = row["Applications"].trim().split(",");
	if (applications.length > 1) {
		// if there are multiple applications, we want to add the same row multiple times with each application
		applications.forEach((application) => {
			var filteredRow = {
				company: row["Companies"],
				industry: row["Industry"],
				mosaic: +row["Mosaic (Overall)"],
				applications: application,
				total_funding: +row["Total Funding"],
			};
			data.push(filteredRow);
		});
		return;
	}
	applications = applications[0];
	var filteredRow = {
		company: row["Companies"],
		industry: row["Industry"],
		mosaic: +row["Mosaic (Overall)"],
		applications: row["Applications"],
		total_funding: +row["Total Funding"],
	};
	data.push(filteredRow);
};
var newDataFunction = function (row) {
	// function for a different csv file format
	var Companies = row["Companies"];
	var Applications = row["Applications"];

	var filteredRow = {
		company: Companies,
		applications: Applications,
		mosaic: 0,
		industry: Applications,
		total_funding: 0,
	};
	data.push(filteredRow);
};
fs.createReadStream(filename)
	.pipe(csv())
	.on("data", initialDataFunction)
	.on("end", () => {
		console.log("CSV file successfully processed");
		dataAvailable = true;
		//applicationSpheres = generateApplicationSpheres(data);
		applicationSpheres = generateApplicationSpheresForSplines(data);
	});

// use socket.io to send data to the frontend
var dataIsAvailable = false;
io.on("connection", (socket) => {
	console.log("a user connected");
	socket.on("getdata", () => {
		if (dataAvailable) {
			let chunkSize = 100; // Send 100 items at a time
			let currentIndex = 0;
			const sendChunk = () => {
				if (currentIndex < applicationSpheres.length) {
					const chunk = applicationSpheres.slice(
						currentIndex,
						currentIndex + chunkSize
					);
					socket.emit("data", chunk);
					currentIndex += chunkSize;
				} else {
					socket.emit("data", "End of data");
				}
			};

			sendChunk();
			socket.on("nextchunk", sendChunk);
		} else {
			socket.emit("data", "Data not available");
		}
	});
});
