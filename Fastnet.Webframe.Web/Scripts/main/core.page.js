var t$m = null;
(function ($) {
    function test() {
        debugger;
    }
    var $T;
    var $U;
    $.core$page = {

        toolbar: null,
        pageEditor: null,
        isEditing: false,
        options: null,
        panelData: {
            Access: null,
            EditablePanels: [
                { pageId: null, selector: ".CentrePanel", menuMasterId: null, menu: null },
                { pageId: null, selector: ".BannerPanel", menuMasterId: null, menu: null },
                { pageId: null, selector: ".LeftPanel", menuMasterId: null, menu: null },
                { pageId: null, selector: ".RightPanel", menuMasterId: null, menu: null }
            ],
            MenuPanel: { menuList: [] },
        },
        Init: function () {
            function _toolbarOpened() {
                // before we load editors we need to park all menus
                // we should also turn off the login control here
                $T.ParkAllMenus();
                $T.pageEditor.LoadEditors();
            }
            function _exitEditRequested() {
                var result = $T.pageEditor.UnloadEditors();
                if(result){
                    // as we have unloaded editors
                    // we need to restore all menus
                    // we should also turn on the login control here if it is supposed to be on
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
            $(window).bind('popstate', function (event) {
                //Debug.writeln(location.href);
                if (navigator.appVersion.toLowerCase().indexOf("safari") === -1) {
                    location.href = location.href;
                }
            });
        },
        RestoreAllMenus: function() {
            $.each($T.panelData.EditablePanels, function (i, ep) {
                if (ep.menu !== null) {
                    ep.menu.restore();
                }
            });
            $.each($T.panelData.MenuPanel.menuList, function (i, m) {
                m.restore();
            });
        },
        ParkAllMenus: function() {
            $.each($T.panelData.EditablePanels, function (i, ep) {
                if (ep.menu !== null) {
                    ep.menu.park();
                }
            });           
            $.each($T.panelData.MenuPanel.menuList, function (i, m) {
                m.park();
            });
        },
        FindEditablePanel: function (panelSelector) {
            var result = null;
            $.each($T.panelData.EditablePanels, function (i, ep) {
                if(ep.selector === panelSelector) {
                    result = ep;
                    return false;
                }
            });
            return result;
        },
        CreateMenus: function (menuList) {
            function createMenu(panelSelector, masterInfo, opts) {
                var url = $U.Format("pageapi/menu/{0}", masterInfo.Id);
                $.when($U.AjaxGet({ url: url })).then(function (r) {
                    var menu = Menu.get();
                    t$m = menu;// for diagnostics
                    var options = $.extend({ menuClasses: [masterInfo.Name, masterInfo.ClassName] }, opts);
                    var menuId = menu.create(panelSelector, r, options);
                    if (panelSelector === ".MenuPanel") {
                        $T.panelData.MenuPanel.menuList.push(menu);
                    } else {
                        var ep = $T.FindEditablePanel(panelSelector);
                        ep.menu = menu;
                    }
                    //$("#" + menuId).find('a').on("click", function () {
                    //    var id = $(this).closest(".menu-item").attr("id");
                    //    $U.Debug("menu id {0} clicked", id);
                    //});
                });
            }
            // Note: menuList contains only one menu when called in the context of a sidepanel page.
            // In theory, at least, there might be noew than one when called in the context of the MenuPanel
            // In practice, this will occur only if the designer menu UI allows it
            // 
            $.each(menuList, function (i, item) {
                switch (item.Panel) {
                    case "menupanel":
                        createMenu(".MenuPanel", item);
                        break;
                    case "bannerpanel":
                        createMenu(".BannerPanel", item);
                        break;
                    case "leftpanel":
                        createMenu(".LeftPanel", item, { direction: "vertical"});
                        break;
                    case "rightpanel":
                        createMenu(".RightPanel", item, { direction: "vertical"});
                        break;
                }

            });
        },
        GotoInternalLink: function (url) {
            switch (url) {
                case "/home":
                case "login":
                    $T.ShowDialog("login");
                    break;
                case "/register":
                case "/recoverpassword":
                case "/studio":
                case "/membership":
                    $.fastnet$account.AccountOperation(url);
                    break;
                case "/userprofile":
                    $T.ShowDialog("userprofile");
                    break;
                default:
                    if (url.startsWith("page/")) {
                        //var id = parseInt(url.substring(6));
                        $T.SetPage(url.substring(5));
                        window.history.pushState({ href: url }, null, url);
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
               "login", "logon", "login", "logoff", "register", "recoverpassword"];
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
        LoadStartPage: function (startPage) {
            var pageId = startPage;
            $.when(
                $U.AjaxGet({ url: "pageapi/menumaster" })).then(function (menuInfo) {
                    $T.CreateMenus(menuInfo);
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
                    //$T.UpdatePanel($T.panelData.BannerPanel, sidePages.Banner);
                    //$T.UpdatePanel($T.panelData.LeftPanel, sidePages.Left);
                    //$T.UpdatePanel($T.panelData.RightPanel, sidePages.Right);
                    //$T.UpdatePanel($T.panelData.CentrePanel, { Id: centrePageId, Menu: null });
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
                        //if (canEdit) {
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
            //var links = content.find('a');
            content.find('a').on("click", function (e) {
                var url = $(this).attr("href");
                if ($T.IsLinkInternal(url)) {
                    e.preventDefault();
                    url = $T.StandardiseUrl(url);
                    $T.GotoInternalLink(url);
                }
            });
            //var panelSelector = "." + panelName;
            var name = ep.selector.substr(1).toLowerCase();
            $(ep.selector).empty().append(content);
            $(ep.selector).attr("data-page-id", pageInfo.pageId);
            $(ep.selector).attr("data-panel", name);
            $(ep.selector).attr("data-location", pageInfo.location);
            if (ep.menuMasterId != null) {
                $U.Debug("Panel selector {0} needs menu id {1}", ep.selector, ep.menuMasterId);
                var url = $U.Format("pageapi/menumaster/{0}", ep.menuMasterId);
                $.when($U.AjaxGet({ url: url })).then(function (r) {
                    $T.CreateMenus(r);
                });
            }
            //if (pageEntry === $T.panelData.CentrePanel) {
            //    $T.panelData.Access = pageInfo.access;
            //    debugger;
            //}
        },
        UpdatePanel: function (ep, pageData) {
            //var newPageId = pageData.Id;
            if (ep.pageId !== pageData.Id) {
                if (pageData.Id != null) {
                    $.when($U.AjaxGet({ url: "pageapi/page/" + pageData.Id })).then(function (result) {
                        $T.SetContent(ep, { access: result.Access, styleList: result.HtmlStyles, html: result.HtmlText, pageId: result.PageId, location: result.Location });
                    });
                } else {
                    $T.ClearContent(ep);
                }
                ep.pageId = pageData.Id;
                ep.menuMasterId = pageData.Menu;
            }
        },
        LoadEditor: function (afterLoad) {
            // **NB** I do not use this lazy loading of the editor scripts
            // as I found a problem with the electric mobile emulation of sadari - it
            // was not able to debug. This is a problem thatis talked about on the net
            // and the crossDomain setting on the script call was supposed to fix it and
            // didn't. Not really bothered with it for now, am going back the older
            // way where the editor code will always be laoded - caching should make it
            // fast enough - let's see. 23Jun2015
            if (!$.core$editor) {
                var scripts = [
                 "scripts/jquery-ui-1.11.4.min.js",
                 "scripts/datatables/jquery.datatables.js",
                 "scripts/tinymce/tinymce.js",
                 "scripts/dropzone/dropzone.js",
                 "scripts/fastnet/fastnet.contextmenu.js",
                 "scripts/fastnet/fastnet.treeview.js",
                 "scripts/main/core.editor.js"
                ];
                var dfds = [];
                $.each(scripts, function (i, url) {
                    dfds.push($T.AjaxGetScript({ url: url }));
                });
                $.when.apply($, dfds).then(function () {
                    afterLoad();
                });
            }

        },
        AjaxGetScript: function (args) {
            // **NB** not used - see comment in LoadEditor
            $(".ajax-error-message").empty();
            return $.ajax({
                url: "/" + args.url,// $T.rootUrl + args.url,
                dataType: "script",
                type: "GET",
                cache: true,
                crossDomain: true
            });
        },
    };
    $(function () {
        $.core$page.Init();
        //debugger;
    });
})(jQuery);