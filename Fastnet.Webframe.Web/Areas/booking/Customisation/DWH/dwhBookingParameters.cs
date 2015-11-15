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
        public IGroup nonBMCMembers { get; set; }
        public IGroup privilegedMembers { get; set; }
        public int shortBookingInterval { get; set; }
        protected override void BeforeSave(ParameterBase para)
        {
            if (para is DWHParameter)
            {
                var p = para as DWHParameter;
                p.NonBMCMembers = this.nonBMCMembers?.Name;
                p.ShortBookingInterval = this.shortBookingInterval;
                p.PrivilegedMembers = this.privilegedMembers?.Name;
            }
        }
        protected override void AfterLoad(CoreDataContext core, ParameterBase para)
        {
            var p = para as DWHParameter;
            if (p != null)
            {
                if (!string.IsNullOrWhiteSpace(p.NonBMCMembers))
                {
                    Group NonBMCMembers = core.Groups.SingleOrDefault(g => g.Name == p.NonBMCMembers);
                    Group PrivilegedMembers = core.Groups.SingleOrDefault(g => g.Name == p.PrivilegedMembers);
                    this.nonBMCMembers = new IGroup { Id = NonBMCMembers.GroupId, Name = NonBMCMembers.Name };
                    this.privilegedMembers = new IGroup { Id = PrivilegedMembers.GroupId, Name = PrivilegedMembers.Name };
                }
                this.shortBookingInterval = p.ShortBookingInterval;
            }
        }
    }
}