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
            //$cm.AddMenuItem("Open Editor", "open-editor", $T.OnContextMenu, {})
            //$cm.AddMenuItem("Close Editor", "close-editor", $T.OnContextMenu, {})
            $cm.AddMenuItem("Insert Link ...", "insert-link", $T.OnContextMenu, {})
            $cm.AddMenuItem("Insert Image ...", "insert-image", $T.OnContextMenu, {})
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
                if (typeof cmd === "undefined" || cmd === false) {
                    $T.Start();
                }
            });
            $(".edit-panel").removeClass('hide').addClass("closed");//.height(8);
            $(".edit-toolbar button").on("click", function () {
                var cmd = $(this).attr("data-cmd");
                $T.OnCommand(cmd, null);
            });
        },
        OnBeforeContextMenuOpen: function (src) {
            var panel = $(src).closest(".editable-content");
            if (typeof panel !== "undefined" && panel !== null) {
                //if ($(panel).hasClass("editor-open")) {
                //    $T.cm.DisableMenuItem("open-editor");
                //    $T.cm.EnableMenuItem("close-editor");
                //} else {
                //    $T.cm.DisableMenuItem("close-editor");
                //    $T.cm.EnableMenuItem("open-editor");
                //}
            }
        },
        OnContextMenu: function (src, index, cmd, data) {
            switch (cmd) {
                //case "open-editor":
                //case "close-editor":
                default:
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
                    //default:
                    //    alert("context menu cmd = " + cmd);
                    //    break;
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
            $T.StartEditors();
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
                    //case "open-editor":
                    //case "close-editor":
                    //    //var panelName = $T.getPanelName(data.panel);
                    //    //alert($U.Format("Command {0} for {1}", cmd, panelName));
                    //    //$T.OpenEditor(panelName);
                    //    break;
                case "insert-link":
                    $T.InsertLink.Start();
                    break;
                case "insert-image":
                    //break;
                default:
                    alert("This feature is not implemented");
                    break;
            }
        },
        CloseEditor: function (panelSelector) {

        },
        StartEditors: function () {
            $T.OpenEditor("BannerPanel");
            $T.OpenEditor("LeftPanel");
            $T.OpenEditor("CentrePanel");
            $T.OpenEditor("RightPanel");
            setTimeout(function () {
                var ed = tinymce.editors[$(".CentrePanel").attr("id")];
                ed.execCommand("mceAddControl", false, $(".CentrePanel"));
            }, 500);
        },
        OpenEditor: function (panelName) {
            var selector = "." + panelName;
            tinymce.init({
                selector: selector,
                browser_spellcheck: true,
                plugins: "textcolor colorpicker visualblocks table link image",
                menubar: false,
                inline: true,
                toolbar_items_size: 'small',
                toolbar: ["undo redo | styleselect | fontselect fontsizeselect | alignleft aligncenter alignright | visualblocks",
                          "bold italic | forecolor backcolor | bullist numlist outdent indent | table | link image"],
                //fixed_toolbar_container: "#mceToolBar"//,
            });
        },
        InsertLink: {
            currentEditor: null,
            Start: function () {
                var $this = this;
                $this.currentEditor = tinymce.EditorManager.activeEditor;
                var text = $this.currentEditor.selection.getContent({ format: 'html' });
                $.when($F.LoadForm($this, "Insert Link", "template/form/inserthyperlink", "editor-dialog insert-link", { ClientAction: { IsModal: true } })
                    ).then(function () {
                        var form = $F.GetForm();
                        $(form).find("#linktext").val(text);
                        $F.AddIsRequiredValidation("linkurl", "Link url is required");
                        $F.AddIsRequiredValidation("linktext", "Some link text is required");
                        $F.Bind({ afterItemValidation: $this.AfterItemValidation, onCommand: $this.OnCommand });
                        $F.DisableCommand("insertlink");
                        $F.Show();
                    });
            },
            AfterItemValidation: function (ctx, item, totalItems, totalWithState, totalErrors) {
                if (totalErrors > 0) {
                    $F.DisableCommand("insertlink");
                } else {
                    $F.EnableCommand("insertlink");
                }
            },
            OnCommand: function (ctx, cmd) {
                switch (cmd) {
                    case "insertlink":
                        var form = $F.GetForm();
                        var url = $(form).find("#linkurl").val();
                        var linktext = $(form).find("#linktext").val();
                        var content = $U.Format('<a href="{0}">{1}</a>', url, linktext);
                        $U.Debug(content);
                        //ctx.currentEditor.insertContent(content);
                        ctx.currentEditor.execCommand("mceReplaceContent", 0, content);
                        break;
                }
            },
            
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