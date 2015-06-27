var PageEditor = (function () {
    // this uses a javascript singleton pattern
    var $U = $.fastnet$utilities;
    var instance = null;
    function createInstance() {
        var pages = {
            banner: { panelSelector: ".BannerPanel", id: null, savedHtml: null, mce: null, allowDelete: true},
            centre: { panelSelector: ".CentrePanel", id: null, savedHtml: null, mce: null, allowDelete: false },
            left: { panelSelector: ".LeftPanel", id: null, savedHtml: null, mce: null, allowDelete: true },
            right: { panelSelector: ".RightPanel", id: null, savedHtml: null, mce: null, allowDelete: true }
        };
        var _tinymceUrl = null;
        var _toolbar = null;
        function _initialize() {
            var baseUrl = $("head base").prop("href");
            _tinymceUrl = baseUrl + "Scripts/tinymce/";
            _toolbar = PageToolbar.get();
            _toolbar.addHandler("toolbar-opened", _toolbarOpened);
            _toolbar.addHandler("exit-edit-mode", __exitEditRequested);
            _toolbar.addHandler("save-changes", _savePageChanges);
            _toolbar.addHandler("open-store-browser", _openStoreBrowser);
            $U.Debug("PageEditor initialized");
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
                                alert('delete clicked');
                            }
                        });
                    }
                    editor.addButton('insertlinks', {
                        type: 'menubutton',
                        text: 'Links|Images',
                        title: "insert links & images",
                        icon: 'link',
                        menu: [
                            { text: 'Insert link/image ...', onclick: function () { $T.InsertLink.Start({ mode: 'prompt' }); } },
                            { text: 'Insert link to new page', onclick: function () { $T.InsertLink.Start({ mode: 'createnew' }); } },
                            { text: 'Insert link & edit new page ...', onclick: function () { $T.InsertLink.Start({ mode: 'createandedit' }); } }
                            //,{ text: 'break ...', onclick: function () { debugger; } }
                        ]
                    });
                    editor.on('change', function (e) {
                        _toolbar.enableCommand("save-changes");
                    });
                }
            });
        }
        function _initEditing(panel) {
            var pageId = pages[panel].id;
            if (pageId === null) {
                if (pages[panel].mce !== null) {
                    pages[panel].mce.editor.remove();
                    pages[panel].mce = null;
                }
                pages[panel].savedHtml = null;
                _addPanelOverlay(panel);
            } else {
                _openMce(pages[panel]);
            }
        }
        function _addContent(panel) {
            $U.Debug("add content for {0} (centre page id is {1})", panel, pages.centre.id);
            var url = "store/createpage";
            var postData = { referencePageId: pages.centre.id, directoryId: null, type: panel };
            $.when($U.AjaxPost({ url: url, data: postData })).then(function (r) {
                var newPageId = r.PageId;
                $.when(
                    $U.AjaxGet({ url: "pageapi/page/" + newPageId })
                    ).then(function (result) {
                        _removePanelOverlay(panel);
                        var panelName = pages[panel].panelSelector.substring(1);
                        $.core$page.SetContent(panelName, { styleList: result.HtmlStyles, html: result.HtmlText, pageId: result.PageId });
                        pages[panel].id = result.PageId;
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
        function _removePanelOverlay(panel) {
            $(pages[panel].panelSelector).find(".overlay").off().remove();
            $(pages[panel].panelSelector).removeClass("editor-side-panel");
        }
        function _onWindowResize() {
            var totalHeight = $(window).height();
            var panel = pages.centre.panelSelector;
            var panelTop = $(panel).offset().top;
            var availableHeight = totalHeight - panelTop;
            $(panel).css("max-height", availableHeight + "px");
        }
        function _toolbarOpened() {
            // load up all editors
            _toolbar.disableCommand("save-changes");
            pages.centre.id = $(".CentrePanel").attr("data-page-id");
            var url = $U.Format("store/sidepages/{0}", pages.centre.id);
            $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                pages.banner.id = r.Banner;// r.BannerPanel.PageId;
                pages.left.id = r.Left;// r.LeftPanel.PageId;
                pages.id = r.Right;//r.RightPanel.PageId;
                _initEditing("banner");
                _initEditing("left");
                _initEditing("centre");
                _initEditing("right");
                setTimeout(function () {
                    pages.centre.mce.execCommand("mceAddControl", false, $(pages.centre.panelSelector));
                }, 300);
                $(window).on("resize.editor", function () {
                    _onWindowResize();
                });
                _onWindowResize();
            });
        }
        function __exitEditRequested() {
            function __unloadEditorsAndClose() {
                tinymce.remove();
                pages.banner.mce = null;
                pages.left.mce = null;
                pages.centre.mce = null;
                pages.right.mce = null;
                pages.banner.savedHtml = null;
                pages.left.savedHtml = null;
                pages.centre.savedHtml = null;
                pages.right.savedHtml = null;
                _toolbar.disableCommand("save-changes");
                _toolbar.close();
                // the following tidies up after tinymce (it should do this itself, IMHO)
                $("table.mce-item-table").removeClass("mce-item-table");
                $("div.mce-resizehandle").remove();
                $("div[contenteditable='true'").removeAttr('contenteditable');
                $(window).off(".editor");
            }
            if (_changesPending()) {
                $U.Confirm("There are unsaved changes which will be lost. Please confirm", function () {
                    $(pages.banner.panelSelector).html(pages.banner.savedHtml);
                    $(pages.left.panelSelector).html(pages.left.savedHtml);
                    $(pages.centre.panelSelector).html(pages.centre.savedHtml);
                    $(pages.right.panelSelector).html(pages.right.savedHtml);
                    __unloadEditorsAndClose();
                });
            } else {
                __unloadEditorsAndClose();
            }
        }
        function _savePageChanges() {
            $U.SetEnabled($(".edit-toolbar button[data-cmd='save-changes']"), false);
            var postData = { banner: {}, left: {}, centre: {}, right: {} };
            function updatePageData(panel) {
                pages[panel].mce.isNotDirty = true;
                pages[panel].savedHtml = pages[panel].mce.getContent();
            }
            function getPageData(panel) {
                var pd = pages[panel];
                var r = null;
                if (pd.id !== null && pd.mce.isDirty()) {
                    r = { hasChanges: true,  id: pd.id, html: pd.mce.getContent() };
                } else {
                    r = { hasChanges: false}
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
                //$U.SetEnabled($(".edit-toolbar button[data-cmd='save-changes']"), false);
            });
        }
        function _openStoreBrowser() {
            var sb = new StoreBrowser();
            sb.show();
        }
        _initialize();
        return {
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
        var contentTemplate2 =
            "        <div class='folder-content' >" +
            "          <div class='header'>" +
            "            <div class='row'>" +
            "                <div class='url'>Url</div>" +
            "                <div class='name'>Name</div>" +
            "                <div class='remarks'></div>" +
            "                <div class='edit-button'></div>" +
            "                <div class='delete-button'></div>" +
            "            </div>" +
            "          </div>" +
            "          <div class='data'>" +
            "            {{#data}}" +
            "            <div class='row' data-id='{{Id}}' data-type='{{Type}}' data-url='{{Url}}' data-landing-page='{{LandingPage}}'>" +
            "                <div class='url'><div>{{Url}}</div></div>" +
            "                <div class='name'><div>{{Name}}</div><div class='size' >{{Size}}</div></div>" +
            "                <div class='remarks'><div>{{Remarks}}</div></div>" +
            "                <div class='edit-button buttons'><div><span class='fa fa-pencil-square-o edit' title='Edit properties'></span></div></div>" +
            "                <div class='delete-button buttons'><div><span class='fa fa-times delete' title='Delete'></span></div></div>" +
            "            </div>" +
            "            {{/data}}" +
            "          </div>" +
            "        </div>";
        var contentTemplate =
            "        <table  cellpadding='0' cellspacing='0' border='0' id='folder-content'>" +
            "          <thead>" +
            "            <tr>" +
            "                <th class='url'>Url</th>" +
            "                <th class='name'>Name</th>" +
            "                <th class='remarks'></th>" +
            "                <th class='edit-button'></th>" +
            "                <th class='delete-button'></th>" +
            "            </tr>" +
            "          </thead>" +
            "          <tbody>" +
            "            {{#data}}" +
            "            <tr data-id='{{Id}}' data-type='{{Type}}' data-url='{{Url}}' data-landing-page='{{LandingPage}}'>" +
            "                <td class='url'><div>{{Url}}</div></td>" +
            "                <td class='name'><div>{{Name}}</div><div>{{Size}}</div></td>" +
            "                <td class='remarks'><div>{{Remarks}}</div></td>" +
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
                case "upload-files":
                    showUploadForm();
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
                    var parentNode = findDirectoryNode(parentDirectoryId);
                    loadTreeViewItem(parentNode, [{ Name: name, Id: directoryId, SubdirectoryCount: 0 }]);
                });
        }
        function selectItem(type, id, url) {
            if (type === null) {
                pb.SelectedItem = {};
                pb.forms.bfl.disableCommand("select-page");
            } else {
                pb.SelectedItem = { Type: type, Id: id, Url: url };
                pb.forms.bfl.enableCommand("select-page");
            }
        };
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
            var currentDirectoryId = pb.options.currentDirectoryId;
            var ulf = new $.fastnet$forms.CreateForm("template/get/main-forms-editor/uploadfile", {
                Title: "File Upload",
                DisableSystemClose: true,
                OnCommand: function (f, cmd) {
                    switch (cmd) {
                        case "start-upload":
                            f.disableCommand("cancel");
                            pb.myDropzone.enqueueFiles(pb.myDropzone.getFilesWithStatus(Dropzone.ADDED));
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
                pb.myDropzone = new Dropzone(form, {
                    url: "/target-url", // Set the url
                    thumbnailWidth: 80,
                    thumbnailHeight: 80,
                    parallelUploads: 20,
                    previewTemplate: previewTemplate,
                    autoQueue: false, // Make sure the files aren't queued until manually added
                    previewsContainer: "#previews", // Define the container to display the previews
                    clickable: ".fileinput-button" // Define the element that should be used as click trigger to select files.
                });
                pb.myDropzone.uploadFiles = function (files) {
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
        function onExpandCollapse(data) {
            //$U.Debug("+/- for {0}, closed = {1}, loaded = {2}, child count = {3}", data.userData, data.isClosed, data.isLoaded, data.childCount);
            if (!data.isLoaded) {
                loadSubdirectories(data.node, parseInt(data.userData));
            }
        };
        function onFolderSelectChanged(data) {
            var browser = this;
            //$U.Debug("de(select) for {0}, closed = {1}, selected = {2}, child count = {3}", data.userData, data.isClosed, data.isSelected, data.childCount);
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
                pb.forms.bfl.enableCommand("upload-files");
                folderContent.show();
            } else {
                pb.forms.bfl.disableCommand("add-new-page");
                pb.forms.bfl.disableCommand("upload-files");
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
                        switch (item.Type) {
                            case "page":
                                content.data.push({
                                    Type: item.Type,
                                    Id: item.Id,
                                    Url: item.Url,
                                    Name: item.Name,
                                    LandingPage: item.LandingPage ? "true" : "false",
                                    Remarks: item.Remarks
                                });
                                break;
                            case "image":
                            case "document":
                                content.data.push({
                                    Type: item.Type,
                                    Id: item.Id,
                                    Url: item.Url,
                                    Name: item.Name,
                                    LandingPage: false,
                                    Size: item.Size,
                                    Remarks: item.Remarks
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
                    var dataTable = $(Mustache.to_html(contentTemplate2, content));
                    $(".browser-folder-content").empty().append(dataTable);

                    $(".browser-folder-content .data .url div").on("click", function (e) {
                        //debugger;
                        var target = $(e.currentTarget);
                        if (target.hasClass("selected")) {
                            target.removeClass("selected");
                            selectItem(null);
                            //selectPage(null);
                        } else {
                            $(".browser-folder-content .data .url div").removeClass("selected");
                            target.addClass("selected");
                            var dataRow = target.closest("div[data-id]");
                            var id = parseInt(dataRow.attr("data-id"));
                            var type = dataRow.attr("data-type");
                            var url = dataRow.attr("data-url");
                            selectItem(type, id, url);
                            // selectPage(target.closest("tr").attr("data-id"));
                        }

                    });
                    $(".browser-folder-content .data .edit-button span").on("click", function (e) {
                        var target = $(e.currentTarget);
                        var dataRow = target.closest("div[data-id]");
                        var id = parseInt(dataRow.attr("data-id"));
                        var type = dataRow.attr("data-type");
                        if (type === "page") {
                            showPageProperties(id);
                        }
                    });
                    $(".browser-folder-content .data .delete-button span").on("click", function (e) {
                        var target = $(e.currentTarget);
                        var dataRow = target.closest("div[data-id]");
                        var id = parseInt(dataRow.attr("data-id"));
                        var type = dataRow.attr("data-type");
                        //$U.Debug("delete button on {0}/{1}", type, id);
                        var mb = new $.fastnet$messageBox({
                            CancelButton: true
                        });
                        var message = $U.Format("Please confirm that <b>/{0}/{1}</b> should be deleted", type, id);
                        mb.show(message, function (cmd) {
                            //$U.Debug("message box returned command {0}", cmd);
                            if (cmd === "ok") {
                                deleteItem(type, id);
                            }
                        });
                    });
                } else {
                    $(".browser-folder-content .data").off();
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
                        //$U.Debug("message box returned command {0}", cmd);
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
            pb.forms.bfl = new $.fastnet$forms.CreateForm("template/get/main-forms-editor/BrowseForLink", {
                Title: "Store Browser",
                //IsResizable: true,
                OnCommand: function (f, cmd) {
                    onCommand(cmd);
                }, // onCommand
                //OnResize: function (rect) {
                //    var bfc = pb.forms.bfl.find(".browser-folder-content");
                //    //var tvContainerOuter = pb.forms.bfl.find(".browser-tree").parent().outerWidth();
                //    var tvContainerWidth = pb.forms.bfl.find(".browser-tree").parent().outerWidth();
                //    var folderContentOuterWidth = bfc.parent().outerWidth();
                //    var folderContentWidth = bfc.parent().width();
                //    var folderContentOuterHeight = bfc.parent().outerHeight();
                //    var folderContentHeight = bfc.parent().height();
                //    var gutterWidth = folderContentOuterWidth - folderContentWidth;
                //    var topAndBottom = folderContentOuterHeight - folderContentHeight;
                //    var requiredWidth = rect.width - tvContainerWidth - gutterWidth;
                //    var requiredHeight = rect.height - topAndBottom;
                //    $U.Debug("rect: {0}w x {1}h, resize: {2}w x {3}h", rect.width, rect.height, requiredWidth, requiredHeight);
                //    bfc.width(requiredWidth);
                //    bfc.height(requiredHeight - 8);
                //}
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
                pb.forms.bfl.disableCommand("upload-files");
                pb.forms.bfl.show(function (f) {
                    //$(".store-browser").width(600).height(300);
                    // I am assuming here that on this first call for directories
                    // I will always get an array of one entry and that
                    // entry is the $root directory (renamed by the server to Store)

                    pb.options.rootDirectoryId = data[0].Id;
                    loadTreeViewItem(null, data);
                });
            });
        };
    };
    $.core$editor = {
        toolbar: null,
        manager: {
            //control.push({ panel: panelName, editor: editor, savedContent: originalHtml });
            control: [],
            add: function (panelName, editor, originalHtml) {
                this.control.push({ panel: panelName, editor: editor, savedContent: originalHtml });
            },
            getControlForEditor: function (ed) {
                var ctrl = null;
                $.each(this.control, function (index, item) {
                    if (item.editor === ed) {
                        ctrl = item;
                        return false;
                    }
                });
                return ctrl;
            },
            getControlForPanel: function (name) {
                var ctrl = null;
                $.each(this.control, function (index, item) {
                    if (item.panel === name) {
                        ctrl = item;
                        return false;
                    }
                });
                return ctrl;
            },
            remove: function (name) {
                $.each(this.control, function (index, item) {
                    if (item.panel === name) {
                        $T.manager.control.splice(index, 1);
                        return false;
                    }
                });
            },
            restoreAllContent: function () {
                $.each(this.control, function (index, item) {
                    var ps = $U.Format(".{0}", item.panel);
                    $(ps).html(item.savedContent);
                });
            },
            updateSavedContent: function (ed) {
                var ctrl = this.getControlForEditor(ed);
                ctrl.savedContent = ed.getContent();
            }
        },
        tinymceUrl: null,

        cm: null,
        isOpen: false,
        Init: function () {
            //debugger;
            $T = this;
            $U = $.fastnet$utilities;
            $TV = $.fastnet$treeview;
            //$U.Debug("");
            var baseUrl = $("head base").prop("href");
            $T.tinymceUrl = baseUrl + "Scripts/tinymce/";
            toolbar = PageToolbar.get();
            toolbar.addHandler("toolbar-opened", null);
            toolbar.addHandler("toolbar-closed", null);
            toolbar.addHandler("save-changes", $T.SavePageChanges);
            toolbar.addHandler("open-store-browser", $T.OpenStoreBrowser);

            //$(".edit-panel").on("click", function (e) {
            //    $T.Start();
            //});
            ////$(".edit-panel").addClass("closed");//.height(8);
            //$T.SetEditToolbar("hidden");
            //$U.SetEnabled($(".edit-toolbar button[data-cmd='save-changes']"), false);
            //$(".edit-toolbar button.editor-command").on("click", function (e) {
            //    e.preventDefault();
            //    e.stopPropagation();
            //    var cmd = $(this).attr("data-cmd");
            //    $T.OnCommand(cmd, null);
            //});
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
                $.each($T.manager.control, function (index, item) {
                    if (item.editor.isDirty()) {
                        item.editor.isNotDirty = true;
                        $T.manager.updateSavedContent(item.editor);
                        //item.savedContent = item.editor.getContent();
                    }
                });
                $U.SetEnabled($(".edit-toolbar button[data-cmd='save-changes']"), false);
            });
        },
        OpenStoreBrowser: function () {
            //$(".mce-resizehandle").hide();
            var sb = new StoreBrowser();
            sb.show();
        },
        //
        CloseEditors: function (okcallback) {
            function afterClose() {
                $.core$page.isEditing = false;
                okcallback();
            };
            if ($T.IsDirty()) {
                var mb = new $.fastnet$messageBox({
                    CancelButton: true
                });
                var message = "There are unsaved changes. Closing edit mode will discard these changes! Please confirm.";
                mb.show(message, function (cmd) {
                    //$U.Debug("message box returned command {0}", cmd);
                    if (cmd === "ok") {
                        tinymce.remove();
                        $T.manager.restoreAllContent();
                        afterClose();
                    }
                });
            } else {
                tinymce.remove();
                //result = true;
                afterClose();
            }
            //return result;
        },
        InsertLink: {
            currentEditor: null,
            options: {
                mode: 'prompt'
            },
            Start: function (options) {
                var $this = this;
                $.extend($this.options, options);
                $this.currentEditor = tinymce.EditorManager.activeEditor;
                function pasteLink(linkurl, linktext) {
                    var content = null;
                    if (linkurl.indexOf("image/") === 0) {
                        content = $U.Format('<img src="{0}" alt="{1}">', linkurl, linktext);
                    } else {
                        content = $U.Format('<a href="{0}">{1}</a>', linkurl, linktext);
                    }
                    //var content = $U.Format('<a href="{0}">{1}</a>', data.linkurl, data.linktext);
                    $this.currentEditor.focus();
                    //$this.currentEditor.setContent(content);
                    $this.currentEditor.execCommand("mceReplaceContent", 0, content);
                };

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
                var editAfterCreate = $this.options.mode === "createandedit";
                switch ($this.options.mode) {
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
                            OnCommand: function (f, cmd) {
                                switch (cmd) {
                                    case "find-link":
                                        f.clearMessages();
                                        $T.BrowseForLink.Start(f, function () {
                                            //$T.cm = $.fastnet$contextmenu.GetContextMenu();
                                            //$T.cm.BeforeOpen = $T.OnBeforeContextMenuOpen;
                                        });
                                        break;
                                    case "insertlink":
                                        var data = f.getData();
                                        if (data.linktext === null || data.linktext === "") {
                                            data.linktext = data.linkurl;
                                        }
                                        pasteLink(data.linkurl, data.linktext);
                                        f.close();
                                        break;
                                }
                            },
                        }, {
                            LinkUrl: url,
                            LinkText: text
                        });
                        var validator = new $.fastnet$validators.Create(ilf);
                        validator.AddIsRequired("linkurl", "A link url is required");
                        //ilf.addIsRequiredValidator("linkurl", "A link url is required");
                        ilf.disableCommand("insertlink");
                        ilf.show();
                        break;
                    case "createandedit":
                    case 'createnew':
                        //$T.control.push({ panel: panelName, editor: editor, savedContent: originalHtml });
                        var ctrl = $T.manager.getControlForEditor($this.currentEditor);// getControl();
                        var panelSelector = "." + ctrl.panel;
                        var pageId = parseInt($(panelSelector).attr("data-page-id"));
                        var url = $U.Format("store/createpage");
                        var postData = { referencePageId: pageId, type: "centre" };
                        $.when($U.AjaxPost({ url: url, data: null })).then(function (r) {
                            var newPageId = r.PageId;
                            var pageUrl = r.Url;
                            var pageName = r.Name;
                            if (text === "") {
                                text = pageName;
                            }
                            pasteLink(pageUrl, text);
                            if (editAfterCreate) {
                                $.core$page.GotoInternalLink(pageUrl);
                            }
                        });
                        break;
                }
            },
        },
        BrowseForLink: {
            Start: function (ctx, onClose) {
                //var pb = new pageBrowser({
                //    Context: ctx,
                //    OnClose: onClose,
                //    OnCancel: function () {
                //        //$U.Debug("Page browser closed with a cancel/system-close");
                //    },
                //    OnSelect: function (ctx, selectedItem) {
                //        //$U.Debug("selected url {0}", selectedItem.Url);
                //        ctx.setData("linkurl", selectedItem.Url);
                //        if (ctx.isValid()) {
                //            ctx.enableCommand("insertlink");
                //        } else {
                //            ctx.disableCommand("insertlink");
                //        }
                //    }
                //});
                //pb.Show();
                var sb = new StoreBrowser({
                //var pb = new pageBrowser({
                    User: ctx,
                    OnClose: onClose,
                    OnCancel: function () {
                        //$U.Debug("Page browser closed with a cancel/system-close");
                    },
                    OnSelect: function (ctx, selectedItem) {
                        //$U.Debug("selected url {0}", selectedItem.Url);
                        ctx.setData("linkurl", selectedItem.Url);
                        if (ctx.isValid()) {
                            ctx.enableCommand("insertlink");
                        } else {
                            ctx.disableCommand("insertlink");
                        }
                    }
                });
                sb.show();
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
        OnCommand: function (cmd, data) {
            switch (cmd) {
                case "exit-edit-mode":
                    $T.Stop();
                    break;

                //case "save-changes":
                //    $T.SavePageChanges();
                //    break;
                //case "open-store-browser":
                //    $T.OpenStoreBrowser();
                //    break;
                default:
                    alert("This feature is not implemented");
                    break;
            }
        },
        OnContentChange: function (ed) {
            //$U.Debug("text change ({0})", ed.settings.selector);
            $U.SetEnabled($(".edit-toolbar button[data-cmd='save-changes']"), true);
        },
        OpenEditor: function (panelName) {
            var selector = "." + panelName;// + " .editable-content";
            var originalHtml = $(selector).html();
            tinymce.baseURL = $T.tinymceUrl;
            tinymce.init({
                selector: selector,
                browser_spellcheck: true,
                visual_table_class: "",
                paste_data_images: true,
                plugins: "textcolor colorpicker visualblocks table link image code",
                menubar: false,
                inline: true,
                toolbar_items_size: 'small',
                toolbar: ["undo redo | cut copy paste | styleselect | fontselect fontsizeselect | visualblocks code",
                          "bold italic forecolor backcolor | bullist numlist | alignleft aligncenter alignright outdent indent | insertlinks | table"],
                setup: function (editor) {
                    $T.manager.add(panelName, editor, originalHtml);
                    //$T.control.push({ panel: panelName, editor: editor, savedContent: originalHtml });
                    editor.addButton('insertlinks', {
                        type: 'menubutton',
                        text: 'Links|Images',
                        title: "insert links & images",
                        icon: 'link',
                        menu: [
                            { text: 'Insert link/image ...', onclick: function () { $T.InsertLink.Start({ mode: 'prompt' }); } },
                            { text: 'Insert link to new page', onclick: function () { $T.InsertLink.Start({ mode: 'createnew' }); } },
                            { text: 'Insert link & edit new page ...', onclick: function () { $T.InsertLink.Start({ mode: 'createandedit' }); } }
                            //,{ text: 'break ...', onclick: function () { debugger; } }
                        ]
                    });
                    editor.on('change', function (e) {
                        $T.OnContentChange(editor);
                    });
                }
            });
        },

        Start: function () {
            $T.SetEditToolbar("open");
            //if (!$T.isOpen) {
            //    $(".edit-toolbar").addClass("opaque");
            //    $(".edit-panel").removeClass("closed").addClass("open");//.height(32);
            //    $T.isOpen = true;
            //}
            var centrePageId = $(".CentrePanel").attr("data-page-id");
            var url = $U.Format("store/panelinfo/{0}", centrePageId);
            $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                //debugger;
                $T.StartEditors(r);
                $.core$page.isEditing = true;
                $(window).on("resize.editor", function () { $T.onwindowresize(); });
            });
        },
        SetEditToolbar: function(cmd) {
            switch(cmd) {
                case "hidden":
                    // i.e. editing cannot be accessed at all (no editing is possible)
                    // this is the default appearance of the toolbar
                    $(".edit-toolbar").removeClass("present"); //i.e. it cannot be seen
                    break;
                case "closed":
                    // i.e. editing is possible but the toolbar is closed and can only be clicked
                    $(".edit-toolbar").addClass("present"); // i.e. it is there to see
                    $(".edit-toolbar").removeClass("down").addClass("up");
                    break;
                case "open":
                    // i.e. toolbar is fully open (all buttons are visible), editors are loaded
                    $(".edit-toolbar").removeClass("up").addClass("down");
                    break;
            }
        },
        PageChanged: function () {
            function update(panelName, pageId) {
                var ctrl = $T.manager.getControlForPanel(panelName);
                if (ctrl !== null) {
                    if (pageId === null) {
                        ctrl.editor.remove();
                        $T.manager.remove(panelName);
                    } else {
                        $T.manager.updateSavedContent(ctrl.editor);
                    }
                } else {
                    if (pageId !== null) {
                        $T.OpenEditor(panelName);
                    }
                }
            };
            setTimeout(function () {
                var centrePageId = $(".CentrePanel").attr("data-page-id");
                var url = $U.Format("store/panelinfo/{0}", centrePageId);
                $.when($U.AjaxGet({ url: url }, true)).then(function (r) {
                    update("BannerPanel", r.BannerPanel.PageId);
                    update("LeftPanel", r.LeftPanel.PageId);
                    update("RightPanel", r.RightPanel.PageId);
                    update("CentrePanel", centrePageId);
                });
            }, 300);
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
            $T.CloseEditors(function () {
                $T.isOpen = false;
                $(".edit-toolbar").removeClass("opaque");
                $(".edit-panel").removeClass("open").addClass("closed");
                $T.cleanupTinymce();
                $(window).off(".editor");
            })
        },

        onwindowresize: function () {
            var totalHeight = $(window).height();
            var panel = ".CentrePanel";
            var panelTop = $(panel).offset().top;
            var availableHeight = totalHeight - panelTop;
            $(panel).css("max-height", availableHeight + "px");
            //debugger;
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
        //$.core$editor.Init();
        //debugger;
    });
})(jQuery);