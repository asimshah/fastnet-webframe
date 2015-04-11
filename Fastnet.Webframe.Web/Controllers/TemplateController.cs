using Fastnet.Webframe.Web.Areas.Designer.Common;
using Fastnet.Webframe.Web.Common;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Hosting;
using System.Web.Http;

namespace Fastnet.Webframe.Web.Controllers
{

    [RoutePrefix("template")]
    public class TemplateController : ApiController
    {
        //private string templateFolder = HostingEnvironment.MapPath("~/Templates");
        [HttpGet]
        [Route("form/{type}")]
        public HttpResponseMessage GetForm(string type)
        {
            FormTemplate ft = FormTemplate.FromString(type);// (FormTypes)Enum.Parse(typeof(FormTypes), type, true);
            return GetTemplate(ft);
        }
        //[HttpGet]
        //[Route("form/{area?}/{type}")]
        //public HttpResponseMessage GetForm(string area, string type)
        //{
        //    switch (area)
        //    {
        //        default:
        //            break;
        //        case "":
        //        case null:
        //            FormTemplate ft = FormTemplate.FromString(type);// (FormTypes)Enum.Parse(typeof(FormTypes), type, true);
        //            return GetTemplate(ft);
        //        case "designer":
        //            //var tf = new DesignerFormTemplates()
        //            break;
        //    }
        //    return this.Request.CreateResponse(HttpStatusCode.NotFound);
        //}
        //[HttpGet]
        //[Route("registration")]
        //public HttpResponseMessage Register()
        //{            
        //    return GetTemplate(FormTypes.Registration);
        //}
        //[HttpGet]
        //[Route("changepassword")]
        //public HttpResponseMessage ChangePassword()
        //{
        //    return GetTemplate(FormTypes.ChangePassword);
        //}
        //[HttpGet]
        //[Route("registrationconfirmation")]
        //public HttpResponseMessage RegistrationConfirmation()
        //{
        //    return GetTemplate(FormTypes.RegistrationConfirmation);
        //}
        //[HttpGet]
        //[Route("activationfailed")]
        //public HttpResponseMessage ActivationFailed()
        //{
        //    return GetTemplate(FormTypes.ActivationFailed);
        //}
        //[HttpGet]
        //[Route("passwordreset")]
        //public HttpResponseMessage PasswordReset()
        //{
        //    return GetTemplate(FormTypes.PasswordReset);
        //}
        //[HttpGet]
        //[Route("passwordresetconfirmation")]
        //public HttpResponseMessage PasswordResetConfirmation()
        //{
        //    return GetTemplate(FormTypes.PasswordResetConfirmation);
        //}
        //[HttpGet]
        //[Route("passwordresetfailed")]
        //public HttpResponseMessage PasswordResetFailed()
        //{
        //    return GetTemplate(FormTypes.PasswordResetFailed);
        //}
        //[HttpGet]
        //[Route("userprofile")]
        //public HttpResponseMessage UserProfile()
        //{
        //    return GetTemplate(FormTypes.UserProfile);
        //}
        //[HttpGet]
        //[Route("login")]
        //public HttpResponseMessage Login()
        //{
        //    return GetTemplate(FormTypes.Login);
        //}
        //[HttpGet]
        //[Route("modalform")]
        //public HttpResponseMessage ModalForm()
        //{
        //    return GetTemplate(FormTypes.ModalForm);
        //}
        //[HttpGet]
        //[Route("form")]
        //public HttpResponseMessage Form()
        //{
        //    return GetTemplate(FormTypes.Form);
        //}
        private HttpResponseMessage GetTemplate(FormTemplate template)
        {
            FileInfo file;
            
            //var tf = new TemplateFactory { FormType = template };
            //var text = tf.GetFormTemplate(out file);
            var text = template.GetTemplate(out file);
            //var text = TemplateFactory.GetFormTemplate(template, out file);
            //var text = TemplateFactory.GetTemplate(template, out file);
            if (file != null)
            {
                return this.Request.CreateCacheableResponse(HttpStatusCode.OK, new { Template = text }, file.LastWriteTime, file.FullName);
            }
            else
            {
                return this.Request.CreateResponse(HttpStatusCode.NotFound);
            }

        }

    }
}
