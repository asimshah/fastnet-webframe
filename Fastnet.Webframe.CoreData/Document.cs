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
        //public virtual ICollection<MarkupDocumentLink> MarkupLinks { get; set; }
        [NotMapped]
        public string Url
        {
            get { return string.Format("document/{0}", DocumentId); }
        }
        public string GetTypeImageUrl()
        {
            string r = null;
            switch (Extension)
            {
                default:
                    r = "content/images/documenttypes/unknownsmall.png";
                    break;
                case ".mp3":
                    r = "content/images/documenttypes/audiosmall.png";
                    break;
                case ".css":
                    r = "content/images/documenttypes/csssmall.png";
                    break;
                case ".dotx":
                    r = "content/images/documenttypes/dotxsmall.png";
                    break;
                case ".xls":
                case ".xlsx":
                    r = "content/images/documenttypes/excelsmall.png";
                    break;
                case ".pdf":
                    r = "content/images/documenttypes/pdfsmall.png";
                    break;
                case ".ppt":
                case ".pptx":
                    r = "content/images/documenttypes/powerpointsmall.png";
                    break;
                case ".doc":
                case ".docx":
                    r = "content/images/documenttypes/wordsmall.png";
                    break;
                case ".mp4":
                case ".mpg":
                case ".mpeg":
                case ".avi":
                case ".flv":
                case ".mov":
                case ".wmc":
                    r = "content/images/documenttypes/videosmall.png";
                    break;
            }
            return r;
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