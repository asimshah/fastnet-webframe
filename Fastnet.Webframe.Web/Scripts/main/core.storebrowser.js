var StoreBrowser = (function ($) {
    var $U = $.fastnet$utilities;
    var instance = null;
    function createInstance() {
        var options = null;
        var form = null;
        var tview = null;
        var currentDirectoryId = null;
        var rootDirectoryId = null;
        var selectedItem = null;
        var myDropzone = null;
        function findDirectoryNode(id) {
            return $(".store-browser .browser-tree").find(".tree-node[data-user='" + id + "']");
        }
        function removeDirectoryNode(id) {
            var node = findDirectoryNode(id);
            node.remove();
        }
        function deleteItem(type, id) {
            var url = $U.Format("store/delete");
            var postData = { type: type, id: id };
            $.when(
                $U.AjaxPost({ url: url, data: postData })
                ).then(function (result) {
                    if (type === "directory") {
                        removeDirectoryNode(id);
                    } else {
                        loadDirectoryContent();
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
            var url = $U.Format("store/directories/{0}", directoryId);
            $.when($U.AjaxGet({ url: url }, true)).then(function (data) {
                if (data.length === 0) {
                    // there are no subdirectories but we need to ensure that the node
                    // is set to isLoaded.
                    tview.SetNodeLoaded(node);
                } else {
                    loadTreeViewItem( node, data);
                }
            });
        }
        function loadTreeViewItem(node, data) {
            $.each(data, function (index, item) {
                var html = $U.Format("<span class='fa fa-folder folder-icon' ></span><span class='title' >{0}</span>", item.Name);
                tview.AddNode(node, { NodeHtml: html, Title: item.Name, UserData: item.Id, ChildCount: item.SubdirectoryCount });
            });
        }
        function selectItem(type, id, name, url) {
            if (type === null) {
                selectedItem = {};
                form.disableCommand("select-item");
            } else {
                selectedItem = { Type: type, Id: id, Name: name, Url: url };
                form.enableCommand("select-item");
            }
        }
        function loadDirectoryContent() {
            var url = $U.Format("store/content/{0}", currentDirectoryId);
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
                                        PageType: item.PageType,
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
                                        ImageTypeImage: item.ImageTypeImage
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
                        });
                        var dataTable = $(Mustache.to_html(contentTemplate, content));
                        $(".browser-folder-content").empty().append(dataTable);
                        if (options.Mode === "select") {
                            $(".browser-folder-content .data .url").on("click", function (e) {
                                var target = $(e.currentTarget).closest(".item-row");
                                if (target.hasClass("selected")) {
                                    target.removeClass("selected");
                                    selectItem(null);
                                } else {
                                    $(".browser-folder-content .item-row").removeClass("selected");
                                    var dataRow = target.closest("div[data-id]");
                                    var isSelectable = false;
                                    var type = dataRow.attr("data-type");
                                    switch (type) {
                                        case "page":
                                            var pt = dataRow.attr("data-pagetype");
                                            if (pt === "centre") {
                                                isSelectable = true;
                                            }
                                            break;
                                        default:
                                            isSelectable = true;
                                            break;
                                    }
                                    if (isSelectable) {
                                        target.addClass("selected");
                                        var id = parseInt(dataRow.attr("data-id"));
                                        var name = dataRow.attr("data-name");
                                        var type = dataRow.attr("data-type");
                                        var url = dataRow.attr("data-url");
                                        selectItem(type, id, name, url);
                                    }
                                }
                            });
                        }
                        $(".browser-folder-content .data .edit-button").on("click", function (e) {
                            var target = $(e.currentTarget);
                            var dataRow = target.closest("div[data-id]");
                            var id = parseInt(dataRow.attr("data-id"));
                            var type = dataRow.attr("data-type");
                            if (type === "page") {
                                showPageProperties(id);
                            }
                        });
                        $(".browser-folder-content .data .delete-button").on("click", function (e) {
                            var target = $(e.currentTarget);
                            var dataRow = target.closest("div[data-id]");
                            var id = parseInt(dataRow.attr("data-id"));
                            var type = dataRow.attr("data-type");
                            var message = $U.Format("Please confirm that <b>/{0}/{1}</b> should be deleted", type, id);
                            $U.Confirm(message, function () { deleteItem( type, id); });
                        });
                    } else {
                        $(".browser-folder-content .data").off();
                        $(".browser-folder-content").empty().html("<div>Folder is empty</div>")
                    }
                });
        }
        function onExpandCollapse(data) {
            if (!data.isLoaded) {
                loadSubdirectories( data.node, parseInt(data.userData));
            }
        }
        function onFolderSelectChanged(data) {
            var directoryId = parseInt(data.userData);
            var folderContent = form.find(".browser-folder-content");
            if (currentDirectoryId !== directoryId) {
                currentDirectoryId = directoryId;
                loadDirectoryContent();
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
            //var me = this;
            var url = $U.Format("store/createdirectory");
            var postData = { directoryId: parentDirectoryId };
            $.when(
                $U.AjaxPost({ url: url, data: postData })
                ).then(function (result) {
                    var directoryId = result.DirectoryId;
                    var name = result.Name;
                    var parentNode = findDirectoryNode(parentDirectoryId);
                    loadTreeViewItem( parentNode, [{ Name: name, Id: directoryId, SubdirectoryCount: 0 }]);
                });
        }
        function createNewPage() {
            var url = $U.Format("store/createpage");
            var postData = { referencePageId: null, directoryId: currentDirectoryId, type: "centre" };
            $.when(
                $U.AjaxPost({ url: url, data: postData })
                ).then(function (result) {
                    var pageId = result.PageId;
                    loadDirectoryContent();
                });
        };
        function onCommand(cmd) {
            switch (cmd) {
                case "system-close":
                case "cancel":
                    if (options.OnCancel !== null) {
                        options.OnCancel();
                    }
                    if (options.OnClose !== null) {
                        options.OnClose();
                    }
                    break;
                case "select-item":
                    if (options.OnSelect !== null) {
                        options.OnSelect(options.User, selectedItem);
                    }
                    close();
                    if (options.OnClose !== null) {
                        options.OnClose();
                    }
                    break;
                case "add-new-page":
                    createNewPage();
                    break;
                case "upload-files":
                    showUploadForm();
                    break;
                default:
                    $U.Debug("browser cmd: {0}", cmd);
                    break;
            }
        }
        function showUploadForm() {
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
            //var currentDirectoryId = currentDirectoryId;
            var ulf = new $.fastnet$forms.CreateForm("template/get/main-forms-editor/uploadfile", {
                Title: "File Upload",
                DisableSystemClose: true,
                OnCommand: function (f, cmd) {
                    switch (cmd) {
                        case "start-upload":
                            f.disableCommand("cancel");
                            myDropzone.enqueueFiles(myDropzone.getFilesWithStatus(Dropzone.ADDED));
                            break;
                        case "close-upload":
                            ulf.close();
                            loadDirectoryContent();
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
                myDropzone = new Dropzone(form, {
                    url: "/target-url", // Set the url
                    thumbnailWidth: 80,
                    thumbnailHeight: 80,
                    parallelUploads: 20,
                    previewTemplate: previewTemplate,
                    autoQueue: false, // Make sure the files aren't queued until manually added
                    previewsContainer: "#previews", // Define the container to display the previews
                    clickable: ".fileinput-button" // Define the element that should be used as click trigger to select files.
                });
                myDropzone.uploadFiles = function (files) {
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
            switch (cmd) {
                case "new-folder":
                    createNewDirectory( data.ParentDirectoryId);
                    break;
                case "delete-folder":
                    var message = $U.Format("Deleting a folder will also delete its content and all sub-folders. Please confirm.");
                    $U.Confirm(message, function () {
                        deleteItem( "directory", data.DirectoryId);
                    });
                    break;
                case "folder-properties":
                    showFolderProperties(data.DirectoryId);
                    break;
            }
        }
        function close() {            
            form.close();
            form = null;
            tview = null;
            currentDirectoryId = null;
            rootDirectoryId = null;
            myDropzone = null;
        }
        function _show(opts) {
            options = $.extend({
                User: null,
                OnClose: null,
                OnCancel: null,
                OnSelect: null,
                Mode: "normal" // "normal" means using the primary features (browse, create, delete, set proerties), "select" means using the browser to select a hyperlink
            }, opts);
            form = new $.fastnet$forms.CreateForm("template/get/main-forms-editor/BrowseForLink",
                {
                    Title: "Store Browser",
                    OnCommand: function (f, cmd) {
                        onCommand(cmd);
                    }
                }, {});
            tview = $.fastnet$treeview.NewTreeview({
                EnableContextMenu: true,
                Selector: ".store-browser .browser-tree",
                OnSelectChanged: function (d) { onFolderSelectChanged( d) },
                OnExpandCollapse: function (d) { onExpandCollapse( d) },
                OnBeforeContextMenu: function (cm, userData) {
                    var id = parseInt(userData);
                    if (currentDirectoryId === id) {
                        tview.AddMenuItem("New folder", "new-folder", function (src, index, cmd, data) {
                            onFolderTreeContextMenu( src, index, cmd, data);
                        }, { ParentDirectoryId: id });
                        if (rootDirectoryId !== id) {
                            tview.AddMenuItem("Delete folder ...", "delete-folder", function (src, index, cmd, data) {
                                onFolderTreeContextMenu(src, index, cmd, data);
                            }, { DirectoryId: id });
                            tview.AddSeparator();
                            tview.AddMenuItem("Properties ...", "folder-properties", function (src, index, cmd, data) {
                                onFolderTreeContextMenu(src, index, cmd, data);
                            }, { DirectoryId: id });
                        }
                    }
                }
            });

            var url = $U.Format("store/directories");
            $.when($U.AjaxGet({ url: url }, true)).then(function (data) {
                form.disableCommand("select-item");
                form.disableCommand("add-new-page");
                form.disableCommand("upload-files");
                form.show(function (f) {
                    if (options.Mode === "select") {
                        f.find(".store-browser-commands").removeClass("normal-mode").addClass("select-mode");
                    }
                    // I am assuming here that on this first call for directories
                    // I will always get an array of one entry and that
                    // entry is the $root directory (renamed by the server to Store)
                    rootDirectoryId = data[0].Id;
                    loadTreeViewItem(null, data);
                });
            });
        }
        return {
            show: _show
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