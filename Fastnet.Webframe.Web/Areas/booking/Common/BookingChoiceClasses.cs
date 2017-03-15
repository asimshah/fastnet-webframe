using Fastnet.Common;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class DailyChoices
    {
        public DateTime Day { get; set; }
        public List<BookingChoice> Choices { get; set; }
        public DailyChoices()
        {
            Choices = new List<BookingChoice>();
        }
        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendLine(string.Format("daily choice for {0}", Day.ToDefault()));
            foreach (var bc in Choices)
            {
                sb.AppendLine(string.Format("\tbooking choice for {0} people", bc.Capacity));
                foreach (var item in bc.Accomodation)
                {
                    sb.AppendLine(string.Format("\t\taccomodation: {0} for {1}", item.Name, item.Capacity));
                }
            }
            return sb.ToString();
        }
        public static IEnumerable<BookingChoice> SelectCommonChoices(IEnumerable<DailyChoices> choices)
        {
            var dailyLists = choices.Select(x => x.Choices);//.ToList();
            var commonSet = dailyLists.Aggregate((prev, next) =>
            {
                var r = prev.Intersect(next, new ChoiceComparer()).ToList();
                return r;//.ToList();
            }).ToList();

            return commonSet;// selectedChoices;
        }
    }
    public class ChoiceComparer : IEqualityComparer<BookingChoice>
    {
        public bool Equals(BookingChoice left, BookingChoice right)
        {
            //Debug.Print("Equals(): ");
            bool result = left.Accomodation.Count() == right.Accomodation.Count();
            if (result)
            {
                var leftSet = left.Accomodation.OrderBy(x => x.Type).ThenBy(x => x.Class).ThenBy(x => x.Capacity).ToArray();
                var rightSet = right.Accomodation.OrderBy(x => x.Type).ThenBy(x => x.Class).ThenBy(x => x.Capacity).ToArray();
                for (int i = 0; i < leftSet.Count(); ++i)
                {
                    bool r = leftSet[i].Type == rightSet[i].Type &&
                        leftSet[i].Class == rightSet[i].Class &&
                        leftSet[i].Capacity == rightSet[i].Capacity;
                    if (!r)
                    {
                        result = r;
                        break;
                    }
                }
            }
            return result;
        }

        public int GetHashCode(BookingChoice obj)
        {
            //Debug.Print("GetHashCode(): ");
            // always use Equals()
            return 45;
        }
    }
    public class EquivalentChoiceComparer : IEqualityComparer<BookingChoice>
    {
        public bool Equals(BookingChoice left, BookingChoice right)
        {
            bool result = left.Accomodation.Count() == right.Accomodation.Count();
            if(result)
            {
                // here we check if the underlying accomodation is the same, using the pk's
                var leftSet = left.Accomodation.Select(x => x.AccomodationId);
                var rightSet = right.Accomodation.Select(x => x.AccomodationId);
                result = leftSet.Except(rightSet).Count() == 0;
            }
            return result;
        }

        public int GetHashCode(BookingChoice obj)
        {
            // always use Equals()
            return 45;
        }
    }
    public class CostPerDay
    {
        public DateTime Day { get; set; }
        public decimal Cost { get; set; }
    }
    public class BookingChoice
    {
        public int Number { get; set; }
        public DateTime Day { get; set; }
        public IEnumerable<DayInformation.DailyAccomodation> Accomodation { get; set; }
        public int Capacity { get; set; }
        public int PartySize { get; set; }
        public List<CostPerDay> CostPerDay { get; set; } // used only by pricing
        public override string ToString()
        {
            var group = Accomodation.GroupBy(x => x.Type, x => x, (k, g) => new { Type = k, List = g, Capacity = g.Sum(zz => zz.Capacity) });
            StringBuilder sb = new StringBuilder();
            List<string> lines = new List<string>();
            foreach (var item in group)
            {
                if (item.Type == AccomodationType.Bed)
                {
                    string t = string.Format("{0} Bed{1}", item.List.Count(), item.List.Count() == 1 ? "" : "s");
                    lines.Add(t);
                }
                else
                {
                    string t = string.Format("{0} {1}{2} for {3}", item.List.Count(), item.Type.ToString(), item.List.Count() == 1 ? "" : "s", item.Capacity);
                    lines.Add(t);
                }
            }
            //lines.Add(string.Format("£{0:0.00}", this.Cost));
            var descr = lines[0];
            if (lines.Count() > 1)
            {
                descr = string.Join(", ", lines.Take(lines.Count() - 1)) + " and " + lines.Last();
            }
            // var descr = string.Join(", ", group.Select(x => string.Format("{0} {1}(s) for {2}", x.List.Count(), x.Type.ToString(), x.Capacity)).ToArray());
            return descr;// string.Format("{0} {1} capacity {2}", Day.ToString("ddMMMyyyy"), descr, Capacity);
        }
        public bookingChoice ToClientType()
        {
            bookingChoice bc = new bookingChoice();
            bc.choiceNumber = Number;
            //bc.selected = false;
            bc.totalCapacity = Capacity;
            bc.costs = new List<dailyCostItem>();
            foreach (var c in this.CostPerDay)
            {
                bc.costs.Add(new dailyCostItem { day = c.Day, cost = c.Cost });
            }
            var fd = bc.costs.First().cost;
            bc.costsAreEqualEveryDay =  bc.costs.Select(x => x.cost).All(x => x == fd);
            bc.totalCost = bc.costs.Select(x => x.cost).Sum();
            List<accomodationItem> suggested = new List<accomodationItem>();
            List<dailyAccomodation> list = new List<dailyAccomodation>();
            foreach (var item in Accomodation)
            {
                suggested.Add(new accomodationItem { id = item.AccomodationId, type = item.Type, name = item.Type.ToString(), capacity = item.Capacity });
            }
            bc.accomodationItems = suggested;
            var byGroup = bc.accomodationItems.GroupBy(x => x.type, x => x, (k, g) => new { type = k, list = g });
            List<string> lines = new List<string>();
            foreach (var typeItem in byGroup)
            {
                int count = typeItem.list.Count();
                int itemCapacity = typeItem.list.Select(x => x.capacity).Sum();
                if (typeItem.type == AccomodationType.Bed)
                {
                    lines.Add(string.Format("{0} {1}{2}", count, typeItem.type, count > 1 ? "s" : ""));
                }
                else
                {
                    lines.Add(string.Format("{0} {1}{2} for {3}", count, typeItem.type, count > 1 ? "s" : "", itemCapacity));
                }
            }
            bc.description = string.Join(" plus ", lines);
            return bc;
        }
    }
    public static class choiceExtensions
    {
        public static decimal GetPrice(this BookingDataContext ctx, MemberBase member,  DateTime dt, AccomodationType type, AccomodationClass @class, int capacity)
        {
            CoreDataContext dataContext = Core.GetDataContext();
            DateTime day = dt;
            decimal result = 0.0M;
            //AccomodationType type = type;
            //AccomodationClass @class = item.Class;
            //Debug.Print("price needed for {2} {1} on {0}", day.ToDefault(), type, @class);
            bool usingBedPrices = false;
            var prices = ctx.Prices.Where(p => p.Type == type && p.Class == @class && p.Capacity == capacity);
            if (prices.Count() == 0)
            {
                // no prices for this type and class, so get bed prices and use capacity as a multiplier
                usingBedPrices = true;
                prices = ctx.Prices.Where(p => p.Type == AccomodationType.Bed && p.Class == AccomodationClass.Standard && p.Capacity == 1);
                if (prices.Count() == 0)
                {
                    throw new Exception("Bed prices are required but are not defined");
                }
            }
            var applicablePrices = new List<Price>();
            foreach (var p in prices)
            {
                if (p.Period.Includes(day))
                {
                    applicablePrices.Add(p);
                }
            }
            var period = findNarrowestPeriod(applicablePrices.Select(x => x.Period), day);
            Price price = applicablePrices.Single(x => x.Period.PeriodId == period.PeriodId);
            if (usingBedPrices)
            {
                result = price.Amount * capacity;
            }
            else
            {
                result = price.Amount;
            }

            return result;
        }
        private static Period findNarrowestPeriod(IEnumerable<Period> periods, DateTime day)
        {
            DayOfWeek dw = day.DayOfWeek;
            Period period = periods.FirstOrDefault(p => p.PeriodType == PeriodType.DaysInWeek && p.Includes(day));
            if (period == null)
            {

                var timePeriods = periods.Where(p => p.PeriodType != PeriodType.DaysInWeek);
                List<Period> selected = new List<Period>();
                TimeSpan ts = TimeSpan.MaxValue;
                foreach (var tp in timePeriods)
                {
                    if (tp.GetDuration() <= ts)
                    {
                        selected.Add(tp);
                        ts = tp.GetDuration();
                    }
                }
                period = selected.OrderByDescending(x => x.StartDate).First();
            }
            return period;
        }
    }
}