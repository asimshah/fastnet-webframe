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
"        <div class='picture' ><div class='iframe-container'><iframe src='{{FullUrl}}'></iframe></div></div>" +
"        <div class='name'><a href='{{Url}}'>{{Url}}</a><div>{{Name}}</div><div>{{Info}}</div></div>" +
"        <div class='modification-info'><div>{{LastModifiedOn}}</div><div>{{LastModifiedBy}}</div></div>" +
"</div>" +
"</div>";
        var imageTemplate =
"<div class='row' >" +
"<div class='folder-item {{Type}}' data-item-id='{{Id}}' >" +
"        <div class='picture' ><div><img src='{{Url}}'></img></div></div>" +
"        <div class='name'><div>{{Url}}</div><div>{{Name}}</div><div>{{Info}}</div></div>" +
"        <div class='modification-info'><div>{{LastModifiedOn}}</div><div>{{LastModifiedBy}}</div></div>" +
"</div>" +
"</div>";
        var docTemplate =
"<div class='row' >" +
"<div class='folder-item {{Type}}' data-item-id='{{Id}}' >" +
"        <div class='picture' ><div></div></div>" +
"        <div class='name'><div>{{Url}}</div><div>{{Name}}</div><div>{{Info}}</div></div>" +
"        <div class='modification-info'><div>{{LastModifiedOn}}</div><div>{{LastModifiedBy}}</div></div>" +
"</div>" +
"</div>";
        var $U = $.fastnet$utilities;
        cms.prototype.echo = function (text) {
            alert(text);
        };
        cms.prototype.start = function () {
            // load the banner panel content
            var url = "cmsapi/banner";
            $.when($U.AjaxGet({ url: url }).then(function (r) {
                $(r.Styles).find("style").each(function (index, style) {
                    //debugger;
                    var html = style.outerHTML;
                    $("head").append($(html));
                });
                $(".BannerPanel").html(r.Html);
            }));
            url = "cmsapi/get/folders";
            $.when($U.AjaxGet({ url: url }, true).then(function (r) {
                $.each(r, function (i, folder) {
                    var html = $(Mustache.to_html(folderTemplate, folder));
                    $(".cms-content").append(html);
                    //var folderId = folder.Id;
                    var url2 = $U.Format("cmsapi/get/foldercontent/{0}", folder.Id);
                    $.when($U.AjaxGet({ url: url2 }, true).then(function (list) {
                        $.each(list, function (j, item) {
                            var selector = $U.Format(".cms-content .cms-folder[data-folder-id='{0}'] .folder-name", folder.Id);
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
        };

    };
} )( jQuery );
