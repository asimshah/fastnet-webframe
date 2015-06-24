var StoreBrowser = (function ($) {
    StoreBrowser._s = {
        instances: 0
    };
    var $U = $.fastnet$utilities;
    function findDirectoryNode(id) {
        return $(".store-browser .browser-tree").find(".tree-node[data-user='" + id + "']");
    }
    function removeDirectoryNode(id) {
        var node = findDirectoryNode(id);
        node.remove();
    }
    function deleteItem(type, id) {
        var me = this;
        var url = $U.Format("store/delete");
        var postData = { type: type, id: id };
        $.when(
            $U.AjaxPost({ url: url, data: postData })
            ).then(function (result) {
                if (type === "directory") {
                    removeDirectoryNode(id);
                } else {
                    loadDirectoryContent.call(me);
                }
            });
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
            var dpf = new $.fastnet$forms.CreateForm("template/get/main-forms-editor/directoryproperties", options, r);
            var validator = new $.fastnet$validators.Create(dpf);
            validator.AddIsRequired("name", "A folder name is required")
            dpf.disableCommand("save-changes");
            dpf.show();
        });
    }
    function showPageProperties(id) {
        var me = this;
        function savePage(f) {
            var data = f.getData();
            var url = "store/update/page";
            var postData = { id: id, name: data.name };
            $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                f.close();
                loadDirectoryContent.call(me);
            });
        }
        var url = $U.Format("store/get/page/{0}", id);
        $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
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
            var ppf = new $.fastnet$forms.CreateForm("template/get/main-forms-editor/pageproperties", options, r);
            var validator = new $.fastnet$validators.Create(ppf);
            validator.AddIsRequired("name", "A page name is required");
            ppf.disableCommand("save-changes");
            ppf.show();
        });
    };
    function loadSubdirectories(node, directoryId) {
        var me = this;
        var url = $U.Format("store/directories/{0}", directoryId);
        $.when($U.AjaxGet({ url: url }, true)).then(function (data) {
            if (data.length === 0) {
                // there are no subdirectories but we need to ensure that the node
                // is set to isLoaded.
                me._tview.SetNodeLoaded(node);
            } else {
                loadTreeViewItem.call(me, node, data);
            }
        });
    }
    function loadTreeViewItem(node, data) {
        var me = this;
        $.each(data, function (index, item) {
            var html = $U.Format("<span class='fa fa-folder folder-icon' ></span><span class='title' >{0}</span>", item.Name);
            me._tview.AddNode(node, { NodeHtml: html, Title: item.Name, UserData: item.Id, ChildCount: item.SubdirectoryCount });
        });
    }
    function selectItem(type, id, url) {
        var me = this;
        if (type === null) {
            me.selectedItem = {};
            me._form.disableCommand("select-page");
        } else {
            me.selectedItem = { Type: type, Id: id, Url: url };
            me._form.enableCommand("select-page");
        }
    }
    function loadDirectoryContent() {
        var me = this;
        var url = $U.Format("store/content/{0}", me._currentDirectoryId);
        $.when(
            $U.AjaxGet({ url: url }, true),
             $U.AjaxGet({ url: "template/get/main-forms-editor/storecontent" })
            ).then(function (q0, q1) {
                var data = q0[0];
                var contentTemplate = q1[0].Template;
                if (data.length > 0) {
                    var content = { data: [] };
                    $.each(data, function (index, item) {
                        switch (item.Type) {
                            case "page":
                                content.data.push({
                                    IsPage: true,
                                    Type: item.Type,
                                    Id: item.Id,
                                    Url: item.Url,
                                    Name: item.Name,
                                    LandingPage: item.LandingPage,// ? "true" : "false",
                                    LandingPageImage: item.LandingPageImage,
                                    PageTypeImage: item.PageTypeImage,
                                    PageTypeTooltip: item.PageTypeTooltip
                                });
                                break;
                            case "image":
                                content.data.push({
                                    IsImage: true,
                                    Type: item.Type,
                                    Id: item.Id,
                                    Url: item.Url,
                                    Name: item.Name,
                                    LandingPage: false,
                                    Size: item.Size,
                                });
                                break;
                            case "document":
                                content.data.push({
                                    IsDocument: true,
                                    Type: item.Type,
                                    Id: item.Id,
                                    Url: item.Url,
                                    Name: item.Name,
                                    LandingPage: false,
                                    Size: item.Size,
                                    DocumentTypeImage: item.DocumentTypeImage
                                });
                                break;
                        }
                        //if (item.Type === "page") {
                        //    content.data.push({
                        //        Type: item.Type,
                        //        Id: item.Id,
                        //        Url: item.Url,
                        //        Name: item.Name,
                        //        LandingPage: item.LandingPage ? "true" : "false",
                        //        Remarks: item.Remarks
                        //    });
                        //}
                    });
                    var dataTable = $(Mustache.to_html(contentTemplate, content));
                    $(".browser-folder-content").empty().append(dataTable);
                    $(".browser-folder-content .data .url div").on("click", function (e) {
                        var target = $(e.currentTarget);
                        if (target.hasClass("selected")) {
                            target.removeClass("selected");
                            selectItem.call(me, null);
                        } else {
                            $(".browser-folder-content .data .url div").removeClass("selected");
                            target.addClass("selected");
                            var dataRow = target.closest("div[data-id]");
                            var id = parseInt(dataRow.attr("data-id"));
                            var type = dataRow.attr("data-type");
                            var url = dataRow.attr("data-url");
                            selectItem.call(me, type, id, url);
                        }
                    });
                    $(".browser-folder-content .data .edit-button span").on("click", function (e) {
                        var target = $(e.currentTarget);
                        var dataRow = target.closest("div[data-id]");
                        var id = parseInt(dataRow.attr("data-id"));
                        var type = dataRow.attr("data-type");
                        if (type === "page") {
                            showPageProperties.call(me, id);
                        }
                    });
                    $(".browser-folder-content .data .delete-button span").on("click", function (e) {
                        var target = $(e.currentTarget);
                        var dataRow = target.closest("div[data-id]");
                        var id = parseInt(dataRow.attr("data-id"));
                        var type = dataRow.attr("data-type");
                        var message = $U.Format("Please confirm that <b>/{0}/{1}</b> should be deleted", type, id);
                        $U.Confirm(message, function () { deleteItem.call(me, type, id); });
                        //var mb = new $.fastnet$messageBox({
                        //    CancelButton: true
                        //});
                       
                        //mb.show(message, function (cmd) {
                        //    //$U.Debug("message box returned command {0}", cmd);
                        //    if (cmd === "ok") {
                        //        deleteItem(type, id);
                        //    }
                        //});
                    });
                } else {
                    $(".browser-folder-content .data").off();
                    $(".browser-folder-content").empty().html("<div>Folder is empty</div>")
                }
            });
    }
    function onExpandCollapse(data) {
        var me = this;
        if (!data.isLoaded) {
            loadSubdirectories.call(me, data.node, parseInt(data.userData));
        }
    }
    function onFolderSelectChanged(data) {
        var me = this;
        //$U.Debug("de(select) for {0}, closed = {1}, selected = {2}, child count = {3}", data.userData, data.isClosed, data.isSelected, data.childCount);
        var form = me._form;
        var directoryId = parseInt(data.userData);
        var folderContent = form.find(".browser-folder-content");
        if (me._currentDirectoryId !== directoryId) {
            me._currentDirectoryId = directoryId;
            loadDirectoryContent.call(me);
        }
        if (data.isSelected) {
            form.enableCommand("add-new-page");
            form.enableCommand("upload-files");
            folderContent.show();
        } else {
            form.disableCommand("add-new-page");
            form.disableCommand("upload-files");
            folderContent.hide();
        }
    }
    function createNewDirectory(parentDirectoryId) {
        var me = this;
        var url = $U.Format("store/createdirectory");
        var postData = { directoryId: parentDirectoryId };
        $.when(
            $U.AjaxPost({ url: url, data: postData })
            ).then(function (result) {
                var directoryId = result.DirectoryId;
                var name = result.Name;
                var parentNode = findDirectoryNode(parentDirectoryId);
                loadTreeViewItem.call(me, parentNode, [{ Name: name, Id: directoryId, SubdirectoryCount: 0 }]);
            });
    }
    function createNewPage() {
        var me = this;
        var url = $U.Format("store/createpage");
        var postData = { referencePageId: null, directoryId: me._currentDirectoryId, type: "centre" };
        $.when(
            $U.AjaxPost({ url: url, data: postData })
            ).then(function (result) {
                var pageId = result.PageId;
                loadDirectoryContent.call(me);
            });
    };
    function onCommand(cmd) {
        var me = this;
        switch (cmd) {
            case "system-close":
            case "cancel":
                if (me._options.OnCancel !== null) {
                    me._options.OnCancel();
                }
                if (me._options.OnClose !== null) {
                    me._options.OnClose();
                }
                break;
            case "select-page":
                if (me._options.OnSelect !== null) {
                    me._options.OnSelect(me._options.User, pb.SelectedItem);
                }
                close();
                if (me._options.OnClose !== null) {
                    me._options.OnClose();
                }
                break;
            case "add-new-page":
                createNewPage.call(me);
                break;
            case "upload-files":
                showUploadForm.call(me);
                break;
            default:
                $U.Debug("browser cmd: {0}", cmd);
                break;
        }
    }
    function showUploadForm() {
        var me = this;
        var chunkSize = 1024 * 10;
        var keyCount = 0;
        var uploadCount = 0;
        function sendChunk(bufctl) {
            var postdata = {
                chunkNumber: bufctl.chunkNumber,
                totalChunks: bufctl.totalChunks,
                base64: bufctl.buffer[bufctl.chunkNumber],
                base64Length: bufctl.buffer[bufctl.chunkNumber].length
            };
            if (bufctl.chunkNumber == 0) {
                $.extend(postdata, {
                    directoryId: bufctl.directoryId,
                    filename: bufctl.filename,
                    mimetype: bufctl.mimetype,
                    binaryLength: bufctl.binaryLength
                });
            } else {
                $.extend(postdata, { updateKey: bufctl.key });
            }
            var url = "store/upload/file";
            //setTimeout(function () {
            //    if (bufctl.chunkNumber == 0) {
            //        bufctl.key = $U.Format("some-key-{0}", keyCount++);
            //    }
            //    $U.Debug("Uploaded {0} key {1}, {2}/{3} length {4}", bufctl.filename, bufctl.key, bufctl.chunkNumber, bufctl.totalChunks, postdata.base64Length);
            //    bufctl.chunkNumber++;
            //    if (bufctl.chunkNumber < bufctl.totalChunks) {
            //        sendChunk(bufctl);
            //    }
            //}, 500);
            $.when($U.AjaxPost({ url: url, data: postdata })).then(function (r) {
                if (bufctl.chunkNumber == 0) {
                    bufctl.key = r;
                }
                if (bufctl.progessElement !== null) {
                    var percentComplete = ((bufctl.chunkNumber + 1) / (bufctl.totalChunks)) * 100.0;
                    $(bufctl.progressElement).find(".progress-bar").css("width", percentComplete + "%");
                }
                bufctl.chunkNumber++;
                if (bufctl.chunkNumber < bufctl.totalChunks) {
                    sendChunk(bufctl);
                } else {
                    // here this upload is finished
                    uploadCount--;
                    if (uploadCount === 0) {
                        ulf.disableCommand("cancel");
                        ulf.enableCommand("close-upload");
                    }
                }
            });
        };
        function bufferedUpload(fileInfo) {
            var bufctl = {
                buffer: [],
                totalChunks: 0,
                directoryId: 0,
                chunkNumber: 0,
                filename: null,
                mimetype: null,
                binaryLength: 0,
                key: null,
                progressElement: null
            };
            bufctl.totalChunks = Math.floor(fileInfo.base64Length / chunkSize);
            var remainder = fileInfo.base64Length % chunkSize;
            if (remainder > 0) {
                bufctl.totalChunks++;
            }
            for (var i = 0; i < bufctl.totalChunks; i++) {
                var offset = i * chunkSize;
                var text = fileInfo.base64.substr(offset, chunkSize);
                bufctl.buffer.push(text);
            }
            bufctl.directoryId = fileInfo.directoryId;
            bufctl.filename = fileInfo.filename;
            bufctl.mimetype = fileInfo.mimetype;
            bufctl.binaryLength = fileInfo.binaryLength;
            bufctl.progressElement = fileInfo.progressElement;
            sendChunk(bufctl);
        };
        var currentDirectoryId = me._currentDirectoryId;
        var ulf = new $.fastnet$forms.CreateForm("template/get/main-forms-editor/uploadfile", {
            Title: "File Upload",
            DisableSystemClose: true,
            OnCommand: function (f, cmd) {
                switch (cmd) {
                    case "start-upload":
                        f.disableCommand("cancel");
                        me._myDropzone.enqueueFiles(me._myDropzone.getFilesWithStatus(Dropzone.ADDED));
                        break;
                    case "close-upload":
                        ulf.close();
                        loadDirectoryContent.call(me);
                        break;
                }
            },
        }, {});
        ulf.show(function () {
            //ulf.disableCommand("cancel-upload");
            ulf.hideCommand("close-upload");
            var previewNode = document.querySelector("#template");
            previewNode.id = "";
            var previewTemplate = previewNode.parentNode.innerHTML;
            previewNode.parentNode.removeChild(previewNode);
            var form = ulf.find(".modal-content").get(0);
            me._myDropzone = new Dropzone(form, {
                url: "/target-url", // Set the url
                thumbnailWidth: 80,
                thumbnailHeight: 80,
                parallelUploads: 20,
                previewTemplate: previewTemplate,
                autoQueue: false, // Make sure the files aren't queued until manually added
                previewsContainer: "#previews", // Define the container to display the previews
                clickable: ".fileinput-button" // Define the element that should be used as click trigger to select files.
            });
            me._myDropzone.uploadFiles = function (files) {
                uploadCount = files.length;
                ulf.hideCommand("add-files");
                ulf.disableCommand("start-upload");
                ulf.disableCommand("close-upload");
                ulf.showCommand("close-upload");
                ulf.enableCommand("cancel");
                $.each(files, function (index, file) {
                    //$U.Debug("Uploading file {0}, {1}", file.name, file.type);
                    var fr = new FileReader();
                    fr.onload = function (event) {
                        //$U.Debug("Uploading file {0} ...", file.name);
                        var height = 0;
                        var width = 0;
                        var string = event.target.result;
                        var base64Data = string.substr(string.indexOf('base64') + 7);
                        bufferedUpload({ directoryId: currentDirectoryId, filename: file.name, mimetype: file.type, binaryLength: file.size, base64: base64Data, base64Length: base64Data.length, progressElement: file.previewElement });
                    }
                    fr.readAsDataURL(file);
                });
            };
        });
    }
    function onFolderTreeContextMenu(src, index, cmd, data) {
        var me = this;
        switch (cmd) {
            case "new-folder":
                createNewDirectory.call(me, data.ParentDirectoryId);
                break;
            case "delete-folder":
                var message = $U.Format("Deleting a folder will also delete its content and all sub-folders. Please confirm.");
                $U.Confirm(message, function () {
                    deleteItem.call(me, "directory", data.DirectoryId);
                });
                //var mb = new $.fastnet$messageBox({
                //    CancelButton: true
                //});
                //var message = $U.Format("Deleting a folder will also delete its content and all sub-folders. Please confirm.");
                //mb.show(message, function (cmd) {
                //    //$U.Debug("message box returned command {0}", cmd);
                //    if (cmd === "ok") {
                //        deleteItem("directory", data.DirectoryId);
                //    }
                //});
                break;
            case "folder-properties":
                showFolderProperties(data.DirectoryId);
                break;
        }
    }
    function show() {
        var me = this;
        me._form = new $.fastnet$forms.CreateForm("template/get/main-forms-editor/BrowseForLink",
            {
                Title: "Store Browser",
                OnCommand: function (f, cmd) {
                    onCommand.call(me, cmd);
                }
            }, {});
        me._tview = $.fastnet$treeview.NewTreeview({
            EnableContextMenu: true,
            Selector: ".store-browser .browser-tree",
            OnSelectChanged: function (d) { onFolderSelectChanged.call(me, d) },
            OnExpandCollapse: function (d) { onExpandCollapse.call(me, d) },
            OnBeforeContextMenu: function (cm, userData) {
                var id = parseInt(userData);
                if (me._currentDirectoryId === id) {
                    me._tview.AddMenuItem("New folder", "new-folder", function (src, index, cmd, data) {
                        onFolderTreeContextMenu.call(me, src, index, cmd, data);
                    }, { ParentDirectoryId: id });
                    if (me._rootDirectoryId !== id) {
                        me._tview.AddMenuItem("Delete folder ...", "delete-folder", function (src, index, cmd, data) {
                            onFolderTreeContextMenu(src, index, cmd, data);
                        }, { DirectoryId: id });
                        me._tview.tv.AddSeparator();
                        me._tview.tv.AddMenuItem("Properties ...", "folder-properties", function (src, index, cmd, data) {
                            onFolderTreeContextMenu(src, index, cmd, data);
                        }, { DirectoryId: id });
                    }
                }
            }
        });
        var url = $U.Format("store/directories");
        $.when($U.AjaxGet({ url: url }, true)).then(function (data) {
            me._form.disableCommand("select-page");
            me._form.disableCommand("add-new-page");
            me._form.disableCommand("upload-files");
            me._form.show(function (f) {
                // I am assuming here that on this first call for directories
                // I will always get an array of one entry and that
                // entry is the $root directory (renamed by the server to Store)
                me._rootDirectoryId = data[0].Id;
                loadTreeViewItem.call(me, null, data);
            });
        });
    }
    function StoreBrowser(opts) {
        this._options = $.extend({
            User: null,
            OnClose: null,
            OnCancel: null,
            OnSelect: null
        }, opts);
        this._instance = StoreBrowser._s.instances++;
        this._name = "StoreBrowser-" + this._instance;
        this._form = null;
        this._tview = null;
        this._currentDirectoryId = null;
        this._rootDirectoryId = null;
        this.selectedItem = null;
        this._myDropzone = null;
    }
    StoreBrowser.prototype.show = function () {
        show.call(this);
    }
    return StoreBrowser;
})(jQuery);