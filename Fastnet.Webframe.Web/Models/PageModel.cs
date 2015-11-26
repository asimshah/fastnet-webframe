using Fastnet.Common;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Common;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Web;

namespace Fastnet.Webframe.Web.Models
{
    // 18May2015 - Note
    // This approach (of sending a ClientSideAction) to the javascript client
    // was the first one I devised as the account stuff was the first thing I
    // implemented.
    // Subsequently, I added other features 9such as the designer area, membership and so on
    // and I did not use the ClientSideAction for those - just the templating stuff.
    //
    // The open question is whether, in the light of better understanding of the client side
    // possibilities, this CLientSideAction design is a bit too complicated, or whether it is still
    // neeeded (or something similar) because the login stuff runs alongside the page stuff
    // users can login or out, etc at anytime as they browse the site so client side needs to know how to do this.
    // I suspect that there may well be a much simpler way of doing this.

    public abstract class ClientSideAction
    {
        public string Name { get; protected set; }
        public bool IsModal { get; protected set; } // obsolete?
        public bool IsDialogue { get; protected set; }
        public ClientSideAction(ClientSideActions name, bool isDialogue, bool isModal = false)
        {
            this.Name = name.ToString();
            this.IsDialogue = isDialogue;
            if (IsDialogue)
            {
                this.IsModal = isModal;
            }
        }
        //public ClientSideAction(ClientSideActions name, bool isModal = false)
        //{
        //    this.Name = name.ToString();
        //    this.IsModal = isModal;
        //}
        public static ClientSideAction GetAction(ClientSideActions name, MemberBase member)
        {
            ClientSideAction action = null;
            switch (name)
            {
                case ClientSideActions.activationsuccessful:
                    action = new ActivationSucceededDialogue();
                    break;
                case ClientSideActions.activationfailed:
                    action = new ActivationFailedDialogue();
                    break;
                case ClientSideActions.login:
                    action = new LoginDialogue();
                    break;
                case ClientSideActions.register:
                    action = new RegistrationDialogue();
                    break;
                case ClientSideActions.changepassword:
                    action = new ChangePasswordDialogue(member);
                    break;
                case ClientSideActions.userprofile:
                    action = new UserProfileDialogue(member);
                    break;
                case ClientSideActions.passwordreset:
                    action = new PasswordResetDialogue();
                    break;
                case ClientSideActions.passwordresetfailed:
                    action = new PasswordResetFailedDialogue();
                    break;
                case ClientSideActions.enabledit:
                    action = new EnableEditing();
                    break;
                default:
                    Debug.Fail("ClientSideAction implementation incomplete");
                    break;
            }
            return action;
        }
    }
    public class UserProfileDialogue : ClientSideAction
    {
        public string EmailAddress { get; private set; }
        public string FirstName { get; private set; }
        public string LastName { get; private set; }
        public UserProfileDialogue(MemberBase member) : base(ClientSideActions.userprofile, true)
        {
            this.EmailAddress = member.EmailAddress;
            this.FirstName = member.FirstName;
            this.LastName = member.LastName;
        }
    }
    public class EnableEditing : ClientSideAction
    {
        public EnableEditing() : base(ClientSideActions.enabledit, false)
        {

        }
    }
    public class LoginDialogue : ClientSideAction
    {
        public LoginDialogue() : base(ClientSideActions.login, true, true)
        {

        }
    }
    public class PasswordResetDialogue : ClientSideAction
    {
        public PasswordResetDialogue()
            : base(ClientSideActions.passwordreset, true, true)
        {

        }
    }
    public class RegistrationDialogue : ClientSideAction
    {
        public int MinimumPasswordLength { get; private set; }
        public bool RequireComplexPassword { get; private set; }
        public RegistrationDialogue()
            : base(ClientSideActions.register, true, true)
        {

            MinimumPasswordLength = ApplicationSettings.Key("MinimumPasswordLength", 8);
            RequireComplexPassword = ApplicationSettings.Key("RequireComplexPassword", false);
        }
    }
    public class ChangePasswordDialogue : ClientSideAction
    {
        public string EmailAddress { get; private set; }
        public string FirstName { get; private set; }
        public string LastName { get; private set; }
        public int MinimumPasswordLength { get; private set; }
        public bool RequireComplexPassword { get; private set; }
        public ChangePasswordDialogue(MemberBase member)
            : base(ClientSideActions.changepassword, true, true)
        {
            this.EmailAddress = member.EmailAddress;
            this.FirstName = member.FirstName;
            this.LastName = member.LastName;
            MinimumPasswordLength = ApplicationSettings.Key("MinimumPasswordLength", 8);
            RequireComplexPassword = ApplicationSettings.Key("RequireComplexPassword", false);
        }
    }
    public class ActivationSucceededDialogue : ClientSideAction
    {
       
        public ActivationSucceededDialogue()
            : base(ClientSideActions.activationsuccessful, true, true)
        {

        }
    }
    public class ActivationFailedDialogue : ClientSideAction
    {
        public string AdminEmailAddress { get; private set; }
        public ActivationFailedDialogue() : base(ClientSideActions.activationfailed, true, true)
        {
            this.AdminEmailAddress = Globals.AdminEmailAddress;
        }
    }
    public class PasswordResetFailedDialogue : ClientSideAction
    {
        public string AdminEmailAddress { get; private set; }
        public PasswordResetFailedDialogue()
            : base(ClientSideActions.passwordresetfailed, true, true)
        {
            this.AdminEmailAddress = Globals.AdminEmailAddress;
        }
    }

    public class PageModel : ViewModelBase
    {
        public OptionsModel Options { get; set; }
        public bool ClientSideLog { get; set; }
        public string ReturnUrl { get; set; }
        public string StartPage { get; set; }
        public bool ShowDialog
        {
            get { return HasAction && ClientAction.IsDialogue; }
        }
        public bool HasAction { get { return ClientAction != null; } }
        public ClientSideAction ClientAction { get; private set; }
        public string Customer { get; set; }
        public Features Features { get; set; }
        // public PageModel(long? pageId, Member member = null)
        public PageModel(Page page, MemberBase member = null)
        {
            this.Options = new OptionsModel();
            ClientSideLog = ApplicationSettings.Key("ClientSideLog", false);
            //if (member != null)
            //{
            //    CanEditPages = Group.Editors.Members.Contains(member);
            //}
            StartPage = page == null ? member.FindLandingPage().PageId.ToString() : page.PageId.ToString();
            if (ApplicationSettings.Key("DonWhillansHut", false))
            {
                Customer = "dwh";
                Features = Features.DateCapture | Features.SomethingElse;
            }
            else
            {
                Customer = "default";
            }
        }
        public void SetClientAction(ClientSideActions name, MemberBase member)
        {
            this.ClientAction = ClientSideAction.GetAction(name, member);
        }

        public string FeaturesForJavascript()
        {
            List<string> list = new List<string>();
            foreach (var x in Enum.GetValues(typeof(Features)).Cast<Features>())
            {
                if (Features.HasFlag(x))
                {
                    string name = Enum.GetName(typeof(Features), x);
                    list.Add(string.Format("{0}: true", name));
                }
            }
            return string.Join(",", list.ToArray());
        }
    }
}