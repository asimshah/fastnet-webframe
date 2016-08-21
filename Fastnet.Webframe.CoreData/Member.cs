using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Web.Common;
using Fastnet.Webframe;
using Microsoft.AspNet.Identity;
using Newtonsoft.Json.Linq;
//using Microsoft.AspNet.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;
using System.Dynamic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public enum MemberCreationMethod
    {
        SelfRegistration,
        MembershipApplication,
        DataLoad,
        SystemGenerated
    }
    public enum AccessResult
    {
        Rejected,
        ViewAllowed,
        EditAllowed
    }
    [Table("Members")]
    public abstract partial class MemberBase
    {

        // I do not use the Email Confirmation scheme that ias part of the Asp.Net Identity system
        // because the UserManager.GenerateEmailConfirmationTokenAsync method produces a ridiculously
        // long string!
        // As a result I have EmailAddressConfirmed, and ActivationCode here in this table
        // The EmailAddress is a convenience property as it avoids my having to keep looking up
        // the aspnet table for an email address
        [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
        [MaxLength(128)]
        public string Id { get; set; }
        [MaxLength(256)]
        public string EmailAddress { get; set; }
        public bool EmailAddressConfirmed { get; set; }
        [MaxLength(128)]
        public string FirstName { get; set; }
        [MaxLength(128)]
        public string LastName { get; set; }
        [MaxLength(128)]
        public string PhoneNumber { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public bool Disabled { get; set; }
        [MaxLength(128)]
        public string ActivationCode { get; set; }
        public DateTime? ActivationEmailSentDate { get; set; }
        public string PasswordResetCode { get; set; }
        public DateTime? PasswordResetEmailSentDate { get; set; }
        public string PlainPassword { get; set; }
        public bool IsAdministrator { get; set; }
        public bool IsAnonymous { get; set; }
        public MemberCreationMethod CreationMethod { get; set; }
        //

        private ICollection<Group> groups;
        public virtual ICollection<Group> Groups
        {
            get { return groups ?? (groups = new HashSet<Group>()); }
            set { groups = value; }
        }
        [NotMapped]
        public string Fullname
        {
            get { return string.Format("{0} {1}", this.FirstName, this.LastName).Trim(); }
        }
        public static Member Anonymous
        {
            get
            {
                CoreDataContext ctx = Core.GetDataContext();
                return ctx.Members.OfType<Member>().Single(x => x.IsAnonymous);
            }
        }
        //

        public static string HashPassword(string password)
        {
            byte[] salt;
            byte[] buffer2;
            if (password == null)
            {
                throw new ArgumentNullException("password");
            }
            using (Rfc2898DeriveBytes bytes = new Rfc2898DeriveBytes(password, 0x10, 0x3e8))
            {
                salt = bytes.Salt;
                buffer2 = bytes.GetBytes(0x20);
            }
            byte[] dst = new byte[0x31];
            Buffer.BlockCopy(salt, 0, dst, 1, 0x10);
            Buffer.BlockCopy(buffer2, 0, dst, 0x11, 0x20);
            return Convert.ToBase64String(dst);
        }
        public static bool VerifyHashedPassword(string hashedPassword, string password)
        {
            Func<byte[], byte[], bool> byteArraysEqual = (b1, b2) =>
                {
                    bool result = true;
                    if (b1.Length == b2.Length)
                    {
                        for (int index = 0; index < b1.Length; ++index)
                        {
                            if (b1[index] != b2[index])
                            {
                                result = false;
                                break;
                            }
                        }
                    }
                    else
                    {
                        result = false;
                    }
                    return result;
                };
            byte[] buffer4;
            if (hashedPassword == null)
            {
                return false;
            }
            if (password == null)
            {
                throw new ArgumentNullException("password");
            }
            byte[] src = Convert.FromBase64String(hashedPassword);
            if ((src.Length != 0x31) || (src[0] != 0))
            {
                return false;
            }
            byte[] dst = new byte[0x10];
            Buffer.BlockCopy(src, 1, dst, 0, 0x10);
            byte[] buffer3 = new byte[0x20];
            Buffer.BlockCopy(src, 0x11, buffer3, 0, 0x20);
            using (Rfc2898DeriveBytes bytes = new Rfc2898DeriveBytes(password, dst, 0x3e8))
            {
                buffer4 = bytes.GetBytes(0x20);
            }

            return byteArraysEqual(buffer3, buffer4);
        }
        //public bool CanView(Page page)
        //{
        //    bool result = true;
        //    var memberOf = GetAllGroups(); //i.e. as a result of direct membership or because these groups are parents
        //    var pageAccessibleFrom = page.Directory.ViewableFrom();
        //    result = memberOf.Any(mo => pageAccessibleFrom.Contains(mo));
        //    return result;
        //}
        //public bool CanEdit(Page page)
        //{
        //    bool result = true;
        //    var memberOf = GetAllGroups(); //i.e. as a result of direct membership or because these groups are parents
        //    var pageAccessibleFrom = page.Directory.EditableFrom();
        //    result = memberOf.Any(mo => pageAccessibleFrom.Contains(mo));
        //    return result;
        //}
        public AccessResult GetAccessResult(Page page)
        {
            TraceAccess("Access: member {0}, {1}", this.Fullname, page.Url);
            Directory dir = page.Directory;
            return GetAccessResult(dir);
        }
        public AccessResult GetAccessResult(Document doc)
        {
            TraceAccess("Access: member {0}, {1}", this.Fullname, doc.Url);
            Directory dir = doc.Directory;
            return GetAccessResult(dir);
        }
        public AccessResult GetAccessResult(Image image)
        {
            TraceAccess("Access: member {0}, {1}", this.Fullname, image.Url);
            Directory dir = image.Directory;
            return GetAccessResult(dir);
        }
        public Page FindLandingPage()
        {
            Func<AccessResult, bool> canAccess = (ar) =>
            {
                return ar == AccessResult.ViewAllowed || ar == AccessResult.EditAllowed;
            };
            Page result = null;
            CoreDataContext DataContext = Core.GetDataContext();
            var lps = DataContext.Pages.Where(x => x.IsLandingPage).ToArray();
            TraceAccess("Access: defined landing page(s) {0}", string.Join(", ", lps.Select(x => x.Url).ToArray()));
            var pages = lps.Where(x => canAccess(GetAccessResult(x))).ToArray();
            TraceAccess("Access: member {0} can access landing page(s) {1}", this.Fullname, string.Join(", ", pages.Select(x => x.Url).ToArray()));
            if (pages.Count() > 1)
            {
                var pagesWithWeight = pages.Select(x => new { Page = x, Weight = FindWeight(x) });
                TraceAccess("Access: member {0}, page weights are: {1}", this.Fullname, string.Join(", ", pagesWithWeight.Select(x => string.Format("{0}, weight {1:#0.00}", x.Page.Url, x.Weight)).ToArray()));
                var maxWeight = pagesWithWeight.Max(x => x.Weight);
                var heaviest = pagesWithWeight.Where(x => x.Weight == maxWeight);
                if (heaviest.Count() > 1)
                {
                    Log.Write("Multiple landing pages found for {0}: {1}", this.Fullname, string.Join(", ", heaviest.Select(x => string.Format("{0}, weight {1:#0.00}", x.Page.Url, x.Weight)).ToArray()));
                }
                TraceAccess("Access: member {0}, selected landing page {1}", this.Fullname, string.Format("{0} weight {1:#0.00}", heaviest.First().Page.Url, heaviest.First().Weight));
                result = heaviest.First().Page;
            }
            else
            {
                result = pages.First();
                TraceAccess("Access: member {0}, selected landing page {1}", this.Fullname, result.Url);
            }
           
            return result;
        }
        //public abstract dynamic GetMinimumDetails();
        public virtual ExpandoObject GetMinimumDetails()
        {
            dynamic details = new ExpandoObject();
            details.Id = this.Id;
            details.EmailAddress = this.EmailAddress;
            details.Name = this.Fullname;
            details.Disabled = this.Disabled;
            details.IsAdministrator = this.IsAdministrator;
            details.EmailConfirmed = this.EmailAddressConfirmed;
            return details;
        }
        public virtual ExpandoObject GetMemberListDetails()
        {
            Func<string> getStatus = () =>
            {
                string st = "";
                if (Disabled)
                {
                    st = "Disabled";
                }
                else if (!EmailAddressConfirmed)
                {
                    st = "Waiting Activation";
                }
                return st;
            };
            dynamic details = GetMinimumDetails();// new ExpandoObject();
            //details.Id = this.Id;
            //details.EmailAddress = this.EmailAddress;
            //details.Disabled = this.Disabled;
            //details.EmailConfirmed = this.EmailAddressConfirmed;
            details.FirstName = this.FirstName;
            details.LastName = this.LastName;
            details.CreationDate = this.CreationDate;
            details.LastLoginDate = this.LastLoginDate;
            details.Status = getStatus();
            details.Groups = this.Groups.OrderBy(x => x.Name).ToArray().Where(g => !g.Type.HasFlag(GroupTypes.SystemDefinedMembers))
                .Select(g => new { Name = g.Shortenedpath });
            return details;
        }
        public virtual async Task<ExpandoObject> Update(dynamic data)
        {
            string newEmailAddress = data.emailAddress;
            string newFirstName = data.firstName;
            string newLastName = data.lastName;
            bool newDisabled = data.isDisabled;
            Update(newEmailAddress, newFirstName, newLastName, newDisabled);
            dynamic result = new ExpandoObject();
            result.Success = true;
            result.Error = "";
            return await Task.FromResult(result);
        }
        public void RecordChanges(string actionBy = null, MemberAction.MemberActionTypes actionType = MemberAction.MemberActionTypes.Modification)
        {
            CoreDataContext DataContext = Core.GetDataContext();
            switch (actionType)
            {
                default:
                case MemberAction.MemberActionTypes.New:
                case MemberAction.MemberActionTypes.Activation:
                case MemberAction.MemberActionTypes.PasswordResetRequest:
                case MemberAction.MemberActionTypes.PasswordReset:
                case MemberAction.MemberActionTypes.Deactivation:
                case MemberAction.MemberActionTypes.Deletion:
                    MemberAction ma = new MemberAction
                    {
                        MemberId = this.Id,
                        EmailAddress = this.EmailAddress,
                        FullName = this.Fullname,
                        ActionBy = actionBy ?? this.Fullname,
                        Action = actionType,
                    };
                    DataContext.Actions.Add(ma);
                    return;
                case MemberAction.MemberActionTypes.Modification:
                    break;
            }
            var entry = DataContext.Entry(this);
            foreach (var p in entry.CurrentValues.PropertyNames)
            {
                switch (p)
                {
                    case "EmailAddressConfirmed":
                    case "ActivationCode":
                    case "ActivationEmailSentDate":
                    case "PasswordResetCode":
                    case "PasswordResetEmailSentDate":
                    case "PlainPassword":
                        break;
                    default:
                        try
                        {
                            if (entry.Property(p).IsModified)
                            {
                                object ov = entry.Property(p).OriginalValue;
                                object cv = entry.Property(p).CurrentValue;
                                MemberAction ma = new MemberAction
                                {
                                    MemberId = this.Id,
                                    EmailAddress = this.EmailAddress,
                                    FullName = this.Fullname,
                                    ActionBy = actionBy ?? this.Fullname,
                                    Action = actionType,// MembershipAction.MembershipActionTypes.Modification,
                                    PropertyChanged = p,
                                    OldValue = ov == null ? "<null>" : ov.ToString(),
                                    NewValue = cv == null ? "<null>" : cv.ToString()
                                };
                                DataContext.Actions.Add(ma);
                            }
                        }
                        catch (Exception xe)
                        {
                            //Debugger.Break();
                            Log.Write(xe);
                            throw;
                        }
                        break;
                }
            }
        }
        protected void Update(string newEmailAddress, string newFirstName, string newLastName, bool newDisabled)
        {
            EmailAddress = newEmailAddress;
            FirstName = newFirstName;
            LastName = newLastName;
            Disabled = newDisabled;
        }
        private IEnumerable<Group> GetAllGroups()
        {
            // this returns a flat list of all groups this member is in 
            // including parent groups all the way to the root
            List<Group> list = new List<Group>();
            foreach (var g in this.Groups)
            {
                foreach (var pg in g.SelfAndParents)
                {
                    list.Add(pg);
                }
            }
            return list;
        }
        private AccessResult GetAccessResult(Directory dir)
        {
            AccessResult ar = AccessResult.Rejected;
            TraceAccess("Access: member {0}, directory {1}", this.Fullname, dir.DisplayName);
            var drgSet = dir.DirectoryGroups;
            if (drgSet.Count() == 0)
            {
                TraceAccess("Access: member {0}, directory {1}, no direct restrictions (going to parent ...)", this.Fullname, dir.DisplayName);
                dir = dir.ParentDirectory;
                ar = GetAccessResult(dir);
            }
            TraceAccess("Access: member {0}, directory {1}, direct restriction group(s): {2}", this.Fullname, dir.DisplayName, string.Join(", ", drgSet.Select(x => x.Group.Fullpath).ToArray()));
            if (drgSet.Select(x => x.Group).Any(x => IsMemberOf(x)))
            {
                var dgs = drgSet.Where(x => IsMemberOf(x.Group));
                TraceAccess("Access: member {0}, directory {1}, member of group(s): {2}", this.Fullname, dir.DisplayName, string.Join(", ", dgs.Select(x => x.Group.Fullpath).ToArray()));
                if (dgs.Any(x => x.EditAllowed))
                {
                    TraceAccess("Access: member {0}, directory {1}, edit allowed for group(s): {2} ", this.Fullname, dir.DisplayName, string.Join(", ", dgs.Where(x => x.EditAllowed).Select(x => x.Group.Fullpath).ToArray()));
                    ar = AccessResult.EditAllowed;
                }
                else if (dgs.Any(x => x.ViewAllowed))
                {
                    //var xx = dgs.Where(x => x.ViewAllowed).Select(x => x.Group.Fullpath).ToArray();
                    TraceAccess("Access: member {0}, directory {1}, view allowed for group(s): {2} ", this.Fullname, dir.DisplayName, string.Join(", ", dgs.Where(x => x.ViewAllowed).Select(x => x.Group.Fullpath).ToArray()));
                    ar = AccessResult.ViewAllowed;
                }
            }
            TraceAccess("Access: member {0}, directory {1}, access result: {2}", this.Fullname, dir.DisplayName, ar.ToString());
            return ar;
        }
        public bool IsMemberOf(Group group)
        {
            return group.SelfAndDescendants.Any(x => x.Members.Contains(this));
            //return group.Members.Contains(this);
        }
        private void TraceAccess(string fmt, params object[] args)
        {
            bool trace = ApplicationSettings.Key("Trace:Access", false);
            if (trace)
            {
                Log.Write(fmt, args);
            }
        }
        private double FindWeight(Page p)
        {
            double result = -1.0;
            Directory dir = p.Directory;
            foreach (var d in dir.SelfAndParents)
            {
                var dgs = d.DirectoryGroups.Where(x => IsMemberOf(x.Group));
                if (dgs.Count() > 0)
                {
                    result = dgs.Average(x => x.Group.Weight);
                    break;
                }
            }
            Debug.Assert(result >= 0);
            return result;
        }
    }

    public partial class Member : MemberBase
    {
        internal Member()
        {

        }
    }


}