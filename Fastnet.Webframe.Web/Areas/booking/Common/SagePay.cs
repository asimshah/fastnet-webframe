using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class SageData
    {
        public string VendorTxCode { get; set; }
        public string Amount { get; set; }
        public string Currency { get; set; }
        public string Description { get; set; }
        public string Surname { get; set; }
        public string Firstnames { get; set; }
        public string AddressLine1 { get; set; }
        public string City { get; set; }
        public string PostCode { get; set; }
        public string Country { get; set; }
        public string SuccessUrl { get; set; }
        public string FailureUrl { get; set; }
        public string SourceSiteUrl { get; set; }
        public string Encode()
        {
            return $"VendorTxCode={VendorTxCode}&Amount={Amount}&Currency={Currency}&Description={Description}&BillingSurname={Surname}&BillingFirstnames={Firstnames}&BillingAddress1={AddressLine1}&BillingCity={City}&BillingPostCode={PostCode}&BillingCountry={Country}&DeliverySurname={Surname}&DeliveryFirstnames={Firstnames}&DeliveryAddress1={AddressLine1}&DeliveryCity={City}&DeliveryPostCode={PostCode}&DeliveryCountry={Country}&Website={SourceSiteUrl}&SuccessURL={SuccessUrl}&FailureURL={FailureUrl}";
        }
    }
    public class SagePay
    {
        //"VendorTxCode=sagepaylabs2-70290&Amount=10.00&Currency=GBP&Description=Mobile Form Demo &BillingSurname=.&BillingFirstnames=.&BillingAddress1=Card Address Line 1&BillingCity=Card City&BillingPostCode=Post Code&BillingCountry=GB&DeliverySurname=.&DeliveryFirstnames=.&DeliveryAddress1=Card Address Line 1&DeliveryCity=Card City&DeliveryPostCode=Post Code&DeliveryCountry=GB&SuccessURL=http://rikblacow.wix.com/mobileformdemo?id=1&FailureURL=http://rikblacow.wix.com/mobileformdemo"
        // VendorTxCode=sagepaylabs2-70290
        // Amount=10.00
        // Currency=GBP
        // Description=Mobile Form Demo 
        // BillingSurname=.
        // BillingFirstnames=.
        // BillingAddress1=Card Address Line 1
        // BillingCity=Card City
        // BillingPostCode=Post Code
        // BillingCountry=GB
        // DeliverySurname=.
        // DeliveryFirstnames=.
        // DeliveryAddress1=Card Address Line 1
        // DeliveryCity=Card City
        // DeliveryPostCode=Post Code
        // DeliveryCountry=GB
        // SuccessURL=http://rikblacow.wix.com/mobileformdemo?id=1
        // FailureURL=http://rikblacow.wix.com/mobileformdemo"
        private byte[] encryptionKey;
        private byte[] iv;
        public SagePay(string key)
        {
            SetKeys(key);
        }
        public string Encrypt(string text, string key = null)
        {
            var encrypted = EncryptStringToBytes(text, key);
            return "@" + BitConverter.ToString(encrypted).Replace("-", "");
        }
        public string Decrypt(string strCrypt, string key = null)
        {
            var encryptedData = HexStringToByteArray(strCrypt.Remove(0, 1));
            return DecryptStringFromBytes(encryptedData, key);
        }
        private void SetKeys(string key)
        {
            encryptionKey = UTF8Encoding.UTF8.GetBytes(key);
            iv = encryptionKey;
        }
        private byte[] EncryptStringToBytes(string plainText, string key = null)
        {
            byte[] encrypted = null;
            if (key != null)
            {
                SetKeys(key);
            }
            using (var aes = new RijndaelManaged())
            {
                aes.Padding = PaddingMode.PKCS7;
                aes.Mode = CipherMode.CBC;
                aes.KeySize = 128;
                aes.BlockSize = 128;
                aes.Key = encryptionKey;
                aes.IV = iv;
                var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
                using (var msEncrypt = new MemoryStream())
                {
                    using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                    {
                        using (var swEncrypt = new StreamWriter(csEncrypt))
                        {
                            swEncrypt.Write(plainText);
                            swEncrypt.Flush();
                        }
                    }
                    encrypted = msEncrypt.ToArray();
                }
            }
            return encrypted;
        }
        private string DecryptStringFromBytes(byte[] data, string key = null)
        {
            string plainText = null;
            if (key != null)
            {
                SetKeys(key);
            }
            using (var aes = new RijndaelManaged())
            {
                aes.Padding = PaddingMode.PKCS7;
                aes.Mode = CipherMode.CBC;
                aes.KeySize = 128;
                aes.BlockSize = 128;
                //aes.Key = encryptionKey;
                //aes.IV = iv;
                var decryptor = aes.CreateDecryptor(encryptionKey, iv);

                using (var msDecrypt = new MemoryStream(data))
                {
                    using (var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                    {
                        using (var srDecrypt = new StreamReader(csDecrypt))
                        {
                            plainText = srDecrypt.ReadToEnd();
                        }
                    }
                }
            }
            return plainText;
        }
        private byte[] HexStringToByteArray(string hex)
        {
            return Enumerable.Range(0, hex.Length)
                .Where(x => (x % 2) == 0)
                .Select(x => Convert.ToByte(hex.Substring(x, 2), 16))
                .ToArray();
        }
    }
}