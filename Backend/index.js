const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
var path = require('path');
// simple file hosting
// frontend files are in ../Frontend
app.get('*', (req, res) => {
    var dir = path.join(__dirname, '../');
    console.log(dir + req.url);
    res.sendFile(dir + req.url);
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});