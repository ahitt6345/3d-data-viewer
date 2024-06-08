const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
var fs = require('fs');
var path = require('path');

var io = require('socket.io')(server);

// simple file hosting
// frontend files are in ../Frontend
app.get('*', (req, res) => { // This is a catch all for all requests, however we need to restructure this so that it only serves files from the frontend folder.
    var dir = path.join(__dirname, './Frontend');
    res.sendFile(dir + req.url);
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});

// read csv file

var csv = require('csv-parser');

// file name: gendata.csv
var filename = 'gendata.csv';
var data = [];
var dist = function(x,x1,y,y1,z,z1){
    return Math.sqrt(Math.pow(x-x1,2)+Math.pow(y-y1,2)+Math.pow(z-z1,2));
}
var distObj = function(point1, point2) {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2) + Math.pow(point2.z - point1.z, 2));
}

// Its first line is the head of each column
// Companies,URL,Description,Industry,Latest Funding Round,Latest Funding Date,Total Funding,All Investors,Latest Valuation,Latest Funding Amount,Exit Round,Exit Date,Acquirers,Mosaic (Overall),Date Added,Country,Applications,Text,Speech & audio,Code,Visual media
// we are only interested in: Companies, Industry, Mosaic, Applications, total funding
// we want to create a data structure like this:
// data = [ { company: '...', industry: '...', mosaic: '...', applications: '...', total_funding: '...' }, ...]

// Stream the data from gendata.csv into data[]
var s = 0;
var companySphereServerSide = function(x,y,z,radius, companyData, applicationSphere) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.radius = radius;
    this.companyData = companyData;
    this.applicationSphere = applicationSphere.application;
};
companySphereServerSide.prototype.toTuple = function() {
    return [this.x, this.y, this.z, this.radius, this.companyData, this.applicationSphere.application];
};

var applicationSphereServerSide = function(x,y,z,radius, application) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.radius = radius;
    this.application = application;
    this.companies = [];
};
applicationSphereServerSide.prototype.addCompany = function(companyData) {
    var applicationSphereRadius = this.radius;
    var newCompanySphereRadius = Math.max(1,(companyData.mosaic / 1000) * 5);
    var spawnRadius = applicationSphereRadius - newCompanySphereRadius;
    var x, y, z;
    var attempts = 0; // prevent infinite loop
    do {
        // generate random point within the application sphere
        var randomPoint = randomPointInSphere({ x: this.x, y: this.y, z: this.z }, spawnRadius);
        x = randomPoint.x;
        y = randomPoint.y;
        z = randomPoint.z;
        attempts++;
    } while (attempts < 100 && this.companies.some((sphere) => {
        // make sure the spheres don't overlap
        var distance = dist(x, sphere.x, y, sphere.y, z, sphere.z);
        return distance < sphere.radius + newCompanySphereRadius;
    }));
    if (attempts < 100) {
        var newCompanySphere = new companySphereServerSide(x, y, z, newCompanySphereRadius, companyData, this);
        this.companies.push(newCompanySphere);
    } else {
        console.log("Failed to place company sphere within application sphere after 100 attempts.");
    }
}
applicationSphereServerSide.prototype.toTuple = function() {
    return [this.x, this.y, this.z, this.radius, this.application, this.companies.map((company) => company.toTuple())];
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

var generateApplicationSpheres = function(data) {
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
                return distObj({ x: x, y: y, z: z }, sphere) < applicationSphereRadius * 2;
            });
        } while (attempts < 100 && tooClose);

        if (!tooClose) {
            var newApplicationSphere = new applicationSphereServerSide(
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
    // Structured as: [x, y, z, radius, application, [companies]]
    return applicationSpheres.map((sphere) => sphere.toTuple());
};

var dataAvailable = false;
var applicationSpheres = [];
fs.createReadStream(filename).pipe(csv()).on('data', (row) => { // This will most likely be a database in the future, but for now it's a csv file :P
    // we want to create a data structure like this:
    // data = [ { company: '...', industry: '...', mosaic: '...', applications: '...', total_funding: '...' }, ...]
    var filteredRow = {
        company: row['Companies'],
        industry: row['Industry'],
        mosaic: +row['Mosaic (Overall)'],
        applications: row['Applications'],
        total_funding: +row['Total Funding']
    };
    data.push(filteredRow);
}).on('end', () => {
    console.log('CSV file successfully processed');
    dataAvailable = true;
    applicationSpheres = generateApplicationSpheres(data);
});

// use socket.io to send data to the frontend
var datIsAvailable = false;
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('getdata', () => {
        if (dataAvailable) {
            let chunkSize = 100; // Send 100 items at a time
            let currentIndex = 0;
            const sendChunk = () => {
                if (currentIndex < applicationSpheres.length) {
                    const chunk = applicationSpheres.slice(currentIndex, currentIndex + chunkSize);
                    socket.emit('data', chunk);
                    currentIndex += chunkSize;
                } else {
                    socket.emit('data', 'End of data');
                }
            };

            sendChunk();
            socket.on('nextchunk', sendChunk);
        } else {
            socket.emit('data', 'Data not available');
        }
    });
});