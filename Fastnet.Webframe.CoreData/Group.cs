using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class Group //: IHierarchical<Group>
    {        
        public long GroupId { get; set; }
        [ForeignKey("ParentGroup")]
        public long? ParentGroupId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        [Column("TypeCode")]
        public GroupTypes Type { get; set; }
        public long? RegistrationKeyId { get; set; }
        [Timestamp]
        public byte[] TimeStamp { get; set; }
        public virtual Group ParentGroup { get; set; }
        //
        private ICollection<Member> members;
        private ICollection<RegistrationKey> registrationKeys;
        public virtual ICollection<Group> Children { get; set; }
        public virtual ICollection<Member> Members
        {
            get { return members ?? (members = new HashSet<Member>()); }
            set { members = value; }
        }
        public virtual ICollection<RegistrationKey> RegistrationKeys
        {
            get { return registrationKeys ?? (registrationKeys = new HashSet<RegistrationKey>()); }
            set { registrationKeys = value; }
        }
        //
        [NotMapped]
        public string Fullpath
        {
            get { return getPath(); }
        }
        public static Group Everyone
        {
            get { return GetSystemGroup(SystemGroups.Everyone); }
        }
        public static Group AllMembers
        {
            get { return GetSystemGroup(SystemGroups.AllMembers); }
        }
        public static Group Anonymous
        {
            get { return GetSystemGroup(SystemGroups.Anonymous); }
        }
        public static Group Administrators
        {
            get { return GetSystemGroup(SystemGroups.Administrators); }
        }
        public static Group Designers
        {
            get { return GetSystemGroup(SystemGroups.Designers); }
        }
        public static Group Editors
        {
            get { return GetSystemGroup(SystemGroups.Editors); }
        }
        public bool IsChildOf(Group ultimateParent)
        {
            Group g = this.ParentGroup;
            while (g != null)
            {
                if (g == ultimateParent)
                {
                    return true;
                }
                g = g.ParentGroup;
            }
            return false;
        }
        public bool IsParentOf(Group ultimateChild)
        {
            return ultimateChild.IsChildOf(this);
        }
        private string getPath()
        {
            Action<List<string>, Group> addParentName = null;
            addParentName = (l, d) =>
            {
                if (d != null)
                {
                    l.Add(d.Name);
                    addParentName(l, d.ParentGroup);
                }
            };
            List<string> fragments = new List<string>();
            addParentName(fragments, this);
            return string.Join("/", fragments.ToArray().Reverse());
        }
        private static Group GetSystemGroup(SystemGroups sg)
        {
            CoreDataContext ctx = Core.GetDataContext();
            return ctx.Groups.ToArray().Single(x => x.Name == sg.ToString() && x.Type.HasFlag(GroupTypes.System));
        }
    }
}