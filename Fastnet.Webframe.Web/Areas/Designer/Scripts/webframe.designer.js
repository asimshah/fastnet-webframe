(function ($) {
    var $T;
    var $U;
    var $F;
    $.webframe$designer = {
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
            $F = $.fastnet$forms;
            //alert("designer script loaded");
        },
        //StartLayout: function () {
        //    alert("Start layout");
        //    $T.Home.Start();
        //},
        Layout: {
            aceEditor: null,
            currentPanel: null,
            Home: function () {
                var $this = this;
                var options = { ClientAction: { IsModal: false } };
                $.when($F.LoadForm($this, "Layout Designer", "designer/template/form/layouthome", "designer-form layout-home", options)
                    ).then(function () {
                        var form = $F.GetForm();
                        $(form).find(".panel-diagram .select-panel").parent().on("mouseenter", function () {
                            var cmd = $(this).find(".btn").attr("data-cmd");
                            var desc = "";
                            switch (cmd) {
                                case "site-panel":
                                    desc = "The Site Panel contains the entire layout.";
                                    break;
                                case "banner-panel":
                                    desc = "The Banner Panel is fixed at the top - its content is determined by the page showing in the Centre Panel.";
                                    break;
                                case "menu-panel":
                                    desc = "The Menu Panel contains the menu buttons.";
                                    break;
                                case "content-panel":
                                    desc = "The Content Panel contains the three content panels, left, centre and right.";
                                    break;
                                case "left-panel":
                                    desc = "The Left Panel is fixed on the left hand side - its content is determined by the page showing in the Centre Panel.";
                                    break;
                                case "centre-panel":
                                    desc = "The Centre Panel shows the content of the current page.";
                                    break;
                                case "right-panel":
                                    desc = "The Right Panel is fixed on the right hand side - its content is determined by the page showing in the Centre Panel.";
                                    break;
                            }
                            $(".panel-description").html(desc);
                            $(".panel-diagram ." + cmd).addClass("highlit");
                        }).on("mouseleave", function () {
                            var cmd = $(this).find(".btn").attr("data-cmd");
                            $(".panel-diagram ." + cmd).removeClass("highlit");
                            $(".panel-description").html("");
                        });
                        $F.Bind({ afterItemValidation: null, onCommand: $this.OnCommand });
                        $F.Show();
                });
            },
            Edit: function(panel, displayName) {
                var $this = this;
                $this.currentPanel = panel;
                var options = { ClientAction: { IsModal: false, Panel: displayName } };
                var url = $U.Format("designer/layouteditor/get/{0}", panel);
                $.when($U.AjaxGet({ url: url }, true)
                    ).done(function (panelInfo) {
                        $U.Debug("back from {0}", url);
                        $.extend(options.ClientAction, panelInfo);
                        $.when($F.LoadForm($this, "CSS Editor", "designer/template/form/layoutcsseditor", "designer-form layout-less-editor", options)
                            ).then(function () {
                                $(".default-css pre").text(panelInfo.DefaultCSS);
                                $T.aceEditor = ace.edit("less-editor");
                                $T.aceEditor.setTheme("ace/theme/cobalt");
                                $T.aceEditor.setValue(panelInfo.CustomLess);
                                $T.aceEditor.getSession().setMode("ace/mode/less");
                                $T.aceEditor.on("change", function () {
                                    $F.GetForm().find(".message").text("");
                                    $F.EnableCommand("save-css");
                                });
                                $F.Bind({ afterItemValidation: null, onCommand: $this.OnCommand });
                                $F.DisableCommand("save-css");
                                $F.Show();
                            });
                    });
            },
            OnCommand: function (ctx, cmd) {
                $U.Debug("OnCommand");
                switch (cmd) {
                    case "save-css":
                        var lessText = $T.aceEditor.getValue();
                        ctx.SaveLess(ctx, lessText);
                        break;
                    case "site-panel":
                        $F.Close();
                        $T.Layout.Edit(cmd, "Site Panel");
                        break;
                    case "banner-panel":
                        $F.Close();
                        $T.Layout.Edit(cmd, "Banner Panel");
                        break;
                    case "menu-panel":
                        $F.Close();
                        $T.Layout.Edit(cmd, "Menu Panel");
                        break;
                    case "content-panel":
                        $F.Close();
                        $T.Layout.Edit(cmd, "Content Panel");
                        break;
                    case "left-panel":
                        $F.Close();
                        $T.Layout.Edit(cmd, "Left Panel");
                        break;
                    case "centre-panel":
                        $F.Close();
                        $T.Layout.Edit(cmd, "Centre Panel");
                        break;
                    case "right-panel":
                        $F.Close();
                        $T.Layout.Edit(cmd, "Right Panel");
                        break;
                    default:
                        $U.Debug("designer command {0}", cmd);
                        break;
                }
            },
            SaveLess: function (ctx, lessText) {
                $U.Debug("SaveLess");
                var panel = ctx.currentPanel;
                less.render(lessText, function (e, output) {
                    var url = "designer/layouteditor/savepanelcss";
                    var postData = { Panel: panel, CSSText: output.css, LessText: lessText };
                    $.when($U.AjaxPost({ url: url, data: postData })
                        ).then(function () {
                            $F.GetForm().find(".message").text("Changes saved");
                            $F.DisableCommand("save-css");
                        });
                });
            }
        }
    };
    $(function () {
        $.webframe$designer.Init();
    });
})(jQuery);