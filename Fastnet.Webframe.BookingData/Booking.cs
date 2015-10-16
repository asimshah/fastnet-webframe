﻿using Fastnet.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public enum BookingStatus
    {
        Provisional,
        Confirmed,
        Cancelled,
        Accepted
    }
    public class Booking
    {
        private ICollection<Accomodation> accomodationSet;
        public long BookingId { get; set; }
        public BookingStatus Status { get; set; }
        [MaxLength(32)]
        public string Reference { get; set; }
        [MaxLength(128)]
        public string MemberId { get; set; }
        public DateTime From { get; set; }
        public DateTime To { get; set; } // **NB** From/To are inclusive dates, i.e. for a one day booking To will equal From
        public DateTime CreatedOn { get; set; }
        public Decimal TotalCost { get; set; }
        public bool IsPaid { get; set; }
        public string Notes { get; set; }
        public string History { get; set; }
        [MaxLength(128)]
        public string EntryInformation { get; set; }
        public bool Under18sInParty { get; set; }
        public virtual ICollection<Accomodation> AccomodationCollection
        {
            get { return accomodationSet ?? (accomodationSet = new HashSet<Accomodation>()); }
            set { accomodationSet = value; }
        }
        public void AddHistory(string name, string text)
        {
            var today = BookingGlobals.GetToday();
            var time = DateTime.UtcNow;
            text = string.Format("<div class='system-note'><span class='notes-timestamp'>{1} {2}</span> <span class='notes-by'>{0}</span>: <span class='notes-text'>{3}</span><div>",
                name, today.ToDefault(), time.ToString("HH:mm:ss"), text) + System.Environment.NewLine;
            this.History = text + this.History;
        }
    }
    //public class BookingTo
    //{
    //    public long BookingId { get; set; }
    //    public string Reference { get; set; }
    //    public string MemberId { get; set; }
    //    public DateTime From { get; set; }
    //    public DateTime To { get; set; }
    //    public DateTime CreatedOn { get; set; }
    //    public Decimal TotalCost { get; set; }
    //    public bool IsPaid { get; set; }
    //    public string Notes { get; set; }
    //    public string EntryInformation { get; set; }
    //}
}
