using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public class EntryCode
    {
        public long EntryCodeId { get; set; }
        public DateTime ApplicableFrom { get; set; }
        [MaxLength(128)]
        public string Code { get; set; }
    }
}
