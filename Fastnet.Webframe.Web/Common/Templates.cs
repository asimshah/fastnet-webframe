using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Web;
using System.Web.Hosting;

namespace Fastnet.Webframe.Web.Common
{
    public class TemplateLibrary //: CustomFactory !! add this when customisinig for DWH
    {
        private class Templates
        {
            // key = template name, value fullpath
            private Dictionary<string, string> dict = new Dictionary<string, string>();
            public void Add(string name, string path)
            {
                dict.Add(name, path);
            }
            public string Get(string name)
            {
                if (dict.ContainsKey(name))
                {
                    return dict[name];
                }
                return null;
            }
        }
        public static TemplateLibrary GetInstance()
        {
            var app = HttpContext.Current.Application;
            if (app.Get("template-library") == null)
            {
                app.Set("template-library", new TemplateLibrary());
            }
            return app.Get("template-library") as TemplateLibrary;
        }
        // key = location, value = list of templates
        private Dictionary<string, Templates> templatesByLocation = new Dictionary<string, Templates>();
        private TemplateLibrary()
        {

        }
        public void AddTemplate(string location, string name, string path)
        {
            location = location.ToLower();
            name = name.ToLower();
            if (!templatesByLocation.ContainsKey(location))
            {
                templatesByLocation.Add(location, new Templates());
            }
            Templates templates = templatesByLocation[location];
            templates.Add(name, path);
        }
        public string GetTemplate(string location, string name)
        {
            FileInfo file;
            return GetTemplate(location, name, out file);
        }
        public string GetTemplate(string location, string name, out FileInfo file)
        {
            location = location.ToLower();
            name = name.ToLower();
            if (templatesByLocation.ContainsKey(location))
            {
                Templates templates = templatesByLocation[location];
                string text = ReadText(templates.Get(name), out file);
                return text;
            }
            file = null;
            return null;
        }
        private static string ReadText(string fn, out FileInfo file)
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
    //public abstract class TemplateBase : CustomFactory
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
    //        switch (customisation)
    //        {
    //            //case Customisation.DonWhillansHut:
    //            //    tf = new DWHTemplateFactory();
    //            //    break;
    //            default:

    //                break;
    //        }
    //        string fn = Path.Combine(GetRootFolder(), GetTemplateFilename());
    //        return ReadText(fn, out file);
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

    //public class EmailTemplate : TemplateBase
    //{
    //    private enum emailCode
    //    {
    //        None,
    //        AccountActivation,
    //        PasswordReset,
    //        EmailAddressChanged
    //    }
    //    private emailCode type;
    //    public static readonly EmailTemplate AccountActivation = new EmailTemplate(emailCode.AccountActivation);
    //    public static readonly EmailTemplate PasswordReset = new EmailTemplate(emailCode.PasswordReset);
    //    public static readonly EmailTemplate EmailAddressChanged = new EmailTemplate(emailCode.EmailAddressChanged);
    //    private EmailTemplate(emailCode type)
    //    {
    //        this.type = type;
    //    }
    //    public override string ToString()
    //    {
    //        return type.ToString().ToLower();
    //    }
    //    protected override string GetRootFolder()
    //    {
    //        return Path.Combine(templateFolder, "Emails");
    //    }
    //    protected override string GetTemplateFilename()
    //    {
    //        return string.Format("{0}.html", type.ToString());
    //    }
    //    //protected override string GetRootFolder()
    //    //{
    //    //    throw new NotImplementedException();
    //    //}

    //    //protected override string GetTemplateFilename()
    //    //{
    //    //    throw new NotImplementedException();
    //    //}
    //}

}