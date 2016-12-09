"use strict";

var core;

var file;
var vaultId;

function IVCaller() {
    core = new ImageVault.Client({
        core: "http://iv5qa.azurewebsites.net/apiv2",
        username: "hackathon",
        password: "ImageVault2016"
        /*
        ,
        impersonate_as: "demo",
        roles: "webadmins, webeditors"
        */
    });
}

IVCaller.prototype.addFile = function(f) {
    file = f;
};

IVCaller.prototype.getVaults = function() {
    core.json("vaultservice/find", {}, function(vaults) {
        return vaults;
    });
};

IVCaller.prototype.selectVault = function(id) {
    vaultId = id;
}

IVCaller.prototype.upload = function() {
    // console.log(file);
    core.postData("uploadservice/upload", file, function(id) {
        core.json("mediacontentservice/storecontentinvault", {"uploadFileId": id, "filename": file.name, "vaultId": vaultId}, function (data) {
            return data;
        });
    });
};

module.exports = IVCaller;