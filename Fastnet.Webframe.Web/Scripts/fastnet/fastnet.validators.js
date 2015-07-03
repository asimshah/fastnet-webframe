(function ($) {
    // Version 1.0.4
    var $U;
    function validator(f) {
        var $U = $.fastnet$utilities;
        var $V = $.fastnet$validators;
        this.form = f;
        this.validatedProperties = [];
        function validateIsRequired(form, val, errorMessage, errors) {
            var r = !(val === null || val === "");
            if (!r) {
                errors.push(errorMessage);
            }
            return r;
        }
        function validateEmailAddress(form, val, errorMessage, errors) {
            // ([\w-\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})
            //var emailReg = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
            var emailReg = new RegExp(/([\w-\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})/);
            var r = emailReg.test(val);
            if (!r) {
                errors.push(errorMessage);
            }
            return r;
        }
        function validatePasswordLength(form, val, errorMessage, errors) {
            var minlength = $U.options.MinimumPasswordLength || 8;// $T.options.ClientAction.MinimumPasswordLength;
            errorMessage = $U.Format(errorMessage, minlength);
            var r = val.length >= minlength;
            if (!r) {
                errors.push(errorMessage);
            }
            return r;
        }
        function validatePositiveInteger(form, val, errorMessage, errors, validator) {
            var r = /^[0-9]+$/.test(val);
            if (!r) {
                errors.push(errorMessage);
            }
            return r;
        }
        function validateIntegerInRange(form, val, errorMessage, errors, validator) {
            var minimum = validator.user.minimum;
            var maximum = validator.user.maximum;
            var number = parseInt(val);
            var r = true;
            if (typeof minimum !== "undefined" && minimum !== null) {
                r = number >= minimum;
            }
            if (r === true && typeof maximum !== "undefined" && maximum !== null) {
                r = number <= maximum;
            }
            if (!r) {
                errors.push(errorMessage);
            }
            return r;
        }
        function validateWithRegex(form, val, errorMessage, errors, validator) {
            // call with validator.user.regex set to the required regex pattern
            var regex = validator.user.regex instanceof RegExp ? validator.user.regex : new RegExp(validator.user.regex);
            var r = regex.test(val);
            if (!r) {
                errors.push(errorMessage);
            }
            return r;
        }
        function validatePasswordComplexity(form, val, errorMessage, errors) {
            // (?=^.{8,}$)(?=.*\d)(?=.*[$-/:-?{-~!"^_`\[\]\\])(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$
            var complexPassword = $U.options.RequireComplexPassword || false;// $T.options.ClientAction.RequireComplexPassword;
            var r = false;
            if (!complexPassword) {
                r = true;
            } else {
                var complexReg = new RegExp(/(?=^.{8,}$)(?=.*\d)(?=.*[$-/:-?{-~!"^_`\[\]\\])(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/);
                r = complexReg.test(val);
            }
            if (!r) {
                errors.push(errorMessage);
            }
            return r;
        }
        function validateConfirmPassword(form, val, errorMessage, errors, validator) {
            var compareWith = validator.user.compareWith;
            var password = form.getData(compareWith);// form.getData("password"); // can I do this without hardcoding "password"
            var r = !(val === null || val === "" || typeof password === "undefined" || password === null || val !== password);
            if (!r) {
                errors.push(errorMessage);
            }
            return r;
        }
        function serverValidateEmailAddressInUse(form, val, errorMessage, errors) {
            var deferred = new $.Deferred();
            $.when($U.AjaxGet({ url: "account/addressinuse?emailAddress=" + val }, true)
                ).then(function (data) {
                    //$U.Debug("validator with message \"{0}\" called", errorMessage);
                    if (data.InUse) {
                        deferred.resolve(true);
                    } else {
                        errors.push(errorMessage);
                        deferred.reject(false);
                    }
                });
            return deferred.promise();
        }
        function serverValidateEmailAddressNotInUse(form, val, errorMessage, errors) {
            var deferred = new $.Deferred();
            $.when($U.AjaxGet({ url: "account/addressinuse?emailAddress=" + val }, true)
                ).then(function (data) {
                    //$U.Debug("validator with message \"{0}\" called", errorMessage);
                    if (data.InUse) {
                        errors.push(errorMessage);
                        deferred.reject(false);
                    } else {
                        deferred.resolve(true);
                    }
                });
            return deferred.promise();
        }
        validator.prototype.AddValidator = function (dataItem, func, isDeferred, errorMessage, setIsRequired) {
            if (typeof setIsRequired === "undefined") {
                setIsRequired = false;
            }
            if (!$.inArray(dataItem, this.validatedProperties)) {
                this.validatedProperties.push(dataItem);
            }
            this.form.addValidator(dataItem, {
                func: func, setIsRequired: setIsRequired, isDeferred: isDeferred, errorMessage: errorMessage
            });
        };
        validator.prototype.AddIsRequired = function (dataItem, errorMessage) {
            this.AddValidator(dataItem, validateIsRequired, false, errorMessage, true);
            //this.form.addValidator(dataItem, {
            //    func: validateIsRequired, isDeferred: false, errorMessage: errorMessage
            //});
        };
        validator.prototype.AddEmailAddress = function (dataItem, errorMessage) {
            this.form.addValidator(dataItem, {
                func: validateEmailAddress, isDeferred: false, errorMessage: errorMessage
            });
        };
        validator.prototype.AddEmailAddressNotInUse = function (dataItem, errorMessage) {
            this.form.addValidator(dataItem, {
                func: serverValidateEmailAddressNotInUse, isDeferred: true, errorMessage: errorMessage
            });
        };
        validator.prototype.AddEmailAddressInUse = function (dataItem, errorMessage) {
            this.form.addValidator(dataItem, {
                func: serverValidateEmailAddressInUse, isDeferred: true, errorMessage: errorMessage
            });

        };
        validator.prototype.AddPasswordLength = function (dataItem, errorMessage) {
            this.form.addValidator(dataItem, {
                func: validatePasswordLength, isDeferred: false, errorMessage: errorMessage
            });
        },
        validator.prototype.AddPasswordComplexity = function (dataItem, errorMessage) {
            this.form.addValidator(dataItem, {
                func: validatePasswordComplexity, isDeferred: false, errorMessage: errorMessage
            });
        },
        validator.prototype.AddConfirmPassword = function (dataItem, errorMessage, compareWith) {
            this.form.addValidator(dataItem, {
                func: validateConfirmPassword, isDeferred: false, errorMessage: errorMessage, user: { compareWith: compareWith }
            });
        };
        validator.prototype.AddRegex = function (dataItem, errorMessage, regex) {
            this.form.addValidator(dataItem, {
                func: validateWithRegex, isDeferred: false, errorMessage: errorMessage, user: { regex: regex }
            });
        };
        validator.prototype.AddPositiveInteger = function (dataItem, errorMessage) {
            this.form.addValidator(dataItem, {
                func: validatePositiveInteger, isDeferred: false, errorMessage: errorMessage
            });
        };
        validator.prototype.AddIntegerInRange = function (dataItem, errorMessage, minimum, maximum) {
            this.form.addValidator(dataItem, {
                func: validateIntegerInRange, isDeferred: false, errorMessage: errorMessage, user: { minimum: minimum, maximum: maximum }
            });
        };
        validator.prototype.ClearValidator = function (dataItem) {
            var index = $.inArray(dataItem, this.validatedProperties);
            if (index > -1) {
                this.form.removeValidators(dataItem);
                this.validatedProperties.splice(index, 1);
            }
        };
        validator.prototype.ClearValidators = function () {
            $.each(this.validatedProperties, function (i, dataItem) {
                this.form.removeValidators(dataItem);
            });
            this.validatedProperties = [];
        };
    }
    $.fastnet$validators = {
        Create: validator,
        Init: function () {
            $U = $.fastnet$utilities;
        },
        //validateConfirmPassword: function (form, val, errorMessage, errors) {
        //    var password = form.getData("password"); // how do I this without hardcoding "password"
        //    var r = !(val === null || val === "" || typeof password === "undefined" || password === null || val !== password);
        //    if (!r) {
        //        errors.push(errorMessage);
        //    }
        //    return r;
        //},

        //serverValidateEmailAddressInUse: function (form, val, errorMessage, errors) {
        //    var deferred = new $.Deferred();
        //    $.when($U.AjaxGet({ url: "account/addressinuse?emailAddress=" + val }, true)
        //        ).then(function (data) {
        //            //$U.Debug("validator with message \"{0}\" called", errorMessage);
        //            if (data.InUse) {
        //                deferred.resolve(true);
        //            } else {
        //                errors.push(errorMessage);
        //                deferred.reject(false);
        //            }
        //        });
        //    return deferred.promise();
        //}
    };
    $(function () {
        $.fastnet$validators.Init();
    });
})(jQuery);
