using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Areas.booking.Common;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Diagnostics;
using System.Dynamic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{

    /// <summary>
    /// A tree of nodes and their children (use Hierarchy for children and parents)
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public abstract class Tree<T> where T : Tree<T>
    {
        public abstract IEnumerable<T> GetChildren();
        public IEnumerable<T> Descendants
        {
            get
            {
                foreach (T child in this.GetChildren())
                {
                    yield return child;
                    foreach (T nc in child.Descendants)
                    {
                        yield return nc;
                    }
                }
            }
        }
        public IEnumerable<T> SelfAndDescendants
        {
            get
            {
                yield return this as T;
                foreach (T child in this.Descendants)
                {
                    yield return child;
                }
            }
        }
    }
    public class DayInformation
    {
        public class DailyAccomodation : Tree<DailyAccomodation>
        {
            public DateTime Day { get; private set; }
            public long AccomodationId { get; private set; }
            public AccomodationType Type { get; private set; }
            public AccomodationClass Class { get; private set; }
            public string Name { get; private set; }
            public bool SubAccomodationSeparatelyBookable { get; private set; }
            public bool IsBookable { get; private set; }
            public bool IsBlocked { get; private set; }
            public bool IsAvailableToBook { get; private set; }
            public bool IsBooked { get; private set; }
            public string BookingReference { get; private set; }
            public int Capacity
            {
                get
                {
                    if (Type == AccomodationType.Bed)
                    {
                        return 1;
                    }
                    return this.Descendants.Where(d => d.Type == AccomodationType.Bed).Count();
                }
            }
            public decimal Price { get; set; }
            private string MemberId { get; set; }
            public List<DailyAccomodation> Subaccomodation { get; private set; }
            public DailyAccomodation(DateTime day, Accomodation accomodation)
            {
                this.AccomodationId = accomodation.AccomodationId;
                this.Type = accomodation.Type;
                this.Class = accomodation.Class;
                this.Name = accomodation.Name;
                this.SubAccomodationSeparatelyBookable = accomodation.SubAccomodationSeparatelyBookable;
                this.IsBookable = accomodation.Bookable;
                this.Day = day;
                SetAccomodationStates(accomodation);
                this.AddChildren(accomodation.SubAccomodation);
            }
            public void SetBookability()
            {
                // by default IsAvailableToBook == false
                //Debug.Print("SetBookability(): {0} for {1}", this.Day.ToString("ddMMMyyyy"), this.Name);
                if (!this.IsBlocked)
                {
                    if (!this.IsBooked)
                    {
                        this.IsAvailableToBook = this.IsBookable && !this.Descendants.Any(x => x.IsBooked);
                        if (this.SubAccomodationSeparatelyBookable)
                        {
                            foreach (var item in this.Subaccomodation)
                            {
                                item.SetBookability();
                            }
                        }
                    }
                }

            }
            public void ShowBookability()
            {
                Debug.Print("\t{0}: Bookable: {1}, Blocked: {2}, Booked: {3}, Available: {4}",
                    this.Name, this.IsBookable, IsBlocked, IsBooked, IsAvailableToBook);
                foreach (var item in this.Subaccomodation)
                {
                    item.ShowBookability();
                }
            }
            public override IEnumerable<DailyAccomodation> GetChildren()
            {
                return Subaccomodation;
            }
            public dailyAccomodation ToClientType(bool extended = false, CoreDataContext ctx = null)
            {
                dailyAccomodation d = null;
                if (extended)
                {
                    d = new extendedDailyAccomodation();
                }
                else
                {
                    d = new dailyAccomodation();
                }
                d.name = Name;
                d.isBookable = IsBookable;
                d.isBlocked = IsBlocked;
                d.isAvailableToBook = IsAvailableToBook;
                d.isBooked = IsBooked;
                d.bookingReference = BookingReference;
                d.subAccomodation = Subaccomodation.Select(sa => sa.ToClientType(extended, ctx)).ToList();
                if (d.isBooked && extended && ctx != null)
                {
                    extendedDailyAccomodation xda = d as extendedDailyAccomodation;
                    MemberBase member = ctx.Members.Find(MemberId);
                    xda.memberName = member.Fullname;
                    xda.memberEmailAddress = member.EmailAddress;
                    if (member is DWHMember)
                    {
                        xda.mobilePhoneNumber = ((DWHMember)member).PhoneNumber;
                    }
                }
                return d;
            }
            public override string ToString()
            {
                string fmt = "{0} with {1} beds";
                return string.Format(fmt, this.Type, this.Capacity);
            }
            //public override int GetHashCode()
            //{
            //    return this.AccomodationId.GetHashCode();
            //    //return base.GetHashCode();
            //}
            //public override bool Equals(object obj)
            //{
            //    DailyAccomodation da = (DailyAccomodation)obj;
            //    return this.Type == da.Type && da.Class == this.Class && da.Capacity == this.Capacity;
            //    //return base.Equals(obj);
            //}
            private void SetAccomodationStates(Accomodation accomodation)
            {
                this.IsBlocked = accomodation.Availabilities.Where(x => x.Blocked).ToArray().Any(x => x.Period.Includes(this.Day));
                var bookings = accomodation.Bookings.Where(b => this.Day >= b.From && this.Day <= b.To); //todo: allow for cancelled bookings
                this.IsBooked = bookings.Count() > 0;
                if (IsBooked)
                {
                    if (bookings.Count() > 1)
                    {
                        Log.Write(EventSeverities.Error, "{0} booked multiple times on {1}", accomodation.Name, Day.ToString("ddMMMyyyy"));
                    }
                    var booking = bookings.First();
                    BookingReference = booking.Reference;
                    MemberId = booking.MemberId;
                }
            }
            private void AddChildren(IEnumerable<Accomodation> list)
            {
                Subaccomodation = new List<DailyAccomodation>();
                foreach (var item in list)
                {
                    Subaccomodation.Add(new DailyAccomodation(this.Day, item));
                }
            }
        }
        public DateTime Day { get; private set; }
        public DayStatus Status { get; set; }
        public List<DailyAccomodation> Accomodation { get; private set; }
        public DayInformation(BookingDataContext bctx, DateTime day)
        {
            this.Day = day;
            Accomodation = new List<DailyAccomodation>();
            foreach (var item in bctx.AccomodationSet.Where(x => x.ParentAccomodation == null))
            {
                var da = new DailyAccomodation(day, item);
                da.SetBookability();
                Accomodation.Add(da);
            }
            SetDayState();
            // Debug.Print("{0} - {1}, {2}, {3}", this.Day.ToString("dddd ddMMMyyyy"), this.Status.ToString(), this.StatusDescription(), this.GetAvailabilitySummary());
            //foreach (var item in this.Accomodation)
            //{
            //    item.ShowBookability();
            //}
        }
        public virtual void PostProcess()
        {

        }
        public virtual string StatusDescription()
        {
            string descr = null;
            switch (Status)
            {
                case DayStatus.IsClosed:
                    descr = string.Format("{0} is closed on this day", BookingGlobals.GetLodgementName());
                    break;
                case DayStatus.IsFree:
                    descr = string.Format("This day free");
                    break;
                case DayStatus.IsFull:
                    descr = string.Format("This day is fully booked");
                    break;
                case DayStatus.IsPartBooked:
                    descr = "This day is part booked";
                    break;
                case DayStatus.IsNotBookable:
                    descr = "This day is not bookable";
                    break;
            }
            return descr;
        }
        public string GetAvailabilitySummary()
        {
            StringBuilder sb = new StringBuilder();
            if (Status == DayStatus.IsPartBooked || Status == DayStatus.IsFree)
            {
                var items = Accomodation.SelectMany(x => x.SelfAndDescendants);
                List<string> descrs = new List<string>();
                int total = 0;
                AccomodationType[] values = (AccomodationType[])Enum.GetValues(typeof(AccomodationType)).Clone();
                foreach (AccomodationType at in values.Reverse())
                {
                    var c = items.Count(x => x.Type == at && x.IsAvailableToBook == true);
                    if (c > 0)
                    {
                        descrs.Add(string.Format("{0} {1}{2}", c, at.ToString(), c == 1 ? "" : "s"));
                    }
                    total += c;
                }
                sb.AppendFormat(string.Join(", ", descrs.ToArray()));
                sb.AppendFormat(" {0} available", total == 1 ? "is" : "are");
                sb.AppendLine();
            }
            else
            {
                sb.AppendLine("");
            }
            return sb.ToString().Trim();
        }
        public dayInformation ToClientType(bool includeAccomodation = false, bool extended = false, CoreDataContext ctx = null)
        {
            dayInformation d = new dayInformation();
            d.day = Day.ToString("ddMMMyyyy");
            d.formattedDay = Day.ToString("ddd ddMMMyyyy");
            d.status = Status;//.ToString();
            d.statusName = Status.ToString();
            d.statusDescription = StatusDescription();
            d.availabilitySummary = GetAvailabilitySummary();
            d.reportDetails = Status == DayStatus.IsPartBooked || Status == DayStatus.IsFull;
            d.calendarPopup = string.Format("{0}{1}", d.statusDescription, string.IsNullOrWhiteSpace(d.availabilitySummary) ? "" : "\n" + d.availabilitySummary);
            if (includeAccomodation)
            {
                d.accomodationDetails = Accomodation.Select(a => a.ToClientType(extended, ctx)).ToList();
            }
            else
            {
                d.accomodationDetails = null;
            }
            return d;
        }
        private void SetDayState()
        {
            if (this.Accomodation.All(x => x.IsBlocked))
            {
                this.Status = DayStatus.IsClosed;
            }
            else
            {
                int totalAvailableToBook = this.Accomodation.Select(x => x.SelfAndDescendants.Sum(y => y.IsAvailableToBook ? 1 : 0)).Sum();
                int totalBookable = this.Accomodation.Select(x => x.SelfAndDescendants.Sum(y => y.IsBookable ? 1 : 0)).Sum();
                if (totalAvailableToBook == 0)
                {
                    this.Status = DayStatus.IsFull;
                }
                else if (totalAvailableToBook == totalBookable)
                {
                    this.Status = DayStatus.IsFree;
                }
                else
                {
                    this.Status = DayStatus.IsPartBooked;
                }
            }
            this.PostProcess();
        }
        public IEnumerable<DailyAccomodation> FindAvailableAccomodation(AccomodationType at)
        {
            // for now we do not distinguish classes of accomodation
            return Accomodation.SelectMany(x => x.SelfAndDescendants.Where(z => z.Type == at && z.IsAvailableToBook));
        }
        public List<IEnumerable<DailyAccomodation>> FindWholeRooms(IEnumerable<DailyAccomodation> rooms, int peopleCount)
        {
            List<IEnumerable<DailyAccomodation>> list = new List<IEnumerable<DailyAccomodation>>();
            var oneroom = rooms.Where(f => f.Capacity >= peopleCount).OrderBy(x => x.Capacity).FirstOrDefault();
            if (oneroom != null)
            {
                list.Add(new DailyAccomodation[] { oneroom });
            }
            else
            {
                var largestFirst = rooms.OrderByDescending(r => r.Capacity);
                int runningTotal = 0;
                bool finished = false;
                //roomsIncapacityOrder.TakeWhile(r => (runningTotal += r.Descendants.Where(d => d.Type == AccomodationType.Bed).Count(), runningTotal < peopleCount));
                var multiRooms = largestFirst.TakeWhile(r =>
               {
                   if (finished)
                   {
                       return false;
                   }
                   runningTotal += r.Capacity;
                   finished = runningTotal >= peopleCount;
                   return true;
               }).ToArray();
                if (multiRooms.Count() > 0)
                {
                    list.Add(multiRooms);
                }
            }
            return list;
        }
        public List<IEnumerable<DailyAccomodation>> FindSplitAccomodation(IEnumerable<DailyAccomodation> rooms, int peopleCount, IEnumerable<DailyAccomodation> freeBeds)
        {
            List<IEnumerable<DailyAccomodation>> list = new List<IEnumerable<DailyAccomodation>>();
            var t = rooms.Distinct(new DailyAccomodationComparer(da => da.Capacity));
            var smallestFirst = t.OrderBy(r => r.Capacity);
            for (int i = 0; i < smallestFirst.Count(); ++i)
            {
                int runningTotal = 0;
                var multiRooms = smallestFirst.Skip(i).TakeWhile(r =>
                {
                    int required = peopleCount - runningTotal;
                    int roomCapacity = r.Capacity;
                    if (roomCapacity < required)
                    {
                        runningTotal += roomCapacity;
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                }).ToList();
                if (multiRooms.Count() > 0)
                {
                    var totalRoomCapacity = multiRooms.Sum(x => x.Capacity);
                    if (totalRoomCapacity < peopleCount)
                    {
                        // we need to add som beds
                        multiRooms.AddRange(freeBeds.Take(peopleCount - totalRoomCapacity));
                    }
                    list.Add(multiRooms);
                }
            }
            return list;
        }

    }
    class DailyAccomodationComparer : IEqualityComparer<DayInformation.DailyAccomodation>
    {
        public Func<DayInformation.DailyAccomodation, object> KeySelector { get; set; }
        public DailyAccomodationComparer(Func<DayInformation.DailyAccomodation, object> keySelector)
        {
            KeySelector = keySelector;
        }
        public bool Equals(DayInformation.DailyAccomodation x, DayInformation.DailyAccomodation y)
        {
            return KeySelector(x).Equals(KeySelector(y));
        }

        public int GetHashCode(DayInformation.DailyAccomodation obj)
        {
            return KeySelector(obj).GetHashCode();
        }
    }
    public class BookingChoice
    {
        class ChoiceComparer : IEqualityComparer<BookingChoice>
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
                // always usse Equals()
                return 45;
            }
        }
        /// <summary>
        /// Reduces a list of choices to those available on every day in the set
        /// </summary>
        /// <param name="choices"></param>
        /// <returns></returns>
        public static IEnumerable<BookingChoice> SelectCommonChoices(IEnumerable<BookingChoice> choices)
        {
            var byDay = choices.GroupBy(x => x.Day, x => x, (k, g) => new { Day = k, List = g });
            var choicesperDay = byDay.Select(x => x.List);
            var result = choicesperDay.Aggregate((prev, next) => prev.Intersect(next, new ChoiceComparer()).ToArray());
            List<BookingChoice> selectedChoices = new List<BookingChoice>();
            foreach (var dayItem in byDay)
            {
                foreach (var item in dayItem.List)
                {
                    if (result.Contains(item, new ChoiceComparer()))
                    {
                        selectedChoices.Add(item);
                    }
                }
            }
            return selectedChoices;
        }
        public DateTime Day { get; set; }
        public IEnumerable<DayInformation.DailyAccomodation> Accomodation { get; set; }
        public int Capacity { get; set; }
        public void AddPrices(BookingDataContext ctx)
        {
            foreach (var item in Accomodation)
            {
                DateTime day = this.Day;
                AccomodationType type = item.Type;
                AccomodationClass @class = item.Class;
                Debug.Print("price needed for {2} {1} on {0}", day.ToDefault(), type, @class);
                var prices = ctx.Prices.Where(p => p.Type == type && p.Class == @class);
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
                item.Price = price.Amount;
            }
        }
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
            var descr = lines[0];
            if (lines.Count() > 1)
            {
                descr = string.Join(", ", lines.Take(lines.Count() - 1)) + " and " + lines.Last();
            }
            // var descr = string.Join(", ", group.Select(x => string.Format("{0} {1}(s) for {2}", x.List.Count(), x.Type.ToString(), x.Capacity)).ToArray());
            return descr;// string.Format("{0} {1} capacity {2}", Day.ToString("ddMMMyyyy"), descr, Capacity);
        }
        private Period findNarrowestPeriod(IEnumerable<Period> periods, DateTime day)
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