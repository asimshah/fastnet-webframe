using Fastnet.Common;
using System;
using System.Linq;


namespace Fastnet.Webframe.CoreData
{
    public enum SettingKeys
    {
        Version
    }
    public partial class SiteSetting : Core
    {
        public long SiteSettingId { get; set; }
        public string Name { get; set; }
        public string Value { get; set; }
        public static void Clear(string name)
        {
            SiteSetting ss = DataContext.SiteSettings.SingleOrDefault(x => string.Compare(name, x.Name, StringComparison.InvariantCultureIgnoreCase) == 0);
            if (ss != null)
            {
                DataContext.SiteSettings.Remove(ss);//.DeleteObject(ss);
            }
        }
        public static void Set<T>(string name, T value)
        {
            SiteSetting ss = DataContext.SiteSettings.SingleOrDefault(x => string.Compare(name, x.Name, StringComparison.InvariantCultureIgnoreCase) == 0);
            if (ss == null)
            {
                ss = new SiteSetting();
                ss.Name = name;
                DataContext.SiteSettings.Add(ss);// .AddObject(ss);
            }
            ss.Value = value.ToString();
        }
        public static void Set<T>(SettingKeys key, T value)
        {
            string name = key.ToString();
            Set<T>(name, value);
        }
        public static T Get<T>(string name, T defaultValue)
        {
            SiteSetting ss = DataContext.SiteSettings.SingleOrDefault(x => string.Compare(name, x.Name, StringComparison.InvariantCultureIgnoreCase) == 0);
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
        public static T Get<T>(SettingKeys key, T defaultValue)
        {
            string name = key.ToString();
            return Get<T>(name, defaultValue);
            //SiteSetting ss = DataContext.SiteSettings.FirstOrDefault(x => string.Compare(name, x.Name, StringComparison.InvariantCultureIgnoreCase) == 0);
            //if (ss == null)
            //{
            //    return ApplicationSettings.Key(name, defaultValue);
            //    //return defaultValue;
            //}
            //else
            //{
            //    return (T)Convert.ChangeType(ss.Value, typeof(T));
            //}
        }
    }
}