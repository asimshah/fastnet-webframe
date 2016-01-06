using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Web.Routing;

namespace Fastnet.Webframe.SagePay
{
    /// <summary>
    /// Default IUrlResolver implementation.
    /// </summary>
    public class DefaultUrlResolver //: IUrlResolver
    {
        public const string DefaultControllerName = "PaymentResponse";
        public const string FailedActionName = "Failed";
        public const string SuccessfulActionName = "Success";

        public virtual string BuildFailedTransactionUrl(string vendorTxCode)
        {
            var configuration = Configuration.Current;// Configuration.Current;
            return $"{configuration.NotificationHost}/{configuration.NotificationFailedRoute}/{vendorTxCode}";
            //var urlHelper = new UrlHelper(context);
            //var routeValues = new RouteValueDictionary(new { controller = configuration.FailedController, action = configuration.FailedAction, vendorTxCode });

            //string url = urlHelper.RouteUrl(null, routeValues, configuration.Protocol, configuration.NotificationHostName);
            //return url;
        }

        public virtual string BuildSuccessfulTransactionUrl(string vendorTxCode)
        {
            var configuration = Configuration.Current;// Configuration.Current;
            return $"{configuration.NotificationHost}/{configuration.NotificationSuccessRoute}/{vendorTxCode}";
            //var urlHelper = new UrlHelper(context);
            //var routeValues = new RouteValueDictionary(new { controller = configuration.SuccessController, action = configuration.SuccessAction, vendorTxCode });

            //string url = urlHelper.RouteUrl(null, routeValues, configuration.Protocol, configuration.NotificationHostName);
            //return url;
        }

        public virtual string BuildNotificationUrl()
        {            
            var configuration = Configuration.Current;// Configuration.Current;
            return $"{configuration.NotificationHost}/{configuration.NotificationDefaultRoute}";
            //var urlHelper = new UrlHelper(context);
            //var routeValues = new RouteValueDictionary(new { controller = configuration.NotificationController, action = configuration.NotificationAction });

            //string url = urlHelper.RouteUrl(null, routeValues, configuration.Protocol, configuration.NotificationHostName);
            //return url;
        }
    }
}
