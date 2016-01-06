using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    public class SageTransaction
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
        [MaxLength(128)]
        public string VendorTxCode { get; set; }
        [MaxLength(16)]
        public string SecurityKey { get; set; }
        [MaxLength(64)]
        public string VpsTxId { get; set; }
        [MaxLength(255)]
        public string RedirectUrl { get; set; }
        public DateTime Timestamp { get; set; }
        public long LongUserKey { get; set; }
        [MaxLength(128)]
        public string GuidUserKey { get; set; }
        [MaxLength(255)]
        public string UserString { get; set; }
    }
}
