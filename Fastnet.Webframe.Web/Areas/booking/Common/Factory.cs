using Fastnet.EventSystem;
using Fastnet.Web.Common;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
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
        //public static booking GetBooking(CoreDataContext ctx, Booking booking)
        public static booking GetBooking(Booking booking)
        {
            booking b = null;
            switch (FactoryName)
            {
                case FactoryName.DonWhillansHut:
                    //b = new dwhBooking(ctx, booking);
                    b = new dwhBooking(booking);
                    break;
                default:
                    //b = new booking(ctx, booking);
                    b = new booking(booking);
                    break;
            }
            return b;
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
            //Log.Write($"Factory name is {FactoryName.ToString()}");
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
        public static BookingStateTransitionBase GetBookingStateTransition(BookingDataContext ctx, long abodeId = 1)
        {
            switch (FactoryName)
            {
                case FactoryName.DonWhillansHut:
                    return new DWHBookingStateTransition(ctx, abodeId);
                default:
                    throw new ApplicationException(string.Format("No BookingStateTransitionBase type is available for factory", FactoryName));
            }
        }
        public static TaskBase GetRemindersTask(bool final = false)
        {
            switch (FactoryName)
            {
                case FactoryName.DonWhillansHut:
                    if (final)
                    {
                        return new DWHFinalReminders();
                    }
                    else
                    {
                        return new DWHReminders();
                    }
                default:
                    throw new ApplicationException(string.Format("No Reminder Task is available for factory", FactoryName));
            }
        }

        internal static TaskBase GetCancellationTask()
        {
            switch (FactoryName)
            {
                case FactoryName.DonWhillansHut:
                    return new DWHCancellation();
                default:
                    throw new ApplicationException(string.Format("No Cancellation Task is available for factory", FactoryName));
            }
        }
    }
}