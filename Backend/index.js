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

// Its first line is the head of each column
// Companies,URL,Description,Industry,Latest Funding Round,Latest Funding Date,Total Funding,All Investors,Latest Valuation,Latest Funding Amount,Exit Round,Exit Date,Acquirers,Mosaic (Overall),Date Added,Country,Applications,Text,Speech & audio,Code,Visual media
// we are only interested in: Companies, Industry, Mosaic, Applications, total funding
// we want to create a data structure like this:
// data = [ { company: '...', industry: '...', mosaic: '...', applications: '...', total_funding: '...' }, ...]

// Stream the data from gendata.csv into data[]
var s = 0;

var dataAvailable = false;
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
                if (currentIndex < data.length) {
                    const chunk = data.slice(currentIndex, currentIndex + chunkSize);
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