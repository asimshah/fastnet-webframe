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
            //    "cms/{controller}/{action}/{id}",
            //    new { action = "Index", id = UrlParameter.Optional }
            //);
        }
        private void RegisterBundles()
        {
            BundleCollection bundles = BundleTable.Bundles;
            bundles.Add(new StyleBundle("~/Content/cms/css")
            .Include(
                "~/Areas/cms/Content/main.css"
            ));
        }
    }
}