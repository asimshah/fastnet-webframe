using Fastnet.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Models
{
    public class RegistrationViewModel
    {
        public string emailAddress { get; set; }
        public string password { get; set; }
        public string firstName { get; set; }
        public string lastName { get; set; }
        public DateTime userDate1 { get; set; }
        public string userString1 { get; set; }
    }
    public class PasswordResetViewModel
    {
        public string emailAddress { get; set; }
        public string password { get; set; }
    }
    public class LoginViewModel
    {
        public string emailAddress { get; set; }
        public string password { get; set; }
    }
    public class MemberUpdateViewModel
    {
        public string emailAddress { get; set; }
        public string firstName { get; set; }
        public string lastName { get; set; }
    }
    public class AdministratorViewModel
    {
        private static readonly int MinimumPasswordLength = ApplicationSettings.Key("MinimumPasswordLength", 8);
        private bool RequireComplexPassword = ApplicationSettings.Key("RequireComplexPassword", false);
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 8)]
        [DataType(DataType.Password)]
        //[Display(Name = "Password")]
        public string Password { get; set; }
        [DataType(DataType.Password)]
        [Display(Name = "Confirm password")]
        [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
        public string ConfirmPassword { get; set; }
    }
}