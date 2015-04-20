(function ($) {
    var $T;
    var $U;
    var $TV;
    var pageBrowser = function (options) {
        this.options = $.extend({
            OnCancel: null,
            OnSelect: null
        }, options);
        var contentTemplate =
            "        <table  cellpadding='0' cellspacing='0' border='0' id='folder-content'>" +
            "          <thead>" +
            "            <tr>" +
            "                <th class='url'>Url</th>" +
            "                <th class='name'>Name</th>" +
            "                <th class='side-content'></th>" +
            "            </tr>" +
            "          </thead>" +
            "          <tbody>" +
            "            {{#data}}" +
            "            <tr>" +
            "                <td class='url'><div data-id='{{PageId}}'>{{Url}}</div></td>" +
            "                <td class='name'><div>{{Name}}</div></td>" +
            "                <td class='side-content'><div>{{SC}}</div></td>" +
            "            </tr>" +
            "            {{/data}}" +
            "          </tbody>" +
            "        </table>";
        var bfl = null;
        var treeview = null;
        var currentDirectoryId = null;
        var self = this;
        pageBrowser.prototype.SelectedPageId = null;
        pageBrowser.prototype.Show = function () {
            bfl = new $.fastnet$form("template/form/BrowseForLink", {});
            treeview = $TV.NewTreeview({
                Selector: ".browser-tree",
                OnSelectChanged: onFolderSelectChanged,
                OnExpandCollapse: onExpandCollapse,
            });
            var url = $U.Format("store/directories");
            $.when($U.AjaxGet({ url: url }, true)).then(function (data) {

                //$F.Bind({ afterItemValidation: null, onCommand: onCommand });
                bfl.disableCommand("select-page");
                bfl.disableCommand("delete-page");
                bfl.disableCommand("add-new-page");
                bfl.show(function (f) {
                    loadTreeViewItem(null, data);
                });
            });
            
            //$.when($F.LoadForm(self, "Page Browser", "template/form/BrowseForLink", "editor-dialog find-link", { ClientAction: { IsModal: true, IsResizable: true } })
            //    ).then(function () {
            //        form = $F.GetForm();
            //        treeview = $TV.NewTreeview({
            //            Selector: ".browser-tree",
            //            OnSelectChanged: onFolderSelectChanged,
            //            OnExpandCollapse: onExpandCollapse,
            //        });
            //        var url = $U.Format("store/directories");
            //        $.when($U.AjaxGet({ url: url }, true)).then(function (data) {
            //            loadTreeViewItem(null, data);
            //            $F.Bind({ afterItemValidation: null, onCommand: onCommand });
            //            $F.DisableCommand("select-page");
            //            $F.DisableCommand("delete-page");
            //            $F.DisableCommand("add-new-page");
            //            $F.Show();
            //        });
            //    });
        };
        function onCommand(ctx, cmd) {
            switch (cmd) {
                case "system-close":
                case "cancel":
                    if (self.options.OnCancel !== null) {
                        self.options.OnCancel();
                    }
                    break;
                case "select-page":
                    if (self.options.OnSelect !== null) {
                        self.options.OnSelect(self.SelectedPageId);
                    }
                    break;
                case "add-new-page":
                    createNewPage();
                    break;
                default:
                    $U.Debug("browser cmd: {0}", cmd);
                    break;
            }
        };
        function createNewPage() {
            var url = $U.Format("store/createpage");
            var postData = { directoryId: currentDirectoryId };
            $.when(
                $U.AjaxPost({ url: url, data: postData })
                ).then(function (result) {
                    var pageId = result.PageId;
                    $U.Debug("created new page {0}", result.Url);
                    loadDirectoryContent();
                });
        };
        function selectPage(pageId) {
            self.SelectedPageId = pageId;
            if (self.SelectedPageId === null) {
                $F.DisableCommand("select-page");
                $F.DisableCommand("delete-page");
                $U.Debug("Selected page {0}", self.SelectedPageId);
            } else {
                $F.EnableCommand("select-page");
                $F.EnableCommand("delete-page");
            }
            
        };
        function onExpandCollapse (data) {
            $U.Debug("+/- for {0}, closed = {1}, loaded = {2}, child count = {3}", data.userData, data.isClosed, data.isLoaded, data.childCount);
            if (!data.isLoaded) {
                loadSubdirectories(data.node, parseInt(data.userData));
            }
        };
        function onFolderSelectChanged  (data) {
            $U.Debug("de(select) for {0}, closed = {1}, selected = {2}, child count = {3}", data.userData, data.isClosed, data.isSelected, data.childCount);
            var directoryId = parseInt(data.userData);
            var folderContent = bfl.find(".browser-folder-content");
            if (currentDirectoryId !== directoryId) {
                currentDirectoryId = directoryId;
                loadDirectoryContent();
                //folderContent.show();
            }
            if (data.isSelected) {
                bfl.enableCommand("add-new-page");
                folderContent.show();
            } else {
                bfl.disableCommand("add-new-page");
                folderContent.hide();
            }
        };
        function loadTreeViewItem(node, data) {
            $.each(data, function (index, item) {
                var html = $U.Format("<span class='fa fa-folder folder-icon' ></span><span class='title' >{0}</span>", item.Name);
                node = treeview.AddNode(node, { NodeHtml: html, Title: item.Name, UserData: item.Id, ChildCount: item.SubdirectoryCount });
                //ctx.contextMenu.AttachTo(node);
            });
        };
        function loadSubdirectories(node, directoryId) {
            var url = $U.Format("store/directories/{0}", directoryId);
            $.when($U.AjaxGet({ url: url }, true)).then(function (data) {
                if (data.length === 0) {
                    // there are no subdirectories but we need to ensure that the node
                    // is set to isLoaded.
                    //$TV.SetNodeLoaded(node);
                    treeview.SetNodeLoaded(node);
                } else {
                    loadTreeViewItem(node, data);
                }
            });
        };
        function loadDirectoryContent() {
            var url = $U.Format("store/content/{0}", currentDirectoryId);
            $.when($U.AjaxGet({ url: url }, true)).then(function (data) {
                if (data.length > 0) {
                    var content = { data: [] };
                    $.each(data, function (index, item) {
                        var sc = "";
                        if (item.HasBanner) {
                            sc += "B";
                        }
                        if (item.HasLeft) {
                            sc += "L";
                        }
                        if (item.HasRight) {
                            sc += "R";
                        }
                        content.data.push({
                            PageId: item.PageId,
                            Url: item.Url,
                            Name: item.Name,
                            SC: sc
                        });
                    });
                    var dataTable = $(Mustache.to_html(contentTemplate, content));
                    $(".browser-folder-content").empty().append(dataTable);
                    $(".browser-folder-content table td.url div").on("click", function (e) {
                        //debugger;
                        var target = $(e.currentTarget);
                        if (target.hasClass("selected")) {
                            target.removeClass("selected");
                            selectPage(null);
                        } else {
                            $(".browser-folder-content table td.url div").removeClass("selected");
                            target.addClass("selected");
                            selectPage(target.attr("data-id"));
                        }
                        
                    });
                } else {
                    $(".browser-folder-content table").off();
                    $(".browser-folder-content").empty().html("<div>Folder is empty</div>")
                }
            });
        };
    };
    $.core$editor = {
        cm: null,
        isOpen: false,
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
            $TV = $.fastnet$treeview;
            //$U.Debug("");
            $T.cm = $.fastnet$contextmenu.GetContextMenu();
            //$cm.AddMenuItem("Insert Link ...", "insert-link", $T.OnContextMenu, {})
            //$cm.AddMenuItem("Insert Image ...", "insert-image", $T.OnContextMenu, {})
            $cm.BeforeOpen = $T.OnBeforeContextMenuOpen;
            $(".edit-panel").on("click", function (e) {
                var cmd = $(e.target).attr("data-cmd");
                if (typeof cmd === "undefined" || cmd === false) {
                    $T.Start();
                }
            });
            $(".edit-panel").addClass("closed");//.height(8);
            $U.SetEnabled($(".edit-toolbar button[data-cmd='save-changes']"), false);
            $(".edit-toolbar button").on("click", function () {
                var cmd = $(this).attr("data-cmd");
                $T.OnCommand(cmd, null);
            });
        },
        CloseEditors: function (okcallback) {
            //var result = false;
            if ($T.IsDirty()) {
                $U.MessageBox("There are unsaved changes. Closing edit mode will discard these changes!", {
                    enableSystemCancel: true,
                    enableCancelButton: true,
                    OKFunction: function () {
                        tinymce.remove();
                        //result = true;
                        okcallback();
                    },
                    okButtonLabel: "Yes", cancelButtonLabel: "No"
                });
            } else {
                tinymce.remove();
                //result = true;
                okcallback();
            }
            //return result;
        },
        InsertLink: {
            browserState: {
                currentDirectoryId: null
            },
            treeview: null,
            //treePanel: null,
            currentEditor: null,
            Start: function () {
                var $this = this;
                $this.currentEditor = tinymce.EditorManager.activeEditor;
                var text = "";
                var url = "";
                var htmlText = $this.currentEditor.selection.getContent({ format: 'html' });
                htmlText = $("<textarea/>").html(htmlText).text();
                try{
                    if ($(htmlText).prop("tagName") === "A") {
                        text = $(htmlText).text();
                        url = $(htmlText).attr("href");
                    } else {
                        text = htmlText;
                    }
                } catch (e) {
                    text = htmlText;
                }

                var f = new $.fastnet$form("template/form/inserthyperlink", {
                    Title: "Insert Link",
                    OnCommand: function (form, cmd) {
                        switch (cmd) {
                            case "find-link":
                                f.close();
                                $T.BrowseForLink.Start();
                                break;
                        }
                    }
                });

                f.fill({
                    "linkurl": url,
                    "linktext": text
                });
                f.addIsRequiredValidator("linkurl");
                f.disableCommand("insertlink");
                f.show();
                
                //$.when($F.LoadForm($this, "Insert Link", "template/form/inserthyperlink", "editor-dialog insert-link", { ClientAction: { IsModal: true } })
                //    ).then(function () {
                //        var form = $F.GetForm();
                //        $(form).find("#linkurl").val(url);
                //        $(form).find("#linktext").val(text);
                //        $F.AddIsRequiredValidation("linkurl", "Link url is required");
                //        $F.AddIsRequiredValidation("linktext", "Some link text is required");
                //        $F.Bind({ afterItemValidation: $this.AfterItemValidation, onCommand: $this.OnCommand });
                //        $F.DisableCommand("insertlink");
                //        $F.Show();
                //    });
            },
            AfterItemValidation: function (ctx, item, totalItems, totalWithState, totalErrors) {
                if (totalErrors > 0) {
                    $F.DisableCommand("insertlink");
                } else {
                    $F.EnableCommand("insertlink");
                }
            },        
            pb: null,
            OnCommand: function (ctx, cmd) {
                switch (cmd) {
                    case "insertlink":
                        var form = $F.GetForm();
                        var url = $(form).find("#linkurl").val();
                        var linktext = $(form).find("#linktext").val();
                        var content = $U.Format('<a href="{0}">{1}</a>', url, linktext);
                        $U.Debug(content);
                        //ctx.currentEditor.insertContent(content);
                        ctx.currentEditor.execCommand("mceReplaceContent", 0, content);
                        $F.Close();
                        break;
                    case "find-link":

                        ctx.pb = new pageBrowser();
                        ctx.pb.Show();
                        //ctx.BrowseForLink();
                        break;
                    case "system-close":
                    case "cancel":
                        //if (ctx.currentForm === "find-link") {
                        //    ctx.Start();
                        //}
                        break;
                    default:
                        alert("This feature is not implemented");
                        break;
                }
            },
        },
        BrowseForLink : {
            Start: function() {
                var pb = new pageBrowser();

                pb.Show();
            }
        },
        IsDirty: function () {
            var result = false;
            $.each(tinymce.EditorManager.editors, function (index, ed) {
                if (ed.isDirty()) {
                    result = true;
                    return false;
                }
            });
            return result;
        },

        OnBeforeContextMenuOpen: function (src) {
            $cm.ClearMenuItems();
            $cm.AddMenuItem("Insert Link ...", "insert-link", $T.OnContextMenu, {})
            $cm.AddMenuItem("Insert Image ...", "insert-image", $T.OnContextMenu, {})
            var panel = $(src).closest(".editable-content");
            if (typeof panel !== "undefined" && panel !== null) {
                //if ($(panel).hasClass("editor-open")) {
                //    $T.cm.DisableMenuItem("open-editor");
                //    $T.cm.EnableMenuItem("close-editor");
                //} else {
                //    $T.cm.DisableMenuItem("close-editor");
                //    $T.cm.EnableMenuItem("open-editor");
                //}
            }
        },
        OnCommand: function (cmd, data) {
            switch (cmd) {
                case "exit-edit-mode":
                    $T.Stop();
                    break;
                    //case "open-editor":
                    //case "close-editor":
                    //    //var panelName = $T.getPanelName(data.panel);
                    //    //alert($U.Format("Command {0} for {1}", cmd, panelName));
                    //    //$T.OpenEditor(panelName);
                    //    break;
                case "insert-link":
                    $T.InsertLink.Start();
                    break;
                case "insert-image":
                    //break;
                default:
                    alert("This feature is not implemented");
                    break;
            }
        },
        OnContextMenu: function (src, index, cmd, data) {
            switch (cmd) {
                //case "open-editor":
                //case "close-editor":
                default:
                    var panel = $(src).closest(".editable-content");
                    $T.OnCommand(cmd, { panel: panel });
                    break;
                case "test":
                    if ($T.cm.IsMenuItemDisabled(1)) {
                        $T.cm.EnableMenuItem(1);
                    } else {
                        $T.cm.DisableMenuItem(1);
                    }
                    break;
                    //default:
                    //    alert("context menu cmd = " + cmd);
                    //    break;
            }
        },
        OnContentChange: function (ed) {
            $U.Debug("text change ({0})", ed.settings.selector);
            $U.SetEnabled($(".edit-toolbar button[data-cmd='save-changes']"), true);
        },
        OpenEditor: function (panelName) {
            var selector = "." + panelName;
            tinymce.init({
                selector: selector,
                browser_spellcheck: true,
                visual_table_class: "",
                plugins: "textcolor colorpicker visualblocks table link image code",
                menubar: false,
                inline: true,
                toolbar_items_size: 'small',
                toolbar: ["undo redo | styleselect | fontselect fontsizeselect | alignleft aligncenter alignright | visualblocks",
                          "bold italic | forecolor backcolor | bullist numlist outdent indent | table | link image | code"],
                //fixed_toolbar_container: "#mceToolBar"//,
                setup: function (editor) {
                    editor.on('change', function (e) {
                        $T.OnContentChange(editor);
                    });
                }
            });
        },
        Start: function () {
            if (!$T.isOpen) {
                $(".edit-toolbar").addClass("opaque");
                $(".edit-panel").removeClass("closed").addClass("open");//.height(32);
                $T.isOpen = true;
            }
            //$T.cm.AttachTo($(".edit-panel"));
            var eps = $(".editable-content");
            $.each(eps, function (index, ep) {
                $T.cm.AttachTo($(ep));
            });
            $T.StartEditors();
        },
        StartEditors: function () {
            $T.OpenEditor("BannerPanel");
            $T.OpenEditor("LeftPanel");
            $T.OpenEditor("CentrePanel");
            $T.OpenEditor("RightPanel");
            setTimeout(function () {
                var ed = tinymce.editors[$(".CentrePanel").attr("id")];
                ed.execCommand("mceAddControl", false, $(".CentrePanel"));
            }, 500);
        },
        Stop: function () {
            //$T.cm.DetachFrom($(".edit-panel"));
            $T.CloseEditors(function () {
                var eps = $(".editable-content");
                $.each(eps, function (index, ep) {
                    $T.cm.DetachFrom($(ep));
                });
                $T.isOpen = false;
                $(".edit-toolbar").removeClass("opaque");
                $(".edit-panel").removeClass("open").addClass("closed");
                $T.cleanupTinymce();

            })
        },
        getPanelName: function (element) {
            var list = $(element)[0].classList;
            var name = null;
            $.each(list, function (index, item) {
                switch (item) {
                    case "BannerPanel":
                    case "LeftPanel":
                    case "CentrePanel":
                    case "RightPanel":
                        name = item;
                        return false;
                        break;
                }
            });
            return name;
        },
        cleanupTinymce: function () {
            // tinynce should do this!
            $("table.mce-item-table").removeClass("mce-item-table");
            $("div.mce-resizehandle").remove();
            $("div[contenteditable='true'").removeAttr('contenteditable');
        },
        testtree: function () {
            var form = $F.GetForm();
            var treePanel = form.find(".browser-tree");
            var alphaNode = $TV.AddNode(treePanel, { Title: "Alpha", UserData: 1 });
            var alpha_1_node = $TV.AddNode(alphaNode, { Title: "Alpha-1", UserData: 2 });
            var alpha_1_1_node = $TV.AddNode(alpha_1_node, { Title: "Alpha-1-1", UserData: 3 });
            var betaNode = $TV.AddNode(treePanel, { Title: "Beta", UserData: 4 });
            var gammaNode = $TV.AddNode(treePanel, { Title: "Gamma", UserData: 5 });
            var deltaNode = $TV.AddNode(treePanel, { Title: "Delta", UserData: 6 });
        }
    };
    $(function () {
        $.core$editor.Init();
        //debugger;
    });
})(jQuery);