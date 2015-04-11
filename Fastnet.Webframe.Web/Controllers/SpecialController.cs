using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Web.Hosting;
using System.Web.Http;


namespace Fastnet.Webframe.Web.Controllers
{
    [RoutePrefix("special")]
    public class SpecialController : ApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        [HttpGet]
        [Route("updateCSSFromDB")]
        public HttpResponseMessage WriteCSSFromDB()
        {
            DataContext.CreateCSSFiles();
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }

        [HttpGet]
        [Route("echo/{counter?}")]
        public HttpResponseMessage Echo(int counter = 999)
        {
            Random r = new Random();
            int delay = r.Next(2, 10);
            Thread.Sleep(TimeSpan.FromSeconds(delay));
            return this.Request.CreateResponse(HttpStatusCode.OK, new { Counter = counter, Delay = delay });
        }
    }
}
