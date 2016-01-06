using Fastnet.Common;
using Fastnet.Web.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Fastnet.Webframe.SagePay
{
    static class extensions
    {
        //context.Url.Request.RequestUri.GetLeftPart(UriPartial.Authority)
        public static string ThisHost(this System.Net.Http.HttpRequestMessage ctx)
        {
            return ctx.RequestUri.GetLeftPart(UriPartial.Authority) + VirtualPathUtility.ToAbsolute("~/");
        }
        public static string ThisHost(this System.Web.Http.Controllers.HttpRequestContext ctx)
        {
            return ctx.Url.Request.RequestUri.GetLeftPart(UriPartial.Authority) + VirtualPathUtility.ToAbsolute("~/");
        }
        public static string ThisHost(this RequestContext ctx)
        {
            return ctx.HttpContext.Request.Url.GetLeftPart(UriPartial.Authority) + VirtualPathUtility.ToAbsolute("~/");
        }
    }
    public enum SagePayMode
    {
        Mock,
        Simulator,
        Test,
        Live
    }
    public class Configuration : CustomFactory
    {
        public string VendorName { get; private set; }
        public string LiveUrl { get; private set; }
        public string TestUrl { get; private set; }
        public string MockUrl { get; private set; }
        public string SimulatorUrl { get; private set; }
        public string ProtocolVersion { get; private set; }
        public string Protocol { get; private set; }
        public string NotificationHost { get; set; }
        public string NotificationDefaultRoute { get; private set; }
        public string NotificationFailedRoute { get; private set; }
        public string NotificationSuccessRoute { get; private set; }

        private readonly string responseController;
        private readonly string defaultAction;
        private readonly string successAction;
        private readonly string failedAction;


        public SagePayMode Mode { get; private set; }

        private static Configuration sagePayConfig;
        public static Configuration Current
        {
            get
            {
                if (sagePayConfig == null)
                {
                    sagePayConfig = new Configuration("controller", "index", "success", "failed");
                }
                return sagePayConfig;
            }
        }
        public Configuration(string sageResponseController, string defaultAction, string successAction, string failedAction)
        {
            string vendorName = Settings?.sagePay?.vendorName;
            if (!string.IsNullOrWhiteSpace(vendorName))
            {
                VendorName = vendorName;
                LiveUrl = Settings?.sagePay?.liveUrl;
                TestUrl = Settings?.sagePay?.testUrl;
                MockUrl = Settings?.sagePay?.mockUrl;
                SimulatorUrl = Settings?.sagePay?.simulatorUrl;
                string mode = ApplicationSettings.Key("SagePayMode", "mock");
                Mode = (SagePayMode)Enum.Parse(typeof(SagePayMode), mode, true);
                this.responseController = sageResponseController;
                this.defaultAction = defaultAction;
                this.successAction = successAction;
                this.failedAction = failedAction;
                this.ProtocolVersion = "3.0";
                this.Protocol = "http";
                this.NotificationDefaultRoute = "booking/sage/notify";
                this.NotificationSuccessRoute = "booking/sage/success";
                this.NotificationFailedRoute = "booking/sage/failed";
            }
        }
        public void SetNotificationHost(string host, int port)
        {
            if(port == 80)
            {
                this.NotificationHost =  $"{Protocol}//{host}";
            }
            else
            {
                this.NotificationHost = $"{Protocol}//{host}:{port}";
            }
        }
        //public string BuildNotificationUrl(System.Net.Http.HttpRequestMessage context)
        //{
        //    // var configuration = Configuration.Current;

        //    var urlHelper = new System.Web.Http.Routing.UrlHelper(context);
        //    var routeValues = new RouteValueDictionary(new { controller = responseController, action = defaultAction });
        //    string url = urlHelper.Route(null, new { controller = responseController, action = defaultAction });
        //    return url;
        //}
        //public string BuildNotificationUrl(System.Web.Http.Controllers.HttpRequestContext context)
        //{
        //    // var configuration = Configuration.Current;

        //    var urlHelper = new System.Web.Http.Routing.UrlHelper();
        //    var routeValues = new RouteValueDictionary(new { controller = responseController, action = defaultAction });
        //    string url = null;// urlHelper.RouteUrl(null, routeValues, protocolVersion, context.ThisHost());
        //    return url;
        //}
        //public string BuildNotificationUrl(RequestContext context)
        //{
        //    // var configuration = Configuration.Current;
        //    var urlHelper = new UrlHelper(context);
        //    var routeValues = new RouteValueDictionary(new { controller = responseController, action = defaultAction });
        //    string url = urlHelper.RouteUrl(null, routeValues, protocolVersion, context.ThisHost()); 
        //    return url;
        //}
        public string RegistrationUrl
        {
            get
            {
                switch (Mode)
                {
                    default:
                    case SagePayMode.Mock:
                        return MockUrl;
                    case SagePayMode.Simulator:
                        return SimulatorUrl;
                    case SagePayMode.Test:
                        return TestUrl;
                    case SagePayMode.Live:
                        return LiveUrl;
                }
            }
        }
    }
}
