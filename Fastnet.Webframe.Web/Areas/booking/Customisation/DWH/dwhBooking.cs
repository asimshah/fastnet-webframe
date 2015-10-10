using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class dwhBooking : booking
    {
        public string bmcMembership { get; set; }
        public string organisation { get; set; }
        public dwhBooking(CoreDataContext ctx, Booking b) : base(ctx, b)
        {

        }
        protected override void SetMemberInformation(MemberBase m)
        {
            base.SetMemberInformation(m);
            DWHMember dm = m as DWHMember;
            if (dm != null)
            {
                bmcMembership = dm.BMCMembership;
                organisation = dm.Organisation;
            }
        }
    }
}