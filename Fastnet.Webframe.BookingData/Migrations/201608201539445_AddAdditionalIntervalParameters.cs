namespace Fastnet.Webframe.BookingData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddAdditionalIntervalParameters : DbMigration
    {
        public override void Up()
        {
            AddColumn("book.Parameters", "CancellationInterval", c => c.Int(nullable: false, defaultValue: 0));
            AddColumn("book.Parameters", "FirstReminderInterval", c => c.Int(nullable: false, defaultValue: 0));
            AddColumn("book.Parameters", "SecondReminderInterval", c => c.Int(nullable: false, defaultValue: 0));
            AddColumn("book.Parameters", "ReminderSuppressionInterval", c => c.Int(nullable: false, defaultValue: 0));
        }
        
        public override void Down()
        {
            DropColumn("book.Parameters", "ReminderSuppressionInterval");
            DropColumn("book.Parameters", "SecondReminderInterval");
            DropColumn("book.Parameters", "FirstReminderInterval");
            DropColumn("book.Parameters", "CancellationInterval");
        }
    }
}
