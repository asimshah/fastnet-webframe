using Fastnet.Web.Common;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Common
{
    public class BundleFactory2 : CustomFactory
    {
        private string appName = null;
        public BundleFactory2(string appName = null)
        {
            this.appName = appName;
        }
        public string[] GetScripts(string path)
        {
            Func<dynamic, string[]> fromJsonXScripts = (di) =>
             {
                 var scriptItems = ((JArray)di.XScripts).ToObject<dynamic[]>();
                 var scriptItem = scriptItems.SingleOrDefault(x => x.path == path);
                 var files = ((JArray)scriptItem.files).ToObject<string[]>();
                 return files;
             };
            if (FactoryName != FactoryName.None)
            {
                if (this.appName != null)
                {
                    dynamic apps = Settings?.apps;
                    if (apps != null)
                    {
                        var definedApps = ((JArray)apps).ToObject<dynamic[]>();
                        var targetApp = definedApps.SingleOrDefault(x => x.Name == this.appName).ToObject<dynamic>();
                        if (targetApp != null)
                        {
                            return fromJsonXScripts(targetApp);
                            //var scriptItems = ((JArray)targetApp.XScripts).ToObject<dynamic[]>();
                            //var scriptItem = scriptItems.SingleOrDefault(x => x.path == path);
                            //var files = ((JArray)scriptItem.files).ToObject<string[]>();
                            //return files;
                        }
                    }
                }
                else
                {
                    return fromJsonXScripts(Settings);
                }
            }
            return new string[0];
        }
    }
    public class BundleFactory : CustomFactory
    {
        public string[] CSSFiles { get; set; }
        public string[] Scripts { get; set; }
        public string[] AppScripts { get; set; } = new string[0];
        public BundleFactory(string appName = null)
        {
            if (FactoryName != FactoryName.None)
            {
                CSSFiles = Settings.CSSFiles == null ? new string[0] : ((JArray)Settings.CSSFiles).ToObject<string[]>();
                Scripts = Settings.Scripts == null ? new string[0] : ((JArray)Settings.Scripts).ToObject<string[]>();
                if (appName != null)
                {
                    dynamic[] apps = Settings.apps == null ? new dynamic[0] : ((JArray)Settings.apps).ToObject<dynamic[]>();
                    foreach (var app in apps)
                    {
                        if (app.Name == appName)
                        {
                            AppScripts = app.Scripts == null ? new string[0] : ((JArray)app.Scripts).ToObject<string[]>();
                            break;
                        }
                    }
                }
            }
            else
            {
                CSSFiles = new string[0];
                Scripts = new string[0];
            }
        }
    }
}