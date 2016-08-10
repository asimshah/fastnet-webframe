var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fastnet;
(function (fastnet) {
    "use strict";
    (function (commands) {
        commands[commands["selectItem"] = 400] = "selectItem";
        commands[commands["addNewPage"] = 401] = "addNewPage";
        commands[commands["uploadFiles"] = 402] = "uploadFiles";
    })(fastnet.commands || (fastnet.commands = {}));
    var commands = fastnet.commands;
    var browserForms = (function () {
        function browserForms() {
            this.monitoredProperties = [];
            this._canSave = false;
            this.form = null;
            this.template = null;
        }
        Object.defineProperty(browserForms.prototype, "canSave", {
            get: function () {
                return this._canSave;
            },
            set: function (val) {
                this._canSave = val;
                if (this.canSave) {
                    //command.enable(commands.okcommand, "#" + this.form.Id);
                    this.form.enableCommand(commands.okcommand);
                }
                else {
                    //command.disable(commands.okcommand, "#" + this.form.Id);
                    this.form.disableCommand(commands.okcommand);
                }
            },
            enumerable: true,
            configurable: true
        });
        browserForms.prototype.addMonitoredProperty = function (name, p) {
            var _this = this;
            var subscription = p.subscribe(function (nv) {
                var item = _this.monitoredProperties.find(function (x) { return x.name === name; });
                _this.onPropertyChanged(name, item.originalValue, nv);
            });
            this.monitoredProperties.push({ name: name, originalValue: p(), subscription: subscription });
        };
        browserForms.prototype.getOriginalValue = function (name) {
            return this.monitoredProperties.find(function (item) { return item.name === name; }).originalValue;
        };
        browserForms.prototype.onPropertyChanged = function (name, originalValue, newValue) {
            //if (this.options.onPropertyChanged !== null) {
            //    this.options.onPropertyChanged(name, originalValue, newValue);
            //}
        };
        browserForms.prototype.isNullOrWhitespace = function (s) {
            return !s || !s.trim();
        };
        browserForms.prototype.clearMonitoredProperties = function () {
            $.each(this.monitoredProperties, function (index, item) {
                item.subscription.dispose();
            });
            this.monitoredProperties = [];
        };
        browserForms.prototype._show = function (templateUrl, options) {
            var _this = this;
            options.classNames = "webframe-form";
            options.onCommand = function (cmd) { return _this.handleCommands(cmd); };
            return new Promise(function (resolve) {
                fastnet.ajax.Get({ url: templateUrl }).then(function (r) {
                    _this.resolver = resolve;
                    options.template = r.Template;
                    _this.form = new fastnet.form(options);
                    _this.form.show().then(function (r) {
                        _this.resolver(r);
                    });
                });
            });
        };
        browserForms.prototype.handleCommands = function (cmd) {
        };
        return browserForms;
    }());
    var pagePropertiesForm = (function (_super) {
        __extends(pagePropertiesForm, _super);
        function pagePropertiesForm(pageId) {
            _super.call(this);
            this.id = pageId;
        }
        pagePropertiesForm.prototype.show = function () {
            var _this = this;
            //"template/get/main-forms-editor/pageproperties"
            var url = "store/get/page/" + this.id;
            fastnet.ajax.Get({ url: url, cache: false }).then(function (r) {
                var options = {
                    sizeRatio: 0.75,
                    modal: true,
                    okButtonCaption: "Save Changes ...",
                    caption: r.Url + " Properties",
                    afterDisplay: function () {
                        if (r.LandingPageLocked) {
                            $("#" + _this.form.Id).find("input[data-item='landing-page']").prop("disabled", true);
                        }
                        _this.form.disableCommand(commands.okcommand);
                        // MUST DO THIS!!!!!!!!!!!!!!!!
                        // this.form.bindModel(this.model);
                    },
                };
            });
        };
        return pagePropertiesForm;
    }(browserForms));
    var StoreBrowser = (function (_super) {
        __extends(StoreBrowser, _super);
        function StoreBrowser() {
            _super.call(this);
            //private options = null;
            //private form: form = null;
            this.tview = null;
            this.currentDirectoryId = null;
            this.rootDirectoryId = null;
            this.selectedItem = null;
            this.myDropzone = null;
            this.mode = "normal";
            this.allowEditing = true;
            this.filter = 0; // 0 means all - wish javascript had enums!
            this.User = null;
            this.OnClose = null;
            this.OnCancel = null;
            this.OnSelect = null;
        }
        StoreBrowser.prototype.show = function (options) {
            var _this = this;
            if (options) {
                this.filter = options.Filter;
                this.allowEditing = options.AllowEditing;
            }
            this.tview = new fastnet.treeView({
                EnableContextMenu: this.allowEditing,
                Selector: ".store-browser .browser-tree",
                OnSelectChanged: function (d) { return _this.onFolderSelectChanged(d); },
                OnExpandCollapse: function (d) { return _this.onExpandCollapse(d); },
                OnBeforeContextMenu: function () { }
            });
            this.showForm();
        };
        StoreBrowser.prototype.showForm = function () {
            var _this = this;
            var url = "store/directories";
            fastnet.ajax.Get({ url: url, cache: false }).then(function (r) {
                var options = {
                    sizeRatio: 0.75,
                    modal: true,
                    //okButtonCaption: "Save Changes ...",
                    caption: "Store Browser",
                    afterDisplay: function () {
                        _this.form.disableCommand(commands.selectItem);
                        _this.form.disableCommand(commands.addNewPage);
                        _this.form.disableCommand(commands.uploadFiles);
                        if (_this.mode === "select") {
                            _this.form.find(".store-browser-commands").removeClass("normal-mode").addClass("select-mode");
                        }
                        if (_this.allowEditing === false) {
                            _this.form.find(".store-browser").addClass("edit-disabled");
                        }
                        // MUST DO THIS!!!!!!!!!!!!!!!!
                        // this.form.bindModel(this.model);
                        // I am assuming here that on this first call for directories
                        // I will always get an array of one entry and that
                        // entry is the $root directory (renamed by the server to Store)
                        _this.rootDirectoryId = r[0].Id;
                        _this.loadTreeViewItem(null, r);
                    },
                };
                _this._show("template/get/main-forms-editor/BrowseForLink", options);
            });
        };
        StoreBrowser.prototype.onFolderSelectChanged = function (data) {
            var directoryId = parseInt(data.userData);
            var folderContent = $("#" + this.form.Id).find(".browser-folder-content"); // form.find(".browser-folder-content");
            if (this.currentDirectoryId !== directoryId) {
                this.currentDirectoryId = directoryId;
                this.loadDirectoryContent();
            }
            if (data.isSelected) {
                //form.enableCommand("add-new-page");
                //form.enableCommand("upload-files");
                this.form.enableCommand(commands.addNewPage);
                this.form.enableCommand(commands.uploadFiles);
                folderContent.show();
            }
            else {
                //form.disableCommand("add-new-page");
                //form.disableCommand("upload-files");
                this.form.disableCommand(commands.addNewPage);
                this.form.disableCommand(commands.uploadFiles);
                folderContent.hide();
            }
        };
        StoreBrowser.prototype.getStoreItem = function (item) {
            switch (item.Type) {
                case "page":
                    return {
                        IsPage: true,
                        Type: item.Type,
                        Id: item.Id,
                        Url: item.Url,
                        Name: item.Name,
                        PageType: item.PageType,
                        LandingPage: item.LandingPage,
                        LandingPageImage: item.LandingPageImage,
                        PageTypeImage: item.PageTypeImage,
                        PageTypeTooltip: item.PageTypeTooltip
                    };
                //break;
                case "image":
                    return {
                        IsImage: true,
                        Type: item.Type,
                        Id: item.Id,
                        Url: item.Url,
                        Name: item.Name,
                        LandingPage: false,
                        Size: item.Size,
                        ImageTypeImage: item.ImageTypeImage
                    };
                //break;
                case "document":
                    return {
                        IsDocument: true,
                        Type: item.Type,
                        Id: item.Id,
                        Url: item.Url,
                        Name: item.Name,
                        LandingPage: false,
                        Size: item.Size,
                        DocumentTypeImage: item.DocumentTypeImage
                    };
            }
        };
        StoreBrowser.prototype.selectItem = function (type, id, name, url) {
            if (type === null) {
                this.selectedItem = {};
                //form.disableCommand("select-item");
                this.form.disableCommand(commands.selectItem);
            }
            else {
                this.selectedItem = { Type: type, Id: id, Name: name, Url: url };
                //form.enableCommand("select-item");
                this.form.enableCommand(commands.selectItem);
            }
        };
        StoreBrowser.prototype.loadDirectoryContent = function () {
            var _this = this;
            var url = "store/content/" + this.currentDirectoryId;
            if (this.filter !== 0) {
                url += "/" + this.filter;
            }
            var content = { data: [] };
            fastnet.ajax.Get({ url: url, cache: false }).then(function (data) {
                fastnet.ajax.Get({ url: "template/get/main-forms-editor/storecontent", cache: false }).then(function (r) {
                    if (data.length > 0) {
                        $.each(data, function (index, item) {
                            content.data.push(_this.getStoreItem(item));
                        });
                        var contentTemplate = r.Template;
                        var dataTable = $(Mustache.to_html(contentTemplate, content));
                        $(".browser-folder-content").empty().append(dataTable);
                        if (_this.mode === "select") {
                            $(".browser-folder-content .data .url").on("click", function (e) {
                                var target = $(e.currentTarget).closest(".item-row");
                                if (target.hasClass("selected")) {
                                    target.removeClass("selected");
                                    _this.selectItem(null, null, null, null);
                                }
                                else {
                                    $(".browser-folder-content .item-row").removeClass("selected");
                                    var dataRow = target.closest("div[data-id]");
                                    var isSelectable = false;
                                    //let type = dataRow.attr("data-type");
                                    switch (dataRow.attr("data-type")) {
                                        case "page":
                                            isSelectable = true;
                                            break;
                                        default:
                                            isSelectable = true;
                                            break;
                                    }
                                    if (isSelectable) {
                                        target.addClass("selected");
                                        var id = parseInt(dataRow.attr("data-id"));
                                        var name_1 = dataRow.attr("data-name");
                                        //var type = dataRow.attr("data-type");
                                        var url_1 = dataRow.attr("data-url");
                                        _this.selectItem(dataRow.attr("data-type"), id, name_1, url_1);
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
                                _this.showPageProperties(id);
                            }
                        });
                        $(".browser-folder-content .data .delete-button").on("click", function (e) {
                            var target = $(e.currentTarget);
                            var dataRow = target.closest("div[data-id]");
                            var id = parseInt(dataRow.attr("data-id"));
                            var type = dataRow.attr("data-type");
                            var message = "<span>Please confirm that <b>/" + type + "/" + id + "</b> should be deleted</span>";
                            var mb = new fastnet.messageBox({
                                caption: "System Message",
                                template: message
                            });
                            mb.show().then(function (r) {
                                if (r) {
                                    _this.deleteItem(type, id);
                                }
                            });
                            //$U.Confirm(message, function () { deleteItem(type, id); });
                        });
                    }
                    else {
                        $(".browser-folder-content .data").off();
                        $(".browser-folder-content").empty().html("<div>Folder is empty</div>");
                    }
                });
            });
        };
        StoreBrowser.prototype.showPageProperties = function (id) {
            var pageForm = new pagePropertiesForm(id);
            pageForm.show();
        };
        ;
        StoreBrowser.prototype.loadTreeViewItem = function (node, data) {
            var _this = this;
            $.each(data, function (index, item) {
                var html = "<span class='fa fa-folder folder-icon' ></span><span class='title' >" + item.Name + "</span>";
                _this.tview.AddNode(node, { NodeHtml: html, Title: item.Name, UserData: item.Id, ChildCount: item.SubdirectoryCount });
            });
        };
        StoreBrowser.prototype.deleteItem = function (type, id) {
            var _this = this;
            var url = "store/delete";
            var postData = { type: type, id: id };
            fastnet.ajax.Post({ url: url, data: postData }).then(function (r) {
                if (type === "directory") {
                    _this.removeDirectoryNode(id);
                }
                else {
                    _this.loadDirectoryContent();
                }
            });
        };
        StoreBrowser.prototype.removeDirectoryNode = function (id) {
            var node = this.findDirectoryNode(id);
            node.remove();
        };
        StoreBrowser.prototype.findDirectoryNode = function (id) {
            return $(".store-browser .browser-tree").find(".tree-node[data-user='" + id + "']");
        };
        StoreBrowser.prototype.onExpandCollapse = function (data) {
            if (!data.isLoaded) {
                this.loadSubdirectories(data.node, parseInt(data.userData));
            }
        };
        StoreBrowser.prototype.loadSubdirectories = function (node, directoryId) {
            var _this = this;
            var url = "store/directories/" + directoryId;
            fastnet.ajax.Get({ url: url, cache: false }).then(function (data) {
                if (data.length === 0) {
                    // there are no subdirectories but we need to ensure that the node
                    // is set to isLoaded.
                    _this.tview.SetNodeLoaded(node);
                }
                else {
                    _this.loadTreeViewItem(node, data);
                }
            });
            //$.when($U.AjaxGet({ url: url }, true)).then(function (data) {
            //    if (data.length === 0) {
            //        // there are no subdirectories but we need to ensure that the node
            //        // is set to isLoaded.
            //        this.tview.SetNodeLoaded(node);
            //    } else {
            //        this.loadTreeViewItem(node, data);
            //    }
            //});
        };
        return StoreBrowser;
    }(browserForms));
    fastnet.StoreBrowser = StoreBrowser;
})(fastnet || (fastnet = {}));
//# sourceMappingURL=storeBrowser.js.map