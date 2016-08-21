using Fastnet.Webframe.BookingData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{

    public class accomodationItem
    {
        public long id { get; set; }
        public AccomodationType type { get; set; }
        public string name { get; set; }
        public int capacity { get; set; }
    }
    public class bookingChoice
    {
        public int choiceNumber { get; set; }
        //public bool selected { get; set; }
        public int totalCapacity { get; set; }
        public int partySize { get; set; }
        public List<dailyCostItem> costs { get; set; }
        public bool costsAreEqualEveryDay { get; set; }
        public decimal totalCost { get; set; }
        public string formattedCost { get; set; }
        public IEnumerable<accomodationItem> accomodationItems { get; set; }
        public string description { get; set; }
    }
    public class bookingRequest
    {
        public string fromDate { get; set; }
        public string toDate { get; set; }
        public bookingChoice choice { get; set; }
        public bool under18spresent { get; set; }
        public bool isPaid { get; set; }
        public string phoneNumber { get; set; }
        public int partySize { get; set; }
    }
}