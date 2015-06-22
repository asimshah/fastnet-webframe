namespace Fastnet.Webframe.WebApi
{
    using Fastnet.Common;
    using Fastnet.EventSystem;
    using Fastnet.Webframe.CoreData;
    using Fastnet.Webframe.Web.Controllers;
    using System.Net.Http;
    using System.Threading.Tasks;
    using System.Web;
    using System.Web.Http;
    using System.Web.Http.Controllers;
    using System.Web.Http.ExceptionHandling;
    using System.Web.Http.Filters;
    using System.Linq;
    [LogActionFilter]
    public class BaseApiController : ApiController
    {
        internal protected Member GetCurrentMember()
        {
            var session = HttpContext.Current.Session;
            string id = (string)(session["current-member"] ?? null);
            return id == null ? Member.Anonymous : Core.GetDataContext().Members.Single(m => m.Id == id);
        }
    }
    public class PermissionFilterAttribute : ActionFilterAttribute
    {
        private Group permittedTo;
        public PermissionFilterAttribute(string groupName)
        {
            var ctx = Core.GetDataContext();
            permittedTo = ctx.Groups.SingleOrDefault(g => g.Type == GroupTypes.System && string.Compare(g.Name, groupName, true) == 0);
        }
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            try
            {
                Member m = ((BaseApiController)actionContext.ControllerContext.Controller).GetCurrentMember();
                if (!permittedTo.Members.Contains(m))
                {
                    var response = actionContext.Request.CreateResponse(System.Net.HttpStatusCode.Unauthorized);
                    actionContext.Response = response;
                }
            }
            catch (System.Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }
    }
    public class LogActionFilter : ActionFilterAttribute
    {
        private bool logActions = ApplicationSettings.Key("LogActions", false);
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            try
            {
                if (logActions)
                {
                    Member m = ((BaseApiController)actionContext.ControllerContext.Controller).GetCurrentMember();
                    string username = "anonymous";

                    if (actionContext.RequestContext.Principal.Identity.IsAuthenticated)
                    {
                        username = actionContext.RequestContext.Principal.Identity.Name;
                    }
                    string sessionUser = m.Fullname;
                    Log.Write("Executing {0}:{1}(), user {2} ({3}), {4}", actionContext.ControllerContext.Controller.GetType().Name,
                        actionContext.ActionDescriptor.ActionName, username, sessionUser, actionContext.Request.RequestUri.PathAndQuery);
                }
            }
            catch (System.Exception xe)
            {
                Log.Write(xe);
                throw;
            }
            base.OnActionExecuting(actionContext);
        }
    }
    public class WebframeExceptionLogger : ExceptionLogger
    {
        public override Task LogAsync(ExceptionLoggerContext context, System.Threading.CancellationToken cancellationToken)
        {
            if (!ShouldLog(context))
            {
                return Task.FromResult(0);
            }
            Fastnet.EventSystem.Log.Write(context.Exception, "web api exception, controller {0}, action {1}",
                context.ExceptionContext.ControllerContext.ControllerDescriptor.ControllerName, context.ExceptionContext.ActionContext.ActionDescriptor.ActionName);
            return Task.FromResult(0);//base.LogAsync(context, cancellationToken);
        }
    }
}