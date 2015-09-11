using System.Collections.Generic;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public enum DayStatus
    {
        IsClosed,
        IsFree,
        IsFull,
        IsPartBooked,
        IsNotBookable
    }
    public class dayInformation
    {
        public string day { get; set; }
        public string formattedDay { get; set; }
        public DayStatus status { get; set; }
        public string statusName { get; set; }
        public string statusDescription { get; set; }
        public string availabilitySummary { get; set; }
        public bool reportDetails { get; set; }
        public string calendarPopup { get; set; }
        //public List<dailyAccomodation> accomodationDetails { get; set; }
        public dailyAccomodation accomodationDetails { get; set; }
    }
}