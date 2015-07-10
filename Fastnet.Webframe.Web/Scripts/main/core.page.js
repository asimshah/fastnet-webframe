var t$m = null;
(function ($) {
    function test() {
        //debugger;


        //function a() {
        //    this.id = index++;
        //    a.prototype.test1 = function (x) {
        //        if (typeof x !== "undefined") {
        //            this.id = x;
        //        }
        //        return this.id;
        //    }
        //}
        //var t1 = new a();
        //var t2 = new a();
        //$U.Debug("t1.test1 = {0}", t1.test1());
        //$U.Debug("t2.test1 = {0}", t2.test1());
        //var t = {
        //    ta: a
        //};
        //var t3 = new t.ta();
        //var t4 = new t.ta();
        //$U.Debug("t3.test1 = {0}", t3.test1(12));
        //$U.Debug("t4.test1 = {0}", t4.test1());
        debugger;
    }
    var $T;
    var $U;
    $.core$page = {
        toolbar: null,
        pageEditor: null,
        isEditing: false,
        options: null,
        currentPage: {
            Access: null,
            CentrePanel: { id: null, selector: ".CentrePanel" },
            BannerPanel: { id: null, selector: ".BannerPanel" },
            LeftPanel: { id: null, selector: ".LeftPanel" },
            RightPanel: { id: null, selector: ".RightPanel" }
        },
        //currentPages: { centreId: null, bannerId: null, leftId: null, rightId: null },
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
            $T.toolbar = PageToolbar.get();
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

        CreateMenus: function (menuList) {
            function createMenu(panelSelector, masterInfo) {
                var url = $U.Format("pageapi/menu/{0}", masterInfo.Id);
                $.when($U.AjaxGet({ url: url })).then(function (r) {
                    var menu = Menu.get();
                    t$m = menu;// for diagnostics
                    var menuId = menu.create(panelSelector, r, { menuClasses: [masterInfo.Name, masterInfo.ClassName] });
                    //menu.logDetails(menuId);
                });
            }
            $.each(menuList, function (i, item) {
                if (item.Panel === "menupanel") {
                    // support only menus in menu panels for now
                    createMenu(".MenuPanel", item);
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
                $U.AjaxGet({ url: "pageapi/menuinfo" })).then(function (menuInfo) {
                    $T.CreateMenus(menuInfo);
                    //var menuInfoResult = menuInfo;
                    //var menuVisible = false;
                    //if (menuVisible) {
                    //    var menuHtml = menuInfoResult.MenuHtml;
                    //    $T.CreateMenus(menuHtml);
                    //}
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
                    var bannerPageId = sidePages.Banner;
                    var leftPageId = sidePages.Left;
                    var rightPageId = sidePages.Right;
                    var access = q1[0].Access;
                    //$T.currentPages.bannerId = $T.UpdatePanel("BannerPanel", $T.currentPages.bannerId, bannerPageId);
                    //$T.currentPages.leftId = $T.UpdatePanel("LeftPanel", $T.currentPages.leftId, leftPageId);
                    //$T.currentPages.rightId = $T.UpdatePanel("RightPanel", $T.currentPages.rightId, rightPageId);
                    //$T.currentPages.centreId = $T.UpdatePanel("CentrePanel", $T.currentPages.centreId, centrePageId);
                    $T.UpdatePanel($T.currentPage.BannerPanel, bannerPageId);
                    $T.UpdatePanel($T.currentPage.LeftPanel, leftPageId);
                    $T.UpdatePanel($T.currentPage.RightPanel, rightPageId);
                    $T.UpdatePanel($T.currentPage.CentrePanel, centrePageId);
                    $(".SitePanel .login-status").off();
                    $(".SitePanel .login-status").on("click", function () {
                        //alert("Load user profile");
                        $T.GotoInternalLink("/userprofile");
                    });
                    $T.currentPage.Access = access;
                    if ($T.currentPage.Access == "editallowed") {
                        //if (canEdit) {
                        $T.toolbar.show();
                    } else {
                        $T.toolbar.hide();
                    }
                });
        },
        //SetContent: function (panelName, pageInfo) {
        //    var styleList = pageInfo.styleList;
        //    var html = pageInfo.html;
        //    if (typeof styleList !== "string") {
        //        var styleId = $U.Format("{0}-style", panelName.toLowerCase());
        //        var style = $U.Format("<style id='{0}'>", styleId);
        //        $.each(styleList, function (i, item) {
        //            style += $U.Format(".{0} {1}", panelName, item.Selector);
        //            style += " {";
        //            $.each(item.Rules, function (j, rule) {
        //                style += rule + "; ";
        //            });
        //            style += "} ";
        //        });
        //        style += "</style>";
        //        $("head").find("#" + styleId).remove();
        //        $("head").append($(style));
        //    }
        //    $("." + panelName).off();
        //    var content = $(html);
        //    content.find('a').on("click", function (e) {
        //        var url = $(this).attr("href");
        //        if ($T.IsLinkInternal(url)) {
        //            e.preventDefault();
        //            url = $T.StandardiseUrl(url);
        //            $T.GotoInternalLink(url);
        //        }
        //    });
        //    var panelSelector = "." + panelName;
        //    $(panelSelector).empty().append(content);
        //    $(panelSelector).attr("data-page-id", pageInfo.pageId);
        //    $(panelSelector).attr("data-panel", panelName);
        //    $(panelSelector).attr("data-location", pageInfo.location);
        //},
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
        //UpdatePanel: function (panelName, newPageId) {
        //    if (currentPageId !== newPageId) {
        //        if (newPageId != null) {
        //            $.when($U.AjaxGet({ url: "pageapi/page/" + newPageId })).then(function (result) {
        //                $T.SetContent(panelName, { styleList: result.HtmlStyles, html: result.HtmlText, pageId: result.PageId, location: result.Location });
        //            });
        //        } else {
        //            $T.ClearContent(panelName);
        //        }
        //        return newPageId;
        //    }
        //},
        //ClearContent: function (panelName) {
        //    var styleId = $U.Format("{0}-style", panelName.toLowerCase());
        //    $("head").find("#" + styleId).remove();
        //    $("." + panelName).empty();
        //},
        ClearContent: function (pageEntry) {
            var name = pageEntry.selector.substr(1).toLowerCase();
            var styleId = $U.Format("{0}-style", name);
            $("head").find("#" + styleId).remove();
            $(pageEntry).empty();
        },
        SetContent: function (pageEntry, pageInfo) {
            var styleList = pageInfo.styleList;
            var html = pageInfo.html;
            if (typeof styleList !== "string") {
                var name = pageEntry.selector.substr(1).toLowerCase();
                var styleId = $U.Format("{0}-style", name);
                var style = $U.Format("<style id='{0}'>", styleId);
                $.each(styleList, function (i, item) {
                    style += $U.Format("{0} {1}", pageEntry.selector, item.Selector);
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
            $(pageEntry.selector).off();
            var content = $(html);
            content.find('a').on("click", function (e) {
                var url = $(this).attr("href");
                if ($T.IsLinkInternal(url)) {
                    e.preventDefault();
                    url = $T.StandardiseUrl(url);
                    $T.GotoInternalLink(url);
                }
            });
            //var panelSelector = "." + panelName;
            var name = pageEntry.selector.substr(1).toLowerCase();
            $(pageEntry.selector).empty().append(content);
            $(pageEntry.selector).attr("data-page-id", pageInfo.pageId);
            $(pageEntry.selector).attr("data-panel", name);
            $(pageEntry.selector).attr("data-location", pageInfo.location);
            //if (pageEntry === $T.currentPage.CentrePanel) {
            //    $T.currentPage.Access = pageInfo.access;
            //    debugger;
            //}
        },
        UpdatePanel: function (pageEntry, newPageId) {
            if (pageEntry.id !== newPageId) {
                if (newPageId != null) {
                    $.when($U.AjaxGet({ url: "pageapi/page/" + newPageId })).then(function (result) {
                        $T.SetContent(pageEntry, { access: result.Access, styleList: result.HtmlStyles, html: result.HtmlText, pageId: result.PageId, location: result.Location });
                    });
                } else {
                    $T.ClearContent(pageEntry);
                }
                pageEntry.id = newPageId;
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