(function ($) {
    $.webframe$membership = function membership() {
        var currentForm = null;
        var subformName = null; 
        var validator = null;
        var mode = { newMember: false};
        var memberItemTemplate =
            "    <div class='member' data-member-id='{{Id}}'>" +
            "        <span>{{Name}}</span>" +
            "        <span class='fa fa-ban {{#IsDisabled}}disabled{{/IsDisabled}}' title='Member is disabled'></span>" +
            "        <span class='fa fa-clock-o {{#EmailConfirmed}}email-confirmed{{/EmailConfirmed}}' title='Waiting for email confirmation'></span>" +
            "    </div>";
        var memberItemTemplateOld =
            "<div >" +
            "{{#data}}" +
            "    <div class='member' data-member-id='{{Id}}'>" +
            "        <span>{{Name}}</span>" +
            "        <span class='fa fa-ban {{#IsDisabled}}disabled{{/IsDisabled}}' title='Member is disabled'></span>" +
            "        <span class='fa fa-clock-o {{#EmailConfirmed}}email-confirmed{{/EmailConfirmed}}' title='Waiting for email confirmation'></span>" +
            "    </div>" +
            "{{/data}}" +
            "</div>";
        var resetIndexTabs = function () {
            $(".member-manager .lookup-panel .member-index button[data-cmd='search-char']").removeClass("btn-warning").addClass("btn-primary");
        };
        var closeSubform = function () {
            currentForm.find(".details-panel").off().empty();
            if (validator != null) {
                validator.ClearValidators();
            }
            subformName = null;
        }
        function switchToDetails() {
            $(".details-panel").addClass("active");
            $(".lookup-panel").removeClass("active");
        }
        function switchToLookup() {
            $(".lookup-panel").addClass("active");
            $(".details-panel").removeClass("active");
        }
        var clearMemberList = function () {
            $(".member-manager .lookup-panel .member-list").off();
            $(".member-manager .lookup-panel .member-list").empty();
        };
        function loadMemberDetailsForm(data, onComplete) {
            var validator = new $.fastnet$validators.Create(currentForm);
            currentForm.loadSubform(".details-panel", { templateUrl: "template/get/membership-forms/memberdetails" }, data, function () {
                if ($U.options.VisiblePassword) {
                    var passwordElement = currentForm.find("input[data-item='password']");
                    passwordElement.closest('[data-property]').removeClass('hide');
                    if ($U.options.EditablePassword) {
                        passwordElement.removeAttr('disabled');
                        validator.AddIsRequired("password", "A password is required");
                        validator.AddPasswordLength("password", "Minimum password length is {0}");
                        validator.AddPasswordComplexity("password", "At least one non-alphanumeric, one digit, one upper case and one lower case char is required");
                    }
                    
                    validator.AddIsRequired("email-address", "An email address is required");
                    validator.AddEmailAddress("email-address", "This is not a valid email address");
                    validator.AddEmailAddressNotInUse("email-address", "This email address is already in use");
                    validator.AddIsRequired("first-name", "A first name is required");
                    validator.AddIsRequired("last-name", "A last name is required");
                    subformName = "memberDetails";
                    currentForm.disableCommand("save-changes");
                    switchToDetails();
                    //currentForm.checkForm();
                    if ($.isFunction(onComplete)) {
                        onComplete();
                    }
                }
            });
            //validator = new $.fastnet$validators.Create(currentForm);
            //validator.AddIsRequired("email-address", "An email address is required");
            //validator.AddEmailAddress("email-address", "This is not a valid email address");
            //validator.AddEmailAddressNotInUse("email-address", "This email address is already in use");
            //validator.AddIsRequired("first-name", "A first name is required");
            //validator.AddIsRequired("last-name", "A last name is required");
            //subformName = "memberDetails";

        }
        var loadMemberDetails = function (memberId) {
            closeSubform();
            var url = $U.Format("membershipapi/get/member/{0}", memberId);
            $.when(
                $U.AjaxGet({ url: url }, true)
                ).then(function (r) {
                    // first localise datetimes
                    if (r.LastLoginDate !== null) {
                        r.LastLoginDate = $U.FormatDate(moment.utc(r.LastLoginDate).toDate(), "DDMMMYYYY HH:mm:ss");
                    }
                    r.CreationDate = $U.FormatDate(moment.utc(r.CreationDate).toDate(), "DDMMMYYYY HH:mm:ss");
                    loadMemberDetailsForm(r);
                });
        };
        var getMembers = function(url) {
            $.when(
                $U.AjaxGet({ url: url }, true)
                ).then(function (r) {
                    clearMemberList();
                    $.each(r, function (i, m) {
                        var item = Mustache.to_html(memberItemTemplate, m);
                        $(".member-manager .lookup-panel .member-list").append(item);
                    });
                    $(".member-manager .lookup-panel .member-list .member").on("click", function () {
                        var id = $(this).attr("data-member-id");
                        $U.Debug("load details for member {0}", id);
                        loadMemberDetails(id);
                    });                  
                });
        }
        var clearSearchMode = function () {
            clearMemberList();
            resetIndexTabs();
            currentForm.disableCommand("clear-search");
            currentForm.disableCommand("search-cmd");
            currentForm.setData("search-text", "");
            closeSubform();
            currentForm.find(".member-index div").show();
        }
        var loadMembersWithSearch = function (text) {
            currentForm.enableCommand("clear-search");
            currentForm.find(".member-index div").hide();
            var url = $U.Format("membershipapi/get/members/{0}", text);
            getMembers(url);
        };
        var loadMembersWithPrefix = function (letter) {
            if (letter === "#") {
                letter = encodeURIComponent(letter);
            }
            var url = $U.Format("membershipapi/get/members/{0}/true", letter);
            $.when(
                $U.AjaxGet({ url: url }, true)
                ).then(function (r) {
                    clearMemberList();
                    $.each(r, function (i, m) {
                        var item = Mustache.to_html(memberItemTemplate, m);
                        $(".member-manager .lookup-panel .member-list").append(item);
                    });
                    $(".member-manager .lookup-panel .member-list .member").on("click", function () {
                        var id = $(this).attr("data-member-id");
                        $U.Debug("load details for member {0}", id);
                        loadMemberDetails(id);
                    });                  
                });
        }
        var onNavigationCommand = function (cmd) {
            $U.Debug("navigation command {0}", cmd);
            switch (cmd) {
                case "go-back":
                    var back = $U.Format("{0}//{1}", location.protocol, location.host);
                    location.href = back;
                    break;
                case "groups-mode":
                    showGroupManager();
                    break;
                case "members-mode":
                    showMemberManager();
                    break;
            }
        };
        var showGroupManager = function () {
            if (currentForm !== null) {
                currentForm.close();
            }
            //currentForm = new $.fastnet$forms.CreateForm("membership/template/form/groupmanager", {
            currentForm = new $.fastnet$forms.CreateForm("template/get/membership-forms/groupmanager", {
                Title: "Group Manager",
                IsModal: false,
            });
            currentForm.show();
        };
        var prepareForNewMember = function () {
            closeSubform();
            resetIndexTabs();
            clearMemberList();
            loadMemberDetailsForm({}, function () {
                //currentForm.disableCommand("add-new-member");
                currentForm.find(".existing-member-commands").hide();
                currentForm.find(".date-time-info").hide();
                mode.newMember = true;
            });
        };
        var saveMemberDetails = function () {
            var newMember = mode.newMember;
            var data = currentForm.getData();
            var originalData = currentForm.getOriginalData();
            function createNew() {
                var postData = {
                    emailAddress: data["email-address"],
                    firstName: data["first-name"],
                    lastName: data["last-name"],
                    password: data["password"], //encrypt it first?
                    isDisabled: data["is-disabled"]
                };
                var url = "membershipapi/create/member";
                $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                    closeSubform();
                    mode.newMember = false;
                    currentForm.enableCommand("add-new-member");
                    var mb = new $.fastnet$messageBox({});
                    var message = "A new member record has been created.";
                    mb.show(message, function (cmd) {
                        switchToLookup();
                    });                    
                });
            }
            function performUpdate() {
                var id = currentForm.find(".member-details").attr("data-id");
                //$U.Debug("saving member details now ...");
                var url = $U.Format("membershipapi/update/member");
                var postData = {
                    id: id,
                    emailAddress: data["email-address"],
                    firstName: data["first-name"],
                    lastName: data["last-name"],
                    password: data["password"], //encrypt it first?
                    isDisabled: data["is-disabled"]
                };
                $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                    // the entry for t his member in the member index needs to be updated
                    $(".member-manager .lookup-panel .member-list")
                        .find(".member[data-member-id='" + id + "']")
                        .replaceWith($(Mustache.to_html(memberItemTemplate, r)));
                    currentForm.resetOriginalData();
                    currentForm.disableCommand("save-changes");
                });
            }
            if (newMember) {
                createNew();
            } else {
                if (data['email-address'] !== originalData['email-address']) {
                    var mb = new $.fastnet$messageBox({
                        CancelButton: true
                    });
                    var message = "<div>Changing the email address will: <ul><li>Deactivate the member's account</li><li>Send an activation email using the new email address</li></ul></div><div>Please confirm</div>";
                    mb.show(message, function (cmd) {
                        if (cmd === "ok") {
                            performUpdate();
                        }
                    });
                } else {
                    performUpdate();
                }
            }
        };
        var deleteMember = function () {
            var mb = new $.fastnet$messageBox({
                CancelButton: true
            });
            var message = "<div>Deleting a member is an irreversible process. Please confirm</div>";
            mb.show(message, function (cmd) {
                switch (cmd) {
                    case "ok":
                        var id = currentForm.find(".member-details").attr("data-id");
                        var url = "membershipapi/delete/member";
                        var postData = { id: id };
                        $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                            $(".member-manager .lookup-panel .member-list")
                                .find(".member[data-member-id='" + id + "']").remove();
                        });
                        break;
                }
            });
            
        };
        var sendActivationMail = function () {
            function _sendActivationEmail(id) {
                var url = "membershipapi/send/activationmail";
                var postData = { id: id };
                $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                    $(".member-manager .lookup-panel .member-list")
                        .find(".member[data-member-id='" + id + "']")
                        .replaceWith($(Mustache.to_html(memberItemTemplate, r)));
                    loadMemberDetails(id);
                });
            }
            var id = currentForm.find(".member-details").attr("data-id");
            var isActive = currentForm.find(".member-details").attr("data-active") === "true";
            if (isActive) {
                var mb = new $.fastnet$messageBox({
                    CancelButton: true
                });
                var message = "<div>Sending an activation email will deactivate this member. Please confirm</div>";
                mb.show(message, function (cmd) {
                    if (cmd === "ok") {
                        _sendActivationEmail(id);
                    }
                });
            } else {
                _sendActivationEmail(id);
            }
        };
        var showMemberManager = function () {
            if (currentForm !== null) {
                currentForm.close();
            }
            //currentForm = new $.fastnet$forms.CreateForm("membership/template/form/membermanager", {
            currentForm = new $.fastnet$forms.CreateForm("template/get/membership-forms/membermanager", {
                Title: "Membership Manager",
                IsModal: false,
                OnChange: function(f, cmd) {
                    switch (cmd) {
                        case "search-text":
                            var text = f.getData(cmd);
                            if (text.trim().length > 0) {
                                f.enableCommand("search-cmd");
                            } else {
                                f.disableCommand("search-cmd");
                            }
                            break;
                    }
                },
                OnCommand: function (f, cmd, src) {
                    switch (cmd) {
                        case "add-new-member":
                            prepareForNewMember();
                            break;
                        case "close-form":
                            closeSubform();
                            mode.newMember = false;
                            currentForm.enableCommand("add-new-member");
                            switchToLookup();
                            break;
                        case "search-char":
                            var letter = $(src).attr("data-letter");
                            resetIndexTabs();
                            $(src).removeClass("btn-primary").addClass("btn-warning");
                            loadMembersWithPrefix(letter);
                            //$U.Debug("showMemberManager: search for prefix {0}", letter);
                            break;
                        case "search-cmd":
                            var searchText = currentForm.getData("search-text");
                            
                            loadMembersWithSearch(searchText);
                            break;
                        case "clear-search":
                            clearSearchMode();
                            break;
                        case "delete-member":
                            deleteMember();
                            break;
                        case "save-member-changes":
                            saveMemberDetails();
                            //switch (subformName) {
                            //    case "memberDetails":
                            //        saveMemberDetails();
                            //        break;
                            //    default:
                            //        $U.Debug("Unknown subform in membership manager");
                            //        break;
                            //}
                            break;
                        case "send-activation-email":
                            sendActivationMail();
                            break;

                        default:
                            $U.Debug("showMemberManager: cmd {0} not implemented", cmd);
                            break;
                    }
                },
                AfterItemValidation: function (f, r) {
                    // r.totalValid !== 0 means no control has had a value change away from the original value
                    if (r.totalErrors === 0 && r.totalValid !== 0) {
                        currentForm.enableCommand("save-changes");
                        $U.Debug("save-changes enabled");
                    } else {
                        currentForm.disableCommand("save-changes");
                        $U.Debug("save-changes disabled");
                    }
                }
            });
            currentForm.disableCommand("search-cmd");
            currentForm.disableCommand("clear-search");
            currentForm.show(function () {
                switchToLookup();
            });
        };
        membership.prototype.start = function (options) {
            function bindNavigation() {
                $(".menu-overlay button").on("click", function () {
                    var cmd = $(this).attr("data-cmd");
                    if (typeof cmd !== "undefined" && cmd !== null) {
                        switch (cmd) {
                            case "toggle-dropdown":
                                var menu = $(".menu-overlay .menu-dropdown");
                                menu.toggleClass("hide");
                                break;
                            default:
                                $(".menu-overlay .menu-dropdown").hide();
                                onNavigationCommand(cmd);
                                break;
                        }
                    }
                });
            }
            // load the banner panel content
            var url = "membershipapi/banner";
            $.when($U.AjaxGet({ url: url }).then(function (r) {
                if (r.Success) {
                    $(r.Styles).find("style").each(function (index, style) {
                        var html = style.outerHTML;
                        $("head").append($(html));
                    });
                    $(".BannerPanel").html(r.Html);
                }
            }));
            bindNavigation();
            showMemberManager();
        }
    }
    var $U = $.fastnet$utilities;
})(jQuery);