using Fastnet.Common;
using Fastnet.EventSystem;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Fastnet.Webframe.Web.Common
{
    //public class ActionLogging : ActionFilterAttribute, IActionFilter, IResultFilter
    //{
    //    private static bool logActions;
    //    private static Stopwatch stopWatch;
    //    private static long snapshot;
    //    static ActionLogging()
    //    {
    //        logActions = ApplicationSettings.Key<bool>("LogActions", false);
    //        stopWatch = Stopwatch.StartNew();
    //    }
    //    void IActionFilter.OnActionExecuted(ActionExecutedContext filterContext)
    //    {
    //        if (logActions)
    //        {
    //            string controller = filterContext.ActionDescriptor.ControllerDescriptor.ControllerName;
    //            string action = filterContext.ActionDescriptor.ActionName;
    //            Writelog(controller, action, "finished", "");
    //        }
    //    }
    //    void IActionFilter.OnActionExecuting(ActionExecutingContext filterContext)
    //    {
    //        if (logActions)
    //        {
    //            snapshot = stopWatch.ElapsedMilliseconds; // restart elapsed count
    //            string controller = filterContext.ActionDescriptor.ControllerDescriptor.ControllerName;
    //            string action = filterContext.ActionDescriptor.ActionName;
    //            Writelog(controller, action, "starting", "");
    //        }
    //    }
    //    void IResultFilter.OnResultExecuted(ResultExecutedContext filterContext)
    //    {
    //        if (logActions)
    //        {
    //            string identifier = "executed";
    //            LogContext(filterContext, identifier);
    //        }
    //    }
    //    void IResultFilter.OnResultExecuting(ResultExecutingContext filterContext)
    //    {
    //        if (logActions)
    //        {
    //            string identifier = "executed";
    //            LogContext(filterContext, identifier);
    //        }
    //    }
    //    private void LogContext(ControllerContext filterContext, string identifier)
    //    {
    //        RouteData rd = filterContext.RouteData;
    //        string controller = rd.GetRequiredString("controller");
    //        string action = rd.GetRequiredString("action");
    //        if (filterContext is ResultExecutedContext || filterContext is ResultExecutingContext)
    //        {
    //            ActionResult result = (filterContext is ResultExecutedContext) ? (filterContext as ResultExecutedContext).Result
    //                : (filterContext as ResultExecutingContext).Result;
    //            LogResult(result, controller, action, identifier);
    //        }
    //    }
    //    private void LogResult(ActionResult result, string controller, string action, string identifier)
    //    {
    //        if (result is HttpStatusCodeResult)
    //        {
    //            Writelog(controller, action, identifier, "status {0}", (result as HttpStatusCodeResult).StatusCode);
    //        }
    //        else if (result is ViewResult)
    //        {
    //            ViewResult vr = result as ViewResult;
    //            Writelog(controller, action, identifier, "view {0}, model {1}", vr.ViewName, vr.Model == null ? "null" : vr.Model.GetType().Name);
    //        }
    //        else if (result is ContentResult)
    //        {
    //            ContentResult cr = result as ContentResult;
    //            Writelog(controller, action, identifier, "content is {0}", cr.ContentType);
    //        }
    //        else if (result is RedirectToRouteResult)
    //        {
    //            RedirectToRouteResult rrr = result as RedirectToRouteResult;
    //            StringBuilder sb = new StringBuilder();
    //            foreach (var rv in rrr.RouteValues)
    //            {
    //                sb.AppendFormat("/{1}", rv.Key, rv.Value);
    //            }
    //            Writelog(controller, action, identifier, "redirected to {0}", sb.ToString());
    //        }
    //        else
    //        {
    //            Writelog(controller, action, identifier, "result is {0}", result.GetType().Name);
    //        }
    //    }
    //    void Writelog(string controller, string action, string identifier, string fmt, params object[] args)
    //    {
    //        long ss = stopWatch.ElapsedMilliseconds;
    //        string timer = string.Format("[{0:00000}] {1:0000}ms {2}.{3} {4} ", ss, ss - snapshot, controller, action, identifier);
    //        snapshot = ss;
    //        Log.Debug(timer + fmt, args);
    //    }
    //}
}