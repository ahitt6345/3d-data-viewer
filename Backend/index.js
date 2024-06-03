const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
var fs = require('fs');
var path = require('path');


// simple file hosting
// frontend files are in ../Frontend
app.get('*', (req, res) => { // This is a catch all for all requests, however we need to restructure this so that it only serves files from the frontend folder.
  var dir = path.join(__dirname, './Frontend'); 
  
  console.log(dir + req.url);
  res.sendFile(dir + req.url);
});
server.listen(3000, () => {
  console.log('listening on *:3000');
});