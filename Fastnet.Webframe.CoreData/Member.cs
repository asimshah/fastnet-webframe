using Fastnet.EventSystem;
using Fastnet.Webframe;
using Microsoft.AspNet.Identity;
//using Microsoft.AspNet.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;
using System.Linq;
using System.Security.Cryptography;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class Member
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
        public string UserString1 { get; set; }
        public string UserString2 { get; set; }
        public string UserString3 { get; set; }
        public string UserString4 { get; set; }
        public string UserString5 { get; set; }

        public DateTime UserDate1 { get; set; }
        public DateTime UserDate2 { get; set; }
        public DateTime UserDate3 { get; set; }
        public DateTime UserDate4 { get; set; }
        public DateTime UserDate5 { get; set; }

        public int UserInteger1 { get; set; }
        public int UserInteger2 { get; set; }
        public int UserInteger3 { get; set; }
        public int UserInteger4 { get; set; }
        public int UserInteger5 { get; set; }

        public bool UserFlag1 { get; set; }
        public bool UserFlag2 { get; set; }
        public bool UserFlag3 { get; set; }
        public bool UserFlag4 { get; set; }
        public bool UserFlag5 { get; set; }


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
                return ctx.Members.Single(x => x.IsAnonymous);
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
        //public void RecordNewMember(string actionBy = null)
        //{
        //    CoreDataContext DataContext = Core.GetDataContext();
        //    MembershipAction ma = new MembershipAction
        //    {
        //        MemberId = this.Id,
        //        EmailAddress = this.EmailAddress,
        //        FullName = this.Fullname,
        //        ActionBy = actionBy ?? this.Fullname,
        //        Action = MembershipAction.ActionTypes.New,
        //    };
        //    DataContext.Actions.Add(ma);
        //}
        public void RecordChanges(string actionBy = null, MembershipAction.ActionTypes actionType = MembershipAction.ActionTypes.Modification)
        {
            CoreDataContext DataContext = Core.GetDataContext();
            switch (actionType)
            {
                default:
                case MembershipAction.ActionTypes.New:
                case MembershipAction.ActionTypes.Activation:
                case MembershipAction.ActionTypes.PasswordResetRequest:
                case MembershipAction.ActionTypes.PasswordReset:
                case MembershipAction.ActionTypes.Deactivation:
                case MembershipAction.ActionTypes.Deletion:
                    MembershipAction ma = new MembershipAction
                    {
                        MemberId = this.Id,
                        EmailAddress = this.EmailAddress,
                        FullName = this.Fullname,
                        ActionBy = actionBy ?? this.Fullname,
                        Action = actionType,
                    };
                    DataContext.Actions.Add(ma);
                    return;
                case MembershipAction.ActionTypes.Modification:
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
                                MembershipAction ma = new MembershipAction
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
        public bool CanView(Page page)
        {
            bool result = true;
            var memberOf = GetAllGroups(); //i.e. as a result of direct membership or because these groups are parents
            var pageAccessibleFrom = page.Directory.ViewableFrom();
            result = memberOf.Any(mo => pageAccessibleFrom.Contains(mo));
            return result;
        }
        public bool CanEdit(Page page)
        {
            bool result = true;
            var memberOf = GetAllGroups(); //i.e. as a result of direct membership or because these groups are parents
            var pageAccessibleFrom = page.Directory.EditableFrom();
            result = memberOf.Any(mo => pageAccessibleFrom.Contains(mo));
            return result;
        }
        public Page FindLandingPage()
        {
            var memberOf = GetAllGroups();// Groups; // i.e. direct membership
            var directories = memberOf.SelectMany(g => g.DirectoryGroups).Select(dg => dg.Directory);
            var pages = directories.Select(x => x.GetClosestLandingPage());
            Debug.Assert(pages.Count() != 0);
            if (pages.Count() > 1)
            {
                foreach (var lp in pages)
                {
                    Log.Write(EventSeverities.Warning, "Multiple home pages: Member {0}, page url {1}", this.Fullname, lp.Url);
                }
            }
            return pages.First();
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
    }
    //public class DWHMember : Member
    //{
    //    public DateTime DateOfBirth { get { return UserDate1; } set { UserDate1 = value; } }
    //    public string BMCMembership { get { return UserString1; } set { UserString1 = value; } }
    //}
    //public class AccountFactory : CustomFactory
    //{
    //    protected AccountFactory()
    //    {

    //    }
    //    public static AccountFactory GetAccountFactory()
    //    {
    //        AccountFactory af = null;
    //        switch (customisation)
    //        {
    //            case Customisation.DonWhillansHut:
    //                af = new DWHAccountFactory();
    //                break;
    //            default:
    //                af = new AccountFactory();
    //                break;
    //        }
    //        return af;
    //    }
    //    protected virtual Member CreateNewInstance()
    //    {
    //        return new Member();
    //    }
    //    public virtual Member Create(dynamic data)
    //    {
    //        // data.emailAddress, data.password, data.firstName, data.lastName
    //        Member m = CreateNewInstance();
    //        m.MemberId = Guid.NewGuid().ToString();

    //        m.Email = data.emailAddress;
    //        m.UserName = m.Email;
    //        m.PlainPassword = data.password;
    //        m.FirstName = data.firstName;
    //        m.LastName = data.lastName;
    //        AddCustomFields(m, data);

    //        return m;
    //    }
    //    protected virtual void AddCustomFields(Member m, dynamic data)
    //    {

    //    }
    //}
    //public class DWHAccountFactory : AccountFactory
    //{
    //    protected override Member CreateNewInstance()
    //    {
    //        return new DWHMember();
    //    }
    //    protected override void AddCustomFields(Member m, dynamic data)
    //    {
    //        // data.dateOfBirth, data.bmcMembership
    //        try
    //        {
    //            DWHMember dm = m as DWHMember;
    //            dm.DateOfBirth = DateTime.Parse((string)data.dateOfBirth);
    //            dm.BMCMembership = data.bmcMembership;
    //        }
    //        catch (Exception xe)
    //        {
    //            Debugger.Break();
    //            throw;
    //        }
    //    }
    //}

}