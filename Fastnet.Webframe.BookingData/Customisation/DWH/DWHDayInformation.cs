using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    class DWHDayInformation : DayInformation
    {
        public override void PostProcess(BookingDataContext ctx, DateTime day)
        {
            base.PostProcess(ctx, day);
            if (Status == DayStatus.IsFree && day.DayOfWeek == DayOfWeek.Saturday)
            {
                Status = DayStatus.IsNotBookable;
            }
        }
        public override string StatusToString()
        {
            string descr = null;
            switch(Status)
            {
                case DayStatus.IsClosed:
                    descr = string.Format("Don Whillans Hut is closed for maintenance");//, BookingGlobals.GetLodgementName());
                    break;
                case DayStatus.IsNotBookable:
                    descr = "Saturdays are not separately bookable";
                    break;
                default:
                    descr = base.StatusToString();
                    break;
            }

            return descr;
        }
    }
}
