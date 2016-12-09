(function ($, ns) {

    var client = function (config) {
        this._init(config);
        return this;
    };

    client.prototype = {
        //properties
        //the url to the core service (https://imagevault.local:9901)
        core: null,
        //the url to the auth service (only needed if we want to use the logged in user
        // (http://myEPiSite.com/imagevaultws)  (requires an authenticated session)
        authUrl: null,
        //the username and password for the clientIdentifier (sdk user)
        username: null,
        password: null,
        authMethod: "active",
		//if we should impersonate the user
        impersonate_as: null,
        //any roles to append
        roles: null,
        //a cached Authorization header value
        authToken: null,
        //the cached access token
        accessToken: null,
        _lastError: null,

        //methods
        _init: function (config) {
            $.extend(this, config);
            //make sure core and authUrl ends with a /
            if (this.core)
                if (this.core[this.core.length - 1] != '/')
                    this.core = this.core + "/";
            if (this.authUrl)
                if (this.authUrl[this.authUrl.length - 1] != '/')
                    this.authUrl = this.authUrl + "/";

        },
        //Calls a service
        //service: [required] the name of the service and method. (ie. MyService/MyMethod)
        //args: [optional] the object that should be passed as argument to the method. (ie if the service signature 
        //      looks like MyMethod(int arg1, string arg2) then we pass the args {arg1:4,arg2:"nisse"} )
        //      subclasses are indicated by specifying the $type argument on the format "Namespace.ClassName,Assembly.Name (without dll)" like $type="ImageVault.Common.Data.ThumbnailFormat,ImageVault.Common"
        //callback: [required] the callback function to use, will take the result from the method as parameter to the callback 
        //      (ie. function(result){...}
        json: function (service, args, callback) {
            this._innerCall(service, args, callback, { dataType: 'JSON' });
        },
        html: function (service, args, callback) {
            this._innerCall(service, args, callback, { dataType: 'HTML' });
        },
        _innerCall: function (service, args, callback, config) {
            this._lastError = null;
            if (typeof args === "function") {
                callback = args;
                args = null;
            }
            if (typeof args === "object" || (typeof args==="string" && args.length>0 && args.charAt(0)!='{' && args.charAt(0)!='[')) {
                args = JSON.stringify(args);
            }
            var self = this;
            this._getAuthToken(function (token) {
                //error in getAuthToken
                if (self.authMethod=="none" || token !== null) {
                    self._callServiceWithToken(token, service, args, callback, config);
                } else {
                    callback(null);
                }
            });
        },
        _callServiceWithToken: function (token, service, args, callback, config) {
            var self = this;
            var url = self.core + service;

            var type = 'POST';
            if (args == null) {
                type = 'GET';
            }
            var headers = {};
            if (token != null) {
                //Authorization can be overwritten by the browser so we use both.
                headers.Authorization = token;
                headers.IVAuthorization = token;
            }
            var ajaxConfig = {
                url: url,
                type: type,
                data: args,
                contentType: 'application/json; charset=utf-8',
                headers: headers,
                success: function (data) {
                    callback(data);
                }
            };
            ajaxConfig = $.extend(ajaxConfig, config);
            var reAuthFunction = function(retryCall) {
                 self._reauthenticateUsingActiveAuthentication(retryCall);
            };
            var retryCallFunction = function (t) {
                if (t !== null) {
                    //Authorization can be overwritten by the browser so we use both.
                    ajaxConfig.headers.Authorization = t;
                    ajaxConfig.headers.IVAuthorization = t;
                }
                //clear retry function
                reAuthFunction = null;
                self._ajaxWithCorsSupport(ajaxConfig);
            };
            ajaxConfig.error = function (jqXhr, status, err) {
                if (jqXhr.status == 401 && typeof reAuthFunction === "function") {
                    reAuthFunction(retryCallFunction);
                } else {
                    var error = { message: err, status: jqXhr.status };
                    self._lastError = error;
                    callback(null,error);
                }
            };
            self._ajaxWithCorsSupport(ajaxConfig);
        },
        _reauthenticateUsingActiveAuthentication: function (callback) {
            this.authToken = null;
            this.sessionToken = null;
            this._getAuthToken(callback);
        },
      
        _ajaxWithCorsSupport: function (config) {
            //needed to make things work in IE9
            var oldSupportCors = $.support.cors;
            $.support.cors = true;
            var oldComplete = config.complete;
            config.complete = function (jqXhr, status, responseText) {
                $.support.cors = oldSupportCors;
                if (typeof oldComplete === "function") {
                    oldComplete(jqXhr, status, responseText);
                }
            };
            $.ajax(config);
        },
        _getAuthToken: function (callback) {
            var self = this;
            //authMethod none don't use tokens
            if (self.authMethod == "none") {
                self.authToken = null;
                callback(null);
                return;
            }
            //if we already has a token
            if (self.authToken && self.accessToken && self.accessToken.expires_at && self.accessToken.expires_at > new Date()) {
                callback(self.authToken);
                return;
            }
            //calculate params
            var params = {};
            params.grant_type = 'client_credentials';
            if (self.impersonate_as) params.impersonate_as = self.impersonate_as;
            if (self.roles) params.roles = self.roles;

            //calculate headers
            var headers = {};
            //add auth header if u/p is provided (otherwize the current logged in user is used)
            if (self.username && self.password) {
                var untoken = "Basic " + self._Base64.encode(self.username + ":" + self.password);
                headers = { 'Authorization': untoken };
            }
            var url = this.authUrl;
            if (!url)
                url = this.core;
            url += "oauth/token";

                var config = {
                    url: url,
                type: 'POST',
                headers: headers,
                    //endpoint will return text/xml and we will force it to plain text instead.
                //dataType: 'application/json',
                contentType: 'application/x-www-form-urlencoded; charset=utf-8',
                    cache: false,
                data: params,
                    success: function (data) {
                    //construct accessToken
                    var accessToken = self.accessToken = data;
                    var expires = new Date();
                    expires.setSeconds(expires.getSeconds() + accessToken.expires_in);
                    self.accessToken.expires_at = expires;
                    self.accessToken = accessToken;

                    self.authToken = accessToken.token_type + " " + accessToken.access_token;
                        callback(self.authToken);
                    },
                error: function (xhr, status, err) {
                    var error = JSON.parse(xhr.responseText);
                    self._lastError = { status: xhr.status, message: error };
                        callback(null);
                    }
                };
                self._ajaxWithCorsSupport(config);
        },
        getLastErrorMessage: function () {
            if (this._lastError && this._lastError.message)
                return this._lastError.message;
            return null;
        },

        //base 64 util
        _Base64: {

            // private property
            _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

            // public method for encoding
            encode: function (input) {
                var output = "";
                var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                var i = 0;

                input = this._utf8_encode(input);

                while (i < input.length) {

                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output = output +
						this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
							this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

                }

                return output;
            },

            // public method for decoding
            decode: function (input) {
                var output = "";
                var chr1, chr2, chr3;
                var enc1, enc2, enc3, enc4;
                var i = 0;

                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                while (i < input.length) {

                    enc1 = this._keyStr.indexOf(input.charAt(i++));
                    enc2 = this._keyStr.indexOf(input.charAt(i++));
                    enc3 = this._keyStr.indexOf(input.charAt(i++));
                    enc4 = this._keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output = output + String.fromCharCode(chr1);

                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }

                }

                output = this._utf8_decode(output);

                return output;

            },

            // private method for UTF-8 encoding
            _utf8_encode: function (string) {
                string = string.replace(/\r\n/g, "\n");
                var utftext = "";

                for (var n = 0; n < string.length; n++) {

                    var c = string.charCodeAt(n);

                    if (c < 128) {
                        utftext += String.fromCharCode(c);
                    }
                    else if ((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                    else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }

                }

                return utftext;
            },

            // private method for UTF-8 decoding
            _utf8_decode: function (utftext) {
                var string = "";
                var i = 0;
                var c, c2, c3;

                while (i < utftext.length) {

                    c = utftext.charCodeAt(i);

                    if (c < 128) {
                        string += String.fromCharCode(c);
                        i++;
                    }
                    else if ((c > 191) && (c < 224)) {
                        c2 = utftext.charCodeAt(i + 1);
                        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                        i += 2;
                    }
                    else {
                        c2 = utftext.charCodeAt(i + 1);
                        c3 = utftext.charCodeAt(i + 2);
                        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                        i += 3;
                    }

                }

                return string;
            }

        }

    };

    ns.Client = client;
})(window.iv_jQuery != null ? window.iv_jQuery : jQuery, window.ImageVault = window.ImageVault || {});
