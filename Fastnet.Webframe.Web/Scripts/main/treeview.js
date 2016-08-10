var fastnet;
(function (fastnet) {
    "use strict";
    var contextMenu = (function () {
        function contextMenu() {
            var _this = this;
            this.menuItems = [];
            this.widget = null;
            this.BeforeOpen = null;
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
                $(document)[0].addEventListener("click", function () { return $(_this.widget).hide(); });
            }
        }
        contextMenu.getInstance = function () {
            contextMenu.instance = contextMenu.instance || new contextMenu();
            return contextMenu.instance;
        };
        contextMenu.prototype.AddMenuItem = function (text, cmd, action, data) {
            var count = this.menuItems.length;
            var html = "<div class='context-menu-item' data-cmd='" + cmd + "' data-cm-index='" + count + "'><span >" + text + "</span></div>";
            var mi = {
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
        };
        contextMenu.prototype.ClearMenuItems = function () {
            this.menuItems = [];
            $(".context-menu-container").off().empty();
        };
        contextMenu.prototype.AddSeparator = function () {
            var count = this.menuItems.length;
            var sep = "<div class='context-menu-item-separator' data-cm-index='" + count + "' ></div>";
            var si = { menuItem: sep, cmd: null, action: null, data: null, separator: true, disabled: false, hide: false };
            this.menuItems.push(si);
        };
        contextMenu.prototype.AttachTo = function (element) {
            var _this = this;
            $(element)[0].addEventListener("contextmenu", function () { return _this.onContextmenu; }, false);
        };
        contextMenu.prototype.DetachFrom = function (element) {
            var _this = this;
            this.BeforeOpen = null;
            $(element)[0].removeEventListener("contextmenu", function () { return _this.onContextmenu; }, false);
        };
        contextMenu.prototype.DisableMenuItem = function (index) {
            var item = this.findMenuItem(index);
            if (item.separator === false) {
                item.disabled = true;
            }
        };
        contextMenu.prototype.EnableMenuItem = function (index) {
            var item = this.findMenuItem(index);
            if (item.separator === false) {
                item.disabled = false;
            }
        };
        contextMenu.prototype.Hide = function () {
            $(".context-menu-container").hide();
        };
        contextMenu.prototype.HideMenuItem = function (index) {
            var item = this.findMenuItem(index);
            item.hide = true;
        };
        contextMenu.prototype.IsMenuItemDisabled = function (index) {
            var item = this.findMenuItem(index);
            return item.disabled;
        };
        contextMenu.prototype.IsMenuItemHidden = function (index) {
            var item = this.findMenuItem(index);
            return item.hide;
        };
        contextMenu.prototype.ShowMenuItem = function (index) {
            var item = this.findMenuItem(index);
            item.hide = false;
        };
        contextMenu.prototype.onContextmenu = function (e) {
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
            $.each(this.menuItems, function (index, item) {
                if (item.hide === false) {
                    var menuItem = item.menuItem;
                    var mi = $(menuItem).appendTo(".context-menu-container");
                    if (item.disabled) {
                        $(mi).addClass("disabled");
                    }
                    else {
                        mi.on("click", function () {
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
        };
        contextMenu.prototype.findMenuItem = function (index) {
            var i;
            if (!$.isNumeric(index)) {
                $.each(this.menuItems, function (j, item) {
                    if (item.cmd === index) {
                        i = j;
                        return false;
                    }
                });
            }
            else {
                i = index;
            }
            return this.menuItems[i];
        };
        return contextMenu;
    }());
    fastnet.contextMenu = contextMenu;
    var treeView = (function () {
        function treeView(options) {
            this.cm = null;
            this.enableContextMenu = false;
            this.selector = null;
            this.onBeforeContextMenu = null;
            this.onSelectChanged = null;
            this.onExpandCollapse = null;
            this.SetNodeLoaded = function (node) {
                $(node).addClass("node-closed");
                var childrenPanel = $(node).find("> .child-nodes");
                childrenPanel.attr("data-loaded", "true");
                this.UpdateNodeUI(node);
            };
            this.rootNodes = [];
            this.enableContextMenu = options.EnableContextMenu;
            this.selector = options.Selector;
            this.onSelectChanged = options.OnSelectChanged;
            this.onExpandCollapse = options.OnExpandCollapse;
            this.onBeforeContextMenu = options.OnBeforeContextMenu;
        }
        treeView.prototype.AddMenuItem = function (text, cmd, action, data) {
            this.cm.AddMenuItem(text, cmd, action, data);
        };
        treeView.prototype.AddSeparator = function () {
            this.cm.AddSeparator();
        };
        treeView.prototype.AddNode = function (node, data) {
            var _this = this;
            if (typeof data.ChildCount === "undefined" || data.ChildCount === null) {
                data.ChildCount = 0;
            }
            var newNode = null;
            var isRoot = !$(node).hasClass('tree-node');
            //var nodeHtml = $(Mustache.to_html(this.nodeTemplate, data));
            var nodeHtml = "<div class='tree-node node-closed' data-user='" + data.UserData + "' >\n                    <span class='fa node-control-icon' ></span>\n                    <span class='fa check-box hidden' ></span>\n                    <span class='node-item' >" + data.NodeHtml + "</span>\n                    <div class='child-nodes' data-loaded='false' data-child-count='" + data.ChildCount + "'>\n                    </div>\n                </div>";
            if (node === null) {
                newNode = $(nodeHtml).appendTo($(this.selector));
                this.rootNodes.push(newNode);
                if (this.enableContextMenu) {
                    this.cm = contextMenu.getInstance(); // $.fastnet$contextmenu.GetContextMenu();
                    this.cm.AttachTo(newNode);
                    this.cm.BeforeOpen = function (cm, src) {
                        var userData = $(src).closest(".tree-node").attr("data-user");
                        _this.onBeforeContextMenu(cm, userData);
                    };
                }
            }
            else {
                var childrenPanel = $(node).find("> .child-nodes");
                newNode = $(nodeHtml).appendTo($(childrenPanel));
                $(newNode).addClass("child-node");
                var childNodeCount = $(childrenPanel).find("> .tree-node").length;
                childrenPanel.attr("data-child-count", childNodeCount);
                childrenPanel.attr("data-loaded", "true");
                this.UpdateNodeUI(node);
            }
            this.BindNode(newNode);
            this.UpdateNodeUI(newNode);
            return newNode;
        };
        treeView.prototype.UpdateNodeUI = function (node) {
            var childrenPanel = $(node).find("> .child-nodes");
            var isLoaded = $(childrenPanel).attr("data-loaded") === "true";
            var childCount = parseInt($(childrenPanel).attr("data-child-count"));
            if (childCount > 0 || !isLoaded) {
                $(node).removeClass("node-indent");
                $(node).find(".node-control-icon").first().removeClass("hidden");
                if ($(node).hasClass("node-closed")) {
                    $(node).find(".node-control-icon").first().removeClass("fa-minus-square-o");
                    $(node).find(".node-control-icon").first().addClass("fa-plus-square-o");
                }
                else {
                    $(node).find(".node-control-icon").first().removeClass("fa-plus-square-o");
                    $(node).find(".node-control-icon").first().addClass("fa-minus-square-o");
                }
            }
            else {
                $(node).find(".node-control-icon").first().addClass("hidden");
                $(node).addClass("node-indent");
            }
        };
        treeView.prototype.BindNode = function (node) {
            var _this = this;
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
            nodeItem.on("click", function (e) {
                if (_this.enableContextMenu) {
                    _this.cm.Hide();
                }
                e.stopPropagation();
                e.preventDefault();
                if ($(nodeItem).hasClass("selected")) {
                    $(nodeItem).removeClass("selected");
                }
                else {
                    //var roots = this.rootNodes;// $T.findRootNode(node);
                    $.each(_this.rootNodes, function (index, root) {
                        //$U.Debug("root is {0}", root.attr("data-user"));
                        $(root).find(".node-item.selected").removeClass("selected");
                        $(nodeItem).addClass("selected");
                    });
                }
                if (_this.onSelectChanged !== null) {
                    _this.onSelectChanged(_this.getNodeData(node));
                }
            });
            $(node).find("> .node-control-icon").on('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                var isClosed = $(node).hasClass("node-closed");
                if (isClosed) {
                    $(node).removeClass("node-closed");
                }
                else {
                    $(node).addClass("node-closed");
                }
                isClosed = !isClosed;
                _this.UpdateNodeUI(node);
                //this.UpdateNodeUI(node);
                if (_this.onExpandCollapse !== null) {
                    _this.onExpandCollapse(_this.getNodeData(node));
                }
                //$U.Debug("expand/collapse for {0}, currently closed = {1}", userData, isClosed);
            });
        };
        treeView.prototype.TriggerNode = function (node) {
            var nodeItem = $(node).find("> .node-item");
            nodeItem.trigger("click");
        };
        treeView.prototype.OpenNode = function (node) {
            $(node).find("> .node-control-icon").trigger('click');
        };
        treeView.prototype.Clear = function () {
            $(this.selector).empty();
            this.rootNodes = [];
        };
        ;
        treeView.prototype.getNodeData = function (node) {
            var isClosed = $(node).hasClass("node-closed");
            var nodeItem = $(node).find("> .node-item");
            var isSelected = $(nodeItem).hasClass("selected");
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
        ;
        return treeView;
    }());
    fastnet.treeView = treeView;
})(fastnet || (fastnet = {}));
//# sourceMappingURL=treeview.js.map