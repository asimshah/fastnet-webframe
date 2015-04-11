using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class GroupRegistrationKey
    {
        public long GroupRegistrationKeyId { get; set; }
        public long GroupId { get; set; }
        public long RegistrationKeyId { get; set; }
        public byte[] TimeStamp { get; set; }

        public virtual Group Group { get; set; }
        public virtual RegistrationKey RegistrationKey { get; set; }
    }
}