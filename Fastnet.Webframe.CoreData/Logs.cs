using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    public partial class Recorder
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
        public string RecorderId { get; set; } // from a guid
        public DateTime StartedOn { get; set; }
        private ICollection<Record> records;
        public virtual ICollection<Record> Records
        {
            get { return records ?? (records = new HashSet<Record>()); }
            set { records = value; }
        }
    }
    public partial class Record
    {
        public long RecordId { get; set; }
        public long Sequence { get; set; }
        public DateTime RecordedOn { get; set; }
        public string Text { get; set; }
        public virtual Recorder Recorder { get; set; }
    }
}
