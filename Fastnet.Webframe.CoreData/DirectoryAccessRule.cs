using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class DirectoryAccessRule
    {
        public long DirectoryAccessRuleId { get; set; }
        public long DirectoryId { get; set; }
        public long GroupId { get; set; }
        public long AccessRuleId { get; set; }
        [Timestamp]
        public byte[] TimeStamp { get; set; }

        public virtual Directory  Directory { get; set;}
        public virtual AccessRule AccessRule { get; set; }
        public virtual Group Group { get; set; }
    }
}