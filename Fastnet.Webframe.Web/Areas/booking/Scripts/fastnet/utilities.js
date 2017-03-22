/// <reference path="../../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../../scripts/typings/moment/moment.d.ts" />
var fastnet;
(function (fastnet) {
    var force;
    (function (force) {
        var dark = (function () {
            function dark() {
            }
            dark.prototype.test = function () {
                fastnet.util.debug.print("star wars");
            };
            return dark;
        }());
        force.dark = dark;
    })(force = fastnet.force || (fastnet.force = {}));
    var web;
    (function (web) {
        //import ajax = fastnet.util.ajax;
        var tools = (function () {
            function tools() {
            }
            tools.getTemplate = function (request) {
                var url = "template/get/" + request.templateUrl;
                var deferred = $.Deferred();
                $.when(fastnet.util.ajax.Get({ url: url })).then(function (r) {
                    var template = r.Template;
                    deferred.resolve({ ctx: request.ctx, templateUrl: request.templateUrl, template: template });
                });
                return deferred.promise();
            };
            return tools;
        }());
        web.tools = tools;
    })(web = fastnet.web || (fastnet.web = {}));
    var util;
    (function (util) {
        var utilOnReady = (function () {
            function utilOnReady() {
            }
            utilOnReady.init = function () {
            };
            return utilOnReady;
        }());
        var ajax = (function () {
            function ajax() {
            }
            ajax.init = function (url) {
                this.rootUrl = url;
                util.debug.print("rootUrl is {0}", this.rootUrl);
                $(document).ajaxError(this.ajaxError);
            };
            ajax.Get = function (args, cache) {
                if (cache === void 0) { cache = true; }
                return $.ajax({
                    url: this.rootUrl + args.url,
                    contentType: "application/json",
                    type: "GET",
                    cache: cache,
                });
            };
            ajax.Post = function (args) {
                return $.ajax({
                    url: this.rootUrl + args.url,
                    contentType: "application/json; charset=UTF-8",
                    type: "POST",
                    data: JSON.stringify(args.data)
                });
            };
            ajax.ajaxError = function (event, jqXHR, settings, thrownError) {
                var errorMessage = util.str.format("Internal error\nCall to \"{0}\" failed: {1}", settings.url, thrownError);
                util.debug.print(errorMessage);
                // how to call a system form here? alert()??
                alert(errorMessage);
            };
            return ajax;
        }());
        ajax.rootUrl = "/";
        util.ajax = ajax;
        var str = (function () {
            function str() {
            }
            str.format = function (fmt) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var i;
                var text;
                if (args instanceof Array) {
                    for (i = 0; i < args.length; i++) {
                        text = args[i];
                        fmt = fmt.replace(new RegExp('\\{' + i + '\\}', 'gm'), text);
                    }
                    return fmt;
                }
                for (i = 0; i < arguments.length - 1; i++) {
                    text = arguments[i + 1];
                    fmt = fmt.replace(new RegExp('\\{' + i + '\\}', 'gm'), text);
                }
                return fmt;
            };
            str.toMoment = function (d) {
                if (typeof d === "string") {
                    if (d.length === 19 && d.indexOf('T') === 10) {
                        // is an isoDate?
                        return moment(d);
                    }
                    else {
                        return moment(d, "DDMMMYYYY");
                    }
                }
                else {
                    return moment(d);
                }
            };
            str.toDate = function (d) {
                if (d instanceof Date) {
                    return d;
                }
                else {
                    var md;
                    if (typeof d === "string") {
                        md = this.toMoment(d);
                    }
                    else {
                        md = d;
                    }
                    return md.toDate();
                }
            };
            str.toDateString = function (d) {
                var md;
                if (typeof d === "string") {
                    md = this.toMoment(d);
                }
                else {
                    if (d instanceof Date) {
                        md = moment(d);
                    }
                    else {
                        md = d;
                    }
                }
                return md.format("DDMMMYYYY");
            };
            return str;
        }());
        util.str = str;
        var debug = (function () {
            function debug() {
            }
            debug.print = function (str) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var message = util.str.format.apply(this, arguments);
                if (debug.routeMessagesToVisualStudio) {
                    if (window.hasOwnProperty('Debug')) {
                        var x = window['Debug'];
                        x.writeln(message);
                    }
                    else {
                        console.log(message);
                    }
                }
                else {
                    console.log(message);
                }
            };
            return debug;
        }());
        debug.routeMessagesToVisualStudio = false;
        util.debug = debug;
        var helper = (function () {
            function helper() {
            }
            helper.setLocalData = function (key, value) {
                if (!helper.isNullOrUndefined(localStorage)) {
                    localStorage.setItem(helper.nameSpace + key, value);
                }
            };
            helper.getLocalData = function (key) {
                if (!helper.isNullOrUndefined(localStorage)) {
                    return localStorage.getItem(helper.nameSpace + key);
                }
                return null;
            };
            helper.clearLocalData = function (key) {
                if (!helper.isNullOrUndefined(localStorage)) {
                    return localStorage.removeItem(helper.nameSpace + key);
                }
            };
            helper.clearLocalStorage = function () {
                if (!helper.isNullOrUndefined(localStorage)) {
                    return localStorage.clear();
                }
            };
            helper.isNullOrUndefined = function (obj) {
                return obj === null || obj === undefined;
            };
            return helper;
        }());
        helper.nameSpace = "fastnet-";
        util.helper = helper;
        utilOnReady.init();
    })(util = fastnet.util || (fastnet.util = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=utilities.js.map