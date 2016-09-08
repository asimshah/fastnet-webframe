var t$m = null;
(function ($) {
    function test() {
        debugger;
    }
    var $T;
    var $U;
    var MenuData = function () {
        var instance = null;
        function createInstance() {
            var mmid = null;
            var menuList = [];
            var loaded = false;
            var data = null;
            //function _getMenuList() {
            //    return menuList;
            //}
            function _addMenu(menu) {
                menuList.push(menu);
            }
            return {
                masterId: mmid,
                addMenu: _addMenu,
                loaded: loaded,
                data: data,
                menuList: menuList
            }
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
    }
    $.core$page = {
        toolbar: null,
        pageEditor: null,
        isEditing: false,
        options: null,
        panelData: {
            Access: null,
            EditablePanels: [
                { pageId: null, selector: ".CentrePanel", masterMenus: [], menuList: [], menuIdList: null, menuData: [] },
                { pageId: null, selector: ".BannerPanel", masterMenus: [], menuList: [], menuIdList: null, menuData: [] },
                { pageId: null, selector: ".LeftPanel", masterMenus: [], menuList: [], menuIdList: null, menuData: [] },
                { pageId: null, selector: ".RightPanel", masterMenus: [], menuList: [], menuIdList: null, menuData: [] }
            ],
            MenuPanel: { masterMenus: [], menuList: [], menuData: [] },
        },
        Init: function () {
            function _toolbarOpened() {
                // before we load editors we need to park all menus

                $T.ParkAllMenus();
                $T.pageEditor.LoadEditors();
            }
            function _exitEditRequested() {
                var result = $T.pageEditor.UnloadEditors();
                if (result) {
                    // as we have unloaded editors
                    // we need to restore all menus

                    $T.RestoreAllMenus();
                }
            }
            $T = this;
            $U = $.fastnet$utilities;
            $T.toolbar = PageToolbar.get();
            $T.toolbar.addHandler("toolbar-opened", _toolbarOpened);
            $T.toolbar.addHandler("exit-edit-mode", _exitEditRequested);
            $T.pageEditor = PageEditor.get();
            $T.pageEditor.SetChangePageHandler(function (r) {
                $U.Debug("Editor asked for new page {0}", r.url);
                $T.GotoInternalLink(r.url);
            });
            if (navigator.appVersion.toLowerCase().indexOf("safari") === -1) {
                $(window).bind('popstate', function (event) {
                    var obj = event.originalEvent.state;
                    if (obj === null) {
                        location.href = "home";
                    } else {
                        var url = obj.href;
                        if (url.startsWith("page/")) {
                            //var id = parseInt(url.substring(6));
                            $T.SetPage(url.substring(5));
                        }
                    }
                });
            }
        },
        FindEditablePanel: function (panelSelector) {
            var result = null;
            $.each($T.panelData.EditablePanels, function (i, ep) {
                if (ep.selector === panelSelector) {
                    result = ep;
                    return false;
                }
            });
            return result;
        },
        RestoreAllMenus: function () {
            function _restoreList(selector, masterMenus) {
                $(selector).find(".menu-location").empty(); // remove the &nbsp; that somehow gets in here!
                $.each(masterMenus, function (i, master) {
                    $.each(master.menuList, function (j, menu) {
                        $U.Debug("Should restore: {0}, master {1} menu {2}", selector, master.masterId, menu.getId());
                        menu.restore();
                    });
                });
            }
            $.each($T.panelData.EditablePanels, function (i, ep) {
                _restoreList(ep.selector, ep.masterMenus);
            });

        },
        ParkAllMenus: function () {
            function _parkList(selector, masterMenus) {
                $.each(masterMenus, function (i, master) {
                    $.each(master.menuList, function (j, menu) {
                        //$U.Debug("Should park: {0}, master {1} menu {2}", selector, master.masterId, menu.getId());
                        menu.park();
                    });
                });
            }
            $.each($T.panelData.EditablePanels, function (i, ep) {
                _parkList(ep.selector, ep.masterMenus);
            });

        },

        CreateMenus2: function (panelSelector, panelCtx) {
            // panelCtx is either one of the EditablePanels or $T.panelData.MenuPanel
            // menuDataArray is a MenuData[]
            var menuDataArray = panelCtx.masterMenus;
            function findMenuData(masterId) {
                var md = null;
                $.each(menuDataArray, function (i, entry) {
                    if (entry.masterId === masterId) {
                        md = entry;
                        return false;
                    }
                });
                return md;
            }
            function createMenu(panelSelector, mm, opts) {
                var url = $U.Format("pageapi/menu/{0}", mm.Id);
                $.when($U.AjaxGet({ url: url })).then(function (r) {
                    var md = findMenuData(mm.Id);
                    md.loaded = true;
                    if (r.length > 0) {
                        var menu = Menu.get();
                        t$m = menu;// for diagnostics
                        var options = $.extend({ menuClasses: [mm.Name, mm.ClassName] }, opts);
                        var menuid = menu.create(panelSelector, r, options);
                        //md.menu = menu;
                        md.addMenu(menu);
                        md.data = r;
                        //$U.Debug("Panel {0}, master {1}, added menu {2}", panelSelector, mm.Id, menu.getId());
                        $($T.panelData).trigger("menucreated", { selector: panelSelector, menuId: menu.getId() });
                        $(panelSelector + " .fastnet-menu a").on("click", function (e) {
                            var url = $(e.currentTarget).attr("href");
                            //$U.Debug("menu link to {0}", url);
                            if ($T.IsLinkInternal(url)) {
                                e.preventDefault();
                                //if (url == "/login") {
                                //    $T.options.ReturnUrl = "asim";
                                //}
                                $T.GotoInternalLink(url);
                            }
                        });
                    }

                });
            }
            // first build a list masterIds to get from the server
            var mmIdList = [];
            $.each(menuDataArray, function (i, item) {
                mmIdList.push(item.masterId);
            });
            // now get details from the server
            var url = "pageapi/menu/master";
            var postData = { option: null, idList: mmIdList };
            $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                // r is an array of {Id, ClassName, Name, Panel}
                //$T.CreateMenus(r);
                $.each(r, function (i, mm) {
                    switch (mm.Panel) {
                        case "menupanel":
                            createMenu(".MenuPanel", mm);
                            break;
                        case "bannerpanel":
                            createMenu(".BannerPanel", mm);
                            break;
                        case "leftpanel":
                            createMenu(".LeftPanel", mm, { direction: "vertical" });
                            break;
                        case "rightpanel":
                            createMenu(".RightPanel", mm, { direction: "vertical" });
                            break;
                    }

                });
            });
        },
        StandardiseUrl: function (url) {
            var thisSite = $("head base").attr("href");
            url = url.toLowerCase();
            if (url.startsWith(thisSite)) {
                url = url.substring(thisSite.length, url.length - thisSite.length)
            }
            if (!(url.startsWith("http") || url.startsWith("file") || url.startsWith("mailto"))) {
                if (url.startsWith("/")) {
                    url = url.substring(1);
                }
            }
            return url;
        },
        GotoInternalLink: function (url) {
            url = $T.StandardiseUrl(url); //NB: this removes any leading "/"
            switch (url) {
                //case "/home":
                case "login":
                    //case "/login":
                    $T.ShowDialog("login");
                    break;
                case "register":
                case "recoverpassword":
                    //case "/studio":
                    //case "/membership":
                    $.fastnet$account.AccountOperation(url);
                    break;
                case "userprofile":
                    $T.ShowDialog("userprofile");
                    break;
                default:
                    if (url.startsWith("page/")) {
                        //var id = parseInt(url.substring(6));
                        $T.SetPage(url.substring(5));
                        window.history.pushState({ href: url }, "", url);
                    }
                    break;
            }
        },
        IsLinkInternal: function (url) {
            var result = false;
            url = $T.StandardiseUrl(url);
            //var builtIn = [
            //    "home", "login", "logon", "login", "logoff", "register", "recoverpassword",
            //    "studio", "membership"];
            var builtIn = [
               "login", "logon", "logoff", "register", "recoverpassword"];
            function isBuiltIn(url) {
                var r = false;
                $.each(builtIn, function (i, item) {
                    r = url === item;
                    if (r) {
                        return false; // breaks out .each loop
                    }
                });
                return r;
            };
            var internalUrl = !(url.startsWith("http") || url.startsWith("file") || url.startsWith("mailto"));
            if (internalUrl) {
                if (isBuiltIn(url)) {
                    result = true;
                } else {
                    result = url.startsWith("page/") || url.startsWith("document/") || url.startsWith("video/");
                }
            }
            return result;
        },
        ShowDialog: function (dialoguename) {
            var url = $U.Format("model/{0}", dialoguename);
            $.when($U.AjaxGet({ url: url })).then(function (r) {
                $.fastnet$account.Start(r, function () {
                    //$T.QueryAuthentication();
                });
            });
        },

        LoadStartPage: function (startPage) {
            $T.SetReponsiveFeatures();
            var pageId = startPage;
            var url = "pageapi/menupanel/get/menumasters";
            $T.panelData.MenuPanel.masterMenus = [];
            $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                // r is an array of mm ids
                $.each(r, function (i, id) {
                    var md = new MenuData().get();
                    md.masterId = id;
                    $T.panelData.MenuPanel.masterMenus.push(md);
                });
                //$T.CreateMenus2($T.panelData.MenuPanel.masterMenus);
                $T.CreateMenus2(".MenuPanel", $T.panelData.MenuPanel);
                $T.SetPage(pageId);
                $T.QueryAuthentication();
            });
        },
        ParallelCalls: function () {
            $.when(
                $U.AjaxGet({ url: "main/special/echo/2" }),
                $U.AjaxGet({ url: "main/special/echo/5" })
                //$.get("main/special/echo/1"),
                //$.get("main/special/echo/4")
            ).then(function (one, two) {
                alert("both done");
                $U.MessageBox("#exampleModal");
            });
        },
        QueryAuthentication: function () {
            $.when(
                $U.AjaxGet({ url: "account/currentuser" }, true)
                ).then(function (r) {
                    if (r.Authenticated) {
                        var userEmailAddress = r.EmailAddress;
                        var userName = r.Name;
                        var lastUserKey = "last-successful-user";
                        $U.SetData(lastUserKey, userEmailAddress);
                        $(".login-name").html(userName).removeClass('hide');
                    } else {
                        $(".login-name").addClass('hide').html("");
                    }
                });
        },
        SetPage: function (pageId) {
            $.when(
                $U.AjaxGet({ url: "pageapi/sidepages/" + pageId })
                , $U.AjaxGet({ url: "pageapi/page/access/" + pageId })
                ).then(function (q0, q1) {
                    var sidePages = q0[0];
                    var centrePageId = pageId;
                    var access = q1[0].Access;
                    $T.UpdatePanel($T.FindEditablePanel(".BannerPanel"), sidePages.Banner);
                    $T.UpdatePanel($T.FindEditablePanel(".LeftPanel"), sidePages.Left);
                    $T.UpdatePanel($T.FindEditablePanel(".RightPanel"), sidePages.Right);
                    $T.UpdatePanel($T.FindEditablePanel(".CentrePanel"), { Id: centrePageId, Menu: null });
                    $(".SitePanel .login-status").off();
                    $(".SitePanel .login-status").on("click", function () {
                        //alert("Load user profile");
                        $T.GotoInternalLink("/userprofile");
                    });
                    $T.panelData.Access = access;
                    if ($T.panelData.Access == "editallowed") {
                        $T.toolbar.show();
                    } else {
                        $T.toolbar.hide();
                    }
                });
        },
        Start: function (options) {
            $U.Debug("pathname = {0}, {1}", location.pathname, location.href);
            $T.options = options;
            if ($T.options.ClientSideLog) {
                $.fastnet$utilities.EnableClientSideLog();
            }
            $T.LoadStartPage(options.StartPage);
            if (options.HasAction) {
                if (options.ShowDialog) {
                    var url = location.href;
                    var changeTo = $U.Format("{0}//{1}", location.protocol, location.host);
                    window.history.pushState({ href: url }, null, changeTo);
                    // for now the only dialogue actions are in $.fastnet$account
                    $.fastnet$account.Start(options, function () {
                        $T.QueryAuthentication();
                    });
                } else {
                    //$.core$editor.Start();
                    //debugger;
                }
            }


        },
        ClearContent: function (ep) {
            var name = ep.selector.substr(1).toLowerCase();
            var styleId = $U.Format("{0}-style", name);
            $("head").find("#" + styleId).remove();
            $(ep).empty();
            ep.pageId == null;
            ep.Menu = null;
        },
        UpdatePanel: function (ep, pageData) {
            if (ep.pageId !== pageData.Id) {
                if (pageData.Id != null) {
                    ep.masterMenus = [];
                    ep.pageId = pageData.Id;
                    ep.menuIdList = pageData.MenuList;
                    if (pageData.MenuList != null) {
                        $.each(pageData.MenuList, function (i, mmid) {
                            // pageData.MenuList is a list of menumaster ids;
                            var md = new MenuData().get();
                            md.masterId = mmid;
                            ep.masterMenus.push(md);
                        });
                    }
                    $.when($U.AjaxGet({ url: "pageapi/page/" + ep.pageId })).then(function (result) {
                        $T.SetContent(ep, { access: result.Access, styleList: result.HtmlStyles, html: result.HtmlText, pageId: result.PageId, location: result.Location });
                    });
                } else {
                    $T.ClearContent(ep);
                }
            }
        },
        SetContent: function (ep, pageInfo) {
            var styleList = pageInfo.styleList;
            var html = pageInfo.html;
            if (typeof styleList !== "string") {
                var name = ep.selector.substr(1).toLowerCase();
                var styleId = $U.Format("{0}-style", name);
                var style = $U.Format("<style id='{0}'>", styleId);
                $.each(styleList, function (i, item) {
                    style += $U.Format("{0} {1}", ep.selector, item.Selector);
                    style += " {";
                    $.each(item.Rules, function (j, rule) {
                        style += rule + "; ";
                    });
                    style += "} ";
                });
                style += "</style>";
                $("head").find("#" + styleId).remove();
                $("head").append($(style));
            }
            $(ep.selector).off();
            var content = $(html);
            content.find('a').on("click", function (e) {
                var url = $(this).attr("href");
                if ($T.IsLinkInternal(url)) {
                    e.preventDefault();
                    url = $T.StandardiseUrl(url);
                    $T.GotoInternalLink(url);
                }
            });
            var name = ep.selector.substr(1).toLowerCase();
            $(ep.selector).empty().append(content);
            $(ep.selector).attr("data-page-id", pageInfo.pageId);
            $(ep.selector).attr("data-panel", name);
            $(ep.selector).attr("data-location", pageInfo.location);
            $(ep.selector).find(".menu-location").empty();// make sure menu locations are clean
            $T.CreateMenus2(ep.selector, ep);
        },
        OnBarCommand: function (cmd) {
            var masterList = null;
            switch (cmd) {
                case "show-main-menu":
                    masterList = $T.panelData.MenuPanel.masterMenus
                    break;
                case "show-left-menu":
                    var ep = $T.FindEditablePanel(".LeftPanel")
                    masterList = ep.masterMenus;
                    break;
                case "show-right-menu":
                    var ep = $T.FindEditablePanel(".RightPanel")
                    masterList = ep.masterMenus;
                    break;
                default:
                    $U.Debug("bars: {0}", cmd);
                    break;
            }
            $T.ShowBarMenu(cmd, masterList);
        },
        ShowBarMenu: function (cmd, masterList) {
            function insertBarMenuHtml() {
                function _insertMenuHTML(root_ul, md, level) {
                    // md is the data returned originally by /pageapi/get/menu
                    // {Level, Index, Text, Url, Submenus}
                    if (md.Submenus.length > 0) {
                        var s1 = "<li class='has-children is-closed'><a><span>{0}</span> <span class='fa fa-arrow-circle-down'></span></a><ul data-level='{1}'></ul></li>";
                        var html1 = $U.Format(s1, md.Text, level);
                        var x = $(html1);
                        var next = $(x).find("ul");
                        root_ul.append(x);
                        $.each(md.Submenus, function (k, sub_md) {
                            _insertMenuHTML(next, sub_md, level + 1);
                        });
                    } else {
                        var s2 = "<li><a href='{0}'><span>{1}</span></a></li>";
                        var html2 = $U.Format(s2, md.Url, md.Text);
                        root_ul.append($(html2));
                    }
                }
                $(".bar-menu").empty();
                $.each(masterList, function (i, master) {
                    // each master is start of an independent menu
                    if (master.data !== null) {
                        var l0ul = $("<ul data-level='0'></ul>").appendTo($(".bar-menu"));
                        $.each(master.data, function (j, md) {
                            _insertMenuHTML(l0ul, md, 1);
                        });
                    }
                });
            }
            var currentCmd = $(".bar-menu").attr("data-current");
            $(".bar-menu").slideUp();
            if (currentCmd !== cmd) {
                insertBarMenuHtml();
                var h = $(".menu-bars-container").outerHeight();
                $("ul[data-level='1'], ul[data-level='2']").slideUp();
                $(".bar-menu").css({ top: h }).slideDown();
                $(".bar-menu").attr("data-current", cmd);
                $(".bar-menu a").on("click", function (e) {
                    var li = $(this).closest("li");
                    var siblings = $(li).siblings();
                    siblings.each(function (i, sibling) {
                        if ($(sibling).hasClass("is-open")) {
                            $(sibling).find("li.is-open").removeClass("is-open").addClass("is-closed");
                            $(sibling).find("ul").slideUp();
                            $(sibling).removeClass("is-open").addClass("is-closed");
                        }
                    });
                    if ($(li).hasClass("has-children")) {
                        e.stopPropagation();
                        var level = parseInt($(li).closest("ul").attr("data-level"));
                        level++;
                        if ($(li).hasClass("is-closed")) {
                            $(li).find("ul[data-level='" + level + "']").slideDown();
                            $(li).removeClass("is-closed").addClass("is-open");
                            $(li).find("> a span.fa").removeClass("fa-arrow-circle-down").addClass("fa-arrow-circle-up");
                        } else {
                            $(li).find("ul[data-level='" + level + "']").slideUp();
                            $(li).addClass("is-closed").removeClass("is-open");
                            $(li).find("> a span.fa").removeClass("fa-arrow-circle-up").addClass("fa-arrow-circle-down");
                        }
                    } else {
                        $(".bar-menu").removeAttr("data-current");
                        $(".bar-menu").slideUp();
                    }
                });
            } else {
                $(".bar-menu").removeAttr("data-current");
            }
        },
        //LoadEditor: function (afterLoad) {
        //    // **NB** I do not use this lazy loading of the editor scripts
        //    // as I found a problem with the electric mobile emulation of sadari - it
        //    // was not able to debug. This is a problem thatis talked about on the net
        //    // and the crossDomain setting on the script call was supposed to fix it and
        //    // didn't. Not really bothered with it for now, am going back the older
        //    // way where the editor code will always be laoded - caching should make it
        //    // fast enough - let's see. 23Jun2015
        //    if (!$.core$editor) {
        //        var scripts = [
        //         "scripts/jquery-ui-1.11.4.min.js",
        //         "scripts/datatables/jquery.datatables.js",
        //         "scripts/tinymce/tinymce.js",
        //         "scripts/dropzone/dropzone.js",
        //         "scripts/fastnet/fastnet.contextmenu.js",
        //         "scripts/fastnet/fastnet.treeview.js",
        //         "scripts/main/core.editor.js"
        //        ];
        //        var dfds = [];
        //        $.each(scripts, function (i, url) {
        //            dfds.push($T.AjaxGetScript({ url: url }));
        //        });
        //        $.when.apply($, dfds).then(function () {
        //            afterLoad();
        //        });
        //    }

        //},
        //AjaxGetScript: function (args) {
        //    // **NB** not used - see comment in LoadEditor
        //    $(".ajax-error-message").empty();
        //    return $.ajax({
        //        url: "/" + args.url,// $T.rootUrl + args.url,
        //        dataType: "script",
        //        type: "GET",
        //        cache: true,
        //        crossDomain: true
        //    });
        //},
        SetReponsiveFeatures: function () {
            function countMenus(panelSelector) {
                var count = 0;
                var lp = $T.FindEditablePanel(panelSelector);
                $.each(lp.masterMenus, function (i, masater) {
                    if (master.data != null) {
                        count += master.data.length;
                    }
                });
                return count;
            }
            //function onWidthChange(mql) {
            //    if (mql.matches) {
            //        $(".SitePanel").removeClass("normal-width").addClass("narrow-width");
            //        $U.Debug("query match");
            //    } else {
            //        $(".SitePanel").removeClass("narrow-width").addClass("normal-width");
            //        $U.Debug("query does not match");
            //    }
            //}

            $(".main-bars").hide();
            $(".left-bars").hide();
            $(".right-bars").hide();

            $($T.panelData).on("menucreated", function (e, data) {
                switch (data.selector) {
                    case ".MenuPanel":
                        $(".main-bars").show();
                        break;
                    case ".LeftPanel":
                        $(".left-bars").show();
                        break;
                    case ".RightPanel":
                        $(".right-bars").show();
                }
            });
            $(".SitePanel .bars").on("click", function (e) {
                e.stopPropagation();
                var cmd = $(this).attr("data-cmd");
                $T.OnBarCommand(cmd);
            });
            //var mql = window.matchMedia("(max-width: 768px)");
            //mql.addListener(onWidthChange);
            //onWidthChange(mql);// sync with current state
        }
    };
    $(function () {
        $.core$page.Init();
        //debugger;
    });
})(jQuery);