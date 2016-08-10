namespace fastnet {
    "use strict";
    export enum commands {
        selectItem = 400,
        addNewPage,
        uploadFiles,
    }
    interface storeBrowserOptions {
        Filter: any;
        AllowEditing: boolean;
        UserData: any;
        //OnClose: any;
        OnSelect: any;
        Mode: storeBrowserMode;
    }
    type storeBrowserMode = "normal" | "selected";
    interface storeItem {
        Id: number;
        Url: string;
        Name: string;
        Type: any;
    }
    interface storePage extends storeItem {
        IsPage: boolean;
        PageType: any;
        LandingPage: any;
        LandingPageImage: any;
        PageTypeImage: any;
        PageTypeTooltip: any;
    }
    interface storeImage extends storeItem {
        IsImage: boolean;
        LandingPage: boolean,
        Size: any,
        ImageTypeImage: any
    }
    interface storeDocument extends storeItem {
        IsDocument: boolean;
        LandingPage: any;
        Size: any;
        DocumentTypeImage: any;
    }
    abstract class browserForms {
        private monitoredProperties: { name: string, originalValue: any, subscription: KnockoutSubscription }[] = [];
        private _canSave: boolean = false;
        protected form: form = null;
        protected resolver: (value?: boolean | Thenable<boolean>) => void;
        protected template: string = null;
        protected get canSave(): boolean {
            return this._canSave;
        }
        protected set canSave(val: boolean) {
            this._canSave = val;
            if (this.canSave) {
                //command.enable(commands.okcommand, "#" + this.form.Id);
                this.form.enableCommand(commands.okcommand);
            } else {
                //command.disable(commands.okcommand, "#" + this.form.Id);
                this.form.disableCommand(commands.okcommand);
            }
        }
        protected addMonitoredProperty(name: string, p: KnockoutObservable<any>): void {
            let subscription = p.subscribe((nv) => {
                let item = this.monitoredProperties.find((x) => x.name === name);
                this.onPropertyChanged(name, item.originalValue, nv);
            });
            this.monitoredProperties.push({ name: name, originalValue: p(), subscription: subscription });
        }
        protected getOriginalValue(name: string): any {
            return this.monitoredProperties.find((item) => item.name === name).originalValue;
        }
        protected onPropertyChanged(name: string, originalValue: any, newValue: any): void {
            //if (this.options.onPropertyChanged !== null) {
            //    this.options.onPropertyChanged(name, originalValue, newValue);
            //}
        }
        protected isNullOrWhitespace(s: string): boolean {
            return !s || !s.trim();
        }
        private clearMonitoredProperties(): void {
            $.each(this.monitoredProperties, (index, item) => {
                item.subscription.dispose();
            });
            this.monitoredProperties = [];
        }
        protected _show(templateUrl: string, options: formOptions): Promise<boolean> {
            options.classNames = "webframe-form";
            options.onCommand = (cmd) => this.handleCommands(cmd);
            return new Promise<boolean>((resolve) => {
                ajax.Get({ url: templateUrl }).then((r: any) => {
                    this.resolver = resolve;
                    options.template = r.Template;
                    this.form = new form(options);
                    this.form.show().then((r) => {
                        this.resolver(r);
                    });
                });
            });
        }
        protected handleCommands(cmd: receivedCommand): void {
        }
    }

    class pagePropertiesForm extends browserForms {
        private id: number;
        constructor(pageId: number) {
            super();
            this.id = pageId;
        }
        public show() {
            //"template/get/main-forms-editor/pageproperties"
            let url = `store/get/page/${this.id}`;
            ajax.Get({ url: url, cache: false }).then((r: any) => {
                let options: formOptions = {
                    sizeRatio: 0.75,
                    modal: true,
                    okButtonCaption: "Save Changes ...",
                    caption: `${r.Url} Properties`,
                    afterDisplay: () => {
                        if (r.LandingPageLocked) {
                            $(`#${this.form.Id}`).find("input[data-item='landing-page']").prop("disabled", true);
                        }
                        this.form.disableCommand(commands.okcommand);
                        // MUST DO THIS!!!!!!!!!!!!!!!!
                        // this.form.bindModel(this.model);
                    },
                };
            });
        }
    }

    export class StoreBrowser extends browserForms {
        //private options = null;
        //private form: form = null;
        private tview = null;
        private currentDirectoryId = null;
        private rootDirectoryId = null;
        private selectedItem = null;
        private myDropzone = null;
        private mode: storeBrowserMode = "normal";
        private allowEditing: boolean = true;
        private filter = 0; // 0 means all - wish javascript had enums!
        private User = null;
        private OnClose = null;
        private OnCancel = null;
        private OnSelect = null;
        constructor() {
            super();
        }
        public show(options?: storeBrowserOptions) {
            if (options) {
                this.filter = options.Filter;
                this.allowEditing = options.AllowEditing;
            }
            this.tview = new treeView({
                EnableContextMenu: this.allowEditing,
                Selector: ".store-browser .browser-tree",
                OnSelectChanged: (d) => this.onFolderSelectChanged(d),
                OnExpandCollapse: (d) => this.onExpandCollapse(d),
                OnBeforeContextMenu: () => { }
            });
            this.showForm();
        }
        private showForm() {
            let url = "store/directories";
            ajax.Get({ url: url, cache: false }).then((r: any) => {

                let options: formOptions = {
                    sizeRatio: 0.75,
                    modal: true,
                    //okButtonCaption: "Save Changes ...",
                    caption: "Store Browser",
                    afterDisplay: () => {
                        this.form.disableCommand(commands.selectItem);
                        this.form.disableCommand(commands.addNewPage);
                        this.form.disableCommand(commands.uploadFiles);
                        if (this.mode === "select") {
                            this.form.find(".store-browser-commands").removeClass("normal-mode").addClass("select-mode");
                        }
                        if (this.allowEditing === false) {
                            this.form.find(".store-browser").addClass("edit-disabled");
                        }
                        // MUST DO THIS!!!!!!!!!!!!!!!!
                        // this.form.bindModel(this.model);

                        // I am assuming here that on this first call for directories
                        // I will always get an array of one entry and that
                        // entry is the $root directory (renamed by the server to Store)
                        this.rootDirectoryId = r[0].Id;
                        this.loadTreeViewItem(null, r);
                    },
                };
                this._show("template/get/main-forms-editor/BrowseForLink", options);
            });
        }
        private onFolderSelectChanged(data) {
            let directoryId = parseInt(data.userData);
            var folderContent = $(`#${this.form.Id}`).find(".browser-folder-content");// form.find(".browser-folder-content");
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
            } else {
                //form.disableCommand("add-new-page");
                //form.disableCommand("upload-files");
                this.form.disableCommand(commands.addNewPage);
                this.form.disableCommand(commands.uploadFiles);
                folderContent.hide();
            }
        }
        private getStoreItem(item: any): storeItem {
            switch (item.Type) {
                case "page":
                    return <storePage>{
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
                    };
                //break;
                case "image":
                    return <storeImage>{
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
                    return <storeDocument>{
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
        }
        private selectItem(type, id, name, url) {
            if (type === null) {
                this.selectedItem = {};
                //form.disableCommand("select-item");
                this.form.disableCommand(commands.selectItem);
            } else {
                this.selectedItem = { Type: type, Id: id, Name: name, Url: url };
                //form.enableCommand("select-item");
                this.form.enableCommand(commands.selectItem);
            }
        }
        private loadDirectoryContent() {
            var url = `store/content/${this.currentDirectoryId}`;
            if (this.filter !== 0) {
                url += "/" + this.filter;
            }
            let content = { data: [] };
            ajax.Get({ url: url, cache: false }).then((data: any) => {
                ajax.Get({ url: "template/get/main-forms-editor/storecontent", cache: false }).then((r: any) => {
                    if (data.length > 0) {
                        $.each(data, (index, item) => {
                            content.data.push(this.getStoreItem(item));
                        });
                        let contentTemplate = r.Template;
                        let dataTable = $(Mustache.to_html(contentTemplate, content));
                        $(".browser-folder-content").empty().append(dataTable);
                        if (this.mode === "select") {
                            $(".browser-folder-content .data .url").on("click", (e) => {
                                let target = $(e.currentTarget).closest(".item-row");
                                if (target.hasClass("selected")) {
                                    target.removeClass("selected");
                                    this.selectItem(null, null, null, null);
                                } else {
                                    $(".browser-folder-content .item-row").removeClass("selected");
                                    let dataRow = target.closest("div[data-id]");
                                    let isSelectable = false;
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
                                        let id = parseInt(dataRow.attr("data-id"));
                                        let name = dataRow.attr("data-name");
                                        //var type = dataRow.attr("data-type");
                                        let url = dataRow.attr("data-url");
                                        this.selectItem(dataRow.attr("data-type"), id, name, url);
                                    }
                                }
                            });
                        }
                        $(".browser-folder-content .data .edit-button").on("click", (e) => {
                            let target = $(e.currentTarget);
                            let dataRow = target.closest("div[data-id]");
                            let id = parseInt(dataRow.attr("data-id"));
                            let type = dataRow.attr("data-type");
                            if (type === "page") {
                                this.showPageProperties(id);
                            }
                        });
                        $(".browser-folder-content .data .delete-button").on("click", (e) => {
                            let target = $(e.currentTarget);
                            let dataRow = target.closest("div[data-id]");
                            let id = parseInt(dataRow.attr("data-id"));
                            let type = dataRow.attr("data-type");
                            let message = `<span>Please confirm that <b>/${type}/${id}</b> should be deleted</span>`;
                            let mb = new messageBox({
                                caption: "System Message",
                                template: message
                            });
                            mb.show().then((r) => {
                                if (r) {
                                    this.deleteItem(type, id);
                                }
                            });
                            //$U.Confirm(message, function () { deleteItem(type, id); });
                        });
                    } else {
                        $(".browser-folder-content .data").off();
                        $(".browser-folder-content").empty().html("<div>Folder is empty</div>");
                    }
                });

            });
        }
        private showPageProperties(id) {
            let pageForm = new pagePropertiesForm(id);
            pageForm.show();
        };
        private loadTreeViewItem(node, data) {
            $.each(data, (index, item) => {
                var html = `<span class='fa fa-folder folder-icon' ></span><span class='title' >${item.Name}</span>`;
                this.tview.AddNode(node, { NodeHtml: html, Title: item.Name, UserData: item.Id, ChildCount: item.SubdirectoryCount });
            });
        }
        private deleteItem(type, id) {
            var url = "store/delete";
            let postData = { type: type, id: id };
            ajax.Post({ url: url, data: postData }).then((r: any) => {
                if (type === "directory") {
                    this.removeDirectoryNode(id);
                } else {
                    this.loadDirectoryContent();
                }
            });
        }
        private removeDirectoryNode(id) {
            var node = this.findDirectoryNode(id);
            node.remove();
        }
        private findDirectoryNode(id) {
            return $(".store-browser .browser-tree").find(".tree-node[data-user='" + id + "']");
        }
        private onExpandCollapse(data) {
            if (!data.isLoaded) {
                this.loadSubdirectories(data.node, parseInt(data.userData));
            }
        }
        private loadSubdirectories(node, directoryId) {
            var url = `store/directories/${directoryId}`;
            ajax.Get({ url: url, cache: false }).then((data: any) => {
                if (data.length === 0) {
                    // there are no subdirectories but we need to ensure that the node
                    // is set to isLoaded.
                    this.tview.SetNodeLoaded(node);
                } else {
                    this.loadTreeViewItem(node, data);
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
        }
    }
}