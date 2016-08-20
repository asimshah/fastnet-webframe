namespace Fastnet.Webframe.BookingData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class RenamePeriodParameters : DbMigration
    {
        public override void Up()
        {
            //AddColumn("book.Parameters", "PaymentInterval", c => c.Int());
            //AddColumn("book.Parameters", "EntryCodeNotificationInterval", c => c.Int());
            //AddColumn("book.Parameters", "EntryCodeBridgeInterval", c => c.Int());
            //DropColumn("book.Parameters", "ShortBookingInterval");
            //DropColumn("book.Parameters", "EntryCodeNotificationPeriod");
            //DropColumn("book.Parameters", "EntryCodeBridgePeriod");

            RenameColumn("book.Parameters", "ShortBookingInterval", "PaymentInterval");
            RenameColumn("book.Parameters", "EntryCodeNotificationPeriod", "EntryCodeNotificationInterval");
            RenameColumn("book.Parameters", "EntryCodeBridgePeriod", "EntryCodeBridgeInterval");
        }
        
        public override void Down()
        {
            //AddColumn("book.Parameters", "EntryCodeBridgePeriod", c => c.Int());
            //AddColumn("book.Parameters", "EntryCodeNotificationPeriod", c => c.Int());
            //AddColumn("book.Parameters", "ShortBookingInterval", c => c.Int());
            //DropColumn("book.Parameters", "EntryCodeBridgeInterval");
            //DropColumn("book.Parameters", "EntryCodeNotificationInterval");
            //DropColumn("book.Parameters", "PaymentInterval");

            RenameColumn("book.Parameters", "PaymentInterval", "ShortBookingInterval");
            RenameColumn("book.Parameters", "EntryCodeNotificationInterval", "EntryCodeNotificationPeriod");
            RenameColumn("book.Parameters", "EntryCodeBridgeInterval", "EntryCodeBridgePeriod");
        }
    }
}
