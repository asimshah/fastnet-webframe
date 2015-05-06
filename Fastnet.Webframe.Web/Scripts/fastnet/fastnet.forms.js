/* for this library to work, forms must follow a pattern. A good example
 * is the registration form in the webframe templates/account folder.
 * 1. Each individual input control should be like:
 *      <div class="form-group" data-property>
            <label for="password">Password</label>
            <input type="password" class="form-control" id="password" placeholder="Password" data-item="password">
            <div class="message"></div>
        </div>
 *     Note especially the data-property and data-item attributes, as well as the message class div for error messages
 * 2.  First call Initialise with a context and a form (typically a root div containing form-groups as described above).
 *     The context is a variable that will be passed through to caller defined functions (such as validation functions)
 *     and elsewhere as required
 * 3.  Call AddValidation as required for each dataItem. dataItem must match the string used for the data-item attribute in the 
 *     form. Multiple validations are supported for the same dataItem.
 * 4.  Call Bind to attach handlers. Available handlers are AfterItemValidation and OnCommand. All input and button tags are bound internally. Caller defined handlers are called
 *     as required. button (or input type=button) tags must have a data-cmd attribute that specifies a string which is the command.
 *     Clicking any button (or input type=button) with data-cmd="cancel" will the form to close.
 * 5.  Call Show to show the form.
 * 6.  The AfterItemValidation handler will be called after each individual data-item is validated (after the blur event).
 * 7.  The OnCommand handler will be called whenever any button is pressed.
 */
(function ($) {
    var $T;
    var $U;
    var formCount = 0;
    var modelessTemplate =
"<div class='modeless hide' >" +
"    <div class='modeless-content'>" +
"        <div class='form-section'>{{{BodyHtml}}}</div>" +
"        <div class='form-section'>{{{FooterHtml}}}</div>" +
"    </div>" +
"    <div class='block-outer hidden'>" +
"        <div class='block-inner'>" +
"            <i class='fa fa-cog fa-spin fa-3x block-spinner'></i>" +
"        </div>" +
"    </div>" +
"</div>";
    var modalTemplate =
"<div class='modal fade' id='{{Id}}' tabindex='-1'>" +
"    <div class='modal-dialog container'>" +
"        <div class='modal-content'>" +
"            <div class='modal-section'>" +
"                <div class='modal-header'>" +
"                    <div>" +
"                       <div class='form-trace'>{{Id}}</div>" +
"                    </div>" +
"                    <div>" +
"                        <button type='button' class='close' data-dismiss='modal' data-cmd='system-close'><span>&times;</span></button>" +
"                        <h4 class='modal-title'>{{Title}}</h4>" +
"                    </div>" +
"                </div>" +
"            </div>" +
"            <div class='modal-section'>{{{BodyHtml}}}</div>" +
"            <div class='modal-section'>{{{FooterHtml}}}</div>" +
"            <span class='resize-grip hidden'></span>" +
"        </div>" +
"        <div class='block-outer hidden'>" +
"            <div class='block-inner'>" +
"                <i class='fa fa-cog fa-spin fa-3x block-spinner'></i>" +
"            </div>" +
"        </div>" +
"    </div>" +
"</div>";
    $.fastnet$messageBox = function (options) {
        var self = this;
        this.options = $.extend({
            Title: "System Message",
            OKButton: true,
            CancelButton: false,
            OKLabel: "OK",
            CancelLabel: "Cancel",
            OnClose: null,
            OnCommand: function (f, cmd) {
                switch (cmd) {
                    case "system-close":
                    case "cancel":
                        break;
                    case "ok":
                        f.close();
                        break;
                }
                if (self.options.OnClose !== null) {
                    self.options.OnClose(cmd);
                }
            }
        }, options);
        $.fastnet$messageBox.prototype.show = function (message, onClose) {
            var _onClose = null;
            if (typeof onClose !== "undefined") {
                _onClose = onClose;
            }
            $.extend(this.options, { OnClose: _onClose });
            //this.options = $.extend({ OnClose: _onClose }, this.options);
            //var f_options = $.extend({
            //    //Message: message,
            //    OnClose: _onClose,

            //}, this.options);
            var data = {
                Message: message,
                OKLabel: this.options.OKLabel,
                CancelLabel: this.options.CancelLabel,
            };
            //var mb = new $.fastnet$form("template/form/messagebox", f_options);
            var mb = new $.fastnet$forms.CreateForm("template/form/messagebox", this.options, data);
            mb.show(function () {
                if (self.options.CancelButton === false) {
                    mb.find("button[data-cmd='cancel'], button[data-cmd='system-close']").addClass("hidden");
                }
                if (self.options.OKButton === false) {
                    mb.find("button[data-cmd='ok']").addClass("hidden");
                }
            });
        };
    };
    var formList = {};
    var formCount = 0;
    function frm(template, options, data) {
        this.options = $.extend({
            _container: ".forms-container",
            _template: template,
            _id: $U.Format("fn-{0}", formCount++),
            _pendingSetEnableds: [],
            _froot: null, //current form's root element, i.e with an Id of _id
            _validators: {},
            Title: "Form Title",
            IsModal: true,
            IsResizable: false,
            AfterItemValidation: null,
            OnChange: null,
            OnCommand: null,
        }, options);
        this.data = $.extend({
            Id: this.options._id, // so I can trace the form id visually in the form!
            Title: this.options.Title,
        }, data);

        formList[this.options._id] = this;

        function _load() {
            var me = this;
            return $.when(
                 $U.AjaxGet({ url: me.options._template })
                ).then(function (r) {
                    var formBody = $(r.Template).find(".form-body");
                    formBody = Mustache.to_html(formBody[0].outerHTML, me.data);
                    var formFooter = $(r.Template).find(".form-footer");
                    formFooter = Mustache.to_html(formFooter[0].outerHTML, me.data);
                    me.data = $.extend({
                        BodyHtml: formBody,
                        FooterHtml: formFooter
                    }, me.data);
                    var template = me.options.IsModal ? modalTemplate : modelessTemplate;
                    me.options._froot = $(Mustache.to_html(template, me.data));
                    if (me.options.IsModal) {
                        me.options._froot.find(".form-body").addClass("modal-body");
                        me.options._froot.find(".form-footer").addClass("modal-footer");
                    }
                    $.each(me.options._pendingSetEnableds, function (index, item) {
                        if (item.action === "disable") {
                            me.disableCommand(item.cmd);
                        } else {
                            me.enableCommand(item.cmd);
                        }
                    });
                    me.options._pendingSetEnableds.length = 0;
                    me.options._froot.find("[data-property]").attr("data-validation-state", "unknown")
                    $U.Debug("form id {0} created", me.options._id);
                });
        }
        function _show(onload) {
            var me = this;
            var container = me.options._container;
            $(container).append(me.options._froot);
            _saveOriginalData();
            _bindCommands.call(me);
            _bindLeaveFocus.call(me);
            _bindDataChange.call(me);
            _bindFileButtons.call(me);
            if (me.options.IsModal) {
                //$(id).modal({
                me.options._froot.modal({
                    backdrop: 'static',
                    keyboard: false
                });

                if (me.options.IsResizable) {
                    _addResizability.call(me);
                }
            } else {
                me.options._froot.removeClass("hide");
            }
            if ($.isFunction(onload)) {
                onload(me);
            }
            setTimeout(function () {
                var f_elements = $(container).find("[data-focus]");
                if (f_elements.length > 0) {
                    f_elements[0].focus();
                }
            }, 750);
        };
        function _close() {
            var me = this;
            var id = "#" + me.options._id;
            if (me.options.IsModal) {
                if (me.options.IsResizable) {
                    _removeResizability.call(me);
                }
            } else {
                $(me.options._container).find(".modeless").addClass("hide");
            }
            $(id).off();
            $(id).remove();
            delete formList[me.options._id];
        }
        function _onCommand(cmd) {
            var me = this;
            if ($.isFunction(me.options.OnCommand)) {
                var f = formList[me.options._id];
                me.options.OnCommand(f, cmd);
            }
        };
        function _addResizability() {
            var me = this;
            // this also makes the form movable
            //var f = $($T.form);
            var rm = {
                resizing: false, moving: false,
                sp: { x: 0, y: 0 }, // sp = start position
                sm: { l: 0, t: 0, r: 0, b: 0 }, // sm = start margin
                ss: { w: 0, h: 0 }, // ss = start size
            }; // rm == resizability and movement
            var f = me.options._froot;
            var resizeGrip = f.find(".resize-grip");
            var modalHeader = f.find(".modal-header");
            var modalDialog = f.find(".modal-dialog");
            var modalBody = f.find(".modal-body");
            var grabStartInfo = function (e) {
                rm.sp.x = e.pageX;
                rm.sp.y = e.pageY;
                rm.sm.l = parseInt(modalDialog.css("margin-left"));
                rm.sm.t = parseInt(modalDialog.css("margin-top"));
                rm.sm.r = parseInt(modalDialog.css("margin-right"));
                rm.sm.b = parseInt(modalDialog.css("margin-bottom"));
            }
            resizeGrip.removeClass("hidden");
            modalHeader.css({ "cursor": "move" });
            resizeGrip.css({ "cursor": "nwse-resize" });
            resizeGrip.on("mousedown.forms", function (e) {
                e.preventDefault();
                e.stopPropagation();
                rm.resizing = true;
                grabStartInfo(e);
                rm.ss.h = modalBody.height();
                rm.ss.w = modalDialog.width();
                $(window).on("mousemove.formsdynamic", function (e) {
                    if (rm.resizing) {
                        var xoffset = e.pageX - rm.sp.x;
                        var yoffset = e.pageY - rm.sp.y;
                        if (xoffset !== 0 || yoffset !== 0) {
                            var changes = {
                                height: rm.ss.h + yoffset,
                                width: rm.ss.w + xoffset,
                                marginRight: rm.sm.r - xoffset,
                                marginBottom: rm.sm.b - yoffset
                            };
                            if (changes.marginRight < 0) {
                                changes.marginRight = 0;
                            }
                            //$U.Debug("rs({3}, {4}): ({0}, {1}), mr: {2}", changes.width, changes.height, changes.marginRight, xoffset, yoffset);
                            modalDialog.css("margin-right", changes.marginRight + "px");
                            modalBody.height(changes.height);
                            modalDialog.width(changes.width);
                        }
                    }
                });
            });
            modalHeader.on("mousedown.forms", function (e) {
                rm.moving = true;
                grabStartInfo(e);
                $(window).on("mousemove.formsdynamic", function (e) {
                    if (rm.moving) {
                        var xoffset = e.pageX - rm.sp.x;
                        var yoffset = e.pageY - rm.sp.y;
                        var margin = {
                            left: rm.sm.l + xoffset,
                            top: rm.sm.t + yoffset,
                            right: rm.sm.r - xoffset,
                            bottom: rm.sm.b - yoffset
                        };
                        if (margin.top < 0) {
                            margin.top = 0;
                        }
                        modalDialog.css("margin-left", margin.left + "px");
                        modalDialog.css("margin-right", margin.right + "px");
                        modalDialog.css("margin-top", margin.top + "px");
                    }
                })

            });
            $(window).on("mouseup.forms", function (e) {
                rm.moving = false;
                rm.resizing = false;
                $(window).off(".formsdynamic");
            });
            f.find(".modal-header").addClass("resizable");
        };
        function _removeResizability() {
            var me = this;
            var f = me.options._froot;
            var resizeGrip = f.find(".resize-grip");
            var modalHeader = f.find(".modal-header");
            var modalDialog = f.find(".modal-dialog");
            var modalBody = f.find(".modal-body");
            $(window).off(".formsdynamic");
            $(window).off(".forms");
            modalHeader.removeClass("resizable");
            modalHeader.css("cursor", "default");
            f.off(".forms");
            resizeGrip.off(".forms");
            resizeGrip.css("cursor", "default");
            resizeGrip.addClass("hidden");
        };
        function _saveOriginalData() {
            var lfSelector = "input[type=text], input[type=password], input[type=email]";
            $(lfSelector).each(function (index, element) {
                var val = $(element).val();
                $(element).attr("data-original", val);
            });
        };
        function _bindFileButtons() {
            var me = this;
            $(".btn-file :file").on("change", function () {
                var input = $(this);
                var dataItem = input.attr("data-item");
                numFiles = input.get(0).files ? input.get(0).files.length : 1,
                label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
                input.trigger('fileselect', [numFiles, label, dataItem]);
            });
            $(".btn-file :file").on("fileselect", function (event, numFiles, label, dataItem) {
                var input = $(this).parents('.input-group').find(':text'),
                    log = numFiles > 1 ? numFiles + ' files selected' : label;
                if (input.length) {
                    input.val(log);
                } else {
                    if (log) alert(log);
                }
                if (me.options.OnChange !== null) {
                    me.options.OnChange(me, dataItem);
                }
            });
        };
        function _bindCommands() {
            var me = this;
            if (me.options.IsModal) {
                me.options._froot.on("shown.bs.modal", function (e) {
                    var zIndex = 1040 + ((formList.length) * 10);
                    $(this).css('z-index', zIndex);
                });
                me.options._froot.on("hidden.bs.modal", function (e) {
                    $U.Debug("form {0} closed", me.options._id);
                    _close.bind(me)();
                });
            }
            me.options._froot.find("button, input[type=button]").on("click", function (e) {
                var cmd = $(this).attr("data-cmd");
                $U.Debug("{0} click", cmd);
                if (cmd === "cancel") {
                    me.options._froot.modal('hide');
                    //$(id).modal('hide');
                }
                e.preventDefault();
                _onCommand.call(me, cmd);
            });
        };
        function _bindLeaveFocus() {
            var me = this;
            var lfSelector = "input[type=text], input[type=password], input[type=email]";
            me.options._froot.find(lfSelector).on("focus", function (e) {
                var dataItem = $(this).attr("data-item");
                $U.Debug("got focus for {0}", dataItem);
            });
            me.options._froot.find(lfSelector).on("blur", function (e) {
                var dataItem = $(this).attr("data-item");
                // so far only input tags
                var val = $(this).val();
                var original = $(this).attr("data-original");
                var hasChanged = val !== original;
                $U.Debug("leave focus for {0}", dataItem);
                if (hasChanged) {
                    var validations = me.options._validators[dataItem];
                    if (typeof validations !== "undefined" && validations !== null) {
                        $.when(_validateItem(me.options._id, dataItem, validations)).then(function (r) {
                            $U.Debug("_validateItem: dataItem: {0},  result = {1}", r.dataItem, r.success, r.errorCount);
                            var dp = me.options._froot.find("[data-item='" + r.dataItem + "']").closest("[data-property]");
                            dp.attr("data-validation-state", r.success ? "valid" : "error");
                            if (me.options.AfterItemValidation !== null) {
                                me.options.AfterItemValidation(me, r);
                            }
                        });
                    }
                }
                //$(this).removeAttr("data-changed");
            });
        };
        function _bindDataChange() {
            var me = this;
            var dcSelector = "input[type=text], input[type=password], input[type=email]";
            me.options._froot.find(dcSelector).on("input", function (e) {
                var item = $(this).attr("data-item");
                //$(this).attr("data-changed", "true");
                //var value = $(this).val();
                //if (typeof value === 'string') {
                //    value = value.trim();
                //}
                $(this).closest("[data-property]").find(".message").html("");
                if (me.options.OnChange !== null) {
                    me.options.OnChange(me, item);
                }
            });
        };
        function _commandEnable(command, enable) {
            // enable = true to enable, false to disable
            var me = this;
            if (me.options._froot === null) {
                me.options._pendingSetEnableds.push({ action: enable ? "enable" : "disable", cmd: command });
            } else {
                var selector = $U.Format("button[data-cmd='{0}'], input[type=button][data-cmd='{0}']", command);
                me.options._froot.find(selector).each(function () {
                    $U.SetEnabled(this, enable);
                    $U.Debug("{0}: command {1} disabled", me.options._id, command);
                });
            }
        };
        function _validateItem(id, dataItem, validations) {
            // I don't use this to set me because I have not been able to 
            // use bind() with a $.when call
            var me = formList[id];
            var deferred = new $.Deferred();
            var errors = [];
            // first perform validations that do not return a promise
            // (these are presumed to be local validations!)
            var result = true;
            var itemData = me.getData(dataItem);// self.getData(dataItem);// _getItemData(dataItem);
            $.each(validations, function (index, validation) {
                if (validation.isDeferred === false) {
                    var r = validation.validator(me, itemData, validation.message, errors);
                    $U.Debug("validator with message \"{0}\" called", validation.message);
                    if (r == false) {
                        result = false;
                        return false;
                    }
                }
            });
            if (result == true) {
                // local validations have been performed
                // now do deferred ones in parallel
                // (these are probably ajax calls)
                var functions = [];
                $.each(validations, function (index, validation) {
                    if (validation.isDeferred === true) {
                        functions.push(validation.validator(me, itemData, validation.message, errors));
                    }
                });
                $.when.apply($, functions).then(function () {
                    //deferred.resolve(true);
                    deferred.resolve({ dataItem: dataItem, success: true, errorCount: 0 });
                }).fail(function () {
                    var de = _displayErrors.bind(me, dataItem, errors);
                    de();
                    //deferred.resolve(false);
                    deferred.resolve({ dataItem: dataItem, success: false, errorCount: errors.length });
                });
            } else {
                _displayErrors.call(me, dataItem, errors);
                //deferred.resolve(false);
                deferred.resolve({ dataItem: dataItem, success: false, errorCount: errors.length });
            }
            return deferred.promise();
        };
        function _displayErrors(dataItem, errors) {
            var me = this;
            var text = "";
            $.each(errors, function (index, message) {
                if (index > 0) {
                    message = ". " + message;
                }
                text += message;
            });
            me.options._froot.find("[data-item='" + dataItem + "']").closest("[data-property]").find(".message").html(text);
        };
        frm.prototype.clearMessages = function () {
            var me = this;
            me.options._froot.find("[data-property] .message").html('');
        };
        frm.prototype.find = function (selector) {
            var me = this;
            return me.options._froot.find(selector);
        };
        frm.prototype.enableCommand = function (command) {
            var me = this;
            _commandEnable.call(me, command, true);
        };
        frm.prototype.disableCommand = function (command) {
            var me = this;
            _commandEnable.call(me, command, false);
        };
        frm.prototype.show = function (onload) {
            var me = this;
            if (me.options._froot === null) {
                $.when(_load.call(me)).then(function () {
                    _show.call(me, onload);
                });
            } else {
                _show.call(me);
            }
        };
        frm.prototype.close = function () {
            var me = this;
            _close.call(me);
        };
        frm.prototype.getData = function (dataItem) {
            var me = this;
            if (typeof dataItem === "undefined") {
                var result = {};
                me.options._froot.find("[data-item]").each(function (index, element) {
                    var name = $(this).attr("data-item");
                    var val = $(this).val().trim();
                    result[name] = val;
                });
                return result;
            } else {
                // assume val() will do it all for now
                return me.options._froot.find("[data-item='" + dataItem + "']").val();
            }
        };
        frm.prototype.setData = function (dataItem, data) {
            var me = this;
            var target = me.options._froot.find("[data-item='" + dataItem + "']");
            // assume val() will do it all for now
            target.val(data);
        };
        frm.prototype.addIsRequiredValidator = function (dataItem, errorMessage) {
            var me = this;
            if (typeof errorMessage === "undefined" || errorMessage === null || errorMessage.trim() === "") {
                errorMessage = "This field is required";
            }
            me.addValidator(dataItem, {
                func: function (f, data, message, errors) {
                    var r = !(data === null || data === "");
                    if (!r) {
                        errors.push(message);
                    }
                    return r;
                },
                isDeferred: false,
                errorMessage: errorMessage
            });
        };
        frm.prototype.addValidators = function (dataItem, validators) {
            var me = this;
            $.each(me.options._validators, function (index, validator) {
                me.addValidator(dataItem, validator);
            });
        };
        frm.prototype.addValidator = function (dataItem, validator) {
            var me = this;
            // validator is an object with
            // func = validationfunction - signature is  (currentForm , dataToValidate, errorMessage, errors) returning a bool
            // or func = validationFunction - signature is  (current , dataToValidate, errorMessage, errors), returning a promise
            // isDeferred = true if func returns a promise
            // errorMessage = text to display if the validation fails
            // Notes:
            // 1. funcs returning a bool MUSt add the provided errorMessage to the errors array.
            // 2. funcs returning a promise MUST either resolve(true) or reject(false) having added the provided errorMessage to the errors array
            if (typeof me.options._validators[dataItem] === "undefined" || me.options._validators[dataItem] === null) {
                me.options._validators[dataItem] = [];
            }
            me.options._validators[dataItem].push({ validator: validator.func, isDeferred: validator.isDeferred, message: validator.errorMessage });
        };
        frm.prototype.block = function () {
            var me = this;
            me.options._froot.find(".modal-dialog .block-outer").removeClass("hidden");
        };
        frm.prototype.unBlock = function () {
            var me = this;
            me.options._froot.find(".modal-dialog .block-outer").addClass("hidden");
        };
        frm.prototype.isValid = function () {
            var me = this;
            var fieldCount = me.options._froot.find("[data-property]").length;
            var validCount = me.options._froot.find("[data-validation-state='valid']").length;
            var errorCount = me.options._froot.find("[data-validation-state='error']").length;
            return errorCount === 0;//validCount === fieldCount;
        };
    }
    //$.fastnet$form = function (templateUrl, options) {
    //    var self = this;
    //    var validationFunctions = {};
    //    var validators = {};
    //    var tu = templateUrl;
    //    var formElement = null;
    //    var dfd = null;
    //    var fillData = null;
    //    var pendingSetEnableds = [];
    //    this.options = $.extend({
    //        Container: ".forms-container",
    //        Id: $U.Format("fn-{0}", formCount++),
    //        IsModal: true,
    //        IsResizable: false,
    //        BodyClasses: "",
    //        Title: "Form Title",
    //        OnCommand: null,
    //        AfterItemValidation: null
    //    }, options);
    //    $.fastnet$form.prototype.isValid = function () {
    //        var fieldCount = formElement.find("[data-property]").length;
    //        var validCount = formElement.find("[data-validation-state='valid']").length;
    //        var errorCount = formElement.find("[data-validation-state='error']").length;
    //        return errorCount === 0;//validCount === fieldCount;
    //    };
    //    $.fastnet$form.prototype.getData = function (dataItem) {
    //        if (typeof dataItem === "undefined") {
    //            var result = {};
    //            formElement.find("[data-item]").each(function (index, element) {
    //                var name = $(this).attr("data-item");
    //                var val = $(this).val().trim();
    //                result[name] = val;
    //            });
    //            return result;
    //        } else {
    //            // assume val() will do it all for now
    //            return formElement.find("[data-item='" + dataItem + "']").val();
    //        }
    //    }
    //    $.fastnet$form.prototype.find = function (selector) {
    //        return formElement.find(selector);
    //    }
    //    $.fastnet$form.prototype.fill = function (data) {
    //        fillData = data;
    //    };
    //    $.fastnet$form.prototype.close = function () {
    //        var id = "#" + self.options.Id;
    //        if (self.options.IsModal) {
    //            $(id).modal('hide');
    //        }
    //    };
    //    $.fastnet$form.prototype.addValidator = function (dataItem, validator) {
    //        // validator is an object with
    //        // func = validationfunction - signature is  (currentForm , dataToValidate, errorMessage, errors) returning a bool
    //        // or func = validationFunction - signature is  (current , dataToValidate, errorMessage, errors), returning a promise
    //        // isDeferred = true if func returns a promise
    //        // errorMessage = text to display if the validation fails
    //        // Notes:
    //        // 1. funcs returning a bool MUSt add the provided errorMessage to the errors array.
    //        // 2. funcs returning a promise MUST either resolve(true) or reject(false) having added the provided errorMessage to the errors array
    //        if (typeof validators[dataItem] === "undefined" || validators[dataItem] === null) {
    //            validators[dataItem] = [];
    //        }
    //        validators[dataItem].push({ validator: validator.func, isDeferred: validator.isDeferred, message: validator.errorMessage });
    //    }
    //    $.fastnet$form.prototype.addValidators = function (dataItem, validators) {
    //        $.each(validators, function (index, validator) {
    //            self.addValidator(dataItem, validator);
    //        });
    //    };
    //    $.fastnet$form.prototype.addIsRequiredValidator = function (dataItem, errorMessage) {
    //        if (typeof errormessage === "undefined" || errormessage === null || errormessage.trim() === "") {
    //            errormessage = "This field is required";
    //        }
    //        self.addValidator(dataItem, {
    //            func: function (f, data, errorMessage, errors) {
    //                var r = !(data === null || data === "");
    //                if (!r) {
    //                    errors.push(errorMessage);
    //                }
    //                return r;
    //            },
    //            isDeferred: false,
    //            errorMessage: errorMessage
    //        });
    //    };
    //    $.fastnet$form.prototype.show = function (onload) {
    //        if (formElement === null) {
    //            $.when(_load()).then(function () {
    //                _show(onload);
    //            });
    //        } else {
    //            _show();
    //        }

    //        function _validateForm() {

    //        };

    //        function _validateItem2(dataItem, validations) {
    //            var deferred = new $.Deferred();
    //            var errors = [];
    //            // first perform validations that do not return a promise
    //            // (these are presumed to be local validations!)
    //            var result = true;
    //            var itemData = self.getData(dataItem);// _getItemData(dataItem);
    //            $.each(validations, function (index, validation) {
    //                if (validation.isDeferred === false) {
    //                    var r = validation.validator(self, itemData, validation.message, errors);
    //                    $U.Debug("validator with message \"{0}\" called", validation.message);
    //                    if (r == false) {
    //                        result = false;
    //                        return false;
    //                    }
    //                }
    //            });
    //            if (result == true) {
    //                // local validations have been performed
    //                // now do deferred ones in parallel
    //                // (these are probably ajax calls)
    //                var functions = [];
    //                $.each(validations, function (index, validation) {
    //                    if (validation.isDeferred === true) {
    //                        functions.push(validation.validator(self, itemData, validation.message, errors));
    //                    }
    //                });
    //                $.when.apply($, functions).then(function () {
    //                    //deferred.resolve(true);
    //                    deferred.resolve({ dataItem: dataItem, success: true, errorCount: 0 });
    //                }).fail(function () {
    //                    _displayErrors(dataItem, errors);
    //                    //deferred.resolve(false);
    //                    deferred.resolve({ dataItem: dataItem, success: false, errorCount: errors.length });
    //                });
    //            } else {
    //                _displayErrors(dataItem, errors);
    //                //deferred.resolve(false);
    //                deferred.resolve({ dataItem: dataItem, success: false, errorCount: errors.length });
    //            }
    //            return deferred.promise();
    //        }
    //        function _displayErrors(dataItem, errors) {
    //            var text = "";
    //            $.each(errors, function (index, message) {
    //                if (index > 0) {
    //                    message = ". " + message;
    //                }
    //                text += message;
    //            });
    //            $("[data-item='" + dataItem + "']").closest("[data-property]").find(".message").html(text);
    //        };
    //        function _bindLeaveFocus() {
    //            var lfSelector = "input[type=text], input[type=password], input[type=email]";
    //            formElement.find(lfSelector).on("blur", function (e) {
    //                var dataItem = $(this).attr("data-item");
    //                var validations = validators[dataItem];
    //                if (typeof validations !== "undefined" && validations !== null) {
    //                    $.when(_validateItem2(dataItem, validations)).then(function (r) {
    //                        $U.Debug("_validateItem2: dataItem: {0},  result = {1}", r.dataItem, r.success, r.errorCount);
    //                        var dp = formElement.find("[data-item='" + r.dataItem + "']").closest("[data-property]");
    //                        dp.attr("data-validation-state", r.success ? "valid" : "error");
    //                        if (self.options.AfterItemValidation !== null) {
    //                            self.options.AfterItemValidation(r);
    //                        }
    //                    });
    //                }
    //                _validateForm();
    //            });
    //        };
    //        function _bindDataChange() {
    //            var dcSelector = "input[type=text], input[type=password], input[type=email]";
    //            formElement.find(dcSelector).on("input", function (e) {
    //                var item = $(this).attr("data-item");
    //                var value = $(this).val();
    //                if (typeof value === 'string') {
    //                    value = value.trim();
    //                }
    //                $(this).closest("[data-property]").find(".message").html("");
    //            });
    //        }
    //        function _bindCommands() {
    //            if (self.options.IsModal) {
    //                formElement.on("shown.bs.modal", function (e) {
    //                    var zIndex = 1040 + ((formCount - 1) * 10);
    //                    $(this).css('z-index', zIndex);
    //                });
    //                formElement.on("hidden.bs.modal", function (e) {
    //                    $U.Debug("form {0} closed", self.options.Id);
    //                    _close();
    //                });
    //            }
    //            formElement.find("button, input[type=button]").on("click", function (e) {
    //                var cmd = $(this).attr("data-cmd");
    //                $U.Debug("{0} click", cmd);
    //                if (cmd === "cancel") {
    //                    formElement.modal('hide');
    //                    //$(id).modal('hide');
    //                }
    //                e.preventDefault();
    //                _onCommand(cmd);
    //            });
    //        }
    //        function _close() {
    //            var id = "#" + self.options.Id;
    //            $(id).off();
    //            $(id).remove();
    //            formCount--;
    //        }
    //        function _show(onload) {
    //            var container = self.options.Container;
    //            var id = "#" + self.options.Id;
    //            //$(container).find(id).remove();
    //            $(container).append(formElement);
    //            if (fillData !== null) {
    //                $.each(fillData, function (index, item) {
    //                    var di = "[data-item='" + index + "']";
    //                    // input, checkbox, radio, datepicker - what else?
    //                    // do I need code for each one?
    //                    $(id).find(di).val(item);
    //                });
    //            }
    //            _bindCommands();
    //            _bindLeaveFocus();
    //            _bindDataChange();
    //            if (self.options.IsModal) {
    //                //$(id).modal({
    //                formElement.modal({
    //                    backdrop: 'static',
    //                    keyboard: false
    //                });
    //                if (self.options.IsResizable) {
    //                    _addResizability();
    //                }
    //            }
    //            if ($.isFunction(onload)) {
    //                onload(self);
    //            }
    //        }
    //        function _addResizability() {
    //            // this also makes the form movable
    //            //var f = $($T.form);
    //            var rm = {
    //                resizing: false, moving: false,
    //                sp: { x: 0, y: 0 }, // sp = start position
    //                sm: { l: 0, t: 0, r: 0, b: 0 }, // sm = start margin
    //                ss: { w: 0, h: 0 }, // ss = start size
    //            }; // rm == resizability and movement
    //            var f = formElement;
    //            var resizeGrip = f.find(".resize-grip");
    //            var modalHeader = f.find(".modal-header");
    //            var modalDialog = f.find(".modal-dialog");
    //            var modalBody = f.find(".modal-body");
    //            var grabStartInfo = function (e) {
    //                rm.sp.x = e.pageX;
    //                rm.sp.y = e.pageY;
    //                rm.sm.l = parseInt(modalDialog.css("margin-left"));
    //                rm.sm.t = parseInt(modalDialog.css("margin-top"));
    //                rm.sm.r = parseInt(modalDialog.css("margin-right"));
    //                rm.sm.b = parseInt(modalDialog.css("margin-bottom"));
    //            }
    //            resizeGrip.removeClass("hidden");
    //            modalHeader.css({ "cursor": "move" });
    //            resizeGrip.css({ "cursor": "nwse-resize" });
    //            resizeGrip.on("mousedown.forms", function (e) {
    //                e.preventDefault();
    //                e.stopPropagation();
    //                rm.resizing = true;
    //                grabStartInfo(e);
    //                rm.ss.h = modalBody.height();
    //                rm.ss.w = modalDialog.width();
    //                $(window).on("mousemove.formsdynamic", function (e) {
    //                    if (rm.resizing) {
    //                        var xoffset = e.pageX - rm.sp.x;
    //                        var yoffset = e.pageY - rm.sp.y;
    //                        if (xoffset !== 0 || yoffset !== 0) {
    //                            var changes = {
    //                                height: rm.ss.h + yoffset,
    //                                width: rm.ss.w + xoffset,
    //                                marginRight: rm.sm.r - xoffset,
    //                                marginBottom: rm.sm.b - yoffset
    //                            };
    //                            if (changes.marginRight < 0) {
    //                                changes.marginRight = 0;
    //                            }
    //                            //$U.Debug("rs({3}, {4}): ({0}, {1}), mr: {2}", changes.width, changes.height, changes.marginRight, xoffset, yoffset);
    //                            modalDialog.css("margin-right", changes.marginRight + "px");
    //                            modalBody.height(changes.height);
    //                            modalDialog.width(changes.width);
    //                        }
    //                    }
    //                });
    //            });
    //            modalHeader.on("mousedown.forms", function (e) {
    //                rm.moving = true;
    //                grabStartInfo(e);
    //                $(window).on("mousemove.formsdynamic", function (e) {
    //                    if (rm.moving) {
    //                        var xoffset = e.pageX - rm.sp.x;
    //                        var yoffset = e.pageY - rm.sp.y;
    //                        var margin = {
    //                            left: rm.sm.l + xoffset,
    //                            top: rm.sm.t + yoffset,
    //                            right: rm.sm.r - xoffset,
    //                            bottom: rm.sm.b - yoffset
    //                        };
    //                        if (margin.top < 0) {
    //                            margin.top = 0;
    //                        }
    //                        modalDialog.css("margin-left", margin.left + "px");
    //                        modalDialog.css("margin-right", margin.right + "px");
    //                        modalDialog.css("margin-top", margin.top + "px");
    //                    }
    //                })

    //            });
    //            $(window).on("mouseup.forms", function (e) {
    //                rm.moving = false;
    //                rm.resizing = false;
    //                $(window).off(".formsdynamic");
    //            });
    //            f.find(".modal-header").addClass("resizable");
    //        }
    //        function _onCommand(cmd) {
    //            $U.Debug("form {0} cmd {1}", self.options.Id, cmd);
    //            if (self.options.OnCommand !== null) {
    //                self.options.OnCommand(self, cmd);
    //            }
    //        }
    //    };
    //    $.fastnet$form.prototype.enableCommand = function (command) {
    //        if (formElement === null) {
    //            pendingSetEnableds.push({ action: "enable", cmd: command });
    //        } else {
    //            var selector = $U.Format("button[data-cmd='{0}'], input[type=button][data-cmd='{0}']", command);
    //            formElement.find(selector).each(function () {
    //                $U.SetEnabled(this, true);
    //            });
    //        }
    //    };
    //    $.fastnet$form.prototype.disableCommand = function (command) {
    //        if (formElement === null) {
    //            pendingSetEnableds.push({ action: "disable", cmd: command });
    //        } else {
    //            var selector = $U.Format("button[data-cmd='{0}'], input[type=button][data-cmd='{0}']", command);
    //            formElement.find(selector).each(function () {
    //                $U.SetEnabled(this, false);
    //            });
    //        }
    //    };
    //    $.fastnet$form.prototype.block = function () {
    //        formElement.find(".modal-dialog .block-outer").removeClass("hidden");
    //    };
    //    $.fastnet$form.prototype.unBlock = function () {
    //        formElement.find(".modal-dialog .block-outer").addClass("hidden");
    //    };
    //    function _load() {
    //        return $.when(
    //             $U.AjaxGet({ url: tu })
    //            ).then(function (r) {
    //                //var bodyTemplate = $(r.Template).find(".body");
    //                var formBody = $(r.Template).find(".form-body");
    //                formBody = Mustache.to_html(formBody[0].outerHTML, self.options);
    //                var formFooter = $(r.Template).find(".form-footer");
    //                formFooter = Mustache.to_html(formFooter[0].outerHTML, self.options);
    //                var data = $.extend({
    //                    BodyHtml: formBody,//formBody[0].outerHTML,
    //                    FooterHtml: formFooter//formFooter[0].outerHTML
    //                }, self.options);
    //                var template = self.options.IsModal ? modalTemplate : modelessTemplate;
    //                formElement = $(Mustache.to_html(template, data));
    //                if (self.options.IsModal) {
    //                    formElement.find(".form-body").addClass("modal-body");
    //                    formElement.find(".form-footer").addClass("modal-footer");
    //                }
    //                $.each(pendingSetEnableds, function (index, item) {
    //                    if (item.action === "disable") {
    //                        self.disableCommand(item.cmd);
    //                    } else {
    //                        self.enableCommand(item.cmd);
    //                    }
    //                });
    //                pendingSetEnableds.length = 0;
    //                formElement.find("[data-property]").attr("data-validation-state", "unknown")
    //                //formStack.push(self);
    //            });
    //    }
    //};
    $.fastnet$forms = {
        CreateForm: frm
    }
    $(function () {
        $T = this;
        $U = $.fastnet$utilities;
        //$.fastnet$forms.init();
    });
})(jQuery);