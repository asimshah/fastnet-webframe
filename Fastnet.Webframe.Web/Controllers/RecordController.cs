using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace Fastnet.Webframe.Web.Controllers
{
    [RoutePrefix("recorder")]
    public class RecordController : ApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        [HttpPost]
        [Route("write")]
        public async Task<HttpResponseMessage> Record(dynamic data)
        {
            string key = data.key;
            Debug.Assert(key != null && key != "undefined");
            Recorder recorder = DataContext.Recorders.SingleOrDefault(x => x.RecorderId == key);
            if(recorder == null)
            {
                recorder = new Recorder
                {
                    StartedOn = DateTime.UtcNow,
                    RecorderId = key
                };
                DataContext.Recorders.Add(recorder);
            }
            Record r = new Record
            {
                Sequence = recorder.Records.Count() + 1,
                RecordedOn = DateTime.UtcNow,
                Text = data.text,
                Recorder = recorder
            };
            DataContext.Records.Add(r);
            await DataContext.SaveChangesAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpGet]
        [Route("read/{key}")]
        public HttpResponseMessage ReadRecords(string key)
        {
            Recorder recorder = DataContext.Recorders.SingleOrDefault(x => x.RecorderId == key);
            var records = recorder.Records.OrderByDescending(x => x.Sequence)
                .Take(25)
                //.OrderBy(x => x.Sequence)
                .Select(y => string.Format("[{0}] {1}", y.Sequence, y.Text)).ToList();
                //.Select(y => y.Text).ToList();
            return this.Request.CreateResponse(HttpStatusCode.OK, records);
        }
    }
}
