using Fastnet.EventSystem;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Common;
using Fastnet.Webframe.Web.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using System.Web.SessionState;
using System.Web.WebPages;
using Autofac;

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
            string appDataFolder = HostingEnvironment.MapPath("~/App_Data");
            if (!System.IO.Directory.Exists(appDataFolder))
            {
                System.IO.Directory.CreateDirectory(appDataFolder);
            }
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
            ScanForTemplates();
            using (CoreDataContext core = new CoreDataContext())
            {
                int count = core.Groups.Count(); // causes seeding, migrations, etc.
                ApplicationAction aa = new ApplicationAction
                {
                    SiteUrl = ConfigurationManager.AppSettings["SiteUrl"],
                    Version = version.HostAssembly.Version.ToString(),
                    Remark = string.Format("Process {0} on machine {1}", version.ProcessId, version.Machine)
                };
                core.Actions.Add(aa);
                core.SaveChanges();
            }
        }

        private void ScanForTemplates()
        {
            var mainTemplateFolder = new System.IO.DirectoryInfo(HostingEnvironment.MapPath("~/Templates"));
            if (System.IO.Directory.Exists(mainTemplateFolder.FullName))
            {
                LoadTemplateInfo(mainTemplateFolder);
            }
            var areasDi = new System.IO.DirectoryInfo(HostingEnvironment.MapPath("~/Areas"));
            foreach(System.IO.DirectoryInfo di in areasDi.GetDirectories())
            {
                //Debug.Print("area {0} found", di.Name);
                var tf = System.IO.Path.Combine(di.FullName, "Templates");
                if (System.IO.Directory.Exists(tf))
                {
                    LoadTemplateInfo(new System.IO.DirectoryInfo(tf));
                }
            }
        }

        private void LoadTemplateInfo(System.IO.DirectoryInfo templateFolder)
        {
            var templateLibrary = TemplateLibrary.GetInstance();
            Action<string, System.IO.DirectoryInfo> findHtmlFiles = (location, di) =>
            {
                var files = di.EnumerateFiles("*.html");
                foreach (System.IO.FileInfo file in files)
                {
                    //Debug.Print("Add location {0}, file {1}", location, System.IO.Path.GetFileNameWithoutExtension(file.Name));
                    templateLibrary.AddTemplate(location, System.IO.Path.GetFileNameWithoutExtension(file.Name), file.FullName);
                }
            };
            string appName = "main";
            if(string.Compare(templateFolder.Parent.Parent.Name, "Areas", true) == 0)
            {
                appName = templateFolder.Parent.Name.ToLower();
            }
            Debug.Print("loading templates for {0}", appName);
            findHtmlFiles(appName, templateFolder);
            var directories = templateFolder.EnumerateDirectories("*", System.IO.SearchOption.AllDirectories);
            foreach (System.IO.DirectoryInfo dir in directories)
            {
                string location = appName + "-" + dir.FullName.Substring(dir.FullName.ToLower().IndexOf("templates\\") + 10);
                findHtmlFiles(location.Replace("\\", "-").ToLower(), dir);
            }
            Application["td"] = templateLibrary;
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
                if (Session.IsNewSession)
                {
                    using (CoreDataContext core = new CoreDataContext())
                    {
                        SessionAction sa = new SessionAction
                        {
                            SessionId = Session.SessionID,
                            Browser = caps.Browser,
                            Version = caps.Version,
                            IpAddress = Request.UserHostAddress,
                            ScreenWidth = caps.ScreenPixelsWidth,
                            ScreenHeight = caps.ScreenPixelsHeight,
                            CanTouch = (bool)Session["CanTouch"]
                        };
                        core.Actions.Add(sa);
                        core.SaveChanges();
                    }

                }
                else
                {
                    Log.Write("Session {0} restarted", Session.SessionID);
                }
                //Log.Write("{5} is {0}, {1}, {2}, {3}, {4},{6} {7}w x {8}h", caps.Type, caps.Browser, caps.Version,
                //    Request.UserHostAddress, string.IsNullOrWhiteSpace(Request.UserAgent) ? "No user agent" : Request.UserAgent,
                //    caps.IsMobileDevice ? "Mobile browser" : "Browser",
                //    (bool)Session["CanTouch"] ? " Touch," : "", caps.ScreenPixelsWidth, caps.ScreenPixelsHeight);
            }
            else
            {
                Log.Write("Session started without browser capability available");
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
