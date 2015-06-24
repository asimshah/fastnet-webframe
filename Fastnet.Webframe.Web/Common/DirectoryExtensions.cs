using Fastnet.EventSystem;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Common
{
    //public class EffectiveDirectoryAccessRule
    //{
    //    public Directory Directory { get; set; }
    //    public Directory InheritedFrom { get; set; }
    //    public Group Group { get; set; }
    //    public AccessRule AccessRule { get; set; }
    //}
    public static class DirectoryExtensions
    {
        //public static IEnumerable<EffectiveDirectoryAccessRule> GetEffectiveDirectoryAccessRules(this Directory dir)
        //{
        //    IEnumerable<DirectoryAccessRule> dars = GetEffectiveDirectoryAccessRulesInternal(dir);
        //    return dars.Select(x => new EffectiveDirectoryAccessRule
        //    {
        //        Directory = dir,
        //        InheritedFrom = x.Directory,
        //        Group = x.Group,
        //        AccessRule = x.AccessRule
        //    });
        //}
        //internal static IEnumerable<DirectoryAccessRule> GetEffectiveDirectoryAccessRulesInternal(this Directory dir)
        //{
        //    try
        //    {
        //        if (dir.DirectoryAccessRules.Count() == 0)
        //        {
        //            return dir.ParentDirectory.GetEffectiveDirectoryAccessRulesInternal();
        //        }
        //        else
        //        {
        //            return dir.DirectoryAccessRules;
        //        }
        //    }
        //    catch (Exception xe)
        //    {
        //        Log.Write(xe);
        //        throw;
        //    }
        //}
    }
}