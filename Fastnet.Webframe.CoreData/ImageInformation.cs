using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class ImageInformation
    {
        //[Key, Column("TopicImageId"), DatabaseGenerated(DatabaseGeneratedOption.None)]
        //public long ImageInformationId { get; set; }
        //public byte[] Image { get; set; }
        //public ImageType ImageType { get; set; }
        //public int Height { get; set; }
        //public int Width { get; set; }
        //[Column("OriginalTopicImageId")]
        //public long? OriginalImageInformationId { get; set; }
        //public byte[] TimeStamp { get; set; }
        //[NotMapped]
        //public string MimeType
        //{
        //    get
        //    {
        //        switch (this.ImageType)
        //        {
        //            default:
        //            case ImageType.Jpg:
        //            case ImageType.Emz:
        //                return "image/jpg";
        //            case ImageType.Png:
        //                return "image/png";
        //            case ImageType.Gif:
        //                return "image/gif";
        //        }
        //    }
        //}
    }
}