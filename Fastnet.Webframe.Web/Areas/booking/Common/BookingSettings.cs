using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public enum BookingSettingKeys
    {
        OnlineBookingClosed
    }
    public static class BookingSettings
    {
        public static void Set<T>(BookingSettingKeys key, T value)
        {
            string name = key.ToString();
            SiteSetting.Set<T>(name, value);
        }
        public static T Get<T>(BookingSettingKeys key, T defaultValue)
        {
            string name = key.ToString();
            return SiteSetting.Get<T>(name, defaultValue);
        }
    }
}