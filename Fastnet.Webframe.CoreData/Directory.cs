using Fastnet.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{

    public partial class Directory : Hierarchy<Directory>
    {

        public long DirectoryId { get; set; }
        [StringLength(1024, MinimumLength = 4)]
        public string Name { get; set; }
        [ForeignKey("ParentDirectory")]
        public long? ParentDirectoryId { get; set; }
        public bool Deleted { get; set; }
        public long? OriginalFolderId { get; set; }
        [Timestamp]
        public byte[] TimeStamp { get; set; }
        public virtual Directory ParentDirectory { get; set; }
        //
        private ICollection<Directory> subDirectories;
        private ICollection<DirectoryGroup> directoryGroups;
        private ICollection<Page> pages;
        private ICollection<Document> documents;
        private ICollection<Image> images;
        public virtual ICollection<Directory> SubDirectories
        {
            get { return subDirectories ?? (subDirectories = new HashSet<Directory>()); }
            set { subDirectories = value; }
        }
        public virtual ICollection<DirectoryGroup> DirectoryGroups
        {
            get { return directoryGroups ?? (directoryGroups = new HashSet<DirectoryGroup>()); }
            set { directoryGroups = value; }
        }
        public virtual ICollection<Page> Pages
        {
            get { return pages ?? (pages = new HashSet<Page>()); }
            set { pages = value; }
        }
        public virtual ICollection<Document> Documents
        {
            get { return documents ?? (documents = new HashSet<Document>()); }
            set { documents = value; }
        }
        public virtual ICollection<Image> Images
        {
            get { return images ?? (images = new HashSet<Image>()); }
            set { images = value; }
        }
        //
        //[NotMapped]
        //public string Fullpath
        //{
        //    get { return getPath().Replace("$root", "Store"); }
        //}
        [NotMapped]
        public string DisplayName
        {
            get { return getPath().Replace("$root", "Store"); }
        }
        [NotMapped]
        public string FullName
        {
            get { return getPath(); }
        }
        public override Directory GetParent()
        {
            return this.ParentDirectory;
        }
        public override IEnumerable<Directory> GetChildren()
        {
            return this.SubDirectories;
        }
        private string getPath()
        {
            Action<List<string>, Directory> addParentName = null;
            addParentName = (l, d) =>
            {
                if (d != null)
                {
                    l.Add(d.Name);
                    addParentName(l, d.ParentDirectory);
                }
            };
            List<string> fragments = new List<string>();
            addParentName(fragments, this);
            return string.Join("/", fragments.ToArray().Reverse());
        }
        public IEnumerable<Group> ViewableFrom()
        {
            // look up the directory hierarchy till you get to
            // a directory (including this one) that has a one or more groups attached
            // this set contains the groups that content in the current directory
            // (i.e. this one) is restricted to.
            // Note: if nothing else we should get to the root directory
            // and find that restricted to Everyone
            return this.SelfAndParents.First(p => p.DirectoryGroups.Where(dg => dg.ViewAllowed).Select(dg => dg.Group).Count() > 0)
                .DirectoryGroups.Select(x => x.Group);
        }
        public IEnumerable<Group> EditableFrom()
        {
            // look up the directory hierarchy till you get to
            // a directory (including this one) that has a one or more groups attached
            // this set contains the groups that content in the current directory
            // (i.e. this one) is restricted to.
            // Note: if nothing else we should get to the root directory
            // and find that restricted to Everyone
            var directory = this.SelfAndParents.FirstOrDefault(p => p.DirectoryGroups.Where(dg => dg.EditAllowed).Select(dg => dg.Group).Count() > 0);
            if (directory != null)
            {
                return directory.DirectoryGroups.Select(x => x.Group);
            }
            else
            {
                return new List<Group>();
            }
            //return this.SelfAndParents.First(p => p.DirectoryGroups.Where(dg => dg.EditAllowed).Select(dg => dg.Group).Count() > 0)
            //    .DirectoryGroups.Select(x => x.Group);
        }
        public Page GetClosestLandingPage()
        {
            return this.SelfAndParents.First(x => x.Pages.Any(y => y.IsLandingPage))
                .Pages.Single(z => z.IsLandingPage);
        }
        public IEnumerable<DirectoryGroup> GetClosestDirectoryGroups()
        {
            var parents = this.Parents;
            if (parents.Count() > 0)
            {
                return this.Parents.First(x => x.DirectoryGroups.Count() > 0).DirectoryGroups;
            }
            else
            {
                return Enumerable.Empty<DirectoryGroup>();
            }
        }
        public void RecordChanges(string actionBy, FolderAction.EditingActionTypes actionType)
        {
            Func<FolderAction> getNewFolderAction = () =>
            {
                FolderAction fa = new FolderAction
                {
                    Action = actionType,
                    ActionBy = actionBy,
                    Name = this.DisplayName,                    
                };
                return fa;
            };
            CoreDataContext DataContext = Core.GetDataContext();
            switch (actionType)
            {
                default:
                    break;
                case FolderAction.EditingActionTypes.NewFolder:
                case FolderAction.EditingActionTypes.FolderDeleted:
                    DataContext.Actions.Add(getNewFolderAction());
                    break;
                case FolderAction.EditingActionTypes.FolderModified:
                    PageAction.AddPropertyModificationActions(DataContext.Entry(this), getNewFolderAction, (pa) =>
                    {
                        DataContext.Actions.Add(pa);
                    });
                    break;
            }
        }
    }
}