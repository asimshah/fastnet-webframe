(function ($) {
    $U = $.fastnet$utilities;
    function memberdetails(ctx) {
        switch (ctx.action) {
            //case "AddValidations":
            //    ctx.validator.AddIsRequired("date-of-birth", "A date of birth is required");
            //    ctx.validator.AddIsRequired("bmc-membership", "A BMC membership number is required");
            //    break;
            case "GetData":
                //var dob = ctx.data["date-of-birth"];
                var bmcMembership = ctx.data["bmc-membership"];
                var organisation = ctx.data["organisation"];
                return {bmcMembership: bmcMembership, organisation: organisation};
                break;
        }
        return {};
    }
    function customise(ctx) {
        $U.Debug("dwh: process: {0}, action: {1}", ctx.process, ctx.action);
        switch (ctx.process) {
            case "memberdetails":
                return memberdetails(ctx);
                break;
        }
    }
    $(function () {
        $U.Debug("in membership dwh.js");
        var mm = Membership.get();
        $U.Debug("Customising membership instance {0}", mm.getIndexNumber());
        mm.setCustomisation({
            customise: customise
        });
        //mm.customisation = {
        //    customise: customise
        //};
    });
})(jQuery);