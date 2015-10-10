using Fastnet.Common;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class booking
    {
        public long bookingId { get; set; }
        public string reference { get; set; }
        public string status { get; set; }
        public string memberId { get; set; }
        public string memberName { get; set; }
        public string memberEmailAddress { get; set; }
        public string memberPhoneNumber { get; set; }
        public string from { get; set; }
        public string to { get; set; }
        public string createdOn { get; set; }
        public Decimal totalCost { get; set; }
        public string formattedCost { get; set; }
        public bool isPaid { get; set; }
        public string notes { get; set; }
        public string entryInformation { get; set; }
        public bool under18sInParty { get; set; }
        public int numberOfNights { get; set; }
        public bool hasMultipleDays { get; set; }
        public booking(CoreDataContext ctx, Booking b)
        {
            this.bookingId = b.BookingId;
            this.reference = b.Reference;
            this.status = b.Status.ToString();// "unknown";
            this.from = b.From.ToDefault();
            this.to = b.To.ToDefault();
            this.numberOfNights = (int)(b.To - b.From).TotalDays + 1;
            this.hasMultipleDays = this.numberOfNights > 1;
            this.createdOn = b.CreatedOn.ToDefault();
            this.totalCost = b.TotalCost;
            this.formattedCost = string.Format("£{0:#0}", this.totalCost);
            this.isPaid = b.IsPaid;
            this.notes = b.Notes;
            this.entryInformation = b.EntryInformation;
            this.under18sInParty = b.Under18sInParty;
            this.memberId = b.MemberId;
            MemberBase m = ctx.Members.Find(b.MemberId);
            SetMemberInformation(m);
        }
        protected virtual void SetMemberInformation(MemberBase m)
        {
            this.memberName = m.Fullname;
            this.memberEmailAddress = m.EmailAddress;
            this.memberPhoneNumber = m.PhoneNumber;
        }
    }
}