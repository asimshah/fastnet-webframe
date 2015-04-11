(function ($) {
    var $T;
    var $U;
    $.core$editor = {
        cm: null,
        isOpen: false,
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
            //$U.Debug("");
            $T.cm = $.fastnet$contextmenu.GetContextMenu();
            $cm.AddMenuItem("Open Editor", "open-editor", $T.OnContextMenu, {})
            $cm.AddMenuItem("Close Editor", "close-editor", $T.OnContextMenu, {})
            $cm.BeforeOpen = $T.OnBeforeContextMenuOpen;
            //$cm.BeforeOpen = function (src) {
            //    var html = src.outerHTML;
            //    $U.Debug(html);
            //    //$cm.AddMenuItem("test", "test", $T.OnContextMenu, {})
            //    //var item = $cm.AddMenuItem("test2", "test2", $T.OnContextMenu, {})
            //    //$cm.DisableMenuItem(item);
            //};
            $(".edit-panel").on("click", function (e) {
                var cmd = $(e.target).attr("data-cmd");
                if(typeof cmd === "undefined" || cmd === false ) {
                    $T.Start();
                }
            });
            $(".edit-panel").removeClass('hide').addClass("closed");//.height(8);
            $(".edit-toolbar button").on("click", function () {
                var cmd = $(this).attr("data-cmd");
                $T.OnCommand(cmd, null);
            });
        },
        OnBeforeContextMenuOpen: function(src) {
            var panel = $(src).closest(".editable-content");
            if (typeof panel !== "undefined" && panel !== null) {
                if ($(panel).hasClass("editor-open")) {
                    $T.cm.DisableMenuItem("open-editor");
                    $T.cm.EnableMenuItem("close-editor");
                } else {
                    $T.cm.DisableMenuItem("close-editor");
                    $T.cm.EnableMenuItem("open-editor");
                }
            }
        },
        OnContextMenu : function(src, index, cmd, data) {
            switch (cmd) {
                case "open-editor":
                case "close-editor":
                    var panel = $(src).closest(".editable-content");
                    $T.OnCommand(cmd, { panel: panel });
                    break;
                case "test":
                    if ($T.cm.IsMenuItemDisabled(1)) {
                        $T.cm.EnableMenuItem(1);
                    } else {
                        $T.cm.DisableMenuItem(1);
                    }
                    break;
                default:
                    alert("context menu cmd = " + cmd);
                    break;
            }
        },
        Start: function () {
            if (!$T.isOpen) {
                $(".edit-toolbar").addClass("opaque");
                $(".edit-panel").removeClass("closed").addClass("open");//.height(32);
                $T.isOpen = true;
            }
            //$T.cm.AttachTo($(".edit-panel"));
            var eps = $(".editable-content");
            $.each(eps, function (index, ep) {
                $T.cm.AttachTo($(ep));
            });
            
        },
        Stop: function () {
            //$T.cm.DetachFrom($(".edit-panel"));
            var eps = $(".editable-content");
            $.each(eps, function (index, ep) {
                $T.cm.DetachFrom($(ep));
            });
            $T.isOpen = false;
            $(".edit-toolbar").removeClass("opaque");
            $(".edit-panel").removeClass("open").addClass("closed");//.height(32);
            //$(".edit-panel").height(8);
        },
        OnCommand: function (cmd, data) {
            switch (cmd) {
                case "exit-edit-mode":
                    $T.Stop();
                    break;
                case "open-editor":
                case "close-editor":
                    var panelName = $T.getPanelName(data.panel);
                    alert($U.Format("Command {0} for {1}", cmd, panelName));
                    break;
                default:
                    $U.Debug("core$editor cmd {0} not implemented", cmd);
                    break;
            }
        },
        CloseEditor: function (panelSelector) {

        },
        OpenEditor: function(panelSelector) {

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
        }
    };
    $(function () {
        $.core$editor.Init();
        //debugger;
    });
})(jQuery);