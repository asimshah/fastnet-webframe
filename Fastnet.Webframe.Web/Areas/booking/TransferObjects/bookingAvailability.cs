using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.bookings
{
    public class blockedPeriod
    {
        public long availabilityId { get; set; }
        public DateTime startsOn { get; set; }
        public DateTime endsOn { get; set; }
        public string remarks { get; set; }
    }
    public class bookingAvailability
    {
        public bool bookingOpen { get; set; }
        public List<blockedPeriod> blockedPeriods { get; set; }

    }
}