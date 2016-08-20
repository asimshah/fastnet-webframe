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
        public int PaymentInterval { get; set; } // tbd: rename to PaymentInterval
        public int EntryCodeNotificationInterval { get; set; } //tbd: rename to EntryCodeNotificationInterval
        public int EntryCodeBridgeInterval { get; set; } // tbd: rename to Entry Code Bridge Interval
        public int CancellationInterval { get; set; }
        public int FirstReminderInterval { get; set; }
        public int SecondReminderInterval { get; set; }
        public int ReminderSuppressionInterval { get; set; }
        // tbd: add following properties:
        /*
         * public int CancellationInterval { get; set; }
         * public int FirstReminderInterval { get; set; }
         * public int SecondReminderInterval { get; set; }
         * public int ReminderSuppressionInterval { get; set; }
         */
    }
}
