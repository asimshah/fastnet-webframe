using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class MemberInfo
    {
        public Boolean Anonymous { get; set; }
        public string MemberId { get; set; }
        public string Fullname { get; set; }
        public bool BookingDisallowed { get; set; }
        public string Explanation { get; set; }
        public virtual Task UpdatePermissions()
        {
            BookingDisallowed = false;
            Explanation = string.Empty;
            return Task.FromResult(0);
        }
    }
}