using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class UploadFile
    {
        public long UploadFileId { get; set; }
        public string Name { get; set; }
        public string MimeType { get; set; }
        public long DirectoryId { get; set;}
        //public System.DateTime CreatedOn { get; set; }
        public string Guid { get; set; }
        public long TotalChunks{ get; set; }
        public long BinaryLength { get; set; }
        //public bool Complete { get; set; }
        //[Timestamp]
        //public byte[] TimeStamp { get; set; }
        public virtual ICollection<FileChunk> FileChunks { get; set; }
    }
}