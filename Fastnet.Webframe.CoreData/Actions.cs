﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Fastnet.Common;
using System.ComponentModel;

namespace Fastnet.Webframe.CoreData
{

    public abstract class ActionBase
    {
        public long ActionBaseId { get; set; }
        public DateTimeOffset RecordedOn { get; set; } // always UTC
        public ActionBase()
        {
            RecordedOn = DateTimeOffset.UtcNow;
        }
        [NotMapped]
        public string RecordedOnString
        {
            get { return RecordedOn.ToString().Replace("T", " "); }
        }
    }
    public class ApplicationAction : ActionBase
    {
        public string SiteUrl { get; set; }
        public string Version { get; set; }
        public string Remark { get; set; }
    }
    public class SessionAction : ActionBase
    {
        public string SessionId { get; set; }
        public string Browser { get; set; }
        public string Version { get; set; }
        public string IpAddress { get; set; }
        public int ScreenWidth { get; set; }
        public int ScreenHeight { get; set; }
        public bool CanTouch { get; set; }
    }
    public class MailAction : ActionBase
    {
        public string Subject { get; set; }
        public string To { get; set; }
        public string From { get; set; }
        public bool Redirected { get; set; }
        public string RedirectedTo { get; set; }
        public string MailTemplate { get; set; }
        public string MailBody { get; set; }
        public bool MailDisabled { get; set; }
        public string Failure { get; set; }
    }
    public class MembershipAction : ActionBase
    {
        public enum ActionTypes
        {
            [Description("New Member")]
            New,
            [Description("Account Activated")]
            Activation,
            [Description("Password Reset Requested")]
            PasswordResetRequest,
            [Description("Password Reset")]
            PasswordReset,
            [Description("Details Modified")]
            Modification,
            [Description("Account Deactivated")]
            Deactivation,
            [Description("Account Deleted")]
            Deletion = 64
        }
        public string MemberId { get; set; }
        public string FullName { get; set; }
        public string EmailAddress { get; set; }
        public string ActionBy { get; set; }
        public ActionTypes Action { get; set; }
        public string PropertyChanged { get; set; } // if Action == Modification
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        [NotMapped]
        public string ActionName { get { return Action.GetDescription(); } }
        [NotMapped]
        public bool IsModification { get { return Action == ActionTypes.Modification; } }
    }
}
