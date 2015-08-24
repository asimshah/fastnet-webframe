using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public class PriceStructure
    {
        private ICollection<Period> periods;
        public long PriceStructureId { get; set; }
        [Required]
        public string Name { get; set; }
        public virtual ICollection<Period> Periods
        {
            get { return periods ?? (periods = new HashSet<Period>()); }
            set { periods = value; }
        }
    }
    public class Price
    {
        [Key]
        [Column(Order = 1)]
        public virtual Period Period { get; set; }
        //public long PriceId { get; set; }
        [Key]
        [Column(Order = 2)]
        public AccomodationType Type { get; set; }
        [Key]
        [Column(Order = 3)]
        public AccomodationClass Class { get; set; }
        [Key]
        [Column(Order = 4)]
        public int MinimumUnits { get; set; } 
        [Required]
        public Decimal Amount { get; set; }
    }


}
