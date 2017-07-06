/// <reference path="../../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../../scripts/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../../../../scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../../../../scripts/typings/knockout.mapping/knockout.mapping.d.ts" />
/// <reference path="../../../../scripts/typings/jquery.blockui/jquery.blockui.d.ts" />
///// <reference path="../../../../scripts/typings/knockout.validation/knockout.validation.modified.d.ts" />

module fastnet {
    export module forms {
        import ajax = fastnet.util.ajax;
        import debug = fastnet.util.debug;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;
        import ff = fastnet.force;

        interface modalPosition {
            openingHeight: number;
            openingWidth: number;
            windowWidth: number;
        }
        export interface knockoutValidator {
            (value: any, params: any): boolean;
        }
        export interface knockoutAsyncValidator {
            (value: any, params: any, callback: KnockoutValidationAsyncCallback): void;
        }
        export const enum buttonPosition {
            right,
            left
        }
        export interface configuration {
            modelessContainer: string;
            additionalValidations?: any[];
            enableRichText?: boolean;
            richTextCssUrl?: string;
        }
        export interface validationResult {
            property?: string;
            success: boolean;
            error?: string;
        }
        export class validations {
            public static isChecked: knockoutValidator = function (val, params): boolean {
                return val === true;
            }
            public static phoneNumber: knockoutValidator = function (val, params): boolean {
                var pattern = /^[+0-9][0-9]*$/;
                return ko.validation.rules.pattern.validator(val, pattern);
            }
            public static passwordComplexity: knockoutValidator = function (val, params): boolean {
                var pattern = /(?=^.{8,}$)(?=.*\d)(?=.*[$-/:-?{-~!"^_`\[\]\\])(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
                return ko.validation.rules.pattern.validator(val, pattern);
            }
            public static GetValidators() {
                var rules: any[] = [];
                // rules.push({ name: "emailInUse", async: true, validator: validations.emailInUse, message: "This email address not found" });
                rules.push({ name: "passwordComplexity", async: false, validator: validations.passwordComplexity, message: "Use at least one each of a digit, a non-alphanumeric and a lower and an upper case letter" });
                rules.push({ name: "phoneNumber", async: false, validator: validations.phoneNumber, message: "Use all digits and spaces with an optional leading +" });
                rules.push({ name: "isChecked", async: false, validator: validations.isChecked, message: "Box must be checked" });
                return rules;
            }
        }
        /**
         * data returned to a CommandCallback.
         * models.current is the data current in the form
         * models.original is the data as it was originally
         */
        export class model {
            public setFromJSON(data: any) {
                $.extend(this, data);
            }
            public getObservable<T extends viewModel>(): T {
                return null;
            }
        }
        /**
         * base class for a data class to be used with a form
         * current version uses knockout
         */
        export class viewModel {
            public __$formId: string = null;
            public message: KnockoutObservable<string> = ko.observable("");
            public okEnabled: KnockoutObservable<boolean> = ko.observable(true);
            public cancelEnabled: KnockoutObservable<boolean> = ko.observable(true);
            /**
             * populate this object from a javascript object
             * like { alpha: "hello", beta: "world" }
             */
            public fromJSObject(data: any): void {
                $.extend(this, data);
            }
            public formatDate(d: any): string {
                return str.toDateString(d);
            }
        }
        export class models {
            current: model;
            original: model;
            //observable: viewModel;
        }
        /**
         * Function passed to fastnet.forms.form.open().
         * This function will be called whenever a formButton in the form is clicked
         */
        export interface CommandCallback {
            (ctx: any, f: form, cmd: string, data: models, currentTarget: EventTarget): void;
        }
        export interface ChangeCallback {
            (f: form, property: string): void
        }
        export interface formButton {
            text: string;
            command: string;
            classList?: string[];
            position: buttonPosition;
            dataBinding?: string;
            isDefault?: boolean;
        }
        export interface formOptions {
            /**
             * Start form at this width
             */
            initialHeight?: number,
            /**
             * Start form at this width
             */
            initialWidth?: number,
            /**
             * true for pop-up forms, else embedded
             */
            modal: boolean; // true for pop-up forms, else embedded
            /**
             * 1. appears in the caption bar of a modal form
             */
            title: string;
            /**
             * Modeless only: selector of the html tag that will contain the form
             */
            modelessContainer?: string;
            /**
             * optional: array of class names to attach to the root of the form
             */
            styleClasses?: string[];
            /**
             * optional: beforeShow callback for jquery ui datepicker
             */
            datePickerBeforeShow?: any;
            datepickerOptions?: JQueryUI.DatepickerOptions;
            /**
             * modal only: if true, hides the close button in the caption bar
             */
            hideSystemCloseButton?: boolean;
            /**
             * set to null to remove the OK button
             */
            okButton?: formButton;
            /**
             * text of ok button label, default is "OK"
             */
            okButtonText?: string;
            /**
             * set to null to remove the Cancel button
             */
            cancelButton?: formButton;
            /**
             * text of cancel button label, default is "Cancel"
             */
            cancelButtonText?: string;
            /**
             * array of additional buttons in the button pane
             */
            additionalButtons?: formButton[];
            /**
             *
             */
            messageClass?: string;

        }

        /**
         * creates a new form
         */
        export class form {
            private static formStack = new collections.Stack<form>();
            private static asyncValCounter: number = 0;
            private static systemInitialised = false;
            private static formCount: number = 0;
            private static config: configuration = null;
            private static modelessFormTemplate = `
            <div class='ui-form' >
                <div class='ui-form-titlebar' >
                    <span class='ui-form-title' ></span>
                </div>
                <div class='ui-form-content' ></div>
                <div class='ui-form-buttonpane' >
                    <div class='ui-form-buttonset' ></div>
                </div>
            </div>`.trim();
            private editors: collections.Dictionary<string, any> = null;
            private options: formOptions;// = {};//null;
            private formId: string;
            private modalPosition: modalPosition;
            private commandCallback: CommandCallback;
            private changeCallback: ChangeCallback;
            private buttons: formButton[];
            private contentHtml: string = null;
            private ctx: any;
            private unwrappedOriginal: any;
            //private model: model = null;
            private model: viewModel = null;
            private observableModel: any;
            private knockoutIsBound: boolean = false;
            private rootElement: HTMLElement;            
            private validationResults: collections.Dictionary<string, collections.Bag<validationResult>>;
            //private static richTextResizerInstalled: boolean = false;
            private static addValidations(rules: any[]): void {
                $.each(rules, (i, rule) => {
                    if (rule.async) {
                        ko.validation.rules[rule.name] = {
                            message: rule.message, async: true, validator: (val, params, callback) => {
                                form.incrementAsyncValidatorCount();
                                rule.validator(val, params, (r) => {
                                    callback(r);
                                    form.decrementAsyncValidatorCount();
                                });
                            }
                        };
                    } else {
                        ko.validation.rules[rule.name] = {
                            message: rule.message,
                            validator: rule.validator
                        };
                    }
                });
            }
            public static initialise(config?: configuration): void {
                var defaultConfig: configuration = {
                    modelessContainer: "forms-container",
                    enableRichText: false
                };
                form.config = <configuration>$.extend(defaultConfig, (config || {}));
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
            }
            private static addRichTextBinding(enable: boolean) {
                function getPropertyName(element: Element): string {
                    var bindString = $(element).attr("data-bind");
                    var propertyName: string = null;
                    var bindings = bindString.split(",");
                    $.each(bindings, (i, b) => {
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
                        } else {
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
                            var toolbar = "undo redo | cut copy paste | bold italic forecolor backcolor | bullist numlist | styleselect | fontselect fontsizeselect";// | link code";
                            var rtOptions = allBindingsAccessor.get('richtextOptions');
                            var additionalOptions = {};
                            if (rtOptions !== undefined) {
                                if (rtOptions.toolbar !== undefined) {
                                    toolbar += ' | ' + rtOptions.toolbar;
                                }
                                if (rtOptions.height !== undefined) {
                                    $.extend(additionalOptions, {height: rtOptions.height});
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
                                    var vm: viewModel = viewModel;
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
                }
            }
            private static addMomentBinding() {
                ko.bindingHandlers["stdDateFormat"] = {
                    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                        var format = allBindingsAccessor().format || 'DDMMMYYYY';
                        var val = valueAccessor();
                        var formatted = ""; // throw instead?
                        var unwrapped = ko.utils.unwrapObservable(val);
                        if (typeof unwrapped !== "undefined") {
                            var date = str.toMoment(unwrapped);// moment(unwrapped);
                            if (date && date.isValid()) {
                                formatted = date.format(format);
                            }
                        }                       
                        if (element.tagName === "INPUT") {
                            $(element).val(formatted);
                        } else {
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
            }
            private static incrementAsyncValidatorCount(): void {
                form.asyncValCounter++;
                var cf = form.formStack.peek();
                if (form.asyncValCounter === 1 && !h$.isNullOrUndefined(cf)) {
                    cf.block();
                }
            }
            private static getForm(formId: string): form {
                var result: form = null;
                this.formStack.forEach((f) => {
                    if (f.formId == formId) {
                        result = f;
                        return false;
                    }
                });
                return result;
            }
            private static decrementAsyncValidatorCount(): void {
                form.asyncValCounter--;
                var cf = form.formStack.peek();
                if (form.asyncValCounter === 0 && !h$.isNullOrUndefined(cf)) {
                    cf.unBlock();
                }
            }
            constructor(ctx: any, opts: formOptions, model: viewModel, contentHtml?: string) {
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
                    okButton: { text: "OK", command: "ok-command", position: buttonPosition.right, dataBinding: "enable: okEnabled", isDefault: true },
                    cancelButton: { text: "Close", command: "cancel-command", position: buttonPosition.right, dataBinding: "enable: cancelEnabled" },
                    messageClass: "message-block"
                }
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
                $.each((this.options.additionalButtons || []), (i, b) => {
                    this.buttons.push(b);
                });
            }
            public setContentHtml(html: string): void {
                this.contentHtml = html;
            }
            public close() {
                form.formStack.pop();
                this.unbindKnockout();
                this.finaliseClose();
                if (this.options.modal) {
                    $(`#${this.formId}`).off().dialog("close");
                } else {
                    $(`#${this.formId}`).off().closest(".ui-form").remove();
                }
            }
            public open(onCommand: CommandCallback, onChange?: ChangeCallback): JQueryPromise<form> {
                var deferred = $.Deferred<form>();
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
            }
            public disableCommand(cmd: string): void {
                var f = this.options.modal ? this.getRoot() : this.getRoot().closest(".ui-form");
                
                let buttons = `button[data-cmd='${cmd}'], input[type=button][data-cmd='${cmd}']`;
                $(f).find(buttons).prop("disabled", true);
            }
            public enableCommand(cmd: string): void {
                //var f = this.getRoot();
                var f = this.options.modal ? this.getRoot() : this.getRoot().closest(".ui-form");
                let buttons = `button[data-cmd='${cmd}'], input[type=button][data-cmd='${cmd}']`;
                $(f).find(buttons).prop("disabled", false);
            }
            public isValid(): boolean {
                if (this.model !== null) {
                    var result: boolean = this.observableModel.isValid() && form.asyncValCounter === 0;
                    if (!result) {
                        this.observableModel.errors.showAllMessages();
                    }
                    return result;
                } else {
                    return true;
                }
            }
            public find(selector: string): JQuery {
                return $(this.rootElement).find(selector);
            }
            public setMessage(text: string): void {
                if (!h$.isNullOrUndefined(this.observableModel)) {
                    this.observableModel().message(text);
                }
            }
            public findRichTextEditor(propertyName: string): any {
                return this.editors.getValue(propertyName);
            }
            private registorEditor(propertyName: string, editor: any): void {
                if (this.editors == null) {
                    this.editors = new collections.Dictionary<string, any>();
                }
                this.editors.setValue(propertyName, editor);
            }
            private notifyChange(propertyName: string) {
                //debug.print("property {0}: value changed", propertyName);
                if (this.changeCallback != null) {
                    this.changeCallback(this, propertyName);
                }
            }
            private getBlockRoot(): JQuery {
                //**NB** only called on modal forms?? needs looking at
                return this.options.modal ? $(this.rootElement) : $(this.rootElement).closest(".ui-form").parent();//.parent();
            }
            private block(): void {
                if (this.options.modal) {
                    var blockRoot = this.getBlockRoot();// this.options.modal ? this.rootElement : $(this.rootElement).closest(".ui-form");
                    $(blockRoot).block({
                        message: '<i class="fa fa-gear fa-spin fa-3x"></i>',
                        overlayCSS: { backgroundColor: '#3399ff', cursor: 'none' },
                        css: { backgroundColor: 'transparent', border: 'none', color: '#ffffff' }
                    });
                } else {
                    this.modelessBlock();
                }
            }
            private unBlock(): void {
                if (this.options.modal) {
                    var blockRoot = this.getBlockRoot();
                    $(blockRoot).unblock();
                } else {
                    this.modelessUnblock();
                }
            }
            private modelessUnblock(): void {
                var uiForm = this.getRoot().closest(".ui-form");
                uiForm.find(".modeless-block").remove();
            }
            private modelessBlock(): void {
                var uiForm = this.getRoot().closest(".ui-form");
                var blockHtml =
                    `<div class='modeless-block' style="width:100%; height: 100%;position:absolute;left:0;top:0;z-index:1000;">
                        <div class='indicator'><i class="fa fa-gear fa-spin fa-3x"></i></div>
                    </div>`;
                uiForm.append($(blockHtml));
            }
            private getRoot(): JQuery {
                return this.options.modal ? $(`#${this.formId}`).closest(".ui-dialog") : $(`#${this.formId}`);
            }
            private prepareButtons(): any[] {
                var buttons = [];
                $.each(this.buttons, (i, item) => {
                    var b = {
                        text: item.text,
                        "data-cmd": item.command,
                        click: (e) => {
                            this.setMessage('');
                            //var cmd = $(e.target).attr("data-cmd");
                            var cmd = $(e.currentTarget).attr("data-cmd");
                            e.stopPropagation();
                            e.preventDefault();
                            this.onCommand(cmd, null);
                        },
                        "class": item.isDefault? "is-default" : ""
                    };
                    if (!h$.isNullOrUndefined(item.dataBinding)) {
                        b["data-bind"] = item.dataBinding;
                    }
                    if (!h$.isNullOrUndefined(item.classList) && item.classList.length > 0) {
                        b["class"] = item.classList.join(" ");
                    }
                    if (item.position === buttonPosition.right) {
                        b["class"] += " pull-right";
                    }
                    if (item.position === buttonPosition.left) {
                        b["class"] += " pull-left";
                    }
                    buttons.push(b);
                });
                return buttons;
            }
            private prepareFormRoot(): JQuery {
                return $("<div></div>").attr("id", this.formId).append($(this.contentHtml));
                //return $("<form></form>").attr("id", this.formId).append($(this.contentHtml));
            }
            private finaliseClose(): void {
                let wns = `resize.forms-${this.formId}`;
                $(window).off(wns);
            }
            private finaliseOpen(): void {
                let wns = `resize.forms-${this.formId}`;
                $(window).on(wns, (e) => this.onWindowResize(e));
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
                $(this.rootElement).find(focusableElements).each((i, c) => {
                    var v = $(c).val().trim();
                    if (v === null || v === "") {
                        $(c).focus();
                        return false;
                    }
                });
                var changeDetectElements = "input";
                $(this.rootElement).find(changeDetectElements).on("input", (e) => {
                    var element = <HTMLElement>e.currentTarget;
                    var propertyName = $(element).attr("data-property");

                    this.notifyChange(propertyName);
                });
                $(this.rootElement).find("select").on("change", (e) => {
                    var element = <HTMLElement>e.currentTarget;
                    var propertyName = $(element).attr("data-property");                
                    this.notifyChange(propertyName);
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
            }
            private openModal(): void {
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
                    create: (event, ui) => {
                        var ui_dialog = $(`#${this.formId}`).closest(".ui-dialog");
                        this.styleModalForm(ui_dialog);
                    },
                    open: (event, ui) => {
                        var ui_dialog = $(`#${this.formId}`).closest(".ui-dialog");
                        this.onModalDialogOpen(ui_dialog);
                    },
                    close: (event, ui) => {
                        var closedUsingSystemButton = $(event.currentTarget).hasClass("ui-dialog-titlebar-close");
                        this.onModalClosed(closedUsingSystemButton);
                    }
                });
                $(root).dialog("open");
                this.finaliseOpen();
            }
            private openModeless() {
                var buttons = this.prepareButtons();
                var formTemplate = $(form.modelessFormTemplate);
                this.styleModelessForm(formTemplate);
                formTemplate.find(".ui-form-title").html(this.options.title);
                $.each(buttons, (i, b) => {
                    var buttonHtml = str.format("<button class='btn ui-form-button {2}' data-cmd='{1}'>{0}</button>", b.text, b["data-cmd"], b.class);
                    $(formTemplate).find(".ui-form-buttonset").append($(buttonHtml));
                });
                $(formTemplate).find(".ui-form-buttonset button").click((e) => {
                    //var cmd = $(e.target).attr("data-cmd");
                    var cmd = $(e.currentTarget).attr("data-cmd");
                    e.stopPropagation();
                    e.preventDefault();
                    this.onCommand(cmd, null);
                });
                var formHtml = this.prepareFormRoot();
                formTemplate.find(".ui-form-content").append(formHtml);
                $(`.${this.options.modelessContainer}`).empty().append(formTemplate);
                this.finaliseOpen();
            }
            private validateOptions(): boolean {
                return true;// this.options.container !== null;
            }
            private unbindKnockout(): void {
                if (this.knockoutIsBound) {
                    ko.cleanNode(this.rootElement);
                    this.knockoutIsBound = false;
                }
            }

            private onModalClosed(closedUsingSystemButton: boolean): void {
                //let wns = `resize.forms-${this.formId}`;
                //$(window).off(wns);
                let d = $(`#${this.formId}`).data("ui-dialog");
                d.destroy();
                if (closedUsingSystemButton) {
                    this.unbindKnockout();
                    let cmd: string = "system-close";
                    this.onCommand(cmd, null);
                }
            }
            // ui_dialog must be the ".ui-dialog" tagged element of a jQuery-ui dialog widget
            // call this method in the create call of a jQuery-ui dialog widget
            private onModalDialogOpen(ui_dialog: JQuery): void {
                if (this.options.hideSystemCloseButton) {
                    ui_dialog.find(".ui-dialog-titlebar-close").hide();
                }
                this.modalPosition = {
                    openingHeight: ui_dialog.outerHeight(),
                    openingWidth: ui_dialog.outerWidth(),
                    windowWidth: $(window).width()
                };
                let w = Math.min(this.modalPosition.openingWidth, this.modalPosition.windowWidth);
                //let wns = `resize.forms-${this.formId}`;
                //$(window).on(wns, (e) => this.onWindowResize(e));
            }
            // ui_dialog must be the ".ui-dialog" tagged element of a jQuery-ui dialog widget
            // call this method in the create call of a jQuery-ui dialog widget
            private styleModalForm(ui_dialog: JQuery): void {
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
                })
                ui_dialog.find(".ui-dialog-titlebar").addClass("ui-chrome-titlebar");
                ui_dialog.find(".ui-dialog-title").addClass("ui-chrome-title");
                ui_dialog.find(".ui-dialog-titlebar-close")
                    .addClass("ui-chrome-systemclose")
                    .attr("tabindex", "-1");
                ui_dialog.find(".ui-dialog-buttonpane").addClass("ui-form-buttonpane");
                ui_dialog.find(".ui-dialog-buttonset .ui-button").addClass("ui-form-button");
            }
            private styleModelessForm(ft: JQuery): void {
                ft.addClass("modeless-form");

                if (!h$.isNullOrUndefined(this.options.styleClasses)) {
                    $.each(this.options.styleClasses, function (i, item) {
                        ft.addClass(item);
                    });
                }
            }
            private onWindowResize(e): void {
                if (e.target === window) {
                    //debug.print("window resize");
                    if (this.options.modal) {
                        let elem = $(`#${this.formId}`);
                        let ui_dialog = elem.closest(".ui-dialog");
                        elem.dialog("option", "position", elem.dialog("option", "position"));
                        let ww = $(window).width();
                        let fw = ui_dialog.outerWidth();
                        let delta = ww - this.modalPosition.openingWidth;
                        if (delta < 0) {
                            elem.dialog("option", "width", ww);
                        } else {
                            if (fw < this.modalPosition.openingWidth) {
                                elem.dialog("option", "width", this.modalPosition.openingWidth);
                            }
                        }
                    }
                    //this.resizeRichText();
                }
            }
            //private resizeRichText(): void {
            //    let formRoot = $(`#${this.formId}`);
            //    var rtdivs = formRoot.find("div.rich-text");
            //    if (rtdivs.length > 0) {
            //        debug.print("there are rt divs present");
            //    }
            //}
            private onCommand(cmd: string, ct: EventTarget) {
                if (this.commandCallback === null) {
                    var msg = str.format("No OnCommand handler:\n form id: {0}, title: {1}, command: {2}", this.formId, this.options.title, cmd);
                    alert(msg);
                } else {
                    var data: models = null;
                    if (this.model !== null) {
                        data = new models();
                        var to = this.observableModel;
                        if (this.editors != null) {
                            this.editors.forEach((k, v) => {
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
            }
            private attachDatePickers(): void {
                var dpOptions = $.extend({ dateFormat: 'dMyy'}, this.options.datepickerOptions || null);
                //$(this.rootElement).find("input[type=date], input[type=text][data-input='date']").datepicker((this.options.datepickerOptions || null));
                $(this.rootElement).find("input[type=date], input[type=text][data-input='date']").datepicker(dpOptions);
            }
            private bindEmbeddedButtons(): void {
                var contentSelector = null;
                if (this.options.modal) {
                    contentSelector = ".ui-dialog-content";
                } else {
                    contentSelector = ".ui-form-content";
                }
                $(contentSelector).find("button[data-cmd]").on("click", (e) => {
                    this.setMessage('');
                    //var cmd = $(e.target).attr("data-cmd");
                    var cmd = $(e.currentTarget).attr("data-cmd");
                    e.stopPropagation();
                    e.preventDefault();
                    this.onCommand(cmd, e.currentTarget);
                });
            }
            private updateElementAttributes(): void {
                $(this.rootElement).find("input[data-bind], select[data-bind]").each((index, element) => {

                    var bindString = $(element).attr("data-bind");
                    var propertyName: string = null;
                    var bindings = bindString.split(",");
                    $.each(bindings, (i, b) => {
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
            }

        }
        export class messageBox {
            public static show(msg: string): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var messageHtml = `<div class='message-box-body'>${msg}</div>`;
                var mf = new form(null, {
                    modal: true,
                    title: "System Message",
                    cancelButton: null
                }, null);
                mf.setContentHtml(messageHtml);
                mf.open((ctx: any, f: form, cmd: string, data: any) => {
                    f.close();
                    deferred.resolve();
                });
                return deferred.promise();
            }
        }
    }
}