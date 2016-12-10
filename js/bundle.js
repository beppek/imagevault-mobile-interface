/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var IVCaller = __webpack_require__(1);
	var caller;
	var VaultService;

	var vaults;
	var imgId;

	$(document).ready(function () {
	    caller = new IVCaller();
	    var path = window.location.pathname;
	    var page = path.substring(path.lastIndexOf('/') + 1);
	    if (page === "metadata.html") {
	        metadataPage();
	    } else {
	        uploadPage();
	    }
	});

	function uploadPage() {
	    caller.getVaults(function(data) {
	        vaults = data;
	        caller.selectVault(vaults[0].Id);
	        data.forEach(function(vault) {
	            var option = document.createElement("option");
	            option.setAttribute("value", vault.Id);
	            $(option).text(vault.Name);
	            $("#vaults").append(option);
	        });

	        $("#vaults").change(function(event){
	            caller.selectVault(event.target.value);
	        });

	    });

	    $("#uploadBtn").change(function() {
	        var file = $(this).get(0).files[0];
	        caller.addFile(file);
	        caller.upload(function(data) {
	            window.location.href = "metadata.html?" + data.Id;
	        });
	    });
	}

	function metadataPage() {
	    var url = window.location.href;
	    imgId = url.split("?")[1];
	    caller.getCategories(function(categories) {
	        printCategories(categories);
	    });
	    caller.getThumbnail(imgId, function(img, vaultId) {
	        $("#thumbnail").attr("src", "http://iv5qa.azurewebsites.net/" + img.Url);
	        $("#filename").attr("value", img.Name);
	        caller.getMetadataDefinitions(vaultId, function(metaDefinitions) {
	            printMetadataDefinitions(metaDefinitions);
	        });
	    });

	    $("#save").click(saveImage);
	}

	function printCategories(categories) {
	    categories.forEach(function(category) {
	        var checkbox = document.createElement("input");
	        checkbox.setAttribute("type", "checkbox");
	        checkbox.setAttribute("value", category.Id);
	        checkbox.setAttribute("name", "category");
	        checkbox.setAttribute("id", category.Id);
	        var label = document.createElement("label");
	        label.htmlFor = category.Id;
	        label.appendChild(document.createTextNode(category.Name));
	        $("#checkboxes").append(checkbox);
	        $("#checkboxes").append(label);
	        //TODO: Handle child categories

	        // if (category.Categories.length > 0) {
	        //     console.log(category.Categories);
	        // }
	    });
	}

	function printMetadataDefinitions(metaDefinitions) {
	    metaDefinitions.forEach(function(metaDefinition) {
	        var meta = metaDefinition.MetadataDefinition;
	        var metaInput = document.createElement("input");
	        if (metaDefinition.IsMandatory == true) {
	            metaInput.required = true;
	        }
	        metaInput.setAttribute("id", meta.Id);
	        metaInput.setAttribute("placeholder", meta.Name);
	        metaInput.setAttribute("type", "text");
	        metaInput.setAttribute("data-metadatatype", meta.MetadataType);
	        $("#metadata").append(metaInput);
	    });
	}

	function saveImage() {
	    var filename = $("#filename").val();
	    var metadata = [];
	    var categories = [];

	    var metaInputs = $("#metadata").find("input");
	    var i;
	    for (i = 0; i < metaInputs.length; i += 1) {
	        var metadataType = getMetadataType(parseInt(metaInputs[i].getAttribute("data-metadatatype")));
	        var data = {$type: metadataType, MetadataDefinitionId: parseInt(metaInputs[i].id), Value: metaInputs[i].value};
	        metadata.push(data);
	    }
	    $("input:checkbox:checked").each(function() {
	        var cData = {Id: parseInt(this.id)};
	        categories.push(cData);
	    });
	    caller.save(parseInt(imgId), filename, metadata, categories, function() {
	        // alert("you uploaded the image");
	    });
	}

	function getMetadataType(typeId) {
	    switch (typeId) {
	        case 1:
	            return "ImageVault.Common.Data.MetadataString,ImageVault.Common";
	        case 2:
	            return "ImageVault.Common.Data.MetadataDateTime,ImageVault.Common";
	        case 3:
	            return "ImageVault.Common.Data.MetadataInteger,ImageVault.Common";
	        case 4:
	            return "ImageVault.Common.Data.MetadataBoolean,ImageVault.Common";
	        case 5:
	            return "ImageVault.Common.Data.MetadataLongString,ImageVault.Common";
	        case 6:
	            return "ImageVault.Common.Data.MetadataDecimal,ImageVault.Common";
	    }
	}

/***/ },
/* 1 */
/***/ function(module, exports) {

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
	        // callback();
	        if (error) {
	            console.log(error);
	        }
	    });
	}

	module.exports = IVCaller;

/***/ }
/******/ ]);