using Fastnet.Common;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class booking
    {
        public long bookingId { get; set; }
        public string reference { get; set; }
        public string statusName { get; set; }
        public bookingStatus status { get; set; }
        public string memberId { get; set; }
        public string memberName { get; set; }
        public string memberEmailAddress { get; set; }
        public string memberPhoneNumber { get; set; }
        public string from { get; set; }
        public string to { get; set; }
        public string description { get; set; }
        public string createdOn { get; set; }
        public int partySize { get; set; }
        public Decimal totalCost { get; set; }
        public string formattedCost { get; set; }
        public bool isPaid { get; set; }
        public bool canPay { get; set; }
        public string notes { get; set; }
        public string history { get; set; }
        public string entryInformation { get; set; }
        public bool under18sInParty { get; set; }
        public int numberOfNights { get; set; }
        public bool hasMultipleDays { get; set; }
        //public booking(CoreDataContext ctx, Booking b)
        public booking( Booking b)
        {
            this.bookingId = b.BookingId;
            this.reference = b.Reference;
            this.status = b.Status;
            this.statusName = b.Status.ToString();// "unknown";
            this.from = b.From.ToDefault();
            this.to = b.To.ToDefault();
            this.numberOfNights = (int)(b.To - b.From).TotalDays + 1;
            this.hasMultipleDays = this.numberOfNights > 1;
            this.createdOn = b.CreatedOn.ToDefault();
            this.partySize = b.PartySize;
            this.totalCost = b.TotalCost;
            this.formattedCost = string.Format("£{0:#0}", this.totalCost);
            this.isPaid = b.IsPaid;
            this.canPay = (b.Status != bookingStatus.WaitingApproval && b.Status != bookingStatus.Cancelled);
            this.notes = b.Notes;
            this.history = b.History;
            this.entryInformation = b.EntryInformation;
            this.under18sInParty = b.Under18sInParty;
            this.memberId = b.MemberId;
            this.description = b.GetAccomodationDescription();// GetAccomodationDescription(b);
            using (var ctx = new CoreDataContext())
            {
                MemberBase m = ctx.Members.Find(b.MemberId);
                SetMemberInformation(ctx, m);
            }
        }
        protected virtual void SetMemberInformation(CoreDataContext ctx, MemberBase m)
        {
            // could add firstName, lastName here
            this.memberName = m.Fullname;
            this.memberEmailAddress = m.EmailAddress;
            this.memberPhoneNumber = m.PhoneNumber;         
        }
        //private string GetAccomodationDescription(Booking b)
        //{
        //    var byGroup = b.AccomodationCollection.GroupBy(x => x.Type, x => x, (k, g) => new { type = k, list = g });
        //    List<string> lines = new List<string>();
        //    foreach (var typeItem in byGroup)
        //    {
        //        int count = typeItem.list.Count();
        //        //int itemCapacity = typeItem.list.Select(x => x.c).Sum();
        //        if (typeItem.type == AccomodationType.Bed)
        //        {
        //            lines.Add(string.Format("{0} {1}{2}", count, typeItem.type, count > 1 ? "s" : ""));
        //        }
        //        else
        //        {
        //            int capacity = typeItem.list.SelectMany(x => x.Descendants).Count(x => x.Type == AccomodationType.Bed);
        //            lines.Add(string.Format("{0} {1}{2} for {3}", count, typeItem.type, count > 1 ? "s" : "", capacity));
        //        }
        //    }
        //    return string.Join(" plus ", lines);
        //}
    }
}