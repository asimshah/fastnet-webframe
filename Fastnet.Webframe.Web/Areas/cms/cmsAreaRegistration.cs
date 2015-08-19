using System.Web.Mvc;
using System.Web.Optimization;

namespace Fastnet.Webframe.Web.Areas.cms
{
    public class cmsAreaRegistration : AreaRegistration 
    {
        public override string AreaName 
        {
            get 
            {
                return "cms";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context) 
        {
            RegisterBundles();
            //context.MapRoute(
            //    "cms_default",
            //    "cmsget/{controller}/{action}/{id}",
            //    new { action = "GetMembershipHistoryPaged", id = UrlParameter.Optional }
            //);

        }
        private void RegisterBundles()
        {
            BundleCollection bundles = BundleTable.Bundles;
            bundles.Add(new StyleBundle("~/Content/cms/css")
            .Include(
                "~/Content/datatables/css/jquery.datatables.css",
                "~/Content/datatables/css/datatables.bootstrap.css",
                "~/Areas/cms/Content/main.css"
            ));

            bundles.Add(new ScriptBundle("~/bundles/cms").Include(
                "~/Scripts/mustache.js",
                "~/Scripts/datatables/jquery.dataTables.js",
                "~/Scripts/datatables/dataTables.bootstrap.js",
                "~/Scripts/fastnet/fastnet.validators.js",
                "~/Scripts/fastnet/fastnet.forms.js",
                "~/Areas/cms/Scripts/webframe.cms.js"
                ));
        }
    }
}