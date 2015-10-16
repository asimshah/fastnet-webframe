using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;

namespace Fastnet.Webframe.Web.Common
{
    public static  class BundleExtensions
    {
        public static Bundle AddCustomScripts(this Bundle bundle, string appName)
        {
            BundleFactory2 bf = new BundleFactory2(appName);
            foreach (var scriptFile in bf.GetScripts(bundle.Path))
            {
                bundle.Include(scriptFile);
            }
            return bundle;
        }
    }
}