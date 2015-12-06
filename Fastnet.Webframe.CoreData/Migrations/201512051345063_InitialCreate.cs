namespace Fastnet.Webframe.CoreData.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class InitialCreate : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "std.ActionBases",
                c => new
                    {
                        ActionBaseId = c.Long(nullable: false, identity: true),
                        RecordedOn = c.DateTimeOffset(nullable: false, precision: 7),
                        SiteUrl = c.String(),
                        Version = c.String(),
                        Remark = c.String(),
                        ActionBy = c.String(),
                        PropertyChanged = c.String(),
                        OldValue = c.String(),
                        NewValue = c.String(),
                        Action = c.Int(),
                        Folder = c.String(),
                        Name = c.String(),
                        Url = c.String(),
                        GroupName = c.String(),
                        View = c.Boolean(),
                        Edit = c.Boolean(),
                        GroupId = c.String(),
                        FullName = c.String(),
                        Action1 = c.Int(),
                        MemberEmailAddress = c.String(),
                        MemberId = c.String(),
                        FullName1 = c.String(),
                        EmailAddress = c.String(),
                        Action2 = c.Int(),
                        Subject = c.String(),
                        To = c.String(),
                        From = c.String(),
                        Redirected = c.Boolean(),
                        RedirectedTo = c.String(),
                        MailTemplate = c.String(),
                        MailBody = c.String(),
                        MailDisabled = c.Boolean(),
                        Failure = c.String(),
                        SessionId = c.String(),
                        Browser = c.String(),
                        Version1 = c.String(),
                        IpAddress = c.String(),
                        ScreenWidth = c.Int(),
                        ScreenHeight = c.Int(),
                        CanTouch = c.Boolean(),
                        Discriminator = c.String(nullable: false, maxLength: 128),
                    })
                .PrimaryKey(t => t.ActionBaseId);
            
            CreateTable(
                "std.Directories",
                c => new
                    {
                        DirectoryId = c.Long(nullable: false, identity: true),
                        Name = c.String(maxLength: 1024),
                        ParentDirectoryId = c.Long(),
                        Deleted = c.Boolean(nullable: false),
                        OriginalFolderId = c.Long(),
                        TimeStamp = c.Binary(nullable: false, fixedLength: true, timestamp: true, storeType: "rowversion"),
                    })
                .PrimaryKey(t => t.DirectoryId)
                .ForeignKey("std.Directories", t => t.ParentDirectoryId)
                .Index(t => t.ParentDirectoryId);
            
            CreateTable(
                "std.DirectoryGroups",
                c => new
                    {
                        DirectoryId = c.Long(nullable: false),
                        GroupId = c.Long(nullable: false),
                        Permission = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.DirectoryId, t.GroupId })
                .ForeignKey("std.Directories", t => t.DirectoryId)
                .ForeignKey("std.Groups", t => t.GroupId)
                .Index(t => t.DirectoryId)
                .Index(t => t.GroupId);
            
            CreateTable(
                "std.Groups",
                c => new
                    {
                        GroupId = c.Long(nullable: false, identity: true),
                        ParentGroupId = c.Long(),
                        Name = c.String(),
                        Description = c.String(),
                        Weight = c.Int(nullable: false),
                        TypeCode = c.Int(nullable: false),
                        TimeStamp = c.Binary(nullable: false, fixedLength: true, timestamp: true, storeType: "rowversion"),
                    })
                .PrimaryKey(t => t.GroupId)
                .ForeignKey("std.Groups", t => t.ParentGroupId)
                .Index(t => t.ParentGroupId);
            
            CreateTable(
                "std.Members",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        EmailAddress = c.String(maxLength: 256),
                        EmailAddressConfirmed = c.Boolean(nullable: false),
                        FirstName = c.String(maxLength: 128),
                        LastName = c.String(maxLength: 128),
                        PhoneNumber = c.String(maxLength: 128),
                        CreationDate = c.DateTime(nullable: false, precision: 7, storeType: "datetime2"),
                        LastLoginDate = c.DateTime(precision: 7, storeType: "datetime2"),
                        Disabled = c.Boolean(nullable: false),
                        ActivationCode = c.String(maxLength: 128),
                        ActivationEmailSentDate = c.DateTime(precision: 7, storeType: "datetime2"),
                        PasswordResetCode = c.String(),
                        PasswordResetEmailSentDate = c.DateTime(precision: 7, storeType: "datetime2"),
                        PlainPassword = c.String(),
                        IsAdministrator = c.Boolean(nullable: false),
                        IsAnonymous = c.Boolean(nullable: false),
                        CreationMethod = c.Int(nullable: false),
                        BMCMembership = c.String(maxLength: 128),
                        BMCMembershipExpiresOn = c.DateTime(precision: 7, storeType: "datetime2"),
                        BMCMembershipIsValid = c.Boolean(),
                        BMCMembershipValidatedOn = c.DateTime(precision: 7, storeType: "datetime2"),
                        Organisation = c.String(maxLength: 128),
                        Discriminator = c.String(nullable: false, maxLength: 128),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "std.Documents",
                c => new
                    {
                        DocumentId = c.Long(nullable: false),
                        DirectoryId = c.Long(nullable: false),
                        Name = c.String(),
                        Extension = c.String(),
                        Length = c.Long(nullable: false),
                        CreatedOn = c.DateTimeOffset(nullable: false, precision: 7),
                        CreatedBy = c.String(),
                        Visible = c.Boolean(nullable: false),
                        Deleted = c.Boolean(nullable: false),
                        Data = c.Binary(),
                        MimeType = c.String(),
                        TimeStamp = c.Binary(nullable: false, fixedLength: true, timestamp: true, storeType: "rowversion"),
                    })
                .PrimaryKey(t => t.DocumentId)
                .ForeignKey("std.Directories", t => t.DirectoryId)
                .Index(t => t.DirectoryId);
            
            CreateTable(
                "std.Pages",
                c => new
                    {
                        PageId = c.Long(nullable: false),
                        Name = c.String(),
                        MarkupType = c.Int(nullable: false),
                        Type = c.Int(nullable: false),
                        DirectoryId = c.Long(nullable: false),
                        IsLandingPage = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.PageId)
                .ForeignKey("std.Directories", t => t.DirectoryId)
                .Index(t => t.DirectoryId);
            
            CreateTable(
                "std.MenuMasters",
                c => new
                    {
                        Id = c.Long(nullable: false, identity: true),
                        Name = c.String(),
                        IsDisabled = c.Boolean(nullable: false),
                        ClassName = c.String(),
                        PanelName = c.Int(nullable: false),
                        Page_PageId = c.Long(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("std.Pages", t => t.Page_PageId)
                .Index(t => t.Page_PageId);
            
            CreateTable(
                "std.Menus",
                c => new
                    {
                        Id = c.Long(nullable: false, identity: true),
                        Index = c.Int(nullable: false),
                        Text = c.String(),
                        Url = c.String(),
                        Page_PageId = c.Long(),
                        ParentMenu_Id = c.Long(),
                        MenuMaster_Id = c.Long(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("std.Pages", t => t.Page_PageId)
                .ForeignKey("std.Menus", t => t.ParentMenu_Id)
                .ForeignKey("std.MenuMasters", t => t.MenuMaster_Id)
                .Index(t => t.Page_PageId)
                .Index(t => t.ParentMenu_Id)
                .Index(t => t.MenuMaster_Id);
            
            CreateTable(
                "std.PageMarkups",
                c => new
                    {
                        PageId = c.Long(nullable: false),
                        CreatedOn = c.DateTimeOffset(nullable: false, precision: 7),
                        CreatedBy = c.String(),
                        ModifiedOn = c.DateTimeOffset(precision: 7),
                        ModifiedBy = c.String(),
                        Data = c.Binary(),
                        MarkupLength = c.Long(nullable: false),
                        HtmlText = c.String(),
                        HtmlTextLength = c.Long(nullable: false),
                        HtmlStyles = c.String(),
                        HtmlScripts = c.String(),
                        ThumbNail = c.Binary(),
                        SmallThumbNail = c.Binary(),
                        MiddleThumbNail = c.Binary(),
                        TimeStamp = c.Binary(nullable: false, fixedLength: true, timestamp: true, storeType: "rowversion"),
                    })
                .PrimaryKey(t => t.PageId)
                .ForeignKey("std.Pages", t => t.PageId)
                .Index(t => t.PageId);
            
            CreateTable(
                "std.Images",
                c => new
                    {
                        ImageId = c.Long(nullable: false),
                        Name = c.String(),
                        Data = c.Binary(),
                        CreatedOn = c.DateTimeOffset(nullable: false, precision: 7),
                        CreatedBy = c.String(),
                        ImageType = c.Int(nullable: false),
                        Height = c.Int(nullable: false),
                        Width = c.Int(nullable: false),
                        TimeStamp = c.Binary(),
                        Directory_DirectoryId = c.Long(),
                    })
                .PrimaryKey(t => t.ImageId)
                .ForeignKey("std.Directories", t => t.Directory_DirectoryId)
                .Index(t => t.Directory_DirectoryId);
            
            CreateTable(
                "std.FileChunks",
                c => new
                    {
                        FileChunkId = c.Long(nullable: false, identity: true),
                        UploadFileId = c.Long(nullable: false),
                        ChunkNumber = c.Int(nullable: false),
                        Base64String = c.String(),
                    })
                .PrimaryKey(t => t.FileChunkId)
                .ForeignKey("std.UploadFiles", t => t.UploadFileId)
                .Index(t => t.UploadFileId);
            
            CreateTable(
                "std.UploadFiles",
                c => new
                    {
                        UploadFileId = c.Long(nullable: false, identity: true),
                        Name = c.String(),
                        MimeType = c.String(),
                        DirectoryId = c.Long(nullable: false),
                        Guid = c.String(),
                        TotalChunks = c.Long(nullable: false),
                        BinaryLength = c.Long(nullable: false),
                    })
                .PrimaryKey(t => t.UploadFileId);
            
            CreateTable(
                "std.Recorders",
                c => new
                    {
                        RecorderId = c.String(nullable: false, maxLength: 128),
                        StartedOn = c.DateTime(nullable: false, precision: 7, storeType: "datetime2"),
                    })
                .PrimaryKey(t => t.RecorderId);
            
            CreateTable(
                "std.Records",
                c => new
                    {
                        RecordId = c.Long(nullable: false, identity: true),
                        Sequence = c.Long(nullable: false),
                        RecordedOn = c.DateTime(nullable: false, precision: 7, storeType: "datetime2"),
                        Text = c.String(),
                        Recorder_RecorderId = c.String(maxLength: 128),
                    })
                .PrimaryKey(t => t.RecordId)
                .ForeignKey("std.Recorders", t => t.Recorder_RecorderId)
                .Index(t => t.Recorder_RecorderId);
            
            CreateTable(
                "std.SiteSettings",
                c => new
                    {
                        SiteSettingId = c.Long(nullable: false, identity: true),
                        Name = c.String(),
                        Value = c.String(),
                    })
                .PrimaryKey(t => t.SiteSettingId);
            
            CreateTable(
                "std.Webtasks",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Status = c.Int(nullable: false),
                        StartedAt = c.DateTime(nullable: false, precision: 7, storeType: "datetime2"),
                        FinishedAt = c.DateTime(nullable: false, precision: 7, storeType: "datetime2"),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "std.GroupMember",
                c => new
                    {
                        GroupId = c.Long(nullable: false),
                        MemberId = c.String(nullable: false, maxLength: 128),
                    })
                .PrimaryKey(t => new { t.GroupId, t.MemberId })
                .ForeignKey("std.Groups", t => t.GroupId)
                .ForeignKey("std.Members", t => t.MemberId)
                .Index(t => t.GroupId)
                .Index(t => t.MemberId);
            
            CreateTable(
                "std.PageDocument",
                c => new
                    {
                        PageId = c.Long(nullable: false),
                        DocumentId = c.Long(nullable: false),
                    })
                .PrimaryKey(t => new { t.PageId, t.DocumentId })
                .ForeignKey("std.Pages", t => t.PageId)
                .ForeignKey("std.Documents", t => t.DocumentId)
                .Index(t => t.PageId)
                .Index(t => t.DocumentId);
            
            CreateTable(
                "std.PagePage",
                c => new
                    {
                        FromPageId = c.Long(nullable: false),
                        ToPageId = c.Long(nullable: false),
                    })
                .PrimaryKey(t => new { t.FromPageId, t.ToPageId })
                .ForeignKey("std.Pages", t => t.FromPageId)
                .ForeignKey("std.Pages", t => t.ToPageId)
                .Index(t => t.FromPageId)
                .Index(t => t.ToPageId);
            
        }
        
        public override void Down()
        {
            DropForeignKey("std.Records", "Recorder_RecorderId", "std.Recorders");
            DropForeignKey("std.FileChunks", "UploadFileId", "std.UploadFiles");
            DropForeignKey("std.Directories", "ParentDirectoryId", "std.Directories");
            DropForeignKey("std.Images", "Directory_DirectoryId", "std.Directories");
            DropForeignKey("std.PageMarkups", "PageId", "std.Pages");
            DropForeignKey("std.MenuMasters", "Page_PageId", "std.Pages");
            DropForeignKey("std.Menus", "MenuMaster_Id", "std.MenuMasters");
            DropForeignKey("std.Menus", "ParentMenu_Id", "std.Menus");
            DropForeignKey("std.Menus", "Page_PageId", "std.Pages");
            DropForeignKey("std.PagePage", "ToPageId", "std.Pages");
            DropForeignKey("std.PagePage", "FromPageId", "std.Pages");
            DropForeignKey("std.PageDocument", "DocumentId", "std.Documents");
            DropForeignKey("std.PageDocument", "PageId", "std.Pages");
            DropForeignKey("std.Pages", "DirectoryId", "std.Directories");
            DropForeignKey("std.Documents", "DirectoryId", "std.Directories");
            DropForeignKey("std.Groups", "ParentGroupId", "std.Groups");
            DropForeignKey("std.GroupMember", "MemberId", "std.Members");
            DropForeignKey("std.GroupMember", "GroupId", "std.Groups");
            DropForeignKey("std.DirectoryGroups", "GroupId", "std.Groups");
            DropForeignKey("std.DirectoryGroups", "DirectoryId", "std.Directories");
            DropIndex("std.PagePage", new[] { "ToPageId" });
            DropIndex("std.PagePage", new[] { "FromPageId" });
            DropIndex("std.PageDocument", new[] { "DocumentId" });
            DropIndex("std.PageDocument", new[] { "PageId" });
            DropIndex("std.GroupMember", new[] { "MemberId" });
            DropIndex("std.GroupMember", new[] { "GroupId" });
            DropIndex("std.Records", new[] { "Recorder_RecorderId" });
            DropIndex("std.FileChunks", new[] { "UploadFileId" });
            DropIndex("std.Images", new[] { "Directory_DirectoryId" });
            DropIndex("std.PageMarkups", new[] { "PageId" });
            DropIndex("std.Menus", new[] { "MenuMaster_Id" });
            DropIndex("std.Menus", new[] { "ParentMenu_Id" });
            DropIndex("std.Menus", new[] { "Page_PageId" });
            DropIndex("std.MenuMasters", new[] { "Page_PageId" });
            DropIndex("std.Pages", new[] { "DirectoryId" });
            DropIndex("std.Documents", new[] { "DirectoryId" });
            DropIndex("std.Groups", new[] { "ParentGroupId" });
            DropIndex("std.DirectoryGroups", new[] { "GroupId" });
            DropIndex("std.DirectoryGroups", new[] { "DirectoryId" });
            DropIndex("std.Directories", new[] { "ParentDirectoryId" });
            DropTable("std.PagePage");
            DropTable("std.PageDocument");
            DropTable("std.GroupMember");
            DropTable("std.Webtasks");
            DropTable("std.SiteSettings");
            DropTable("std.Records");
            DropTable("std.Recorders");
            DropTable("std.UploadFiles");
            DropTable("std.FileChunks");
            DropTable("std.Images");
            DropTable("std.PageMarkups");
            DropTable("std.Menus");
            DropTable("std.MenuMasters");
            DropTable("std.Pages");
            DropTable("std.Documents");
            DropTable("std.Members");
            DropTable("std.Groups");
            DropTable("std.DirectoryGroups");
            DropTable("std.Directories");
            DropTable("std.ActionBases");
        }
    }
}
