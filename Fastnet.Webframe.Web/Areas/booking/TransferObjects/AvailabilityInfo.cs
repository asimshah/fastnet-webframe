using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class dailyCostItem
    {
        public DateTime day { get; set; }
        public decimal cost { get; set; }
    }
    public class availabilityInfo
    {
        public bool success { get; set; }
        public string explanation { get; set; }
        
        public List<bookingChoice> choices { get; set; }
        public availabilityInfo()
        {
            choices = new List<bookingChoice>();
        }
        public void AddChoice(BookingChoice choice) {
            choice.Number = choices.Count() + 1;
            choices.Add(choice.ToClientType());
        }
            
    }
}