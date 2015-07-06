var Menu = (function ($) {
    var $U = $.fastnet$utilities;
    var instances = [];;
    function createInstance(opts) {
        var _instance = instances.length;
        var menuSelector = null;
        var options = $.extend({menuId: "" + _instance, direction: "horizontal"}, opts);
        function _createMenu(selector, menuData, opts) {
            // selector = the  menu html will be appended to this selector
            // menudata = an md[] where md is an object of the form
            //   { Index: (number), Text: (menu label), Url: (menu hyperlink), Submenus: (an md[]) }
            // this data is converted into a <ul><li><ul> type structure
            var panelNumber = 0;
            var menuItemNumber = 0;
            function _items2html(menuItems) {
                var text = "";
                $.each(menuItems, function (i, item) {
                    var hasSubmenus = item.Submenus.length > 0;
                    var t = null;
                    if (item.Url === null) {
                        t = $U.Format("<a href='#'><span>{0}</span></a>", item.Text);
                    } else {
                        t = $U.Format("<a href='{0}'>{1}</a>", item.Url, item.Text);
                    }
                    t += $U.Format("<span class='fa fa-caret-down indicator'></span>");
                    if (item.Submenus.length > 0) {
                        t += _items2html(item.Submenus);
                    }
                    text += $U.Format("<div id='mi-{1}' class='menu-item{2}'>{0}</div>", t,
                        menuItemNumber++, hasSubmenus ? " has-submenus" : "");
                });

                return $U.Format("<div id='mp-{2}' class='menu-item-panel level-{1}'>{0}</div>", text, menuItems[0].Level, panelNumber++);
            }
            $.extend(options, opts);
            var menuHtml = _items2html(menuData);
            var id = $U.Format("menu-{0}", options.menuId.toLowerCase());
            var html = $("<div class='fastnet-menu'></div>").attr("id", id).append(menuHtml);
            $(selector).append($(html));
            $(selector).find(".fastnet-menu").addClass(options.direction);
            menuSelector = "#" + id;
            if (options.direction === "horizontal") {
                //_setHorizontalPositioning();
            }
            _bindMenus();
            return id;
        }
        function _bindMenus() {
            $(menuSelector).find(".menu-item.has-submenus").on("click", function () {
                var id = $(this).attr("id");
                $U.Debug("menu-item id {0} clicked", id);
                $(this).find("> .menu-item-panel").show();
            });
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
                $(lp).css({ left: -(leftMarginWidth + leftBorderWidth), top: height + bottomBorderWidth + bottomMarginWidth});
            });
        }
        function _traceInstance() {
            $U.Debug("Menu: created instance {0}", _instance);
        }
        function _logPrintSizeAndPosition(menuId) {
            function recordDetails(element) {
                var el = $(element);
                var id = el.attr("id");
                var label = "";
                if (el.hasClass("menu-item")) {
                    label = el.find("> a").text();
                }
                // jquery outerWidth(true) and outerheight(true) includes margins (because parameter is true)
                // but includes padding and border
                var h = el.outerHeight(true);
                var w = el.outerWidth(true);
                //getBoundingClientRect excludes margin
                // but includes padding and border
                var rect = el[0].getBoundingClientRect();
                $U.Debug("Element {0} \"{5}\": width: {1}, height: {2} (also w {3} h {4})", id, w, h, rect.width, rect.height, label);
            }
            var selector = "#" + menuId;
            recordDetails(selector);
            $(selector).find("div").each(function (i, item) {
                recordDetails(item);
            });
            //debugger;
        }
        return {
            traceInstance: _traceInstance,
            create: _createMenu,
            logDetails: _logPrintSizeAndPosition
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