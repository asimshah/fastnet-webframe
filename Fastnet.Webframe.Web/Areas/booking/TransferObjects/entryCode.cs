using Fastnet.Common;
using Fastnet.Webframe.BookingData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class entryCode
    {
        public long entryCodeId { get; set; }
        public string applicableFrom { get; set; }
        public string code { get; set; }
        public entryCode(EntryCode ec)
        {
            this.entryCodeId = ec.EntryCodeId;
            this.applicableFrom = ec.ApplicableFrom.ToDefault();
            this.code = ec.Code;
        }
    }
}