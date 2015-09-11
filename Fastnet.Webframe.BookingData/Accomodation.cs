using Fastnet.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;
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
    public class Accomodation : Hierarchy<Accomodation>
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
        public string Fullname { get; set; }
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
        public override Accomodation GetParent()
        {
            return this.ParentAccomodation;
        }
        public override IEnumerable<Accomodation> GetChildren()
        {
            return this.SubAccomodation;
        }
        [NotMapped]
        public string DisplayName
        {
            get { return Fullname?? Name; }
        }
    }




}

