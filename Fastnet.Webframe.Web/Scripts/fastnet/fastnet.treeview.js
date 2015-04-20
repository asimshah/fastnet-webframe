(function ($) {
    var $T;
    var $U;
    var tv = function (options) {
        // options are:
        // Selector - the div in which to create the treeview
        // OnSelectChanged - select/deselect callback
        // OnExpandCollapse - expand/collapse callback
        this.options = $.extend({
            Selector: null,
            OnSelectChanged: null,
            OnExpandCollapse: null,
            NodeIndent: "16px",
            nodeTemplate:
                "<div class='tree-node node-closed' data-user='{{UserData}}' >" +
                "    <span class='fa node-control-icon' ></span>" +
                "    <span class='fa check-box hidden' ></span>" +
                "    <span class='node-item' >" +
                "    {{{NodeHtml}}}" +
                "    </span>" +
                "    <div class='child-nodes' data-loaded='false' data-child-count='{{ChildCount}}'>" +
                "    </div>" +
                "</div>",
        }, options);
        this.rootNodes = [];
        tv.prototype.AddNode = function (node, data) {
            if (typeof data.ChildCount === "undefined" || data.ChildCount === null) {
                data.ChildCount = 0;
            }
            var newNode = null;
            var isRoot = !$(node).hasClass('tree-node');
            var nodeHtml = $(Mustache.to_html(this.options.nodeTemplate, data));
            if (node === null) {
                newNode = $(nodeHtml).appendTo($(this.options.Selector));
                this.rootNodes.push(newNode);
            } else {
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
        tv.prototype.BindNode = function (node) {
            var self = this;
            var getNodeData = function (node) {
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
            var nodeItem = $(node).find("> .node-item");
            nodeItem.on("click", function (e) {
                e.stopPropagation();
                e.preventDefault();
                if ($(nodeItem).hasClass("selected")) {
                    $(nodeItem).removeClass("selected");
                } else {
                    var roots = self.rootNodes;// $T.findRootNode(node);
                    $.each(roots, function (index, root) {
                        //$U.Debug("root is {0}", root.attr("data-user"));
                        $(root).find(".node-item.selected").removeClass("selected");
                        $(nodeItem).addClass("selected");
                    });
                }
                if (self.options.OnSelectChanged !== null) {
                    self.options.OnSelectChanged(getNodeData(node));
                }
            });
            $(node).find("> .node-control-icon").on('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                var isClosed = $(node).hasClass("node-closed");
                if (isClosed) {
                    $(node).removeClass("node-closed");
                } else {
                    $(node).addClass("node-closed");
                }
                isClosed = !isClosed;
                self.UpdateNodeUI(node);
                //this.UpdateNodeUI(node);
                if (self.options.OnExpandCollapse !== null) {
                    self.options.OnExpandCollapse(getNodeData(node));
                }
                //$U.Debug("expand/collapse for {0}, currently closed = {1}", userData, isClosed);
            });
        };
        tv.prototype.SetNodeLoaded = function (node) {
            $(node).addClass("node-closed");
            var childrenPanel = $(node).find("> .child-nodes");
            childrenPanel.attr("data-loaded", "true");
            this.UpdateNodeUI(node);
        };
        tv.prototype.UpdateNodeUI = function (node) {
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
        };
    };
    $.fastnet$treeview = {
        NewTreeview: function (options) {
            return new tv(options);
        },
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
        },
    };
    $(function () {
        $.fastnet$treeview.Init();
        //debugger;
    });
})(jQuery);