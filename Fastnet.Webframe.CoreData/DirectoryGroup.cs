﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    //[Obsolete]
    //public partial class DirectoryAccessRule
    //{
    //    public long DirectoryAccessRuleId { get; set; }
    //    public long DirectoryId { get; set; }
    //    public long GroupId { get; set; }
    //    public long AccessRuleId { get; set; }
    //    [Timestamp]
    //    public byte[] TimeStamp { get; set; }

    //    public virtual Directory  Directory { get; set;}
    //    public virtual AccessRule AccessRule { get; set; }
    //    public virtual Group Group { get; set; }
    //}
    public partial class DirectoryGroup
    {
        [Key, Column(Order = 0)]
        public long DirectoryId { get; set; }
        [Key, Column(Order = 1)]
        public long GroupId { get; set; }
        //
        public virtual Directory Directory { get; set; }
        public virtual Group Group { get; set; }
        //
        [Mapped]
        internal Permission Permission {  get; set; }
        [NotMapped]
        public bool ViewAllowed { get { return Permission.HasFlag(Permission.ViewPages) || Permission.HasFlag(Permission.EditPages); } }
        [NotMapped]
        public bool EditAllowed { get { return Permission.HasFlag(Permission.EditPages); } }
    }
}