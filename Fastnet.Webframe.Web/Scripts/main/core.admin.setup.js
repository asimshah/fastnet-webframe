(function ($) {
    //var $T;
    //var $U;
    //$.core$adminsetup = {
    //    Init: function () {
    //        $T = this;
    //        $U = $.fastnet$utilities;
    //        $(".admin-setup").on("click", "input[type=button][data-cmd], button[data-cmd]", $T.OnButtonClick);
    //        $(".admin-setup").on("input", "#password, #confirmpassword", $T.OnTextChange);
    //        $U.SetEnabled($("button[data-cmd='save']"), false);
    //    },
    //    OnButtonClick: function (e) {
    //        $(".admin-setup .message").html("");
    //        var password = $("#password").val().trim();
    //        var email = "Administrator";
    //        var url = $U.Format("api/account/register");
    //        var postArgs = {
    //            busyMessage: null,
    //            url: url,
    //            data: { Email: email, Password: password, FirstName: "", LastName: "" },
    //            done: function (result) { },
    //            always: function (result) { },
    //            fail: function (result) {
    //                var message = result.ModelState["IdentityError"][0];
    //                $(".admin-setup .message").html($U.Format("<div>{0}</div>", message));
    //            }
    //        };
    //        $U.AjaxPost(postArgs);
    //    },
    //    OnTextChange: function (e) {
    //        var password = $("#password").val().trim();
    //        var confirmpassword = $("#confirmpassword").val().trim();
    //        var enableSave = false;
    //        if (password.length > 0 || confirmpassword.length > 0) {
    //            if (password === confirmpassword) {
    //                enableSave = true;
    //                $(".admin-setup .message").html("")
    //            }
    //            else {
    //                $(".admin-setup .message").html("<div>Passwords are not the same</div>")
    //            }
    //        } else {
    //            $(".admin-setup .message").html("")
    //        }
    //        $U.SetEnabled($("button[data-cmd='save']"), enableSave);
    //    },
    //};
    //$(function () {
    //    $.core$adminsetup.Init();
    //});
})(jQuery);