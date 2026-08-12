namespace PolicyManagement.Utilities
{
    public static class PasswordGenerator
    {
        public static string Generate(int length = 10)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            Random random = new Random();
            return new string(
                Enumerable.Repeat(chars,length)
                .Select(s => s[random.Next(s.Length)])
                .ToArray()
            );
        }
    }
}