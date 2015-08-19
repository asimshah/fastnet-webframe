using Autofac;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Common
{
    public class DataModule : Module
    {
        protected override void Load(ContainerBuilder builder)
        {
            //builder.Register(c => new CoreDataContext()).AsSelf().InstancePerRequest();
            builder.Register(c => new CoreDataContext()).AsSelf().InstancePerLifetimeScope();
            base.Load(builder);
        }
    }
}