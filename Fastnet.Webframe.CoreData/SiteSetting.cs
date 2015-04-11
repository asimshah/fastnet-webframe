using Autofac;
using Autofac.Core;
using Fastnet.Common;
using Fastnet.Webframe;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;


namespace Fastnet.Webframe.CoreData
{
    public partial class SiteSetting : Core
    {
        public long SiteSettingId { get; set; }
        public string Name { get; set; }
        public string Value { get; set; }
        public static void Clear(string name)
        {
            SiteSetting ss = DataContext.SiteSettings.FirstOrDefault(x => string.Compare(name, x.Name, StringComparison.InvariantCultureIgnoreCase) == 0);
            if (ss != null)
            {
                DataContext.SiteSettings.Remove(ss);//.DeleteObject(ss);
            }
        }
        public static void Set<T>(string name, T value)
        {
            SiteSetting ss = DataContext.SiteSettings.FirstOrDefault(x => string.Compare(name, x.Name, StringComparison.InvariantCultureIgnoreCase) == 0);
            if (ss == null)
            {
                ss = new SiteSetting();
                ss.Name = name;
                DataContext.SiteSettings.Add(ss);// .AddObject(ss);
            }
            ss.Value = value.ToString();
        }
        public static T Get<T>(string name, T defaultValue)
        {
            SiteSetting ss = DataContext.SiteSettings.FirstOrDefault(x => string.Compare(name, x.Name, StringComparison.InvariantCultureIgnoreCase) == 0);
            if (ss == null)
            {
                return ApplicationSettings.Key(name, defaultValue);
                //return defaultValue;
            }
            else
            {
                return (T)Convert.ChangeType(ss.Value, typeof(T));
            }
        }
    }
}