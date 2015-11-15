(function ($) {
    $.webframe$membership = function membership() {
        var customiser = null;
        var currentForm = null;
        var subformName = null;
        var validator = null;
        var mode = { newMember: false };
        var memberItemTemplate =
            "    <div class='member' data-member-id='{{Id}}'>" +
            "        <span>{{Name}}</span>" +
            "        <span class='fa fa-ban {{#Disabled}}disabled{{/Disabled}}' title='Member is disabled'></span>" +
            "        <span class='fa fa-clock-o {{#EmailConfirmed}}email-confirmed{{/EmailConfirmed}}' title='Waiting for email confirmation'></span>" +
            "    </div>";
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
        function customise(ctx) {
            if ($.isFunction(customiser)) {
                customiser(ctx);
            }
        }
        function switchToMain() {
            $(".main-panel").addClass("active");
            $(".lookup-panel").removeClass("active");
        }
        function switchToLookup() {
            $(".lookup-panel").addClass("active");
            $(".main-panel").removeClass("active");
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
                }
                validator.AddIsRequired("email-address", "An email address is required");
                validator.AddEmailAddress("email-address", "This is not a valid email address");
                validator.AddEmailAddressNotInUse("email-address", "This email address is already in use");
                validator.AddIsRequired("first-name", "A first name is required");
                validator.AddIsRequired("last-name", "A last name is required");
                subformName = "memberDetails";
                currentForm.disableCommand("save-changes");
                switchToMain();
                //currentForm.checkForm();
                if ($.isFunction(onComplete)) {
                    onComplete();
                }

            });
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
        var getMembers = function (url) {
            $.when(
                $U.AjaxGet({ url: url }, true)
                ).then(function (r) {
                    clearMemberList();
                    $.each(r, function (i, m) {
                        var item = Mustache.to_html(memberItemTemplate, m);
                        $(".member-manager .lookup-panel .member-list").append(item);
                    });
                    bindMembers();
                    //$(".member-manager .lookup-panel .member-list .member").on("click", function () {
                    //    var id = $(this).attr("data-member-id");
                    //    $U.Debug("load details for member {0}", id);
                    //    loadMemberDetails(id);
                    //});
                });
        }
        var bindMembers = function () {
            $(".member-manager .lookup-panel .member-list .member").off();
            $(".member-manager .lookup-panel .member-list .member").on("click", function () {
                var id = $(this).attr("data-member-id");
                $U.Debug("load details for member {0}", id);
                loadMemberDetails(id);
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
            getMembers(url);
            //$.when(
            //    $U.AjaxGet({ url: url }, true)
            //    ).then(function (r) {
            //        clearMemberList();
            //        $.each(r, function (i, m) {
            //            var item = Mustache.to_html(memberItemTemplate, m);
            //            $(".member-manager .lookup-panel .member-list").append(item);
            //        });
            //        $(".member-manager .lookup-panel .member-list .member").on("click", function () {
            //            var id = $(this).attr("data-member-id");
            //            $U.Debug("load details for member {0}", id);
            //            loadMemberDetails(id);
            //        });
            //    });
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

        var prepareForNewMember = function () {
            closeSubform();
            resetIndexTabs();
            clearMemberList();
            loadMemberDetailsForm({}, function () {
                //currentForm.disableCommand("add-new-member");
                currentForm.find(".existing-member-commands").hide();
                currentForm.find(".date-time-info").hide();
                currentForm.find(".activation-info").hide();
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
                    $U.MessageBox("A new member record has been created.", {}, function () {
                        switchToLookup();
                    });
                    //var mb = new $.fastnet$messageBox({});
                    //var message = "A new member record has been created.";
                    //mb.show(message, function (cmd) {
                    //    switchToLookup();
                    //});
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
                    bindMembers();
                    loadMemberDetails(id);
                    //currentForm.resetOriginalData();
                    //currentForm.disableCommand("save-changes");
                });
            }
            if (newMember) {
                createNew();
            } else {
                if (data['email-address'] !== originalData['email-address']) {
                    var message = "<div>Changing the email address will: <ul><li>Deactivate the member's account</li><li>Send an activation email using the new email address</li></ul></div><div>Please confirm</div>";
                    $U.Confirm(message, function () {
                        performUpdate();
                    });
                } else {
                    performUpdate();
                }
            }
        };
        var deleteMember = function () {
            var message = "<div>Deleting a member is an irreversible process. Please confirm</div>";
            $U.Confirm(message, function () {
                var id = currentForm.find(".member-details").attr("data-id");
                var url = "membershipapi/delete/member";
                var postData = { id: id };
                $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                    $(".member-manager .lookup-panel .member-list")
                        .find(".member[data-member-id='" + id + "']").remove();
                });
            });
            //var mb = new $.fastnet$messageBox({
            //    CancelButton: true
            //});
            //var message = "<div>Deleting a member is an irreversible process. Please confirm</div>";
            //mb.show(message, function (cmd) {
            //    switch (cmd) {
            //        case "ok":
            //            var id = currentForm.find(".member-details").attr("data-id");
            //            var url = "membershipapi/delete/member";
            //            var postData = { id: id };
            //            $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
            //                $(".member-manager .lookup-panel .member-list")
            //                    .find(".member[data-member-id='" + id + "']").remove();
            //            });
            //            break;
            //    }
            //});

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
                var message = "<div>Sending an activation email will deactivate this member. Please confirm</div>";
                $U.Confirm(message, function () {
                    _sendActivationEmail(id);
                });
                //var mb = new $.fastnet$messageBox({
                //    CancelButton: true
                //});
                //var message = "<div>Sending an activation email will deactivate this member. Please confirm</div>";
                //mb.show(message, function (cmd) {
                //    if (cmd === "ok") {
                //        _sendActivationEmail(id);
                //    }
                //});
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
                OnChange: function (f, cmd) {
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
                            //switchToMain();
                            break;
                        case "search-cmd":
                            var searchText = currentForm.getData("search-text");
                            loadMembersWithSearch(searchText);
                            //switchToMain();
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
        var showGroupManager = function () {
            if (currentForm !== null) {
                currentForm.close();
            }
            currentForm = new $.fastnet$forms.CreateForm("template/get/membership-forms/groupmanager", {
                Title: "Group Manager",
                IsModal: false,
                OnCommand: function (f, cmd, src) {
                    $U.Debug("Command {0}", cmd);
                    var groupId = $(src).closest(".group-details").attr("data-id");
                    switch (cmd) {
                        case "add-members":
                            addMembers(groupId);
                            break;
                        case "remove-members":
                            var data = f.getData();
                            var membersToRemove = [];
                            $.each(data.members, function (i, item) {
                                if (item.value) {
                                    membersToRemove.push(item.dataItem);
                                }
                            });
                            removeMembers(groupId, membersToRemove);
                            break;
                        case "toggle-selectall-command":
                            if (toggleMembers(f, src)) {
                                f.enableCommand("remove-members");
                            } else {
                                f.disableCommand("remove-members");
                            }
                        case "save-group-changes":
                            if (f.isValid()) {
                                //alert("can save changes!");
                                var data = f.getData();
                                updateGroupProperties(groupId, data["group-name"], data["group-descr"], data["group-weight"], data["update-children"]);
                            }
                            break;
                        case "delete-group":
                            $U.Confirm("Deleting a group will also delete all subgroups (if any). Please confirm.", function () {
                                deleteGroup(groupId);
                            });
                            break;
                        case "add-new-group":
                            var id = $(".group-manager .group-details").attr("data-id");
                            addNewGroup(id);
                            break;

                    }
                },
                OnChange: function (f, dataItem, checked) {
                    $U.Debug("Changed {0} checked = {1}", dataItem, checked);
                    if (dataItem === "group-name" || dataItem === "group-descr" || dataItem === "group-weight") {
                        f.enableCommand("save-group-changes");
                    }
                    var data = f.getData();
                    var count = 0;
                    if (typeof data.members !== "undefined") {
                        $.each(data.members, function (i, item) {
                            if (item.value) {
                                ++count;
                            }
                        });
                        if (count > 0) {
                            f.enableCommand("remove-members");
                        } else {
                            f.disableCommand("remove-members");
                        }
                    }
                }
            });
            currentForm.show(function () {
                switchToGroupTree();
                loadGroupTree();
            });
        };
        var addNewGroup = function (groupId) {
            var url = "membershipapi/add/group";
            var postData = { groupId: groupId };
            $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                var newGroupId = r.groupId;
                gtv.Clear();
                reloadGroupTree(function (node, item) {
                    if (item.Id === newGroupId) {
                        gtv.TriggerNode(node);
                    }
                });
            });
        };
        var deleteGroup = function (groupId) {
            var url = "membershipapi/delete/group";
            var postData = { groupId: groupId };
            $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                gtv.Clear();
                reloadGroupTree();
                $(".group-content-panel .toolbar").hide();
                $(".group-details-panel").empty();
            });
        }
        var updateGroupProperties = function (groupId, name, description, weight, updateChildren) {
            var url = "membershipapi/update/group";
            var postData = { groupId: groupId, name: name, descr: description, weight: weight, updateChildren: updateChildren };
            $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                $(".group-details .command-strip .message").text("Changes saved");
                var selector = $U.Format(".group-tree span[data-id='{0}']", groupId);
                $(selector).attr('title', description).text(name);
            });
        };
        var removeMembers = function (groupId, members) {
            var url = $U.Format("membershipapi/delete/groupmembers");
            var postData = { groupId: groupId, members: members };
            $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                loadGroupDetails(groupId);
            })
        };
        var toggleMembers = function (f, src) {
            var allmembersChecked = false;
            var toggle = $(src).attr("data-toggle") === "true";
            f.find(".member-item input").each(function (i, item) {
                $(item).prop("checked", !toggle);
            });
            if (toggle) {
                $(src).text("Select All");
            } else {
                $(src).text("Deselect All");
            }
            toggle = !toggle;
            $(src).attr("data-toggle", toggle);
            return (toggle);
        }
        var addMembers = function (groupId) {
            function addMembersToGroup(members) {
                var url = "membershipapi/add/groupmembers";
                var postData = { groupId: groupId, members: members };
                $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                    _loadGroupDetails(groupId);
                });
            }
            var url = $U.Format("membershipapi/get/candidatemembers/{0}", groupId);
            $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                $.each(r.Members, function (i, member) {
                    $U.Debug("Candidate {0}: {1} ({2})", i, member.Name, member.EmailAddress);
                });
                var af = new $.fastnet$forms.CreateForm("template/get/membership-forms/selectmembers", {
                    Title: "Select Members",
                    IsModal: true,
                    OnChange: function (f, dataItem, checked) {
                        var data = f.getData();
                        var count = 0;
                        $.each(data.members, function (i, item) {
                            if (item.value) {
                                ++count;
                            }
                        });
                        if (count > 0) {
                            f.enableCommand("select-command");
                        } else {
                            f.disableCommand("select-command");
                        }
                    },
                    OnCommand: function (f, cmd, src) {
                        switch (cmd) {
                            case "select-command":
                                var data = f.getData();
                                var membersToAdd = [];
                                $.each(data.members, function (i, item) {
                                    if (item.value) {
                                        membersToAdd.push(item.dataItem);
                                    }
                                });
                                f.close();
                                addMembersToGroup(membersToAdd);
                                break;
                            case "toggle-selectall-command":
                                if (toggleMembers(f, src)) {
                                    f.enableCommand("select-command");
                                } else {
                                    f.disableCommand("select-command");
                                }
                                break;
                        }
                    }
                }, r);
                af.disableCommand("select-command");
                af.show();
            });
        };
        var gtv = null;
        var loadGroupDetailsForm = function (data) {
            var validator = new $.fastnet$validators.Create(currentForm);
            currentForm.loadSubform(".group-details-panel", { templateUrl: "template/get/membership-forms/groupdetails" }, data, function () {
                currentForm.disableCommand("remove-members");
                currentForm.disableCommand("save-group-changes");
                validator.AddIsRequired("group-name", "A name is required");
                validator.AddIsRequired("group-descr", "A description is required");
                validator.AddIsRequired("group-weight", "A group weight is required");
                validator.AddPositiveInteger("group-weight", "A group weight must be a positive integer value");
                validator.AddIntegerInRange("group-weight", $U.Format("The group weight should be larger than the parent weight ({0})", data.Group.ParentWeight), data.Group.ParentWeight);
                var buttonText = $U.Format("{0}: Add New Subgroup", data.Group.Name);
                $(".group-manager button[data-cmd='add-new-group']").text(buttonText);
            });
        };
        var loadGroupDetails = function (groupId) {
            var url = $U.Format("membershipapi/get/group/{0}", groupId);
            $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                if (r.Group.Name === "Everyone" || r.Group.Name === "Anonymous") {
                    $(".group-content-panel .toolbar").hide();
                } else {
                    $(".group-content-panel .toolbar").show();
                }
                loadGroupDetailsForm(r);
                //if (!r.Group.IsSystem || !r.Group.HasSystemDefinedMembers) {
                //    loadGroupDetailsForm(r);
                //}
            });
        };
        var loadGroupTree = function () {
            gtv = $.fastnet$treeview.NewTreeview({
                EnableContextMenu: false,
                Selector: ".group-manager .group-tree",
                OnSelectChanged: function (nodeData) {
                    loadGroupDetails(nodeData.userData);
                }
            });
            reloadGroupTree();
            //var url = "membershipapi/get/groups";
            //$.when($U.AjaxGet({ url: url }, true)).then(function (r) {
            //    //debugger;
            //    loadGroupTreeData(null, r);
            //});
        };
        var reloadGroupTree = function (onItemLoad) {
            var url = "membershipapi/get/groups";
            $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                //debugger;
                loadGroupTreeData(null, r, onItemLoad);
            });
        };
        var loadGroupTreeData = function (node, data, onItemLoad) {
            $.each(data, function (index, item) {
                var fmt = "<img class='group-icon' src='/areas/membership/content/images/user_group.png' ></img><span data-id='{2}' class='title' title='{1}' >{0}</span>";
                var html = $U.Format(fmt, item.Name, item.Description, item.Id);
                var newNode = gtv.AddNode(node, {
                    NodeHtml: html,
                    Title: item.Name,
                    UserData: item.Id,
                    ChildCount: item.SubgroupTotal
                });
                gtv.SetNodeLoaded(newNode);
                if (item.Name === "Everyone" || item.Name === "AllMembers") {
                    gtv.OpenNode(newNode);
                }
                if ($.isFunction(onItemLoad)) {
                    onItemLoad(newNode, item);
                }
                if (item.SubgroupTotal > 0) {
                    var url = $U.Format("membershipapi/get/groups/{0}", item.Id);
                    $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                        loadGroupTreeData(newNode, r, onItemLoad);
                    });
                }

            });

        };
        function switchToGroupTree() {
            $(".group-tree-panel").addClass("active");
            $(".group-content-panel").removeClass("active");
        }
        membership.prototype.setCustomisation = function (func) {
            customiser = func;
        }
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
            //var url = "membershipapi/banner";
            //$.when($U.AjaxGet({ url: url }).then(function (r) {
            //    if (r.Success) {
            //        $(r.Styles).find("style").each(function (index, style) {
            //            var html = style.outerHTML;
            //            $("head").append($(html));
            //        });
            //        $(".BannerPanel").html(r.Html);
            //    }
            //}));
            //bindNavigation();
            //showMemberManager();
        }
    }
    var $U = $.fastnet$utilities;
})(jQuery);