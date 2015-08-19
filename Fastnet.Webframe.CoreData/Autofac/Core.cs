using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Autofac;
//using Microsoft.Owin;
using Microsoft.AspNet.Identity.Owin;
using Fastnet.EventSystem;
using System.Diagnostics;

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
            }
        }
        public static CoreDataContext GetDataContext()
        {
            try
            {
                var dr = DependencyResolver.Current as Autofac.Integration.Mvc.AutofacDependencyResolver;
                if (dr == null)
                {
                    throw new ApplicationException("No IOC resolver available");
                    //if (_container != null)
                    //{
                    //    CoreDataContext cdc = _container.Resolve<CoreDataContext>();
                    //    return cdc;
                    //}
                    //else
                    //{
                        
                    //}                        
                }
                else
                {
                    CoreDataContext cdc = dr.RequestLifetimeScope.Resolve<CoreDataContext>();
                    return cdc;
                }
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                //Debugger.Break();
                throw;
            }
        }
        //private static IContainer _container;
        //public static void SetContainer(IContainer container)
        //{
        //    _container = container;
        //}
        public static ApplicationDbContext GetApplicationDbContext()
        {
            ApplicationDbContext adc = HttpContext.Current.GetOwinContext().Get<ApplicationDbContext>();
            if (adc == null)
            {
                adc = new ApplicationDbContext();
            }
            return adc;
        }
    }

}