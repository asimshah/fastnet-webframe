using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Autofac;
//using Microsoft.Owin;
using Microsoft.AspNet.Identity.Owin;

namespace Fastnet.Webframe.CoreData
{
    public abstract class Core
    {
        [NotMapped]
        protected static CoreDataContext DataContext
        {
            get
            {
                return GetDataContext();
                //var dr = DependencyResolver.Current as Autofac.Integration.Mvc.AutofacDependencyResolver;
                //CoreDataContext cdc = dr.RequestLifetimeScope.Resolve<CoreDataContext>();
                //return cdc;
            }
        }
        public static CoreDataContext GetDataContext()
        {
            var dr = DependencyResolver.Current as Autofac.Integration.Mvc.AutofacDependencyResolver;
            CoreDataContext cdc = dr.RequestLifetimeScope.Resolve<CoreDataContext>();
            return cdc;
        }
        public static ApplicationDbContext GetApplicationDbContext()
        {
            ApplicationDbContext adc = HttpContext.Current.GetOwinContext().Get<ApplicationDbContext>();
            if(adc == null)
            {
                adc = new ApplicationDbContext();
            }
            return adc;
        }
    }
    
}