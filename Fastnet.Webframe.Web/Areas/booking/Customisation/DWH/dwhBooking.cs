using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class dwhBooking : booking
    {
        private static dwhBookingParameters pars;
        public string bmcMembership { get; set; }
        public string organisation { get; set; }
        public bool memberIsPrivileged { get; set; }
        //public dwhBooking(CoreDataContext ctx, Booking b) : base(ctx, b)
        //static dwhBooking()
        //{
        //    pars = Factory.GetBookingParameters() as dwhBookingParameters;
        //}
        public dwhBooking(Booking b) : base(b)
        {

        }
        protected override void SetMemberInformation(CoreDataContext ctx, MemberBase m)
        {
            base.SetMemberInformation(ctx, m);
            if(pars == null)
            {
                pars = Factory.GetBookingParameters() as dwhBookingParameters;
                pars.Load(ctx);
            }
            DWHMember dm = m as DWHMember;
            if (dm != null)
            {
                bmcMembership = dm.BMCMembership;
                organisation = dm.Organisation;
                Group privileged = ctx.Groups.Find(pars.privilegedMembers.Id);
                memberIsPrivileged = dm.IsMemberOf(privileged);
            }
        }
    }
}