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


        //public virtual ICollection<Role> Roles { get; set; }
        private ICollection<Group> groups;
        public virtual ICollection<Group> Groups
        {
            get { return groups ?? (groups = new HashSet<Group>()); }
            set { groups = value; }
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