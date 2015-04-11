using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class CloneInformation
    {
        public long CloneInformationId { get; set; }
        public string CloneKey { get; set; }
        public string TypeName { get; set; }
        public long OriginalId { get; set; }
        public long CloneId { get; set; }
    }
}