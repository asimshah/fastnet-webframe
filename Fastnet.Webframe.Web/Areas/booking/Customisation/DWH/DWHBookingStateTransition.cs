using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using System.Threading.Tasks;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class DWHBookingStateTransition : BookingStateTransitionBase
    {
        private dwhBookingParameters pars;
        private bool isPrivileged;
        private string memberEmailAddress;
        public DWHBookingStateTransition(BookingDataContext ctx, long abodeId): base(ctx, abodeId)
        {
            isPrivileged = false;
            pars = Factory.GetBookingParameters() as dwhBookingParameters;
            
        }
        private void LoadMemberInfo(Booking booking)
        {
            using (var dc = new CoreDataContext())
            {
                pars.Load(dc);
                MemberBase m = dc.Members.Single(x => x.Id == booking.MemberId);
                var pg = dc.Groups.Single(x => x.GroupId == pars.privilegedMembers.Id);
                isPrivileged = m.IsMemberOf(pg);
                memberEmailAddress = m.EmailAddress;
            }
        }
        private void QueueEmails(Booking booking, bookingStatus? from)
        {
            string abodeName = ctx.AccomodationSet.Find(abodeId).DisplayName;
            var bookingSecretaryEmailAddress = Globals.GetBookingSecretaryEmailAddress();
            
            DateTime utcDueAt = DateTime.UtcNow;
            booking b = Factory.GetBooking(booking);
            if (from == null)
            {
                switch(booking.Status)
                {
                    case bookingStatus.WaitingApproval:
                        EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.ApprovalRequired, memberEmailAddress, b);
                        EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.WANotification, bookingSecretaryEmailAddress, b);
                        break;
                    case bookingStatus.Confirmed:
                        EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.BookingConfirmed, memberEmailAddress, b);
                        break;
                    case bookingStatus.WaitingPayment:
                        EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.WaitingPayment, memberEmailAddress, b);
                        EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.WPNotification, bookingSecretaryEmailAddress, b);
                        break;
                }
            } else
            {
                switch (from.Value)
                {
                    case bookingStatus.Confirmed:
                        // only cancelled
                        if(booking.Status == bookingStatus.Cancelled)
                        {
                            EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.Cancelled, memberEmailAddress, b);
                        }
                        break;
                    case bookingStatus.WaitingApproval:
                        // cancelled or WaitingPayment
                        switch(booking.Status)
                        {
                            case bookingStatus.Cancelled:
                                EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.Cancelled, memberEmailAddress, b);
                                break;
                            case bookingStatus.WaitingPayment:
                                EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.WaitingPayment, memberEmailAddress, b);
                                EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.WPNotification, bookingSecretaryEmailAddress, b);
                                break;
                            case bookingStatus.Confirmed:
                                EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.BookingConfirmed, memberEmailAddress, b);
                                break;
                        }
                        break;
                    case bookingStatus.WaitingPayment:
                        // cancelled or AutoCancelled or Confirmed
                        switch (booking.Status)
                        {
                            case bookingStatus.Cancelled:
                                EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.Cancelled, memberEmailAddress, b);
                                break;
                            case bookingStatus.AutoCancelled:
                                EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.AutoCancelled, memberEmailAddress, b);
                                EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.CANNotification, bookingSecretaryEmailAddress, b);
                                break;
                            case bookingStatus.Confirmed:
                                EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.BookingConfirmed, memberEmailAddress, b);
                                break;
                        }
                        break;
                }
            }
            //EmailHelper.QueueEmail(DataContext, ctx, abodeId, b, null);
        }
        public override void ToNew(Booking booking)
        {
            LoadMemberInfo(booking);
            int NDays = pars.shortBookingInterval;
            DateTime today = BookingGlobals.GetToday();
            if(booking.Under18sInParty)
            {
                booking.Status = bookingStatus.WaitingApproval;
            }
            else
            {
                //if (isPrivileged || (booking.From - today).TotalDays < NDays && booking.IsPaid)
                //{
                //    booking.Status = bookingStatus.Confirmed;
                //} else
                //{
                //    booking.Status = bookingStatus.WaitingPayment;
                //}
                if (isPrivileged)
                {
                    booking.Status = bookingStatus.Confirmed;
                }
                else if ((booking.From - today).TotalDays < NDays)
                {
                    booking.Status = bookingStatus.WaitingImmediatePayment;
                }
                else
                {
                    booking.Status = bookingStatus.WaitingPayment;
                }
            }
            booking.StatusLastChanged = DateTime.Now;
            QueueEmails(booking, null);
        }

        public override void ChangeState(Booking booking, bookingStatus from)
        {
            LoadMemberInfo(booking);
            QueueEmails(booking, from);
        }
    }
}