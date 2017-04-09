var PageEditor = (function () {
    // this uses a javascript singleton pattern
    var $U = $.fastnet$utilities;
    var instance = null;
    function createInstance() {
        var pages = {
            banner: { key: "banner", panelSelector: ".BannerPanel", eid: "#bannerPanel", pageId: null, savedHtml: null, mce: null, allowDelete: true, allowMenuPlaceHolder: true},
            centre: { key: "centre", panelSelector: ".CentrePanel", eid: "#centrePanel", pageId: null, savedHtml: null, mce: null, allowDelete: false, allowMenuPlaceHolder: false },
            left: { key: "left", panelSelector: ".LeftPanel", eid: "#leftPanel", pageId: null, savedHtml: null, mce: null, allowDelete: true, allowMenuPlaceHolder: true },
            right: { key: "right", panelSelector: ".RightPanel", eid: "#rightPanel", pageId: null, savedHtml: null, mce: null, allowDelete: true, allowMenuPlaceHolder: true }
        };
        var _onChangePageHandler = null;
        var _tinymceUrl = null;
        var _toolbar = null;
        function _addContent(panel) {
            $U.Debug("add content for {0} (centre page id is {1})", panel, pages.centre.pageId);
            var url = "store/createpage";
            var postData = { referencePageId: pages.centre.pageId, directoryId: null, type: panel };
            $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                var newPageId = r.PageId;
                $.when(
                    $U.AjaxGet({ url: "pageapi/page/" + newPageId })
                    ).then(function (result) {
                        _removePanelOverlay(panel);
                        var panelName = pages[panel].panelSelector.substring(1);
                        var ep = $.core$page.FindEditablePanel("." + panelName);
                        //$.core$page.SetContent(panelName, { styleList: result.HtmlStyles, html: result.HtmlText, pageId: result.PageId, location: result.Location });
                        $.core$page.SetContent(ep, { styleList: result.HtmlStyles, html: result.HtmlText, pageId: result.PageId, location: result.Location });
                        pages[panel].pageId = result.PageId;
                        _initEditing(panel);
                    });
            });
        }
        function _addPanelOverlay(panel) {
            var overlay = $("<div class='overlay'><button class='btn btn-xs btn-primary'>Add Content</button></div>");
            $(pages[panel].panelSelector).addClass("editor-side-panel").append(overlay);
            overlay.find(".btn").on("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                _addContent(panel);
            });
        }
        function _changesPending() {
            var result = false;
            $.each(tinymce.EditorManager.editors, function (index, ed) {
                if (ed.isDirty()) {
                    result = true;
                    return false;
                }
            });
            return result;
        }
        function _closeMce(mce) {
            if (mce !== null) {
                //mce.setContent('');
                mce.remove();
            }
        }
        function _deletePage(page) {
            var id = page.pageId;
            var url = $U.Format("store/delete");
            var postData = { type: "page", id: id };
            $.when($U.AjaxPost({ url: url, data: postData })).then(function (result) {
                page.pageId = null;
                $(page.panelSelector).removeAttr("data-page-id");
                $(page.panelSelector).removeAttr("data-location");
                _initEditing(page.key);
                });
        }
        function _exitEditRequested() {
            function __unloadEditorsAndClose() {
                _closeMce(pages.banner.mce);
                _closeMce(pages.left.mce);
                _closeMce(pages.centre.mce);
                _closeMce(pages.right.mce);
                pages.banner.mce = null;
                pages.left.mce = null;
                pages.centre.mce = null;
                pages.right.mce = null;
                tinymce.remove();
                _removePanelOverlay("banner");
                _removePanelOverlay("left");
                _removePanelOverlay("centre");
                _removePanelOverlay("right");
                _toolbar.disableCommand("save-changes");
                _toolbar.close();
                // the following tidies up after tinymce (it should do this itself, IMHO)
                $("table.mce-item-table").removeClass("mce-item-table");
                $("div.mce-resizehandle").remove();
                $("div[contenteditable='true'").removeAttr('contenteditable');
                $(window).off(".editor");
            }
            var result = false;
            if (_changesPending()) {
                $U.Confirm("There are unsaved changes which will be lost. Please confirm", function () {
                    __unloadEditorsAndClose();
                    $(pages.banner.panelSelector).html(pages.banner.savedHtml);
                    $(pages.left.panelSelector).html(pages.left.savedHtml);
                    $(pages.centre.panelSelector).html(pages.centre.savedHtml);
                    $(pages.right.panelSelector).html(pages.right.savedHtml);
                    pages.banner.savedHtml = null;
                    pages.left.savedHtml = null;
                    pages.centre.savedHtml = null;
                    pages.right.savedHtml = null;
                    result = true;
                });
            } else {
                __unloadEditorsAndClose();
                result = true;
            }
            //if ($(".login-status").hasClass("enable")) {
            //    $(".login-status").show();
            //}
            return result;
        }
        function _findPageForMce(mce) {
            // i.e. find entry in pages[]
            var page = null;
            $.each(pages, function (i, item) {
                if (item.mce === mce) {
                    page = item;
                    return false;
                }
            });
            return page;
        }
        function _handlePageChange(url) {
            _savePageChanges(function () {
                _exitEditRequested();
                if ($.isFunction(_onChangePageHandler)) {
                    _onChangePageHandler({ url: url });
                } else {
                    alert("ChangePage handler missing!");
                }
            });
        }
        function _initEditing(panel) {
            var pageId = pages[panel].pageId;
            if (pageId === null) {
                if (pages[panel].mce !== null) {
                    pages[panel].mce.remove();
                    pages[panel].mce = null;
                }
                pages[panel].savedHtml = null;
                _addPanelOverlay(panel);
            } else {
                _openMce(pages[panel]);
            }
        }
        function _initialize() {
            var baseUrl = $("head base").prop("href");
            _tinymceUrl = baseUrl + "Scripts/tinymce/";
            _toolbar = PageToolbar.get();
            //_toolbar.addHandler("toolbar-opened", _toolbarOpened);
            //_toolbar.addHandler("exit-edit-mode", _exitEditRequested);
            _toolbar.addHandler("save-changes", _savePageChanges);
            _toolbar.addHandler("open-store-browser", function () {
                _openStoreBrowser("normal");
            });
            _toolbar.addHandler("page-info-command", _togglePageInformation);
            //$U.Debug("PageEditor initialized");
        }
        function _onWindowResize() {
            var totalHeight = $(window).height();
            var panel = pages.centre.panelSelector;
            var panelTop = $(panel).offset().top;
            var availableHeight = totalHeight - panelTop;
            $(panel).css("max-height", availableHeight + "px");
        }
        function _openInsertLinkForm(opts) {
            function pasteLink(mce, linkurl, linktext) {
                var content = null;
                if (linkurl.indexOf("image/") === 0) {
                    content = $U.Format('<img src="{0}" alt="{1}">', linkurl, linktext);
                } else {
                    content = $U.Format('<a href="{0}">{1}</a>', linkurl, linktext);
                }
                mce.focus();
                mce.execCommand("mceReplaceContent", 0, content);
            };
            function getSelectedText(mce) {
                var text = "";
                var htmlText = mce.selection.getContent({ format: 'html' });
                htmlText = $("<textarea/>").html(htmlText).text();
                try {
                    if ($(htmlText).prop("tagName") === "A") {
                        text = $(htmlText).text();
                        url = $(htmlText).attr("href");
                    } else {
                        text = htmlText;
                    }
                } catch (e) {
                    text = htmlText;
                }
                return text;
            }
            var options = $.extend({ mode: 'prompt' }, opts);
            var currentMce = tinymce.EditorManager.activeEditor;
            var editAfterCreate = options.mode === "createandedit";
            switch (options.mode) {
                case "createandedit":
                case 'createnew':
                    var selectedText = getSelectedText(currentMce);
                    var page = _findPageForMce(currentMce);
                    var pageId = parseInt($(page.panelSelector).attr("data-page-id"));
                    var url = $U.Format("store/createpage");
                    var postData = { referencePageId: pageId, directoryId: null, type: "centre" };
                    $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                        var newPageId = r.PageId;
                        var pageUrl = r.Url;
                        var pageName = r.Name;
                        if (selectedText === null || selectedText === "") {
                            selectedText = pageName;
                        }
                        pasteLink(currentMce, pageUrl, selectedText);
                        if (editAfterCreate) {
                            _handlePageChange(pageUrl);
                        }
                    });
                    break;
                case "prompt":
                    var ilf = new $.fastnet$forms.CreateForm("template/get/main-forms-editor/inserthyperlink", {
                        Title: "Insert Link",
                        AfterItemValidation: function (f, result) {
                            if (result.success) {
                                f.enableCommand("insertlink");
                            } else {
                                f.disableCommand("insertlink");
                            }
                        },
                        OnChange: function(f, dataItem) {
                            f.enableCommand("insertlink");
                        },
                        OnCommand: function (f, cmd) {
                            switch (cmd) {
                                case "find-link":
                                    f.clearMessages();
                                    _openStoreBrowser("select", f);
                                    //$T.BrowseForLink.Start(f, function () {
                                    //});
                                    break;
                                case "insertlink":
                                    var data = f.getData();
                                    if (data.linktext === null || data.linktext === "") {
                                        data.linktext = data.linkurl;
                                    }
                                    pasteLink(currentMce, data.linkurl, data.linktext);
                                    f.close();
                                    break;
                            }
                        },
                    }, {
                        LinkUrl: url,
                        LinkText: selectedText
                    });
                    var validator = new $.fastnet$validators.Create(ilf);
                    validator.AddIsRequired("linkurl", "A link url is required");
                    ilf.disableCommand("insertlink");
                    ilf.show();
                    break;
            }
        }
        function _insertMenuPlaceHolder() {
            function pastePlaceHolder(mce, linkurl, linktext) {
                mce.focus();
                mce.execCommand("mceReplaceContent", 0, "<div class='menu-location'></div>");
            };
            var currentMce = tinymce.EditorManager.activeEditor;
            pastePlaceHolder(currentMce);
        }
        function _openMce(page) {
            page.savedHtml = $(page.panelSelector).html();
            tinymce.baseURL = _tinymceUrl;
            tinymce.init({
                selector: page.panelSelector,
                browser_spellcheck: true,
                visual_table_class: "",
                paste_data_images: true,
                plugins: "textcolor colorpicker visualblocks table link image code",
                menubar: false,
                inline: true,
                toolbar_items_size: 'small',
                toolbar: ["undo redo | cut copy paste | styleselect | fontselect fontsizeselect | visualblocks code | deletepage",
                          "bold italic forecolor backcolor | bullist numlist | alignleft aligncenter alignright outdent indent | insertlinks | table"],
                setup: function (editor) {
                    page.mce = editor;
                    if (page.allowDelete) {
                        editor.addButton('deletepage', {
                            type: 'button',
                            //text: 'delete page',
                            title: 'delete this content',
                            onclick: function () {
                                _deletePage(page);
                                //alert('delete clicked');
                            }
                        });
                    }
                    var insertmenu = [
                            { text: 'Insert link/image ...', onclick: function () { _openInsertLinkForm({ mode: 'prompt' }); } },
                            { text: 'Insert link to new page', onclick: function () { _openInsertLinkForm({ mode: 'createnew' }); } },
                            { text: 'Insert link & edit new page ...', onclick: function () { _openInsertLinkForm({ mode: 'createandedit' }); } }
                    ];
                    if (page.allowMenuPlaceHolder) {
                        insertmenu.push({ text: 'Insert menu placeholder', onclick: function () { _insertMenuPlaceHolder(); } });
                    }
                    editor.addButton('insertlinks', {
                        type: 'menubutton',
                        text: 'Links|Images',
                        title: "insert links & images",
                        icon: 'link',
                        menu: insertmenu
                        //menu: [
                        //    { text: 'Insert link/image ...', onclick: function () { _openInsertLinkForm({ mode: 'prompt' }); } },
                        //    { text: 'Insert link to new page', onclick: function () { _openInsertLinkForm({ mode: 'createnew' }); } },
                        //    { text: 'Insert link & edit new page ...', onclick: function () { _openInsertLinkForm({ mode: 'createandedit' }); } }                            
                        //]
                    });
                    editor.on('change', function (e) {
                        _toolbar.enableCommand("save-changes");
                    });
                }
            });
        }
        function _openStoreBrowser(mode, userData) {
            // mode must be "normal" , or "select"
            // Since "select" mode is only ever called from InsertLinkForm, we know
            // userData will be that form - we need this to extract the 
            // selectedItem.url
            var sb = StoreBrowser.get();
            if (mode === "normal") {
                sb.show();
            } else {
                sb.show({
                    Mode: "select",
                    Filter: (2+4+8),
                    User: userData,
                    OnClose: null,
                    OnCancel: null,
                    OnSelect: function (ctx, selectedItem) {
                        ctx.setData("linkurl", selectedItem.Url);
                        ctx.setData("linktext", selectedItem.Name);
                        if (ctx.isValid()) {
                            ctx.enableCommand("insertlink");
                        } else {
                            ctx.disableCommand("insertlink");
                        }
                    }
                });
            }
        }
        function _removePanelOverlay(panel) {
            $(pages[panel].panelSelector).find(".overlay").off().remove();
            $(pages[panel].panelSelector).removeClass("editor-side-panel");
        }
        function _savePageChanges(callback) {
            $U.SetEnabled($(".edit-toolbar button[data-cmd='save-changes']"), false);
            var postData = { banner: {}, left: {}, centre: {}, right: {} };
            function updatePageData(panel) {
                pages[panel].mce.isNotDirty = true;
                pages[panel].savedHtml = pages[panel].mce.getContent();
            }
            function getPageData(panel) {
                var pd = pages[panel];
                var r = null;
                if (pd.pageId !== null && pd.mce.isDirty()) {
                    r = { hasChanges: true, id: pd.pageId, html: pd.mce.getContent() };
                } else {
                    r = { hasChanges: false }
                }
                return r;
            }
            postData.banner = getPageData("banner");
            postData.left = getPageData("left");
            postData.centre = getPageData("centre");
            postData.right = getPageData("right");
            var url = "store/update/page/content";
            $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                if (postData.banner.hasChanges) {
                    updatePageData("banner");
                }
                if (postData.left.hasChanges) {
                    updatePageData("left");
                }
                if (postData.centre.hasChanges) {
                    updatePageData("centre");
                }
                if (postData.right.hasChanges) {
                    updatePageData("right");
                }
                if ($.isFunction(callback)) {
                    callback();
                }
                $U.Confirm("Changes Saved", function () { });
                //$U.SetEnabled($(".edit-toolbar button[data-cmd='save-changes']"), false);
            });
        }
        function _setChangePageHandler(handler) {
            _onChangePageHandler = handler;
        }
        function _toolbarOpened() {
            // load up all editors
            //if ($(".login-status").hasClass("enable")) {
            //    $(".login-status").hide();
            //}
            _toolbar.disableCommand("save-changes");
            pages.centre.pageId = $(".CentrePanel").attr("data-page-id");
            var url = $U.Format("store/sidepages/{0}", pages.centre.pageId);
            $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                pages.banner.pageId = r.Banner;// r.BannerPanel.PageId;
                pages.left.pageId = r.Left;// r.LeftPanel.PageId;
                pages.right.pageId = r.Right;//r.RightPanel.PageId;
                _initEditing("banner");
                _initEditing("left");
                _initEditing("centre");
                _initEditing("right");
                setTimeout(function () {
                    pages.centre.mce.execCommand("mceAddControl", false, $(pages.centre.eid));//  $(pages.centre.panelSelector));
                }, 1000);
                $(window).on("resize.editor", function () {
                    _onWindowResize();
                });
                _onWindowResize();
            });
        }
        function _togglePageInformation() {
            function getPageId(selector) {
                return $(selector).attr("data-page-id");
            }
            function getLocation(selector) {
                var location = $(selector).attr("data-location");
                if (location === "Store") {
                    location = "Store (root folder)";
                }
                return location;
            }
            function updatePanel(selector) {
                var infoSelector = null;
                switch (selector) {
                    case ".BannerPanel":
                        infoSelector = ".banner-info";
                        break;
                    case ".LeftPanel":
                        infoSelector = ".left-info";
                        break;
                    case ".CentrePanel":
                        infoSelector = ".centre-info";
                        break;
                    case ".RightPanel":
                        infoSelector = ".right-info";
                        break;
                }
                if ($(selector).is(":visible")) {
                    var item = $U.Format(".edit-panel .page-information {0}", infoSelector);
                    var id = getPageId(selector);
                    if (typeof id === "undefined") {
                        $(item).find("span:nth-child(2)").text("no content");
                        $(item).find("span:nth-child(3)").hide();
                        $(item).find("span:nth-child(4)").text('');
                    } else {
                        var location = getLocation(selector);
                        var url = $U.Format("page/{0}", id);

                        $(item).find("span:nth-child(2)").text(url);
                        $(item).find("span:nth-child(3)").show();
                        $(item).find("span:nth-child(4)").text(location);
                    }
                    $(infoSelector).show();
                } else {
                    $(infoSelector).hide();
                }
            }
            if (_toolbar.isPageInformationOpen()) {
                $U.Debug("update page info now");
                var memberName = $(".login-status .login-name").text();
                $(".edit-panel .page-information .member-info span:nth-child(2)").text(memberName);
                updatePanel(".BannerPanel");
                updatePanel(".LeftPanel");
                updatePanel(".CentrePanel");
                updatePanel(".RightPanel");
            }
        }
        //
        _initialize();
        return {
            SetChangePageHandler: _setChangePageHandler,
            LoadEditors: _toolbarOpened,
            UnloadEditors : _exitEditRequested
            // expose instance methods here
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
