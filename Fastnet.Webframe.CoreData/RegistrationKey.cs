using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class RegistrationKey
    {
        public long RegistrationKeyId { get; set; }
        [Column("RegistrationKey")]
        public string Key { get; set; }
        public string Description { get; set; }
        public string EmailTemplate { get; set; }
        [Timestamp]
        public byte[] TimeStamp { get; set; }
        //
        public virtual ICollection<Group> Groups { get; set; }
    }
}