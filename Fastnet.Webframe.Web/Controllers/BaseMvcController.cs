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
using Microsoft.Owin;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;

namespace Fastnet.Webframe.Mvc
{
    [WebframeException]
    [LogActionFilter]
    public class BaseMvcController : Controller
    {
        public BaseMvcController()
        {

        }
        internal protected MemberBase GetCurrentMember()
        {
            string id = (string)(Session["current-member"] ?? null);
            return id == null ? Member.Anonymous : Core.GetDataContext().Members.Single(m => m.Id == id);
        }
    }
    public class VerifySessionAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            string actionName = filterContext.ActionDescriptor.ActionName;
            if (string.Compare(actionName, "SessionTimedout", true) != 0)
            {
                BaseMvcController controller = (BaseMvcController)filterContext.Controller;
                MemberBase m = controller.GetCurrentMember();
                if (controller.User.Identity.IsAuthenticated && m.IsAnonymous)
                {
                    // we are here because the session has expired but the authentication hasn't
                    var am = controller.ControllerContext.HttpContext.GetOwinContext().Authentication;
                    am.SignOut();
                    filterContext.Result = new RedirectToRouteResult(new RouteValueDictionary(new
                    {
                        area = "",
                        controller = "Home",
                        action = "SessionTimedout",
                    }));
                    filterContext.Result.ExecuteResult(controller.ControllerContext);
                }
            }
            base.OnActionExecuting(filterContext);
        }
    }
    public class PermissionFilterAttribute : ActionFilterAttribute
    {
        private long groupPK;
        private string message;
        public PermissionFilterAttribute(SystemGroups group, string message = "This feature is restricted to authorised users")
        {
            //this.message = HttpUtility.UrlPathEncode(message);
            this.message = message;
            var ctx = Core.GetDataContext();
            var permittedTo = ctx.Groups.SingleOrDefault(g => g.Type == GroupTypes.System && string.Compare(g.Name, group.ToString(), true) == 0);
            if (permittedTo != null)
            {
                groupPK = permittedTo.GroupId;
            }
        }
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            if(groupPK == 0)
            {
                Log.Write(EventSeverities.Error, $"Permission Filter on {this.GetType().Name} failed: no group available");
                return;
            }
            try
            {
                string actionName = filterContext.ActionDescriptor.ActionName;
                if (string.Compare(actionName, "permissiondenied", true) != 0)
                {
                    BaseMvcController controller = (BaseMvcController)filterContext.Controller;
                    MemberBase m = controller.GetCurrentMember();
                    var permittedTo = Core.GetDataContext().Groups.Find(groupPK);
                    if (!permittedTo.Members.Contains(m))
                    {
                        filterContext.Result = new RedirectToRouteResult(new RouteValueDictionary(new
                        {
                            area = "",
                            controller = "Home",
                            action = "PermissionDenied",
                            message = message
                        }));
                        filterContext.Result.ExecuteResult(controller.ControllerContext);
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
                    string controllerName = filterContext.Controller.GetType().FullName.Replace("Fastnet.Webframe.Web.", "");
                    Log.Write("mvc {0}:{1}(), user {2}, {3}", controllerName,
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