// for every image in the /logos folder, if there is a space in the filename, replace it with an underscore

var fs = require("fs");
var path = require("path");

var dir = path.join(__dirname, "logos");
fs.readdir(dir, function (err, files) {
	if (err) {
		console.log(err);
		return;
	}
	files.forEach(function (file) {
		var filePath = path.join(dir, file);
		var newFilePath = path.join(dir, file.split(" ").join("_"));
		fs.rename(filePath, newFilePath, function (err) {
			if (err) {
				console.log(err);
			}
		});
	});
});
