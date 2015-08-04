using Fastnet.Webframe.Web.Areas.membership.Common;
using System.Web.Mvc;
using System.Web.Optimization;

namespace Fastnet.Webframe.Web.Areas.membership
{
    public class membershipAreaRegistration : AreaRegistration 
    {
        public override string AreaName 
        {
            get 
            {
                return "membership";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context) 
        {
            RegisterBundles();

            //context.MapRoute(
            //    "membership_default",
            //    "membership/{controller}/{action}/{id}",
            //    new { action = "Index", id = UrlParameter.Optional }
            //);
        }

        private void RegisterBundles()
        {
            BundleCollection bundles = BundleTable.Bundles;
            bundles.Add(new StyleBundle("~/Content/membership/css")
            .Include(
                "~/Areas/membership/Content/main.css"
                //"~/Areas/membership/Content/bootstrap.vertical-tabs.css"
            ));

            bundles.Add(new ScriptBundle("~/bundles/membership").Include(
                "~/Scripts/mustache.js",
                "~/Scripts/fastnet/fastnet.utilities.js",
                "~/Scripts/fastnet/fastnet.validators.js",
                "~/Scripts/fastnet/fastnet.forms.js",
                "~/Scripts/fastnet/fastnet.treeview.js",
                "~/Areas/membership/Scripts/membership.js",
                "~/Areas/membership/Scripts/webframe.membership.js"
                ));
            AddCustomScripts(bundles);
        }
        private void AddCustomScripts(BundleCollection bundles)
        {
            var customScript = new ScriptBundle("~/bundles/membership/custom");
            MembershipBundleFactory bf = new MembershipBundleFactory();
            foreach (var scriptFile in bf.MembershipScripts)
            {
                customScript.Include(scriptFile);
            }
            bundles.Add(customScript);
        }
    }
}