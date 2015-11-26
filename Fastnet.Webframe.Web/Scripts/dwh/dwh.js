(function ($) {
    $U = $.fastnet$utilities;
    function registration(ctx) {
        switch (ctx.action) {
            case "AddValidations":
                //ctx.validator.AddIsRequired("date-of-birth", "A date of birth is required");
                ctx.validator.AddIsRequired("bmc-membership", "A BMC membership number is required");
                break;
            case "GetData":
                //var dob = ctx.data["date-of-birth"];
                var bmcMembership = ctx.data["bmc-membership"];
                var organisation = ctx.data["organisation"];
                //return { dob: dob, bmcMembership: bmcMembership, organisation: organisation };
                return { bmcMembership: bmcMembership, organisation: organisation };
                break;
        }
        return {};
    }
    function customise(ctx) {
        //$U.Debug("dwh: process: {0}, action: {1}", ctx.process, ctx.action);
        switch (ctx.process) {
            case "registration":
                return registration(ctx);
                break;
        }

    }
    $(function () {
        $U.Debug("in dwh.js");
        $.fastnet$account.customisation = {
            customise: customise
        };
    });
})(jQuery);