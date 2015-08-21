﻿using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData.DWH
{
    public class DWHLegacyBookingDbContext : DbContext
    {
        public DWHLegacyBookingDbContext(string connectionString) : base(connectionString)
        {
        }
        public DbSet<Visitor> Visitors { get; set; }
        public DbSet<BookableItem> BookableItems { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<ReleasedItem> ReleasedItems { get; set; }
        public DbSet<PricingCategory> PricingCategories { get; set; }
    
    }
}
