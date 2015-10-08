using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class DWHChoiceFilter : ChoiceFilter
    {
        public override availabilityInfo FilterChoices(DateTime start, DateTime to, availabilityInfo availabilityInfo)
        {
            List<DateTime> allDays = new List<DateTime>();
            for(DateTime dt = start; dt < to; dt = dt.AddDays(1))
            {
                allDays.Add(dt);
            }
            if (allDays.Any(x => x.DayOfWeek == DayOfWeek.Friday))
            {
                availabilityInfo.choices.RemoveAll((c) => {
                    return !(c.accomodationItems.Count() == 1 && c.accomodationItems.First().type == BookingData.AccomodationType.Hut);
                });
            }
            return availabilityInfo;
        }
    }
}