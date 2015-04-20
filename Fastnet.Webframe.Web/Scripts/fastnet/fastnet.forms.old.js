﻿(function ($) {
    var $T;
    var $U;
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
            $.when.apply($, funcs).then(function (args) {
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
        $.fastnet$forms.init();
        //debugger;
    });
})(jQuery);