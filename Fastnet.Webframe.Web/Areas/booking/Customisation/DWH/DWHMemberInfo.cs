using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class DWHMemberInfo : MemberInfo
    {
        public override async Task UpdatePermissions()
        {
            await base.UpdatePermissions();
            using (var bctx = new BookingDataContext())
            {
                var para = bctx.Parameters.OfType<DWHParameter>().Single();
                //using (CoreDataReadOnly core = new CoreDataReadOnly())
                //{
                //    Group privileged = core.Groups.SingleOrDefault(x => x.Name == para.PrivilegedMembers);
                //    DWHMember member = core.Members.OfType<DWHMember>().Single(x => x.Id == MemberId);
                //    if(member.IsMemberOf(privileged))
                //    {
                //        BookingPermission = BookingPermissions.ShortTermBookingWithoutPaymentAllowed;
                //    }
                //}
                using (CoreDataContext core = new CoreDataContext())
                {
                    Group privileged = core.Groups.SingleOrDefault(x => x.Name == para.PrivilegedMembers);
                    DWHMember member = core.Members.OfType<DWHMember>().Single(x => x.Id == MemberId);
                    if (member.IsMemberOf(privileged))
                    {
                        BookingPermission = BookingPermissions.ShortTermBookingWithoutPaymentAllowed;
                    }
                    else
                    {
                        BookingPermission = BookingPermissions.ShortTermBookingAllowed;
                    }
                }
            }
        }

    }
}