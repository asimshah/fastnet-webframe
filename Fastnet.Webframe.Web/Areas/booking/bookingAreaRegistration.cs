using Fastnet.Webframe.Web.Areas.booking.Common;
using System.Web.Mvc;
using System.Web.Optimization;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class bookingAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get
            {
                return "booking";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            RegisterBundles();
            //context.MapRoute(
            //    "booking_default",
            //    "booking/{controller}/{action}/{id}",
            //    new { action = "Index", id = UrlParameter.Optional }
            //);
        }
        private void RegisterBundles()
        {
            BundleCollection bundles = BundleTable.Bundles;
            bundles.Add(new StyleBundle("~/Content/booking/css")
                .Include("~/Content/font-awesome/css/font-awesome.min.css", new CssRewriteUrlTransform())
                .Include(
                "~/Content/bootstrap.css"
                ));
            bundles.Add(new StyleBundle("~/Content/booking/app/css")
                .Include(
                 "~/Areas/booking/Content/fastnet/forms.css",
                 "~/Areas/booking/Content/main.css"
                ));

            bundles.Add(new ScriptBundle("~/bundles/fastnet/vnext").Include(
                //"~/Scripts/mustache.js",
                "~/Scripts/moment.js",
                "~/Scripts/jquery.blockUI.js",
                "~/Scripts/knockout-3.3.0.js",
                "~/Scripts/knockout.mapping-latest.js",
                "~/Scripts/knockout.validation.js",
                "~/Scripts/collections/collections.js",
                "~/Areas/booking/Scripts/utilities.js",
                "~/Areas/booking/Scripts/fastnet/forms.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/booking").Include(
                "~/Areas/booking/Scripts/factory.js",
                "~/Areas/booking/Scripts/bookingViewModels.js",
                "~/Areas/booking/Scripts/booking.js"//,
                 //"~/Areas/booking/Scripts/tests.js"
                ));
            bundles.Add(new ScriptBundle("~/bundles/booking/admin").Include(
                 "~/Areas/booking/Scripts/factory.js",
                 "~/Areas/booking/Scripts/adminViewModels.js",
                "~/Areas/booking/Scripts/bookingAdmin.js"
                ));
            AddCustomScripts(bundles);
        }
        private void AddCustomScripts(BundleCollection bundles)
        {
            var customScript = new ScriptBundle("~/bundles/booking/custom");
            BookingBundleFactory bf = new BookingBundleFactory();
            foreach (var scriptFile in bf.AppScripts)
            {
                customScript.Include(scriptFile);
            }
            bundles.Add(customScript);
        }
    }
}