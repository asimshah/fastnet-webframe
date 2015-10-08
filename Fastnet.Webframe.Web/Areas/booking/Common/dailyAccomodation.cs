using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class dailyAccomodation
    {
        public long id { get; set; }
        public string name { get; set; }
        public bool isBookable { get; set; }
        public bool isBlocked { get; set; }
        public bool isAvailableToBook { get; set; }
        public bool isBooked { get; set; }
        public string bookingReference { get; set; }
        public List<dailyAccomodation> subAccomodation { get; set; }
    }
    public class extendedDailyAccomodation : dailyAccomodation
    {
        public string memberName { get; set; }
        public string memberEmailAddress { get; set; }
        public string mobilePhoneNumber { get; set; }
    }
}