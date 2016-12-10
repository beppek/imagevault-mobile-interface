var IVCaller = require('./IVCaller');
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
        $("#thumbnail").attr("src", "http://iv5qa.azurewebsites.net" + img.Url);
        $("#filename").attr("value", img.Name);
        caller.getMetadataDefinitions(vaultId, function(metaDefinitions) {
            printMetadataDefinitions(metaDefinitions);
        });
    });

    $("#save").click(saveImage);
}

function printCategories(categories) {
    categories.forEach(function(category) {
        createCheckbox(category);
        if (category.Categories.length > 0) {
            var childCategories = category.Categories;
            childCategories.forEach(function(child) {
                createCheckbox(child);
                if (child.Categories.length > 0) {
                    var grandChildren = child.Categories;
                    grandChildren.forEach(function(grandChild) {
                        createCheckbox(grandChild);
                    });
                }
            });
        }

    });
}

function createCheckbox(category) {
    var checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("value", category.Id);
    checkbox.setAttribute("name", "category");
    checkbox.setAttribute("id", category.Id);
    var label = document.createElement("label");
    label.htmlFor = category.Id;
    label.appendChild(document.createTextNode(category.Name));
    label.setAttribute("class", "center");
    $("#checkboxes").append(checkbox);
    $("#checkboxes").append(label);
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
    caller.save(parseInt(imgId), filename, metadata, categories, function(error) {
        if (!error) {
            alert("you uploaded the image");
        } else {
            alert("something went wrong");
        }
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