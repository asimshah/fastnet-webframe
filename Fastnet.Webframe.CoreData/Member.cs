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
            TraceAccess("Access: for {0}, url {1}", this.Fullname, page.Url);
            Directory dir = page.Directory;
            return GetAccessResult(dir);
        }
        public AccessResult GetAccessResult(Document doc)
        {
            TraceAccess("Access: for {0}, url {1}", this.Fullname, doc.Url);
            Directory dir = doc.Directory;
            return GetAccessResult(dir);
        }
        public AccessResult GetAccessResult(Image image)
        {
            TraceAccess("Access: for {0}, url {1}", this.Fullname, image.Url);
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
            var pages = lps.Where(x => canAccess(GetAccessResult(x))).ToArray();
            if (pages.Count() > 1)
            {
                var pagesWithWeight = pages.Select(x => new { Page = x, Weight = FindWeight(x) });
                TraceAccess("Access: for {0}, candidate landing pages: {1}", this.Fullname, string.Join(", ", pagesWithWeight.Select(x => string.Format("{0}, weight {1:#0.00}", x.Page.Url, x.Weight)).ToArray()));
                var maxWeight = pagesWithWeight.Max(x => x.Weight);
                var heaviest = pagesWithWeight.Where(x => x.Weight == maxWeight);
                if (heaviest.Count() > 1)
                {
                    Log.Write("Multiple landing pages found for {0}: {1}", this.Fullname, string.Join(", ", heaviest.Select(x => string.Format("{0}, weight {1:#0.00}", x.Page.Url, x.Weight)).ToArray()));
                }
                TraceAccess("Access: for {0}, selected landing page {1}", this.Fullname, string.Format("{0} weight {1:#0.00}", heaviest.First().Page.Url, heaviest.First().Weight));
                result = heaviest.First().Page;
            }
            else
            {
                result = pages.First();
            }
            TraceAccess("Access: for {0}, selected landing page {1}", this.Fullname, result.Url);
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
            TraceAccess("Access: for {0}, directory {1}", this.Fullname, dir.DisplayName);
            var drgSet = dir.DirectoryGroups;
            if (drgSet.Count() == 0)
            {
                TraceAccess("Access: for {0}, directory {1}, no direct restrictions", this.Fullname, dir.DisplayName);
                dir = dir.ParentDirectory;
                ar = GetAccessResult(dir);
            }
            TraceAccess("Access: for {0}, directory {1}, direct restriction group(s): {2}", this.Fullname, dir.DisplayName, string.Join(", ", drgSet.Select(x => x.Group.Fullpath).ToArray()));
            if (drgSet.Select(x => x.Group).Any(x => IsMemberOf(x)))
            {
                var dgs = drgSet.Where(x => IsMemberOf(x.Group));
                TraceAccess("Access: for {0}, directory {1}, member of group(s): {2}", this.Fullname, dir.DisplayName, string.Join(", ", dgs.Select(x => x.Group.Fullpath).ToArray()));
                if (dgs.Any(x => x.EditAllowed))
                {
                    TraceAccess("Access: for {0}, directory {1}, edit allowed for group(s): {2} ", this.Fullname, dir.DisplayName, string.Join(", ", dgs.Where(x => x.EditAllowed).Select(x => x.Group.Fullpath).ToArray()));
                    ar = AccessResult.EditAllowed;
                }
                else if (dgs.Any(x => x.ViewAllowed))
                {
                    //var xx = dgs.Where(x => x.ViewAllowed).Select(x => x.Group.Fullpath).ToArray();
                    TraceAccess("Access: for {0}, directory {1}, view allowed for group(s): {2} ", this.Fullname, dir.DisplayName, string.Join(", ", dgs.Where(x => x.ViewAllowed).Select(x => x.Group.Fullpath).ToArray()));
                    ar = AccessResult.ViewAllowed;
                }
            }
            TraceAccess("Access: for {0}, directory {1}, access result: {2}", this.Fullname, dir.DisplayName, ar.ToString());
            return ar;
        }
        private bool IsMemberOf(Group group)
        {
            return group.SelfAndDescendants.Any(x => x.Members.Contains(this));
            //return group.Members.Contains(this);
        }
        private void TraceAccess(string fmt, params object[] args)
        {
            bool trace = ApplicationSettings.Key("TraceAccess", false);
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
    public partial class DWHMember : MemberBase
    {
        [MaxLength(128)]
        public string BMCMembership { get; set; }
        public DateTime? DateOfBirth { get; set; }
        [MaxLength(128)]
        public string Organisation { get; set; }
        [MaxLength(128)]
        public string PhoneNumber { get; set; }
        internal DWHMember()
        {

        }

        public override ExpandoObject GetMemberListDetails()
        {
            dynamic details = base.GetMemberListDetails();
            details.Organisation = this.Organisation;
            details.BMCMembership = this.BMCMembership;
            details.DateOfBirth = this.DateOfBirth?.ToString("ddMMMyyyy");
            details.PhoneNumber = this.PhoneNumber;
            return details;
        }
        public override async Task<ExpandoObject> Update(dynamic data)
        {
            string newEmailAddress = data.emailAddress;
            string newFirstName = data.firstName;
            string newLastName = data.lastName;
            bool newDisabled = data.isDisabled;

            DWHMemberFactory mf = MemberFactory.GetInstance() as DWHMemberFactory;
            string newBmcMembership = mf.ExtractBmcMembership(data);
            DateTime? newDob = mf.ExtractDob(data);
            bool needsRevalidation = false;
            if (newBmcMembership != this.BMCMembership || newDob != this.DateOfBirth)
            {
                needsRevalidation = true;
            }
            dynamic r = new ExpandoObject();
            r.Success = true;
            if (needsRevalidation)
            {
                r = await mf.ValidateRegistration(newBmcMembership, newDob);
            }
            if (r.Success)
            {
                Update(newEmailAddress, newFirstName, newLastName, newDisabled);
                string newOrganisation = data.organisation?.Value ?? "";
                BMCMembership = newBmcMembership;
                DateOfBirth = newDob;
                Organisation = newOrganisation;
                //dynamic result = new ExpandoObject();
                //result.Success = true;
                //return result;
            }
            return r;

        }
    }
    public class MemberFactory : CustomFactory
    {
        private static MemberFactory instance;
        public static MemberFactory GetInstance()
        {
            if (instance == null)
            {
                MemberFactory mf = null;
                switch (FactoryName)
                {
                    case FactoryName.None:
                        mf = new MemberFactory();
                        break;
                    case FactoryName.DonWhillansHut:
                        mf = new DWHMemberFactory();
                        break;
                }
                instance = mf;
            }
            return instance;
        }
        protected virtual MemberBase CreateMemberInstance()
        {
            return new Member();
        }
        protected virtual void Fill(MemberBase member, string id, string emailAddress, string firstName, string lastName)
        {
            member.Id = id;
            member.EmailAddress = emailAddress;
            member.FirstName = firstName;
            member.LastName = lastName;
            member.CreationDate = DateTime.UtcNow;
        }
        public virtual MemberBase CreateNew(string id, dynamic data)
        {
            MemberBase member = CreateMemberInstance();

            string emailAddress = data.emailAddress;
            //string password = data.password;
            string firstName = data.firstName;
            string lastName = data.lastName;
            Fill(member, id, emailAddress, firstName, lastName);
            return member;
        }

        public async virtual Task<ExpandoObject> ValidateRegistration(dynamic data)
        {
            dynamic result = new ExpandoObject();
            result.Success = true;
            result.Error = "";
            return await Task.FromResult(result);
        }
        //public static MemberBase CreateNew(string id, string emailAddress, string firstName, string lastName)
        //{
        //    MemberFactory mf = new MemberFactory();
        //    return mf.Create(id, emailAddress, firstName, lastName);
        //}

        //private MemberBase Create(string id, string emailAddress, string firstName, string lastName)
        //{

        //    MemberBase member = null;

        //    switch (this.FactoryName)
        //    {
        //        case FactoryName.None:
        //            member = new Member();
        //            break;
        //        case FactoryName.DonWhillansHut:
        //            var m = new DWHMember();
        //            m.BMCMembership = null;
        //            m.DateOfBirth = null;
        //            m.Organisation = null;
        //            member = m;
        //            break;
        //    }
        //    member.Id = id;
        //    member.EmailAddress = emailAddress;
        //    member.FirstName = firstName;
        //    member.LastName = lastName;
        //    member.CreationDate = DateTime.UtcNow;
        //    return member;
        //}
    }
    public class DWHMemberFactory : MemberFactory
    {
        protected override MemberBase CreateMemberInstance()
        {
            return new DWHMember();
        }
        public override MemberBase CreateNew(string id, dynamic data)
        {
            DWHMember m = CreateMemberInstance() as DWHMember;
            string emailAddress = data.emailAddress;
            //string password = data.password;
            string firstName = data.firstName;
            string lastName = data.lastName;
            Fill(m, id, emailAddress, firstName, lastName);
            //string bmc = data.bmcMembership?.Value ?? "";
            m.BMCMembership = ExtractBmcMembership(data);// bmc.Trim();
            m.DateOfBirth = ExtractDob(data);// data.dob?.Value;
                                             //string dob = data.dob.Value ?? "";
                                             //if(!string.IsNullOrWhiteSpace(dob))
                                             //{
                                             //    m.DateOfBirth = DateTime.Parse(dob);
                                             //}

            m.Organisation = data.organisation?.Value ?? "";
            return m;
        }
        public string ExtractBmcMembership(dynamic data)
        {
            string bmcMembership = data.bmcMembership?.Value ?? "";
            return bmcMembership.Trim();
        }
        public DateTime? ExtractDob(dynamic data)
        {
            object r = data.dob?.Value ?? null;
            if (r is string)
            {
                DateTime dt;
                if (DateTime.TryParse((string)r, out dt))
                {
                    return dt;
                }
            }
            if (r.GetType() == typeof(DateTime))
            {
                return (DateTime)r;
            }
            return null;

        }
        public async override Task<ExpandoObject> ValidateRegistration(dynamic data)
        {
            string bmc = ExtractBmcMembership(data);
            DateTime? dob = ExtractDob(data);
            return await ValidateRegistration(bmc, dob);
        }
        internal async Task<ExpandoObject> ValidateRegistration(string bmcMembership, DateTime? dob)
        {

            dynamic result = new ExpandoObject();
            //string BMCMembership = data.bmcMembership;
            if (!string.IsNullOrWhiteSpace(bmcMembership))
            {
                if (!BMCNumberInUse(bmcMembership))
                {
                    if (ApplicationSettings.Key("DWH:ValidateBMCMembership", true))
                    {
                        //string DateOfBirth = data.dob;
                        await Task.Delay(1000);
                        result.Success = false;
                        result.Error = "BMC Membership is invalid or not found. Please check both the BMC number and the date of birth";
                    }
                    else
                    {
                        result.Success = true;
                    }
                }
                else
                {
                    result.Success = false;
                    result.Error = "This BMC membership is already in use";
                }
            }
            else
            {
                result.Success = true;
            }
            return result;
        }
        private bool BMCNumberInUse(string bMCMembership)
        {
            var ctx = Core.GetDataContext();
            return ctx.Members.OfType<DWHMember>().Any(x => string.Compare(bMCMembership, x.BMCMembership, true) == 0);
        }
    }
}