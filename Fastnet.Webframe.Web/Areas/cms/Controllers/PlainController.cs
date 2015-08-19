using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace Fastnet.Webframe.Web.Areas.cms.Controllers
{
    public class PlainController : ApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        [HttpGet]
        //[Route("get/ss/membershiphistory")]
        public async Task<HttpResponseMessage> GetMembershipHistoryPaged()
        {
            var data = await DataContext.Actions.OfType<MemberAction>().OrderByDescending(x => x.RecordedOn).ToArrayAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK, data);
        }
    }
}
