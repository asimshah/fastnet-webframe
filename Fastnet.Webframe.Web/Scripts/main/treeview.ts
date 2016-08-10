namespace fastnet {
    "use strict";
    //interface contextMenuAction {
    //    element: Element, number, string, string
    //}
    type actionFunction = (element: Element, index: number, cmd: string, data: string) => void;
    interface contextMenuItem {
        menuItem: string; // menuitem html
        cmd: string;
        action: actionFunction;
        data: string;
        separator: boolean;
        disabled: boolean;
        hide: boolean
    }
    export class contextMenu {
        private static instance: contextMenu;
        private menuItems: contextMenuItem[] = [];
        private widget = null;
        public BeforeOpen: (contextMenu: contextMenu, element: Element) => void = null;
        constructor() {
            if (contextMenu.instance) {
                throw new Error("Error - use contextMenu.getInstance()");
            }
            if (this.widget === null) {
                //$(document)[0].addEventListener("click", () => $(this.widget).hide(), false);
                //this.widget = $("<div class='context-menu-container'></div>");
                //this.widget.addEventListener("click", (e) => {
                //    $(this.widget).hide();
                //}, false);
                //this.widget.appendTo("body").hide();
                this.widget = $("<div class='context-menu-container'></div>");
                this.widget.appendTo("body").hide();
                $(document)[0].addEventListener("click", () => $(this.widget).hide());
            }
        }
        public static getInstance(): contextMenu {
            contextMenu.instance = contextMenu.instance || new contextMenu();
            return contextMenu.instance;
        }
        public AddMenuItem(text: string, cmd: string, action: actionFunction, data: string): number {
            let count = this.menuItems.length;
            let html = `<div class='context-menu-item' data-cmd='${cmd}' data-cm-index='${count}'><span >${text}</span></div>`;
            let mi: contextMenuItem = {
                menuItem: html,
                cmd: cmd,
                action: action,
                data: data,
                separator: false,
                disabled: false,
                hide: false
            };
            this.menuItems.push(mi);
            return count;
        }
        public ClearMenuItems() {
            this.menuItems = [];
            $(".context-menu-container").off().empty();
        }
        public AddSeparator() {
            let count = this.menuItems.length;
            let sep = `<div class='context-menu-item-separator' data-cm-index='${count}' ></div>`;
            let si: contextMenuItem = { menuItem: sep, cmd: null, action: null, data: null, separator: true, disabled: false, hide: false };
            this.menuItems.push(si);
        }
        public AttachTo(element) {
            $(element)[0].addEventListener("contextmenu", () => this.onContextmenu, false);
        }
        public DetachFrom(element) {
            this.BeforeOpen = null;
            $(element)[0].removeEventListener("contextmenu", () => this.onContextmenu, false);
        }
        public DisableMenuItem(index) {
            let item = this.findMenuItem(index);
            if (item.separator === false) {
                item.disabled = true;
            }
        }
        public EnableMenuItem(index: number | string) {
            let item = this.findMenuItem(index);
            if (item.separator === false) {
                item.disabled = false;
            }
        }
        public Hide() {
            $(".context-menu-container").hide();
        }
        public HideMenuItem(index: number | string) {
            let item = this.findMenuItem(index);
            item.hide = true;
        }
        public IsMenuItemDisabled(index: number | string): boolean {
            let item = this.findMenuItem(index);
            return item.disabled;
        }
        public IsMenuItemHidden(index: number | string): boolean {
            let item = this.findMenuItem(index);
            return item.hide;
        }
        public ShowMenuItem(index: number | string) {
            let item = this.findMenuItem(index);
            item.hide = false;
        }
        private onContextmenu(e: JQueryMouseEventObject) {
            e.stopPropagation();
            e.preventDefault();
            //$cm = $T.cm;
            $(".context-menu-container").off().empty();
            $(".context-menu-container").hide();
            this.ClearMenuItems();
            if (this.BeforeOpen !== null) {
                this.BeforeOpen(this, e.srcElement);
            }
            var itemCount = 0;
            $.each(this.menuItems, (index, item) => {
                if (item.hide === false) {
                    var menuItem = item.menuItem;
                    var mi = $(menuItem).appendTo(".context-menu-container");
                    if (item.disabled) {
                        $(mi).addClass("disabled");
                    } else {
                        mi.on("click", () => {
                            item.action(e.srcElement, index, item.cmd, item.data);
                        });
                    }
                    itemCount++;
                }
            });
            if (itemCount > 0) {
                //if ($cm.BeforeOpen !== null) {
                //    $cm.BeforeOpen(e.srcElement);
                //}
                $(".context-menu-container").css({ left: e.pageX, top: e.pageY, position: 'absolute' }).show();
            }
        }
        private findMenuItem(index: number | string): contextMenuItem {
            var i;
            if (!$.isNumeric(index)) {
                $.each(this.menuItems, (j, item) => {
                    if (item.cmd === index) {
                        i = j;
                        return false;
                    }
                });
                //alert($U.Format("Context menu does not contain item {0} - system error!", index));
                //return null;
            } else {
                i = index;
            }
            return this.menuItems[i];
        }
    }
    export interface treeViewOptions {
        EnableContextMenu: boolean;
        Selector: string;
        OnSelectChanged: { (d: treeNodeData): void };
        OnExpandCollapse: { (d: treeNodeData): void };
        OnBeforeContextMenu: {(cm: contextMenu, userData: any): void};
    }
    export interface treeNode {
        NodeHtml: string;
        Title: string;
        UserData: any;
        ChildCount: number;
    }
    export interface treeNodeData {
        node: any;
        nodeItem: any;
        isSelected: any;
        userData: any;
        isLoaded: any;
        childCount: any;
        isClosed: any;
    }
    export class treeView {
        private cm: contextMenu = null;
        private rootNodes: any[];
        private enableContextMenu: boolean = false;
        private selector: string = null;
        private onBeforeContextMenu = null;
        private onSelectChanged = null;
        private onExpandCollapse = null;
        constructor(options: treeViewOptions) {
            this.rootNodes = [];
            this.enableContextMenu = options.EnableContextMenu;
            this.selector = options.Selector;
            this.onSelectChanged = options.OnSelectChanged;
            this.onExpandCollapse = options.OnExpandCollapse;
            this.onBeforeContextMenu = options.OnBeforeContextMenu;
        }
        public AddMenuItem(text: string, cmd: string, action: actionFunction, data: string) {
            this.cm.AddMenuItem(text, cmd, action, data);
        }
        public AddSeparator() {
            this.cm.AddSeparator();
        }
        public AddNode(node, data: treeNode) {
            if (typeof data.ChildCount === "undefined" || data.ChildCount === null) {
                data.ChildCount = 0;
            }
            let newNode = null;
            let isRoot = !$(node).hasClass('tree-node');
            //var nodeHtml = $(Mustache.to_html(this.nodeTemplate, data));
            let nodeHtml = `<div class='tree-node node-closed' data-user='${data.UserData}' >
                    <span class='fa node-control-icon' ></span>
                    <span class='fa check-box hidden' ></span>
                    <span class='node-item' >${data.NodeHtml}</span>
                    <div class='child-nodes' data-loaded='false' data-child-count='${data.ChildCount}'>
                    </div>
                </div>`
            if (node === null) {
                newNode = $(nodeHtml).appendTo($(this.selector));
                this.rootNodes.push(newNode);
                if (this.enableContextMenu) {
                    this.cm = contextMenu.getInstance();// $.fastnet$contextmenu.GetContextMenu();
                    this.cm.AttachTo(newNode);
                    this.cm.BeforeOpen = (cm, src) => {
                        let userData = $(src).closest(".tree-node").attr("data-user");
                        this.onBeforeContextMenu(cm, userData);
                    };
                }
            } else {
                let childrenPanel = $(node).find("> .child-nodes");
                newNode = $(nodeHtml).appendTo($(childrenPanel));
                $(newNode).addClass("child-node");
                let childNodeCount = $(childrenPanel).find("> .tree-node").length;
                childrenPanel.attr("data-child-count", childNodeCount);
                childrenPanel.attr("data-loaded", "true");
                this.UpdateNodeUI(node);
            }
            this.BindNode(newNode);
            this.UpdateNodeUI(newNode);
            return newNode;
        }
        public UpdateNodeUI(node) {
            var childrenPanel = $(node).find("> .child-nodes");
            var isLoaded = $(childrenPanel).attr("data-loaded") === "true";
            var childCount = parseInt($(childrenPanel).attr("data-child-count"));
            if (childCount > 0 || !isLoaded) {
                $(node).removeClass("node-indent");
                $(node).find(".node-control-icon").first().removeClass("hidden");
                if ($(node).hasClass("node-closed")) {
                    $(node).find(".node-control-icon").first().removeClass("fa-minus-square-o");
                    $(node).find(".node-control-icon").first().addClass("fa-plus-square-o");
                } else {
                    $(node).find(".node-control-icon").first().removeClass("fa-plus-square-o");
                    $(node).find(".node-control-icon").first().addClass("fa-minus-square-o");
                }
            } else {
                $(node).find(".node-control-icon").first().addClass("hidden");
                $(node).addClass("node-indent");
            }
        }
        public BindNode(node) {
            //var self = this;
            //var getNodeData = function (node) {
            //    var isClosed = $(node).hasClass("node-closed");
            //    var nodeItem = $(node).find("> .node-item");
            //    var isSelected = $(nodeItem).hasClass("selected")
            //    var userData = $(node).attr("data-user");
            //    var childrenPanel = $(node).find("> .child-nodes");
            //    var isLoaded = $(childrenPanel).attr("data-loaded") === "true";
            //    var childCount = parseInt($(childrenPanel).attr("data-child-count"));
            //    return {
            //        node: node,
            //        nodeItem: nodeItem,
            //        isSelected: isSelected,
            //        userData: userData,
            //        isLoaded: isLoaded,
            //        childCount: childCount,
            //        isClosed: isClosed
            //    };
            //};
            var nodeItem = $(node).find("> .node-item");
            nodeItem.on("click", (e) => {
                if (this.enableContextMenu) {
                    this.cm.Hide();
                }
                e.stopPropagation();
                e.preventDefault();
                if ($(nodeItem).hasClass("selected")) {
                    $(nodeItem).removeClass("selected");
                } else {
                    //var roots = this.rootNodes;// $T.findRootNode(node);
                    $.each(this.rootNodes, function (index, root) {
                        //$U.Debug("root is {0}", root.attr("data-user"));
                        $(root).find(".node-item.selected").removeClass("selected");
                        $(nodeItem).addClass("selected");
                    });
                }
                if (this.onSelectChanged !== null) {
                    this.onSelectChanged(this.getNodeData(node));
                }
            });
            $(node).find("> .node-control-icon").on('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                var isClosed = $(node).hasClass("node-closed");
                if (isClosed) {
                    $(node).removeClass("node-closed");
                } else {
                    $(node).addClass("node-closed");
                }
                isClosed = !isClosed;
                this.UpdateNodeUI(node);
                //this.UpdateNodeUI(node);
                if (this.onExpandCollapse !== null) {
                    this.onExpandCollapse(this.getNodeData(node));
                }
                //$U.Debug("expand/collapse for {0}, currently closed = {1}", userData, isClosed);
            });
        }
        public TriggerNode(node) {
            var nodeItem = $(node).find("> .node-item");
            nodeItem.trigger("click");
        }
        public SetNodeLoaded = function (node) {
            $(node).addClass("node-closed");
            var childrenPanel = $(node).find("> .child-nodes");
            childrenPanel.attr("data-loaded", "true");
            this.UpdateNodeUI(node);
        }
        public OpenNode(node) {
            $(node).find("> .node-control-icon").trigger('click');
        }
        public Clear() {
            $(this.selector).empty();
            this.rootNodes = [];
        };
        private getNodeData(node): treeNodeData {
        var isClosed = $(node).hasClass("node-closed");
        var nodeItem = $(node).find("> .node-item");
        var isSelected = $(nodeItem).hasClass("selected")
        var userData = $(node).attr("data-user");
        var childrenPanel = $(node).find("> .child-nodes");
        var isLoaded = $(childrenPanel).attr("data-loaded") === "true";
        var childCount = parseInt($(childrenPanel).attr("data-child-count"));
        return {
            node: node,
            nodeItem: nodeItem,
            isSelected: isSelected,
            userData: userData,
            isLoaded: isLoaded,
            childCount: childCount,
            isClosed: isClosed
        };
    };
    }
}