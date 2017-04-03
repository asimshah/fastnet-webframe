using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using mvc = System.Web.Mvc;
using System.Web.Routing;
using System.Web.Http.Routing;
using Fastnet.EventSystem;
using Fastnet.Web.Common;


namespace Fastnet.Webframe.Web.Controllers
{
    [RoutePrefix("special")]
    public class SpecialController : ApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        //[HttpGet]
        //[Route("updateCSSFromDB")]
        //public HttpResponseMessage WriteCSSFromDB()
        //{
        //    DataContext.CreateCSSFromPanels();
        //    return this.Request.CreateResponse(HttpStatusCode.OK);
        //}

        [HttpGet]
        [Route("echo/{counter?}")]
        public HttpResponseMessage Echo(int counter = 999)
        {
            Random r = new Random();
            int delay = r.Next(2, 10);
            Thread.Sleep(TimeSpan.FromSeconds(delay));
            return this.Request.CreateResponse(HttpStatusCode.OK, new { Counter = counter, Delay = delay });
        }
        //[HttpGet]
        //[AllowAnonymous]
        //[Route("test")]
        //public HttpResponseMessage Test1()
        //{
        //    Debugger.Break();
        //    //Directory leaf = DataContext.Directories.Find(5);
        //    //foreach (var d in leaf.Parents)
        //    //{
        //    //    Debug.Print("{0}", d.Name);
        //    //}
        //    foreach (Member m in DataContext.Members)
        //    {
        //        Page p = m.FindLandingPage();
        //        Debug.Print("{0}, home {1}", m.Fullname, p.Url);
        //    }
        //    return this.Request.CreateResponse(HttpStatusCode.OK);
        //}
        [HttpGet]
        [AllowAnonymous]
        [Route("logroutes")]
        public HttpResponseMessage LogRoutes()
        {
            RoutingInformation.ReportRoutes();
            //ReportRoutes();
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpGet]
        [AllowAnonymous]
        [Route("logaccess")]
        public HttpResponseMessage LogAccess()
        {
            foreach (Member m in DataContext.Members)
            {
                foreach (Page page in DataContext.Pages)
                {
                    m.GetAccessResult(page);
                }
            }
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpGet]
        [AllowAnonymous]
        [Route("loglandingpages")]
        public HttpResponseMessage LogLandingPages()
        {
            foreach (Member m in DataContext.Members)
            {
                Page lp = m.FindLandingPage();
            }
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        //private void ReportRoutes()
        //{
        //    try
        //    {
        //        var routes = RouteTable.Routes;
        //        int count = 0;
        //        foreach (dynamic routeItem in routes)
        //        {
        //            //++count;
        //            var ctx = new HttpContextWrapper(HttpContext.Current);
        //            RouteData rd = routeItem.GetRouteData(ctx);
        //            string name = routeItem.GetType().Name;
        //            //Debug.Print(name);
        //            switch (name)
        //            {
        //                default:
        //                    Debugger.Break();
        //                    break;
        //                case "Route":
        //                    ++count;
        //                    ReportRoute(count, routeItem as Route);
        //                    break;
        //                case "HttpWebRoute":
        //                    //var x = ((System.Web.Http.WebHost.Routing.HttpWebRoute)routeItem).HttpRoute;
        //                    Type t = routeItem.GetType();
        //                    var pi = t.GetProperty("HttpRoute");
        //                    dynamic routeCollection = pi.GetValue(routeItem);
        //                    if (routeCollection.GetType().Name != "HostedHttpRoute")
        //                    {
        //                        //var x = routeCollection as System.Web.Http.Routing.RouteCollectionRoute;
        //                        foreach (dynamic item in routeCollection)
        //                        {
        //                            ++count;
        //                            ReportRoute(count, item as HttpRoute);
        //                        }
        //                    }
        //                    break;
        //                case "RouteCollectionRoute":
        //                    foreach (dynamic item in routeItem)
        //                    {
        //                        ++count;
        //                        ReportRoute(count, item as Route);
        //                    }
        //                    break;
        //                case "IgnoreRouteInternal":
        //                case "LinkGenerationRoute":
        //                case "RequestDataRoute":
        //                    break;
        //            }
        //        }

        //    }
        //    catch (Exception xe)
        //    {
        //        Log.Write(xe);
        //    }
        //}
        //private void ReportRoute(int count, HttpRoute r)
        //{
        //    try
        //    {
        //        StringBuilder sb = new StringBuilder();
        //        sb.AppendFormat("{0:00}: ", count);
        //        sb.AppendFormat("\"{0}\" --> ", r.RouteTemplate);
        //        if (r.DataTokens.ContainsKey("actions"))
        //        {
        //            var ads = r.DataTokens["actions"] as System.Web.Http.Controllers.HttpActionDescriptor[];
        //            foreach (var ad in ads)
        //            {
        //                sb.AppendFormat("{0}, [{1}] {2}()",
        //                    ad.ControllerDescriptor.ControllerType.FullName,
        //                    string.Join(", ", ad.SupportedHttpMethods.Select(m => m.Method).ToArray()),
        //                    ad.ActionName);
        //            }
        //        }
        //        Log.Write(sb.ToString());
        //    }
        //    catch (Exception xe)
        //    {
        //        Log.Write(xe);
        //    }
        //}
        //private void ReportRoute(int count, Route r)
        //{
        //    try
        //    {


        //        StringBuilder sb = new StringBuilder();
        //        sb.AppendFormat("{0:00}: ", count);
        //        if (r.DataTokens.ContainsKey("area"))
        //        {
        //            sb.AppendFormat("[{0}] ", r.DataTokens["area"]);
        //        }
        //        sb.AppendFormat("\"{0}\" --> ", r.Url);
        //        if (r.DataTokens.ContainsKey("MS_DirectRouteActions"))
        //        {
        //            mvc.ActionDescriptor[] ads = r.DataTokens["MS_DirectRouteActions"] as mvc.ActionDescriptor[];
        //            foreach (var ad in ads)
        //            {
        //                sb.AppendFormat("{0}, {1}()", ad.ControllerDescriptor.ControllerType.FullName, ad.ActionName);
        //                //sb.AppendLine();
        //            }
        //        }
        //        else if (r.DataTokens.ContainsKey("Namespaces"))
        //        {
        //            string controller = (string)r.Defaults["controller"];
        //            string action = (string)r.Defaults["action"];
        //            sb.AppendFormat("{0}Controller {1}()", controller, action);
        //            string[] nameSpaces = (string[])r.DataTokens["Namespaces"];
        //            foreach (var ns in nameSpaces)
        //            {
        //                sb.AppendFormat("in {0}", ns);
        //            }

        //        }
        //        Log.Write(sb.ToString());
        //    }
        //    catch (Exception xe)
        //    {
        //        Log.Write(xe);
        //    }
        //}
    }
}
