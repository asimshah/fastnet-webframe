var fastnet;
(function (fastnet) {
    "use strict";
    var Menu = (function () {
        function Menu() {
            this.menuId = null;
            this.menuBox = null;
            this.panels = [];
            this.parkedHTML = null;
            this.menuNumber = null;
            this.menuClasses = null;
            this.direction = "horizontal";
            this.menuNumber = Menu.instances.length;
            //this.menuId = `${this.menuNumber}`;
            Menu.instances.push(this);
        }
        Menu.prototype.create = function (selector, md, options) {
            var _this = this;
            this.container = selector;
            this.menuClasses = options.menuClasses;
            this.menuId = "menu-" + this.menuNumber;
            this.parseMenuData(this.menuId, md);
            var menu2Html = this.createMenuHtml(this.menuId);
            if ($(this.container).find(".menu-location").length > 0) {
                $(this.container).find(".menu-location").append(menu2Html);
            }
            else {
                $(this.container).append($(menu2Html));
            }
            var rootPanel = this.findPanelByParentId(this.menuId);
            this.showPanel(rootPanel, function () {
                _this.discoverStartingDimensions();
            });
            $("body").on("click", function () {
                _this.closeOpenPanels();
            });
            return this.menuId;
        };
        Menu.prototype.showBox = function (tagId) {
            return this.box2String(tagId, this.getBox(tagId));
        };
        Menu.prototype.park = function () {
            this.parkedHTML = $("#" + this.menuId)[0].outerHTML;
            $("#" + this.menuId).remove();
        };
        Menu.prototype.restore = function () {
            if ($(this.container).find(".menu-location").length > 0) {
                $(this.container).find(".menu-location").append(this.parkedHTML);
            }
            else {
                $(this.container).append($(this.parkedHTML));
            }
            this.parkedHTML = null;
        };
        Menu.prototype.getId = function () {
            return this.menuId;
        };
        Menu.prototype.parsePanel = function (containerId, parentId, level, list, pn, min) {
            var _this = this;
            var panelId = containerId + "-mp-" + pn++; // $U.Format("{0}-mp-{1}", containerId, pn++);
            var panel = { id: panelId, parentId: parentId, level: level, visible: false, menuItems: [], box: null };
            $.each(list, function (i, item) {
                // item.Index, item.Text, item.Url, item.Submenus
                // each array of these is in a panel                    
                var id = panelId + "-mi-" + min++; // $U.Format("{0}-mi-{1}", panelId, min++);
                panel.menuItems.push({
                    panelId: panelId,
                    id: id,
                    index: item.Index,
                    text: item.Text,
                    url: item.Url,
                    box: null
                });
                if (item.Submenus.length > 0) {
                    _this.parsePanel(containerId, id, level + 1, item.Submenus, pn, min);
                }
            });
            this.panels.push(panel);
        };
        Menu.prototype.parseMenuData = function (containerId, md) {
            this.parsePanel(containerId, containerId, 0, md, 0, 0);
        };
        Menu.prototype.createMenuHtml = function (mid) {
            var _this = this;
            var menuHtml = $("<div id='" + mid + "' class='fastnet-menu " + this.direction + "'></div>");
            if (this.menuClasses !== null && this.menuClasses.length > 0) {
                $.each(this.menuClasses, function (i, mc) {
                    menuHtml.addClass(mc);
                });
            }
            $.each(this.panels, function (i, panel) {
                var panelHtml = $("<div id='" + panel.id + "' class='menu-item-panel level-" + panel.level + "' data-parent='" + panel.parentId + "' ></div>");
                panel.menuItems.sort(function (first, second) {
                    if (first.index === second.index) {
                        return 0;
                    }
                    else if (first.index < second.index) {
                        return -1;
                    }
                    else {
                        return 1;
                    }
                });
                $.each(panel.menuItems, function (j, mi) {
                    var menuItemHtml = $("<div id='" + mi.id + "' class='menu-item'></div>");
                    if (mi.url === null) {
                        menuItemHtml.addClass("has-submenus");
                        menuItemHtml.append($("<a href='#'><span>" + mi.text + "</span></a>"));
                        if (_this.direction === "horizontal" && panel.level > 0) {
                            menuItemHtml.append($("<span class='fa fa-caret-right indicator'></span>"));
                        }
                        else {
                            menuItemHtml.append($("<span class='fa fa-caret-down indicator'></span>"));
                        }
                    }
                    else {
                        menuItemHtml.append($("<a href='" + mi.url + "'><span>" + mi.text + "</span></a>"));
                    }
                    panelHtml.append(menuItemHtml);
                });
                menuHtml.append(panelHtml);
            });
            if (this.direction === "vertical") {
                $(menuHtml).find(".menu-item-panel:not(.level-0)").each(function (i, mp) {
                    var parentId = $(mp).attr("data-parent");
                    $(menuHtml).find("#" + parentId).append(mp);
                });
            }
            $(menuHtml).find(".menu-item-panel").hide();
            return menuHtml[0].outerHTML;
        };
        Menu.prototype.findPanelByParentId = function (parentId) {
            var result = null;
            $.each(this.panels, function (i, panel) {
                if (panel.parentId === parentId) {
                    result = panel;
                    return false;
                }
            });
            return result;
        };
        Menu.prototype.showPanel = function (panel, onComplete) {
            var tagId = "#" + panel.id;
            if (panel.level === 0) {
                switch (this.direction) {
                    case "horizontal":
                        $(tagId).find(".menu-item").css("display", "inline-block");
                        break;
                    case "vertical":
                        $(tagId).find(".menu-item").css("display", "block");
                        break;
                }
            }
            if (this.direction === "horizontal" && panel.level > 0) {
                this.positionPanel(panel);
            }
            $(tagId).slideDown(function () {
                if ($.isFunction(onComplete)) {
                    onComplete();
                }
            });
            panel.visible = true;
            this.bindPanelMenuItems(panel);
        };
        Menu.prototype.positionPanel = function (panel) {
            var panelId = "#" + panel.id;
            $(panelId).css("position", "absolute");
            var parentMenuItemId = panel.parentId;
            var parent = this.findMenuItemById(parentMenuItemId);
            var top = null;
            var left = null;
            if (panel.level === 1) {
                top = parent.box.coords.top + parent.box.height;
                left = parent.box.coords.left;
            }
            else if (panel.level === 2) {
                top = parent.box.coords.top;
                left = parent.box.coords.left + parent.box.width;
            }
            $(panelId).css("left", left);
            $(panelId).css("top", top);
        };
        Menu.prototype.findMenuItemById = function (id) {
            var rOuter = null;
            $.each(this.panels, function (i, panel) {
                var rInner = null;
                $.each(panel.menuItems, function (j, mi) {
                    if (mi.id === id) {
                        rInner = mi;
                        return false;
                    }
                });
                rOuter = rInner;
                if (rOuter !== null) {
                    return false;
                }
            });
            return rOuter;
        };
        Menu.prototype.discoverStartingDimensions = function () {
            var _this = this;
            setTimeout(function () {
                _this.menuBox = _this.getBox("#" + _this.menuId);
                var panel = _this.findPanelByParentId(_this.menuId);
                _this.discoverDimensions(panel);
            }, 500);
            ;
        };
        Menu.prototype.getBox = function (tagId) {
            var menuLocation = $("#" + this.menuId).offset();
            var location = $(tagId).offset();
            if (typeof location != "undefined") {
                return {
                    coords: { left: location.left - menuLocation.left, top: location.top - menuLocation.top },
                    container_offset: null,
                    mwidth: $(tagId).outerWidth(true),
                    mheight: $(tagId).outerHeight(true),
                    width: $(tagId).outerWidth(false),
                    height: $(tagId).outerHeight(false)
                };
            }
            else {
                return null;
            }
        };
        Menu.prototype.discoverDimensions = function (panel) {
            var _this = this;
            var parentBox = null;
            if (panel.level === 0) {
                parentBox = this.menuBox;
            }
            else {
                var parentMenuItemId = panel.parentId;
                var parent = this.findMenuItemById(parentMenuItemId);
                parentBox = parent.box;
            }
            var panelId = "#" + panel.id;
            panel.box = this.getBox(panelId);
            //_setContainerOffset(parentBox, panel.box);
            $.each(panel.menuItems, function (i, mi) {
                var tagId = "#" + mi.id;
                mi.box = _this.getBox(tagId);
                // _setContainerOffset(panel.box, mi.box);
            });
        };
        Menu.prototype.bindPanelMenuItems = function (panel) {
            var _this = this;
            var menuId = "#" + this.menuId;
            var panelId = "#" + panel.id;
            $(menuId).find(panelId).find(".menu-item.has-submenus").on("click", function (e) {
                //var e_targetId = $(e.target).attr("id");
                var id = $(e.target).attr("id"); // $(this).attr("id");
                //$U.Debug("click this.id {0}, e.target.id {1}", id, e_targetId);
                if ($(e.target)[0].tagName === "A" && $(e.target).attr("href") === "#") {
                    e.preventDefault();
                }
                e.stopPropagation();
                $("#" + id).siblings().each(function (i, sib) {
                    var sibId = $(sib).attr("id");
                    var sib_subPanel = _this.findPanelByParentId(sibId);
                    if (sib_subPanel !== null) {
                        _this.hidePanel(sib_subPanel);
                    }
                });
                var subPanel = _this.findPanelByParentId(id);
                if (subPanel.visible) {
                    _this.hidePanel(subPanel);
                }
                else {
                    _this.showPanel(subPanel);
                    _this.discoverDimensions(subPanel);
                    _this.setPositioningAttributes(subPanel);
                }
            });
        };
        Menu.prototype.hidePanel = function (panel) {
            var _this = this;
            if (panel.visible) {
                var tagId = "#" + panel.id;
                $.each(panel.menuItems, function (i, mi) {
                    var subPanel = _this.findPanelByParentId(mi.id);
                    if (subPanel !== null) {
                        _this.hidePanel(subPanel);
                    }
                });
                this.unbindPanelMenuItems(panel);
                panel.visible = false;
                $(tagId).slideUp();
            }
        };
        Menu.prototype.setPositioningAttributes = function (panel) {
            var _this = this;
            var panelId = "#" + panel.id;
            this.setAttributes(panelId, panel.box);
            $.each(panel.menuItems, function (i, mi) {
                var tagId = "#" + mi.id;
                _this.setAttributes(tagId, mi.box);
            });
        };
        Menu.prototype.setAttributes = function (tagId, box) {
            $(tagId).attr("data-box", this.box2String(tagId, box));
        };
        Menu.prototype.box2String = function (tagId, box) {
            return "(" + box.coords.left + ", " + box.coords.top + ") [" + box.width + "w " + box.height + "h] [[" + box.mwidth + "w " + box.mheight + "h]]";
        };
        Menu.prototype.unbindPanelMenuItems = function (panel) {
            var menuId = "#" + this.menuId;
            var panelId = "#" + panel.id;
            $(menuId).find(panelId).find(".menu-item.has-submenus").off();
        };
        Menu.prototype.closeOpenPanels = function () {
            var _this = this;
            $.each(this.panels, function (i, panel) {
                if (panel.level > 0) {
                    _this.hidePanel(panel);
                }
            });
        };
        Menu.instances = [];
        return Menu;
    }());
    fastnet.Menu = Menu;
})(fastnet || (fastnet = {}));
//# sourceMappingURL=menu.js.map