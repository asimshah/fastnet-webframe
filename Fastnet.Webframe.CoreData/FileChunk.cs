using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class FileChunk
    {
        public long FileChunkId { get; set; }
        public long UploadFileId { get; set; }
        public int ChunkNumber { get; set; }
        //public long Length { get; set; }
        public string Base64String { get; set; }
        //public byte[] TimeStamp { get; set; }

        public virtual UploadFile UploadFile { get; set; }
    }
}