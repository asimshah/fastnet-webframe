using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class ChoiceFilter
    {
        public virtual availabilityInfo FilterChoices(DateTime start, DateTime to, availabilityInfo availabilityInfo)
        {
            return availabilityInfo;
        }
    }
}