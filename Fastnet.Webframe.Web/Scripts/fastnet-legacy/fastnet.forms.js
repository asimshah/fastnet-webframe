(function ($) {
    // Version 1.1.3
    var $T;
    var $U;
    var modelessTemplate =
"<div class='modeless hide' id='{{Id}}' >" +
"    <div class='modeless-content content-root'>" +
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
"        <div class='modal-content content-root'>" +
"            <div class='modal-section sh'>" +
"                <div class='modal-header'>" +
"                    <div>" +
"                        <button type='button' class='close' data-dismiss='modal' data-cmd='system-close'><span>&times;</span></button>" +
"                        <h4 class='modal-title'>{{Title}}</h4>" +
"                    </div>" +
"                </div>" +
"            </div>" +
"            <div class='modal-section sb'>" +
"                <div class='modal-body'><div class='body-content'>{{{BodyHtml}}}</div></div>" +
"            </div>" +
"            <div class='modal-section sf'>" +
"                <div class='modal-footer'>{{{FooterHtml}}}</div>" +
"            </div>" +
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
            var mb = new $.fastnet$forms.CreateForm("template/get/main-forms/messagebox", this.options, data);
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
            _validationStateUpdated: false,
            _rootClasses: null,
            BaseZIndex: 12000,
            DisableSystemClose: false,
            Title: "Form Title",
            IsModal: true,
            ShowErrorSummary: false,
            IsResizable: false,
            AfterItemValidation: null,
            OnChange: null,
            OnCommand: null,
            OnResize: null,
            resizeControl: null,
            allControlsSelector: "input, button, textarea, select" // DONT USE ":input" as it throws javascript syntax errors from jquery code when using IE
        }, options);
        this.data = $.extend({
            Id: this.options._id, // so I can trace the form id visually in the form!
            Title: this.options.Title,
        }, data);

        formList[this.options._id] = this;
        function _checkForm() {
            // DONT USE ":input" as it throws javascript syntax errors from jquery code when using IE
            //var allInputSelector = "input, button, textarea, select";
            function isdefined(item) {
                return typeof item !== "undefined" && item !== null;
            }
            function listPropertyDetails(me, fr) {
                fr.find("[data-property]").each(function (i, item) {
                    var itemElements = [];
                    var controls = $(item).find(me.options.allControlsSelector).each(function (j, ctrl) {
                        var tag = ctrl.tagName.toLowerCase();
                        if (tag === "input") {
                            tag += "[type=" + ctrl.type + "]";
                            var dataItem = $(ctrl).attr("data-item");
                            itemElements.push(tag + " data-item=" + dataItem);
                            var validators = me.options._validators[dataItem];
                            if (isdefined(validators)) {
                                itemElements.push(validators.length + " validators");
                            } else {
                                itemElements.push("0 validators");
                            }
                        } else if (tag === 'button') {
                            var dataCommand = $(ctrl).attr("data-cmd");
                            itemElements.push(tag + " data-cmd=" + dataCommand);
                        }
                    });
                    var text = itemElements.join(', ');
                    //$U.Debug("                : {0}", text);
                });
            }
            try {
                var me = this;
                if (!isdefined(me.options) || !isdefined(me.options._froot)) {
                    alert("fastnet.forms: checkform context is invalid");
                } else {

                    var froot = me.options._froot;
                    var allControls = froot.find(me.options.allControlsSelector).length;
                    var commandControls = froot.find("[data-cmd]").length;
                    var propertyControls = froot.find("[data-property]").length;
                    var totalControls = commandControls + propertyControls;
                    var controlsMatched = allControls === totalControls;
                    var validatable = froot.find("[data-validation-state]").length;
                    var allValidatable = validatable === propertyControls;
                    var initialCount = froot.find("[data-validation-state='initial']").length;
                    var validCount = froot.find("[data-validation-state='valid']").length;
                    var errorCount = froot.find("[data-validation-state='error']").length;
                    var requiredCount = froot.find("[data-value-required='true']").length;
                    var originalValuesCount = froot.find("[data-original]").length;
                    var validationState = me.options._validationStateUpdated;
                    listPropertyDetails(me, froot);
                }
            } catch (xe) {
                debugger;
            }
        }
        function _load() {
            var me = this;
            return $.when(
                 $U.AjaxGet({ url: me.options._template })
                ).then(function (r) {
                    var template = $(r.Template);
                    var root = template.first();
                    if (!root.hasClass("form-body")) {
                        // there is an element "above" form-body, so get any classes
                        me.options._rootClasses = root.attr('class');
                    }
                    var formBody = template.find(".form-body");
                    formBody = Mustache.to_html(formBody[0].outerHTML, me.data);
                    var formFooter = template.find(".form-footer");
                    formFooter = Mustache.to_html(formFooter[0].outerHTML, me.data);
                    me.data = $.extend({
                        BodyHtml: formBody,
                        FooterHtml: formFooter
                    }, me.data);
                    var modeTemplate = me.options.IsModal ? modalTemplate : modelessTemplate;
                    me.options._froot = $(Mustache.to_html(modeTemplate, me.data));
                    me.options._froot.find(".content-root").addClass(me.options._rootClasses);
                    $.each(me.options._pendingSetEnableds, function (index, item) {
                        if (item.action === "disable") {
                            me.disableCommand(item.cmd);
                        } else {
                            me.enableCommand(item.cmd);
                        }
                    });
                    me.options._pendingSetEnableds.length = 0;
                    me.options._froot.find("[data-property]").attr("data-validation-state", "initial");
                    _checkForm.call(me);
                });
        }
        function _show(onload) {
            var me = this;
            var container = me.options._container;
            $(container).append(me.options._froot);
            if (me.options.DisableSystemClose) {
                me.hideCommand("system-close");
            }
            _saveOriginalData.call(me);
            _bindCommands.call(me);
            _bindFocus.call(me);
            _bindDataChange.call(me);
            _bindFileButtons.call(me);
            if (me.options.IsModal) {
                me.options._froot.modal({
                    backdrop: 'static',
                    keyboard: false
                });

                if (me.options.IsResizable) {
                    _addResizability2.call(me);
                }
            } else {
                me.options._froot.removeClass("hide");
            }
            if ($.isFunction(onload)) {
                onload(me);
            }
            setTimeout(function () {
                var f_elements = $(container).find("[data-focus]");
                //if (f_elements.length > 0) {
                //    f_elements[0].focus();
                //}
                if (f_elements.length > 0) {
                    if (f_elements.length === 1) {
                        f_elements[0].focus();
                    } else {
                        // we have more than one data-focus element
                        f_elements.each(function (i, item) {
                            var content = $(item).val();
                            if (content === null || content === '') {
                                $(item).focus();
                                return false;
                            }
                        });
                    }
                }
                if (!Modernizr.inputtypes.date) {
                    var zIndex = me.options.BaseZIndex + (formCount * 10);
                    me.options._froot.find("input[type=date]").css("z-index", zIndex + 1);
                    me.options._froot.find("input[type=date]").each(function (i, item) {
                        var opts = $(item).attr("data-date-options");
                        var options = JSON.parse(opts);
                        $(item).datepicker(options);
                    });
                }
            }, 750);
        }
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
        function _onCommand(cmd, srcElement) {
            var me = this;
            if ($.isFunction(me.options.OnCommand)) {
                var f = formList[me.options._id];
                me.options.OnCommand(f, cmd, srcElement);
            }
        }
        function _addResizability2() {
            var me = this;
            var f = me.options._froot;
            me.options.resizeControl = { para: null };
            me.options.resizeControl.modalDialog = f.find(".modal-dialog");
            me.options.resizeControl.resizeGrip = f.find(".resize-grip");
            me.options.resizeControl.modalHeader = f.find(".modal-header");
            //me.options.resizeControl.modalContent = f.find(".modal-content");
            me.options.resizeControl.modalBody = f.find(".modal-body");
            me.options.resizeControl.onresize = me.options.OnResize;
            // 
            var rc = me.options.resizeControl;
            rc.modalHeader.css({ "cursor": "move" });
            rc.resizeGrip.removeClass("hidden");
            rc.resizeGrip.css({ "cursor": "nwse-resize" });
            //
            function stopTracking() {
                rc.para = null;
                $(window).off(".formsdynamic");
            }
            function startTracking() {
                $(window).on("mousemove.formsdynamic", function (e) {
                    if (rc.para !== null) {
                        var delta = { xoffset: e.pageX - rc.para.startX, yoffset: e.pageY - rc.para.startY };
                        //$U.Debug("resizability: {0} delta ({1}, {2})", rc.para.action, delta.xoffset, delta.yoffset);
                        //$U.Debug("mb: {0}w x {1}h, md: {2}w x {3}h", rc.modalBody.width(), rc.modalBody.height(),
                        //     rc.modalDialog.outerWidth(), rc.modalDialog.outerHeight());
                        switch (rc.para.action) {
                            case 'r': // resize it
                                var nw = rc.para.start.dialogWidth + delta.xoffset;
                                var nh = rc.para.start.dialogHeight + delta.yoffset;
                                rc.modalDialog.width(nw);
                                rc.modalDialog.height(nh);
                                setTimeout(function () {
                                    if (rc.onresize !== null) {
                                        rc.onresize({ width: rc.modalBody.width(), height: rc.modalBody.height() });
                                    }
                                }, 100);
                                break;
                            case 'm': // move it
                                var nlm = rc.para.start.dialogMarginLeft + delta.xoffset;
                                var ntm = rc.para.start.dialogMarginTop + delta.yoffset;
                                if (nlm < 0) {
                                    nlm = 0;
                                }
                                if (ntm < 0) {
                                    ntm = 0;
                                }
                                rc.modalDialog.css("margin-left", nlm);
                                rc.modalDialog.css("margin-top", ntm);
                                break;
                        }
                    }
                });
            }
            function getCurrentPosition() {
                var result = {};
                result.windowWidth = $(window).width();
                result.windowHeight = $(window).height();
                result.dialogTotalWidth = rc.modalDialog.outerWidth(); // incl padding
                result.dialogWidth = rc.modalDialog.width(); // excl padding
                result.dialogTotalHeight = rc.modalDialog.outerHeight(); // incl padding
                result.dialogHeight = rc.modalDialog.height(); // excl padding
                result.dialogMarginLeft = parseFloat(rc.modalDialog.css("margin-left"));
                result.dialogMarginTop = parseFloat(rc.modalDialog.css("margin-top"));
                //$U.Debug("resizability: start position captured");
                return result;
            }
            $(window).on("mouseup.forms", function () {
                stopTracking();
            });
            rc.resizeGrip.on("mousedown.forms", function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (rc.para !== null) {
                    stopTracking();
                }
                rc.para = { action: 'r', start: getCurrentPosition(), startX: e.pageX, startY: e.pageY }; // action = 'r' for resizing
                startTracking();
            });
            rc.modalHeader.on("mousedown.forms", function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (rc.para !== null) {
                    stopTracking();
                }
                rc.para = { action: 'm', start: getCurrentPosition(), startX: e.pageX, startY: e.pageY }; // action = 'm' for moving
                startTracking();
            });
            rc.modalHeader.addClass("resizable");
            //rc.modalContent.on("resize", function (e) {
            //    $U.Debug("modal-content resize");
            //});
        }
        function _removeResizability() {
            var me = this;
            var f = me.options._froot;
            var resizeGrip = f.find(".resize-grip");
            var modalHeader = f.find(".modal-header");
            //var modalDialog = f.find(".modal-dialog");
            //var modalBody = f.find(".modal-body");
            $(window).off(".formsdynamic");
            $(window).off(".forms");
            modalHeader.removeClass("resizable");
            modalHeader.css("cursor", "default");
            f.off(".forms");
            resizeGrip.off(".forms");
            resizeGrip.css("cursor", "default");
            resizeGrip.addClass("hidden");
        }
        function _saveOriginalData(target) {
            var me = this;
            var t = _getroot(me, target);
            var root = t.root;
            root.find(me.options.allControlsSelector).each(function (index, element) {
                var tag = $(element).prop("tagName").toLowerCase();
                switch (tag) {
                    case "input":
                        var inputType = $(element).attr("type").toLowerCase();
                        switch (inputType) {
                            case "checkbox":
                                var val = $(element).prop('checked');
                                $(element).attr("data-original", val);
                                break;
                            default:
                                var val = $(element).val();
                                $(element).attr("data-original", val);
                                break;
                        }
                        break;
                    case "textarea":
                        var val = $(element).val();
                        if ($(element).prop("placeholder") === val) {
                            val = "";
                        }
                        $(element).attr("data-original", val);
                        break;
                    case "select":
                        $U.Debug("_saveOriginalData: select not yet implemented");
                        break;
                }
            });
            ////me.options.allControlsSelector
            //var selector = "input[type=text], input[type=password], input[type=email]";
            //root.find(selector).each(function (index, element) {
            //    var val = $(element).val();
            //    $(element).attr("data-original", val);
            //});
            //selector = "input[type=checkbox]";
            //root.find(selector).each(function (index, element) {
            //    var val = $(element).is(":checked") ? true : false;
            //    $(element).attr("data-original", val);
            //});
            //selector = "textarea";
            //root.find(selector).each(function (index, element) {
            //    var val = $(this).val();
            //    if ($(this).prop("placeholder") === val) {
            //        val = "";
            //    }
            //    $(element).attr("data-original", val);
            //});
        }
        function _getroot(me, target) {
            var rootIsMainForm = false;
            var root = $(target);
            if (typeof target === "undefined") {
                root = me.options._froot;
                rootIsMainForm = true;
            }
            return { root: root, isMainForm: rootIsMainForm };
        }
        function _bindFileButtons() {
            var me = this;
            $(".btn-file :file").on("change", function (e) {
                e.preventDefault();
                e.stopPropagation();
                var input = $(this);
                var dataItem = input.attr("data-item");
                var numFiles = input.get(0).files ? input.get(0).files.length : 1;
                var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
                input.trigger('fileselect', [numFiles, label, dataItem]);
            });
            $(".btn-file :file").on("fileselect", function (e, numFiles, label, dataItem) {
                e.preventDefault();
                e.stopPropagation();
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
        }
        function _bindCommands(target) {
            var me = this;
            var t = _getroot(me, target);
            var root = t.root;
            //$U.Debug("_bindCommands: root is {0}, isMainForm: {1}", t.root[0].outerHTML, t.isMainForm);
            if (t.isMainForm) {
                if (me.options.IsModal) {
                    me.options._froot.on("shown.bs.modal", function () {
                        //var zIndex = 1040 + ((formList.length) * 10);
                        var zIndex = me.options.BaseZIndex + (formCount * 10);
                        $(this).css('z-index', zIndex);
                    });
                    me.options._froot.on("hidden.bs.modal", function () {
                        //$U.Debug("form {0} closed", me.options._id);
                        _close.bind(me)();
                    });
                }
            }
            root.find("button[data-cmd], input[type=button][data-cmd], span[data-cmd]").on("click", function (e) {
                var cmd = $(this).attr("data-cmd");
                if (cmd === "cancel") {
                    if (me.options.IsModal) {
                        me.options._froot.modal('hide');
                    } else {
                        //_close();
                        _close.call(me);
                    }
                }
                e.preventDefault();
                _onCommand.call(me, cmd, this);
            });
        }
        function _bindFocus(target) {
            //function getValue(element) {
            //    var tag = element.tagName.toLowerCase();
            //    //var inputType = $(element).attr("type");
            //    var val;
            //    var dataItem = $(element).attr("data-item");
            //    //input, button, textarea, select
            //    switch (tag) {
            //        case "input":
            //            var inputType = $(element).attr("type").toLowerCase();
            //            switch (inputType) {
            //                case "checkbox":
            //                    val = $(element).prop('checked');
            //                    break;
            //                default:
            //                    val = $(element).val();
            //                    break;
            //            }
            //            break;
            //        case "textarea":
            //            val = $(element).val();
            //            if ($(element).prop("placeholder") === val) {
            //                // workaround for IE textarea placeholder bug
            //                val = "";
            //            }
            //            break;
            //        case "select":
            //            $U.Debug("getValue: select not yet implemented");
            //            break;
            //        default:
            //            break;
            //    }
            //    return val;
            //}
            var me = this;
            var t = _getroot(me, target);
            var root = t.root;
            root.find(me.options.allControlsSelector).on("focus", function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (me.options._validationStateUpdated === false) {
                    $("[data-property]").find("[data-item]").each(function (i, item) {
                        var element = item;
                        var dataItem = $(element).attr("data-item");
                        var validations = me.options._validators[dataItem];
                        if (typeof validations === "undefined") {
                            validations = null;
                        }
                        if (validations != null) {
                            $.each(validations, function (i, item) {
                                if (item.setIsRequired) {
                                    var propElement = $(element).closest("[data-property]");
                                    $(propElement).attr("data-value-required", "true");
                                    var val = _getValue(element);
                                    if (val === "") {
                                        $(propElement).attr("data-validation-state", "error");
                                    }
                                    return false;
                                }
                            });
                        }
                    });
                    me.options._validationStateUpdated = true;
                    _checkForm.call(me);
                }
                var propElement = $(this).closest("[data-property]");
                $(propElement).find(".message").html("");
                $(propElement).attr("data-validation-state", "visiting");
            });
            root.find(me.options.allControlsSelector).on("blur", function (e) {

                e.preventDefault();
                e.stopPropagation();
                _validateIfRequired(me, root, this);
                //var val = _getValue(this);
                //var dataItem = $(this).attr("data-item");
                //var original = $(this).attr("data-original");
                //var valueIsRequired = $(this).closest("[data-property]").attr("data-value-required") === "true";
                //var needsValidation = val !== original || val === "" && valueIsRequired;
                ////$U.Debug("leave focus for {0}", dataItem);
                //if (needsValidation) {
                //    var validations = me.options._validators[dataItem];
                //    if (typeof validations === "undefined") {
                //        validations = null;
                //    }
                //    if (validations !== null) {
                //        $.when(_validateItem(me.options._id, dataItem, validations)).then(function (r) {
                //            var dp = root.find("[data-item='" + r.dataItem + "']").closest("[data-property]");
                //            dp.attr("data-validation-state", r.success ? "valid" : "error");
                //            afterItemValidation(me, r);
                //            //r.totalErrors = root.find("[data-validation-state='error']").length;
                //            //r.totalValid = root.find("[data-validation-state='valid']").length;
                //            //r.totalInitial = root.find("[data-validation-state='initial']").length;
                //            //$U.Debug("Errors: {0}, Valid: {1}, Initial: {2}, Total: {3}", r.totalErrors, r.totalValid, r.totalInitial, r.totalErrors + r.totalValid + r.totalInitial)
                //            //if (me.options.AfterItemValidation !== null) {
                //            //    me.options.AfterItemValidation(me, r);
                //            //}
                //        });
                //    } else {
                //        afterItemValidation(me, { success: true, dataItem: dataItem });
                //    }
                //    _updateErrorSummary.call(me);
                //}
            });
        }
        function _getValue(element) {
            var tag = element.tagName.toLowerCase();
            //var inputType = $(element).attr("type");
            var val;
            var dataItem = $(element).attr("data-item");
            //input, button, textarea, select
            switch (tag) {
                case "input":
                    var inputType = $(element).attr("type").toLowerCase();
                    switch (inputType) {
                        case "checkbox":
                            val = $(element).prop('checked');
                            break;
                        default:
                            val = $(element).val();
                            break;
                    }
                    break;
                case "textarea":
                    val = $(element).val();
                    if ($(element).prop("placeholder") === val) {
                        // workaround for IE textarea placeholder bug
                        val = "";
                    }
                    break;
                case "select":
                    $U.Debug("getValue: select not yet implemented");
                    break;
                default:
                    break;
            }
            return val;
        }
        function _validateIfRequired(me, root, element) {
            function afterItemValidation(me, result) {
                var totals = me.getValidationCounts();
                $.extend(result, totals);
                if (me.options.AfterItemValidation !== null) {
                    me.options.AfterItemValidation(me, result);
                }
            }
            var val = _getValue(element);
            var dataItem = $(element).attr("data-item");
            var original = $(element).attr("data-original");
            var valueIsRequired = $(element).closest("[data-property]").attr("data-value-required") === "true";
            var needsValidation = val !== original || val === "" && valueIsRequired;
            if (needsValidation) {
                var validations = me.options._validators[dataItem];
                if (typeof validations === "undefined") {
                    validations = null;
                }
                if (validations !== null) {
                    $.when(_validateItem(me.options._id, dataItem, validations)).then(function (r) {
                        var dp = root.find("[data-item='" + r.dataItem + "']").closest("[data-property]");
                        dp.attr("data-validation-state", r.success ? "valid" : "error");
                        afterItemValidation(me, r);
                    });
                } else {
                    afterItemValidation(me, { success: true, dataItem: dataItem });
                }
                _updateErrorSummary.call(me);
            }
        }
        function _bindDataChange(target) {
            var me = this;
            var t = _getroot(me, target);
            var root = t.root;
            var cb$radio$selector = "input[type='checkbox'], input[type='radio']";
            var remainder$selector = "input:not([type='checkbox']):not([type='radio'])";
            root.find(cb$radio$selector).on('change', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var checked = $(e.target).is(":checked");
                var item = $(this).attr("data-item");
                if (me.options.OnChange !== null) {
                    me.options.OnChange(me, item, checked);
                }
            });
            root.find(remainder$selector).on("input change", function (e) {
                e.preventDefault();
                e.stopPropagation();
                var tag = this.tagName.toLowerCase();
                switch (tag) {
                    case "input":
                    case "textarea":
                        var item = $(this).attr("data-item");
                        $(this).closest("[data-property]").find(".message").html("");
                        if (me.options.OnChange !== null) {
                            me.options.OnChange(me, item);
                        }
                        break;
                }
                if (tag === "input" && $(this).attr("type") === "date") {
                    // input type=date does not cause blur after the date has been entered by the datepicker
                    // so do the validation here - is this only IE?
                    _validateIfRequired(me, root, this);
                }
            });
        }
        function _commandEnable(command, enable) {
            // enable = true to enable, false to disable
            var me = this;
            if (me.options._froot === null) {
                me.options._pendingSetEnableds.push({ action: enable ? "enable" : "disable", cmd: command });
            } else {
                var selector = $U.Format("button[data-cmd='{0}'], input[type=button][data-cmd='{0}']", command);
                me.options._froot.find(selector).each(function () {
                    $U.SetEnabled(this, enable);
                });
            }
        }
        function _commandShow(command, show) {
            // show = true to show, false to hide
            var me = this;
            var selector = $U.Format("button[data-cmd='{0}'], input[type=button][data-cmd='{0}']", command);
            me.options._froot.find(selector).each(function () {
                if (show) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        }
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
                    var r = validation.validator(me, itemData, validation.message, errors, validation);
                    //$U.Debug("validator with message \"{0}\" called", validation.message);
                    if (r === false) {
                        result = false;
                        return false;
                    }
                }
            });
            if (result === true) {
                // local validations have been performed
                // now do deferred ones in parallel
                // (these are probably ajax calls)
                var functions = [];
                $.each(validations, function (index, validation) {
                    if (validation.isDeferred === true) {
                        functions.push(validation.validator(me, itemData, validation.message, errors, validation));
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
        }
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
        }
        function _updateErrorSummary() {
            var me = this;
            if (me.options.ShowErrorSummary) {
                var root = me.options._froot;
                var totals = me.getValidationCounts();
                if (totals.totalErrors > 0) {
                    var fmt = totals.totalErrors === 1 ? "There is 1 error" : "There are {0} errors";
                    root.find(".error-summary").text($U.Format(fmt, totals.totalErrors));
                } else {
                    root.find(".error-summary").text("");
                }
            }
        }
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
            if (me.options.IsModal) {
                me.options._froot.modal('hide');
                //_close.call(me);
            }
            else {
                _close.call(me);
            }
        };
        frm.prototype.getOriginalData = function (dataItem) {
            var me = this;
            if (typeof dataItem === "undefined") {
                var result = {};
                me.options._froot.find("[data-item]").each(function (index, element) {
                    var name = $(this).attr("data-item");
                    var val = $(this).attr("data-original");
                    result[name] = val;
                });
                return result;
            } else {
                return me.options._froot.find("[data-item='" + dataItem + "']").attr("data-original");
            }
        };
        frm.prototype.getData = function (dataItem) {
            var me = this;
            function getElementData(element) {
                var val = null;
                var tagname = $(element).prop("tagName").toLowerCase();
                var type = $(element).attr("type");
                if (tagname === "input" && type === "checkbox") {
                    val = $(element).is(":checked")
                } else {
                    val = $(element).val().trim();
                    if (tagname === "textarea" && $(element).prop("placeholder") === val) {
                        // IE textarea placeholder bug
                        val = "";
                    }
                }
                return val;
            }
            if (typeof dataItem === "undefined") {
                var result = {};
                me.options._froot.find("[data-item]").each(function (index, element) {
                    var name = $(this).attr("data-item");
                    var val = getElementData(this);// $(this).val().trim();
                    if ($(this).is("[data-array]")) {
                        var arrayName = $(this).attr("data-array");
                        if (typeof result[arrayName] === "undefined") {
                            result[arrayName] = [];
                        }
                        result[arrayName].push({ dataItem: name, value: val });
                    } else {
                        result[name] = val;
                    }
                });
                return result;
            } else {
                var element = me.options._froot.find("[data-item='" + dataItem + "']");
                return getElementData(element);
            }
        };
        frm.prototype.setData = function (dataItem, data) {
            var me = this;
            var target = me.options._froot.find("[data-item='" + dataItem + "']");
            // assume val() will do it all for now
            target.val(data);
        };
        frm.prototype.checkForm = function () {
            var me = this;
            _checkForm.call(me);
        };
        frm.prototype.addValidator = function (dataItem, validator) {
            var me = this;
            // validator is an object with
            // func = validationfunction - signature is  (currentForm , dataToValidate, errorMessage, errors, validator) returning a bool
            // or func = validationFunction - signature is  (current , dataToValidate, errorMessage, errors, validator), returning a promise
            // isDeferred = true if func returns a promise
            // errorMessage = text to display if the validation fails
            // Notes:
            // 1. funcs returning a bool MUSt add the provided errorMessage to the errors array.
            // 2. funcs returning a promise MUST either resolve(true) or reject(false) having added the provided errorMessage to the errors array
            if (typeof me.options._validators[dataItem] === "undefined" || me.options._validators[dataItem] === null) {
                me.options._validators[dataItem] = [];
            }
            me.options._validators[dataItem].push({
                validator: validator.func,
                setIsRequired: validator.setIsRequired,
                isDeferred: validator.isDeferred,
                message: validator.errorMessage,
                user: validator.user
            });
        };
        frm.prototype.removeValidators = function (dataItem) {
            var me = this;
            me.options._validators[dataItem] = [];
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
            //var fieldCount = me.options._froot.find("[data-property]").length;
            //var validCount = me.options._froot.find("[data-validation-state='valid']").length;
            var errorCount = me.options._froot.find("[data-validation-state='error']").length;
            return errorCount === 0;//validCount === fieldCount;
        };
        frm.prototype.getValidationCounts = function () {
            var me = this;
            var root = me.options._froot;
            var result = {
                totalErrors: root.find("[data-validation-state='error']").length,
                totalValid: root.find("[data-validation-state='valid']").length,
                totalInitial: root.find("[data-validation-state='initial']").length,
            };
            result.totalControls = result.totalErrors + result.totalInitial + result.totalValid;
            return result;
        };
        frm.prototype.hideCommand = function (command) {
            var me = this;
            _commandShow.call(me, command, false);
        };
        frm.prototype.showCommand = function (command) {
            var me = this;
            _commandShow.call(me, command, true);
        };
        frm.prototype.loadSubform = function (selector, templates, data, onload) {
            var me = this;
            // templates is
            // { template:, templateUrl:}
            // template takes precedence over templateUrl
            function loadTemplate(templ) {
                var loadTarget = me.options._froot.find(selector);
                loadTarget.off();
                loadTarget.empty();
                var content = $(Mustache.to_html(templ, data));
                loadTarget.append(content);
                me.options._validationStateUpdated = false;
                me.options._froot.find("[data-property]").attr("data-validation-state", "initial");
                _saveOriginalData.call(me, content);
                _bindCommands.call(me, content);
                _bindFocus.call(me, content);
                _bindDataChange.call(me, content);
                if (!Modernizr.inputtypes.date) {
                    var zIndex = me.options.BaseZIndex + (formCount * 10);
                    content.find("input[type=date]").css("z-index", zIndex + 1);
                    content.find("input[type=date]").each(function (i, item) {
                        var opts = $(item).attr("data-date-options");
                        var options = JSON.parse(opts);
                        $(item).datepicker(options);
                    });
                }
                _checkForm.call(me);
            }
            if (typeof templates.template != undefined && templates.template != null) {
                // use local template

            } else {
                return $.when(
                    $U.AjaxGet({ url: templates.templateUrl })
                    ).then(function (r) {
                        // use r.Template
                        loadTemplate(r.Template);
                        if ($.isFunction(onload)) {
                            onload();
                        }
                    });
            }
        };
        frm.prototype.resetOriginalData = function () {
            var me = this;
            _saveOriginalData.call(me);
        }
    }
    $.fastnet$forms = {
        CreateForm: frm
    };
    $(function () {
        $T = this;
        $U = $.fastnet$utilities;
        //$.fastnet$forms.init();
    });
})(jQuery);