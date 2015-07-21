var Menu = (function ($) {
    var $U = $.fastnet$utilities;
    var instances = [];
    function createInstance(opts) {
        var _instance = instances.length;
        var menuData = { container: null, menuId: "", menuBox: null, panels: [] , parkedHTML: null};
        var menuSelector = null;
        var options = $.extend({ menuId: "" + _instance, menuClasses: null, direction: "horizontal" }, opts);
        function _getId() {
            return menuData.menuId;
        }
        function _parkMenu() {
            menuData.parkedHTML = $("#" + menuData.menuId)[0].outerHTML;
            $("#" + menuData.menuId).remove();
            //$(menuData.container).find(".menu-location").empty();
        }
        function _unparkMenu() {
            if ($(menuData.container).find(".menu-location").length > 0) {
                $(menuData.container).find(".menu-location").append(menuData.parkedHTML);
            } else {
                $(menuData.container).append($(menuData.parkedHTML));
            }
            menuData.parkedHTML = null;
        }
        function _positionPanel(panel) {
            var panelId = "#" + panel.id;
            $(panelId).css("position", "absolute");
            var parentMenuItemId = panel.parentId;
            var parent = _findMenuItemById(parentMenuItemId);
            var top = null;
            var left = null;
            if (panel.level === 1) {
                top = parent.box.coords.top + parent.box.height;
                left = parent.box.coords.left;

            } else if (panel.level === 2) {
                top = parent.box.coords.top;
                left = parent.box.coords.left + parent.box.width;
            }
            $(panelId).css("left", left);
            $(panelId).css("top", top);
        }
        function _unbindPanelMenuItems(panel) {
            var menuId = "#" + menuData.menuId;
            var panelId = "#" + panel.id;
            $(menuId).find(panelId).find(".menu-item.has-submenus").off();
        }
        function _bindPanelMenuItems(panel) {
            var menuId = "#" + menuData.menuId;
            var panelId = "#" + panel.id;
            $(menuId).find(panelId).find(".menu-item.has-submenus").on("click", function (e) {
                var e_targetId = $(e.target).attr("id");
                var id = $(this).attr("id");
                //$U.Debug("click this.id {0}, e.target.id {1}", id, e_targetId);
                if ($(e.target).tagName === "A" && $(e.target).attr("href") === "#") {
                    e.preventDefault();
                }
                e.stopPropagation();
                
                $("#" + id).siblings().each(function (i, sib) {
                    var sibId = $(sib).attr("id");
                    var sib_subPanel = _findPanelByParentId(sibId);
                    if (sib_subPanel !== null) {
                        _hidePanel(sib_subPanel);
                    }
                });
                var subPanel = _findPanelByParentId(id);

                if (subPanel.visible) {
                    _hidePanel(subPanel);
                } else {
                    _showPanel(subPanel);
                    _discoverDimensions(subPanel);
                    _setPositioningAttributes(subPanel);
                }
            })
        }
        function _setAttributes(tagId, box) {
            $(tagId).attr("data-box", _box2String(tagId, box));
        }
        function _setPositioningAttributes(panel) {

            var panelId = "#" + panel.id;
            _setAttributes(panelId, panel.box);
            $.each(panel.menuItems, function (i, mi) {
                var tagId = "#" + mi.id;
                _setAttributes(tagId, mi.box);
            });
        }
        function _box2String(tagId, box) {
            return $U.Format("({0}, {1}) [{2}w {3}h] [[{4}w {5}h]]",
                box.coords.left, box.coords.top,
                box.width, box.height,
                box.mwidth, box.mheight
                );
        }
        function _getBox(tagId) {
            var menuLocation = $("#" + menuData.menuId).offset();
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
        }
        function _discoverDimensions(panel) {
            var parentBox = null;
            if (panel.level === 0) {
                parentBox = menuData.menuBox;
            } else {
                var parentMenuItemId = panel.parentId;
                var parent = _findMenuItemById(parentMenuItemId);
                parentBox = parent.box;
            }
            var panelId = "#" + panel.id;
            panel.box = _getBox(panelId);
            //_setContainerOffset(parentBox, panel.box);
            $.each(panel.menuItems, function (i, mi) {
                var tagId = "#" + mi.id;
                mi.box = _getBox(tagId);
               // _setContainerOffset(panel.box, mi.box);
            });
        }
        function _showCurrentBox(tagId) {
            return _box2String(tagId, _getBox(tagId));
        }
        function _closeOpenPanels() {
            $.each(menuData.panels, function (i, panel) {
                if (panel.level > 0) {
                    _hidePanel(panel);
                }
            });
        }
        function _hidePanel(panel) {
            if (panel.visible) {
                var tagId = "#" + panel.id;
                $.each(panel.menuItems, function (i, mi) {
                    var subPanel = _findPanelByParentId(mi.id);
                    if (subPanel !== null) {
                        _hidePanel(subPanel);
                    }
                });
                _unbindPanelMenuItems(panel);
                panel.visible = false;
                $(tagId).slideUp();
            }
        }
        function _showPanel(panel, onComplete) {
            var tagId = "#" + panel.id;
            if (panel.level === 0) {
                switch (options.direction) {
                    case "horizontal":
                        $(tagId).find(".menu-item").css("display", "inline-block");
                        break;
                    case "vertical":
                        $(tagId).find(".menu-item").css("display", "block");
                        break;
                }
            }

            if (options.direction === "horizontal" && panel.level > 0) {
                _positionPanel(panel);
            }
            $(tagId).slideDown(function () {
                if($.isFunction(onComplete)) {
                    onComplete();
                }
            });
            panel.visible = true;
            _bindPanelMenuItems(panel);
        }
        function _findPanelById(id) {
            var result = null;
            $.each(menuData.panels, function (i, panel) {
                if (panel.id === id) {
                    result = panel;
                    return false;
                }
            });
            return result;
        }
        function _findMenuItemById(id) {
            var rOuter = null;
            $.each(menuData.panels, function (i, panel) {
                var rInner = null;
                $.each(panel.menuItems, function (j, mi) {
                    if (mi.id === id) {
                        rInner = mi;
                        return false;
                    }
                })
                rOuter = rInner;
                if (rOuter !== null) {
                    return false;
                }
            });
            return rOuter;
        }
        function _findPanelByParentId(parentId) {
            var result = null;
            $.each(menuData.panels, function (i, panel) {
                if (panel.parentId === parentId) {
                    result = panel;
                    return false;
                }
            });
            return result;
        }
        function _parseMenuData(containerId, md) {
            var pn = 0;
            var min = 0;
            function _parsePanel(parentId, level, list) {
                var panelId = $U.Format("{0}-mp-{1}", containerId, pn++);
                var panel = { id: panelId, parentId: parentId, level: level, visible: false, menuItems: [] };
                $.each(list, function (i, item) {
                    // item.Index, item.Text, item.Url, item.Submenus
                    // each array of these is in a panel                    
                    var id = $U.Format("{0}-mi-{1}", panelId, min++);
                    panel.menuItems.push({
                        panelId: panelId,
                        id: id,
                        index: item.Index,
                        text: item.Text,
                        url: item.Url,
                        //menuItemTotal: item.Submenus.length ,                        
                    });
                    if (item.Submenus.length > 0) {
                        _parsePanel(id, level + 1, item.Submenus);
                    }
                });
                menuData.panels.push(panel);
                //$U.Debug("Panel {0}, child of {1}, level {2}, {3} menuItems", panel.id, panel.parentId, level, panel.menuItems.length)
            }
            _parsePanel(containerId, 0, md);
        }
        function _createMenuHtml(mid) {
            var menuHtml = $($U.Format("<div id='{0}' class='fastnet-menu {1}'></div>", mid, options.direction));
            if (options.menuClasses !== null && options.menuClasses.length > 0) {
                $.each(options.menuClasses, function (i, mc) {
                    menuHtml.addClass(mc);
                });
            }
            $.each(menuData.panels, function (i, panel) {
                var panelHtml = $($U.Format("<div id='{0}' class='menu-item-panel level-{1}' data-parent='{2}' ></div>",
                    panel.id, panel.level, panel.parentId));
                panel.menuItems.sort(function (first, second) {
                    if (first.index === second.index) {
                        return 0;
                    } else if (first.index < second.index) {
                        return -1;
                    } else {
                        return 1;
                    }
                });
                $.each(panel.menuItems, function (j, mi) {
                    var menuItemHtml = $($U.Format("<div id='{0}' class='menu-item'></div>", mi.id));
                    if (mi.url === null) {
                        menuItemHtml.addClass("has-submenus");
                        menuItemHtml.append($($U.Format("<a href='#'><span>{0}</span></a>", mi.text)));
                        if (options.direction === "horizontal" && panel.level > 0) {
                            menuItemHtml.append($("<span class='fa fa-caret-right indicator'></span>"));
                        } else {
                            menuItemHtml.append($("<span class='fa fa-caret-down indicator'></span>"));
                        }
                    } else {
                        menuItemHtml.append($($U.Format("<a href='{0}'><span>{1}</span></a>", mi.url, mi.text)));
                    }
                    panelHtml.append(menuItemHtml);
                });
                menuHtml.append(panelHtml);
            });
            if (options.direction === "vertical") {
                $(menuHtml).find(".menu-item-panel:not(.level-0)").each(function (i, mp) {
                    var parentId = $(mp).attr("data-parent");
                    $(menuHtml).find("#" + parentId).append(mp);
                });
            }
            $(menuHtml).find(".menu-item-panel").hide();
            return menuHtml;
        }
        function _discoverStartingDimensions() {
            // allow rendering to complete
            setTimeout(function () {
                menuData.menuBox = _getBox("#" + menuData.menuId);
                //_setAttributes("#" + menuData.menuId, menuData.menuBox);

                var panel = _findPanelByParentId(menuData.menuId);
                _discoverDimensions(panel);
                //_setPositioningAttributes(panel);
            }, 500);
        }
        function _createMenu(selector, md, opts) {
            // selector = the  menu html will be appended to this selector
            // menudata = an md[] where md is an object of the form
            //   { Index: (number), Text: (menu label), Url: (menu hyperlink), Submenus: (an md[]) }
            var panelNumber = 0;
            var menuItemNumber = 0;
            $.extend(options, opts);
            menuData.container = selector;// typically a panel selector like .MenuPanel
            menuData.menuId = $U.Format("menu-{0}", options.menuId.toLowerCase());
            _parseMenuData(menuData.menuId, md);
            var menu2Html = _createMenuHtml(menuData.menuId);
            if ($(menuData.container).find(".menu-location").length > 0) {
                $(menuData.container).find(".menu-location").append(menu2Html);
            } else {
                $(menuData.container).append($(menu2Html));
            }
            var rootPanel = _findPanelByParentId(menuData.menuId);
            _showPanel(rootPanel, function () { 
                _discoverStartingDimensions();
            });
            $("body").on("click", function () {
                _closeOpenPanels();
            });
            return menuData.menuId;
        }
        function _setHorizontalPositioning() {
            var l2Panels = $(menuSelector).find(".menu-item-panel.level-2");
            $.each(l2Panels, function (i, lp) {
                var parentItem = $(lp).parent();
                var width = parentItem[0].getBoundingClientRect().width;
                $(lp).css({ left: width });
            });
            var l1Panels = $(menuSelector).find(".menu-item-panel.level-1");
            $.each(l1Panels, function (i, lp) {
                var parentItem = $(lp).parent();
                var leftMarginWidth = parseInt($(parentItem).css("margin-left"));
                var leftBorderWidth = parseInt($(parentItem).css("border-left-width"));
                var bottomMarginWidth = parseInt($(parentItem).css("margin-bottom"));
                var bottomBorderWidth = parseInt($(parentItem).css("border-bottom-width"));
                var height = $(parentItem).height();
                $(lp).css({ left: -(leftMarginWidth + leftBorderWidth), top: height + bottomBorderWidth + bottomMarginWidth });
            });
        }
        function _traceInstance() {
            //$U.Debug("Menu: created instance {0}", _instance);
        }
        return {
            traceInstance: _traceInstance,
            create: _createMenu,
            //logDetails: _logPrintSizeAndPosition,
            showBox: _showCurrentBox,
            park: _parkMenu,
            restore: _unparkMenu,
            menuId: menuData.menuId,
            getId : _getId
        };
    }
    function getInstance(opts) {
        var instance = new createInstance(opts);
        instances.push(instance);
        return instance;
    }
    return {
        get: getInstance
    };
})(jQuery);