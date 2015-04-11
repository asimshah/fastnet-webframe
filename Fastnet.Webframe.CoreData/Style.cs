using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Dynamic;
using System.Linq;
using System.Web;
using System.Web.Hosting;

namespace Fastnet.Webframe.CoreData
{

    public partial class Style
    {
        public long StyleId { get; set; }
        public long? FontId { get; set; }
        public long? BackgroundId { get; set; }
        public string Border { get; set; }
        public string Margin { get; set; }
        public string Padding { get; set; }
        public string Colour { get; set; }
        public string TextAlignment { get; set; }
        public string VerticalAlignment { get; set; }
        public long OriginalStyleId { get; set; }
        [Timestamp]
        public byte[] TimeStamp { get; set; }

        public virtual Font Font { get; set; }
        public virtual Background Background { get; set; }
        public dynamic GetBorderInfo()
        {
            Func<string, dynamic> parsePart = (t) =>
            {
                if (string.IsNullOrWhiteSpace(t))
                {
                    dynamic r = new ExpandoObject();
                    r.Width = 0.0;
                    r.Color = "";
                    r.Style = BorderLineStyle.None;
                    return r;
                }
                else
                {
                    string[] parts = t.Split(' ');

                    Debug.Assert(parts.Length == 3);
                    string w = parts[0].Substring(0, parts[0].Length - 2);
                    double width = double.Parse(w);
                    string c = parts[1];
                    BorderLineStyle s = (BorderLineStyle)Enum.Parse(typeof(BorderLineStyle), parts[2], true);
                    dynamic r = new ExpandoObject();
                    r.Width = s == BorderLineStyle.None ? 0.0 : width;
                    r.Color = c;
                    r.Style = s;
                    return r;
                }
            };
            string text = this.Border ?? "|||";
            string[] segments = text.Split('|');
            Debug.Assert(segments.Length == 4);
            var left = parsePart(segments[0]);
            var top = parsePart(segments[1]);
            var right = parsePart(segments[2]);
            var bottom = parsePart(segments[3]);
            dynamic result = new ExpandoObject();
            result.Left = left;
            result.Top = top;
            result.Right = right;
            result.Bottom = bottom;
            return result;
        }
        public dynamic GetMarginInfo()
        {
            return ParseMarginOrPadding(this.Margin);
        }
        public dynamic GetPaddingInfo()
        {
            return ParseMarginOrPadding(this.Padding);
        }
        public void AddBackgroundCSS(CSSRule cr)
        {
            if (this.Background != null)
            {
                if (!string.IsNullOrWhiteSpace(this.Background.Colour))
                {
                    cr.AddRule("background-color: {0}", this.Background.Colour);
                }
                if (!string.IsNullOrEmpty(this.Background.BackgroundImageUrl))
                {
                    cr.AddRule("background-image: url('{0}/{1}')", CSSRule.GetUserImagesRelativePath(), this.Background.BackgroundImageUrl);
                }
            }
        }
        public void AddFontCSS(CSSRule cr)
        {
            if (this.Font != null)
            {
                if (!string.IsNullOrEmpty(this.Font.Name))
                {
                    cr.AddRule("font-family: {0}", this.Font.Name);
                }
                if (this.Font.PointSize.HasValue)
                {
                    cr.AddRule("font-size: {0}pt", this.Font.PointSize.ToString());
                }
                if (!string.IsNullOrEmpty(this.Font.Style))
                {
                    cr.AddRule("font-style: {0}", this.Font.Style);
                }
                if (!string.IsNullOrEmpty(this.Font.Weight))
                {
                    cr.AddRule("font-weight: {0}", this.Font.Weight);
                }
            }
        }
        public void AddColourCSS(CSSRule cr)
        {
            if (!string.IsNullOrEmpty(this.Colour))
            {
                cr.AddRule("color: {0}", this.Colour);
            }
        }
        public void AddAlignmentCSS(CSSRule cr)
        {
            if (!string.IsNullOrEmpty(this.TextAlignment))
            {
                cr.AddRule("text-align: {0}", this.TextAlignment);
            }
            if (!string.IsNullOrEmpty(this.VerticalAlignment))
            {
                cr.AddRule("vertical-align: {0}", this.VerticalAlignment);
            }
        }
        public void AddPaddingCSS(CSSRule cr)
        {
            if (!string.IsNullOrEmpty(this.Padding))
            {
                dynamic pi = GetPaddingInfo();
                cr.AddRule("padding-left: {0}px", pi.Left);
                cr.AddRule("padding-right: {0}px", pi.Right);
                cr.AddRule("padding-top: {0}px", pi.Top);
                cr.AddRule("padding-bottom: {0}px", pi.Bottom);
            }
        }
        public void AddMarginCSS(CSSRule cr)
        {
            if (!string.IsNullOrEmpty(this.Margin))
            {
                dynamic pi = GetMarginInfo();
                cr.AddRule("margin-left: {0}px", pi.Left);
                cr.AddRule("margin-right: {0}px", pi.Right);
                cr.AddRule("margin-top: {0}px", pi.Top);
                cr.AddRule("margin-bottom: {0}px", pi.Bottom);
            }
        }
        public void AddBorderCSS(CSSRule cr)
        {
            Action<string, dynamic> addRule = (edge, bi) =>
            {
                if (bi != null)
                {
                    string text = string.Format("{0}px {1} {2}", bi.Width, bi.Color, bi.Style);
                    cr.AddRule("border-{0}: {1}", edge, text);
                }
            };
            if (!string.IsNullOrEmpty(this.Border))
            {
                dynamic borderInfo = GetBorderInfo();
                addRule("left", borderInfo.Left);
                addRule("top", borderInfo.Top);
                addRule("right", borderInfo.Right);
                addRule("bottom", borderInfo.Bottom);
            }
        }
        private dynamic ParseMarginOrPadding(string text)
        {
            double left, top, right, bottom;
            left = top = right = bottom = 0.0;
            if (!string.IsNullOrEmpty(text))
            {
                string[] parts = text.Trim().Split(' ');
                Debug.Assert(parts.Length == 4);
                left = Convert.ToDouble(int.Parse(parts[0]));
                top = Convert.ToDouble(int.Parse(parts[1]));
                right = Convert.ToDouble(int.Parse(parts[2]));
                bottom = Convert.ToDouble(int.Parse(parts[3]));
            }
            dynamic r = new ExpandoObject();// { Left = left, Top = top, Right = right, Bottom = bottom };
            r.Left = left;
            r.Top = top;
            r.Right = right;
            r.Bottom = bottom;
            return r;
        }

    }
}