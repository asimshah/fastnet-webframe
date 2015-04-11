using Fastnet.Webframe.CoreData;
using HtmlAgilityPack;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Web;

namespace Fastnet.Webframe.Web.Common
{
    public class HtmlParser
    {
        private HtmlDocument _htmlDoc;
        protected HtmlDocument HtmlDoc
        {
            get
            {
                if (_htmlDoc == null)
                {
                    _htmlDoc = new HtmlDocument();
                    _htmlDoc.LoadHtml(HtmlString);
                }
                return _htmlDoc;
            }
        }
        public string HtmlString { get; set; }
        public HtmlParser(string htmlText)
        {
            HtmlString = htmlText;
        }
        public HtmlParser(byte[] htmlData)
        {
            string htmlText = Encoding.Default.GetString(htmlData);
            HtmlString = htmlText;
        }
        /// <summary>
        /// Use this to obtain the list of CSSRule lists from the HtmlStyles property
        /// of PageMarkup (which is placed there by parsing Word Docx content). Each
        /// CSSRule list is the body of a separate Html style. The order of the
        /// list is important.
        /// </summary>
        /// <returns></returns>
        public IEnumerable<List<CSSRule>> GetLegacyStyleRules()
        {
            HtmlNodeCollection headStyles = HtmlDoc.DocumentNode.SelectNodes("/styles/style");
            var styleBodies = headStyles.Select(x => x.InnerText);
            return styleBodies.Select(x => CSSRule.ParseForRules(x));
        }
    }
}