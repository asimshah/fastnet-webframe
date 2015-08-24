using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public class AccomodationExtra
    {
        public long AccomodationExtraId { get; set; }
        public OptionalExtras Extra { get; set; }
        public virtual Accomodation Accomodation { get; set; }
    }
    public class Accomodation
    {
        private ICollection<Booking> bookings;
        private ICollection<Accomodation> subAccomodationSet;
        private ICollection<Availability> availabilities;
        public long AccomodationId { get; set; }
        public AccomodationType Type { get; set; }
        public AccomodationClass Class { get; set; }
        [Index(IsUnique = true)]
        [MaxLength(32)]
        [Required]
        public string Name { get; set; } // e.g 12 for room 12, "Ocean View" for the villa called Ocean View, etc
        public bool SubAccomodationSeparatelyBookable { get; set; }
        public bool Bookable { get; set; } // if false, then SubAccomodationSeparatelyBookable should be true, else it is means this accomodation has been taken out of service
        public Accomodation ParentAccomodation { get; set; }
        public virtual ICollection<AccomodationExtra> Extras { get; set; }
        public virtual ICollection<Accomodation> SubAccomodation
        {
            get { return subAccomodationSet ?? (subAccomodationSet = new HashSet<Accomodation>()); }
            set { subAccomodationSet = value; }
        }
        public virtual ICollection<Availability> Availabilities
        {
            get { return availabilities ?? (availabilities = new HashSet<Availability>()); }
            set { availabilities = value; }
        }
        public virtual ICollection<Booking> Bookings
        {
            get { return bookings ?? (bookings = new HashSet<Booking>()); }
            set { bookings = value; }
        }
        public bool IsBlocked(DateTime day)
        {
            bool result = Availabilities.Where(x => x.Blocked).ToArray()
                 .Any(x => x.Period.Includes(day));
            if (result)
            {
                return result;
            }
            else if (ParentAccomodation != null)
            {
                return ParentAccomodation.IsBlocked(day);
            }
            return result;
        }
        public bool IsFree(DateTime day)
        {
            bool result = false;
            var bookings = Bookings.Where(b => day >= b.From && day <= b.To);
            if (bookings.Count() == 0)
            {
                if (ParentAccomodation == null)
                {
                    result = true;
                }
                else
                {
                    result = this.ParentAccomodation.IsFree(day);
                }
            }
            return result;
        }
    }



}

