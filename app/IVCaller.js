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

IVCaller.prototype.getVaults = function(callback) {
    core.json("vaultservice/find", {}, function(vaults) {
        callback(vaults);
    });
};

IVCaller.prototype.selectVault = function(id) {
    vaultId = id;
}

IVCaller.prototype.upload = function(callback) {
    core.postData("uploadservice/upload", file, function(id) {
        core.json("mediacontentservice/storecontentinvault", {"uploadFileId": id, "filename": file.name, "vaultId": vaultId}, function (data) {
            callback(data);
        });
    });
};

IVCaller.prototype.getThumbnail = function(imgId, callback) {
    core.json("MediaService/Find", {
        Populate: {
            PublishIdentifier: "hackathon",
            MediaFormats: [
                {
                $type : "ImageVault.Common.Data.ThumbnailFormat,ImageVault.Common",
                Effects : [
                {
                    $type : "ImageVault.Common.Data.Effects.ResizeEffect,ImageVault.Common",
                    "Width" : 200,
                    "Height" : 200,
                    "ResizeMode" : "ScaleToFit"
                    }
                ],
                }
            ]
        },
        Filter : {
                "Id" : [imgId]
                }
    }, function(d) {
        var img = d[0];
        var thumbnail = img.MediaConversions[0];
        callback(thumbnail);
    });
}

module.exports = IVCaller;