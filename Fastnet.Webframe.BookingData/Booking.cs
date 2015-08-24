﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public enum BookingStatus
    {
        Confirmed,
        Cancelled,
        Accepted
    }
    public class Booking
    {
        private ICollection<Accomodation> accomodationSet;
        public long BookingId { get; set; }
        [MaxLength(32)]
        public string Reference { get; set; }
        [MaxLength(128)]
        public string MemberId { get; set; }
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public DateTime CreatedOn { get; set; }
        public Decimal TotalCost { get; set; }
        public bool IsPaid { get; set; }
        public string Notes { get; set; }
        [MaxLength(128)]
        public string EntryInformation { get; set; }
        public bool Under18sInParty { get; set; }
        public virtual ICollection<Accomodation> AccomodationCollection
        {
            get { return accomodationSet ?? (accomodationSet = new HashSet<Accomodation>()); }
            set { accomodationSet = value; }
        }
    }
}
