(function ($) {
    var $T;
    var $U;
    var $F;
    $.webframe$designer = {
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
        },
        Layout: {
            aceEditor: null,
            currentPanel: null,
            Home: function () {
                var ldf = new $.fastnet$forms.CreateForm("template/get/designer-forms/layouthome", {
                    Title: "Layout Designer",
                    IsModal: false,
                    OnCommand: this.OnCommand
                });
                ldf.show(function () {
                    ldf.find(".panel-diagram .select-panel").parent().on("mouseenter", function () {
                        var cmd = $(this).find(".btn").attr("data-cmd");
                        var desc = "";
                        switch (cmd) {
                            case "site-panel":
                                desc = "The Site Panel contains the entire layout.";
                                break;
                            case "banner-panel":
                                desc = "The Banner Panel is fixed at the top - its content is determined by the page showing in the Centre Panel.";
                                break;
                            case "menu-panel":
                                desc = "The Menu Panel contains the menu buttons.";
                                break;
                            case "content-panel":
                                desc = "The Content Panel contains the three content panels, left, centre and right.";
                                break;
                            case "left-panel":
                                desc = "The Left Panel is fixed on the left hand side - its content is determined by the page showing in the Centre Panel.";
                                break;
                            case "centre-panel":
                                desc = "The Centre Panel shows the content of the current page.";
                                break;
                            case "right-panel":
                                desc = "The Right Panel is fixed on the right hand side - its content is determined by the page showing in the Centre Panel.";
                                break;
                        }
                        $(".panel-description").html(desc);
                        $(".panel-diagram ." + cmd).addClass("highlit");
                    }).on("mouseleave", function () {
                        var cmd = $(this).find(".btn").attr("data-cmd");
                        $(".panel-diagram ." + cmd).removeClass("highlit");
                        $(".panel-description").html("");
                    });
                });
            },
            Edit: function (panel) {
                var $this = this;
                $this.currentPanel = panel;
                var url = $U.Format("designer/layouteditor/get/{0}", panel);
                $.when($U.AjaxGet({ url: url }, true)
                    ).done(function (panelInfo) {
                        $U.Debug("back from {0}", url);
                        var cef = new $.fastnet$forms.CreateForm("template/get/designer-forms/layoutcsseditor", {
                            Title: "CSS Editor",
                            IsModal: false,
                            OnCommand: function (f, cmd) {
                                switch (cmd) {
                                    case "save-css":
                                        var lessText = $T.aceEditor.getValue();
                                        $T.Layout.SaveLess(f, panel, lessText);
                                        break;
                                }
                            }
                        }, panelInfo);
                        cef.disableCommand("save-css");
                        cef.show(function () {
                            $(".default-css pre").text(panelInfo.DefaultCSS);
                            $T.aceEditor = ace.edit("less-editor");
                            ace.config.set('basePath', '/areas/designer/scripts/ace editor/src');
                            $T.aceEditor.setTheme("ace/theme/cobalt");
                            $T.aceEditor.setValue(panelInfo.CustomLess);
                            $T.aceEditor.getSession().setMode("ace/mode/less");
                            $T.aceEditor.on("change", function () {
                                cef.find(".message").text("");
                                cef.enableCommand("save-css");
                            });
                        });
                    });
            },
            OnCommand: function (f, cmd) {
                switch (cmd) {
                    case "site-panel":
                    case "banner-panel":
                    case "menu-panel":
                    case "content-panel":
                    case "left-panel":
                    case "centre-panel":
                    case "right-panel":
                        f.close();
                        $T.Layout.Edit(cmd);
                        break;
                    default:
                        $U.Debug("designer command {0}", cmd);
                        break;
                }
            },
            SaveLess: function (f, panel, lessText) {
                //$U.Debug("SaveLess");
                less.render(lessText, function (e, output) {
                    var url = "designer/layouteditor/savepanelcss";
                    var postData = { Panel: panel, CSSText: output.css, LessText: lessText };
                    $.when($U.AjaxPost({ url: url, data: postData })
                        ).then(function () {
                            f.find(".message").text("Changes saved");
                            f.disableCommand("save-css");
                        });
                });
            }
        }
    };
    $(function () {
        $.webframe$designer.Init();
    });
})(jQuery);
var MenuEditor = (function ($) {
    // this uses a javascript singleton pattern
    var $U = $.fastnet$utilities;
    var instance = null;
    var menuMasters = null;
    var mef = null;
    var currentMenu = { masterId: null, menuList: null };
    function createInstance() {
        // note for forms vNext: create a validator/validations object that can be newed ...
        var validators = {};
        function _openStyleEditor() {
            function _saveStyle(f, lessText) {
                less.render(lessText, function (e, output) {
                    var url = "designer/menuapi/save/styles";
                    var postData = { CSSText: output.css, LessText: lessText };
                    $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                        f.find(".message").text("Changes saved");
                        f.disableCommand("save-css");
                    });
                });
            }
            var aceEditor = null;
            if (mef !== null) {
                mef.close();
            }
            var url = $U.Format("designer/menuapi/get/styles");
            $.when($U.AjaxGet({ url: url })).then(function (result) {
                var cef = new $.fastnet$forms.CreateForm("template/get/designer-forms/layoutcsseditor", {
                    Title: "CSS Editor",
                    IsModal: false,
                    OnCommand: function (f, cmd) {
                        switch (cmd) {
                            case "cancel":
                                cef.close();
                                _load();
                                break;
                            case "save-css":
                                var lessText = aceEditor.getValue();
                                _saveStyle(f, lessText);
                                //$T.Layout.SaveLess(f, panel, lessText);
                                break;
                        }
                    }
                }, result);
                cef.disableCommand("save-css");
                cef.show(function () {
                    $(".layout-less-editor .editor-title").text("Less Editor for Menus");
                    $(".default-css pre").text(result.DefaultCSS);
                    aceEditor = ace.edit("less-editor");
                    ace.config.set('basePath', '/areas/designer/scripts/ace editor/src');
                    aceEditor.setTheme("ace/theme/cobalt");
                    aceEditor.getSession().setMode("ace/mode/less");
                    aceEditor.setValue(result.CustomLess);
                    aceEditor.on("change", function () {
                        cef.find(".message").text("");
                        cef.enableCommand("save-css");
                    });
                });
            });
        }
        function _clearDataItemErrors(dataItem) {
            var validator = validators[dataItem];
            if (typeof validator !== "undefined") {
                $.each(validator.functions, function (i, f) {
                    f.result = null;
                });
            }
        }
        function _totalValidationErrors() {
            var total = 0;
            for (var prop in validators) {
                if (validators.hasOwnProperty(prop)) {
                    var validator = validators[prop];
                    $.each(validator.functions, function (i, f) {
                        if (f.result === "false") {
                            total++;
                        }
                    });
                }
            }
            return total;
        }
        function _clearValidators() {
            validators = {};
        }
        function _ensureValidatorSlot(dataItem) {
            if (typeof validators[dataItem] === "undefined" || validators[dataItem] === null) {
                validators[dataItem] = { errorCount: 0, functions: [] };//[];
            }
        }
        function _addValidator(dataItem, validationFunc) {
            _ensureValidatorSlot(dataItem);
            validators[dataItem].functions.push(validationFunc);
        }
        function _addValidators(dataItem, validationFuncs) {
            $.each(validationFuncs, function (i, item) {
                //item = $.extend(item, { result: true });
                // a result can be null,  "false", "pending"
                item = $.extend({ result: null, stopOnError: false }, item);
                _addValidator(dataItem, item);
            });
        }
        function _addAllValidators() {
            _addValidators("name", [
                { method: _validateIsRequired, errorMessage: "A menu name is required" },
                { method: _validateIsAlphaNumeric, errorMessage: "A menu name must use letters and/or digits only" }]);
            _addValidators("page-url", [
                { method: _validateIsPageUrl, errorMessage: "A page url has to be in the form page/nn", stopOnError: true },
                { method: _validateIsNotCentrePageUrl, errorMessage: "this url does not refer to a side page" }]);
        }
        function _validateDataItem(data) {
            validators[data.dataItem].errorCount = 0;

            $.each(validators[data.dataItem].functions, function (i, validator) {
                data.validator = validator;// so validator method can see the validator itself
                var r = validator.method(data);
                if (r === true) {
                    r = null;
                }
                validator.result = r;
                if (validator.result === "false") {
                    _appendErrorMessage(data.source, validator.errorMessage);
                    if (validator.stopOnError) {
                        return false;
                    }
                }
            });
        }
        function _clearErrorMessage(source) {
            var target = $(source).closest("div[data-property]").find(".error-message");
            target.empty();
        }
        function _appendErrorMessage(source, errorMessage) {
            var target = $(source).closest("div[data-property]").find(".error-message");
            target.append($("<div>" + errorMessage + "</div>"));
        }
        function _validateIsPageUrl(data) {
            // null or empty is allowed
            var r = _validateIsRequired(data);
            if (r) {
                data.regex = /^page\/[0-9]+$/;
                return _validateWithRegex(data)
            } else {
                return true;
            }
        }
        function _validateIsAlphaNumeric(data) {
            data.regex = /^[a-z0-9A-Z]+$/;
            return _validateWithRegex(data)
        }
        function _validateWithRegex(data) {
            var _regex = data.regex instanceof RegExp ? data.regex : new RegExp(data.regex);
            var r = _regex.test(data.value);
            return r
        }
        function _validateIsRequired(data) {
            var r = !(data.value === null || data.value.trim() === "");
            return r;
        }
        function _validateIsNotCentrePageUrl(data) {
            // null or empty is allowed
            var r = _validateIsRequired(data);
            if (r) {
                var pageId = parseInt(data.value.substring(5));// strip off leading "page/" and convert to a number
                var url = $U.Format("designer/menuapi/get/pagetype/{0}", pageId);
                $.when($U.AjaxGet({ url: url })).then(function (r) {
                    if (r.PageTypeName === "centre") {
                        data.validator.result = "false";
                        _appendErrorMessage(data.source, data.validator.errorMessage);
                    } else {
                        data.validator.result = null;
                    }
                });
            } else {
                return true;
            }
        }
        function _validateIsOnlyCentrePageUrl(data) {
            var pageId = parseInt(data.value.substring(5));// strip off leading "page/" and convert to a number
            var url = $U.Format("designer/menuapi/get/pagetype/{0}", pageId);
            $.when($U.AjaxGet({ url: url })).then(function (r) {
                if (r.PageTypeName === "centre") {
                    data.validator.result = null;
                } else {
                    data.validator.result = "false";
                    _appendErrorMessage(data.source, data.validator.errorMessage);
                }
            });
            return "pending";
        }
        function _getValue(element) {
            var tag = element.tagName.toLowerCase();
            var val;
            var dataItem = $(element).attr("data-item");
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
        function _bindValidation() {

            var itemsSelector = $U.Format(".menu-editor .menu-master[data-masterid='{0}'] input[data-item]", currentMenu.masterId);
            $(itemsSelector).on("focus", function (e) {
                var dataItem = $(this).attr("data-item");
                _clearDataItemErrors(dataItem);
                _clearErrorMessage(this);
                _onDataItemFocus(dataItem);
            });
            $(itemsSelector).on("blur", function (e) {
                e.stopPropagation();
                _clearErrorMessage(this);
                var dataItem = $(this).attr("data-item");
                var val = _getValue(this);
                var menuId = null;
                if ($(this).closest(".menu-item").length > 0) {
                    menuId = parseInt($(this).closest(".menu-item").attr("data-menuId"))
                }
                _validate({ dataItem: dataItem, value: val, menuId: menuId, source: this });
            });
        }
        function _unbindValidation() {
            var itemsSelector = $U.Format(".menu-editor .menu-master[data-masterid='{0}'] input", currentMenu.masterId);
            $(itemsSelector).off("blur");
            $(itemsSelector).off("focus");
        }
        function _unbindMenuItems() {
            var itemsSelector = $U.Format(".menu-editor .menu-master[data-masterid='{0}'] .menu-items", currentMenu.masterId);
            $(itemsSelector).off();
        }
        function _bindMenuItems() {
            var itemsSelector = $U.Format(".menu-editor .menu-master[data-masterid='{0}'] .menu-items", currentMenu.masterId);
            $(itemsSelector).find("button[data-cmd]").on("click", function () {
                var cmd = $(this).attr("data-cmd");
                var menuId = parseInt($(this).closest(".menu-item").attr("data-menuId"));
                //$U.Debug("menu-item command: cmd {0}, id {1}", cmd, menuId);
                _onCommand({ form: mef, command: cmd, menuId: menuId, source: this });
            });
            $(itemsSelector).find("input[type=text][data-item]").on("input", function () {
                var item = $(this).attr("data-item");
                var menuId = parseInt($(this).closest(".menu-item").attr("data-menuId"));
                //$U.Debug("menu-item change: item {0}, id {1}", item, menuId);
                _onCommand({ form: mef, command: "data-change", menuId: menuId, item: item, source: this });
            });
        }
        function _updateUI() {
            // (1)here we scan through the full list of menumasters
            // and decide if the menu panel check box for the
            // current Menu needs to be disabled
            // (2) if current menu is for the menu panel then
            // check the check box and disable the menu pageurl box
            // (3) count the items in the current menuList (which are the top level menus).
            // if there is only one, then disable the delete-menu for it as
            // the last menu item cannot be deleted (there is no point!)
            //
            // first find the id of any mm that is for the menu panel
            var result = null;
            $.each(menuMasters, function (i, mm) {
                if (mm.ForMenuPanel === true) {
                    result = mm.Id;
                    return false;
                }
            });
            var checkboxSelector = $U.Format(".menu-editor .menu-master[data-masterid='{0}'] .menu-details .menu-type .checkbox input", currentMenu.masterId);
            if (result !== null && result !== currentMenu.masterId) {
                $(checkboxSelector).prop("disabled", true);
            } else {
                $(checkboxSelector).prop("disabled", false);
                if (result === currentMenu.masterId) {
                    $(checkboxSelector).prop("checked", true);
                    $(checkboxSelector).closest(".menu-type").find(".menu-url input").prop("disabled", true);
                    $(checkboxSelector).closest(".menu-type").find(".menu-url .btn").prop("disabled", true);
                } else {
                    $(checkboxSelector).prop("checked", false);
                    $(checkboxSelector).closest(".menu-type").find(".menu-url input").prop("disabled", false);
                    $(checkboxSelector).closest(".menu-type").find(".menu-url .btn").prop("disabled", false);
                }
            }
            var topLevelItemCount = currentMenu.menuList.length;
            if (topLevelItemCount === 1) {
                var selector = $U.Format(".menu-editor .menu-master[data-masterid='{0}'] .menu-items .menu-item button[data-cmd='delete-menu']", currentMenu.masterId);
                $(selector).prop("disabled", true);
            }
        }
        function _loadmenus(mmElement, mmsId) {
            var url = $U.Format("designer/menuapi/get/menus/{0}", mmsId);
            var templateUrl = "template/get/designer-forms/menuitem";
            currentMenu.masterId = mmsId;
            $.when(
                $U.AjaxGet({ url: templateUrl }),
                $U.AjaxGet({ url: url }, true)).then(function (q0, q1) {
                    var template = q0[0].Template;
                    var items = q1[0];
                    function _loadMenuList(location, list, level) {
                        var levelClass = "level-" + level;
                        $(location).addClass(levelClass);
                        $.each(items, function (i, item) {
                            var html = $(Mustache.to_html(template, item, { asim: template }));
                            $(location).append(html);
                        });
                    }
                    _loadMenuList($(mmElement).find(".menu-items"), items, 0);
                    currentMenu.menuList = items;
                    _addAllValidators();
                    _updateUI();
                    _bindMenuItems();
                    _bindValidation();
                });
        }
        function _onOpenMenu(f, src) {
            var mm = $(src).closest(".menu-master");
            var masterId = parseInt(mm.attr("data-masterid"));
            _loadmenus(mm, masterId);
            var othersSelector = $U.Format(".menu-master:not([data-masterid='{0}'])", masterId);
            f.find(othersSelector).slideUp();
            $(mm).find(".menu-details").removeClass("hidden").slideDown();
            $(mm).find("span[data-cmd='open-menu']").addClass("hidden");
            $(mm).find("span[data-cmd='close-menu']").removeClass("hidden");
            $(mm).find("input[data-item='name']").prop("disabled", false);
            $(mm).find("button[data-cmd='delete-menumaster']").prop("disabled", false);
            $(".menu-editor button[data-cmd='new-menumaster']").hide();
            $(".menu-editor button[data-cmd='new-choice']").show();
            $(mm).find(".mm-descr").hide();
            $(mm).find(".saving-help").show();
        }
        function _onCloseMenu(f) {
            var masterId = currentMenu.masterId;
            var mm = $($U.Format(".menu-editor .menu-master[data-masterid='{0}']", masterId));
            _unbindValidation();
            _unbindMenuItems();
            var othersSelector = $U.Format(".menu-master:not([data-masterid='{0}'])", masterId);
            f.find(othersSelector).slideDown();
            $(mm).find(".menu-details").slideUp();
            $(mm).find(".menu-items.level-0").empty();
            $(mm).find(".menu-items").removeClass("level-0");
            $(mm).find("span[data-cmd='close-menu']").addClass("hidden");
            $(mm).find("span[data-cmd='open-menu']").removeClass("hidden");
            $(mm).find("input[data-item='name']").prop("disabled", true);
            $(mm).find("button[data-cmd='delete-menumaster']").prop("disabled", true);

            currentMenu.masterId = null;
            currentMenu.menuList = null;
            _clearValidators();
            $(".menu-editor button[data-cmd='new-menumaster']").show();
            $(".menu-editor button[data-cmd='new-choice']").hide();
            $(mm).find(".mm-descr").show();
            $(mm).find(".saving-help").hide();

        }
        function _onDataItemFocus(dataItem) {
            _updateSaveAllowed();
        }
        function _validate(data) {
            switch (data.dataItem) {
                case "name":
                case "page-url":
                    _validateDataItem(data);
                    break;
                default:
                    $U.Debug("No validator for mm {0}, menu {1}, data-item {2} value {3}", currentMenu.masterId, data.menuId, data.dataItem, data.value);
                    break;
            }
            _updateSaveAllowed();
        }
        function _updateSaveAllowed() {
            var mm = $($U.Format(".menu-editor .menu-master[data-masterid='{0}']", currentMenu.masterId));
            if (_totalValidationErrors() === 0) {
                mef.enableCommand("save-changes");
                $(mm).find(".menu-item-buttons button").prop("disabled", false);
            } else {
                mef.disableCommand("save-changes");
                $(mm).find(".menu-item-buttons button").prop("disabled", true);
            }
        }
        function _moveChoice(menuId, offset) {
            _saveChanges(function () {
                var url = "designer/menuapi/move/choice";
                var postData = { menuId: menuId, offset: offset };
                $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                    var masterId = currentMenu.masterId;
                    var mm = $($U.Format(".menu-editor .menu-master[data-masterid='{0}']", masterId));
                    $(mm).find(".menu-items").empty();
                    _loadmenus(mm, masterId);
                });
            });
        }
        function _addChoice(menuId) {
            // menuId == null, means toplevel
            _saveChanges(function () {
                var url = "designer/menuapi/add/choice";
                var postData = { option: null, masterId: null, menuId: null };
                if (menuId === null) {
                    postData.option = "toplevel";
                    postData.masterId = currentMenu.masterId;
                } else {
                    postData.menuId = menuId;
                }
                $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                    var masterId = currentMenu.masterId;
                    var mm = $($U.Format(".menu-editor .menu-master[data-masterid='{0}']", masterId));
                    $(mm).find(".menu-items").empty();
                    _loadmenus(mm, masterId);
                });
            });
        }
        function _createNewMenuMaster() {
            if (mef != null) {
                mef.close();
                menuMasters = null;
                currentMenu.masterId = null;
                currentMenu.menuList = null;
            }
            var url = "designer/menuapi/create/newmaster";
            $.when($U.AjaxPost({ url: url, data: null })).then(function (r) {
                _load();
            });
        }
        function _delete(menuId) {
            _saveChanges(function () {
                var url = "designer/menuapi/delete";
                var postData = { option: null, masterId: null, menuId: null };
                var deletingMaster = false;
                if (menuId === null) {
                    postData.option = "master";
                    postData.masterId = currentMenu.masterId;
                    deletingMaster = true;
                } else {
                    postData.menuId = menuId;
                }
                $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                    if (deletingMaster) {
                        _load();
                    } else {
                        var masterId = currentMenu.masterId;
                        var mm = $($U.Format(".menu-editor .menu-master[data-masterid='{0}']", masterId));
                        $(mm).find(".menu-items").empty();
                        _loadmenus(mm, masterId);
                    }
                });
            });
        }
        function _saveChanges(afterSave) {
            mef.disableCommand("save-changes");
            var data = _collectCurrentMenuData();
            var url = "designer/menuapi/update/menus";
            $.when($U.AjaxPost({ url: url, data: data })).then(function (r) {
                var masterId = currentMenu.masterId;
                var mm = $($U.Format(".menu-editor .menu-master[data-masterid='{0}']", masterId));
                $(mm).find(".mm-descr").text(r.Descriptor);
                if ($.isFunction(afterSave)) {
                    afterSave();
                }
            });
        }
        function _collectCurrentMenuData() {
            function _gd(root, dataItem) {
                var itemTag = $(root).find("input[data-item='" + dataItem + "']");
                if (itemTag.length === 1) {
                    return _getValue(itemTag[0]);
                } else {
                    return null;
                }
            }
            function _collectMenus(menuItems) {
                var menus = [];
                $.each(menuItems, function (i, item) {
                    var menu = { id: null, index: null, text: null, url: null, menus: null };
                    var mi = $(item);
                    menu.id = parseInt(mi.attr("data-menuId"));
                    menu.index = parseInt(mi.attr("data-index"));
                    menu.text = _gd(mi, "menuitem-text");
                    menu.url = _gd(mi, "menuitem-url");
                    if (menu.url === null) {
                        var nextRow = mi.parent().find(".menu-item-children[data-menuId='" + menu.id + "']");
                        //debugger;
                        menu.menus = _collectMenus(nextRow.find(" > td > .menu-items > tbody > .menu-item"));
                    }
                    menus.push(menu);
                });
                return menus;
            }
            //var mm = $($U.Format(".menu-editor .menu-master[data-masterid='{0}']", masterId));

            var masterId = currentMenu.masterId;
            var mm = $($U.Format(".menu-editor .menu-master[data-masterid='{0}']", masterId));
            var master = { id: null, name: null, forMenuPanel: null, pageUrl: null, classNames: null, menus: null };
            master.id = masterId,
            master.name = _gd(mm, "name");
            master.forMenuPanel = _gd(mm, "for-menu-panel");;//_getValue($(mm).find("input[data-item='for-menu-panel']"));
            if (master.forMenuPanel === false) {
                master.pageUrl = _gd(mm, "page-url");// _getValue($(mm).find("input[data-item='page-url']"));
            }
            master.classNames = _gd(mm, "class-name");// _getValue($(mm).find("input[data-item='class-name']"));

            var menuItems = $(mm).find(" div > .menu-items > tbody > .menu-item");
            master.menus = _collectMenus(menuItems);
            return master;
        }
        function _onCommand(data) {
            switch (data.command) {
                case "edit-styles":
                    _openStyleEditor();
                    break;
                case "new-menumaster":
                    _createNewMenuMaster();
                    break;
                case "open-menu":
                    _onOpenMenu(data.form, data.source);
                    break;
                case "close-form":
                case "close-menu":
                    _onCloseMenu(data.form);
                    break;
                case "mm-search-store":
                    _openStoreBrowser(1, data);
                    break;
                case "search-store":
                    _openStoreBrowser(2, data);
                    break;
                case "save-changes":
                    _saveChanges();
                    break;
                case "new-choice":
                    _addChoice(null);
                    break;
                case "add-sub-choice":
                    var menuId = parseInt($(data.source).closest(".menu-item").attr("data-menuId"));
                    _addChoice(menuId);
                    break;
                case "move-up":
                    var menuId = parseInt($(data.source).closest(".menu-item").attr("data-menuId"));
                    _moveChoice(menuId, -1);
                    break;
                case "move-down":
                    var menuId = parseInt($(data.source).closest(".menu-item").attr("data-menuId"));
                    _moveChoice(menuId, 1);
                    break;
                case "delete-menumaster":
                    _delete(null);
                    break;
                case "delete-menu":
                    var menuId = parseInt($(data.source).closest(".menu-item").attr("data-menuId"));
                    _delete(menuId);
                    break;
                default:
                    $U.Debug("unknown command {0}", data.command);
                    break;
            }
        }
        function _openStoreBrowser(filter, data) {
            // flags as defined in the enum ContentFilter
            //  SidePages = 1,
            //  CentrePages = 2,
            //  Documents = 4,
            //  Images = 8,
            //  All = 15 // all the above
            var sb = StoreBrowser.get();
            sb.show({
                Filter: filter,
                Mode: "select",
                AllowEditing: false,
                OnSelect: function (ctx, selectedItem) {
                    if (data.command === "mm-search-store") {
                        mef.setData("page-url", selectedItem.Url);
                        var masterId = currentMenu.masterId;
                        var mm = $($U.Format(".menu-editor .menu-master[data-masterid='{0}']", masterId));
                        $(mm).find("input[data-item='page-url']").trigger("blur");
                    } else if (data.command === "search-store") {
                        $(data.source).closest("div[data-property]").find("input[data-item]").val(selectedItem.Url);
                    }
                }
            });
        }
        function _load() {
            if (mef !== null) {
                mef.close();
            }
            var menus_url = "designer/menuapi/get/mms";
            var editor_template = "template/get/designer-forms/menueditor";
            $.when($U.AjaxGet({ url: menus_url })).then(function (r) {
                menuMasters = r;
                mef = new $.fastnet$forms.CreateForm(editor_template, {
                    Title: "Menu Editor",
                    IsModal: false,
                    OnCommand: function (f, cmd, src) {
                        _onCommand({ form: f, command: cmd, source: src });
                    },
                    OnChange: function (f, dataItem, checked) {
                        $U.Debug("OnChange: data-item {0}, checked {1} ", dataItem, checked);
                        _onCommand({ form: mef, command: "data-change", item: item, checked: checked });
                        //mef.enableCommand("save-changes");
                    }
                }, { masters: menuMasters });
                mef.show(function () {
                    mef.disableCommand("save-changes");
                    mef.find(".menu-master input[data-item='name']").prop("disabled", true);
                    mef.find(".menu-master .saving-help").hide();
                    mef.disableCommand("delete-menumaster");
                });
            });
        }
        function _start() {
            _logStartup();
            $("button[data-cmd='edit-styles']").on("click", function (e) {
                _onCommand({command: "edit-styles", source: this});
            });
            _load();
        }
        function _logStartup() {
            $U.Debug("MenuEditor started");
        }
        return {
            start: _start
        };
    }
    function getInstance() {
        if (!instance) {
            instance = new createInstance();
        }
        return instance;
    }
    return {
        get: getInstance
    }
})(jQuery);