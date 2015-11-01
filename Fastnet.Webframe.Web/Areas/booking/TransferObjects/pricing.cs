using Fastnet.Webframe.BookingData;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class pricing
    {
        public long priceId { get; set; }
        public decimal amount { get; set; }
        public bool isRolling { get; set;}
        public DateTime from { get; set; }
        public DateTime? to { get; set; }
        public pricing(Price p)
        {
            this.priceId = p.PriceId;
            this.amount = p.Amount;
            this.isRolling = p.Period.PeriodType == PeriodType.Rolling;
            this.from = p.Period.GetStartDate();
            if (!isRolling)
            {
                this.to = p.Period.GetEndDate();
            }
        }
    }
}