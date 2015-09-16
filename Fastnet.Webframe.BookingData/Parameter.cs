using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    [Table("Parameters")]
    public class ParameterBase
    {
        [Key]
        public long ParameterId { get; set; }
        public DateTime? DateToday { get; set; }
        public bool TestMode { get; set; }
        public string BookingSecretaryEmailAddress { get; set; }
        public virtual Period ForwardBookingPeriod { get; set; }
        public string TermsAndConditionsUrl { get; set; }
        //public int EntryCodeBridgePeriod { get; set; }
        //public int EntryCodeNotificatioNPeriod { get; set; }
    }
    public class Parameter : ParameterBase
    {

    }
}
