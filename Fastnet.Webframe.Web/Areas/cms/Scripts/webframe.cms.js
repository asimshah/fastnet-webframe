(function ($) {
    $.webframe$cms = function cms() {
        var folderTemplate =
"<div class='row' >" +
"<div class='cms-folder' data-folder-id='{{Id}}' >" +
"    <div class='col-xs-12' >" +
"        <div class='folder-name'><span class='fa fa-folder'></span><span>{{Path}}</span></div>" +
"    </div>" +
"</div>" +
"</div>";
        var pageTemplate =
"<div class='row' >" +
"<div class='folder-item {{Type}}' data-item-id='{{Id}}' >" +
"        <div class='picture' >" +
//"           <div class='iframe-container'><iframe src='{{FullUrl}}'></iframe></div>" +
"        </div>" +
"        <div class='name'><a href='{{Url}}'>{{Url}}</a>" +
"        </div>" +
"        <div class='title'>{{Name}}</div>" +
"        <div class='info'>{{Info}}</div>" +
"        <div class='modification-info'><div>{{LastModifiedOn}}</div><div>{{LastModifiedBy}}</div></div>" +
"</div>" +
"</div>";
        var imageTemplate =
"<div class='row' >" +
"<div class='folder-item {{Type}}' data-item-id='{{Id}}' >" +
"        <div class='picture' >" +
//"            <div><img src='{{Url}}'></img></div>" +
"        </div>" +
"        <div class='name'><div>{{Url}}</div></div>" +
"        <div class='title'>{{Name}}</div>" +
"        <div class='info'>{{Info}}</div>" +
"        <div class='modification-info'><div>{{LastModifiedOn}}</div><div>{{LastModifiedBy}}</div></div>" +
"</div>" +
"</div>";
        var docTemplate =
"<div class='row' >" +
"<div class='folder-item {{Type}}' data-item-id='{{Id}}' >" +
"        <div class='picture' ><div></div></div>" +
"        <div class='name'><div>{{Url}}</div></div>" +
"        <div class='title'>{{Name}}</div>" +
"        <div class='info'>{{Info}}</div>" +
"        <div class='modification-info'><div>{{LastModifiedOn}}</div><div>{{LastModifiedBy}}</div></div>" +
"</div>" +
"</div>";
        var $U = $.fastnet$utilities;
        function closeNavigationTable() {
            $(".toolbar button[data-cmd='back-to-cms']").show();
            $(".navigation-table").slideUp();
        }
        function openNavigationTable() {
            $(".toolbar button[data-cmd='back-to-cms']").hide();
            $(".navigation-table").slideDown();
        }
        function clearAllContent() {
            $(".report-container").empty();
        }
        function showMemberList() {
            var templateurl = "template/get/cms/memberlist";
            var dataurl = "membershipapi/get/members/all";
            $.when(
                $U.AjaxGet({ url: templateurl }),
                $U.AjaxGet({ url: dataurl })
                ).then(function (q1, q2) {
                    var template = q1[0].Template;
                    var data = q2[0];
                    $.each(data, function (i, item) {
                        item.CreationDate = $U.FormatDate(moment.utc(item.CreationDate).toDate(), "DDMMMYYYY HH:mm:ss");
                        if (item.LastLoginDate !== null) {
                            item.LastLoginDate = $U.FormatDate(moment.utc(item.LastLoginDate).toDate(), "DDMMMYYYY HH:mm:ss");
                        }
                    });
                    var html = $(Mustache.to_html(template, { data: data }));
                    $(".report-container").append(html);
                    $(".report-container table").dataTable({
                        pagingType: "simple",
                        order: [[2, 'asc']]
                    });
                });
        }
        function sendTestMail() {
            $(".toolbar button[data-cmd='back-to-cms']").hide();
            var formUrl = "template/get/cms/mailtester";
            var stm = new $.fastnet$forms.CreateForm(formUrl, {
                Title: "Send Test Email",
                IsModal: false,
                OnCommand: function (f, cmd) {
                    switch (cmd) {
                        case "cancel":
                            openNavigationTable();
                            break;
                        case "send-mail":
                            var data = stm.getData()
                            var postData = { to: data["mail-to"], subject: data.subject, body: data["body-text"] };
                            $.when($U.AjaxPost({ url: "cmsapi/sendmail", data: postData })).then(function () {
                                $U.MessageBox("Mail sent");
                            });
                            break;
                    }                
                },
                AfterItemValidation: function (f, r) {
                    if (r.totalErrors == 0) {
                        stm.enableCommand("send-mail");
                    } else {
                        stm.disableCommand("send-mail");
                    }
                }
            });
            validator = new $.fastnet$validators.Create(stm);
            validator.AddIsRequired("mail-to", "A destination address is required");
            validator.AddEmailAddress("mail-to", "This is not a valid email address");
            validator.AddIsRequired("subject", "Some subject text is required");
            validator.AddIsRequired("body-text", "Some message text is required");
            stm.disableCommand("send-mail");
            stm.show();
        }
        function showMailHistory() {
            //var templateurl = "cms/template/type/mailhistory";
            var templateurl = "template/get/cms/mailhistory";
            var dataurl = "cmsapi/get/mailhistory";
            $.when(
                $U.AjaxGet({ url: templateurl }),
                $U.AjaxGet({ url: dataurl })
                ).then(function (q1, q2) {
                    var template = q1[0].Template;
                    var data = q2[0];
                    showHistory(template, data);
                    $(".mail-history td div.to").on("click", function () {
                        var body = $(this).siblings(".body");
                        $U.MessageBox(body[0].innerHTML, { Title: "Email Content"});
                    });
                });
        }
        function showMembershipHistory() {
            //var templateurl = "cms/template/type/membershiphistory";
            var templateurl = "template/get/cms/membershiphistory";
            var dataurl = "cmsapi/get/membershiphistory";
            $.when(
                $U.AjaxGet({ url: templateurl }),
                $U.AjaxGet({ url: dataurl })
                ).then(function (q1, q2) {
                    var template = q1[0].Template;
                    var data = q2[0];
                    showHistory(template, data);
                });
        }
        function showSessionHistory() {
            //var templateurl = "cms/template/type/sessionhistory";
            var templateurl = "template/get/cms/sessionhistory";
            var dataurl = "cmsapi/get/sessionhistory";
            $.when(
                $U.AjaxGet({ url: templateurl }),
                $U.AjaxGet({ url: dataurl })
                ).then(function (q1, q2) {
                    var template = q1[0].Template;
                    var data = q2[0];
                    //debugger;
                    showHistory(template, data);
                });
        }
        function showHistory(template, data) {
            var html = $(Mustache.to_html(template, { data: data }));
            html.find(".recordedOn").each(function (i, item) {
                item.innerText = moment.utc($(item).text()).format("DDMMMYYYY HH:mm:ss");
            });
            $(".report-container").append(html);
            $(".report-container table").dataTable({
                pagingType: "simple",
                order: [[0, 'desc']]
            });
        }
        function showSiteContent() {
            url = "cmsapi/get/folders";
            $.when($U.AjaxGet({ url: url }, true).then(function (r) {
                $.each(r, function (i, folder) {
                    var html = $(Mustache.to_html(folderTemplate, folder));
                    //$(".cms-content").append(html);
                    $(".report-container").append(html);
                    //var folderId = folder.Id;
                    var url2 = $U.Format("cmsapi/get/foldercontent/{0}", folder.Id);
                    $.when($U.AjaxGet({ url: url2 }, true).then(function (list) {
                        $.each(list, function (j, item) {
                            //var selector = $U.Format(".cms-content .cms-folder[data-folder-id='{0}'] .folder-name", folder.Id);
                            var selector = $U.Format(".cms-folder[data-folder-id='{0}'] .folder-name", folder.Id);
                            item.FullUrl = $U.Format("{0}//{1}/{2}", location.protocol, location.host, item.Url);
                            var lastmodified = moment(item.LastModifiedOn).local();
                            item.LastModifiedOn = $U.FormatDate(lastmodified, "DDMMMYYYY HH:mm:ss");
                            if (item.Type === "page") {
                                $(selector).append($(Mustache.to_html(pageTemplate, item)));
                            } else if (item.Type === "document") {
                                $(selector).append($(Mustache.to_html(docTemplate, item)));

                            } else {
                                $(selector).append($(Mustache.to_html(imageTemplate, item)));
                            }
                        });
                    }));
                });
                //debugger;
            }));
        }
        cms.prototype.echo = function (text) {
            alert(text);
        };
        cms.prototype.start = function () {
            $(".toolbar button[data-cmd='back-to-cms']").hide();
            // load the banner panel content
            var url = "cmsapi/banner";
            $.when($U.AjaxGet({ url: url }).then(function (r) {
                if (r.Success) {
                    $(r.Styles).find("style").each(function (index, style) {
                        //debugger;
                        var html = style.outerHTML;
                        $("head").append($(html));
                    });
                    $(".BannerPanel").html(r.Html);
                }
            }));
            $(".toolbar button").on("click", function () {
                var cmd = $(this).attr("data-cmd");
                switch (cmd) {
                    case "back-to-cms":
                        clearAllContent();
                        openNavigationTable();
                        break;
                }
            });
            $(".navigation-table button").on("click", function () {
                var cmd = $(this).attr("data-cmd");
                switch (cmd) {
                    case "site-content":
                        closeNavigationTable();
                        showSiteContent();
                        break;
                    case "member-list":
                        closeNavigationTable();
                        showMemberList();
                        break;
                    case "session-history":
                        closeNavigationTable();
                        showSessionHistory();
                        break;
                    case "membership-history":
                        closeNavigationTable();
                        showMembershipHistory();
                        break;
                    case "mail-history":
                        closeNavigationTable();
                        showMailHistory();
                        break;
                    case "test-mail":
                        closeNavigationTable();
                        sendTestMail();
                        break;
                }
            });
            //url = "cmsapi/get/folders";
            //$.when($U.AjaxGet({ url: url }, true).then(function (r) {
            //    $.each(r, function (i, folder) {
            //        var html = $(Mustache.to_html(folderTemplate, folder));
            //        $(".cms-content").append(html);
            //        //var folderId = folder.Id;
            //        var url2 = $U.Format("cmsapi/get/foldercontent/{0}", folder.Id);
            //        $.when($U.AjaxGet({ url: url2 }, true).then(function (list) {
            //            $.each(list, function (j, item) {
            //                var selector = $U.Format(".cms-content .cms-folder[data-folder-id='{0}'] .folder-name", folder.Id);
            //                item.FullUrl = $U.Format("{0}//{1}/{2}", location.protocol, location.host, item.Url);
            //                var lastmodified = moment(item.LastModifiedOn).local();
            //                item.LastModifiedOn = $U.FormatDate(lastmodified, "DDMMMYYYY HH:mm:ss");
            //                if (item.Type === "page") {
            //                    $(selector).append($(Mustache.to_html(pageTemplate, item)));
            //                } else if (item.Type === "document") {
            //                    $(selector).append($(Mustache.to_html(docTemplate, item)));

            //                } else {
            //                    $(selector).append($(Mustache.to_html(imageTemplate, item)));
            //                }
            //            });
            //        }));
            //    });
            //    //debugger;
            //}));
        };

    };
})(jQuery);
