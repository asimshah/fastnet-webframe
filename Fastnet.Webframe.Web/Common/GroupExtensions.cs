using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Common
{
    public static class GroupExtensions
    {
        public static IEnumerable<Group> GetGroupsForMember(this CoreDataContext ctx, Member m = null)
        {
            List<Group> groups = new List<Group>();
            Action<IEnumerable<Group>> addGroup = (list) =>
            {
                foreach (Group g in list)
                {
                    if (!groups.Contains(g))
                    {
                        groups.Add(g);
                    }
                }
            };
            Action<IEnumerable<Group>> processGroups = null;
            processGroups = (list) =>
            {
                addGroup(list);
                list = list.Where(pg => pg.ParentGroup != null).Select(l => l.ParentGroup);
                if (list.Count() > 0)
                {
                    processGroups(list);
                }
            };
            if (m != null)
            {
                processGroups(m.Groups);
                //groups.Add(Group.AllMembers, new Tuple<Group, int>(Group.AllMembers, depth++));
                //groups.Add(Group.Everyone, new Tuple<Group, int>(Group.Everyone, depth++));
            }
            else
            {
                groups.Add(Group.Anonymous);
                groups.Add(Group.Everyone);
            }
            return groups;
        }
    }
}