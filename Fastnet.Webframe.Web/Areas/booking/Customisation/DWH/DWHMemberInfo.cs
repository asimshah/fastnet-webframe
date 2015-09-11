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
                using (CoreDataReadOnly core = new CoreDataReadOnly())
                {
                    Func<string, string> formatExplanation = (text) =>
                    {
                        string fmt = "<span>Booking is restricted to BMC Members. " + text + " Please contact the <a href='mailto://{0}'>Booking Secretary</a> to update our records.</span>";
                        return string.Format(fmt, Globals.GetBookingSecretaryEmailAddress());
                    };
                    Group noCheckGroup = null;
                    Group bmcMembers = null;
                    if (para.NoBMCCheckGroup != null)
                    {
                        noCheckGroup = core.Groups.SingleOrDefault(x => x.Name == para.NoBMCCheckGroup);
                    }
                    if (para.BMCMembers != null)
                    {
                        bmcMembers = core.Groups.SingleOrDefault(x => x.Name == para.BMCMembers);
                    }
                    DWHMember member = core.Members.OfType<DWHMember>().Single(x => x.Id == MemberId);
                    //if(noCheckGroup != null && member.IsMemberOf(noCheckGroup)) {
                    //    BookingDisallowed = false;
                    //}
                    //else
                    //{
                    BookingPermission = BookingPermissions.WithConfirmation;

                    if (member.IsMemberOf(bmcMembers) || member.IsMemberOf(noCheckGroup))
                    {
                        BookingPermission = BookingPermissions.WithConfirmation;
                    }

                    else
                    {
                        Explanation = formatExplanation("You are not a member of the BMC");
                    }
                }
            }
        }
    }
}