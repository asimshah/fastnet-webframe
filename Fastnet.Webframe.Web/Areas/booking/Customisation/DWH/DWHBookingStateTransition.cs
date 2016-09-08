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
        private int paymentInterval;
        private DateTime today;
        private string memberEmailAddress;
        private bool paymentGatewayAvailable;
        public DWHBookingStateTransition(BookingDataContext ctx, long abodeId): base(ctx, abodeId)
        {
            isPrivileged = false;
            pars = Factory.GetBookingParameters() as dwhBookingParameters;
            paymentInterval = pars.paymentInterval;
            today = BookingGlobals.GetToday();
            paymentGatewayAvailable = pars.paymentGatewayAvailable;
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
        private void QueueEmails(Booking booking, bookingStatus? from, bookingStatus to, bool bySystem)
        {
            string abodeName = ctx.AccomodationSet.Find(abodeId).DisplayName;
            var bookingSecretaryEmailAddress = Globals.GetBookingSecretaryEmailAddress();
            
            DateTime utcDueAt = DateTime.UtcNow;
            booking b = Factory.GetBooking(booking);
            if (from.HasValue == false) // this is a new booking
            {
                NewBookingEmail(to, abodeName, bookingSecretaryEmailAddress, utcDueAt, booking, b);
            }
            else
            {
                ExistingBookingEmail(from.Value, to, abodeName, bookingSecretaryEmailAddress, utcDueAt, booking, b, bySystem);
            }
        }

        private void NewBookingEmail(bookingStatus to, string abodeName, string bookingSecretaryEmailAddress, DateTime utcDueAt, Booking booking, booking b)
        {
            switch (to)
            {
                case bookingStatus.WaitingApproval:
                    EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.ApprovalRequired, memberEmailAddress, b);
                    EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.WANotification, bookingSecretaryEmailAddress, b);
                    break;
                case bookingStatus.WaitingPayment:
                    var emailTemplate = SelectWaitingPaymentEmail(booking);
                    EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, emailTemplate, memberEmailAddress, b);
                    EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.WPNotification, bookingSecretaryEmailAddress, b);
                    break;
                case bookingStatus.Confirmed:
                    EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.ConfirmedPriv, memberEmailAddress, b);
                    break;
                case bookingStatus.Cancelled:
                case bookingStatus.WaitingGateway:
                    break;
            }
        }
        private void ExistingBookingEmail(bookingStatus from, bookingStatus to, string abodeName, string bookingSecretaryEmailAddress, DateTime utcDueAt, Booking booking, booking b, bool bySystem)
        {
            switch (from)
            {
                case bookingStatus.Cancelled:
                    switch (to)
                    {
                        case bookingStatus.Cancelled:
                        case bookingStatus.Confirmed:
                        case bookingStatus.WaitingApproval:
                        case bookingStatus.WaitingGateway:
                        case bookingStatus.WaitingPayment:
                            break;
                    }
                    break;
                case bookingStatus.Confirmed:
                    switch (to)
                    {
                        case bookingStatus.Cancelled:
                            EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.Cancelled, memberEmailAddress, b);
                            break;
                        case bookingStatus.Confirmed:
                        case bookingStatus.WaitingApproval:
                        case bookingStatus.WaitingGateway:
                        case bookingStatus.WaitingPayment:
                            break;
                    }
                    break;
                case bookingStatus.WaitingApproval:
                    switch (to)
                    {
                        case bookingStatus.Cancelled:
                            EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.Cancelled, memberEmailAddress, b);
                            break;
                        case bookingStatus.Confirmed:
                            EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.ConfirmedPriv, memberEmailAddress, b);
                            break;
                        case bookingStatus.WaitingPayment:
                            var emailTemplate = SelectWaitingPaymentEmail(booking);
                            EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, emailTemplate, memberEmailAddress, b);

                            EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.WPNotification, bookingSecretaryEmailAddress, b);
                            break;
                        case bookingStatus.WaitingApproval:
                        case bookingStatus.WaitingGateway:
                            break;
                    }
                    break;
                case bookingStatus.WaitingGateway:
                    switch (to)
                    {
                        case bookingStatus.Cancelled:
                            // what about cancelled by admin? - no email is correct I think (as the member never knew he had a booking)
                            // query this with Mike
                            //EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.AutoCancelled, memberEmailAddress, b);
                            //EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.CANNotification, memberEmailAddress, b);
                            break;
                        case bookingStatus.Confirmed:
                            EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.ConfirmedNonPriv, memberEmailAddress, b);
                            break;
                        case bookingStatus.WaitingApproval:
                        case bookingStatus.WaitingGateway:
                        case bookingStatus.WaitingPayment:
                            break;
                    }
                    break;
                case bookingStatus.WaitingPayment:
                    switch (to)
                    {
                        case bookingStatus.Cancelled:
                            if (bySystem)
                            {
                                EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.AutoCancelled, memberEmailAddress, b);
                                EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.CANNotification, memberEmailAddress, b);
                            }
                            else
                            {
                                EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.Cancelled, memberEmailAddress, b);
                            }
                            break;
                        case bookingStatus.Confirmed:
                            EmailHelper.QueueEmail(this.ctx, abodeName, bookingSecretaryEmailAddress, utcDueAt, BookingEmailTemplates.ConfirmedNonPriv, memberEmailAddress, b);
                            break;
                        case bookingStatus.WaitingApproval:
                        case bookingStatus.WaitingGateway:
                        case bookingStatus.WaitingPayment:
                            break;
                    }
                    break;
            }
        }
        private BookingEmailTemplates SelectWaitingPaymentEmail(Booking b)
        {
            return b.From <= today.AddDays(paymentInterval) ? BookingEmailTemplates.WaitingDuePayment : BookingEmailTemplates.WaitingPayment;
        }

        public override bookingStatus GetInitialState(Booking booking)
        {
            bookingStatus initial;
            LoadMemberInfo(booking);
            if (booking.Under18sInParty)
            {
                initial = bookingStatus.WaitingApproval;
            }
            else
            {
                if (isPrivileged)
                {
                    initial = bookingStatus.Confirmed;
                }
                else if (paymentGatewayAvailable && (booking.From - today).TotalDays < paymentInterval)
                {
                    initial = bookingStatus.WaitingGateway;
                }
                else
                {
                    initial = bookingStatus.WaitingPayment;
                }
            }
            return initial;
        }
        public override bookingStatus GetPostApprovalState(Booking booking)
        {
            LoadMemberInfo(booking);
            return isPrivileged ? bookingStatus.Confirmed : bookingStatus.WaitingPayment;
        }
        public override void ModifyState(Booking booking, bookingStatus? from, bookingStatus to, bool bySystem)
        {
            LoadMemberInfo(booking);
            booking.Status = to;
            booking.StatusLastChanged = DateTime.Now;
            QueueEmails(booking, from, to, bySystem);
        }
    }
}