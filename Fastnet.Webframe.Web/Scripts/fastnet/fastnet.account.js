(function ($) {
    var $T;
    var $U;
    $.fastnet$account = {
        onComplete: null,
        options: null,
        usingPopup: false,
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
            $F = $.fastnet$forms;
        },
        Start: function (options, onComplete) {
            $T.onComplete = onComplete;
            $T.options = options;
            switch ($T.options.ClientAction.Name) {
                case "login":
                    $T.Login.Start();
                    break;
                case "register":
                    $T.Registration.Start();
                    break;
                case "activationfailed":
                    $T.ActivationFailed.Start();
                    break;
                case "userprofile":
                    $T.UserProfile.Start();
                    break;
                case "passwordresetfailed":
                    $T.PasswordResetFailed.Start();
                    break;
                case "changepassword":
                    $T.ChangePassword.Start();
                    break;
                default:
                    var msg = $U.Format("$.fastnet$account: dialogue {0} not implemented", $T.options.ClientAction.Name);
                    $U.MessageBox(msg);
                    break;
            }
        },
        ActivationFailed: {
            Start: function () {
                var $this = this;
                $.when($F.LoadForm($this, "Activation Failed", "template/form/activationfailed", "identity-dialog activation-failed", $T.options)
                    ).then(function () {
                        $F.Bind({ afterItemValidation: null, onCommand: $this.OnCommand });
                        $F.Show();
                    });
            },
            OnCommand: function (ctx, cmd) {
                switch (cmd) {
                    default:
                        break;
                }
            }
        },
        ChangePassword:  {
            Start: function() {
                var $this = this;
                $.when($F.LoadForm($this, "Change Password", "template/form/changepassword", "identity-dialog changepassword", $T.options)
                    ).then(function () {
                        $F.AddValidation("password", $T.ValidateIsRequired, "A password is required");
                        $F.AddValidation("password", $T.ValidatePasswordLength, "Minimum length for a password is {0} chars");
                        $F.AddValidation("password", $T.ValidatePasswordComplexity, "At least one non-alphanumeric, one digit, one upper case and one lower case char is required");

                        $F.AddValidation("confirm-password", $T.ValidateConfirmPassword, "Passwords do not match");
                        $F.Bind({ afterItemValidation: $this.AfterItemValidation, onCommand: $this.OnCommand });
                        $F.DisableCommand("save-changes");
                        $F.Show();
                    });
            },
            OnCommand: function (ctx, cmd) {
                switch (cmd) {
                    case "save-changes":
                        ctx.SaveChanges(ctx);
                        break;
                }
            },
            AfterItemValidation: function (ctx, item, totalItems, totalWithState, totalErrors) {
                if (totalErrors > 0) {// || totalItems !== totalWithState) {
                    $F.DisableCommand("save-changes");
                } else {
                    $F.EnableCommand("save-changes");
                }
            },
            SaveChanges: function (ctx) {
                var emailAddress = $T.options.ClientAction.EmailAddress;
                var password = $F.GetFormData("password");
                var postData = { emailAddress: emailAddress, password: password };
                $.when(
                    $U.AjaxPost({ url: "account/passwordreset", data: postData })
                    ).then(function (result) {
                        var success = result.Success;
                        if (success) {
                            $F.Close();
                            if ($.isFunction($T.onComplete)) {
                                $T.onComplete();
                            }
                        } else {
                            $F.GetForm().find(".error").html(result.Error);
                        }
                    });
            }
        },
        Login: {
            Start: function () {
                var $this = this;
                $.when($F.LoadForm($this, "Login", "template/form/login", "identity-dialog login", $T.options)
                    ).then(function () {
                        $F.AddValidation("email", $T.ValidateIsRequired, "An email address is required");
                        $F.AddValidation("password", $T.ValidateIsRequired, "A password is required");
                        $F.Bind({ afterItemValidation: $this.AfterItemValidation, onCommand: $this.OnCommand });
                        $F.DisableCommand("login");
                        $F.Show();
                        //setTimeout(function () {
                        //    setTimeout(function () {
                        //        $F.UnBlock();
                        //    }, 5000);
                        //    $F.Block();
                        //}, 3000);
                    });

            },
            OnCommand: function (ctx, cmd) {
                switch (cmd) {
                    case "login":
                        ctx.Login(ctx);
                        break;
                    case "passwordreset":
                    case "register":
                        $T.SwitchDialogue(cmd);
                        break;
                }
            },
            AfterItemValidation: function (ctx, item, totalItems, totalWithState, totalErrors) {
                if (totalErrors > 0 || totalItems !== totalWithState) {
                    $F.DisableCommand("login");
                } else {
                    $F.EnableCommand("login");
                }
            },
            Login: function (ctx) {
                var emailAddress = $F.GetFormData("email");
                var password = $F.GetFormData("password");
                var postData = { emailAddress: emailAddress, password: password };
                $.when(
                    $U.AjaxPost({ url: "account/login", data: postData })
                    ).then(function (result) {
                        var success = result.Success;
                        if (success) {
                            $F.Close();
                            if ($.isFunction($T.onComplete)) {
                                $T.onComplete();
                            }
                        } else {
                            $F.GetForm().find(".error").html(result.Error);
                        }
                    });
            },
        },
        PasswordResetFailed: {
            Start: function () {
                var $this = this;
                $.when($F.LoadForm($this, "Password Reset Failed", "template/form/passwordresetfailed", "identity-dialog passwordreset-failed", $T.options)
                    ).then(function () {
                        $F.Bind({ afterItemValidation: null, onCommand: $this.OnCommand });
                        $F.Show();
                    });
            },
            OnCommand: function (ctx, cmd) {
                switch (cmd) {
                    default:
                        break;
                }
            }
        },
        Registration: {
            form: null,
            dataValues: {},
            validationFunctions: {},
            Start: function () {
                var $this = this;
                $.when($F.LoadForm($this, "Registration", "template/form/register", "identity-dialog registration", $T.options)
                    ).then(function () {
                        $F.AddValidation("email", $T.ValidateIsRequired, "An email address is required");
                        $F.AddValidation("email", $T.ValidateEmailAddress, "This is not a valid email address");
                        $F.AddValidation("email", $this.ValidEmailAddressNotInUse, "This email address is already in use");

                        $F.AddValidation("password", $T.ValidateIsRequired, "A password is required");
                        $F.AddValidation("password", $T.ValidatePasswordLength, "Minimum length for a password is {0} chars");
                        $F.AddValidation("password", $T.ValidatePasswordComplexity, "At least one non-alphanumeric, one digit, one upper case and one lower case char is required");

                        $F.AddValidation("confirm-password", $T.ValidateConfirmPassword, "Passwords do not match");
                        $F.AddValidation("first-name", $T.ValidateIsRequired, "A first name is required");
                        $F.AddValidation("last-name", $T.ValidateIsRequired, "A last name is required");

                        if ($T.options.Customer.Customer === "dwh") {
                            $F.AddValidation("date-of-birth", $T.ValidateIsRequired, "A date of birth is required in order to valid BMC membership");
                            $F.AddValidation("bmc-membership", $T.ValidateIsRequired, "BMC membership is required to register on this site");
                        }

                        $F.Bind({ afterItemValidation: $this.AfterItemValidation, onCommand: $this.OnCommand });
                        $F.DisableCommand("register");
                        $F.Show();
                    });
            },
            OnCommand: function (ctx, cmd) {
                switch (cmd) {
                    case "register":
                        ctx.Register(ctx);
                        break;
                    case "registration-close":
                        if ($.isFunction($T.onComplete)) {
                            $T.onComplete();
                        }
                        break;
                }
            },
            AfterItemValidation: function (ctx, item, totalItems, totalWithState, totalErrors) {
                if (totalErrors > 0 || totalItems !== totalWithState) {
                    $F.DisableCommand("register");
                } else {
                    $F.EnableCommand("register");
                }
            },
            Confirmation: function (emailaddress) {
                var $this = this;
                $.when($F.LoadForm($this, "Registration Confirmed", "template/form/registrationconfirmation", "identity-dialog registration", $T.options, { EmailAddress: emailaddress })
                    ).then(function () {
                        $F.Bind({ afterItemValidation: null, onCommand: $this.OnCommand });
                        $F.Show();
                    });
            },
            Register: function (ctx) {
                // gather data
                var emailAddress = $F.GetFormData("email");
                var password = $F.GetFormData("password");
                var firstName = $F.GetFormData("first-name");
                var lastName = $F.GetFormData("last-name");
                var postData = { emailAddress: emailAddress, password: password, firstName: firstName, lastName: lastName };
                if ($T.options.Customer === "dwh") {
                    var dateOfBirth = $F.GetFormData("date-of-birth");
                    var bmcMembership = $F.GetFormData("bmc-membership");
                    postData["dateOfBirth"] = dateOfBirth;
                    postData["bmcMembership"] = bmcMembership;
                }
                $F.Block();
                $.when(
                    $U.AjaxPost({ url: "account/register", data: postData })
                    ).then(function (result) {
                        $F.UnBlock();
                        var success = result.Success;
                        if (success) {
                            $F.Close();
                            ctx.Confirmation(emailAddress);
                            //if ($.isFunction($T.onComplete)) {
                            //    $T.onComplete();
                            //}
                        } else {
                            $F.GetForm().find(".error").html(result.Error);
                        }
                    });
            },
            ValidEmailAddressNotInUse: function (ctx, val, formitem, errorMessage) {
                return $.when($U.AjaxGet({ url: "account/addressinuse?emailAddress=" + val })
                    ).then(function (data) {
                        var inUse = data.InUse;
                        return $F.ApplyValidation(formitem, function () {
                            return !inUse;
                        }, errorMessage);
                    });
            }
        },
        ResetPassword: {
            Start: function () {
                var $this = this;
                $.when($F.LoadForm($this, "Password Reset", "template/form/passwordreset", "identity-dialog passwordreset", $T.options)
                    ).then(function () {
                        $F.AddValidation("email", $T.ValidateIsRequired, "An email address is required");
                        $F.AddValidation("email", $T.ValidateEmailAddress, "This is not a valid email address");
                        $F.AddValidation("email", $this.ValidEmailAddressInUse, "This email address not recognised");
                        $F.Bind({ afterItemValidation: $this.AfterItemValidation, onCommand: $this.OnCommand });
                        $F.DisableCommand("request-reset");
                        $F.Show();
                    });
            },
            AfterItemValidation: function (ctx, item, totalItems, totalWithState, totalErrors) {
                if (totalErrors > 0) {
                    $F.DisableCommand("request-reset");
                } else {
                    $F.EnableCommand("request-reset");
                }
            },
            Confirmation: function (emailaddress) {
                var $this = this;
                $.when($F.LoadForm($this, "Reset Email Sent", "template/form/passwordresetconfirmation", "identity-dialog passwordresetconfirmation", $T.options, { EmailAddress: emailaddress })
                    ).then(function () {
                        $F.Bind({ afterItemValidation: null, onCommand: $this.OnCommand });
                        $F.Show();
                    });
            },
            OnCommand: function (ctx, cmd) {
                switch (cmd) {
                    case "request-reset":
                        ctx.RequestPasswordReset(ctx);
                        break;
                    case "request-reset-close":
                        if ($.isFunction($T.onComplete)) {
                            $T.onComplete();
                        }
                }
            },
            RequestPasswordReset: function(ctx) {
                var emailAddress = $F.GetFormData("email");
                var postData = { emailAddress: emailAddress };
                $F.Block();
                $.when($U.AjaxPost({ url: "account/requestpasswordreset", data: postData })
                    ).then(function (result) {
                        $F.UnBlock();
                        var success = result.Success;
                        if (success) {
                            $F.Close();
                            ctx.Confirmation(emailAddress);
                        } else {
                            $F.GetForm().find(".error").html(result.Error);
                        }
                    });
            },
            ValidEmailAddressInUse: function (ctx, val, formitem, errorMessage) {
                return $.when($U.AjaxGet({ url: "account/addressinuse?emailAddress=" + val })
                    ).then(function (data) {
                        var inUse = data.InUse;
                        return $F.ApplyValidation(formitem, function () {
                            return inUse;
                        }, errorMessage);
                    });
            }
        },
        UserProfile: {
            emailAddress: null,
            Start: function () {
                var $this = this;
                var url = "model/permitted/userprofile";
                $.when($U.AjaxGet({ url: url })
                    ).then(function (result) {
                        if (result.Permitted) {
                            url = "model/userprofile";
                            $.when($U.AjaxGet({ url: url })).then(function (r) {
                                $T.options = r;
                                $this.emailAddress = $T.options.ClientAction.EmailAddress;
                                $.when($F.LoadForm($this, "User Profile", "template/form/userprofile", "identity-dialog uerprofile", $T.options, $T.options.ClientAction)
                                    ).then(function () {
                                        $F.AddValidation("first-name", $T.ValidateIsRequired, "A first name is required");
                                        $F.AddValidation("last-name", $T.ValidateIsRequired, "A last name is required");
                                        $F.Bind({ afterItemValidation: $this.AfterItemValidation, onCommand: $this.OnCommand });
                                        $F.DisableCommand("save-changes");
                                        $F.Show();
                                    });
                            });
                        } else {
                            $U.MessageBox("Please login first.");
                        }
                    });
            },
            AfterItemValidation: function (ctx, item, totalItems, totalWithState, totalErrors) {
                if (totalErrors > 0) {// || totalItems !== totalWithState) {
                    $F.DisableCommand("save-changes");
                } else {
                    $F.EnableCommand("save-changes");
                }
            },
            OnCommand: function (ctx, cmd) {
                switch (cmd) {
                    case "save-changes":
                        ctx.SaveChanges(ctx);
                        break;
                }
            },
            SaveChanges: function (ctx) {
                var firstName = $F.GetFormData("first-name");
                var lastName = $F.GetFormData("last-name");
                var emailAddress = ctx.emailAddress;
                $U.Debug("save {0} {1} {2}", emailAddress, firstName, lastName);
                var postData = { emailAddress: emailAddress, firstName: firstName, lastName: lastName };
                $.when(
                    $U.AjaxPost({ url: "account/updateuser", data: postData })
                    ).then(function (result) {
                        var success = result.Success;
                        if (success) {
                            $F.Close();
                        } else {
                            $F.GetForm().find(".error").html(result.Error);
                        }
                    });
            }
        },
        SwitchDialogue: function (dialoguename) {
            var url = $U.Format("model/{0}", dialoguename);
            $.when($U.AjaxGet({ url: url })).then(function (r) {
                $T.options = r;
                switch (dialoguename) {
                    case "register":
                        $T.Registration.Start();
                        break;
                    case "passwordreset":
                        $T.ResetPassword.Start();
                        break;
                }
            });
        },
        ValidateConfirmPassword: function (ctx, val, formitem, errorMessage) {
            var password = $F.GetFormData("password");// ctx.dataValues["password"];
            return $F.ApplyValidation(formitem, function () {
                var result = val === null || val === "" || typeof password === "undefined" || password === null;
                if (!result) {
                    result = val === password;
                }
                return result;
            }, errorMessage);
        },
        ValidatePasswordLength: function (ctx, val, formitem, errorMessage) {
            var minlength = $T.options.ClientAction.MinimumPasswordLength;
            var errorMessage = $U.Format(errorMessage, minlength);
            return $F.ApplyValidation(formitem, function () {
                return val.length >= minlength;
            }, errorMessage);
        },
        ValidatePasswordComplexity: function (ctx, val, formitem, errorMessage) {
            // (?=^.{8,}$)(?=.*\d)(?=.*[$-/:-?{-~!"^_`\[\]\\])(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$
            var complexPassword = $T.options.ClientAction.RequireComplexPassword;
            return $F.ApplyValidation(formitem, function () {
                if (!complexPassword) {
                    return true;
                } else {
                    var complexReg = new RegExp(/(?=^.{8,}$)(?=.*\d)(?=.*[$-/:-?{-~!"^_`\[\]\\])(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/);
                    return complexReg.test(val);
                }
            }, errorMessage);
        },
        ValidateIsRequired: function (ctx, val, formitem, errorMessage) {
            return $F.ApplyValidation(formitem, function () {
                return !(val === null || val === "");
            }, errorMessage);
        },
        ValidateEmailAddress: function (ctx, email, formitem, errorMessage) {
            var message = formitem.find(".message");
            var deferred = $.Deferred();
            //var r = false;
            // ([\w-\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})
            //var emailReg = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
            var emailReg = new RegExp(/([\w-\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})/);
            return $F.ApplyValidation(formitem, function () {
                return emailReg.test(email);
            }, errorMessage);
        },
    };
    $(function () {
        $.fastnet$account.Init();
    });
})(jQuery);