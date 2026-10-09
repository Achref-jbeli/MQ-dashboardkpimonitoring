using System.Security.Cryptography;
using System.Text;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;

namespace DashboardKpi.Infrastructure.Services;

public class TotpService : ITotpService
{
    private const string Base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    public string GenerateSecret()
    {
        var secretBytes = RandomNumberGenerator.GetBytes(20);
        return Base32Encode(secretBytes);
    }

    public string GenerateQrCode(string email, string secret)
    {
        return $"otpauth://totp/DashboardKpi:{email}?secret={secret}&issuer=DashboardKpi";
    }

    public bool ValidateCode(string secret, string code)
    {
        int digits = 6;
        int periodSeconds = 30;
        int allowedDriftWindows = 1;

        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(code) || code.Length < digits)
        {
            return false;
        }

        var key = Base32Decode(secret);
        var unixTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var currentWindow = unixTime / periodSeconds;

        for (var offset = -allowedDriftWindows; offset <= allowedDriftWindows; offset++)
        {
            var candidate = ComputeTotpCode(key, currentWindow + offset, digits);
            if (CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(candidate), Encoding.UTF8.GetBytes(code)))
            {
                return true;
            }
        }

        return false;
    }

    private static string ComputeTotpCode(byte[] key, long counter, int digits)
    {
        Span<byte> counterBytes = stackalloc byte[8];
        for (var i = 7; i >= 0; i--)
        {
            counterBytes[i] = (byte)(counter & 0xFF);
            counter >>= 8;
        }

        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(counterBytes.ToArray());
        var offset = hash[^1] & 0x0F;
        var binaryCode = ((hash[offset] & 0x7F) << 24)
                         | (hash[offset + 1] << 16)
                         | (hash[offset + 2] << 8)
                         | hash[offset + 3];

        var otp = binaryCode % (int)Math.Pow(10, digits);
        return otp.ToString(new string('0', digits));
    }

    private static string Base32Encode(byte[] data)
    {
        var builder = new StringBuilder((data.Length + 4) / 5 * 8);
        var buffer = 0;
        var bitsLeft = 0;

        foreach (var b in data)
        {
            buffer = (buffer << 8) | b;
            bitsLeft += 8;

            while (bitsLeft >= 5)
            {
                var index = (buffer >> (bitsLeft - 5)) & 31;
                bitsLeft -= 5;
                builder.Append(Base32Alphabet[index]);
            }
        }

        if (bitsLeft > 0)
        {
            var index = (buffer << (5 - bitsLeft)) & 31;
            builder.Append(Base32Alphabet[index]);
        }

        return builder.ToString();
    }

    private static byte[] Base32Decode(string input)
    {
        var cleaned = input.Trim().TrimEnd('=').ToUpperInvariant();
        var output = new List<byte>();
        var buffer = 0;
        var bitsLeft = 0;

        foreach (var c in cleaned)
        {
            var index = Base32Alphabet.IndexOf(c);
            if (index < 0)
            {
                throw new FormatException("Invalid Base32 secret.");
            }

            buffer = (buffer << 5) | index;
            bitsLeft += 5;

            if (bitsLeft >= 8)
            {
                output.Add((byte)((buffer >> (bitsLeft - 8)) & 0xFF));
                bitsLeft -= 8;
            }
        }

        return output.ToArray();
    }
}
