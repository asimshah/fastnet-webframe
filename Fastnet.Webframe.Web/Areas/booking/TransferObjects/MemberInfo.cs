using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public enum BookingPermissions
    {
        Disallowed,
        WithoutConfirmation,
        WithConfirmation
    }
    public class MemberInfo
    {
        public Boolean Anonymous { get; set; }
        public string MemberId { get; set; }
        public string Fullname { get; set; }
        public string MobileNumber { get; set; }
        public BookingPermissions BookingPermission { get; set; }
        public string Explanation { get; set; }
        public string OnBehalfOfMemberId { get; set; }
        public virtual Task UpdatePermissions()
        {
            BookingPermission = BookingPermissions.WithConfirmation;
            Explanation = string.Empty;
            return Task.FromResult(0);
        }
        public virtual void CopyBookingData(MemberBase m)
        {
            Anonymous = false;
            MemberId = m.Id;
            Fullname = m.Fullname;
            MobileNumber = m.PhoneNumber;
        }
    }
}