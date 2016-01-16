using Fastnet.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{

    public class Booking
    {
        private ICollection<Accomodation> accomodationSet;
        private ICollection<BookingEmail> emails;
        public long BookingId { get; set; }
        public bookingStatus Status { get; set; }
        [MaxLength(32)]
        public string Reference { get; set; }
        [MaxLength(128)]
        public string MemberId { get; set; }
        public DateTime From { get; set; }
        public DateTime To { get; set; } // **NB** From/To are inclusive dates, i.e. for a one day booking To will equal From
        public DateTime CreatedOn { get; set; }
        public DateTime StatusLastChanged { get; set; }
        public Decimal TotalCost { get; set; }
        public int PartySize { get; set; }
        public bool IsPaid { get; set; }
        public string Notes { get; set; }
        public string History { get; set; }
        [MaxLength(128)]
        public string EntryInformation { get; set; }
        public bool Under18sInParty { get; set; }
        public virtual ICollection<Accomodation> AccomodationCollection
        {
            get { return accomodationSet ?? (accomodationSet = new HashSet<Accomodation>()); }
            set { accomodationSet = value; }
        }
        public virtual ICollection<BookingEmail> Emails
        {
            get { return emails ?? (emails = new HashSet<BookingEmail>()); }
            set { emails = value; }
        }
        public void AddHistory(string name, string text)
        {
            var today = BookingGlobals.GetToday();
            var time = DateTime.UtcNow;
            text = string.Format("<div class='system-note'><span class='notes-timestamp'>{1} {2}</span> <span class='notes-by'>{0}</span>: <span class='notes-text'>{3}</span><div>",
                name, today.ToDefault(), time.ToString("HH:mm:ss"), text) + System.Environment.NewLine;
            this.History = text + this.History;
        }
        public void SetPaid(BookingDataContext ctx, string memberFullname, bool paid, long abodeId = 1)
        {
            //bookingStatus oldStatus = this.Status;
            //this.Status = bookingStatus.Confirmed;
            this.IsPaid = paid;
            this.AddHistory(memberFullname, string.Format("Mark as {0}", paid ? "paid" : "not paid"));
            //return oldStatus;
            //var bst = Factory.GetBookingStateTransition(ctx, abodeId);
            //if (booking.Status != oldStatus)
            //{
            //    booking.StatusLastChanged = DateTime.Now;
            //    bst.ChangeState(booking, oldStatus);
            //}
        }
        //public string GetAccomodationDescription(Booking b)
        public string GetAccomodationDescription()
        {
            var byGroup = this.AccomodationCollection.GroupBy(x => x.Type, x => x, (k, g) => new { type = k, list = g });
            List<string> lines = new List<string>();
            foreach (var typeItem in byGroup)
            {
                int count = typeItem.list.Count();
                //int itemCapacity = typeItem.list.Select(x => x.c).Sum();
                if (typeItem.type == AccomodationType.Bed)
                {
                    lines.Add(string.Format("{0} {1}{2}", count, typeItem.type, count > 1 ? "s" : ""));
                }
                else
                {
                    int capacity = typeItem.list.SelectMany(x => x.Descendants).Count(x => x.Type == AccomodationType.Bed);
                    lines.Add(string.Format("{0} {1}{2} for {3}", count, typeItem.type, count > 1 ? "s" : "", capacity));
                }
            }
            return string.Join(" plus ", lines);
        }
    }

}
