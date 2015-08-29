﻿/// <reference path="../../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../../scripts/typings/jqueryui/jqueryui.d.ts" />


module fastnet {
    import ajax = fastnet.util.ajax;
    import debug = fastnet.util.debug;
    import str = fastnet.util.str;
    import h$ = fastnet.util.helper;
    const enum buttonPosition {
        right,
        left
    }
    interface CommandCallback {
        (f: form, cmd: string): void;
    }
    interface formButton {
        text: string;
        command: string;
        classList?: string[];
        position: buttonPosition;
    }
    interface form$options {
        modal: boolean; // true for pop-up forms, else embedded
        title: string;
        // container: the jQuery style selector of the html tag that will contain the form, normally .xxx or #xxxx
        //     only used if the dialog is not modal
        container?: string;
        styleClasses?: string[];
        hideSystemCloseButton?: boolean;
        okButton?: formButton;
    }
    interface modalPosition {
        openingHeight: number;
        openingWidth: number;
        windowWidth: number;
    }
    export class form {
        private static formCount: number = 0;
        private static formTemplate = `
            <div id='{0}' class='ui-form {2}' >
                <div class='ui-form-titlebar' >
                    <span class='ui-form-title' >{1}</span>
                </div>
                <div class='ui-form-content' >{3}</div>
                <div class='ui-form-buttonpane' >
                    <div class='ui-form-buttonset' ></div>
                </div>
            </div>`.trim(); // {0} = id, {1} = title, {2} = additional classes, {3} content
        private options: form$options;
        private formId: string;
        private modalPosition: modalPosition;
        private commandCallback: CommandCallback;
        constructor(opts: form$options) {
            //this.commandCallback = onCommand;
            this.options = {
                modal: false,
                title: "title required",
                container: null,
                styleClass: "dialog-style",
                hideSystemCloseButton: false,
                okButton: { text: "OK", command: "ok-command", position: buttonPosition.right }
                //onCommand: (f, c) => { this.onCommand(f, c) }
            }
            $.extend(true, this.options, opts);
            if (!this.validateOptions()) {
                debug.print("form options are invalid");
            }
            this.formId = "ff-" + form.formCount++;
        }
        public open(onCommand: CommandCallback): void {
            this.commandCallback = onCommand;
            if (this.options.modal) {
                this.openModal();
            }
            else {
                this.openModeless();
            }
        }
        private openModal(): void {
            var root = $("<div></div>").attr("id", this.formId).append($("<div>some form body</div>"));
            var dg = $(root).dialog({
                autoOpen: false,
                modal: true,
                title: this.options.title,
                position: { my: "top", at: "top+10%" },
                create: (event, ui) => {
                    var ui_dialog = $(`#${this.formId}`).closest(".ui-dialog");
                    this.styleModalDialog(ui_dialog);
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
        }
        private openModeless() {
            debug.print("modeless not yet implemented");
        }
        private validateOptions(): boolean {
            return this.options.container !== null;
        }
        private onModalClosed(closedUsingSystemButton: boolean): void {
            let wns = `resize.forms-${this.formId}`;
            $(window).off(wns);
            let d = $(`#${this.formId}`).data("ui-dialog");
            d.destroy();
            if (closedUsingSystemButton) {
                let cmd: string = "system-close";
                this.onCommand(cmd);
            }
        }
        // ui_dialog must be the ".ui-dialog" tagged element of a jQuery-ui dialog widget
        // call this method in the create call of a jQuery-ui dialog widget
        private onModalDialogOpen(ui_dialog: JQuery): void {
            if (this.options.hideSystemCloseButton) {
                ui_dialog.find(".ui-dialog-titlebar-close").hide();
            }
            //let d = $(`#${this.formId}`).data("ui-dialog");
            this.modalPosition = {
                openingHeight: ui_dialog.outerHeight(),
                openingWidth: ui_dialog.outerWidth(),
                windowWidth: $(window).width()
            };
            let w = Math.min(this.modalPosition.openingWidth, this.modalPosition.windowWidth);
            let wns = `resize.forms-${this.formId}`;
            $(window).on(wns, (e) => this.onWindowResize(e));
        }
        // ui_dialog must be the ".ui-dialog" tagged element of a jQuery-ui dialog widget
        // call this method in the create call of a jQuery-ui dialog widget
        private styleModalDialog(ui_dialog: JQuery): void {
            ui_dialog.addClass("dialog-style");
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
                .attr("tabindex", "-1");;
            ui_dialog.find(".ui-dialog-buttonset .ui-button").addClass("ui-form-button");
        }
        private onWindowResize(e) : void {
            if (e.target === window) {
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
        }
        private onCommand(cmd: string) {
            if (this.commandCallback === null) {
                var msg = str.format("No OnCommand handler:\n form id: {0}, title: {1}, command: {2}", this.formId, this.options.title, cmd);
                alert(msg);
            } else {
                this.commandCallback(this, cmd);
            }
        }
    }
}