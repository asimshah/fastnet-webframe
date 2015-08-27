using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public class Parameter
    {
        public long ParameterId { get; set; }
        public DateTime? DateToday { get; set; }
        public bool TestMode { get; set; }
        public string AlternateAdministratorEmail { get; set; }
        public virtual Period ForwardBookingPeriod { get; set; }
        //public int EntryCodeBridgePeriod { get; set; }
        //public int EntryCodeNotificatioNPeriod { get; set; }
    }
}
