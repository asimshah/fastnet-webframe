using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public enum BookingEmailTemplates
    {
        RegistrationFailed,
        ApprovalRequired,
        WANotification,
        ConfirmedPriv,
        ConfirmedNonPriv,
        WaitingPayment,
        WPNotification,
        Reminder,
        FinalReminder,
        CANNotification,
        AutoCancelled,
        Cancelled,
        EntryCodeNotification,
        WaitingDuePayment
    }
    public enum BookingEmailStatus
    {
        NotSent,
        Sending,
        Sent,
        Failed,
        FailedRetryable
    }
    public class BookingEmail
    {        
        public long BookingEmailId { get; set; }
        public virtual Booking Booking { get; set; }
        public BookingEmailTemplates Template { get; set; }
        public BookingEmailStatus Status { get; set; }
        public DateTime UtcDueAt { get; set; } // always UTC
        public DateTime? UtcSentAt { get; set; }
        public int RetryCountToDate { get; set; }
        [MaxLength(256)]
        public string FailureDescription { get; set; }
        [MaxLength(250)]
        public string EmailAddress { get; set; }
        [MaxLength(128)]
        public string Subject { get; set; }
        public string Body { get; set; }
    }
    public partial class BookingDataContext
    {
        public IEnumerable<BookingEmail> CollectPendingMail()
        {
            return this.Emails.Where(x => (x.Status == BookingEmailStatus.NotSent || x.Status == BookingEmailStatus.FailedRetryable) && x.UtcDueAt < DateTime.UtcNow);

        }
    }
}
