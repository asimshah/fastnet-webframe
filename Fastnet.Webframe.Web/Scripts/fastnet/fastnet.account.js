(function ($) {
    var $T;
    var $U;
    function updateCurrentUserDisplay() {
        //setTimeout(function () {
        //    $.when(
        //    $U.AjaxGet({ url: "account/currentuser" }, true)
        //    ).then(function (r) {
        //        if (r.Authenticated) {
        //            var userEmailAddress = r.EmailAddress;
        //            var userName = r.Name;
        //            $(".login-name").html(userName).removeClass('hide');
        //        } else {
        //            $(".login-name").addClass('hide').html("");
        //        }
        //    });
        //}, 0);
        $.when(
        $U.AjaxGet({ url: "account/currentuser" }, true)
        ).then(function (r) {
            if (r.Authenticated) {
                var userEmailAddress = r.EmailAddress;
                var userName = r.Name;
                $(".login-name").html(userName).removeClass('hide');
            } else {
                $(".login-name").addClass('hide').html("");
            }
        });
    };
    function validateEmailAddress(form, email, errorMessage, errors) {
        // ([\w-\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})
        //var emailReg = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
        var emailReg = new RegExp(/([\w-\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})/);
        var r = emailReg.test(email);
        if (!r) {
            errors.push(errorMessage);
        }
        return r;
    };
    function validEmailAddressNotInUse(form, val, errorMessage, errors) {
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
    };
    function validEmailAddressInUse(form, val, errorMessage, errors) {
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
    };
    function validatePasswordComplexity(form, val, errorMessage, errors) {
        // (?=^.{8,}$)(?=.*\d)(?=.*[$-/:-?{-~!"^_`\[\]\\])(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$
        var complexPassword = $T.options.ClientAction.RequireComplexPassword;
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
    };
    function validatePasswordLength(form, val, errorMessage, errors) {
        var minlength = $T.options.ClientAction.MinimumPasswordLength;
        var errorMessage = $U.Format(errorMessage, minlength);
        var r = val.length >= minlength;
        if (!r) {
            errors.push(errorMessage);
        }
        return r;
    };
    function validateConfirmPassword(form, val, errorMessage, errors) {
        var password = form.getData("password");// $F.GetFormData("password");// ctx.dataValues["password"];
        var r = !(val === null || val === "" || typeof password === "undefined" || password === null || val !== password);
        if (!r) {
            errors.push(errorMessage);
        }
        return r;
    };
    function _loadModel(name, onComplete) {
        var url = $U.Format("model/{0}", name);
        $.when($U.AjaxGet({ url: url }, true)
            ).then(function (r) {
                $T.options = r;
                if (typeof onComplete !== "undefined" && $.isFunction(onComplete)) {
                    onComplete();
                }
            });
    }
    $.fastnet$account = {
        onComplete: null,
        options: null,
        usingPopup: false,
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
            //$F = $.fastnet$forms;
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
                case "activationsuccessful":
                    $T.ActivationSuccessful.Start();
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
        ActivationSuccessful: {
            Start: function () {
                // var asf = new $.fastnet$forms.CreateForm("template/form/activationsuccessful", {
                var asf = new $.fastnet$forms.CreateForm("template/get/main-forms-account/activationsuccessful", {
                    Title: "Activation Successful",
                    OnCommand: function (f, cmd) {
                        switch (cmd) {
                            case "close":
                                asf.close();
                                break;
                        }
                    }
                }, {});
                asf.show();
            }
        },
        ActivationFailed: {
            Start: function () {
                var aff = new $.fastnet$forms.CreateForm("template/get/main-forms-account/activationfailed", {
                    Title: "Activation Failed",
                    //AdminEmailAddress: $T.options.ClientAction.AdminEmailAddress,
                    OnCommand: function (f, cmd) {

                    }
                }, { AdminEmailAddress: $T.options.ClientAction.AdminEmailAddress });
                aff.show();
            }
        },
        ChangePassword: {
            Start: function () {
                function changePassword(cpf) {
                    var emailAddress = $T.options.ClientAction.EmailAddress;
                    var data = cpf.getData();
                    var password = data.password;// $F.GetFormData("password");
                    var postData = { emailAddress: emailAddress, password: password };
                    $.when(
                        $U.AjaxPost({ url: "account/passwordreset", data: postData })
                        ).then(function (result) {
                            var success = result.Success;
                            if (success) {
                                cpf.close();
                                //$F.Close();
                                //if ($.isFunction($T.onComplete)) {
                                //    $T.onComplete();
                                //}
                            } else {
                                cpf.find(".error").html(result.Error);
                                //$F.GetForm().find(".error").html(result.Error);
                            }
                        });
                }
                var cpf = new $.fastnet$forms.CreateForm("template/get/main-forms-account/changepassword", {
                    Title: "Change Password",
                    //EmailAddress: $T.options.ClientAction.EmailAddress,
                    AfterItemValidation: function (r) {
                        if (cpf.isValid() === true) {
                            cpf.enableCommand("save-changes");
                        } else {
                            cpf.disableCommand("save-changes");
                        }
                    },
                    OnCommand: function (f, cmd) {
                        switch (cmd) {
                            case "save-changes":
                                changePassword(cpf);
                                break;
                        }
                    }
                }, { EmailAddress: $T.options.ClientAction.EmailAddress });
                var validator = new $.fastnet$validators.Create(cpf);
                validator.AddIsRequired("password", "A password is required");
                //cpf.addIsRequiredValidator("password", "A password is required");
                validator.AddPasswordLength("password", "Minimum length for a password is {0} chars");
                validator.AddPasswordComplexity("password", "At least one non-alphanumeric, one digit, one upper case and one lower case char is required");
                //cpf.addValidators("password", [
                //    {
                //        func: validatePasswordLength,
                //        isDeferred: false,
                //        errorMessage: "Minimum length for a password is {0} chars"
                //    },
                //    {
                //        func: validatePasswordComplexity,
                //        isDeferred: true,
                //        errorMessage: "At least one non-alphanumeric, one digit, one upper case and one lower case char is required"
                //    }
                //]);
                validator.AddConfirmPassword("confirm-password", "Passwords do not match", "password");
                //cpf.addValidator("confirm-password",
                //    {
                //        func: validateConfirmPassword,
                //        isDeferred: false,
                //        errorMessage: "Passwords do not match"
                //    }
                //);
                cpf.disableCommand("save-changes");
                cpf.show();
                //var $this = this;
                //$.when($F.LoadForm($this, "Change Password", "template/form/changepassword", "identity-dialog changepassword", $T.options)
                //    ).then(function () {
                //        $F.AddValidation("password", $T.ValidateIsRequired, "A password is required");
                //        $F.AddValidation("password", $T.ValidatePasswordLength, "Minimum length for a password is {0} chars");
                //        $F.AddValidation("password", $T.ValidatePasswordComplexity, "At least one non-alphanumeric, one digit, one upper case and one lower case char is required");

                //        $F.AddValidation("confirm-password", $T.ValidateConfirmPassword, "Passwords do not match");
                //        $F.Bind({ afterItemValidation: $this.AfterItemValidation, onCommand: $this.OnCommand });
                //        $F.DisableCommand("save-changes");
                //        $F.Show();
                //    });
            },
        },
        Login: {
            Start: function () {
                function login(lf) {
                    var data = lf.getData();
                    var emailAddress = data.email;
                    var password = data.password;
                    var postData = { emailAddress: emailAddress, password: password };
                    $.when(
                        $U.AjaxPost({ url: "account/login", data: postData })
                        ).then(function (result) {
                            var success = result.Success;
                            if (success) {
                                lf.close();
                                location.reload(true);
                                updateCurrentUserDisplay();
                                //if ($.isFunction($T.onComplete)) {
                                //    $T.onComplete();
                                //}
                            } else {
                                lf.find(".error").html(result.Error);
                            }
                        });
                };
                //var lf = new $.fastnet$forms.CreateForm("template/form/login", {
                var lf = new $.fastnet$forms.CreateForm("template/get/main-forms-account/login", {
                    Title: "Login",
                    OnCommand: function (f, cmd) {
                        switch (cmd) {
                            case "login":
                                login(lf);
                                //ctx.Login(ctx);
                                break;
                            case "passwordreset":
                                lf.close();
                                _loadModel("passwordreset", $T.ResetPassword.Start);
                                break;
                            case "register":
                                //var url = $U.Format("model/{0}", dialoguename);
                                lf.close();
                                _loadModel("register", $T.Registration.Start);
                                //$T.SwitchDialogue(cmd);
                                break;
                        }
                    },
                    AfterItemValidation: function (r) {
                        if (lf.isValid() === true) {
                            lf.enableCommand("login");
                        } else {
                            lf.disableCommand("login");
                        }
                    }
                }, {});
                var validator = new $.fastnet$validators.Create(lf);
                validator.AddIsRequired("email", "An email address is required");
                //lf.addIsRequiredValidator("email", "An email address is required");
                validator.AddIsRequired("password", "A password is required");
                //lf.addIsRequiredValidator("password", "A password is required");
                lf.disableCommand("login");
                lf.show();
                //var $this = this;
                //$.when($F.LoadForm($this, "Login", "template/form/login", "identity-dialog login", $T.options)
                //    ).then(function () {
                //        $F.AddValidation("email", $T.ValidateIsRequired, "An email address is required");
                //        $F.AddValidation("password", $T.ValidateIsRequired, "A password is required");
                //        $F.Bind({ afterItemValidation: $this.AfterItemValidation, onCommand: $this.OnCommand });
                //        $F.DisableCommand("login");
                //        $F.Show();
                //    });
            },
        },
        PasswordResetFailed: {
            Start: function () {
                var prff = new $.fastnet$forms.CreateForm("template/get/main-forms-account/passwordresetfailed", {
                    Title: "Password Reset Failed"//,
                    //AdminEmailAddress: $T.options.ClientAction.AdminEmailAddress
                }, { AdminEmailAddress: $T.options.ClientAction.AdminEmailAddress });
                prff.show();
                //var $this = this;
                //$.when($F.LoadForm($this, "Password Reset Failed", "template/form/passwordresetfailed", "identity-dialog passwordreset-failed", $T.options)
                //    ).then(function () {
                //        $F.Bind({ afterItemValidation: null, onCommand: $this.OnCommand });
                //        $F.Show();
                //    });
            },
        },
        Registration: {
            //form: null,
            //dataValues: {},
            //validationFunctions: {},
            Start: function () {
                function register(f) {
                    // gather data
                    var data = f.getData();
                    var emailAddress = data.email;// $F.GetFormData("email");
                    var password = data.password;//$F.GetFormData("password");
                    var firstName = data["first-name"];//$F.GetFormData("first-name");
                    var lastName = data["last-name"];//$F.GetFormData("last-name");
                    var postData = { emailAddress: emailAddress, password: password, firstName: firstName, lastName: lastName };
                    //if ($T.options.Customer === "dwh") {
                    //    var dateOfBirth = $F.GetFormData("date-of-birth");
                    //    var bmcMembership = $F.GetFormData("bmc-membership");
                    //    postData["dateOfBirth"] = dateOfBirth;
                    //    postData["bmcMembership"] = bmcMembership;
                    //}
                    f.block();
                    $.when(
                        $U.AjaxPost({ url: "account/register", data: postData })
                        ).then(function (result) {
                            f.unBlock();
                            var success = result.Success;
                            if (success) {
                                f.close();
                                var cf = new $.fastnet$forms.CreateForm("template/get/main-forms-account/registrationconfirmation", {
                                    Title: "Registration Confirmed",
                                    //EmailAddress: emailAddress,
                                    OnCommand: function (tf, cmd) {
                                        switch (cmd) {
                                            case "registration-close":
                                                cf.close();
                                                break;
                                        }
                                    }
                                }, { EmailAddress: emailAddress});
                                cf.show();
                            } else {
                                f.find(".error").html(result.Error);
                            }
                        });
                };
                //var rf = new $.fastnet$form("template/form/register", {
                //    Title: "Registration",
                //    AfterItemValidation: function (r) {
                //        if (rf.isValid() === true) {
                //            rf.enableCommand("register");
                //        } else {
                //            rf.disableCommand("register");
                //        }
                //    },
                //    OnCommand: function (form, cmd) {
                //        switch (cmd) {
                //            case "register":
                //                register(form);
                //                break;
                //            case "registration-close":
                //                if ($.isFunction($T.onComplete)) {
                //                    $T.onComplete();
                //                }
                //                break;
                //        }
                //    }
                //});
                var rf = new $.fastnet$forms.CreateForm("template/get/main-forms-account/register", {
                    Title: "Registration",
                    AfterItemValidation: function (r) {
                        if (rf.isValid() === true) {
                            rf.enableCommand("register");
                        } else {
                            rf.disableCommand("register");
                        }
                    },
                    OnCommand: function (form, cmd) {
                        switch (cmd) {
                            case "register":
                                register(form);
                                break;
                            case "registration-close":
                                if ($.isFunction($T.onComplete)) {
                                    $T.onComplete();
                                }
                                break;
                        }
                    }
                }, {});
                var validator = new $.fastnet$validators.Create(rf);
                validator.AddIsRequired("email", "An email address is required");
                validator.AddEmailAddress("email", "This is not a valid email address");
                validator.AddEmailAddressNotInUse("email", "This email address is already in use");
                //rf.addIsRequiredValidator("email", "An email address is required");
                //rf.addValidators("email", [
                //    {
                //        func: validateEmailAddress,
                //        isDeferred: false,
                //        errorMessage: "This is not a valid email address"
                //    },
                //    {
                //        func: validEmailAddressNotInUse,
                //        isDeferred: true,
                //        errorMessage: "This email address is already in use"
                //    }
                //]);
                validator.AddIsRequired("password", "A password is required");
                //rf.addIsRequiredValidator("password", "A password is required");
                validator.AddPasswordLength("password", "Minimum length for a password is {0} chars");
                validator.AddPasswordComplexity("password", "At least one non-alphanumeric, one digit, one upper case and one lower case char is required");
                //rf.addValidators("password", [
                //    {
                //        func: validatePasswordLength,
                //        isDeferred: false,
                //        errorMessage: "Minimum length for a password is {0} chars"
                //    },
                //    {
                //        func: validatePasswordComplexity,
                //        isDeferred: true,
                //        errorMessage: "At least one non-alphanumeric, one digit, one upper case and one lower case char is required"
                //    }
                //]);
                validator.AddConfirmPassword("confirm-password", "Passwords do not match", "password");
                //rf.addValidator("confirm-password",
                //    {
                //        func: validateConfirmPassword,
                //        isDeferred: false,
                //        errorMessage: "Passwords do not match"
                //    }
                //);
                validator.AddIsRequired("first-name", "A first name is required");
                //rf.addIsRequiredValidator("first-name", "A first name is required");
                validator.AddIsRequired("last-name", "A last name is required");
                //rf.addIsRequiredValidator("last-name", "A last name is required");
                rf.disableCommand("register");
                rf.show();
            },
        },
        ResetPassword: {
            Start: function () {
                function requestPasswordResetEmail(f) {
                    var data = f.getData();
                    var emailAddress = data.email;// $F.GetFormData("email");
                    var postData = { emailAddress: emailAddress };
                    f.block();
                    $.when($U.AjaxPost({ url: "account/requestpasswordreset", data: postData })
                        ).then(function (result) {
                            f.unBlock();
                            var success = result.Success;
                            if (success) {
                                f.close();
                                //ctx.Confirmation(emailAddress);
                                var cf = new $.fastnet$forms.CreateForm("template/get/main-forms-account/passwordresetconfirmation", {
                                    Title: "Reset Email Sent",
                                    //EmailAddress: emailAddress,
                                    OnCommand: function (tf, cmd) {
                                        switch (cmd) {
                                            case "request-reset-close":
                                                cf.close();
                                                break;
                                        }
                                    }
                                }, { EmailAddress: emailAddress});
                                cf.show();
                            } else {
                                f.find(".error").html(result.Error);
                            }
                        });
                };
                var rpf = new $.fastnet$forms.CreateForm("template/get/main-forms-account/passwordreset", {
                    Title: "Password Reset",
                    AfterItemValidation: function (r) {
                        if (rpf.isValid() === true) {
                            rpf.enableCommand("request-reset");
                        } else {
                            rpf.disableCommand("request-reset");
                        }
                    },
                    OnCommand: function (form, cmd) {
                        switch (cmd) {
                            case "request-reset":
                                requestPasswordResetEmail(rpf);
                                break;
                        }
                    }
                }, {});
                var validator = new $.fastnet$validators.Create(rpf);
                validator.AddIsRequired("email", "An email address is required");
                //rpf.addIsRequiredValidator("email", "An email address is required");
                validator.AddEmailAddress("email", "This is not a valid email address");
                validator.AddEmailAddressInUse("email", "This email address not recognised");
                //rpf.addValidators("email", [
                //    {
                //        func: validateEmailAddress,
                //        isDeferred: false,
                //        errorMessage: "This is not a valid email address"
                //    },
                //    {
                //        func: validEmailAddressInUse,
                //        isDeferred: true,
                //        errorMessage: "This email address not recognised"
                //    }
                //]);
                rpf.disableCommand("request-reset");
                rpf.show();
                //var $this = this;
                //$.when($F.LoadForm($this, "Password Reset", "template/form/passwordreset", "identity-dialog passwordreset", $T.options)
                //    ).then(function () {
                //        $F.AddValidation("email", $T.ValidateIsRequired, "An email address is required");
                //        $F.AddValidation("email", $T.ValidateEmailAddress, "This is not a valid email address");
                //        $F.AddValidation("email", $this.ValidEmailAddressInUse, "This email address not recognised");
                //        $F.Bind({ afterItemValidation: $this.AfterItemValidation, onCommand: $this.OnCommand });
                //        $F.DisableCommand("request-reset");
                //        $F.Show();
                //    });
            },
        },
        UserProfile: {
            emailAddress: null,
            Start: function () {
                function updateUserProfile(upf) {
                    var data = upf.getData();
                    var firstName = data["first-name"];//$F.GetFormData("first-name");
                    var lastName = data["last-name"];//$F.GetFormData("last-name");
                    var emailAddress = $T.options.ClientAction.EmailAddress;//ctx.emailAddress;
                    //$U.Debug("save {0} {1} {2}", emailAddress, firstName, lastName);
                    var postData = { emailAddress: emailAddress, firstName: firstName, lastName: lastName };
                    $.when(
                        $U.AjaxPost({ url: "account/updateuser", data: postData })
                        ).then(function (result) {
                            var success = result.Success;
                            if (success) {
                                updateCurrentUserDisplay();
                                upf.close();
                                //$F.Close();
                            } else {
                                upf.find(".error").html(result.Error);
                                //$F.GetForm().find(".error").html(result.Error);
                            }
                        });
                }
                var $this = this;
                var url = "model/permitted/userprofile";
                $.when($U.AjaxGet({ url: url }, true)
                    ).then(function (result) {
                        if (result.Permitted) {
                            _loadModel("userprofile", function () {
                                var upf = new $.fastnet$forms.CreateForm("template/get/main-forms-account/userprofile", {
                                    Title: "User Profile",
                                    //EmailAddress: $T.options.ClientAction.EmailAddress,
                                    //FirstName: $T.options.ClientAction.FirstName,
                                    //LastName: $T.options.ClientAction.LastName,
                                    AfterItemValidation: function (r) {
                                        if (upf.isValid() === true) {
                                            upf.enableCommand("save-changes");
                                        } else {
                                            upf.disableCommand("save-changes");
                                        }
                                    },
                                    OnCommand: function (f, cmd) {
                                        switch (cmd) {
                                            case "save-changes":
                                                updateUserProfile(upf);
                                                break;
                                        }
                                    }
                                }, {
                                    EmailAddress: $T.options.ClientAction.EmailAddress,
                                    FirstName: $T.options.ClientAction.FirstName,
                                    LastName: $T.options.ClientAction.LastName
                                });
                                var validator = new $.fastnet$validators.Create(upf);
                                validator.AddIsRequired("first-name", "A first name is required");
                                //upf.addIsRequiredValidator("first-name", "A first name is required");
                                validator.AddIsRequired("last-name", "A last name is required");
                                //upf.addIsRequiredValidator("last-name", "A last name is required");
                                upf.disableCommand("save-changes");
                                upf.show();
                            });
                            //url = "model/userprofile";
                            //$.when($U.AjaxGet({ url: url })).then(function (r) {
                            //    var upf = new $.fastnet$form("template/form/userprofile", {
                            //        Title: "User Profile",
                            //        EmailAddress: $T.options.ClientAction.EmailAddress
                            //    });
                            //    $T.options = r;
                            //    $this.emailAddress = $T.options.ClientAction.EmailAddress;
                            //    $.when($F.LoadForm($this, "User Profile", "template/form/userprofile", "identity-dialog uerprofile", $T.options, $T.options.ClientAction)
                            //        ).then(function () {
                            //            $F.AddValidation("first-name", $T.ValidateIsRequired, "A first name is required");
                            //            $F.AddValidation("last-name", $T.ValidateIsRequired, "A last name is required");
                            //            $F.Bind({ afterItemValidation: $this.AfterItemValidation, onCommand: $this.OnCommand });
                            //            $F.DisableCommand("save-changes");
                            //            $F.Show();
                            //        });
                            //});
                        } else {
                            $U.MessageBox("Please login first.");
                        }
                    });
            },
        },
    };
    $(function () {
        $.fastnet$account.Init();
    });
})(jQuery);