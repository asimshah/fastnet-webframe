/// <reference path="../../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../../scripts/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../../../../scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../../../../scripts/typings/knockout.mapping/knockout.mapping.d.ts" />
/// <reference path="../../../../scripts/typings/jquery.blockui/jquery.blockui.d.ts" />
///// <reference path="../../../../scripts/typings/knockout.validation/knockout.validation.modified.d.ts" />
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
            return validations;
        }());
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
        }());
        forms.model = model;
        /**
         * base class for a data class to be used with a form
         * current version uses knockout
         */
        var viewModel = (function () {
            function viewModel() {
                this.__$formId = null;
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
            viewModel.prototype.formatDate = function (d) {
                return str.toDateString(d);
            };
            return viewModel;
        }());
        forms.viewModel = viewModel;
        var models = (function () {
            function models() {
            }
            return models;
        }());
        forms.models = models;
        /**
         * creates a new form
         */
        var form = (function () {
            function form(ctx, opts, model, contentHtml) {
                var _this = this;
                this.editors = null;
                this.contentHtml = null;
                //private model: model = null;
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
                    okButton: { text: "OK", command: "ok-command", position: 0 /* right */, dataBinding: "enable: okEnabled", isDefault: true },
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
                if (this.model != null) {
                    this.model.__$formId = this.formId;
                }
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
            //private static richTextResizerInstalled: boolean = false;
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
                    modelessContainer: "forms-container",
                    enableRichText: false
                };
                form.config = $.extend(defaultConfig, (config || {}));
                if (!form.systemInitialised) {
                    form.addMomentBinding();
                    var initOptions = {
                        errorsAsTitle: false,
                        insertMessages: false,
                        decorateElement: true,
                        errorElementClass: 'validation-error',
                    };
                    ko.validation.init(initOptions);
                    var rules = validations.GetValidators();
                    this.addValidations(rules);
                    if (form.config.additionalValidations) {
                        this.addValidations(form.config.additionalValidations);
                    }
                    ko.validation.registerExtenders();
                    //debug.print("ko.validation initialised");
                    form.addRichTextBinding(form.config.enableRichText);
                    form.systemInitialised = true;
                }
            };
            form.addRichTextBinding = function (enable) {
                function getPropertyName(element) {
                    var bindString = $(element).attr("data-bind");
                    var propertyName = null;
                    var bindings = bindString.split(",");
                    $.each(bindings, function (i, b) {
                        bindings[i] = b.trim();
                        var tuple = b.split(":");
                        var key = tuple[0].trim();
                        if (key === "richtext") {
                            propertyName = tuple[1].trim();
                        }
                    });
                    return propertyName;
                }
                ko.bindingHandlers["richtext"] = {
                    init: function (element, valueAccessor, allBindingsAccessor, viewModel, arg1) {
                        if (!enable) {
                            var msg = str.format("forms: richtext needs to be enabled first (and tinymce needs to be included!)");
                            alert(msg);
                        }
                        else {
                            var propertyName = getPropertyName(element);
                            $(element).attr("data-property", propertyName);
                            var html = ko.unwrap(valueAccessor());
                            $(element).val(html);
                            debug.print("richtext init()");
                        }
                        //tinymce.init({
                        //    inline: true,
                        //    toolbar_items_size: 'small',
                        //    toolbar: ["undo redo | cut copy paste | styleselect | fontselect fontsizeselect ",
                        //        "bold italic forecolor backcolor | bullist numlist | alignleft aligncenter alignright outdent indent "],
                        //    setup: function (editor) {
                        //        debug.print("tinymce editor setup()");
                        //    }
                        //});
                    },
                    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                        if (enable) {
                            debug.print("richtext update()");
                            var toolbar = "undo redo | cut copy paste | bold italic forecolor backcolor | bullist numlist | styleselect | fontselect fontsizeselect"; // | link code";
                            var rtOptions = allBindingsAccessor.get('richtextOptions');
                            var additionalOptions = {};
                            if (rtOptions !== undefined) {
                                if (rtOptions.toolbar !== undefined) {
                                    toolbar += ' | ' + rtOptions.toolbar;
                                }
                                if (rtOptions.height !== undefined) {
                                    $.extend(additionalOptions, { height: rtOptions.height });
                                }
                            }
                            var baseUrl = $("head base").prop("href");
                            var _tinymceUrl = baseUrl + "Scripts/tinymce/";
                            tinymce.baseURL = _tinymceUrl;
                            var mceOptions = {
                                plugins: "textcolor colorpicker visualblocks link image code",
                                menubar: false,
                                statusbar: false,
                                content_css: form.config.richTextCssUrl,
                                toolbar_items_size: 'small',
                                toolbar: toolbar,
                                setup: function (editor) {
                                    var vm = viewModel;
                                    var f = form.getForm(vm.__$formId);
                                    f.registorEditor($(element).attr("data-property"), editor);
                                    editor.on('change', function (e) {
                                        var ctx = bindingContext;
                                        var propertyName = $(e.target.targetElm).attr("data-property");
                                        var f = form.getForm(vm.__$formId);
                                        f.notifyChange(propertyName);
                                        f.setMessage('');
                                    });
                                }
                            };
                            $.extend(mceOptions, additionalOptions);
                            var editor = $(element).tinymce(mceOptions);
                        }
                    }
                };
            };
            form.addMomentBinding = function () {
                ko.bindingHandlers["stdDateFormat"] = {
                    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                        var format = allBindingsAccessor().format || 'DDMMMYYYY';
                        var val = valueAccessor();
                        var formatted = ""; // throw instead?
                        var unwrapped = ko.utils.unwrapObservable(val);
                        if (typeof unwrapped !== "undefined") {
                            var date = str.toMoment(unwrapped); // moment(unwrapped);
                            if (date && date.isValid()) {
                                formatted = date.format(format);
                            }
                        }
                        if (element.tagName === "INPUT") {
                            $(element).val(formatted);
                        }
                        else {
                            element.innerText = formatted;
                        }
                    }
                };
                //ko.extenders["isoDate"] = function (target, formatString) {
                //    target.formattedDate = ko.computed({
                //        read: function () {
                //            if (!target()) {
                //                return;
                //            }
                //            return str.toDateString(target());
                //        },
                //        write: function (value) {
                //            if (value) {
                //                target(str.toMoment(value).toISOString());
                //            }
                //        }
                //    });
                //    target.formattedDate(target());
                //    return target;
                //}
            };
            form.incrementAsyncValidatorCount = function () {
                form.asyncValCounter++;
                var cf = form.formStack.peek();
                if (form.asyncValCounter === 1 && !h$.isNullOrUndefined(cf)) {
                    cf.block();
                }
            };
            form.getForm = function (formId) {
                var result = null;
                this.formStack.forEach(function (f) {
                    if (f.formId == formId) {
                        result = f;
                        return false;
                    }
                });
                return result;
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
                this.finaliseClose();
                if (this.options.modal) {
                    $("#" + this.formId).off().dialog("close");
                }
                else {
                    $("#" + this.formId).off().closest(".ui-form").remove();
                }
            };
            form.prototype.open = function (onCommand, onChange) {
                var deferred = $.Deferred();
                form.formStack.push(this);
                this.commandCallback = onCommand;
                this.changeCallback = onChange;
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
                var f = this.options.modal ? this.getRoot() : this.getRoot().closest(".ui-form");
                var buttons = "button[data-cmd='" + cmd + "'], input[type=button][data-cmd='" + cmd + "']";
                $(f).find(buttons).prop("disabled", true);
            };
            form.prototype.enableCommand = function (cmd) {
                //var f = this.getRoot();
                var f = this.options.modal ? this.getRoot() : this.getRoot().closest(".ui-form");
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
            };
            form.prototype.findRichTextEditor = function (propertyName) {
                return this.editors.getValue(propertyName);
            };
            form.prototype.registorEditor = function (propertyName, editor) {
                if (this.editors == null) {
                    this.editors = new collections.Dictionary();
                }
                this.editors.setValue(propertyName, editor);
            };
            form.prototype.notifyChange = function (propertyName) {
                //debug.print("property {0}: value changed", propertyName);
                if (this.changeCallback != null) {
                    this.changeCallback(this, propertyName);
                }
            };
            form.prototype.getBlockRoot = function () {
                //**NB** only called on modal forms?? needs looking at
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
                            _this.onCommand(cmd, null);
                        },
                        "class": item.isDefault ? "is-default" : ""
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
                //return $("<form></form>").attr("id", this.formId).append($(this.contentHtml));
            };
            form.prototype.finaliseClose = function () {
                var wns = "resize.forms-" + this.formId;
                $(window).off(wns);
            };
            form.prototype.finaliseOpen = function () {
                var _this = this;
                var wns = "resize.forms-" + this.formId;
                $(window).on(wns, function (e) { return _this.onWindowResize(e); });
                this.rootElement = this.getRoot().get(0);
                if (this.model !== null) {
                    this.knockoutIsBound = true;
                    this.updateElementAttributes();
                    this.observableModel = ko.validatedObservable(this.model);
                    ko.applyBindings(this.observableModel, this.rootElement);
                }
                this.bindEmbeddedButtons();
                this.attachDatePickers();
                //var focusableElements = "input:not([type='checkbox']):not([type='button']):not([type='date']):not([data-input='date'])";
                var focusableElements = "[data-focus]";
                $(this.rootElement).find(focusableElements).each(function (i, c) {
                    var v = $(c).val().trim();
                    if (v === null || v === "") {
                        $(c).focus();
                        return false;
                    }
                });
                var changeDetectElements = "input";
                $(this.rootElement).find(changeDetectElements).on("input", function (e) {
                    var element = e.currentTarget;
                    var propertyName = $(element).attr("data-property");
                    _this.notifyChange(propertyName);
                });
                $(this.rootElement).find("select").on("change", function (e) {
                    var element = e.currentTarget;
                    var propertyName = $(element).attr("data-property");
                    _this.notifyChange(propertyName);
                });
                //**NB** the code below was an attempt to get default buttons working but it failed!
                // on the login form the result was an error saying a password is requied when in fact a password was provided !??
                // commented this out for now...
                //var targets = $(this.rootElement).find("button[data-cmd].is-default");
                //if (targets.length > 0) {
                //    $(this.rootElement).keyup((e) => {
                //        if (e.keyCode == 13) {
                //            var defaultButton = targets[0];
                //            $(defaultButton).trigger("click");
                //            //$(this.rootElement).find("button[data-cmd].is-default").trigger("click");
                //        }
                //    });
                //}
            };
            form.prototype.openModal = function () {
                var _this = this;
                var buttons = this.prepareButtons();
                var root = this.prepareFormRoot();
                var dg = $(root).dialog({
                    width: this.options.initialWidth,
                    height: this.options.initialHeight,
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
                this.finaliseOpen();
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
                    _this.onCommand(cmd, null);
                });
                var formHtml = this.prepareFormRoot();
                formTemplate.find(".ui-form-content").append(formHtml);
                $("." + this.options.modelessContainer).empty().append(formTemplate);
                this.finaliseOpen();
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
                //let wns = `resize.forms-${this.formId}`;
                //$(window).off(wns);
                var d = $("#" + this.formId).data("ui-dialog");
                d.destroy();
                if (closedUsingSystemButton) {
                    this.unbindKnockout();
                    var cmd = "system-close";
                    this.onCommand(cmd, null);
                }
            };
            // ui_dialog must be the ".ui-dialog" tagged element of a jQuery-ui dialog widget
            // call this method in the create call of a jQuery-ui dialog widget
            form.prototype.onModalDialogOpen = function (ui_dialog) {
                if (this.options.hideSystemCloseButton) {
                    ui_dialog.find(".ui-dialog-titlebar-close").hide();
                }
                this.modalPosition = {
                    openingHeight: ui_dialog.outerHeight(),
                    openingWidth: ui_dialog.outerWidth(),
                    windowWidth: $(window).width()
                };
                var w = Math.min(this.modalPosition.openingWidth, this.modalPosition.windowWidth);
                //let wns = `resize.forms-${this.formId}`;
                //$(window).on(wns, (e) => this.onWindowResize(e));
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
                    //debug.print("window resize");
                    if (this.options.modal) {
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
                    //this.resizeRichText();
                }
            };
            //private resizeRichText(): void {
            //    let formRoot = $(`#${this.formId}`);
            //    var rtdivs = formRoot.find("div.rich-text");
            //    if (rtdivs.length > 0) {
            //        debug.print("there are rt divs present");
            //    }
            //}
            form.prototype.onCommand = function (cmd, ct) {
                if (this.commandCallback === null) {
                    var msg = str.format("No OnCommand handler:\n form id: {0}, title: {1}, command: {2}", this.formId, this.options.title, cmd);
                    alert(msg);
                }
                else {
                    var data = null;
                    if (this.model !== null) {
                        data = new models();
                        var to = this.observableModel;
                        if (this.editors != null) {
                            this.editors.forEach(function (k, v) {
                                var content = v.getContent();
                                to()[k](content);
                                //debugger;
                            });
                        }
                        data.current = ko.toJS(this.observableModel);
                        data.original = this.unwrappedOriginal;
                    }
                    this.commandCallback(this.ctx, this, cmd, data, ct);
                }
            };
            form.prototype.attachDatePickers = function () {
                var dpOptions = $.extend({ dateFormat: 'dMyy' }, this.options.datepickerOptions || null);
                //$(this.rootElement).find("input[type=date], input[type=text][data-input='date']").datepicker((this.options.datepickerOptions || null));
                $(this.rootElement).find("input[type=date], input[type=text][data-input='date']").datepicker(dpOptions);
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
                    _this.onCommand(cmd, e.currentTarget);
                });
            };
            form.prototype.updateElementAttributes = function () {
                $(this.rootElement).find("input[data-bind], select[data-bind]").each(function (index, element) {
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
                    if (propertyName !== null) {
                        $(element).attr("data-property", propertyName);
                    }
                });
            };
            return form;
        }());
        form.formStack = new collections.Stack();
        form.asyncValCounter = 0;
        form.systemInitialised = false;
        form.formCount = 0;
        form.config = null;
        form.modelessFormTemplate = "\n            <div class='ui-form' >\n                <div class='ui-form-titlebar' >\n                    <span class='ui-form-title' ></span>\n                </div>\n                <div class='ui-form-content' ></div>\n                <div class='ui-form-buttonpane' >\n                    <div class='ui-form-buttonset' ></div>\n                </div>\n            </div>".trim();
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
        }());
        forms.messageBox = messageBox;
    })(forms = fastnet.forms || (fastnet.forms = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=forms.js.map