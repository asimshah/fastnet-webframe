using Fastnet.EventSystem;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Common;
using Fastnet.Webframe.Web.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using System.Web.SessionState;
using System.Web.WebPages;

namespace Fastnet.Webframe.Web
{
    //public class WebApiApplication : System.Web.HttpApplication
    //{
    //    protected void Application_Start()
    //    {
    //        AreaRegistration.RegisterAllAreas();
    //        GlobalConfiguration.Configure(WebApiConfig.Register);
    //        FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
    //        RouteConfig.RegisterRoutes(RouteTable.Routes);
    //        BundleConfig.RegisterBundles(BundleTable.Bundles);
    //    }
    //}
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Error(object sender, EventArgs e)
        {
            Exception xe = Server.GetLastError();
            Log.Write(xe);
        }
        protected void Application_PostAuthorizeRequest()
        {
            HttpContext.Current.SetSessionStateBehavior(SessionStateBehavior.Required);  
        }
        protected void Application_Start()
        {
            AutofacConfig.ConfigureContainer();
            dynamic version = VersionInfo.Get(typeof(MvcApplication));

            Log.SetApplicationName(ConfigurationManager.AppSettings["SiteUrl"]);
            //Log.Write(string.Format("**** Webframe {1} started [in process {0}] ****", System.Diagnostics.Process.GetCurrentProcess().Id, (Version)version.ExecutingAssembly.Version));
            CoreDataContext.SetInitializer();
            //AreaRegistration.RegisterAllAreas();
            RouteConfig.MapMVC(RouteTable.Routes);
            AreaRegistration.RegisterAllAreas();
            GlobalConfiguration.Configure(WebApiConfig.Register);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
            using (CoreDataContext core = new CoreDataContext())
            {
                int count = core.Groups.Count();
                //Log.Write("there are {0} groups", count);
            }
        }
        protected void Session_Start()
        {
            var ctx = new HttpContextWrapper(this.Context);
            string ua = ctx.GetOverriddenUserAgent();
            Session["CanTouch"] = IsIPad(ua) || IsTablet(ua);
            Session["UseApiRelay"] = IsIPad(ua);
            LogBrowser();

        }
        private void LogBrowser()
        {
            HttpBrowserCapabilities caps = this.Request.Browser;
            if (caps != null)
            {
                Log.Write("{5} is {0}, {1}, {2}, {3}, {4},{6} {7}w x {8}h", caps.Type, caps.Browser, caps.Version,
                    Request.UserHostAddress, string.IsNullOrWhiteSpace(Request.UserAgent) ? "No user agent" : Request.UserAgent,
                    caps.IsMobileDevice ? "Mobile browser" : "Browser",
                    (bool)Session["CanTouch"] ? " Touch," : "", caps.ScreenPixelsWidth, caps.ScreenPixelsHeight);
            }
            else
            {
                Log.Write("Session started with a browser");
            }
        }
        private bool IsTablet(string userAgentString)
        {
            return userAgentString == null ? false : userAgentString.IndexOf("Touch", StringComparison.InvariantCultureIgnoreCase) >= 0 && userAgentString.IndexOf("Tablet PC", StringComparison.InvariantCultureIgnoreCase) >= 0;
        }
        private bool IsIPad(string userAgentString)
        {
            return userAgentString == null ? false : userAgentString.IndexOf("IPad", StringComparison.InvariantCultureIgnoreCase) >= 0;
        }
    }
    public class VersionInfo
    {
        public static dynamic Get(Type type)
        {
            Func<Assembly, object> assemblyInfo = (a) =>
            {
                string currentAssemblyName = a.GetName().Name;
                Version currentAssemblyVersion = a.GetName().Version;
                return new
                {
                    Name = currentAssemblyName,
                    Version = currentAssemblyVersion
                };
            };
            Assembly current = Assembly.GetAssembly(type);
            Assembly executingIn = Assembly.GetEntryAssembly();
            if (executingIn == null)
            {
                executingIn = Assembly.GetExecutingAssembly();
            }
            return new
            {
                Type = type.Name,
                HostAssembly = assemblyInfo(current),
                ExecutingAssembly = assemblyInfo(executingIn),
                ProcessId = System.Diagnostics.Process.GetCurrentProcess().Id,
                Machine = Environment.MachineName.ToLower()
                //ThreadId = System.Threading.Thread.CurrentThread.ManagedThreadId,
                //ThreadName = System.Threading.Thread.CurrentThread.Name ?? ""
            };
        }
    }
}
