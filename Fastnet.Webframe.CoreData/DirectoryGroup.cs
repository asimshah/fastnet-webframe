using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;
using Fastnet.Common;

namespace Fastnet.Webframe.CoreData
{
    public partial class DirectoryGroup
    {
        [Key, Column(Order = 0)]
        public long DirectoryId { get; set; }
        [Key, Column(Order = 1)]
        public long GroupId { get; set; }
        //
        public virtual Directory Directory { get; set; }
        public virtual Group Group { get; set; }
        //
        [Mapped]
        internal Permission Permission { get; set; }
        [NotMapped]
        public bool ViewAllowed { get { return Permission.HasFlag(Permission.ViewPages) || Permission.HasFlag(Permission.EditPages); } }
        [NotMapped]
        public bool EditAllowed { get { return Permission.HasFlag(Permission.EditPages); } }
        public string GetAccessDescription()
        {
            if (EditAllowed)
            {
                return "view+edit";
            }
            else
            {
                return "view only";
            }
        }
        public void SetView(bool tf)
        {
            if (tf)
            {
                Permission = Permission.Set(CoreData.Permission.ViewPages);
            }
            else
            {
                Permission = Permission.Set(CoreData.Permission.EditPages);
            }
        }
        public void SetEdit(bool tf)
        {
            if (tf)
            {
                Permission = Permission.Set(CoreData.Permission.EditPages);
                Permission = Permission.Set(CoreData.Permission.ViewPages);
            }
            else
            {
                Permission = Permission.Unset(CoreData.Permission.EditPages);
            }
        }
        public void RecordChanges(string actionBy, RestrictionAction.EditingActionTypes actionType)
        {
            Func<RestrictionAction> getNewAction = () =>
            {
                RestrictionAction ra = new RestrictionAction
                {
                    Action = actionType,
                    ActionBy = actionBy,
                    Folder = this.Directory.DisplayName,
                    GroupName = this.Group.Fullpath,
                    View = this.ViewAllowed,
                    Edit = this.EditAllowed
                };
                return ra;
            };
            CoreDataContext DataContext = Core.GetDataContext();
            switch (actionType)
            {
                default:
                    break;
                case RestrictionAction.EditingActionTypes.RestrictionAdded:
                case RestrictionAction.EditingActionTypes.RestrictionRemoved:
                    DataContext.Actions.Add(getNewAction());
                    break;
                case RestrictionAction.EditingActionTypes.RestrictionModified:
                    PageAction.AddPropertyModificationActions(DataContext.Entry(this), getNewAction, (ra) =>
                    {
                        DataContext.Actions.Add(ra);
                    });
                    break;
            }
        }
    }
}