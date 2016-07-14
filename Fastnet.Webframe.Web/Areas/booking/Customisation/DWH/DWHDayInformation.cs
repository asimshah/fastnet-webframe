using Fastnet.Webframe.BookingData;
using System;

namespace Fastnet.Webframe.Web.Areas.booking
{
    class DWHDayInformation : DayInformation
    {
        public DWHDayInformation(BookingDataContext ctx, long abodeId, DateTime day): base(ctx, abodeId, day)
        {

        }
        public override void PostProcess()
        {
            //base.PostProcess(ctx, day);
            if (Status == DayStatus.IsFree && this.Day.DayOfWeek == DayOfWeek.Saturday)
            {
                Status = DayStatus.IsNotBookable;
            }
        }
        public override string StatusDescription()
        {
            string descr = null;
            switch (Status)
            {
                case DayStatus.IsClosed:
                    descr = string.Format("Don Whillans Hut is closed for bookings");//, BookingGlobals.GetLodgementName());
                    break;
                case DayStatus.IsNotBookable:
                    descr = "Saturdays are not separately bookable";
                    break;
                default:
                    descr = base.StatusDescription();
                    break;
            }

            return descr;
        }
    }
}