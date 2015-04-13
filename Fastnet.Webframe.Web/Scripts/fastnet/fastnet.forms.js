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
    $.fastnet$forms = {
        context: null,
        errors: null,
        form: null,
        isModal: null,
        options: null,
        dataValues: {},
        validationFunctions: {},
        afterItemValidation: null,
        onCommand: null,
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
                } else {
                    e.preventDefault();
                    if ($T.onCommand !== null) {
                        $T.onCommand($T.context, cmd);
                    }
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
        GetForm: function() {
            return $T.form;
        },
        GetFormData: function(item) {
            return $T.dataValues[item];
        },
        LoadForm: function (context, title, templateUrl, bodyClass, options, data) {
            var isModal = options.ClientAction.IsModal;
            var formTemplate = isModal ? "template/form/modalform" : "template/form/form";
            return $.when(
                $U.AjaxGet({ url: formTemplate }),
                $U.AjaxGet({ url: templateUrl })
                ).then(function (mf, tmpl) {
                    $T.initialise2();
                    $T.context = context;
                    $T.options = options;
                    $T.isModal = isModal;
                    var formData = { Title: title, BodyClasses: bodyClass };
                    $.extend(formData, options.ClientAction);
                    if (typeof data !== "undefined" && data !== null) {
                        $.extend(formData, data);
                    }
                    //$T.form = $T.createForm(mf[0].Template, tmpl[0].Template, { Title: title, BodyClasses: bodyClass });
                    $T.form = $T.createForm(mf[0].Template, tmpl[0].Template, formData);
                });
        },
        Show: function () {
            if ($T.isModal) {
                $T.form.modal();
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
    };
    $(function () {
        $.fastnet$forms.init();
    });
})(jQuery);