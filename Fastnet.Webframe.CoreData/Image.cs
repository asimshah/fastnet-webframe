using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    public partial class Image
    {
        [Key,  DatabaseGenerated(DatabaseGeneratedOption.None)]
        public long ImageId { get; set; }
        public string Name { get; set; }
        public byte[] Data { get; set; }
        public System.DateTimeOffset CreatedOn { get; set; }
        public string CreatedBy { get; set; }
        public ImageType ImageType { get; set; }
        public int Height { get; set; }
        public int Width { get; set; }
        public byte[] TimeStamp { get; set; }
        public virtual Directory Directory { get; set; }
        [NotMapped]
        public string MimeType
        {
            get
            {
                switch (this.ImageType)
                {
                    default:
                    case ImageType.Jpeg:
                    //case ImageType.Emz:
                        return "image/jpeg";
                    case ImageType.Png:
                        return "image/png";
                    case ImageType.Gif:
                        return "image/gif";
                }
            }
        }
        [NotMapped]
        public string Url
        {
            get { return string.Format("image/{0}", ImageId); }
        }
        [NotMapped]
        public string Size
        {
            get { return string.Format("{0}w x {1}h", this.Width, this.Height); }
        }

        public string GetImageTypeImage()
        {
            return "content/images/image.png";
        }
    }
    public partial class CoreDataContext
    {
        public Image CreateNewImage()
        {
            long largest = 0;
            if ((this.Images.Count() + this.Images.Local.Count()) > 0)
            {
                largest = this.Images.Select(x => x.ImageId).Union(this.Images.Local.Select(x => x.ImageId)).Max(x => x);
            }
            //long? largest = this.Images.Select(x => x.ImageId).Union(this.Images.Local.Select(x => x.ImageId)).Max(x => x);
            return new Image { ImageId = largest + 1};
        }
    }
}
