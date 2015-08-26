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
    public class Accomodation //: Hierarchy<Accomodation>
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
            //if (result)
            //{
            //    return result;
            //}
            //else if (ParentAccomodation != null)
            //{
            //    return ParentAccomodation.IsBlocked(day);
            //}
            return result;
        }
        /// <summary>
        /// True if this accomodation item is itself booked
        /// </summary>
        /// <param name="day"></param>
        /// <returns></returns>
        public bool IsBooked(DateTime day)
        {
            string m = null;
            try
            {
                m = string.Format("IsBooked(): {0}, {1}", this.Name, day.ToString("ddMMMyyyy"));
                var count = Bookings.Where(b => day >= b.From && day <= b.To).Count();
                Debug.Print("{0}: {1} bookings", m, count);
                return count > 0;
            }
            catch (Exception xe)
            {
                Debug.Print("{0}: exception", m, xe.Message);
                Debugger.Break();
                throw;
            }
            //return Bookings.Count(b => day >= b.From && day <= b.To) > 0;
        }
        /// <summary>
        /// True if this accomodation item can be booked, ie. it is bookable and all subaccomodation IsAvailableToBook
        /// </summary>
        /// <param name="day"></param>
        /// <returns></returns>
        public bool IsAvailableToBook(DateTime day)
        {
            bool free = Bookable && !IsBooked(day);
            if(free)
            {
                bool subAccomodationFree = SubAccomodation.All(x => x.IsAvailableToBook(day));
                bool parentFree = ParentAccomodation == null ? true : ParentAccomodation.IsAvailableToBook(day);
                return parentFree && subAccomodationFree;
            }
            return false;
        }

        //public override Accomodation GetParent()
        //{
        //    return ParentAccomodation;
        //}

        //public override IEnumerable<Accomodation> GetChildren()
        //{
        //    return SubAccomodation;
        //}
    }

    public class AccomodationTO : Hierarchy<AccomodationTO>
    {
        public long AccomodationId { get; set; }
        public AccomodationType Type { get; set; }
        public AccomodationClass Class { get; set; }
        public string Name { get; set; } // e.g 12 for room 12, "Ocean View" for the villa called Ocean View, etc
        public bool SubAccomodationSeparatelyBookable { get; set; }
        public bool Bookable { get; set; } // if false, then SubAccomodationSeparatelyBookable should be true, else it is means this accomodation has been taken out of service
        public AccomodationTO ParentAccomodation { get; set; }
        public List<AccomodationTO> SubAccomodation { get; set; }
        public bool IsBookable { get; set; }
        public bool IsBooked { get; set; }
        public bool IsAvailableToBook { get; set; }
        public string BookingReference { get; set; }

        public override AccomodationTO GetParent()
        {
            return ParentAccomodation;
        }
        public override IEnumerable<AccomodationTO> GetChildren()
        {
            return SubAccomodation;
        }
        public override string ToString()
        {
            return string.Format("{0} {1}, Bookable = {2}, Booked = {3}, Available = {4}", Name,
                ParentToString(), IsBookable, IsBooked, IsAvailableToBook);//,GetSubAccomodationStatus());
            //return base.ToString();
        }
        private string ParentToString()
        {
            string fmt = ParentAccomodation == null ? "" : "(in {0})";
            return string.Format(fmt, ParentAccomodation?.Name);
        }
    }


}

