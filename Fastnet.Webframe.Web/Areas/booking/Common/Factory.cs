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
        public static ChoiceFilter GetChoiceFilter()
        {
            switch (FactoryName)
            {
                case FactoryName.None:
                    return new ChoiceFilter();
                case FactoryName.DonWhillansHut:
                    return new DWHChoiceFilter();
                default:
                    throw new ApplicationException(string.Format("No ChoiceFilter type is available for factory", FactoryName));
            }
        }
    }
}