using System.Web.Mvc;
using System.Web.Optimization;

namespace Fastnet.Webframe.Web.Areas.Designer
{
    public class DesignerAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get
            {
                return "Designer";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            RegisterBundles();
            //context.MapRoute(
            //    "Designer_default",
            //    "Designer/{controller}/{action}/{id}",
            //    new { action = "Index", id = UrlParameter.Optional }
            //);
        }
        private void RegisterBundles()
        {
            BundleCollection bundles = BundleTable.Bundles;


            bundles.Add(new StyleBundle("~/Content/designer/css")
                .Include(
                    "~/Content/fastnet/treeview.css",
                    "~/Areas/designer/Content/main.css"
                ));

            bundles.Add(new StyleBundle("~/Content/bootstrap-select/css")
                .Include(
                    "~/Content/bootstrap-select.css"
                ));

            bundles.Add(new ScriptBundle("~/bundles/designer").Include(
                //"~/Scripts/moment.js",
                "~/Scripts/mustache.js",
                "~/Scripts/fastnet/fastnet.validators.js",
                "~/Scripts/fastnet/fastnet.forms.js",
                "~/Scripts/fastnet/fastnet.treeview.js",
                "~/Scripts/main/core.storebrowser.js",
                "~/Areas/Designer/Scripts/webframe.designer.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap-select").Include(
                "~/Scripts/bootstrap-select.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/designer/ace").Include(
                "~/Scripts/less/less.js",
                "~/Areas/Designer/Scripts/ace editor/src/ace.js"
                ));
        }
    }
}