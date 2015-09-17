using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;

namespace Fastnet.Webframe.Web.Areas.booking
{

    public class dwhBookingParameters : bookingParameters
    {
        public IGroup noBMCCheckGroup { get; set; }
        public int shortBookingInterval { get; set; }
        protected override void BeforeSave(ParameterBase para)
        {
            if (para is DWHParameter)
            {
                var p = para as DWHParameter;
                p.NoBMCCheckGroup = this.noBMCCheckGroup?.Name;
                p.ShortBookingInterval = this.shortBookingInterval;
            }
        }
        protected override void AfterLoad(CoreDataContext core, ParameterBase para)
        {
            var p = para as DWHParameter;
            if (p != null)
            {
                if (!string.IsNullOrWhiteSpace(p.NoBMCCheckGroup))
                {
                    Group NoBMCCheckGroup = core.Groups.SingleOrDefault(g => g.Name == p.NoBMCCheckGroup);
                    this.noBMCCheckGroup = new IGroup { Id = NoBMCCheckGroup.GroupId, Name = NoBMCCheckGroup.Name };
                }
                this.shortBookingInterval = p.ShortBookingInterval;
            }
        }
    }
}