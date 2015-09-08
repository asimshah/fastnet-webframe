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
            private void SetAccomodationStates(Accomodation accomodation)
            {
                this.IsBlocked = accomodation.Availabilities.Where(x => x.Blocked).ToArray().Any(x => x.Period.Includes(this.Day));
                var bookings = accomodation.Bookings.Where(b => this.Day >= b.From && this.Day <= b.To); //todo: allow for cancelled bookings
                this.IsBooked = bookings.Count() > 0;
                if(IsBooked)
                {
                    if(bookings.Count() > 1)
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
            Debug.Print("{0} - {1}, {2}, {3}", this.Day.ToString("dddd ddMMMyyyy"), this.Status.ToString(), this.StatusDescription(), this.GetAvailabilitySummary());
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
    }
}