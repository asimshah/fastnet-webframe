(function ($) {
    // Version 1.0.0
    var $T;
    var $U;
    $.fastnet$contextmenu = {
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
        },
        GetContextMenu: function () {
            // add singleton context menu panel to body
            //$cm = $.apollo$widgets.ContextMenu;
            //$cm = $T.cm;
            var cmenu = $T.cm;
            if (cmenu.widget === null) {
                $(document)[0].addEventListener("click", cmenu.hide, false);
                cmenu.widget = $("<div class='context-menu-container'></div>");
                cmenu.widget[0].addEventListener("click", function (e) {
                    $(cmenu.widget).hide();
                }, false);
                cmenu.widget.appendTo("body").hide();
            }
            return cmenu;
        },
        cm: {
            menuItems: [],
            beforeOpen: null,
            hide: function () {
                //$cm = $T.cm;
                ($T.cm.widget).hide();
            },
            onContextmenu: function (e) {
                e.stopPropagation();
                e.preventDefault();
                //$cm = $T.cm;
                $(".context-menu-container").off().empty();
                $(".context-menu-container").hide();
                $T.cm.ClearMenuItems();
                if ($T.cm.BeforeOpen !== null) {
                    $T.cm.BeforeOpen($T.cm, e.srcElement);
                }
                var itemCount = 0;
                $.each($T.cm.menuItems, function (index, md) {
                    if (md.hide === false) {
                        var menuItem = md.menuItem;
                        var mi = $(menuItem).appendTo(".context-menu-container");
                        if (md.disabled) {
                            $(mi).addClass("disabled");
                        } else {
                            mi.on("click", function () {
                                md.action(e.srcElement, index, md.cmd, md.data);
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
            },
            widget: null,
            ClearMenuItems: function () {
                $T.cm.menuItems = [];
                $(".context-menu-container").off().empty();
            },
            AddMenuItem: function (text, cmd, action, data) {
                //$cm = this;
                var count = $T.cm.menuItems.length;
                var menuItem = $U.Format("<div class='context-menu-item' data-cmd='{1}' data-cm-index='{2}'><span >{0}</span></div>", text, cmd, count);
                var md = { menuItem: menuItem, cmd: cmd, action: action, data: data, separator: false, disabled: false, hide: false };
                $T.cm.menuItems.push(md);
                return count;
            },
            AddSeparator: function () {
                var count = $T.cm.menuItems.length;
                var sep = $U.Format("<div class='context-menu-item-separator' data-cm-index='{0}' ></div>", count);
                var md = { menuItem: sep, cmd: null, action: null, data: null, separator: true, disabled: false, hide: false };
                $T.cm.menuItems.push(md);
            },
            AttachTo: function (element) {
                $(element)[0].addEventListener("contextmenu", this.onContextmenu, false);
            },
            BeforeOpen: function (handler) {

                this.beforeOpen = handler;
            },
            DetachFrom: function (element) {
                this.beforeOpen = null;
                $(element)[0].removeEventListener("contextmenu", this.onContextmenu, false);
            },

            DisableMenuItem: function (index) {
                var item = $T.cm.findMenuItem(index);
                
                if (item.separator === false) {
                    item.disabled = true;
                    //var mi = item.menuItem;
                    //$(mi).off();
                    //$(mi).addClass("disabled");
                }
            },
            EnableMenuItem: function (index) {
                var item = $T.cm.findMenuItem(index);
                //var mi = item.menuItem;

                if (item.separator === false) {
                    item.disabled = false;
                    //$(mi).on("click", function () {
                    //    item.action(item.cmd, item.data);
                    //});
                    //$(mi).removeClass("disabled");
                }
            },
            Hide: function() {
                $(".context-menu-container").hide();
            },
            HideMenuItem: function (index) {
                var item = $T.cm.findMenuItem(index);
                item.hide = true;
            },
            IsMenuItemDisabled : function(index) {
                var item = $T.cm.findMenuItem(index);
                return item.disabled;
            },
            IsMenuItemHidden: function (index) {
                var item = $T.cm.findMenuItem(index);
                return item.hide;
            },
            ShowMenuItem: function (index) {
                var item = $T.cm.findMenuItem(index);
                item.hide = false;
            },
            findMenuItem: function (index) {
                var i;
                if (!$.isNumeric(index)) {
                    $.each($T.cm.menuItems, function (j, item) {
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
                return $T.cm.menuItems[i];
            },
            //Debug: null,
            //OnMenuItemClick: function (handler) {
            //    this.onMenuItemClick = handler;
            //},
        }
    };
    $(function () {
        $.fastnet$contextmenu.Init();
        //debugger;
    });
})(jQuery);