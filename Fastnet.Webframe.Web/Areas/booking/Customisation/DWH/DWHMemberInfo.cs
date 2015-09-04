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
            using (CoreDataReadOnly core = new CoreDataReadOnly())
            {
                Func<string, string> formatExplanation = (text) =>
                {
                    string fmt = "<span>Booking is restricted to BMC Members. " + text + " Please contact the <a href='mailto://{0}'>Booking Secretary</a> to update our records.</span>";
                    return string.Format(fmt, Globals.GetBookingSecretaryEmailAddress());
                };
                DWHMember member = core.Members.OfType<DWHMember>().Single(x => x.Id == MemberId);
                if (member.BMCMembership == null)
                {
                    BookingDisallowed = true;
                    Explanation = formatExplanation("We have no record of your BMC Membership number.");
                }
                else
                {
                    // validate BMC Membership here
                    DWHMemberFactory mf = new DWHMemberFactory();
                    dynamic result =  await mf.ValidateBMCNumber(member.BMCMembership, member.LastName);
                    BMCMembershipStatus status = result.Status;
                    switch(status)
                    {
                        case BMCMembershipStatus.Current:
                            BookingDisallowed = false;
                            break;
                        case BMCMembershipStatus.Expired:
                            BookingDisallowed = true;
                            Explanation = formatExplanation("Your BMC membership has expired.");
                            break;
                        case BMCMembershipStatus.NotFound:
                            BookingDisallowed = true;
                            Explanation = formatExplanation("Your BMC membership has failed validation.");
                            break;
                    }
                }
            }
        }
    }
}