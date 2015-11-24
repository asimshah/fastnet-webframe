namespace Fastnet.Webframe.BookingData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class InitialCreate : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "book.AccomodationExtras",
                c => new
                    {
                        AccomodationExtraId = c.Long(nullable: false, identity: true),
                        Extra = c.Int(nullable: false),
                        Accomodation_AccomodationId = c.Long(),
                    })
                .PrimaryKey(t => t.AccomodationExtraId)
                .ForeignKey("book.Accomodations", t => t.Accomodation_AccomodationId)
                .Index(t => t.Accomodation_AccomodationId);
            
            CreateTable(
                "book.Accomodations",
                c => new
                    {
                        AccomodationId = c.Long(nullable: false, identity: true),
                        Type = c.Int(nullable: false),
                        Class = c.Int(nullable: false),
                        Name = c.String(nullable: false, maxLength: 32),
                        Fullname = c.String(),
                        SubAccomodationSeparatelyBookable = c.Boolean(nullable: false),
                        Bookable = c.Boolean(nullable: false),
                        ParentAccomodation_AccomodationId = c.Long(),
                    })
                .PrimaryKey(t => t.AccomodationId)
                .ForeignKey("book.Accomodations", t => t.ParentAccomodation_AccomodationId)
                .Index(t => t.Name, unique: true)
                .Index(t => t.ParentAccomodation_AccomodationId);
            
            CreateTable(
                "book.Availabilities",
                c => new
                    {
                        AvailabilityId = c.Int(nullable: false, identity: true),
                        Description = c.String(),
                        Blocked = c.Boolean(nullable: false),
                        Accomodation_AccomodationId = c.Long(),
                        Period_PeriodId = c.Long(),
                    })
                .PrimaryKey(t => t.AvailabilityId)
                .ForeignKey("book.Accomodations", t => t.Accomodation_AccomodationId)
                .ForeignKey("book.Periods", t => t.Period_PeriodId)
                .Index(t => t.Accomodation_AccomodationId)
                .Index(t => t.Period_PeriodId);
            
            CreateTable(
                "book.Periods",
                c => new
                    {
                        PeriodId = c.Long(nullable: false, identity: true),
                        PeriodType = c.Int(nullable: false),
                        StartDate = c.DateTime(precision: 7, storeType: "datetime2"),
                        EndDate = c.DateTime(precision: 7, storeType: "datetime2"),
                        DaysOfTheWeek = c.Int(nullable: false),
                        Interval_Days = c.Int(nullable: false),
                        Interval_Months = c.Int(nullable: false),
                        Interval_Years = c.Int(nullable: false),
                        ParentPeriod_PeriodId = c.Long(),
                        PriceStructure_PriceStructureId = c.Long(),
                    })
                .PrimaryKey(t => t.PeriodId)
                .ForeignKey("book.Periods", t => t.ParentPeriod_PeriodId)
                .ForeignKey("book.PriceStructures", t => t.PriceStructure_PriceStructureId)
                .Index(t => t.ParentPeriod_PeriodId)
                .Index(t => t.PriceStructure_PriceStructureId);
            
            CreateTable(
                "book.Bookings",
                c => new
                    {
                        BookingId = c.Long(nullable: false, identity: true),
                        Status = c.Int(nullable: false),
                        Reference = c.String(maxLength: 32),
                        MemberId = c.String(maxLength: 128),
                        From = c.DateTime(nullable: false, precision: 7, storeType: "datetime2"),
                        To = c.DateTime(nullable: false, precision: 7, storeType: "datetime2"),
                        CreatedOn = c.DateTime(nullable: false, precision: 7, storeType: "datetime2"),
                        StatusLastChanged = c.DateTime(nullable: false, precision: 7, storeType: "datetime2"),
                        TotalCost = c.Decimal(nullable: false, precision: 18, scale: 2),
                        PartySize = c.Int(nullable: false),
                        IsPaid = c.Boolean(nullable: false),
                        Notes = c.String(),
                        History = c.String(),
                        EntryInformation = c.String(maxLength: 128),
                        Under18sInParty = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.BookingId);
            
            CreateTable(
                "book.BookingEmails",
                c => new
                    {
                        BookingEmailId = c.Long(nullable: false, identity: true),
                        Template = c.Int(nullable: false),
                        Status = c.Int(nullable: false),
                        UtcDueAt = c.DateTime(nullable: false, precision: 7, storeType: "datetime2"),
                        UtcSentAt = c.DateTime(precision: 7, storeType: "datetime2"),
                        RetryCountToDate = c.Int(nullable: false),
                        FailureDescription = c.String(maxLength: 256),
                        EmailAddress = c.String(maxLength: 250),
                        Subject = c.String(maxLength: 128),
                        Body = c.String(),
                        Booking_BookingId = c.Long(),
                    })
                .PrimaryKey(t => t.BookingEmailId)
                .ForeignKey("book.Bookings", t => t.Booking_BookingId)
                .Index(t => t.Booking_BookingId);
            
            CreateTable(
                "book.EmailTemplates",
                c => new
                    {
                        EmailTemplateId = c.Long(nullable: false, identity: true),
                        Template = c.Int(nullable: false),
                        BodyText = c.String(),
                        SubjectText = c.String(),
                    })
                .PrimaryKey(t => t.EmailTemplateId);
            
            CreateTable(
                "book.EntryCodes",
                c => new
                    {
                        EntryCodeId = c.Long(nullable: false, identity: true),
                        ApplicableFrom = c.DateTime(nullable: false, precision: 7, storeType: "datetime2"),
                        Code = c.String(maxLength: 128),
                    })
                .PrimaryKey(t => t.EntryCodeId);
            
            CreateTable(
                "book.Parameters",
                c => new
                    {
                        ParameterId = c.Long(nullable: false, identity: true),
                        DateToday = c.DateTime(precision: 7, storeType: "datetime2"),
                        TestMode = c.Boolean(nullable: false),
                        BookingSecretaryEmailAddress = c.String(),
                        TermsAndConditionsUrl = c.String(),
                        NonBMCMembers = c.String(),
                        BMCMembers = c.String(),
                        PrivilegedMembers = c.String(),
                        ShortBookingInterval = c.Int(),
                        EntryCodeNotificationPeriod = c.Int(),
                        EntryCodeBridgePeriod = c.Int(),
                        Discriminator = c.String(nullable: false, maxLength: 128),
                        ForwardBookingPeriod_PeriodId = c.Long(),
                    })
                .PrimaryKey(t => t.ParameterId)
                .ForeignKey("book.Periods", t => t.ForwardBookingPeriod_PeriodId)
                .Index(t => t.ForwardBookingPeriod_PeriodId);
            
            CreateTable(
                "book.Prices",
                c => new
                    {
                        PriceId = c.Long(nullable: false, identity: true),
                        Type = c.Int(nullable: false),
                        Class = c.Int(nullable: false),
                        Capacity = c.Int(nullable: false),
                        Amount = c.Decimal(nullable: false, precision: 18, scale: 2),
                        Period_PeriodId = c.Long(),
                    })
                .PrimaryKey(t => t.PriceId)
                .ForeignKey("book.Periods", t => t.Period_PeriodId)
                .Index(t => t.Period_PeriodId);
            
            CreateTable(
                "book.PriceStructures",
                c => new
                    {
                        PriceStructureId = c.Long(nullable: false, identity: true),
                        Name = c.String(nullable: false),
                    })
                .PrimaryKey(t => t.PriceStructureId);
            
            CreateTable(
                "book.Tasklogs",
                c => new
                    {
                        Id = c.Long(nullable: false, identity: true),
                        Message = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "book.BookingAccomodations",
                c => new
                    {
                        Booking_BookingId = c.Long(nullable: false),
                        Accomodation_AccomodationId = c.Long(nullable: false),
                    })
                .PrimaryKey(t => new { t.Booking_BookingId, t.Accomodation_AccomodationId })
                .ForeignKey("book.Bookings", t => t.Booking_BookingId)
                .ForeignKey("book.Accomodations", t => t.Accomodation_AccomodationId)
                .Index(t => t.Booking_BookingId)
                .Index(t => t.Accomodation_AccomodationId);
            
        }
        
        public override void Down()
        {
            DropForeignKey("book.Periods", "PriceStructure_PriceStructureId", "book.PriceStructures");
            DropForeignKey("book.Prices", "Period_PeriodId", "book.Periods");
            DropForeignKey("book.Parameters", "ForwardBookingPeriod_PeriodId", "book.Periods");
            DropForeignKey("book.Accomodations", "ParentAccomodation_AccomodationId", "book.Accomodations");
            DropForeignKey("book.AccomodationExtras", "Accomodation_AccomodationId", "book.Accomodations");
            DropForeignKey("book.BookingEmails", "Booking_BookingId", "book.Bookings");
            DropForeignKey("book.BookingAccomodations", "Accomodation_AccomodationId", "book.Accomodations");
            DropForeignKey("book.BookingAccomodations", "Booking_BookingId", "book.Bookings");
            DropForeignKey("book.Availabilities", "Period_PeriodId", "book.Periods");
            DropForeignKey("book.Periods", "ParentPeriod_PeriodId", "book.Periods");
            DropForeignKey("book.Availabilities", "Accomodation_AccomodationId", "book.Accomodations");
            DropIndex("book.BookingAccomodations", new[] { "Accomodation_AccomodationId" });
            DropIndex("book.BookingAccomodations", new[] { "Booking_BookingId" });
            DropIndex("book.Prices", new[] { "Period_PeriodId" });
            DropIndex("book.Parameters", new[] { "ForwardBookingPeriod_PeriodId" });
            DropIndex("book.BookingEmails", new[] { "Booking_BookingId" });
            DropIndex("book.Periods", new[] { "PriceStructure_PriceStructureId" });
            DropIndex("book.Periods", new[] { "ParentPeriod_PeriodId" });
            DropIndex("book.Availabilities", new[] { "Period_PeriodId" });
            DropIndex("book.Availabilities", new[] { "Accomodation_AccomodationId" });
            DropIndex("book.Accomodations", new[] { "ParentAccomodation_AccomodationId" });
            DropIndex("book.Accomodations", new[] { "Name" });
            DropIndex("book.AccomodationExtras", new[] { "Accomodation_AccomodationId" });
            DropTable("book.BookingAccomodations");
            DropTable("book.Tasklogs");
            DropTable("book.PriceStructures");
            DropTable("book.Prices");
            DropTable("book.Parameters");
            DropTable("book.EntryCodes");
            DropTable("book.EmailTemplates");
            DropTable("book.BookingEmails");
            DropTable("book.Bookings");
            DropTable("book.Periods");
            DropTable("book.Availabilities");
            DropTable("book.Accomodations");
            DropTable("book.AccomodationExtras");
        }
    }
}
