using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public class EmailTemplate
    {
        public long EmailTemplateId { get; set; }
        public BookingEmailTemplates Template { get; set; }
        public string BodyText { get; set; }
        public string SubjectText { get; set; }
    }
}
