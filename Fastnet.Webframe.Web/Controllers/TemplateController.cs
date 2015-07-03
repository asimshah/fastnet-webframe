using Fastnet.Web.Common;
using Fastnet.Webframe.WebApi;
using System.Net.Http;
using System.Web.Http;

namespace Fastnet.Webframe.Web.Controllers
{
    public enum tt
    {
        one, two
    }
    [RoutePrefix("template")]
    public class TemplateController : BaseApiController //: ApiController
    {
        //[HttpGet]
        //[Route("form/{type}")]
        //public HttpResponseMessage GetForm(string type)
        //{
        //    FormTemplate ft = FormTemplate.FromString(type);
        //    //return GetTemplate(ft);
        //    return this.Request.GetTemplate(ft);
        //}
        [HttpGet]
        [Route("get/{location}/{name}")]
        public HttpResponseMessage GetTemplate(string location, string name)
        {
            return this.Request.GetTemplate(location, name);
        }

    }
}
