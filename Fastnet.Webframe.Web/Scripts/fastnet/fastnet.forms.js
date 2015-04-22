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
"    <div class='modeless-body {{BodyClasses}}'>" +
"    </div>" +
"</div>";
    var modalTemplate =
"<div class='modal fade' id='{{Id}}' tabindex='-1'>" +
"    <div class='modal-dialog container'>" +
"        <div class='modal-content'>" +
"            <div class='modal-section'>" +
"                <div class='modal-header'>" +
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
    $.fastnet$form = function (templateUrl, options) {
        var self = this;
        var validationFunctions = {};
        var validators = {};
        var tu = templateUrl;
        var formElement = null;
        var dfd = null;
        var fillData = null;
        var pendingSetEnableds = [];
        this.options = $.extend({
            Container: ".forms-container",
            Id: $U.Format("fn-{0}", formCount++),
            IsModal: true,
            IsResizable: false,
            BodyClasses: "",
            Title: "Form Title",
            OnCommand: null,
            AfterItemValidation: null
        }, options);
        $.fastnet$form.prototype.isValid = function () {
            var fieldCount = formElement.find("[data-property]").length;
            var validCount = formElement.find("[data-validation-state='valid']").length;
            var errorCount = formElement.find("[data-validation-state='error']").length;
            return errorCount === 0;//validCount === fieldCount;
        };
        $.fastnet$form.prototype.getData = function (dataItem) {
            if (typeof dataItem === "undefined") {
                var result = {};
                formElement.find("[data-item]").each(function (index, element) {
                    var name = $(this).attr("data-item");
                    var val = $(this).val().trim();
                    result[name] = val;
                });
                return result;
            } else {
                // assume val() will do it all for now
                return formElement.find("[data-item='" + dataItem + "']").val();
            }
        }
        $.fastnet$form.prototype.find = function(selector) {
            return formElement.find(selector);
        }
        $.fastnet$form.prototype.fill = function (data) {
            fillData = data;
        };
        $.fastnet$form.prototype.close = function () {
            var id = "#" + self.options.Id;
            if (self.options.IsModal) {
                $(id).modal('hide');
            }
        };
        $.fastnet$form.prototype.addValidator = function (dataItem, validator) {
            // validator is an object with
            // func = validationfunction - signature is  (currentForm , dataToValidate, errorMessage, errors) returning a bool
            // or func = validationFunction - signature is  (current , dataToValidate, errorMessage, errors), returning a promise
            // isDeferred = true if func returns a promise
            // errorMessage = text to display if the validation fails
            // Notes:
            // 1. funcs returning a bool MUSt add the provided errorMessage to the errors array.
            // 2. funcs returning a promise MUST either resolve(true) or reject(false) having added the provided errorMessage to the errors array
            if (typeof validators[dataItem] === "undefined" || validators[dataItem] === null) {
                validators[dataItem] = [];
            }
            validators[dataItem].push({ validator: validator.func, isDeferred: validator.isDeferred, message: validator.errorMessage });
        }
        //$.fastnet$form.prototype.addValidation = function(dataItem, validationFunction, errorMessage) {
        //    if (typeof validationFunctions[dataItem] === "undefined" || validationFunctions[dataItem] === null) {
        //        validationFunctions[dataItem] = [];
        //    }
        //    validationFunctions[dataItem].push({ validator: validationFunction, message: errorMessage });
        //};
        $.fastnet$form.prototype.addValidators = function (dataItem, validators) {
            $.each(validators, function (index, validator) {
                self.addValidator(dataItem, validator);
            });
        };
        $.fastnet$form.prototype.addIsRequiredValidator = function (dataItem, errorMessage) {
            if (typeof errormessage === "undefined" || errormessage === null || errormessage.trim() === "") {
                errormessage = "This field is required";
            }
            self.addValidator(dataItem, {
                func: function (f, data, errorMessage, errors) {
                    var r = !(data === null || data === "");
                    if (!r) {
                        errors.push(errorMessage);
                    }
                    return r;
                },
                isDeferred: false,
                errorMessage: errorMessage
            });
        };
        //$.fastnet$form.prototype.addIsRequiredValidator = function (dataItem, errormessage) {
        //    if (typeof errormessage === "undefined" || errormessage === null || errormessage.trim() === "") {
        //        errormessage = "This field is required";
        //    }
        //    self.addValidation(dataItem, function (form, data) {
        //        return !(data === null || data === "");
        //    }, errormessage);
        //};
        $.fastnet$form.prototype.show = function (onload) {
            if (formElement === null) {
                $.when(_load()).then(function () {
                    _show(onload);
                });
            } else {
                _show();
            }

            function _validateForm() {

            };
            //function _applyValidation(validationFunction, data) {
            //    //var message = formItem.find(".message");
            //    var deferred = new $.Deferred();
            //    if ($.isFunction(validationFunction)) {
            //        if (isValid(data)) {
            //            deferred.resolve(true);
            //        } else {
            //            //$U.Debug(errorMessage);
            //            //$T.errors.push(errorMessage);
            //            deferred.reject(false);
            //        }
            //        return deferred.promise();
            //    }
            //    else {
            //        $U.MessageBox("System error: incorrect validator call");
            //        return null;
            //    }
            //};
            function _validateItem2(dataItem, validations) {
                var deferred = new $.Deferred();
                var errors = [];
                // first perform validations that do not return a promise
                // (these are presumed to be local validations!)
                var result = true;
                var itemData = self.getData(dataItem);// _getItemData(dataItem);
                $.each(validations, function (index, validation) {
                    if (validation.isDeferred === false) {
                        var r = validation.validator(self, itemData, validation.message, errors);
                        $U.Debug("validator with message \"{0}\" called", validation.message);
                        if (r == false) {
                            //errors.push(validation.message);
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
                            functions.push(validation.validator(self, itemData, validation.message, errors));
                        }
                    });
                    $.when.apply($, functions).then(function () {
                        //deferred.resolve(true);
                        deferred.resolve({ dataItem: dataItem, success: true, errorCount: 0 });
                    }).fail(function () {
                        _displayErrors(dataItem, errors);
                        //deferred.resolve(false);
                        deferred.resolve({ dataItem: dataItem, success: false, errorCount: errors.length });
                    });
                } else {
                    _displayErrors(dataItem, errors);
                    //deferred.resolve(false);
                    deferred.resolve({ dataItem: dataItem, success: false, errorCount: errors.length });
                }
                return deferred.promise();
            }
            function _displayErrors(dataItem, errors) {
                var text = "";
                $.each(errors, function (index, message) {
                    if (index > 0) {
                        message = ". " + message;
                    }
                    text += message;
                });
                $("[data-item='" + dataItem + "']").closest("[data-property]").find(".message").html(text);
            };
            //function _validateItem(dataItem) {
            //    var validations = validationFunctions[dataItem];
            //    if (typeof validations !== "undefined" && validations !== null) {
            //        function applyValidation(isValid, errorMessage) {
            //            if (isValid(self, itemData)) {
            //                return true;
            //            } else {
            //                errors.push(errorMessage);
            //                return false;
            //            }
            //        }
            //        var deferred = new $.Deferred();
            //        var errors = [];
            //        var funcs = [];
            //        var itemData = _getItemData(dataItem);
            //        $.each(validations, function (i, validation) {
            //            funcs.push(applyValidation(validation.validator, validation.message));
            //        });
            //        $.when.apply($, funcs).then(function (arg1, arg2) {
            //            var r = $.inArray(false, arguments); // test if there is a false in the arguments returned
            //            if (r === false) { 
            //                deferred.resolve(true);
            //            } else {
            //                var text = "";
            //                $.each(errors, function (index, message) {
            //                    if (index > 0) {
            //                        message = ". " + message;
            //                    }
            //                    text += message;
            //                });
            //                $("[data-item='" + dataItem + "']").closest("[data-property]").find(".message").html(text);
            //                deferred.reject(false);
            //            }
            //            if (self.options.AfterItemValidation !== null) {
            //                self.options.AfterItemValidation(self, { dataItem: dataItem, success: r, errorCount: errors.length });
            //            }
            //        });
            //        //$.when($F.Validate($T.context, formitem, data, validations)
            //        //    ).then(function () {
            //        //        var errors = $T.form.find("*[data-property][data-state='error']").length;
            //        //        var totalWithState = $T.form.find("*[data-property][data-state]").length;
            //        //        var total = $T.form.find("*[data-property]").length;
            //        //        if ($T.afterItemValidation !== null) {
            //        //            $T.afterItemValidation($T.context, item, total, totalWithState, errors);
            //        //        }
            //        //    });
            //    }
            //};
            //function _getItemData(dataItem) {
            //    // assume val() will do it all for now
            //    return $("[data-item='" + dataItem + "']").val();
            //}
            function _bindLeaveFocus() {
                var lfSelector = "input[type=text], input[type=password], input[type=email]";
                formElement.find(lfSelector).on("blur", function (e) {
                    var dataItem = $(this).attr("data-item");
                    var validations = validators[dataItem];
                    if (typeof validations !== "undefined" && validations !== null) {
                        $.when(_validateItem2(dataItem, validations)).then(function (r) {
                            $U.Debug("_validateItem2: dataItem: {0},  result = {1}", r.dataItem, r.success, r.errorCount);
                            var dp = formElement.find("[data-item='" + r.dataItem + "']").closest("[data-property]");
                            dp.attr("data-validation-state", r.success ? "valid" : "error");
                            if (self.options.AfterItemValidation !== null) {
                                self.options.AfterItemValidation(r);
                            }
                        });
                    }
                    _validateForm();
                });
            };
            function _bindDataChange() {
                var dcSelector = "input[type=text], input[type=password], input[type=email]";
                formElement.find(dcSelector).on("input", function (e) {
                    var item = $(this).attr("data-item");
                    var value = $(this).val();
                    if (typeof value === 'string') {
                        value = value.trim();
                    }
                    $(this).closest("[data-property]").find(".message").html("");
                });
            }
            function _bindCommands() {
                if (self.options.IsModal) {
                    formElement.on("shown.bs.modal", function (e) {
                        var zIndex = 1040 + ((formCount - 1) * 10);
                        $(this).css('z-index', zIndex);
                        // allow form to be fully created
                        //setTimeout(function () {
                        //    formElement.find(".modal-backdrop").css('z-index', zIndex - 1);
                        //}, 0);
                    });
                    formElement.on("hidden.bs.modal", function (e) {
                        $U.Debug("form {0} closed", self.options.Id);
                        _close();
                    });
                }
                formElement.find("button, input[type=button]").on("click", function (e) {
                    var cmd = $(this).attr("data-cmd");
                    $U.Debug("{0} click", cmd);
                    if (cmd === "cancel") {
                        formElement.modal('hide');
                        //$(id).modal('hide');
                    }
                    e.preventDefault();
                    _onCommand(cmd);
                });
            }
            function _close() {
                var id = "#" + self.options.Id;
                $(id).off();
                $(id).remove();
                formCount--;
            }
            function _show(onload) {
                var container = self.options.Container;
                var id = "#" + self.options.Id;
                //$(container).find(id).remove();
                $(container).append(formElement);
                if (fillData !== null) {
                    $.each(fillData, function (index, item) {
                        var di = "[data-item='" + index + "']";
                        // input, checkbox, radio, datepicker - what else?
                        // do I need code for each one?
                        $(id).find(di).val(item);
                    });
                }
                _bindCommands();
                _bindLeaveFocus();
                _bindDataChange();
                if (self.options.IsModal) {
                    //$(id).modal({
                    formElement.modal({
                        backdrop: 'static',
                        keyboard: false
                    });
                    if (self.options.IsResizable) {
                        _addResizability();
                    }
                }
                if ($.isFunction(onload)) {
                    onload(self);
                }
            }
            function _addResizability () {
                // this also makes the form movable
                //var f = $($T.form);
                var rm = {
                    resizing: false, moving: false,
                    sp: { x: 0, y: 0 }, // sp = start position
                    sm: { l: 0, t: 0, r: 0, b: 0 }, // sm = start margin
                    ss: { w: 0, h: 0 }, // ss = start size
                }; // rm == resizability and movement
                var f = formElement;
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
                            //$T.debugDynamicForm("MM", { margin: margin, xoffset: xoffset, yoffset: yoffset });
                        }
                    })

                });
                $(window).on("mouseup.forms", function (e) {
                    rm.moving = false;
                    rm.resizing = false;
                    //$T.debugDynamicForm("MU");
                    $(window).off(".formsdynamic");
                });
                f.find(".modal-header").addClass("resizable");
            }
            function _onCommand(cmd) {
                $U.Debug("form {0} cmd {1}", self.options.Id, cmd);
                if (self.options.OnCommand !== null) {
                    self.options.OnCommand(self, cmd);
                }
            }
        };
        $.fastnet$form.prototype.enableCommand = function (command) {
            if (formElement === null) {
                pendingSetEnableds.push({ action: "enable", cmd: command });
            } else {
                var selector = $U.Format("button[data-cmd='{0}'], input[type=button][data-cmd='{0}']", command);
                formElement.find(selector).each(function () {
                    $U.SetEnabled(this, true);
                });
            }
        };
        $.fastnet$form.prototype.disableCommand = function (command) {
            if (formElement === null) {
                pendingSetEnableds.push({ action: "disable", cmd: command });
            } else {
                var selector = $U.Format("button[data-cmd='{0}'], input[type=button][data-cmd='{0}']", command);
                formElement.find(selector).each(function () {
                    $U.SetEnabled(this, false);
                });
            }
        };
        $.fastnet$form.prototype.block = function () {
            formElement.find(".modal-dialog .block-outer").removeClass("hidden");
        };
        $.fastnet$form.prototype.unBlock = function () {
            formElement.find(".modal-dialog .block-outer").addClass("hidden");
        };
        function _load  () {
            return $.when(
                 $U.AjaxGet({ url: tu })
                ).then(function (r) {
                    //var bodyTemplate = $(r.Template).find(".body");
                    var formBody = $(r.Template).find(".form-body");
                    formBody = Mustache.to_html(formBody[0].outerHTML, self.options);
                    var formFooter = $(r.Template).find(".form-footer");
                    formFooter = Mustache.to_html(formFooter[0].outerHTML, self.options);
                    var data = $.extend({
                        BodyHtml: formBody,//formBody[0].outerHTML,
                        FooterHtml: formFooter//formFooter[0].outerHTML
                    }, self.options);
                    var template = self.options.IsModal ? modalTemplate : modelessTemplate;
                    formElement = $(Mustache.to_html(template, data));
                    if (self.options.IsModal) {
                        formElement.find(".form-body").addClass("modal-body");
                        formElement.find(".form-footer").addClass("modal-footer");
                    }
                    $.each(pendingSetEnableds, function (index, item) {
                        if (item.action === "disable") {
                            self.disableCommand(item.cmd);
                        } else {
                            self.enableCommand(item.cmd);
                        }
                    });
                    pendingSetEnableds.length = 0;
                    formElement.find("[data-property]").attr("data-validation-state", "unknown")
                    //formStack.push(self);
                });
        }
    };

    //$.fastnet$forms = {
    //    NewForm: function (templateUrl, options) {
    //        var f = new form(templateUrl, options);
    //        f.Load();
    //        return f;
    //    },
    //    context: null,
    //    errors: null,
    //    form: null,
    //    isModal: null,
    //    isResizable: null,
    //    options: null,
    //    dataValues: {},
    //    validationFunctions: {},
    //    afterItemValidation: null,
    //    onCommand: null,
    //    //rm: {
    //    //    resizing: false, moving: false,
    //    //    sp: { x: 0, y: 0 }, // sp = start position
    //    //    sm: { l: 0, t: 0, r: 0, b: 0 }, // sm = start margin
    //    //    ss: { w: 0, h: 0 }, // ss = start size
    //    //}, // rm == resizability and movement
    //    init: function () {
    //        $T = this;
    //        $U = $.fastnet$utilities;
    //    },
    //    Initialise: function (ctx, form, options) {
    //        $T.isModal = null;
    //        $T.options = options;
    //        $T.context = ctx;
    //        $T.form = form;
    //        $T.errors = null;
    //        $T.validationFunctions = {};
    //        $T.dataValues = {};
    //        $T.afterItemValidation = null;
    //    },
    //    initialise2: function (ctx, form, options) {
    //        $T.isModal = null;
    //        $T.options = options;
    //        $T.context = ctx;
    //        $T.form = form;
    //        $T.errors = null;
    //        $T.validationFunctions = {};
    //        $T.dataValues = {};
    //        $T.afterItemValidation = null;
    //    },
    //    AddValidation: function (dataItem, validationFunction, errorMessage) {
    //        if (typeof $T.validationFunctions[dataItem] === "undefined" || $T.validationFunctions[dataItem] === null) {
    //            $T.validationFunctions[dataItem] = [];
    //        }
    //        $T.validationFunctions[dataItem].push({ validator: validationFunction, message: errorMessage });
    //    },
    //    AddIsRequiredValidation: function (dataItem, errorMessage) {
    //        $T.AddValidation(dataItem, $T.validateIsRequired, errorMessage);
    //    },
    //    ApplyValidation: function (formItem, isValid, errorMessage) {
    //        var message = formItem.find(".message");
    //        var deferred = new $.Deferred();
    //        if ($.isFunction(isValid)) {
    //            if (isValid()) {
    //                deferred.resolve(true);
    //            } else {
    //                $U.Debug(errorMessage);
    //                $T.errors.push(errorMessage);
    //                deferred.reject(false);
    //            }
    //            return deferred.promise();
    //        }
    //        else {
    //            $U.MessageBox("System error: incorrect validator call");
    //            return null;
    //        }
    //    },
    //    Bind: function (handlers) {
    //        var form = $T.form;
    //        var ctx = $T.context;
    //        $T.afterItemValidation = handlers.afterItemValidation;
    //        $T.onCommand = handlers.onCommand;
    //        form.find("input[type=text], input[type=password], input[type=email]").on("input", function (e) {
    //            var item = $(this).attr("data-item");
    //            var value = $(this).val();
    //            if (typeof value === 'string') {
    //                value = value.trim();
    //            }
    //            var formItem = $T.findFormItem(form, item);
    //            formItem.find(".message").html("");
    //            $T.dataValues[item] = value;
    //        });
    //        form.find("input[type=text], input[type=password], input[type=email]").on("blur", function (e) {
    //            var item = $(this).attr("data-item");
    //            var formItem = $T.findFormItem(form, item);
    //            $T.leaveFocus(formItem, item);
    //        });
    //        if (typeof $T.options.Features != "undefined" && $T.options.Features.DateCapture) {
    //            form.find(".date[data-type='date']")
    //                .datetimepicker({ format: 'DDMMMYYYY' })
    //                .on('dp.change', function (e) {
    //                    var item = $(this).find("input").attr('data-item');
    //                    var value = e.date;
    //                    var formItem = $T.findFormItem(form, item);
    //                    formItem.find(".message").html("");
    //                    $T.dataValues[item] = value;
    //                });
    //        }
    //        form.find("button, input[type=button]").on("click", function (e) {
    //            var cmd = $(this).attr("data-cmd");
    //            if (cmd === "cancel") {
    //                form.modal('hide');
    //            }
    //            e.preventDefault();
    //            if ($T.onCommand !== null) {
    //                $T.onCommand($T.context, cmd);
    //            }
    //        });
    //    },
    //    Block: function () {
    //        $(".modal-dialog .block-outer").removeClass("hidden");
    //    },
    //    UnBlock: function () {
    //        $(".modal-dialog .block-outer").addClass("hidden");
    //    },
    //    Close: function () {
    //        if ($T.isModal) {
    //            $T.form.modal('hide');
    //            if ($T.isResizable) {
    //                $T.removeResizability();
    //            }
    //        } else {
    //            $("#form").off();
    //            $("#form .modeless").addClass('hide');//.empty();
    //            $("#form .modeless-body form").empty();
    //        }

    //    },
    //    DisableCommand: function (command) {
    //        var selector = $U.Format("button[data-cmd='{0}'], input[type=button][data-cmd='{0}']", command);
    //        $T.form.find(selector).each(function () {
    //            $U.SetEnabled(this, false);
    //        });
    //    },
    //    EnableCommand: function (command) {
    //        var selector = $U.Format("button[data-cmd='{0}'], input[type=button][data-cmd='{0}']", command);
    //        $T.form.find(selector).each(function () {
    //            $U.SetEnabled(this, true);
    //        });
    //    },
    //    GetForm: function () {
    //        return $T.form;
    //    },
    //    GetFormData: function (item) {
    //        return $T.dataValues[item];
    //    },
    //    LoadForm: function (context, title, templateUrl, bodyClass, options, data) {
    //        var isModal = options.ClientAction.IsModal;
    //        var isResizable = options.ClientAction.IsResizable;
    //        var formTemplate = isModal ? "template/form/modalform" : "template/form/form";
    //        return $.when(
    //            $U.AjaxGet({ url: formTemplate }),
    //            $U.AjaxGet({ url: templateUrl })
    //            ).then(function (mf, tmpl) {
    //                $T.initialise2();
    //                $T.context = context;
    //                $T.options = options;
    //                $T.isModal = isModal;
    //                $T.isResizable = isResizable;
    //                var formData = { Title: title, BodyClasses: bodyClass };
    //                $.extend(formData, options.ClientAction);
    //                if (typeof data !== "undefined" && data !== null) {
    //                    $.extend(formData, data);
    //                }
    //                $T.form = $T.createForm(mf[0].Template, tmpl[0].Template, formData);
    //            });
    //    },
    //    Show: function () {
    //        if ($T.isModal) {
    //            $T.form.modal({
    //                backdrop: 'static',
    //                keyboard: false
    //            });
    //            if ($T.isResizable) {
    //                $T.addResizability();
    //            }
    //        } else {
    //            $("#form .modeless").removeClass('hide');
    //        }
    //    },
    //    Validate: function (ctx, formitem, data, validations) {
    //        var deferred = new $.Deferred();
    //        var message = formitem.find(".message");
    //        message.html("");
    //        $T.errors = [];
    //        var funcs = [];
    //        $.each(validations, function (i, validation) {
    //            funcs.push(validation.validator(ctx, data, formitem, validation.message));
    //        });
    //        $.when.apply($, funcs).done(function (args) {
    //            formitem.attr("data-state", "valid");
    //            deferred.resolve(true);
    //            //$U.Debug("success pause");
    //        }).fail(function (argsa, argsb, argsc) {
    //            formitem.attr("data-state", "error");
    //            deferred.reject(false);
    //            //$U.Debug("fail pause");
    //            var text = "";
    //            $.each($T.errors, function (index, message) {
    //                if (index > 0) {
    //                    message = ". " + message;
    //                }
    //                text += message;
    //            });
    //            message.html(text);
    //        });
    //        return deferred.promise();
    //    },
    //    //
    //    findFormItem: function (form, item) {
    //        var itemSelector = $U.Format("*[data-item='{0}']", item);
    //        return form.find(itemSelector).closest("[data-property]");
    //    },
    //    createForm: function (formTemplate, bodyTemplate, data) {
    //        var formElement = $(Mustache.to_html(formTemplate, data));
    //        var templateContent = $(Mustache.to_html(bodyTemplate, data));
    //        var bodyHtml = templateContent.find(".dialog-body").html();
    //        if ($T.isModal) {
    //            formElement.find(".modal-body").html(bodyHtml);
    //            var footerHtml = templateContent.find(".dialog-footer").html();
    //            formElement.find(".modal-footer").html(footerHtml);
    //            //$("#form").empty().append(formElement);
    //            formElement.on("hidden.bs.modal", function (e) {
    //                formElement.off();
    //                $("#form").empty();
    //            });

    //        } else {
    //            formElement.find(".modeless-body form").html(bodyHtml);
    //        }
    //        $("#form").empty().append(formElement);
    //        return formElement;
    //    },
    //    leaveFocus: function (formitem, item) {
    //        var data = $T.dataValues[item];
    //        var validations = $T.validationFunctions[item];
    //        if (typeof validations !== "undefined" && validations !== null) {
    //            $.when($F.Validate($T.context, formitem, data, validations)
    //                ).then(function () {
    //                    var errors = $T.form.find("*[data-property][data-state='error']").length;
    //                    var totalWithState = $T.form.find("*[data-property][data-state]").length;
    //                    var total = $T.form.find("*[data-property]").length;
    //                    if ($T.afterItemValidation !== null) {
    //                        $T.afterItemValidation($T.context, item, total, totalWithState, errors);
    //                    }
    //                });
    //        }
    //    },
    //    validateIsRequired: function (ctx, val, formItem, errorMessage) {
    //        return $T.ApplyValidation(formItem, function () {
    //            return !(val === null || val === "");
    //        }, errorMessage);
    //    },
    //    removeResizability: function () {
    //        var f = $($T.form);
    //        var resizeGrip = f.find(".resize-grip");
    //        var modalHeader = f.find(".modal-header");
    //        var modalDialog = f.find(".modal-dialog");
    //        var modalBody = f.find(".modal-body");
    //        resizeGrip.addClass("hidden");
    //        modalHeader.css({ "cursor": "default" });
    //        resizeGrip.css({ "cursor": "default" });
    //        resizeGrip.off(".forms");
    //        modalHeader.off(".forms");
    //        $(window).off(".forms");
    //    },
    //    addResizability: function () {
    //        // this also makes the form movable
    //        var f = $($T.form);
    //        var resizeGrip = f.find(".resize-grip");
    //        var modalHeader = f.find(".modal-header");
    //        var modalDialog = f.find(".modal-dialog");
    //        var modalBody = f.find(".modal-body");
    //        var grabStartInfo = function (e) {
    //            $T.rm.sp.x = e.pageX;
    //            $T.rm.sp.y = e.pageY;
    //            $T.rm.sm.l = parseInt(modalDialog.css("margin-left"));
    //            $T.rm.sm.t = parseInt(modalDialog.css("margin-top"));
    //            $T.rm.sm.r = parseInt(modalDialog.css("margin-right"));
    //            $T.rm.sm.b = parseInt(modalDialog.css("margin-bottom"));
    //        }
    //        resizeGrip.removeClass("hidden");
    //        modalHeader.css({ "cursor": "move" });
    //        resizeGrip.css({ "cursor": "nwse-resize" });
    //        resizeGrip.on("mousedown.forms", function (e) {
    //            e.preventDefault();
    //            e.stopPropagation();
    //            $T.rm.resizing = true;
    //            grabStartInfo(e);
    //            $T.rm.ss.h = modalBody.height();
    //            $T.rm.ss.w = modalDialog.width();
    //            $(window).on("mousemove.formsdynamic", function (e) {
    //                if ($T.rm.resizing) {
    //                    var xoffset = e.pageX - $T.rm.sp.x;
    //                    var yoffset = e.pageY - $T.rm.sp.y;
    //                    if (xoffset !== 0 || yoffset !== 0) {
    //                        var changes = {
    //                            height: $T.rm.ss.h + yoffset,
    //                            width: $T.rm.ss.w + xoffset,
    //                            marginRight: $T.rm.sm.r - xoffset,
    //                            marginBottom: $T.rm.sm.b - yoffset
    //                        };
    //                        if (changes.marginRight < 0) {
    //                            changes.marginRight = 0;
    //                        }
    //                        //$U.Debug("rs({3}, {4}): ({0}, {1}), mr: {2}", changes.width, changes.height, changes.marginRight, xoffset, yoffset);
    //                        modalDialog.css("margin-right", changes.marginRight + "px");
    //                        modalBody.height(changes.height);
    //                        modalDialog.width(changes.width);
    //                    }
    //                }
    //            });
    //        });
    //        modalHeader.on("mousedown.forms", function (e) {
    //            $T.rm.moving = true;
    //            grabStartInfo(e);
    //            $(window).on("mousemove.formsdynamic", function (e) {
    //                if ($T.rm.moving) {
    //                    var xoffset = e.pageX - $T.rm.sp.x;
    //                    var yoffset = e.pageY - $T.rm.sp.y;
    //                    var margin = {
    //                        left: $T.rm.sm.l + xoffset,
    //                        top: $T.rm.sm.t + yoffset,
    //                        right: $T.rm.sm.r - xoffset,
    //                        bottom: $T.rm.sm.b - yoffset
    //                    };
    //                    if (margin.top < 0) {
    //                        margin.top = 0;
    //                    }
    //                    modalDialog.css("margin-left", margin.left + "px");
    //                    modalDialog.css("margin-right", margin.right + "px");
    //                    modalDialog.css("margin-top", margin.top + "px");
    //                    //$T.debugDynamicForm("MM", { margin: margin, xoffset: xoffset, yoffset: yoffset });
    //                }
    //            })

    //        });
    //        $(window).on("mouseup.forms", function (e) {
    //            $T.rm.moving = false;
    //            $T.rm.resizing = false;
    //            //$T.debugDynamicForm("MU");
    //            $(window).off(".formsdynamic");
    //        });
    //    }
    //};



    $(function () {
        $T = this;
        $U = $.fastnet$utilities;
        //$.fastnet$forms.init();
    });
})(jQuery);