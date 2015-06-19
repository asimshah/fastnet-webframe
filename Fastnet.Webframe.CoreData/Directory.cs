﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{

    public partial class Directory
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
        private ICollection<DirectoryAccessRule> directoryAccessRules;
        private ICollection<DirectoryGroup> directoryGroups;
        private ICollection<Page> pages;
        private ICollection<Document> documents;
        private ICollection<Image> images;
        public virtual ICollection<Directory> SubDirectories
        {
            get { return subDirectories ?? (subDirectories = new HashSet<Directory>()); }
            set { subDirectories = value; }
        }
        public virtual ICollection<DirectoryAccessRule> DirectoryAccessRules
        {
            get { return directoryAccessRules ?? (directoryAccessRules = new HashSet<DirectoryAccessRule>()); }
            set { directoryAccessRules = value; }
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
        [NotMapped]
        public string Fullpath
        {
            get { return getPath(); }
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
    }
}