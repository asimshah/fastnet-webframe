/// <reference path="../../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../../scripts/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../../../../scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../../../../scripts/typings/knockout.mapping/knockout.mapping.d.ts" />
/// <reference path="../../../../scripts/typings/jquery.blockui/jquery.blockui.d.ts" />
/// <reference path="../../../../scripts/typings/knockout.validation/knockout.validation.modified.d.ts" />
var fastnet;
(function (fastnet) {
    var forms;
    (function (forms) {
        var debug = fastnet.util.debug;
        var str = fastnet.util.str;
        var h$ = fastnet.util.helper;
        var validations = (function () {
            function validations() {
            }
            validations.GetValidators = function () {
                var rules = [];
                // rules.push({ name: "emailInUse", async: true, validator: validations.emailInUse, message: "This email address not found" });
                rules.push({ name: "passwordComplexity", async: false, validator: validations.passwordComplexity, message: "Use at least one each of a digit, a non-alphanumeric and a lower and an upper case letter" });
                rules.push({ name: "phoneNumber", async: false, validator: validations.phoneNumber, message: "Use all digits and spaces with an optional leading +" });
                rules.push({ name: "isChecked", async: false, validator: validations.isChecked, message: "Box must be checked" });
                return rules;
            };
            validations.isChecked = function (val, params) {
                return val === true;
            };
            validations.phoneNumber = function (val, params) {
                var pattern = /^[+0-9][0-9]*$/;
                return ko.validation.rules.pattern.validator(val, pattern);
            };
            validations.passwordComplexity = function (val, params) {
                var pattern = /(?=^.{8,}$)(?=.*\d)(?=.*[$-/:-?{-~!"^_`\[\]\\])(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
                return ko.validation.rules.pattern.validator(val, pattern);
            };
            return validations;
        })();
        forms.validations = validations;
        /**
         * data returned to a CommandCallback.
         * models.current is the data current in the form
         * models.original is the data as it was originally
         */
        var model = (function () {
            function model() {
            }
            model.prototype.setFromJSON = function (data) {
                $.extend(this, data);
            };
            model.prototype.getObservable = function () {
                return null;
            };
            return model;
        })();
        forms.model = model;
        var models = (function () {
            function models() {
            }
            return models;
        })();
        forms.models = models;
        /**
         * base class for a data class to be used with a form
         * current version uses knockout
         */
        var viewModel = (function () {
            function viewModel() {
                this.message = ko.observable("");
                this.okEnabled = ko.observable(true);
                this.cancelEnabled = ko.observable(true);
            }
            /**
             * populate this object from a javascript object
             * like { alpha: "hello", beta: "world" }
             */
            viewModel.prototype.fromJSObject = function (data) {
                $.extend(this, data);
            };
            return viewModel;
        })();
        forms.viewModel = viewModel;
        /**
         * creates a new form
         */
        var form = (function () {
            function form(ctx, opts, model, contentHtml) {
                var _this = this;
                this.contentHtml = null;
                this.model = null;
                this.knockoutIsBound = false;
                // ctx will be passed through to the CommandCallback
                if (!form.systemInitialised) {
                    throw new Error("forms system not initialised: call  to form.initialise() missing?");
                }
                this.ctx = ctx;
                this.model = model;
                this.unwrappedOriginal = ko.toJS(this.model);
                this.buttons = [];
                this.options = {
                    modal: false,
                    title: "title required",
                    modelessContainer: null,
                    hideSystemCloseButton: false,
                    okButton: { text: "OK", command: "ok-command", position: 0 /* right */, dataBinding: "enable: okEnabled" },
                    cancelButton: { text: "Close", command: "cancel-command", position: 0 /* right */, dataBinding: "enable: cancelEnabled" },
                    messageClass: "message-block"
                };
                if (this.options.modal === true) {
                    this.options.cancelButton.text = "Cancel";
                }
                this.contentHtml = contentHtml;
                $.extend(true, this.options, opts);
                this.options.modelessContainer = (this.options.modelessContainer || form.config.modelessContainer);
                if (!this.validateOptions()) {
                    debug.print("form options are invalid");
                }
                this.formId = "ff-" + form.formCount++;
                if (this.options.okButton !== null && !h$.isNullOrUndefined(this.options.okButtonText)) {
                    this.options.okButton.text = this.options.okButtonText;
                }
                if (this.options.cancelButton !== null && !h$.isNullOrUndefined(this.options.cancelButtonText)) {
                    this.options.cancelButton.text = this.options.cancelButtonText;
                }
                if (this.options.cancelButton != null) {
                    this.buttons.push(this.options.cancelButton);
                }
                if (this.options.okButton != null) {
                    this.buttons.push(this.options.okButton);
                }
                $.each((this.options.additionalButtons || []), function (i, b) {
                    _this.buttons.push(b);
                });
            }
            form.addValidations = function (rules) {
                $.each(rules, function (i, rule) {
                    if (rule.async) {
                        ko.validation.rules[rule.name] = {
                            message: rule.message, async: true, validator: function (val, params, callback) {
                                form.incrementAsyncValidatorCount();
                                rule.validator(val, params, function (r) {
                                    callback(r);
                                    form.decrementAsyncValidatorCount();
                                });
                            }
                        };
                    }
                    else {
                        ko.validation.rules[rule.name] = {
                            message: rule.message,
                            validator: rule.validator
                        };
                    }
                });
            };
            form.initialise = function (config) {
                var defaultConfig = {
                    modelessContainer: "forms-container"
                };
                form.config = $.extend(defaultConfig, (config || {}));
                if (!form.systemInitialised) {
                    form.addMomentBinding();
                    ko.validation.init({
                        errorsAsTitle: false,
                        insertMessages: false,
                        decorateElement: true,
                        errorElementClass: 'validation-error',
                    });
                    var rules = validations.GetValidators();
                    this.addValidations(rules);
                    if (form.config.additionalValidations) {
                        this.addValidations(form.config.additionalValidations);
                    }
                    ko.validation.registerExtenders();
                    debug.print("ko.validation initialised");
                    form.systemInitialised = true;
                }
            };
            form.addMomentBinding = function () {
                ko.bindingHandlers["stdDateFormat"] = {
                    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                        var val = valueAccessor();
                        var formatted = ""; // throw instead?
                        var date = moment(ko.utils.unwrapObservable(val));
                        //var format = allBindingsAccessor().format || 'MM/DD/YYYY';
                        var format = allBindingsAccessor().format || 'DDMMMYYYY';
                        if (date && date.isValid()) {
                            formatted = date.format(format);
                        }
                        if (element.tagName === "INPUT") {
                            $(element).val(formatted);
                        }
                        else {
                            element.innerText = formatted;
                        }
                    }
                };
            };
            form.incrementAsyncValidatorCount = function () {
                form.asyncValCounter++;
                var cf = form.formStack.peek();
                if (form.asyncValCounter === 1 && !h$.isNullOrUndefined(cf)) {
                    cf.block();
                }
            };
            form.decrementAsyncValidatorCount = function () {
                form.asyncValCounter--;
                var cf = form.formStack.peek();
                if (form.asyncValCounter === 0 && !h$.isNullOrUndefined(cf)) {
                    cf.unBlock();
                }
            };
            form.prototype.setContentHtml = function (html) {
                this.contentHtml = html;
            };
            form.prototype.close = function () {
                form.formStack.pop();
                this.unbindKnockout();
                if (this.options.modal) {
                    $("#" + this.formId).off().dialog("close");
                }
                else {
                    $("#" + this.formId).off().closest(".ui-form").remove();
                }
            };
            form.prototype.open = function (onCommand) {
                var deferred = $.Deferred();
                form.formStack.push(this);
                this.commandCallback = onCommand;
                if (this.options.modal) {
                    this.openModal();
                }
                else {
                    this.openModeless();
                }
                deferred.resolve(this);
                return deferred.promise(this);
            };
            form.prototype.disableCommand = function (cmd) {
                var f = this.getRoot(); // this.options.modal ? $(`#${this.formId}`).closest(".ui-dialog") : $(`#${this.formId}`);
                var buttons = "button[data-cmd='" + cmd + "'], input[type=button][data-cmd='" + cmd + "']";
                $(f).find(buttons).prop("disabled", true);
            };
            form.prototype.enableCommand = function (cmd) {
                var f = this.getRoot();
                var buttons = "button[data-cmd='" + cmd + "'], input[type=button][data-cmd='" + cmd + "']";
                $(f).find(buttons).prop("disabled", false);
            };
            form.prototype.isValid = function () {
                if (this.model !== null) {
                    var result = this.observableModel.isValid() && form.asyncValCounter === 0;
                    if (!result) {
                        this.observableModel.errors.showAllMessages();
                    }
                    return result;
                }
                else {
                    return true;
                }
            };
            form.prototype.find = function (selector) {
                return $(this.rootElement).find(selector);
            };
            form.prototype.setMessage = function (text) {
                if (!h$.isNullOrUndefined(this.observableModel)) {
                    this.observableModel().message(text);
                }
                //$(this.rootElement).find(`.${this.options.messageClass}`).html(text);
            };
            form.prototype.getBlockRoot = function () {
                return this.options.modal ? $(this.rootElement) : $(this.rootElement).closest(".ui-form").parent(); //.parent();
            };
            form.prototype.block = function () {
                if (this.options.modal) {
                    var blockRoot = this.getBlockRoot(); // this.options.modal ? this.rootElement : $(this.rootElement).closest(".ui-form");
                    $(blockRoot).block({
                        message: '<i class="fa fa-gear fa-spin fa-3x"></i>',
                        overlayCSS: { backgroundColor: '#3399ff', cursor: 'none' },
                        css: { backgroundColor: 'transparent', border: 'none', color: '#ffffff' }
                    });
                }
                else {
                    this.modelessBlock();
                }
            };
            form.prototype.unBlock = function () {
                if (this.options.modal) {
                    var blockRoot = this.getBlockRoot();
                    $(blockRoot).unblock();
                }
                else {
                    this.modelessUnblock();
                }
            };
            form.prototype.modelessUnblock = function () {
                var uiForm = this.getRoot().closest(".ui-form");
                uiForm.find(".modeless-block").remove();
            };
            form.prototype.modelessBlock = function () {
                var uiForm = this.getRoot().closest(".ui-form");
                var blockHtml = "<div class='modeless-block' style=\"width:100%; height: 100%;position:absolute;left:0;top:0;z-index:1000;\">\n                        <div class='indicator'><i class=\"fa fa-gear fa-spin fa-3x\"></i></div>\n                    </div>";
                uiForm.append($(blockHtml));
            };
            form.prototype.getRoot = function () {
                return this.options.modal ? $("#" + this.formId).closest(".ui-dialog") : $("#" + this.formId);
            };
            form.prototype.prepareButtons = function () {
                var _this = this;
                var buttons = [];
                $.each(this.buttons, function (i, item) {
                    var b = {
                        text: item.text,
                        "data-cmd": item.command,
                        click: function (e) {
                            _this.setMessage('');
                            //var cmd = $(e.target).attr("data-cmd");
                            var cmd = $(e.currentTarget).attr("data-cmd");
                            e.stopPropagation();
                            e.preventDefault();
                            _this.onCommand(cmd);
                        },
                        "class": ""
                    };
                    if (!h$.isNullOrUndefined(item.dataBinding)) {
                        b["data-bind"] = item.dataBinding;
                    }
                    if (!h$.isNullOrUndefined(item.classList) && item.classList.length > 0) {
                        b["class"] = item.classList.join(" ");
                    }
                    if (item.position === 0 /* right */) {
                        b["class"] += " pull-right";
                    }
                    if (item.position === 1 /* left */) {
                        b["class"] += " pull-left";
                    }
                    buttons.push(b);
                });
                return buttons;
            };
            form.prototype.prepareFormRoot = function () {
                return $("<div></div>").attr("id", this.formId).append($(this.contentHtml));
            };
            form.prototype.finalise = function () {
                this.rootElement = this.getRoot().get(0);
                this.bindEmbeddedButtons();
                this.attachDatePickers();
                if (this.model !== null) {
                    this.knockoutIsBound = true;
                    this.updateElementAttributes();
                    this.observableModel = ko.validatedObservable(this.model);
                    ko.applyBindings(this.observableModel, this.rootElement);
                }
                var focusableElements = "input:not([type='checkbox']):not([type='button']):not([type='date']):not([data-input='date'])";
                $(this.rootElement).find(focusableElements).each(function (i, c) {
                    var v = $(c).val().trim();
                    if (v === null || v === "") {
                        $(c).focus();
                        return false;
                    }
                });
            };
            form.prototype.openModal = function () {
                var _this = this;
                var buttons = this.prepareButtons();
                var root = this.prepareFormRoot();
                var dg = $(root).dialog({
                    width: this.options.initialWidth,
                    buttons: buttons,
                    autoOpen: false,
                    modal: true,
                    title: this.options.title,
                    position: { my: "top", at: "top+10%" },
                    create: function (event, ui) {
                        var ui_dialog = $("#" + _this.formId).closest(".ui-dialog");
                        _this.styleModalForm(ui_dialog);
                    },
                    open: function (event, ui) {
                        var ui_dialog = $("#" + _this.formId).closest(".ui-dialog");
                        _this.onModalDialogOpen(ui_dialog);
                    },
                    close: function (event, ui) {
                        var closedUsingSystemButton = $(event.currentTarget).hasClass("ui-dialog-titlebar-close");
                        _this.onModalClosed(closedUsingSystemButton);
                    }
                });
                $(root).dialog("open");
                this.finalise();
            };
            form.prototype.openModeless = function () {
                var _this = this;
                var buttons = this.prepareButtons();
                var formTemplate = $(form.modelessFormTemplate);
                this.styleModelessForm(formTemplate);
                formTemplate.find(".ui-form-title").html(this.options.title);
                $.each(buttons, function (i, b) {
                    var buttonHtml = str.format("<button class='btn ui-form-button {2}' data-cmd='{1}'>{0}</button>", b.text, b["data-cmd"], b.class);
                    $(formTemplate).find(".ui-form-buttonset").append($(buttonHtml));
                });
                $(formTemplate).find(".ui-form-buttonset button").click(function (e) {
                    //var cmd = $(e.target).attr("data-cmd");
                    var cmd = $(e.currentTarget).attr("data-cmd");
                    e.stopPropagation();
                    e.preventDefault();
                    _this.onCommand(cmd);
                });
                var formHtml = this.prepareFormRoot();
                formTemplate.find(".ui-form-content").append(formHtml);
                $("." + this.options.modelessContainer).empty().append(formTemplate);
                this.finalise();
            };
            form.prototype.validateOptions = function () {
                return true; // this.options.container !== null;
            };
            form.prototype.unbindKnockout = function () {
                if (this.knockoutIsBound) {
                    ko.cleanNode(this.rootElement);
                    this.knockoutIsBound = false;
                }
            };
            form.prototype.onModalClosed = function (closedUsingSystemButton) {
                var wns = "resize.forms-" + this.formId;
                $(window).off(wns);
                var d = $("#" + this.formId).data("ui-dialog");
                d.destroy();
                if (closedUsingSystemButton) {
                    this.unbindKnockout();
                    var cmd = "system-close";
                    this.onCommand(cmd);
                }
            };
            // ui_dialog must be the ".ui-dialog" tagged element of a jQuery-ui dialog widget
            // call this method in the create call of a jQuery-ui dialog widget
            form.prototype.onModalDialogOpen = function (ui_dialog) {
                var _this = this;
                if (this.options.hideSystemCloseButton) {
                    ui_dialog.find(".ui-dialog-titlebar-close").hide();
                }
                this.modalPosition = {
                    openingHeight: ui_dialog.outerHeight(),
                    openingWidth: ui_dialog.outerWidth(),
                    windowWidth: $(window).width()
                };
                var w = Math.min(this.modalPosition.openingWidth, this.modalPosition.windowWidth);
                var wns = "resize.forms-" + this.formId;
                $(window).on(wns, function (e) { return _this.onWindowResize(e); });
            };
            // ui_dialog must be the ".ui-dialog" tagged element of a jQuery-ui dialog widget
            // call this method in the create call of a jQuery-ui dialog widget
            form.prototype.styleModalForm = function (ui_dialog) {
                ui_dialog.addClass("modal-form");
                if (!h$.isNullOrUndefined(this.options.styleClasses)) {
                    $.each(this.options.styleClasses, function (i, item) {
                        ui_dialog.addClass(item);
                    });
                }
                // here i remove the jqueryui system close button
                // styling method and replace with font awesome
                ui_dialog.find('.ui-dialog-titlebar .ui-button-icon-primary')
                    .css("background-image", "none")
                    .removeClass("ui-icon")
                    .removeClass("ui-icon-closethick")
                    .addClass("fa fa-times");
                ui_dialog.find('.ui-dialog-content').css({
                    "box-sizing": "content-box"
                });
                ui_dialog.find(".ui-dialog-titlebar").addClass("ui-chrome-titlebar");
                ui_dialog.find(".ui-dialog-title").addClass("ui-chrome-title");
                ui_dialog.find(".ui-dialog-titlebar-close")
                    .addClass("ui-chrome-systemclose")
                    .attr("tabindex", "-1");
                ui_dialog.find(".ui-dialog-buttonpane").addClass("ui-form-buttonpane");
                ui_dialog.find(".ui-dialog-buttonset .ui-button").addClass("ui-form-button");
            };
            form.prototype.styleModelessForm = function (ft) {
                ft.addClass("modeless-form");
                if (!h$.isNullOrUndefined(this.options.styleClasses)) {
                    $.each(this.options.styleClasses, function (i, item) {
                        ft.addClass(item);
                    });
                }
            };
            form.prototype.onWindowResize = function (e) {
                if (e.target === window) {
                    var elem = $("#" + this.formId);
                    var ui_dialog = elem.closest(".ui-dialog");
                    elem.dialog("option", "position", elem.dialog("option", "position"));
                    var ww = $(window).width();
                    var fw = ui_dialog.outerWidth();
                    var delta = ww - this.modalPosition.openingWidth;
                    if (delta < 0) {
                        elem.dialog("option", "width", ww);
                    }
                    else {
                        if (fw < this.modalPosition.openingWidth) {
                            elem.dialog("option", "width", this.modalPosition.openingWidth);
                        }
                    }
                }
            };
            form.prototype.onCommand = function (cmd) {
                if (this.commandCallback === null) {
                    var msg = str.format("No OnCommand handler:\n form id: {0}, title: {1}, command: {2}", this.formId, this.options.title, cmd);
                    alert(msg);
                }
                else {
                    var data = null;
                    if (this.model !== null) {
                        data = new models();
                        data.current = ko.toJS(this.observableModel);
                        data.original = this.unwrappedOriginal;
                    }
                    this.commandCallback(this.ctx, this, cmd, data);
                }
            };
            form.prototype.attachDatePickers = function () {
                $(this.rootElement).find("input[type=date], input[type=text][data-input='date']").datepicker((this.options.datepickerOptions || null));
            };
            form.prototype.bindEmbeddedButtons = function () {
                var _this = this;
                var contentSelector = null;
                if (this.options.modal) {
                    contentSelector = ".ui-dialog-content";
                }
                else {
                    contentSelector = ".ui-form-content";
                }
                $(contentSelector).find("button[data-cmd]").on("click", function (e) {
                    _this.setMessage('');
                    //var cmd = $(e.target).attr("data-cmd");
                    var cmd = $(e.currentTarget).attr("data-cmd");
                    e.stopPropagation();
                    e.preventDefault();
                    _this.onCommand(cmd);
                });
            };
            form.prototype.updateElementAttributes = function () {
                $(this.rootElement).find("input[data-bind]").each(function (index, element) {
                    var bindString = $(element).attr("data-bind");
                    var propertyName = null;
                    var bindings = bindString.split(",");
                    $.each(bindings, function (i, b) {
                        bindings[i] = b.trim();
                        var tuple = b.split(":");
                        var key = tuple[0].trim();
                        if (key === "value" || key === "textInput" || key === "checked" || key === "moment" || key === "dateString") {
                            propertyName = tuple[1].trim();
                        }
                    });
                    var inputType = $(element).attr("type");
                    if (inputType !== "radio") {
                        bindings.push("uniqueName: true");
                        bindings.push("validationElement: " + propertyName);
                    }
                    bindString = bindings.join(", ");
                    $(element).attr("data-bind", bindString);
                    //if (propertyName !== null) {
                    //    $(element).attr("data-property", propertyName);
                    //}
                });
            };
            form.formStack = new collections.Stack();
            form.asyncValCounter = 0;
            form.systemInitialised = false;
            form.formCount = 0;
            form.config = null;
            form.modelessFormTemplate = "\n            <div class='ui-form' >\n                <div class='ui-form-titlebar' >\n                    <span class='ui-form-title' ></span>\n                </div>\n                <div class='ui-form-content' ></div>\n                <div class='ui-form-buttonpane' >\n                    <div class='ui-form-buttonset' ></div>\n                </div>\n            </div>".trim();
            return form;
        })();
        forms.form = form;
        var messageBox = (function () {
            function messageBox() {
            }
            messageBox.show = function (msg) {
                var deferred = $.Deferred();
                var messageHtml = "<div class='message-box-body'>" + msg + "</div>";
                var mf = new form(null, {
                    modal: true,
                    title: "System Message",
                    cancelButton: null
                }, null);
                mf.setContentHtml(messageHtml);
                mf.open(function (ctx, f, cmd, data) {
                    f.close();
                    deferred.resolve();
                });
                return deferred.promise();
            };
            return messageBox;
        })();
        forms.messageBox = messageBox;
    })(forms = fastnet.forms || (fastnet.forms = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=forms.js.map