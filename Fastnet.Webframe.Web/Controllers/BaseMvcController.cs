using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Fastnet.Webframe.Mvc
{
    [WebframeException]
    [LogActionFilter]
    public class BaseMvcController : Controller
    {
        public BaseMvcController()
        {

        }
        internal protected Member GetCurrentMember()
        {
            string id = (string)(Session["current-member"] ?? null);
            return id == null ? Member.Anonymous : Core.GetDataContext().Members.Single(m => m.Id == id);
        }
    }
    public class PermissionFilterAttribute : ActionFilterAttribute
    {
        private Group permittedTo;
        private string message;
        public PermissionFilterAttribute(SystemGroups group, string message = "This feature is restricted to authorised users")
        {
            //this.message = HttpUtility.UrlPathEncode(message);
            this.message = message;
            var ctx = Core.GetDataContext();
            permittedTo = ctx.Groups
                .Where(g => g.Type == GroupTypes.System && string.Compare(g.Name, group.ToString(), true) == 0).ToArray()
                .Single(x => string.Compare(x.Name, group.ToString(), true) == 0);
        }
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            try
            {
                if (string.Compare(filterContext.ActionDescriptor.ActionName, "permissiondenied", true) != 0)
                {
                    Member m = ((BaseMvcController)filterContext.Controller).GetCurrentMember();
                    if (!permittedTo.Members.Contains(m))
                    {

                        filterContext.Result = new RedirectToRouteResult(new RouteValueDictionary(new
                        {
                            area = "",
                            controller = "Home",
                            action = "PermissionDenied",
                            message = message
                        }));
                        filterContext.Result.ExecuteResult(filterContext.Controller.ControllerContext);
                    }
                }
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
            base.OnActionExecuting(filterContext);
        }
    }
    public class LogActionFilterAttribute : ActionFilterAttribute
    {
        private bool logActions = ApplicationSettings.Key("LogActions", false);
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            try
            {
                if (logActions)
                {
                    string username = "anonymous";
                    if (filterContext.HttpContext.User.Identity.IsAuthenticated)
                    {
                        username = filterContext.HttpContext.User.Identity.Name;
                    }
                    Log.Write("Executing {0}:{1}(), user {2}, {3}", filterContext.Controller.GetType().Name,
                        filterContext.ActionDescriptor.ActionName, username, filterContext.RequestContext.HttpContext.Request.Url.PathAndQuery);
                }
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
            base.OnActionExecuting(filterContext);
        }
    }
    public class WebframeException : FilterAttribute, IExceptionFilter
    {
        public void OnException(ExceptionContext filterContext)
        {
            Log.Write(filterContext.Exception, "mvc exception in {0}", this.GetType().Name);
        }
    }
}