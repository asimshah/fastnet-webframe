using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class Document
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
        public long DocumentId { get; set; }
        public long DirectoryId { get; set; }
        public string Name { get; set; }
        public string Extension { get; set; }
        public long Length { get; set; }
        public System.DateTimeOffset CreatedOn { get; set; }
        public string CreatedBy { get; set; }
        //public DocumentType Type { get; set; }
        public bool Visible { get; set; }
        public bool Deleted { get; set; }
        public byte[] Data { get; set; }
        public string MimeType { get; set; }
        //public long? OriginalDocumentId { get; set; }
        [Timestamp]
        public byte[] TimeStamp { get; set; }
        public virtual ICollection<Page> Pages { get; set; } // these pages hyperlink to this document
        public virtual Directory Directory { get; set; }
        public virtual ICollection<MarkupDocumentLink> MarkupLinks { get; set; }
        [NotMapped]
        public string Url
        {
            get { return string.Format("document/{0}", DocumentId); }
        }
    }
    public partial class CoreDataContext
    {
        public Document CreateNewDocument()
        {
            long largest = 0;
            if ((this.Documents.Count() + this.Documents.Local.Count()) > 0)
            {
                largest = this.Documents.Select(x => x.DocumentId).Union(this.Documents.Local.Select(x => x.DocumentId)).Max(x => x);
            }

            return new Document { DocumentId = largest + 1 };
        }
    }
}