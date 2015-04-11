using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    //internal class CoreDbInitializer : MigrateDatabaseToLatestVersion<CoreDataContext, Fastnet.Apollo.Data.Migrations.Configuration>
    internal class CoreDbInitializer : DropCreateDatabaseIfModelChanges<CoreDataContext>
    //internal class CoreDbInitializer : DropCreateDatabaseAlways<CoreDataContext>
    {
        protected override void Seed(CoreDataContext context)
        {
            base.Seed(context);
            DataSeeder seeder = new DataSeeder(context);
            seeder.Seed();
        }
    }
}