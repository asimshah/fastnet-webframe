using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;

namespace Fastnet.Webframe.Web.Areas.booking
{

    public class dwhBookingParameters : bookingParameters
    {
        public IGroup nonBMCMembers { get; set; }
        public IGroup privilegedMembers { get; set; }
        public int paymentInterval { get; set; }
        public int entryCodeNotificationInterval { get; set; }
        public int entryCodeBridgeInterval { get; set; }
        public int cancellationInterval { get; set; }
        public int firstReminderInterval { get; set; }
        public int secondReminderInterval { get; set; }
        public int reminderSuppressionInterval { get; set; }
        protected override void BeforeSave(ParameterBase para)
        {
            if (para is DWHParameter)
            {
                var p = para as DWHParameter;
                //p.NonBMCMembers = this.nonBMCMembers?.Name;
                p.PaymentInterval = this.paymentInterval;
                p.EntryCodeNotificationInterval = this.entryCodeNotificationInterval;
                p.EntryCodeBridgeInterval = this.entryCodeBridgeInterval;
                p.CancellationInterval = this.cancellationInterval;
                p.FirstReminderInterval = this.firstReminderInterval;
                p.SecondReminderInterval = this.secondReminderInterval;
                p.ReminderSuppressionInterval = this.reminderSuppressionInterval;
                p.PrivilegedMembers = this.privilegedMembers?.Name;
            }
        }
        protected override void AfterLoad(CoreDataContext core, ParameterBase para)
        {
            var p = para as DWHParameter;
            if (p != null)
            {
                if (!string.IsNullOrWhiteSpace(p.NonBMCMembers))
                {
                    Group NonBMCMembers = core.Groups.SingleOrDefault(g => g.Name == p.NonBMCMembers);
                    this.nonBMCMembers = new IGroup { Id = NonBMCMembers.GroupId, Name = NonBMCMembers.Name };
                }
                if (!string.IsNullOrWhiteSpace(p.PrivilegedMembers))
                {
                    Group PrivilegedMembers = core.Groups.SingleOrDefault(g => g.Name == p.PrivilegedMembers);
                    this.privilegedMembers = new IGroup { Id = PrivilegedMembers.GroupId, Name = PrivilegedMembers.Name };
                }
                this.paymentInterval = p.PaymentInterval;
                this.entryCodeNotificationInterval = p.EntryCodeNotificationInterval;
                this.entryCodeBridgeInterval = p.EntryCodeBridgeInterval;
                this.cancellationInterval = p.CancellationInterval;
                this.firstReminderInterval = p.FirstReminderInterval;
                this.secondReminderInterval = p.SecondReminderInterval;
                this.reminderSuppressionInterval = p.ReminderSuppressionInterval;
            }
        }
    }
}