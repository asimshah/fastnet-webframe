using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{

    public static class Win32IO
    {
        [DllImport("shlwapi.dll", CharSet = CharSet.Auto)]
        static extern bool PathRelativePathTo(
             [Out] StringBuilder pszPath,
             [In] string pszFrom,
             [In] FileAttributes dwAttrFrom,
             [In] string pszTo,
             [In] FileAttributes dwAttrTo
        );
        public static string PathRelativePathTo(string from, string to)
        {
            const Int32 MAX_PATH = 260;
            StringBuilder str = new StringBuilder(MAX_PATH);
            //Boolean bRet = PathRelativePathTo(str, @"c:\a\b\path", FileAttributes.Directory, @"c:\a\x\y\file", FileAttributes.Normal );
            Boolean bRet = PathRelativePathTo(str, from, FileAttributes.Directory, to, FileAttributes.Normal);
            return str.ToString();
        }
        private static string GetRelativePath(FileSystemInfo path1, FileSystemInfo path2)
        {
            if (path1 == null) throw new ArgumentNullException("path1");
            if (path2 == null) throw new ArgumentNullException("path2");

            Func<FileSystemInfo, string> getFullName = delegate(FileSystemInfo path)
            {
                string fullName = path.FullName;

                if (path is DirectoryInfo)
                {
                    if (fullName[fullName.Length - 1] != Path.DirectorySeparatorChar)
                    {
                        fullName += Path.DirectorySeparatorChar;
                    }
                }
                return fullName;
            };

            string path1FullName = getFullName(path1);
            string path2FullName = getFullName(path2);

            Uri uri1 = new Uri(path1FullName);
            Uri uri2 = new Uri(path2FullName);
            Uri relativeUri = uri1.MakeRelativeUri(uri2);

            return relativeUri.OriginalString;
        }
    }
}
