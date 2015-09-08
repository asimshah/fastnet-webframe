using Fastnet.Web.Common;
using Fastnet.Webframe.BookingData;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class Factory : CustomFactory
    {
        public static MemberInfo GetMemberInfo()
        {
            switch(FactoryName)
            {
                case FactoryName.None:
                    return new MemberInfo();
                case FactoryName.DonWhillansHut:
                    return new DWHMemberInfo();
            }
            throw new ApplicationException("Unable to create a MemberInfo instance");
        }
        public static AdminParameters GetAdminParameters(dynamic data = null)
        {
            switch (FactoryName)
            {
                case FactoryName.DonWhillansHut:
                    if(data != null)
                    {
                        return ((JObject)data).ToObject<DWHAdminParameters>();
                    }
                    return new DWHAdminParameters();
            }
            if (data != null)
            {
                return ((JObject)data).ToObject<AdminParameters>();
            }
            return new AdminParameters();
        }
        public static DayInformation GetDayInformationInstance(BookingDataContext bctx, DateTime day)
        {
            switch (FactoryName)
            {
                case FactoryName.None:
                    return new DayInformation(bctx, day);
                case FactoryName.DonWhillansHut:
                    return new DWHDayInformation(bctx, day);
                default:
                    throw new ApplicationException(string.Format("No DayInformation type is available for factory", FactoryName));
            }
        }
    }
    public interface ICustomisable
    {
        void Customise();
    }
}