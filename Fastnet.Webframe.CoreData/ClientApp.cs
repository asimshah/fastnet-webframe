using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class ClientApp
    {
        public long ClientAppId { get; set; }
        public string Name { get; set; }
        public bool IsInstalled { get; set; }
        public string Url { get; set; }
        [Timestamp]
        public byte[] Timestamp { get; set; }

        //public virtual ICollection<GroupClientApp> GroupClientApps { get; set; }
    }
}