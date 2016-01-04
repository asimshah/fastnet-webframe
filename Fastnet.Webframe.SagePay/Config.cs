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
    public class Config : CustomFactory
    {
        public string VendorName { get; private set; }
        public string LiveUrl { get; private set; }
        public string TestUrl { get; private set; }
        public string MockUrl { get; private set; }
        public string SimulatorUrl { get; private set; }
        public SagePayMode Mode { get; private set; }
        private readonly string responseController;
        private readonly string defaultAction;
        private readonly string successAction;
        private readonly string failedAction;
        private string protocolVersion;
        public Config(string sageResponseController, string defaultAction, string successAction, string failedAction)
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
                this.protocolVersion = "3.0";
            }
        }

        public string BuildNotificationUrl(RequestContext context)
        {
            // var configuration = Configuration.Current;
            var urlHelper = new UrlHelper(context);
            var routeValues = new RouteValueDictionary(new { controller = responseController, action = defaultAction });
            string url = urlHelper.RouteUrl(null, routeValues, protocolVersion, context.ThisHost()); 
            return url;
        }
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
