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
            Edit: function(panel) {
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
    var currentMenu = {masterId : null, menuList: null};
    function createInstance() {
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
                _onCommand({ form: mef, command: cmd, menuId: menuId });
            });
            $(itemsSelector).find("input[type=text][data-item]").on("input", function () {
                var item = $(this).attr("data-item");
                var menuId = parseInt($(this).closest(".menu-item").attr("data-menuId"));
                //$U.Debug("menu-item change: item {0}, id {1}", item, menuId);
                _onCommand({ form: mef, command: "data-change", menuId: menuId, item: item });
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
                $U.AjaxGet({url: templateUrl}),
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
                    _updateUI();
                    _bindMenuItems();
            });
        }
        function _onOpenMenu(f, src) {
            var mm = $(src).closest(".menu-master");
            var masterId = parseInt( mm.attr("data-masterid"));
            _loadmenus(mm, masterId);
            var othersSelector = $U.Format(".menu-master:not([data-masterid='{0}'])", masterId);
            f.find(othersSelector).slideUp();
            $(mm).find(".menu-details").removeClass("hidden").slideDown();
            $(mm).find("span[data-cmd='open-menu']").addClass("hidden");
            $(mm).find("span[data-cmd='close-menu']").removeClass("hidden");
            $(mm).find("input[data-item='name']").prop("disabled", false);
            $(mm).find("button[data-cmd='delete-menumaster']").prop("disabled", false);
            f.disableCommand("new-menumaster");
        }
        function _onCloseMenu(f) {
            //var mm = $(src).closest(".menu-master");
            //var masterId = parseInt(mm.attr("data-masterid"));
            //if (masterId !== currentMenu.masterId) {
            //    $U.Debug("Unexpected failure: id from dom ({0}) != cuurrentMenu id ({1})", masterId, currentMenu.masterId);
            //} else {
                var masterId = currentMenu.masterId;
                var mm = $($U.Format(".menu-editor .menu-master[data-masterid='{0}']", masterId));
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
                f.enableCommand("new-menumaster");
            //}
        }
        function _onCommand(data) {
            switch (data.command) {
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
                default:
                    $U.Debug("unknown command {0}", data.command);
                    break;
            }
        }
        function _load() {
            var menus_url = "designer/menuapi/get/mms";
            var editor_template = "template/get/designer-forms/menueditor";
            $.when($U.AjaxGet({ url: menus_url })).then(function (r) {
                menuMasters = r;
                mef = new $.fastnet$forms.CreateForm(editor_template, {
                    Title: "Menu Editor",
                    IsModal: false,
                    OnCommand: function (f, cmd, src) {

                        _onCommand({form: f, command: cmd, source: src});
                    },
                    OnChange: function (f, dataItem, checked) {
                        $U.Debug("OnChange: data-item {0}, checked {1} ", dataItem, checked);
                        _onCommand({ form: mef, command: "data-change", item: item, checked: checked });
                        //mef.enableCommand("save-changes");
                    }
                }, { masters: menuMasters});
                mef.show(function () {
                    mef.disableCommand("save-changes");
                    mef.find(".menu-master input[data-item='name']").prop("disabled", true);
                    mef.disableCommand("delete-menumaster");
                });
            });
        }
        function _start() {
            _logStartup();
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