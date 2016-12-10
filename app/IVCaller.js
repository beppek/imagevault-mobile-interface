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
        var vaultId = img.VaultId;
        var thumbnail = img.MediaConversions[0];
        callback(thumbnail, vaultId);
    });
};

IVCaller.prototype.getCategories = function(callback) {
    core.json("CategoryService/Find", {}, function(categories) {
        callback(categories);
    });
};

IVCaller.prototype.getMetadataDefinitions = function(vaultId, callback) {
    core.json("VaultService/Find", {
        Populate: {
            PublishIdentifier: "hackathon",
            MetadataDefinitions: true
        },
        Filter : {
                "Id" : vaultId
                }
    }, function(d) {
        callback(d[0].MetadataDefinitions);
    });
};

IVCaller.prototype.save = function(id, name, metadata, categories, callback) {
    var saveObj = {
        mediaItems: [
        {
            Id: id,
            Name: name,
            Categories:categories,
            Metadata: metadata
        }
        ],
        saveOptions: 7
    };
    core.json("mediaservice/save", saveObj, function(data, error) {
        callback(error);
    });
}

module.exports = IVCaller;