using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Hosting;

namespace Fastnet.Webframe.Web.Common
{
    public abstract class TemplateBase : CustomFactory
    {
        protected string templateFolder = HostingEnvironment.MapPath("~/Templates");
        protected abstract string GetRootFolder();
        protected abstract string GetTemplateFilename();
        public string GetTemplate()
        {
            FileInfo file;
            return GetTemplate(out file);
        }
        public string GetTemplate(out FileInfo file)
        {
            switch (customisation)
            {
                //case Customisation.DonWhillansHut:
                //    tf = new DWHTemplateFactory();
                //    break;
                default:
                    
                    break;
            }
            string fn = Path.Combine(GetRootFolder(), GetTemplateFilename());
            return ReadText(fn, out file);
        }
        //protected void SetTemplateFolder(string templateRootUrl)
        //{
        //    templateFolder = HostingEnvironment.MapPath(templateRootUrl);
        //}

        private string ReadText(string fn, out FileInfo file)
        {
            if (fn != null)
            {
                file = new FileInfo(fn);
                return File.ReadAllText(file.FullName);
            }
            else
            {
                file = null;
                return string.Empty;
            }
        }
    }
    public class FormTemplate : TemplateBase
    {
        private enum formTypes
        {
            None,
            MessageBox,
            //Form,
            //ModalForm,
            //
            ActivationSuccessful,
            ActivationFailed,
            ChangePassword,
            Login,
            PasswordReset,
            PasswordResetConfirmation,
            PasswordResetFailed,
            Register,
            RegistrationConfirmation,
            UserProfile,
            //
            InsertHyperlink,
            BrowseForLink,
            PageProperties,
            DirectoryProperties,
            DocumentProperties,
            //
            TestForm
        }
        private formTypes type;
        //protected string templateFolder = HostingEnvironment.MapPath("~/Templates");
        //public static readonly FormTemplate Form = new FormTemplate(formTypes.Form);
        //public static readonly FormTemplate ModalForm = new FormTemplate(formTypes.ModalForm);
        public static readonly FormTemplate ActivationFailed = new FormTemplate(formTypes.ActivationFailed);
        public static readonly FormTemplate ActivationSuccessful = new FormTemplate(formTypes.ActivationSuccessful);
        public static readonly FormTemplate ChangePassword = new FormTemplate(formTypes.ChangePassword);
        public static readonly FormTemplate Login = new FormTemplate(formTypes.Login);
        public static readonly FormTemplate PasswordReset = new FormTemplate(formTypes.PasswordReset);
        public static readonly FormTemplate PasswordResetConfirmation = new FormTemplate(formTypes.PasswordResetConfirmation);
        public static readonly FormTemplate PasswordResetFailed = new FormTemplate(formTypes.PasswordResetFailed);
        public static readonly FormTemplate Register = new FormTemplate(formTypes.Register);
        public static readonly FormTemplate RegistrationConfirmation = new FormTemplate(formTypes.RegistrationConfirmation);
        public static readonly FormTemplate UserProfile = new FormTemplate(formTypes.UserProfile);
        public static readonly FormTemplate InsertHyperlink = new FormTemplate(formTypes.InsertHyperlink);
        public static readonly FormTemplate BrowseForLink = new FormTemplate(formTypes.BrowseForLink);
        public static readonly FormTemplate PageProperties = new FormTemplate(formTypes.PageProperties);
        public static readonly FormTemplate DirectoryProperties = new FormTemplate(formTypes.DirectoryProperties);
        public static readonly FormTemplate DocumentProperties = new FormTemplate(formTypes.DocumentProperties);
        public static readonly FormTemplate MessageBox = new FormTemplate(formTypes.MessageBox);
        public static readonly FormTemplate TestForm = new FormTemplate(formTypes.TestForm);
        private FormTemplate(formTypes ft)
        {
            type = ft;
        }
        protected override string GetRootFolder()
        {
            switch (type)
            {
                case formTypes.TestForm:
                    return Path.Combine(templateFolder, "Forms");
                //case formTypes.Form:
                //case formTypes.ModalForm:
                case formTypes.MessageBox:
                    return Path.Combine(templateFolder, "Forms");
                case formTypes.ActivationFailed:
                case formTypes.ActivationSuccessful:
                case formTypes.ChangePassword:
                case formTypes.Login:
                case formTypes.PasswordReset:
                case formTypes.PasswordResetConfirmation:
                case formTypes.PasswordResetFailed:
                case formTypes.Register:
                case formTypes.RegistrationConfirmation:
                case formTypes.UserProfile:
                    return Path.Combine(templateFolder, "Forms", "Account");
                case formTypes.InsertHyperlink:
                case formTypes.BrowseForLink:
                case formTypes.PageProperties:
                case formTypes.DirectoryProperties:
                case formTypes.DocumentProperties:
                    return Path.Combine(templateFolder, "Forms", "Editor");
                default:
                    throw new ApplicationException("No root for form");
            }
        }
        protected override string GetTemplateFilename()
        {
            return string.Format("{0}.html", type.ToString().ToLower());
        }
        public static FormTemplate FromString(string type)
        {
            formTypes ft = (formTypes)Enum.Parse(typeof(formTypes), type, true);
            switch(ft)
            {
                case formTypes.ActivationSuccessful:
                    return ActivationSuccessful;
                case formTypes.ActivationFailed:
                    return ActivationFailed;
                case formTypes.ChangePassword:
                    return ChangePassword;
                //case formTypes.Form:
                //    return Form;
                //case formTypes.ModalForm:
                //    return ModalForm;
                case formTypes.MessageBox:
                    return MessageBox;
                case formTypes.Login:
                    return Login;
                case formTypes.PasswordReset:
                    return PasswordReset;
                case formTypes.PasswordResetConfirmation:
                    return PasswordResetConfirmation;
                case formTypes.PasswordResetFailed:
                    return PasswordResetFailed;
                case formTypes.Register:
                    return Register;
                case formTypes.RegistrationConfirmation:
                    return RegistrationConfirmation;
                case formTypes.UserProfile:
                    return UserProfile;
                case formTypes.InsertHyperlink:
                    return InsertHyperlink;
                case formTypes.BrowseForLink:
                    return BrowseForLink;
                case formTypes.PageProperties:
                    return PageProperties;
                case formTypes.DirectoryProperties:
                    return DirectoryProperties;
                case formTypes.DocumentProperties:
                    return DocumentProperties;
                case formTypes.TestForm:
                    return TestForm;
            }
            throw new ArgumentOutOfRangeException("type");
        }
        public override string ToString()
        {
            return type.ToString().ToLower();
        }
    }
    public class EmailTemplate : TemplateBase
    {
        private enum emailCode
        {
            None,
            AccountActivation,
            PasswordReset
        }
        private emailCode type;
        public static readonly EmailTemplate AccountActivation = new EmailTemplate(emailCode.AccountActivation);
        public static readonly EmailTemplate PasswordReset = new EmailTemplate(emailCode.PasswordReset);
        private EmailTemplate(emailCode type)
        {
            this.type = type;
        }
        public override string ToString()
        {
            return type.ToString().ToLower();
        }
        protected override string GetRootFolder()
        {
            return Path.Combine(templateFolder, "Emails");
        }
        protected override string GetTemplateFilename()
        {
            return string.Format("{0}.html", type.ToString());
        }
        //protected override string GetRootFolder()
        //{
        //    throw new NotImplementedException();
        //}

        //protected override string GetTemplateFilename()
        //{
        //    throw new NotImplementedException();
        //}
    }

    //public class TemplateFactory : CustomFactory
    //{
    //    public FormTypes FormType { get; set; }
    //    public EmailTypes EmailType { get; set; }
    //    public string GetFormTemplate()
    //    {
    //        FileInfo file = null;
    //        return GetFormTemplate(out file);
    //    }
    //    public string GetFormTemplate(out FileInfo file)
    //    {
    //        Debug.Assert(FormType != null);
    //        return FormType.GetTemplate(out file);
    //        //FormTemplates tf = null;
    //        //switch (customisation)
    //        //{
    //        //    //case Customisation.DonWhillansHut:
    //        //    //    tf = new DWHTemplateFactory();
    //        //    //    break;
    //        //    default:
    //        //        tf = new FormTemplates(FormType);
    //        //        break;
    //        //}
    //        //return tf.GetTemplate(out file);
    //    }
    //    public string GetEmailTemplate()
    //    {
    //        Debug.Assert(EmailType != null);
    //        EmailTemplates tf = null;
    //        switch (customisation)
    //        {
    //            //case Customisation.DonWhillansHut:
    //            //    tf = new DWHTemplateFactory();
    //            //    break;
    //            default:
    //                tf = new EmailTemplates(EmailType);
    //                break;
    //        }
    //        return tf.GetTemplate();
    //    }
    //}
    //public class TemplateFactory : CustomFactory
    //{
    //    public static string GetFormTemplate(FormTypes type)
    //    {
    //        return TemplateFactory.GetFormTemplates(type).GetTemplate();
    //    }
    //    public static string GetFormTemplate(FormTypes type, out FileInfo file)
    //    {
    //        return TemplateFactory.GetFormTemplates(type).GetTemplate(out file);
    //    }
    //    public static string GetEmailTemplate(EmailTypes type)
    //    {
    //        return TemplateFactory.GetEmailTemplates(type).GetTemplate();
    //    }
    //    private static EmailTemplates GetEmailTemplates(EmailTypes type)
    //    {
    //        EmailTemplates tf = null;
    //        switch (customisation)
    //        {
    //            //case Customisation.DonWhillansHut:
    //            //    tf = new DWHTemplateFactory();
    //            //    break;
    //            default:
    //                tf = new EmailTemplates(type);
    //                break;
    //        }
    //        return tf;
    //    }
    //    private static FormTemplates GetFormTemplates(FormTypes type)
    //    {
    //        FormTemplates tf = null;
    //        switch (customisation)
    //        {
    //            //case Customisation.DonWhillansHut:
    //            //    tf = new DWHTemplateFactory();
    //            //    break;
    //            default:
    //                tf = new FormTemplates(type);
    //                break;
    //        }
    //        return tf;
    //    }
    //}
    //public abstract class TemplatesBase
    //{
    //    protected string templateFolder = HostingEnvironment.MapPath("~/Templates");
    //    protected abstract string GetRootFolder();
    //    protected abstract string GetTemplateFilename();
    //    public string GetTemplate()
    //    {
    //        FileInfo file;
    //        return GetTemplate(out file);
    //    }
    //    public string GetTemplate(out FileInfo file)
    //    {
    //        string fn = Path.Combine(GetRootFolder(), GetTemplateFilename());
    //        return ReadText(fn, out file);
    //    }
    //    protected void SetTemplateFolder(string templateRootUrl)
    //    {
    //        templateFolder = HostingEnvironment.MapPath(templateRootUrl);
    //    }
    //    private string ReadText(string fn, out FileInfo file)
    //    {
    //        if (fn != null)
    //        {
    //            file = new FileInfo(fn);
    //            return File.ReadAllText(file.FullName);
    //        }
    //        else
    //        {
    //            file = null;
    //            return string.Empty;
    //        }
    //    }
    //}
    //class EmailTemplates : TemplatesBase
    //{
    //    protected EmailTypes type;
    //    public EmailTemplates(EmailTypes type)
    //    {
    //        this.type = type;
    //    }
    //    protected override string GetRootFolder()
    //    {
    //        return Path.Combine(templateFolder, "Emails");
    //    }
    //    protected override string GetTemplateFilename()
    //    {
    //        return string.Format("{0}.html", type.ToString());
    //    }
    //}
    //public class FormTemplates : TemplatesBase
    //{
    //    protected FormTypes type;
    //    protected FormTemplates()
    //    {
    //    }
    //    public FormTemplates(FormTypes type)
    //    {
    //        this.type = type;
    //    }
    //    protected override string GetRootFolder()
    //    {
    //        return type.GetRootFolder();
    //        //switch (type)
    //        //{
    //        //    case FormTypes.Form:
    //        //    case FormTypes.ModalForm:
    //        //        return Path.Combine(templateFolder, "Forms");
    //        //    default:
    //        //        return Path.Combine(templateFolder, "Forms", "Account");
    //        //}

    //    }
    //    protected override string GetTemplateFilename()
    //    {

    //        return string.Format("{0}.html", type.ToString().ToLower());
    //    }
    //}
}