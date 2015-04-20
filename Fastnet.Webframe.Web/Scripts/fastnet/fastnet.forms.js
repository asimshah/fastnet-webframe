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
"    <div class='modal-dialog container-fluid'>" +
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
        var tu = templateUrl;
        var formElement = null;
        var dfd = null;
        var fillData = null;
        var pendingSetEnableds = [];
        //var form = null;
        this.options = $.extend({
            Container: ".forms-container",
            Id: $U.Format("fn-{0}", formCount++),
            IsModal: true,
            IsResizable: false,
            BodyClasses: "",
            Title: "Form Title",
            OnCommand: null,
        }, options);
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
        $.fastnet$form.prototype.addValidation = function(dataItem, validationFunction, errorMessage) {
            if (typeof validationFunctions[dataItem] === "undefined" || validationFunctions[dataItem] === null) {
                validationFunctions[dataItem] = [];
            }
            validationFunctions[dataItem].push({ validator: validationFunction, message: errorMessage });
        };
        $.fastnet$form.prototype.addIsRequiredValidator = function (dataItem) {
            self.addValidation(dataItem, function (form, data) {
                return !(data === null || data === "");
            }, "This field is required");
        };

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
            function _validateItem(dataItem) {
                var validations = validationFunctions[dataItem];
                if (typeof validations !== "undefined" && validations !== null) {
                    function applyValidation(isValid, errorMessage) {
                        if (isValid(self, itemData)) {
                            return true;
                        } else {
                            errors.push(errorMessage);
                            return false;
                        }
                    }
                    var deferred = new $.Deferred();
                    var errors = [];
                    var funcs = [];
                    var itemData = _getItemData(dataItem);
                    $.each(validations, function (i, validation) {
                        funcs.push(applyValidation(validation.validator, validation.message));
                    });
                    $.when.apply($, funcs).then(function (args) {
                        if (args === true) {
                            deferred.resolve(true);
                        } else {
                            var text = "";
                            $.each(errors, function (index, message) {
                                if (index > 0) {
                                    message = ". " + message;
                                }
                                text += message;
                            });
                            $("[data-item='" + dataItem + "']").closest("[data-property]").find(".message").html(text);
                            deferred.reject(false);
                        }
                    });
                    //$.when($F.Validate($T.context, formitem, data, validations)
                    //    ).then(function () {
                    //        var errors = $T.form.find("*[data-property][data-state='error']").length;
                    //        var totalWithState = $T.form.find("*[data-property][data-state]").length;
                    //        var total = $T.form.find("*[data-property]").length;
                    //        if ($T.afterItemValidation !== null) {
                    //            $T.afterItemValidation($T.context, item, total, totalWithState, errors);
                    //        }
                    //    });
                }
            };
            function _getItemData(dataItem) {
                // assume val() will do it all for now
                return $("[data-item='" + dataItem + "']").val();
            }
            function _bindLeaveFocus() {
                var lfSelector = "input[type=text], input[type=password], input[type=email]";
                formElement.find(lfSelector).on("blur", function (e) {
                    var item = $(this).attr("data-item");
                    $.when(_validateItem(item)).then(function () {
                    });
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
                formElement.on("hidden.bs.modal", function (e) {
                    $U.Debug("form {0} closed", self.options.Id);
                    _close();
                });
                formElement.find("button, input[type=button]").on("click", function (e) {
                    var cmd = $(this).attr("data-cmd");
                    if (cmd === "cancel") {
                        $(id).modal('hide');
                    }
                    e.preventDefault();
                    _onCommand(cmd);
                });
            }
            function _close() {
                var id = "#" + self.options.Id;
                $(id).off();
                $(id).remove();
            }
            function _show(onload) {
                var container = self.options.Container;
                var id = "#" + self.options.Id;
                $(container).find(id).remove();
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
                }
                if ($.isFunction(onload)) {
                    onload(self);
                }
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
        function _load  () {
            return $.when(
                 $U.AjaxGet({ url: tu })
                ).then(function (r) {
                    //var bodyTemplate = $(r.Template).find(".body");
                    var formBody = $(r.Template).find(".form-body");
                    var formFooter = $(r.Template).find(".form-footer");
                    var data = $.extend({
                        BodyHtml: formBody[0].outerHTML,
                        FooterHtml: formFooter[0].outerHTML
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
                });
        }
    };

    $.fastnet$forms = {
        NewForm: function (templateUrl, options) {
            var f = new form(templateUrl, options);
            f.Load();
            return f;
        },
        context: null,
        errors: null,
        form: null,
        isModal: null,
        isResizable: null,
        options: null,
        dataValues: {},
        validationFunctions: {},
        afterItemValidation: null,
        onCommand: null,
        rm: {
            resizing: false, moving: false,
            sp: { x: 0, y: 0 }, // sp = start position
            sm: { l: 0, t: 0, r: 0, b: 0 }, // sm = start margin
            ss: { w: 0, h: 0 }, // ss = start size
        }, // rm == resizability and movement
        init: function () {
            $T = this;
            $U = $.fastnet$utilities;
        },
        Initialise: function (ctx, form, options) {
            $T.isModal = null;
            $T.options = options;
            $T.context = ctx;
            $T.form = form;
            $T.errors = null;
            $T.validationFunctions = {};
            $T.dataValues = {};
            $T.afterItemValidation = null;
        },
        initialise2: function (ctx, form, options) {
            $T.isModal = null;
            $T.options = options;
            $T.context = ctx;
            $T.form = form;
            $T.errors = null;
            $T.validationFunctions = {};
            $T.dataValues = {};
            $T.afterItemValidation = null;
        },
        AddValidation: function (dataItem, validationFunction, errorMessage) {
            if (typeof $T.validationFunctions[dataItem] === "undefined" || $T.validationFunctions[dataItem] === null) {
                $T.validationFunctions[dataItem] = [];
            }
            $T.validationFunctions[dataItem].push({ validator: validationFunction, message: errorMessage });
        },
        AddIsRequiredValidation: function (dataItem, errorMessage) {
            $T.AddValidation(dataItem, $T.validateIsRequired, errorMessage);
        },
        ApplyValidation: function (formItem, isValid, errorMessage) {
            var message = formItem.find(".message");
            var deferred = new $.Deferred();
            if ($.isFunction(isValid)) {
                if (isValid()) {
                    deferred.resolve(true);
                } else {
                    $U.Debug(errorMessage);
                    $T.errors.push(errorMessage);
                    deferred.reject(false);
                }
                return deferred.promise();
            }
            else {
                $U.MessageBox("System error: incorrect validator call");
                return null;
            }
        },
        Bind: function (handlers) {
            var form = $T.form;
            var ctx = $T.context;
            $T.afterItemValidation = handlers.afterItemValidation;
            $T.onCommand = handlers.onCommand;
            form.find("input[type=text], input[type=password], input[type=email]").on("input", function (e) {
                var item = $(this).attr("data-item");
                var value = $(this).val();
                if (typeof value === 'string') {
                    value = value.trim();
                }
                var formItem = $T.findFormItem(form, item);
                formItem.find(".message").html("");
                $T.dataValues[item] = value;
            });
            form.find("input[type=text], input[type=password], input[type=email]").on("blur", function (e) {
                var item = $(this).attr("data-item");
                var formItem = $T.findFormItem(form, item);
                $T.leaveFocus(formItem, item);
            });
            if (typeof $T.options.Features != "undefined" && $T.options.Features.DateCapture) {
                form.find(".date[data-type='date']")
                    .datetimepicker({ format: 'DDMMMYYYY' })
                    .on('dp.change', function (e) {
                        var item = $(this).find("input").attr('data-item');
                        var value = e.date;
                        var formItem = $T.findFormItem(form, item);
                        formItem.find(".message").html("");
                        $T.dataValues[item] = value;
                    });
            }
            form.find("button, input[type=button]").on("click", function (e) {
                var cmd = $(this).attr("data-cmd");
                if (cmd === "cancel") {
                    form.modal('hide');
                }
                e.preventDefault();
                if ($T.onCommand !== null) {
                    $T.onCommand($T.context, cmd);
                }
            });
        },
        Block: function () {
            $(".modal-dialog .block-outer").removeClass("hidden");
        },
        UnBlock: function () {
            $(".modal-dialog .block-outer").addClass("hidden");
        },
        Close: function () {
            if ($T.isModal) {
                $T.form.modal('hide');
                if ($T.isResizable) {
                    $T.removeResizability();
                }
            } else {
                $("#form").off();
                $("#form .modeless").addClass('hide');//.empty();
                $("#form .modeless-body form").empty();
            }

        },
        DisableCommand: function (command) {
            var selector = $U.Format("button[data-cmd='{0}'], input[type=button][data-cmd='{0}']", command);
            $T.form.find(selector).each(function () {
                $U.SetEnabled(this, false);
            });
        },
        EnableCommand: function (command) {
            var selector = $U.Format("button[data-cmd='{0}'], input[type=button][data-cmd='{0}']", command);
            $T.form.find(selector).each(function () {
                $U.SetEnabled(this, true);
            });
        },
        GetForm: function () {
            return $T.form;
        },
        GetFormData: function (item) {
            return $T.dataValues[item];
        },
        LoadForm: function (context, title, templateUrl, bodyClass, options, data) {
            var isModal = options.ClientAction.IsModal;
            var isResizable = options.ClientAction.IsResizable;
            var formTemplate = isModal ? "template/form/modalform" : "template/form/form";
            return $.when(
                $U.AjaxGet({ url: formTemplate }),
                $U.AjaxGet({ url: templateUrl })
                ).then(function (mf, tmpl) {
                    $T.initialise2();
                    $T.context = context;
                    $T.options = options;
                    $T.isModal = isModal;
                    $T.isResizable = isResizable;
                    var formData = { Title: title, BodyClasses: bodyClass };
                    $.extend(formData, options.ClientAction);
                    if (typeof data !== "undefined" && data !== null) {
                        $.extend(formData, data);
                    }
                    $T.form = $T.createForm(mf[0].Template, tmpl[0].Template, formData);
                });
        },
        Show: function () {
            if ($T.isModal) {
                $T.form.modal({
                    backdrop: 'static',
                    keyboard: false
                });
                if ($T.isResizable) {
                    $T.addResizability();
                }
            } else {
                $("#form .modeless").removeClass('hide');
            }
        },
        Validate: function (ctx, formitem, data, validations) {
            var deferred = new $.Deferred();
            var message = formitem.find(".message");
            message.html("");
            $T.errors = [];
            var funcs = [];
            $.each(validations, function (i, validation) {
                funcs.push(validation.validator(ctx, data, formitem, validation.message));
            });
            $.when.apply($, funcs).done(function (args) {
                formitem.attr("data-state", "valid");
                deferred.resolve(true);
                //$U.Debug("success pause");
            }).fail(function (argsa, argsb, argsc) {
                formitem.attr("data-state", "error");
                deferred.reject(false);
                //$U.Debug("fail pause");
                var text = "";
                $.each($T.errors, function (index, message) {
                    if (index > 0) {
                        message = ". " + message;
                    }
                    text += message;
                });
                message.html(text);
            });
            return deferred.promise();
        },
        //
        findFormItem: function (form, item) {
            var itemSelector = $U.Format("*[data-item='{0}']", item);
            return form.find(itemSelector).closest("[data-property]");
        },
        createForm: function (formTemplate, bodyTemplate, data) {
            var formElement = $(Mustache.to_html(formTemplate, data));
            var templateContent = $(Mustache.to_html(bodyTemplate, data));
            var bodyHtml = templateContent.find(".dialog-body").html();
            if ($T.isModal) {
                formElement.find(".modal-body").html(bodyHtml);
                var footerHtml = templateContent.find(".dialog-footer").html();
                formElement.find(".modal-footer").html(footerHtml);
                //$("#form").empty().append(formElement);
                formElement.on("hidden.bs.modal", function (e) {
                    formElement.off();
                    $("#form").empty();
                });

            } else {
                formElement.find(".modeless-body form").html(bodyHtml);
            }
            $("#form").empty().append(formElement);
            return formElement;
        },
        leaveFocus: function (formitem, item) {
            var data = $T.dataValues[item];
            var validations = $T.validationFunctions[item];
            if (typeof validations !== "undefined" && validations !== null) {
                $.when($F.Validate($T.context, formitem, data, validations)
                    ).then(function () {
                        var errors = $T.form.find("*[data-property][data-state='error']").length;
                        var totalWithState = $T.form.find("*[data-property][data-state]").length;
                        var total = $T.form.find("*[data-property]").length;
                        if ($T.afterItemValidation !== null) {
                            $T.afterItemValidation($T.context, item, total, totalWithState, errors);
                        }
                    });
            }
        },
        validateIsRequired: function (ctx, val, formItem, errorMessage) {
            return $T.ApplyValidation(formItem, function () {
                return !(val === null || val === "");
            }, errorMessage);
        },
        removeResizability: function () {
            var f = $($T.form);
            var resizeGrip = f.find(".resize-grip");
            var modalHeader = f.find(".modal-header");
            var modalDialog = f.find(".modal-dialog");
            var modalBody = f.find(".modal-body");
            resizeGrip.addClass("hidden");
            modalHeader.css({ "cursor": "default" });
            resizeGrip.css({ "cursor": "default" });
            resizeGrip.off(".forms");
            modalHeader.off(".forms");
            $(window).off(".forms");
        },
        addResizability: function () {
            // this also makes the form movable
            var f = $($T.form);
            var resizeGrip = f.find(".resize-grip");
            var modalHeader = f.find(".modal-header");
            var modalDialog = f.find(".modal-dialog");
            var modalBody = f.find(".modal-body");
            var grabStartInfo = function (e) {
                $T.rm.sp.x = e.pageX;
                $T.rm.sp.y = e.pageY;
                $T.rm.sm.l = parseInt(modalDialog.css("margin-left"));
                $T.rm.sm.t = parseInt(modalDialog.css("margin-top"));
                $T.rm.sm.r = parseInt(modalDialog.css("margin-right"));
                $T.rm.sm.b = parseInt(modalDialog.css("margin-bottom"));
            }
            resizeGrip.removeClass("hidden");
            modalHeader.css({ "cursor": "move" });
            resizeGrip.css({ "cursor": "nwse-resize" });
            resizeGrip.on("mousedown.forms", function (e) {
                e.preventDefault();
                e.stopPropagation();
                $T.rm.resizing = true;
                grabStartInfo(e);
                $T.rm.ss.h = modalBody.height();
                $T.rm.ss.w = modalDialog.width();
                $(window).on("mousemove.formsdynamic", function (e) {
                    if ($T.rm.resizing) {
                        var xoffset = e.pageX - $T.rm.sp.x;
                        var yoffset = e.pageY - $T.rm.sp.y;
                        if (xoffset !== 0 || yoffset !== 0) {
                            var changes = {
                                height: $T.rm.ss.h + yoffset,
                                width: $T.rm.ss.w + xoffset,
                                marginRight: $T.rm.sm.r - xoffset,
                                marginBottom: $T.rm.sm.b - yoffset
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
                $T.rm.moving = true;
                grabStartInfo(e);
                $(window).on("mousemove.formsdynamic", function (e) {
                    if ($T.rm.moving) {
                        var xoffset = e.pageX - $T.rm.sp.x;
                        var yoffset = e.pageY - $T.rm.sp.y;
                        var margin = {
                            left: $T.rm.sm.l + xoffset,
                            top: $T.rm.sm.t + yoffset,
                            right: $T.rm.sm.r - xoffset,
                            bottom: $T.rm.sm.b - yoffset
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
                $T.rm.moving = false;
                $T.rm.resizing = false;
                //$T.debugDynamicForm("MU");
                $(window).off(".formsdynamic");
            });
        }
    };



    $(function () {
        $T = this;
        $U = $.fastnet$utilities;
        $.fastnet$forms.init();
    });
})(jQuery);