using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public enum DayStatus
    {
        IsBlocked,
        IsFree,
        IsFull,
        IsPartlyBooked
    }
    public class DayInformation
    {
        public DayStatus Status { get; set; }
        public List<Accomodation> AvailableAccomodation { get; set; }
        public DayInformation()
        {
            AvailableAccomodation = new List<Accomodation>();
        }
        public override string ToString()
        {
            string descr = null;
            switch(Status)
            {
                case DayStatus.IsBlocked:
                    descr = "";
                    break;
            }
            return descr;
        }
    }
    public partial class BookingDataContext
    {
        public List<Accomodation> GetTotalAccomodation()
        {
            List<Accomodation> result = new List<Accomodation>();
            Action<IEnumerable<Accomodation>> getItem = null;
            getItem = (list) =>
            {
                //int count = 0;
                foreach (var item in list)
                {
                    if(item.Bookable)
                    {
                        result.Add(item);
                    }
                    if (item.SubAccomodationSeparatelyBookable)
                    {
                        getItem(item.SubAccomodation);
                    }
                }
            };
            var rootItems = AccomodationSet.Where(x => x.ParentAccomodation == null);
            getItem(rootItems);
            return result;
        }
        public IEnumerable<Accomodation> GetAvailableAccomodation(DateTime day)
        {
            var allAccomodation = GetTotalAccomodation();
            return allAccomodation.Where(x => !x.IsBlocked(day)).ToArray();
        }
        public DayInformation GetDayInformation(DateTime day)
        {
            DayInformation di = new DayInformation();
            var availableAccomodation = GetAvailableAccomodation(day);
            if(availableAccomodation.Count() == 0)
            {
                di.Status = DayStatus.IsBlocked;
            }
            else
            {
                foreach(var item in availableAccomodation)
                {
                    if(item.IsFree(day))
                    {
                        di.AvailableAccomodation.Add(item);
                    }
                }
                di.Status = di.AvailableAccomodation.Count() == 0 ? DayStatus.IsFull
                    : di.AvailableAccomodation.Count() == availableAccomodation.Count() ? DayStatus.IsFree : DayStatus.IsPartlyBooked;
            }
            return di;
        }
    }
}
