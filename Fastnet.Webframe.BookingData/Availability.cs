using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public class Availability
    {
        public int AvailabilityId { get; set; }
        public string Description { get; set; }
        public virtual Accomodation Accomodation { get; set; }
        public virtual Period Period { get; set; }
        public bool Blocked { get; set; }
    }
}
