using Fastnet.Web.Common;
using Fastnet.Webframe.Web.Common;
using Newtonsoft.Json.Linq;
using System.Web;
using System.Web.Hosting;
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
                        "~/Scripts/modernizr.custom.24233.js"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.js",
                      "~/Scripts/respond.js"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryui").Include(
                "~/Scripts/jquery-ui-{version}.js"));

            //bundles.Add(new ScriptBundle("~/bundles/datepicker").Include(
            //    "~/Scripts/bootstrap-datetimepicker.js"
            //    ));

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

            bundles.Add(new ScriptBundle("~/bundles/main/page")
                .Include(
                    "~/Scripts/fastnet/fastnet.menus.js",
                    "~/Scripts/main/core.pagetoolbar.js",
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
                    // "~/Scripts/jquery-ui-{version}.js",
                    "~/Scripts/datatables/jquery.datatables.js",
                    "~/Scripts/tinymce/tinymce.js",
                    "~/Scripts/dropzone/dropzone.js",
                    "~/Scripts/fastnet/fastnet.contextmenu.js",
                    "~/Scripts/fastnet/fastnet.treeview.js",
                    "~/Scripts/main/core.editor.js"
                ));

            AddCustomScripts(bundles);

            // css bundles below here
            EnsureUserCssFilesArePresent();

            bundles.Add(new StyleBundle("~/Content/css").Include(
                  "~/Content/font-awesome/css/font-awesome.min.css", new CssRewriteUrlTransform())
                  .Include("~/Content/bootstrap.css",
                   "~/Content/fastnet/menusystem.css",
                   "~/Content/fastnet/menu.css",
                   "~/Content/fastnet/treeview.css",
                   "~/Content/fastnet/forms.css",
                   "~/Content/main/main.css"));
            // bundles.Add(new StyleBundle("~/Content/jqueryui/css").Include(
            bundles.Add(new StyleBundle("~/Content/themes/base/css").Include(
                //"~/Content/bootstrap-datetimepicker.css"
                //"~/Content/themes/base/all.css"
                //"~/Content/themes/base/base.css",
                "~/Content/themes/base/core.css",
                "~/Content/themes/base/accordion.css",
                "~/Content/themes/base/autocomplete.css",
                "~/Content/themes/base/button.css",
                "~/Content/themes/base/datepicker.css",
                "~/Content/themes/base/dialog.css",
                "~/Content/themes/base/accordion.css",
                "~/Content/themes/base/draggable.css",
                "~/Content/themes/base/menu.css",
                "~/Content/themes/base/progressbar.css",
                "~/Content/themes/base/resizable.css",
                "~/Content/themes/base/selectable.css",
                "~/Content/themes/base/accordion.css",
                "~/Content/themes/base/selectmenu.css",
                "~/Content/themes/base/sortable.css",
                "~/Content/themes/base/slider.css",
                "~/Content/themes/base/spinner.css",
                "~/Content/themes/base/tabs.css",
                "~/Content/themes/base/tooltip.css",

                "~/Content/themes/base/theme.css"
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
                "~/Content/main/DefaultCSS/menu.user.css",
                "~/Content/main/DefaultCSS/menupanel.css",
                "~/Content/main/DefaultCSS/menupanel.user.css",
                "~/Content/main/DefaultCSS/contentpanel.css",
                "~/Content/main/DefaultCSS/contentpanel.user.css",
                "~/Content/main/DefaultCSS/leftpanel.css",
                "~/Content/main/DefaultCSS/leftpanel.user.css",
                "~/Content/main/DefaultCSS/centrepanel.css",
                "~/Content/main/DefaultCSS/centrepanel.user.css",
                "~/Content/main/DefaultCSS/rightpanel.css",
                "~/Content/main/DefaultCSS/rightpanel.user.css"
                ));


            bundles.Add(new StyleBundle("~/Content/identity/css").Include(
                "~/Content/main/identity.css"
                ));

            bundles.Add(new StyleBundle("~/Content/dropzonecss").Include(
                "~/Scripts/dropzone/basic.css",
                "~/Scripts/dropzone/dropzone.css"
                ));

            bundles.Add(new StyleBundle("~/Content/editorcss").Include(

                "~/Content/datatables/css/jquery.datatables.css"
                ));

            AddCustomCSS(bundles);
        }

        private static void EnsureUserCssFilesArePresent()
        {

            string[] cssFiles = new string[] {
                "~/Content/main/DefaultCSS/menu.user.css",
                "~/Content/main/DefaultCSS/browserpanel.user.css",
                "~/Content/main/DefaultCSS/sitepanel.user.css",
                "~/Content/main/DefaultCSS/bannerpanel.user.css",
                "~/Content/main/DefaultCSS/menupanel.user.css",
                "~/Content/main/DefaultCSS/contentpanel.user.css",
                "~/Content/main/DefaultCSS/leftpanel.user.css",
                "~/Content/main/DefaultCSS/centrepanel.user.css",
                "~/Content/main/DefaultCSS/rightpanel.user.css"
            };
            foreach (string usercss in cssFiles)
            {
                string fullname = HostingEnvironment.MapPath(usercss);
                if (!System.IO.File.Exists(fullname))
                {
                    System.IO.File.WriteAllText(fullname, string.Empty);
                }
            }
        }
        private static void AddCustomCSS(BundleCollection bundles)
        {
            var customStyle = new StyleBundle("~/Content/customcss");
            BundleFactory bf = new BundleFactory();
            foreach (var cssFile in bf.CSSFiles)
            {
                customStyle.Include(cssFile);
            }
            bundles.Add(customStyle);
        }
        private static void AddCustomScripts(BundleCollection bundles)
        {
            var customScript = new ScriptBundle("~/bundles/custom");
            BundleFactory bf = new BundleFactory();
            foreach (var scriptFile in bf.Scripts)
            {
                customScript.Include(scriptFile);
            }
            bundles.Add(customScript);
        }
    }
}
