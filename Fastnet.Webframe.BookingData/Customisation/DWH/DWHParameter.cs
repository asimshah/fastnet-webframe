using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public class DWHParameter : Parameter
    {
        public string NonBMCMembers { get; set; }
        public string BMCMembers { get; set; }
        public string PrivilegedMembers { get; set; }
        public int ShortBookingInterval { get; set; }
        public int EntryCodeNotificationPeriod { get; set; }
        public int EntryCodeBridgePeriod { get; set; }
    }
}
