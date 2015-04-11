(function ($) {
    var $T;
    var $U;
    $.core$page = {
        options: null,
        currentPages: { centreId: null, bannerId: null, leftId: null, rightId: null },
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
            $(window).bind('popstate', function (event) {
                Debug.writeln(location.href);
                location.href = location.href;
            });
        },        
        ClearContent: function (panelName) {
            var styleId = $U.Format("{0}-style", panelName.toLowerCase());
            $("head").find("#" + styleId).remove();
            $("." + panelName).empty();
        },
        CreateMenus: function (menuHtml) {
            var menus = $(menuHtml);
            var toplevel = menus.first();
            toplevel.addClass("nav navbar-nav");
            $(".MenuPanel").empty().append(menus);
        },
        GotoInternalLink: function (url) {
            switch (url) {
                //case "/home":
                //case "/login":
                //case "/register":
                //case "/recoverpassword":
                //case "/studio":
                //case "/membership":
                //    $.fastnet$account.AccountOperation(url.substring(1));
                //    break;
                case "/userprofile":
                    $T.ShowDialog("userprofile");
                    break;
                default:
                    if (url.startsWith("/page")) {
                        var id = parseInt(url.substring(6));
                        $T.SetPage(url.substring(6));
                        window.history.pushState({href: url}, null, url);
                    }
                    break;
            }
        },
        IsLinkInternal: function(url) {
            var result = false;
            url = $T.StandardiseUrl(url);
            var builtIn = ["/home", "/login", "/register", "/recoverpassword",
                                "/studio", "/membership"];
            function isBuiltIn(url) {
                var r = false;
                var parts = url.split("/");
                if (parts.length === 2) {
                    $.each(builtIn, function (i, item) {
                        r = item === parts[1];// url.endsWith(item);
                        if (r) {
                            return false; // breaks out .each loop
                        }
                    });
                }
                return r;
            };
            var internalUrl = !(url.startsWith("http") || url.startsWith("file") || url.startsWith("mailto"));
            if( internalUrl) {
                if(isBuiltIn(url)) {
                    result = true;
                } else {
                    result = url.startsWith("/page") || url.startsWith("/document") || url.startsWith("/video");
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
        StandardiseUrl: function(url) {
            var thisSite = $("head base").attr("href");
            url = url.toLowerCase();
            if (url.startsWith(thisSite)) {
                url = url.substring(thisSite.length, url.length - thisSite.length)
            }
            if (!(url.startsWith("http") || url.startsWith("file") || url.startsWith("mailto"))) {
                if (!url.startsWith("/")) {
                    url = "/" + url;
                }
            }
            return url;
        },
        LoadHomePage: function () {
        //LoadHomePage: function (sa) {
            var homeUrl = "pageapi/home";
            //if (sa != null && sa !== "") {
            //    homeUrl = homeUrl + "/" + sa;
            //}
            $.when(
                $U.AjaxGet({ url: "pageapi/menuinfo" }),
                $U.AjaxGet({ url: homeUrl })
                ).then(function (menuInfo, home) {
                    var menuInfoResult = menuInfo[0];
                    var homeResult = home[0];
                    var menuVisible = menuInfoResult.Visible;
                    if (menuVisible) {
                        var menuHtml = menuInfoResult.MenuHtml;
                        $T.CreateMenus(menuHtml);
                    }
                    var homePageId = homeResult.PageId;
                    $T.SetPage(homePageId);
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
        QueryAuthentication : function() {
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
                $U.AjaxGet({ url: "pageapi/panelinfo/" + pageId })
                ).then(function (panelinfo) {
                    var centrePageId = pageId;
                    var bannerPageId = panelinfo.BannerPanel.Visible ? panelinfo.BannerPanel.PageId : null;
                    var leftPageId = panelinfo.LeftPanel.Visible ? panelinfo.LeftPanel.PageId : null;
                    var rightPageId = panelinfo.RightPanel.Visible ? panelinfo.RightPanel.PageId : null;
                    $T.currentPages.bannerId = $T.UpdatePanel("BannerPanel", $T.currentPages.bannerId, bannerPageId);
                    $T.currentPages.leftId = $T.UpdatePanel("LeftPanel", $T.currentPages.leftId, leftPageId);
                    $T.currentPages.rightId = $T.UpdatePanel("RightPanel", $T.currentPages.rightId, rightPageId);
                    $T.currentPages.centreId = $T.UpdatePanel("CentrePanel", $T.currentPages.centreId, centrePageId);
                    $(".SitePanel .login-status").off();
                    $(".SitePanel .login-status").on("click", function () {
                        //alert("Load user profile");
                        $T.GotoInternalLink("/userprofile");
                    });
                });
        },
        SetContent: function (panelName, styleList, html) {
            var styleId = $U.Format("{0}-style", panelName.toLowerCase());
            var style = $U.Format("<style id='{0}'>", styleId);
            $.each(styleList, function (i, item) {
                style += $U.Format(".{0} {1}", panelName, item.Selector);
                style += " {";
                $.each(item.Rules, function (j, rule) {
                    style += rule + "; ";
                });
                style += "} ";
            });
            style += "</style>";
            $("head").find("#" + styleId).remove();
            $("head").append($(style));
            $("." + panelName).off();
            var content = $(html);
            content.find('a').on("click", function (e) {
                var url = $(this).attr("href");
                if ($T.IsLinkInternal(url)) {
                    e.preventDefault();
                    url = $T.StandardiseUrl(url);
                    $T.GotoInternalLink(url);
                }
            });
            $("." + panelName).empty().append(content);
        },
        Start: function (options) {
            $T.options = options;
            //$T.LoadHomePage(options.StartPage);
            $T.LoadHomePage();
            if (options.HasAction) {
                if (options.ShowDialog) {
                    // for now the only dialogue actions are in $.fastnet$account
                    $.fastnet$account.Start(options, function () {
                        $T.QueryAuthentication();
                    });
                } else {
                    //$.core$editor.Start();
                    //debugger;
                }
            }
            //setTimeout(function () {
            //    setTimeout(function () {
            //        $U.UnBlock(".SitePanel");
            //    }, 5000);
            //    $U.Block(".SitePanel");
            //    //$(".SitePanel").block({  message: "<i class='fa fa-cog fa-spin'></i>", css: { backgroundColor: 'white' } });
            //}, 3000);
           
        },
        UpdatePanel: function (panelName, currentPageId, newPageId) {
            if (currentPageId !== newPageId) {
                if (newPageId != null) {
                    $.when($U.AjaxGet({ url: "pageapi/page/" + newPageId })).then(function (result) {
                        $T.SetContent(panelName, result.HtmlStyles, result.HtmlText);
                    });
                } else {
                    $T.ClearContent(panelName);
                }
                return newPageId;
            }
        },
    };
    $(function () {
        $.core$page.Init();
        //debugger;
    });
})(jQuery);