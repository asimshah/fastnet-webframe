using Fastnet.Webframe.Web.Common;
using System.Web;
using System.Web.Mvc;

namespace Fastnet.Webframe.Web
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
            //filters.Add(new ActionLogging());
        }
    }
}
