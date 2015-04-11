using Fastnet.Webframe.Web.Areas.Designer.Common;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Fastnet.Webframe.Web.Controllers;
using Fastnet.Webframe.Web.Common;
//using System.Web.Mvc;

namespace Fastnet.Webframe.Web.Areas.Designer.Controllers
{
    [RoutePrefix("designer/template")]
    public class DesignerTemplateController : ApiController
    {
        [HttpGet]
        [Route("form/{type}")]
        public HttpResponseMessage GetForm(string type)
        {
            DesignerFormTemplate ft = DesignerFormTemplate.FromString(type);
            return GetTemplate(ft);
        }
        //private HttpResponseMessage GetTemplate(DesignerFormTemplate template)
        private HttpResponseMessage GetTemplate(TemplateBase template)
        {
            FileInfo file;

            var text = template.GetTemplate(out file);

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
