﻿(function ($) {
    var $T;
    var $U;
    var $F;
    $.webframe$designer = {
        Init: function () {
            $T = this;
            $U = $.fastnet$utilities;
            //$F = $.fastnet$forms;
            //$.fastnet$utilities.EnableClientSideLog();
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
                //var ldf = new $.fastnet$forms.CreateForm("designer/template/form/layouthome", {
                var ldf = new $.fastnet$forms.CreateForm("template/get/designer-forms/layouthome", {
                    Title: "Layout Designer",
                    IsModal: false,
                    OnCommand: this.OnCommand
                });
                ldf.show(function () {
                    ldf.find(".panel-diagram .select-panel").parent().on("mouseenter", function () {
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
                });
                //var $this = this;
                //var options = { ClientAction: { IsModal: false } };
                //$.when($F.LoadForm($this, "Layout Designer", "designer/template/form/layouthome", "designer-form layout-home", options)
                //    ).then(function () {
                //        var form = $F.GetForm();
                //        $(form).find(".panel-diagram .select-panel").parent().on("mouseenter", function () {
                //            var cmd = $(this).find(".btn").attr("data-cmd");
                //            var desc = "";
                //            switch (cmd) {
                //                case "site-panel":
                //                    desc = "The Site Panel contains the entire layout.";
                //                    break;
                //                case "banner-panel":
                //                    desc = "The Banner Panel is fixed at the top - its content is determined by the page showing in the Centre Panel.";
                //                    break;
                //                case "menu-panel":
                //                    desc = "The Menu Panel contains the menu buttons.";
                //                    break;
                //                case "content-panel":
                //                    desc = "The Content Panel contains the three content panels, left, centre and right.";
                //                    break;
                //                case "left-panel":
                //                    desc = "The Left Panel is fixed on the left hand side - its content is determined by the page showing in the Centre Panel.";
                //                    break;
                //                case "centre-panel":
                //                    desc = "The Centre Panel shows the content of the current page.";
                //                    break;
                //                case "right-panel":
                //                    desc = "The Right Panel is fixed on the right hand side - its content is determined by the page showing in the Centre Panel.";
                //                    break;
                //            }
                //            $(".panel-description").html(desc);
                //            $(".panel-diagram ." + cmd).addClass("highlit");
                //        }).on("mouseleave", function () {
                //            var cmd = $(this).find(".btn").attr("data-cmd");
                //            $(".panel-diagram ." + cmd).removeClass("highlit");
                //            $(".panel-description").html("");
                //        });
                //        $F.Bind({ afterItemValidation: null, onCommand: $this.OnCommand });
                //        $F.Show();
                //});
            },
            Edit: function(panel) {
                var $this = this;
                //var displayname = null;
                $this.currentPanel = panel;
                var url = $U.Format("designer/layouteditor/get/{0}", panel);
                $.when($U.AjaxGet({ url: url }, true)
                    ).done(function (panelInfo) {
                        $U.Debug("back from {0}", url);
                        //var cef = new $.fastnet$forms.CreateForm("designer/template/form/layoutcsseditor", {
                        var cef = new $.fastnet$forms.CreateForm("template/get/designer-forms/layoutcsseditor", {
                            Title: "CSS Editor",
                            IsModal: false,
                            OnCommand: function (f, cmd) {
                                switch (cmd) {
                                    case "save-css":
                                        var lessText = $T.aceEditor.getValue();
                                        $T.Layout.SaveLess(f, panel, lessText);
                                        break;
                                }
                            }
                        }, panelInfo);
                        cef.disableCommand("save-css");
                        cef.show(function () {
                            $(".default-css pre").text(panelInfo.DefaultCSS);
                            $T.aceEditor = ace.edit("less-editor");
                            ace.config.set('basePath', '/areas/designer/scripts/ace editor/src');
                            $T.aceEditor.setTheme("ace/theme/cobalt");
                            $T.aceEditor.setValue(panelInfo.CustomLess);
                            $T.aceEditor.getSession().setMode("ace/mode/less");
                            $T.aceEditor.on("change", function () {
                                cef.find(".message").text("");
                                cef.enableCommand("save-css");
                            });
                        });
                    });
            },
            OnCommand: function (f, cmd) {
                //$U.Debug("OnCommand");
                switch (cmd) {
                    //case "save-css":
                    //    var lessText = $T.aceEditor.getValue();
                    //    $T.Layout.SaveLess(ctx, lessText);
                    //    break;
                    case "site-panel":
                    case "banner-panel":
                    case "menu-panel":
                    case "content-panel":
                    case "left-panel":
                    case "centre-panel":
                    case "right-panel":
                        f.close();
                        $T.Layout.Edit(cmd);
                        break;
                    default:
                        $U.Debug("designer command {0}", cmd);
                        break;
                }
            },
            SaveLess: function (f, panel, lessText) {
                $U.Debug("SaveLess");
                //debugger;
                //var panel = $T.Layout.currentPanel;
                less.render(lessText, function (e, output) {
                    var url = "designer/layouteditor/savepanelcss";
                    var postData = { Panel: panel, CSSText: output.css, LessText: lessText };
                    $.when($U.AjaxPost({ url: url, data: postData })
                        ).then(function () {
                            f.find(".message").text("Changes saved");
                            f.disableCommand("save-css");
                        });
                });
            }
        }
    };
    $(function () {
        $.webframe$designer.Init();
    });
})(jQuery);