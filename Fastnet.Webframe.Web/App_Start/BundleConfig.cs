using System.Web;
using System.Web.Optimization;

namespace Fastnet.Webframe.Web
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
            "~/Scripts/jquery.validate*"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.js",
                      "~/Scripts/respond.js"));

            //bundles.Add(new ScriptBundle("~/bundles/jqueryui").Include(
            //    "~/Scripts/jquery-ui-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/datepicker").Include(
                "~/Scripts/bootstrap-datetimepicker.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/fastnet")
                .Include(
                    "~/Scripts/moment.js",
                    "~/Scripts/mustache.js",
                    "~/Scripts/fastnet/fastnet.utilities.js"
                ));

            //bundles.Add(new ScriptBundle("~/bundles/main/adminsetup")
            //    .Include(
            //        "~/Scripts/main/core.admin.setup.js"
            //    ));

            bundles.Add(new ScriptBundle("~/bundles/main/page")
                .Include(
                    "~/Scripts/main/core.page.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/identity")
                .Include(
                    "~/Scripts/jquery.blockUI.js",
                    "~/Scripts/fastnet/fastnet.account.js",
                    "~/Scripts/fastnet/fastnet.forms.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/main/editor")
                .Include(
                    "~/Scripts/tinymce/tinymce.js",
                    "~/Scripts/fastnet/fastnet.contextmenu.js",
                    "~/Scripts/main/core.editor.js"
                ));

            // css bundles below here

            //bundles.Add(new Bundle("~/Content/jqueryui/css")
            //     .Include(
            //     "~/Content/themes/base/core.css",
            //     "~/Content/themes/base/datepicker.css",
            //     "~/Content/themes/base/theme.css"
            //     ));
            bundles.Add(new StyleBundle("~/Content/css").Include(
                  "~/Content/font-awesome/css/font-awesome.min.css",
                  "~/Content/bootstrap.css",
                  "~/Content/main/main.css"));

            bundles.Add(new StyleBundle("~/Content/datepicker/css").Include(
                "~/Content/bootstrap-datetimepicker.css"
                ));

            bundles.Add(new Bundle("~/Content/site/css")
                 .Include(
                 "~/Content/main/DefaultCSS/browserpanel.css",
                 "~/Content/main/CustomCSS/browserpanel.css",
                 "~/Content/main/DefaultCSS/sitepanel.css",
                 "~/Content/main/CustomCSS/sitepanel.css",
                 "~/Content/main/DefaultCSS/bannerpanel.css",
                 "~/Content/main/CustomCSS/bannerpanel.css"
                 ));

            bundles.Add(new Bundle("~/Content/page/css")
                .Include(
                "~/Content/main/DefaultCSS/menupanel.css",
                "~/Content/main/CustomCSS/menupanel.css",
                "~/Content/main/DefaultCSS/contentpanel.css",
                "~/Content/main/CustomCSS/contentpanel.css",
                "~/Content/main/DefaultCSS/leftpanel.css",
                "~/Content/main/CustomCSS/leftpanel.css",
                "~/Content/main/DefaultCSS/centrepanel.css",
                "~/Content/main/CustomCSS/centrepanel.css",
                "~/Content/main/DefaultCSS/rightpanel.css",
                "~/Content/main/CustomCSS/rightpanel.css",
                "~/Content/main/DefaultCSS/menu.css",
                "~/Content/main/CustomCSS/menu.css"
                ));


            bundles.Add(new StyleBundle("~/Content/identity/css").Include(
                "~/Content/main/identity.css"
                ));
        }
    }
}
