using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{

    //internal class CoreDbInitializer : DropCreateDatabaseIfModelChanges<CoreDataContext>
    internal class CoreDbInitializer : MigrateDatabaseToLatestVersion<CoreDataContext, Fastnet.Webframe.CoreData.Migrations.Configuration>
    {
        //protected override void Seed(CoreDataContext context)
        //{
        //    base.Seed(context);
        //    DataSeeder seeder = new DataSeeder(context);
        //    seeder.Seed();
        //}
    }
}