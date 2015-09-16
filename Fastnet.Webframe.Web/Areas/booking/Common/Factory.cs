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
        public static bookingParameters GetBookingParameters()
        {
            bookingParameters bp = null;
            switch (FactoryName)
            {
                case FactoryName.DonWhillansHut:
                    bp = new dwhBookingParameters();
                    break;
                default:
                    bp = new bookingParameters();
                    break;
            }
            bp.factoryName = FactoryName.ToString();
            return bp;
        }
        //[Obsolete]
        //public static adminParameters GetAdminParameters(dynamic data = null)
        //{
        //    switch (FactoryName)
        //    {
        //        case FactoryName.DonWhillansHut:
        //            if(data != null)
        //            {
        //                return ((JObject)data).ToObject<dwhAdminParameters>();
        //            }
        //            return new dwhAdminParameters();
        //    }
        //    if (data != null)
        //    {
        //        return ((JObject)data).ToObject<adminParameters>();
        //    }
        //    return new adminParameters();
        //}
        public static DayInformation GetDayInformationInstance(BookingDataContext bctx,long abodeId, DateTime day)
        {
            switch (FactoryName)
            {
                case FactoryName.None:
                    return new DayInformation(bctx, abodeId, day);
                case FactoryName.DonWhillansHut:
                    return new DWHDayInformation(bctx, abodeId, day);
                default:
                    throw new ApplicationException(string.Format("No DayInformation type is available for factory", FactoryName));
            }
        }
    }
}