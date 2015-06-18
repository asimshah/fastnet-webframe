using System.Web;
using System.Web.Optimization;

namespace Fastnet.Webframe.Web
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
//#if DEBUG
//            BundleTable.EnableOptimizations = false;
//#else
//            BundleTable.EnableOptimizations = true;
//#endif
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

            bundles.Add(new ScriptBundle("~/bundles/fastnet/utils")
                .Include(
                    "~/Scripts/moment.js",
                    "~/Scripts/fastnet/fastnet.utilities.js"
                ));

            //bundles.Add(new ScriptBundle("~/bundles/main/adminsetup")
            //    .Include(
            //        "~/Scripts/main/core.admin.setup.js"
            //    ));

            bundles.Add(new ScriptBundle("~/bundles/main/page")
                .Include(
                    "~/Scripts/main/core.page.js",
                    "~/Scripts/main/core.storebrowser.js",
                    "~/Scripts/main/core.test.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/identity")
                .Include(
                    "~/Scripts/jquery.blockUI.js",
                    "~/Scripts/fastnet/fastnet.validators.js",
                    "~/Scripts/fastnet/fastnet.forms.js",
                    "~/Scripts/fastnet/fastnet.account.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/main/editor")
                .Include(
                    "~/Scripts/jquery-ui-{version}.js",
                    "~/Scripts/datatables/jquery.datatables.js",
                    "~/Scripts/tinymce/tinymce.js",
                    "~/Scripts/dropzone/dropzone.js",
                    "~/Scripts/fastnet/fastnet.contextmenu.js",
                    "~/Scripts/fastnet/fastnet.treeview.js",
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
                  "~/Content/font-awesome/css/font-awesome.min.css", new CssRewriteUrlTransform())
                  .Include("~/Content/bootstrap.css",
                  "~/Content/fastnet/treeview.css",
                  "~/Content/fastnet/forms.css",
                  "~/Content/main/main.css"));

            bundles.Add(new StyleBundle("~/Content/datepicker/css").Include(
                "~/Content/bootstrap-datetimepicker.css"
                ));

            bundles.Add(new StyleBundle("~/Content/site/css")
                 .Include(
                 "~/Content/main/DefaultCSS/browserpanel.css",
                 "~/Content/main/DefaultCSS/browserpanel.user.css",
                 "~/Content/main/DefaultCSS/sitepanel.css",
                 "~/Content/main/DefaultCSS/sitepanel.user.css",
                 "~/Content/main/DefaultCSS/bannerpanel.css",
                 "~/Content/main/DefaultCSS/bannerpanel.user.css"
                 ));

            bundles.Add(new StyleBundle("~/Content/page/css")
                .Include(
                "~/Content/main/DefaultCSS/menupanel.css",
                "~/Content/main/DefaultCSS/menupanel.user.css",
                "~/Content/main/DefaultCSS/contentpanel.css",
                "~/Content/main/DefaultCSS/contentpanel.user.css",
                "~/Content/main/DefaultCSS/leftpanel.css",
                "~/Content/main/DefaultCSS/leftpanel.user.css",
                "~/Content/main/DefaultCSS/centrepanel.css",
                "~/Content/main/DefaultCSS/centrepanel.user.css",
                "~/Content/main/DefaultCSS/rightpanel.css",
                "~/Content/main/DefaultCSS/rightpanel.user.css",
                "~/Content/main/DefaultCSS/menu.css",
                "~/Content/main/DefaultCSS/menu.user.css"
                ));


            bundles.Add(new StyleBundle("~/Content/identity/css").Include(
                "~/Content/main/identity.css"
                ));

            bundles.Add(new StyleBundle("~/Content/dropzonecss").Include(
                "~/Scripts/dropzone/basic.css",
                "~/Scripts/dropzone/dropzone.css"
                ));

            bundles.Add(new StyleBundle("~/Content/editorcss").Include(
                //"~/Content/themes/base/all.css",
                //"~/Content/themes/base/base.css",
                //"~/Content/themes/base/theme.css"
                "~/Content/datatables/css/jquery.datatables.css"
                ));
            //bundles.Add(new StyleBundle("~/Content/themes/base/editorcss")
            //    .IncludeDirectory("~/Content/themes/base", "*.css"));
        }
    }
}
