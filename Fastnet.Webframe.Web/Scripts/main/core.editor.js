(function ($) {
    var $T;
    var $U;
    var $TV;
    var pageBrowser = function (options) {
        // the page browser is constructed with a nested treeview:
        // 1. the primary form is a browserforlink
        // 2. inside this form a subform is embedded - the treeview
        //    Note that the treeview does not use fastnet.forms.js
        // this.forms keeps track of these two instances - see show()
        var pb = this;
        this.forms = {
            tv: null,
            bfl: null
        };
        this.options = $.extend({
            rootDirectoryId: null,
            currentDirectoryId: null,
            OnClose: null,
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
            "                <th class='edit-button'></th>" +
            "                <th class='delete-button'></th>" +
            "            </tr>" +
            "          </thead>" +
            "          <tbody>" +
            "            {{#data}}" +
            "            <tr data-id='{{Id}}' data-type='{{Type}}' data-url='{{Url}}' data-landing-page='{{LandingPage}}'>" +
            "                <td class='url'><div>{{Url}}</div></td>" +
            "                <td class='name'><div>{{Name}}</div></td>" +
            "                <td class='side-content'><div>{{SC}}</div></td>" +
            "                <td class='edit-button buttons'><div><span class='fa fa-pencil-square-o edit' title='Edit properties'></span></div></td>" +
            "                <td class='delete-button buttons'><div><span class='fa fa-times delete' title='Delete'></span></div></td>" +
            "            </tr>" +
            "            {{/data}}" +
            "          </tbody>" +
            "        </table>";
        function close() {
            pb.forms.bfl.close();
        }
        function onCommand(cmd) {
            switch (cmd) {
                case "system-close":
                case "cancel":
                    if (pb.options.OnCancel !== null) {
                        pb.options.OnCancel();
                    }
                    if (pb.options.OnClose !== null) {
                        pb.options.OnClose();
                    }
                    break;
                case "select-page":
                    if (pb.options.OnSelect !== null) {
                        pb.options.OnSelect(pb.options.Context, pb.SelectedItem);
                    }
                    close();
                    if (pb.options.OnClose !== null) {
                        pb.options.OnClose();
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
        function showFolderProperties(id) {
            function saveDirectory(f) {
                var data = f.getData();
                var url = "store/update/directory";
                var postData = { id: id, name: data.name };
                $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                    f.close();
                    var node = findDirectoryNode(id)
                    node.find(".title").text(data.name);
                });
            }
            var url = $U.Format("store/get/directory/{0}", id);
            $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                //var options = $.extend({
                //    Title: $U.Format("Folder Properties"),
                //    AfterItemValidation: function () {
                //        if (dpf.isValid()) {
                //            dpf.enableCommand("save-changes");
                //        } else {
                //            dpf.disableCommand("save-changes");
                //        }
                //    },
                //    OnCommand: function (f, cmd) {
                //        switch (cmd) {
                //            case "save-changes":
                //                saveDirectory(f);
                //                break;
                //        }
                //    }
                //}, r);
                //var dpf = new $.fastnet$form("template/form/directoryproperties", options);
                var options = {
                    Title: $U.Format("Folder Properties"),
                    AfterItemValidation: function () {
                        if (dpf.isValid()) {
                            dpf.enableCommand("save-changes");
                        } else {
                            dpf.disableCommand("save-changes");
                        }
                    },
                    OnCommand: function (f, cmd) {
                        switch (cmd) {
                            case "save-changes":
                                saveDirectory(f);
                                break;
                        }
                    }
                };
                var dpf = new $.fastnet$forms.CreateForm("template/form/directoryproperties", options, r);
                dpf.addIsRequiredValidator("name", "A folder name is required")
                dpf.disableCommand("save-changes");
                dpf.show();
            });
        }
        function showPageProperties(id) {
            function savePage(f) {
                var data = f.getData();
                var url = "store/update/page";
                var postData = { id: id, name: data.name };
                $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                    f.close();
                    loadDirectoryContent();
                });
            }
            var url = $U.Format("store/get/page/{0}", id);
            $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                //var options = $.extend({
                //    Title: $U.Format("{0} Properties", r.Url),
                //    AfterItemValidation: function () {
                //        if (ppf.isValid()) {
                //            ppf.enableCommand("save-changes");
                //        } else {
                //            ppf.disableCommand("save-changes");
                //        }
                //    },
                //    OnCommand: function (f, cmd) {
                //        switch (cmd) {
                //            case "save-changes":
                //                savePage(f);
                //                break;
                //        }
                //    }
                //}, r);
                //var ppf = new $.fastnet$form("template/form/pageproperties", options);
                var options = {
                    Title: $U.Format("{0} Properties", r.Url),
                    AfterItemValidation: function () {
                        if (ppf.isValid()) {
                            ppf.enableCommand("save-changes");
                        } else {
                            ppf.disableCommand("save-changes");
                        }
                    },
                    OnCommand: function (f, cmd) {
                        switch (cmd) {
                            case "save-changes":
                                savePage(f);
                                break;
                        }
                    }
                };
                var ppf = new $.fastnet$forms.CreateForm("template/form/pageproperties", options, r);
                ppf.addIsRequiredValidator("name", "A page name is required")
                ppf.disableCommand("save-changes");
                ppf.show();
            });
        };
        function deleteItem(type, id) {
            var url = $U.Format("store/delete");
            var postData = { type: type, id: id };
            $.when(
                $U.AjaxPost({ url: url, data: postData })
                ).then(function (result) {
                    $U.Debug("deleted {0}/{1}", type, id);
                    if (type === "directory") {
                        removeDirectoryNode(id);
                    } else {
                        loadDirectoryContent();
                    }
                });
        };
        function findDirectoryNode(id) {
            return $(".store-browser .browser-tree").find(".tree-node[data-user='" + id + "']");
        }
        function removeDirectoryNode(id) {
            var node = findDirectoryNode(id);
            node.remove();
        }
        function createNewPage() {
            var url = $U.Format("store/createpage");
            var postData = { directoryId: pb.options.currentDirectoryId };
            $.when(
                $U.AjaxPost({ url: url, data: postData })
                ).then(function (result) {
                    var pageId = result.PageId;
                    $U.Debug("created new page {0}", result.Url);
                    loadDirectoryContent();
                });
        };
        function createNewDirectory(parentDirectoryId) {
            var url = $U.Format("store/createdirectory");
            var postData = { directoryId: parentDirectoryId };
            $.when(
                $U.AjaxPost({ url: url, data: postData })
                ).then(function (result) {
                    var directoryId = result.DirectoryId;
                    var name = result.Name;
                    $U.Debug("created new directory {0}", directoryId);
                    var parentNode = findDirectoryNode(parentDirectoryId);// pb.forms.tv.FindNode({ UserData: parentDirectoryId })
                    loadTreeViewItem(parentNode, [{ Name: name, Id: directoryId, SubdirectoryCount: 0 }]);
                });
        }
        function selectItem(type, id, url) {
            if (type === null) {
                pb.SelectedItem = {};
                pb.forms.bfl.disableCommand("select-page");
                $U.Debug("Selected item cleared");
            } else {
                pb.SelectedItem = { Type: type, Id: id, Url: url };
                pb.forms.bfl.enableCommand("select-page");
                $U.Debug("Selected item:  {0}/{1}", pb.SelectedItem.Type, pb.SelectedItem.Id);
            }
        };
        function onExpandCollapse(data) {
            $U.Debug("+/- for {0}, closed = {1}, loaded = {2}, child count = {3}", data.userData, data.isClosed, data.isLoaded, data.childCount);
            if (!data.isLoaded) {
                loadSubdirectories(data.node, parseInt(data.userData));
            }
        };
        function onFolderSelectChanged(data) {
            var browser = this;
            $U.Debug("de(select) for {0}, closed = {1}, selected = {2}, child count = {3}", data.userData, data.isClosed, data.isSelected, data.childCount);
            var directoryId = parseInt(data.userData);
            var folderContent = pb.forms.bfl.find(".browser-folder-content");
            //if (currentDirectoryId !== directoryId) {
            //    currentDirectoryId = directoryId;
            //    loadDirectoryContent();
            //}
            if (pb.options.currentDirectoryId !== directoryId) {
                pb.options.currentDirectoryId = directoryId;
                loadDirectoryContent();
            }
            if (data.isSelected) {
                pb.forms.bfl.enableCommand("add-new-page");
                folderContent.show();
            } else {
                pb.forms.bfl.disableCommand("add-new-page");
                folderContent.hide();
            }
        };
        function loadTreeViewItem(node, data) {
            $.each(data, function (index, item) {
                var html = $U.Format("<span class='fa fa-folder folder-icon' ></span><span class='title' >{0}</span>", item.Name);
                pb.forms.tv.AddNode(node, { NodeHtml: html, Title: item.Name, UserData: item.Id, ChildCount: item.SubdirectoryCount });
                //ctx.contextMenu.AttachTo(node);
            });
        };
        function loadSubdirectories(node, directoryId) {
            var url = $U.Format("store/directories/{0}", directoryId);
            $.when($U.AjaxGet({ url: url }, true)).then(function (data) {
                if (data.length === 0) {
                    // there are no subdirectories but we need to ensure that the node
                    // is set to isLoaded.
                    pb.forms.tv.SetNodeLoaded(node);
                } else {
                    loadTreeViewItem(node, data);
                }
            });
        };
        function loadDirectoryContent() {
            var url = $U.Format("store/content/{0}", pb.options.currentDirectoryId);
            $.when($U.AjaxGet({ url: url }, true)).then(function (data) {
                if (data.length > 0) {
                    var content = { data: [] };
                    $.each(data, function (index, item) {
                        if (item.Type === "page") {
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
                                Type: item.Type,
                                Id: item.Id,
                                Url: item.Url,
                                Name: item.Name,
                                LandingPage: item.LandingPage ? "true" : "false",
                                SC: sc
                            });
                        }
                    });
                    var dataTable = $(Mustache.to_html(contentTemplate, content));
                    $(".browser-folder-content").empty().append(dataTable);
                    $(".browser-folder-content table td.url div").on("click", function (e) {
                        //debugger;
                        var target = $(e.currentTarget);
                        if (target.hasClass("selected")) {
                            target.removeClass("selected");
                            selectItem(null);
                            //selectPage(null);
                        } else {
                            $(".browser-folder-content table td.url div").removeClass("selected");
                            target.addClass("selected");
                            var id = parseInt(target.closest("tr").attr("data-id"));
                            var type = target.closest("tr").attr("data-type");
                            var url = target.closest("tr").attr("data-url");
                            selectItem(type, id, url);
                            // selectPage(target.closest("tr").attr("data-id"));
                        }

                    });
                    $(".browser-folder-content table td.edit-button span").on("click", function (e) {
                        var target = $(e.currentTarget);
                        var id = parseInt(target.closest("tr").attr("data-id"));
                        var type = target.closest("tr").attr("data-type");
                        if (type === "page") {
                            showPageProperties(id);
                        }
                    });
                    $(".browser-folder-content table td.delete-button span").on("click", function (e) {
                        var target = $(e.currentTarget);
                        var id = parseInt(target.closest("tr").attr("data-id"));
                        var type = target.closest("tr").attr("data-type");
                        $U.Debug("delete button on {0}/{1}", type, id);
                        var mb = new $.fastnet$messageBox({
                            CancelButton: true
                        });
                        var message = $U.Format("Please confirm that <b>/{0}/{1}</b> should be deleted", type, id);
                        mb.show(message, function (cmd) {
                            $U.Debug("message box returned command {0}", cmd);
                            if (cmd === "ok") {
                                deleteItem(type, id);
                            }
                        });
                    });
                } else {
                    $(".browser-folder-content table").off();
                    $(".browser-folder-content").empty().html("<div>Folder is empty</div>")
                }
            });
        };
        function onFolderTreeContextMenu(src, index, cmd, data) {
            switch (cmd) {
                case "new-folder":
                    createNewDirectory(data.ParentDirectoryId);
                    break;
                case "delete-folder":
                    var mb = new $.fastnet$messageBox({
                        CancelButton: true
                    });
                    var message = $U.Format("Deleting a folder will also delete its content and all sub-folders. Please confirm.");
                    mb.show(message, function (cmd) {
                        $U.Debug("message box returned command {0}", cmd);
                        if (cmd === "ok") {
                            deleteItem("directory", data.DirectoryId);
                        }
                    });
                    break;
                case "folder-properties":
                    showFolderProperties(data.DirectoryId);
                    break;
            }
        }
        pageBrowser.prototype.SelectedItem = {};
        pageBrowser.prototype.Show = function () {
            var pb = this;
            pb.forms.bfl = new $.fastnet$forms.CreateForm("template/form/BrowseForLink", {
                Title: "Store Browser",
                IsResizable: true,
                OnCommand: function (f, cmd) {
                    onCommand(cmd);
                } // onCommand
            }, {});
            //var osc = onFolderSelectChanged.bind(browser);
            pb.forms.tv = $TV.NewTreeview({
                EnableContextMenu: true,
                Selector: ".store-browser .browser-tree",
                OnSelectChanged: onFolderSelectChanged,
                OnExpandCollapse: onExpandCollapse,
                OnBeforeContextMenu: function (cm, userData) {
                    var id = parseInt(userData);
                    if (pb.options.currentDirectoryId === id) {
                        pb.forms.tv.AddMenuItem("New folder", "new-folder", onFolderTreeContextMenu, { ParentDirectoryId: id });
                        if (pb.options.rootDirectoryId !== id) {
                            pb.forms.tv.AddMenuItem("Delete folder ...", "delete-folder", onFolderTreeContextMenu, { DirectoryId: id });
                            pb.forms.tv.AddSeparator();
                            pb.forms.tv.AddMenuItem("Properties ...", "folder-properties", onFolderTreeContextMenu, { DirectoryId: id });
                        }
                        //$U.Debug("tv context menu opening");
                    }
                }
            });
            var url = $U.Format("store/directories");
            $.when($U.AjaxGet({ url: url }, true)).then(function (data) {
                pb.forms.bfl.disableCommand("select-page");
                pb.forms.bfl.disableCommand("add-new-page");
                pb.forms.bfl.show(function (f) {
                    // I am assuming here that on this first call for directories
                    // I will always get an array of one entry and that
                    // entry is the $root directory (renamed by the server to Store)
                    pb.options.rootDirectoryId = data[0].Id;
                    loadTreeViewItem(null, data);
                });
            });

            //bfl = new $.fastnet$form("template/form/BrowseForLink", {
            //    Title: "Store Browser",
            //    IsResizable: true,
            //    OnCommand: onCommand
            //});
            //treeview = $TV.NewTreeview({
            //    Selector: ".browser-tree",
            //    OnSelectChanged: onFolderSelectChanged,
            //    OnExpandCollapse: onExpandCollapse,
            //});
            //var url = $U.Format("store/directories");
            //$.when($U.AjaxGet({ url: url }, true)).then(function (data) {
            //    bfl.disableCommand("select-page");
            //    bfl.disableCommand("add-new-page");
            //    bfl.show(function (f) {
            //        loadTreeViewItem(null, data);
            //    });
            //});
        };
    };
    $.core$editor = {
        tinymceUrl: null,
        control: [],
        cm: null,
        isOpen: false,
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
            $TV = $.fastnet$treeview;
            //$U.Debug("");
            var baseUrl = $("head base").prop("href");
            $T.tinymceUrl = baseUrl + "Scripts/tinymce/";
            $T.cm = $.fastnet$contextmenu.GetContextMenu();
            $T.cm.BeforeOpen = $T.OnBeforeContextMenuOpen;
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
                var mb = new $.fastnet$messageBox({
                    CancelButton: true
                });
                var message = "There are unsaved changes. Closing edit mode will discard these changes! Please confirm.";
                mb.show(message, function (cmd) {
                    $U.Debug("message box returned command {0}", cmd);
                    if (cmd === "ok") {
                        tinymce.remove();
                        $.each($T.control, function (index, item) {
                            var ps = $U.Format(".{0}", item.panel);
                            $(ps).html(item.savedContent);
                        });
                        $T.savedContent = [];
                        okcallback();
                    }
                });
                //$U.MessageBox("There are unsaved changes. Closing edit mode will discard these changes!", {
                //    enableSystemCancel: true,
                //    enableCancelButton: true,
                //    OKFunction: function () {
                //        tinymce.remove();
                //        //result = true;
                //        okcallback();
                //    },
                //    okButtonLabel: "Yes", cancelButtonLabel: "No"
                //});
            } else {
                tinymce.remove();
                //result = true;
                okcallback();
            }
            //return result;
        },
        InsertLink: {
            currentEditor: null,
            Start: function () {
                var $this = this;
                $this.currentEditor = tinymce.EditorManager.activeEditor;
                var text = "";
                var url = "";
                var htmlText = $this.currentEditor.selection.getContent({ format: 'html' });
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

                var ilf = new $.fastnet$forms.CreateForm("template/form/inserthyperlink", {
                    Title: "Insert Link",
                    //IsResizable: true,
                    AfterItemValidation: function (f, result) {
                        if (result.success) {
                            f.enableCommand("insertlink");
                        } else {
                            f.disableCommand("insertlink");
                        }
                    },
                    OnCommand: function (f, cmd) {
                        switch (cmd) {
                            case "find-link":
                                $T.BrowseForLink.Start(f, function () {
                                    $T.cm = $.fastnet$contextmenu.GetContextMenu();
                                    $T.cm.BeforeOpen = $T.OnBeforeContextMenuOpen;
                                });
                                break;
                            case "insertlink":
                                var data = f.getData();
                                if (data.linktext === null || data.linktext === "") {
                                    data.linktext = data.linkurl;
                                }
                                var content = $U.Format('<a href="{0}">{1}</a>', data.linkurl, data.linktext);
                                $this.currentEditor.execCommand("mceReplaceContent", 0, content);
                                f.close();
                                break;
                        }
                    },
                }, {
                    LinkUrl: url,
                    LinkText: text
                });

                ilf.addIsRequiredValidator("linkurl", "A link url is required");
                ilf.disableCommand("insertlink");
                ilf.show();
            },
        },
        BrowseForLink: {
            Start: function (ctx, onClose) {
                var pb = new pageBrowser({
                    Context: ctx,
                    OnClose: onClose,
                    OnCancel: function () {
                        $U.Debug("Page browser closed with a cancel/system-close");
                    },
                    OnSelect: function (ctx, selectedItem) {
                        $U.Debug("selected url {0}", selectedItem.Url);
                        ctx.setData("linkurl", selectedItem.Url);
                        if (ctx.isValid()) {
                            ctx.enableCommand("insertlink");
                        } else {
                            ctx.disableCommand("insertlink");
                        }
                    }
                });
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

        OnBeforeContextMenuOpen: function (cm, src) {
            //$cm.ClearMenuItems();
            cm.AddMenuItem("Insert Link ...", "insert-link", $T.OnContextMenu, {})
            cm.AddMenuItem("Insert Image ...", "insert-image", $T.OnContextMenu, {})
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
                case "save-changes":
                    $T.SavePageChanges();
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
            var originalHtml = $(selector).html();
            tinymce.baseURL = $T.tinymceUrl;
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
                    $T.control.push({ panel: panelName, editor: editor, savedContent: originalHtml });
                    editor.on('change', function (e) {
                        $T.OnContentChange(editor);
                    });
                }
            });
        },
        SavePageChanges: function () {
            var postData = {
                BannerPanel: { PageId: null },
                LeftPanel: { PageId: null },
                RightPanel: { PageId: null }
            };
            $.each(tinymce.EditorManager.editors, function (index, ed) {
                var panelElement = $(ed.getElement());
                var pageId = panelElement.attr("data-page-id");
                if (typeof pageId !== "undefined") {
                    var panelName = panelElement.attr("data-panel");
                    postData[panelName] = { PageId: pageId, HtmlText: ed.getContent(), HasChanged: ed.isDirty() };
                }
            });
            var url = "store/update/page/content";
            $.when($U.AjaxPost({ url: url, data: postData })).then(function () {
                $.each($T.control, function (index, item) {
                    if (item.editor.isDirty()) {
                        item.editor.isNotDirty = true;
                        item.savedContent = item.editor.getContent();
                    }
                });
                $U.SetEnabled($(".edit-toolbar button[data-cmd='save-changes']"), false);
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
            var centrePageId = $(".CentrePanel").attr("data-page-id");
            var url = $U.Format("store/panelinfo/{0}", centrePageId);
            $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                //debugger;
                $T.StartEditors(r);
            });

        },
        StartEditors: function (r) {
            if (r.BannerPanel.PageId !== null) {
                $T.OpenEditor("BannerPanel");
            }
            if (r.LeftPanel.PageId !== null) {
                $T.OpenEditor("LeftPanel");
            }
            $T.OpenEditor("CentrePanel");
            if (r.RightPanel.PageId !== null) {
                $T.OpenEditor("RightPanel");
            }
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