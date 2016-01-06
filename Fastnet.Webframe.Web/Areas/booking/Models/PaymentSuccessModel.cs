using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class PaymentSuccessModel
    {
        public string BookingReference { get; set; }
        public string BookingSecretaryEmailAddress { get; set; }
        public string MemberEmailAddress { get; set; }

    }
    public class PaymentFailedModel
    {
        public string BookingReference { get; set; }
        public string BookingSecretaryEmailAddress { get; set; }
        public string MemberEmailAddress { get; set; }
        public string UiSource { get; set; }
    }
}