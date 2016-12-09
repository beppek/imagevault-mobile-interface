"use strict";

var files = [];

function FileHandler(f) {
    files.push(f);
}

FileHandler.prototype.upload = function() {
    for (var i = 0; i < files.length; i ++) {
        console.log(files[i]);
    }
};

module.exports = FileHandler;