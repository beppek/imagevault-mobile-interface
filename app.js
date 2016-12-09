$(document).ready(function () {
    var core = new ImageVault.Client({
        core: "http://iv5qa.azurewebsites.net/apiv2",
        username: "hackathon",
        password: "ImageVault2016"
        /*
        ,
        impersonate_as: "demo",
        roles: "webadmins, webeditors"
        */
    });

    $("#uploadTest").click(function(){
        core.postData("uploadservice/upload","Min text", function(d) {
            alert("Uploaded content to id "+d);
            core.json("mediacontentservice/storecontentinvault", {})
        });
    });
    //trigger enter on search form
    $("#coreSearchString").keyup(function(event){
        if(event.keyCode == 13){
            $("#coreSearch").click();
        }
    });

    $("#coreSearch").click(function () {
        var searchString = $("#coreSearchString").val();
        $("#searchResultInfo").text("searching for " + searchString);
        $("#searchResult").text("");

        core.json("MediaService/Find", {
            MediaUrlBase: "http://iv5qa.azurewebsites.net/",
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
                    "ResizeMode" : "ScaleToFill"
                    }
                ],
                }
            ],
            Metadata: [
            {
                Filter: {
                    MetadataDefinitionType : "User"
                }

            }
/*
            ,
            {
                Filter: {
                    MetadataDefinitionType : "System"
                }

            }
*/
            ]
            },
            "Filter" : {
            "SearchString" : searchString
            //, "VaultId" : ["1"]
            }
        }
        , function (d) {
//					$("#searchResult").html(JSON.stringify(d));
            if (d == null || d.length == null) {
                $("#searchResultInfo").text("Nothing found!");
            } else {
                $("#searchResultInfo").text("Found " + d.length + " hits.");
            }


            for (var i = 0; i < d.length; i++) {
            var item = d[i];
            var thumbnail = item.MediaConversions[0];
                $("#searchResult").append("<div style='float:left;text-align:center;'><img src='" + thumbnail.Url + "'/><br/>"+item.Name+"</div>");
            }

        });
    });
});