using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.LegacyData.DWH
{
    public enum BookingStatus
    {
        Provisional,
        Confirmed,
        Cancelled,
        Accepted
    }
    public enum BookingItemStatus
    {
        Available,
        UnAvailable
    }
    public enum BookableItemTypes
    {
        Bed,
        Room,
        Suite,
        Hut
    }
    public class PricingCategory
    {
        public long PricingCategoryId { get; set; }
        public string Name { get; set; }
    }
    public partial class BookableItem
    {
        //[Key]
        public long BookableItemId { get; set; }
        public BookableItemTypes Type { get; set; }
        public string Name { get; set; }
        public virtual PricingCategory PricingCategory { get; set; }
    }
    public partial class ReleasedItem
    {
        public long ReleasedItemId { get; set; }
        public virtual BookableItem BookableItem { get; set; }
        public DateTime Date { get; set; }
        public bool Blocked { get; set; }
        public virtual Booking Booking { get; set; }
        public BookingItemStatus Status { get; set; }
    }
    public partial class Booking
    {
        public long BookingId { get; set; }
        public string Reference { get; set; }
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public DateTime BookingDate { get; set; }
        public BookingStatus Status { get; set; }
        public Decimal TotalCost { get; set; }
        public bool IsPaid { get; set; }
        //[AllowHtml]
        public string Notes { get; set; }
        [MaxLength(128)]
        public string EntryInformation { get; set; }
        public virtual Visitor Visitor { get; set; }
        public virtual ICollection<ReleasedItem> ReleasedItems { get; set; }
        public bool Under18sInParty { get; set; }
    }
    public partial class Visitor
    {
        [Key]
        public long VisitorId { get; set; }
        [MaxLength(256)]
        public string Email { get; set; }
        [MaxLength(64)]
        public string MobilePhone { get; set; }
        [MaxLength(64)]
        public string Phone { get; set; }
        [MaxLength(64)]
        public string FirstName { get; set; }
        [MaxLength(64)]
        public string LastName { get; set; }
        [MaxLength(128)]
        public string AssociationReference { get; set; }

        [NotMapped]
        public string Name { get { return FirstName + " " + LastName; } }
    }
    public class DayBookEntry
    {
        public long DayBookEntryId { get; set; }
        public DateTime Day { get; set; }
        public bool IsUnavailable { get; set; }
    }
    public class EntryCode
    {
        public long EntryCodeId { get; set; }
        public DateTime ApplicableFrom { get; set; }
        public string Code { get; set; }

    }
}
