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

	$(document).ready(function () {
	    caller = new IVCaller();
	    var path = window.location.pathname;
	    var page = path.substring(path.lastIndexOf('/') + 1);
	    if (page === "metadata.html") {
	        metadataPage();
	    } else {
	        uploadPage();
	    }

	    //trigger enter on search form
	//     $("#coreSearchString").keyup(function(event){
	//         if(event.keyCode == 13){
	//             $("#coreSearch").click();
	//         }
	//     });

	//     $("#coreSearch").click(function () {
	//         var searchString = $("#coreSearchString").val();
	//         $("#searchResultInfo").text("searching for " + searchString);
	//         $("#searchResult").text("");

	//         core.json("MediaService/Find", {
	//             MediaUrlBase: "http://iv5qa.azurewebsites.net/",
	//             Populate: {
	//             PublishIdentifier: "hackathon",
	//             MediaFormats: [
	//                 {
	//                 $type : "ImageVault.Common.Data.ThumbnailFormat,ImageVault.Common",
	//                 Effects : [
	//                 {
	//                     $type : "ImageVault.Common.Data.Effects.ResizeEffect,ImageVault.Common",
	//                     "Width" : 200,
	//                     "Height" : 200,
	//                     "ResizeMode" : "ScaleToFill"
	//                     }
	//                 ],
	//                 }
	//             ],
	//             Metadata: [
	//             {
	//                 Filter: {
	//                     MetadataDefinitionType : "User"
	//                 }

	//             }
	// /*
	//             ,
	//             {
	//                 Filter: {
	//                     MetadataDefinitionType : "System"
	//                 }

	//             }
	// */
	//             ]
	//             },
	//             "Filter" : {
	//             "SearchString" : searchString
	//             //, "VaultId" : ["1"]
	//             }
	//         }
	//         , function (d) {
	// //					$("#searchResult").html(JSON.stringify(d));
	//             if (d == null || d.length == null) {
	//                 $("#searchResultInfo").text("Nothing found!");
	//             } else {
	//                 $("#searchResultInfo").text("Found " + d.length + " hits.");
	//             }


	//             for (var i = 0; i < d.length; i++) {
	//             var item = d[i];
	//             var thumbnail = item.MediaConversions[0];
	//                 $("#searchResult").append("<div style='float:left;text-align:center;'><img src='" + thumbnail.Url + "'/><br/>"+item.Name+"</div>");
	//             }

	//         });
	    // });
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

	    $("#uploadBtn").change(function(){
	        var file = $(this).get(0).files[0];
	        caller.addFile(file);
	        caller.upload(function(data) {
	            window.location.href = "metadata.html?" + data.Id;
	        });
	    });
	}

	function metadataPage() {

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

	module.exports = IVCaller;

/***/ }
/******/ ]);