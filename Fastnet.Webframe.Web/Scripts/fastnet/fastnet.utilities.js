﻿(function ($) {
    // Notes
    // 1. moment.js is required (to mark log/debug with date time info)
    var $T;
    $.fastnet$utilities = {
        clientSideLog: false,
        rootUrl: "/",
        messageBoxElementId: "#message-box",
        localPlayerName: "",
        localDataNamespace: "fastnet-",
        Init: function () {
            $T = this;
            if ($.blockUI !== undefined) {
                $.blockUI.defaults.css = {};
            }
            if (typeof baseUrl !== "undefined" && baseUrl !== null && baseUrl.length > 0) {
                $T.rootUrl = baseUrl;
            }
            if (typeof String.prototype.startsWith != 'function') {
                String.prototype.startsWith = function (str) {
                    return this.substring(0, str.length) === str;
                }
            };
            if (typeof String.prototype.endsWith != 'function') {
                String.prototype.endsWith = function (str) {
                    return this.substring(this.length - str.length, this.length) === str;
                }
            };
            jQuery.fn.extend({
                disable: function (state) {
                    return this.each(function () {
                        var $this = $(this);
                        if ($this.is('input, button')) {
                            this.disabled = state;
                        } else {
                            $this.toggleClass('disabled', state);
                        }
                    });
                }
            });
            $(document).ajaxError($T.AjaxCallFailed);
        },
        //
        AjaxPost: function (args) {

            $(".ajax-error-message").empty();
            return $.ajax({
                url: $T.rootUrl + args.url,
                contentType: "application/json; charset=UTF-8",
                type: "POST",
                data: JSON.stringify(args.data)
            });
        },
        AjaxGet: function (args, noCache) {
            var cache = true;
            if (typeof noCache !== "undefined") {
                cache = !noCache;
            }
            $(".ajax-error-message").empty();
            $T.Debug("AjaxGet: {0}", args.url);
            return $.ajax({
                url: $T.rootUrl + args.url,
                contentType: "application/json",
                type: "GET",
                cache: cache,
            });
        },
        AjaxCallFailed: function (event, jqXHR, settings, thrownError) {
            var errorMessage = $T.Format("Call to \"{0}\" failed: {1}", settings.url, thrownError);
            var element = $(".ajax-error-message");
            if (element.length === 0) {
                $T.MessageBox(errorMessage);
            }
            else {
                element.html(errorMessage);
            }
        },
        //
        //AddScrollbar: function (target) {
        //    //$(target).niceScroll({
        //    //    cursorcolor: "#317085",
        //    //    cursorwidth: "8px",
        //    //    cursorborder: "1px solid #428bca",
        //    //    autohidemode: false,
        //    //    railpadding: { right: 2 },
        //    //});
        //    $(target).perfectScrollbar({ suppressScrollX: true, maxScrollbarLength: 120 });
        //    $(target).addClass("scrollbar");
        //},
        //UpdateScrollbars: function () {
        //    $(".scrollbar").each(function () {
        //        $(this).perfectScrollbar('update');
        //    });
        //    //setTimeout(function () {
        //    //    $(".scrollbar").each(function () {
        //    //        $(this).getNiceScroll().resize();
        //    //    });
        //    //}, 1000);
        //},
        //
        Block: function (selector, options) {
            if (typeof options === "undefined" || options === null) {
                options = { message: "<i class='fa fa-cog fa-spin fa-3x blockui-spinner'></i>" }
            }
            $(selector).block(options);
        },
        UnBlock: function (selector) {
            $(selector).unblock();
        },
        BlockUI: function (message) {
            if ($.blockUI !== undefined) {
                if (message === undefined) {
                    message = "Just a moment...";
                }
                var text = $T.Format("<div>{0}</div>", message);
                $.blockUI({
                    blockMsgClass: 'busy-indicator',
                    message: text // '<div>Just a moment...</div>'
                });
                //$T.Debug("User interface blocked");
            }
        },
        UnBlockUI: function () {
            if ($.blockUI !== undefined) {
                $.unblockUI();
                //$T.Debug("User interface unblocked");
            }
        },
        //,
        MessageBox: function (text, options) {
            function _mbox(text, options) {
                var runtimeOptions = {
                    title: 'System Message',
                    enableSystemCancel: false, // i.e. modal-header x box
                    enableOKButton: true,
                    enableCancelButton: false,
                    okButtonLabel: 'Close',
                    cancelButtonLabel: 'Cancel',
                    OKFunction: null
                };
                if (typeof options !== "undefined" && options !== null) {
                    $.extend(runtimeOptions, options);
                }
                var mb = $($T.messageBoxElementId);
                mb.find("#message-text").text(text);
                mb.find(".modal-footer button[data-cmd='ok']").text(runtimeOptions.okButtonLabel);
                mb.find(".modal-footer button[data-cmd='cancel']").text(runtimeOptions.cancelButtonLabel);
                if (!runtimeOptions.enableSystemCancel) {
                    mb.find(".modal-header button").hide();
                }
                if (!runtimeOptions.enableOKButton) {
                    mb.find(".modal-footer button[data-cmd='ok']").hide();
                } else {
                    mb.find(".modal-footer button[data-cmd='ok']").on('click', function () {
                        $T.Debug("OK button click");
                        $($T.messageBoxElementId).modal('hide');
                        if (runtimeOptions.OKFunction !== null) {
                            runtimeOptions.OKFunction();
                        }
                    });
                }
                if (!runtimeOptions.enableCancelButton) {
                    mb.find(".modal-header button[data-cmd='cancel']").hide();
                }
                $($T.messageBoxElementId).modal();
            }
            if (typeof $.fastnet$form === "function") {
                var mb = new $.fastnet$messageBox({
                    Title: "System Message",
                    OKLabel: "Close"
                });
                mb.show(text);
            } else {
                _mbox(text, options);
            }
        },
        messageBoxWithOptions: function (message, options) {
            //var wWidth = $(window).width();
            //var dWidth = wWidth * 0.8;
            var dialogClass = "message-box";
            var messageBoxId = "#message-box";
            var enableCancel = false;
            var okButtonLabel = "OK";
            var cancelButtonLabel = "Cancel";
            var okFunction = null;
            var cancelFunction = null;
            if (options !== undefined) {
                if (options.noClose) {
                    dialogClass += " no-close";
                }
                if (options.enableCancel) {
                    enableCancel = true;
                }
                if ($.isFunction(options.ok)) {
                    okFunction = options.ok;
                }
                if ($.isFunction(options.cancel)) {
                    cancelFunction = options.cancel;
                }
                if (options.okButtonLabel != undefined) {
                    okButtonLabel = options.okButtonLabel;
                }
                if (options.cancelButtonLabel !== undefined) {
                    cancelButtonLabel = options.cancelButtonLabel;
                }
            }
            var content = null;
            if (message instanceof jQuery) {
                content = $("<div class='content'></div>").append(message);
            } else {
                content = $($T.Format("<div class='content'>{0}</div>", message));
            }
            var buttons = [];
            buttons.push({
                text: okButtonLabel,
                click: function () {
                    $(this).dialog("close");
                    if (okFunction !== null) {
                        okFunction();
                    }
                }
            });
            if (enableCancel) {
                buttons.push({
                    text: cancelButtonLabel,
                    click: function () {
                        $(this).dialog("close");
                        if (cancelFunction !== null) {
                            cancelFunction();
                        }
                    }
                });
            }
            $(messageBoxId).empty().append(content);
            $(messageBoxId).dialog({
                autoOpen: false,
                model: true,
                title: "Apollo",
                dialogClass: dialogClass,
                buttons: buttons,
            });
            $(messageBoxId).dialog("open");
        },
        //        
        GetData: function (key) {
            if (Modernizr.localstorage) {
                return localStorage.getItem($T.localDataNamespace + key);
            }
            return null;
        },
        SetData: function (key, value) {
            if (Modernizr.localstorage) {
                localStorage.setItem($T.localDataNamespace + key, value);
            }
        },
        ClearData: function (key) {
            if (Modernizr.localstorage) {
                localStorage.removeItem($T.localDataNamespace + key);
            }
        },
        ClearStorage: function () {
            if (Modernizr.localstorage) { localStorage.clear(); }
        },
        //
        Goto: function (url) {
            window.location.href = $T.rootUrl + url;
        },
        MakeColumnsEqualHeight: function (columns) {
            var h = 0;
            $(columns).each(function () {
                $(this).css({ 'height': 'auto' });
            });
            $(columns).each(function () {
                //$(this).css({ 'height': 'auto' });
                if ($(this).outerHeight() > h) {
                    h = $(this).outerHeight();
                }
            });
            $(columns).css({ 'height': h });
        },
        SetEnabled: function (elem, yesNo) {
            if (yesNo) {
                $(elem).removeAttr("disabled");
            } else {
                $(elem).attr("disabled", "disabled");
            }
        },
        GetDateTime: function () {
            return moment();
        },
        Format: function (format, args) {
            var i;
            if (args instanceof Array) {
                for (i = 0; i < args.length; i++) {
                    var text = args[i];
                    if (typeof text === "string") {
                        //text = text.replace("'", "&#39;");
                        //text = text.replace(/'/g, "&#39;");
                    }
                    format = format.replace(new RegExp('\\{' + i + '\\}', 'gm'), text);
                }
                return format;
            }
            for (i = 0; i < arguments.length - 1; i++) {
                var text = arguments[i + 1];
                if (typeof text === "string") {
                    //text = text.replace("'", "&#39;");
                    //text = text.replace(/'/g, "&#39;");
                }
                format = format.replace(new RegExp('\\{' + i + '\\}', 'gm'), text);
            }
            return format;
        },
        FormatDate: function (dateTime, format) {
            //dateTimeis converted to a moment if required
            // example formats:
            // DDMMMYYYY 23Jan2015
            // DDMMMYYYY HH:mm:ss.SSS 23Jan2015 14:20:12.376
            if (moment.isDate(dateTime)) {
                dateTime = moment(dateTime);
            }
            return dateTime.format(format);
        },
        //Log: function (str) {
        //    var args = Array.prototype.slice.call(arguments);
        //    var message = $T.Format(str, args.slice(1));
        //    var now = $T.GetDateTime();
        //    var text = $T.Format("{0} [ js] {1}", $T.FormatDate(now, "HH:MM:ss"), message);
        //    $T.record(text);
        //},
        GetUniqueId: function () {
            var key = $T.GetData("uuid");
            if (key === null) {
                key = $T.NewGuid();
                $T.SetData("uuid", key);
            }
            return key;
        },
        NewGuid: function () {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
        Debug: function (str) {
            var args = Array.prototype.slice.call(arguments);
            var message = $T.Format(str, args.slice(1));
            var now = $T.GetDateTime();
            if (message.length > 200) {
                message = message.substring(0, 199) + "...[ total " + message.length + " chars]";
            }
            var text = $T.Format("{0} {1}", $T.FormatDate(now, "HH:mm:ss.SSS"), message);
            $T.record(text);
        },
        EnableClientSideLog: function () {
            $T.clientSideLog = true;
            var key = $T.GetUniqueId();
            $(".fastnet-error-panel").removeClass("hide");
            var url = $T.Format("recorder/read/{0}", key)
            $.when($T.AjaxGet({ url: url }, true)).then(function (r) {
                $.each(r, function (i, item) {
                    var message = $T.Format("<div>{0}</div>", item);
                    $(".fastnet-error-panel").prepend($(message));
                    //$T.writeToErrorPanel(item);
                });
            });
        },
        writeToErrorPanel: function(text) {
            var message = $T.Format("<div>{0}</div>", text);
            $(".fastnet-error-panel").append($(message));
            $(".fastnet-error-panel").scrollTop($(".fastnet-error-panel")[0].scrollHeight);
        },
        record: function (text) {
            //console.log(text);
            if (typeof Debug === "object") {
                Debug.writeln(text);
            } else {
                console.log(text);
            }
            if ($T.clientSideLog) {
                var url = "recorder/write";
                var key = $T.GetUniqueId();
                if (typeof key === "undefined" || key === null || key === "undefined") {
                    debugger;
                }
                var postData = { key: key, text: text };
                $T.AjaxPost({ url: url, data: postData });
                $T.writeToErrorPanel(text);
                //var message = $T.Format("<div>{0}</div>", text);
                //$(".fastnet-error-panel").append($(message));
                //$(".fastnet-error-panel").scrollTop($(".fastnet-error-panel")[0].scrollHeight);
            }
        },
        ToMinutes: function (seconds) {
            var minutes = Math.floor(seconds / 60.0);//.toFixed(0);
            var remainder = (seconds % 60.0).toFixed(0);
            if (remainder.length < 2) {
                remainder = "0" + remainder;
            }
            return minutes + ":" + remainder;
        },
        //
        GetTextNode: function (elem) {
            return $(elem).contents().filter(function () { return this.nodeType === 3 });
        },
    };

    $(function () {
        $.fastnet$utilities.Init();
    });
})(jQuery);