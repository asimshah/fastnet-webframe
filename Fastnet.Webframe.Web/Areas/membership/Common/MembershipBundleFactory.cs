using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Fastnet.Web.Common;
using Newtonsoft.Json.Linq;
using Fastnet.Webframe.Web.Common;

namespace Fastnet.Webframe.Web.Areas.membership.Common
{
    public class MembershipBundleFactory : BundleFactory
    {
        public string[] MembershipScripts { get; set; } = new string[0];
        public MembershipBundleFactory()
        {
            if (FactoryName != FactoryName.None)
            {
                dynamic[] apps = Settings.apps == null ? new dynamic[0] : ((JArray)Settings.apps).ToObject<dynamic[]>();
                foreach(var app in apps)
                {
                    if(app.Name == "membership")
                    {
                        MembershipScripts = app.Scripts == null ? new string[0] : ((JArray)app.Scripts).ToObject<string[]>();
                        break;
                    }
                }
            }
        }
    }
}