using System.Collections.Concurrent;
using System.IO.MemoryMappedFiles;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using mtapi.mt5;

namespace Mt5Bridge;

/// <summary>
/// Pure C# Direct MT5 TCP Socket Connector for MT5 Server Builds 5200+ / 5830+.
/// Fixes the two issues in mtapi.be.mt5net 5.4850.0:
/// 1. LoginId.Decode IndexOutOfRangeException on 87-ulong challenge arrays (pads challenge to +32 bytes).
/// 2. AccountLoader waiting on Type 12 LoadFinish flag when MT5 Build 5830+ sends compressed final chunk.
/// </summary>
public static class Mt5DirectConnector
{
    private static readonly Assembly Mt5Asm = typeof(MT5API).Assembly;
    private static readonly Type ConnectionType = Mt5Asm.GetType("mtapi.mt5.Connection")!;
    private static readonly Type ConnectLogsType = Mt5Asm.GetType("mtapi.mt5.ConnectLogs")!;
    private static readonly Type CmdHandlerType = Mt5Asm.GetType("mtapi.mt5.CmdHandler")!;
    private static readonly Type InBufType = Mt5Asm.GetType("mtapi.mt5.InBuf")!;
    private static readonly Type OutBufType = Mt5Asm.GetType("mtapi.mt5.OutBuf")!;
    private static readonly Type PacketHdrType = Mt5Asm.GetType("mtapi.mt5.PacketHdr")!;
    private static readonly Type CryptType = Mt5Asm.GetType("mtapi.mt5.Crypt")!;
    private static readonly Type UdtType = Mt5Asm.GetType("mtapi.mt5.UDT")!;
    private static readonly Type BuildRecType = Mt5Asm.GetType("mtapi.mt5.BuildRec")!;
    private static readonly Type LoginRcv1Type = Mt5Asm.GetType("mtapi.mt5.LoginRcv1")!;
    private static readonly Type PackEncryptType = Mt5Asm.GetType("mtapi.mt5.PackEncrypt")!;
    private static readonly Type PackDecryptType = Mt5Asm.GetType("mtapi.mt5.PackDecrypt")!;
    private static readonly Type LoginIdType = Mt5Asm.GetType("mtapi.mt5.LoginId")!;
    private static readonly Type LoginIdWebServerType = Mt5Asm.GetType("mtapi.mt5.LoginIdWebServer")!;
    private static readonly Type InBufAccLoadType = Mt5Asm.GetType("mtapi.mt5.InBufAccLoad")!;
    private static readonly Type AccountLoaderType = Mt5Asm.GetType("mtapi.mt5.AccountLoader")!;
    private static readonly Type SymbolsType = Mt5Asm.GetType("mtapi.mt5.Symbols")!;

    public static void ConnectDirect(MT5API qc, int connectTimeoutMs = 12000)
    {
        var logProp = typeof(MT5API).GetField("Log", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
        var log = logProp?.GetValue(qc);
        var process = Activator.CreateInstance(ConnectLogsType, true)!;

        var conn = Activator.CreateInstance(
            ConnectionType,
            BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic,
            null,
            new object[] { qc },
            null
        )!;

        short clientBuild = qc.Build != 0 ? (short)qc.Build : (short)5600;
        ConnectionType.GetField("CLIENT_BUILD", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)
            ?.SetValue(conn, (ulong)clientBuild);

        Exception? disconnectEx = null;
        string diagInfo = "";
        OnConnectProgress hProg = (_, args) =>
        {
            if (args.Exception != null)
            {
                disconnectEx = args.Exception;
            }
        };
        qc.OnConnectProgress += hProg;

        try
        {
            // 1. Open TCP Socket
            var connectMethod = ConnectionType.GetMethod(
                "Connect",
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic,
                null,
                new[] { typeof(int) },
                null
            )!;
            var connectTask = (Task)connectMethod.Invoke(conn, new object[] { connectTimeoutMs })!;
            connectTask.GetAwaiter().GetResult();

            // 2. SendLogin packet (Type 0, 34 bytes payload)
            var getSendId = ConnectionType.GetMethod("GetSendId", BindingFlags.Instance | BindingFlags.NonPublic)!;
            var createHardId = ConnectionType.GetMethod("CreateHardId", BindingFlags.Static | BindingFlags.NonPublic)!;
            var sendMethod = ConnectionType.BaseType!.GetMethod(
                "Send",
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic,
                null,
                new[] { typeof(byte[]) },
                null
            )!;
            var receiveMethod = ConnectionType.BaseType!.GetMethod(
                "Receive",
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic,
                null,
                new[] { typeof(int) },
                null
            )!;
            var easyCrypt = CryptType.GetMethod("EasyCrypt", BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)!;
            var easyDecrypt = CryptType.GetMethod("EasyDecrypt", BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)!;
            var readStructBytes = UdtType.GetMethods(BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)
                .First(m => m.Name == "ReadStruct" && m.GetParameters().Length == 3);

            byte[] loginPayload = new byte[34];
            loginPayload[0] = (byte)DateTime.Now.Ticks;
            loginPayload[1] = 0;
            BitConverter.GetBytes(clientBuild).CopyTo(loginPayload, 2);
            BitConverter.GetBytes((short)20813).CopyTo(loginPayload, 4);
            BitConverter.GetBytes(qc.User).CopyTo(loginPayload, 6);
            qc.HardwareId ??= (byte[])createHardId.Invoke(null, null)!;
            qc.HardwareId.CopyTo(loginPayload, 14);
            BitConverter.GetBytes(Random.Shared.Next()).CopyTo(loginPayload, 30);

            byte[] loginFrame = new byte[9 + loginPayload.Length];
            loginFrame[0] = 0;
            BitConverter.GetBytes(loginPayload.Length).CopyTo(loginFrame, 1);
            var sendId0 = (int)getSendId.Invoke(conn, null)!;
            BitConverter.GetBytes((ushort)sendId0).CopyTo(loginFrame, 5);
            BitConverter.GetBytes((ushort)2).CopyTo(loginFrame, 7);
            var encLogin = (byte[])easyCrypt.Invoke(null, new object[] { loginPayload })!;
            encLogin.CopyTo(loginFrame, 9);

            ((Task)sendMethod.Invoke(conn, new object[] { loginFrame })!).GetAwaiter().GetResult();

            // 3. Receive BuildRec (Type 0, 32 bytes)
            const BindingFlags AllFlags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;
            var hdrBytes0 = ((Task<byte[]>)receiveMethod.Invoke(conn, new object[] { 9 })!).GetAwaiter().GetResult();
            var hdr0 = readStructBytes.MakeGenericMethod(PacketHdrType).Invoke(null, new object[] { hdrBytes0, 0, 9 })!;
            var pktType0 = (byte)PacketHdrType.GetField("Type", AllFlags)!.GetValue(hdr0)!;
            var pktSize0 = (int)PacketHdrType.GetField("PacketSize", AllFlags)!.GetValue(hdr0)!;
            if (pktType0 != 0 || pktSize0 != 32)
            {
                throw new InvalidOperationException($"Unexpected MT5 handshake header: type={pktType0}, size={pktSize0}");
            }

            var rawBuildBytes = ((Task<byte[]>)receiveMethod.Invoke(conn, new object[] { pktSize0 })!).GetAwaiter().GetResult();
            var decBuildBytes = (byte[])easyDecrypt.Invoke(null, new object[] { rawBuildBytes })!;
            var buildRec = readStructBytes.MakeGenericMethod(BuildRecType).Invoke(null, new object[] { decBuildBytes, 0, 32 })!;
            var status0 = (Msg)BuildRecType.GetField("StatusCode", AllFlags)!.GetValue(buildRec)!;
            if (status0 != Msg.DONE && status0 != 0)
            {
                throw new ServerException(status0);
            }

            var signData = (byte[])BuildRecType.GetField("SignData", AllFlags)!.GetValue(buildRec)!;
            ConnectionType.GetField("SignData", AllFlags)!.SetValue(conn, signData);

            // 4. SendAccountPassword (Type 1)
            string password = qc.Password.Length > 16 ? qc.Password[..16] : qc.Password;
            byte[] pwBuf = new byte[8 + password.Length * 2 + 4];
            BitConverter.GetBytes(qc.User).CopyTo(pwBuf, 0);
            Encoding.Unicode.GetBytes(password).CopyTo(pwBuf, 8);
            Encoding.Unicode.GetBytes("MQ").CopyTo(pwBuf, 8 + password.Length * 2);

            var md5Type = Mt5Asm.GetType("mtapi.mt5.MD5Managed")!;
            var md5 = Activator.CreateInstance(md5Type, true)!;
            var hashCore = md5Type.GetMethod("HashCore", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!;
            var hashFinal = md5Type.GetMethod("HashFinal", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!;
            var initMd5 = md5Type.GetMethod("Initialize", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic, null, new[] { typeof(bool) }, null)!;
            var hashProp = md5Type.GetProperty("Hash", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!;

            hashCore.Invoke(md5, new object[] { pwBuf, 0, pwBuf.Length });
            hashFinal.Invoke(md5, null);
            initMd5.Invoke(md5, new object[] { false });
            hashCore.Invoke(md5, new object[] { signData, 0, signData.Length });
            hashFinal.Invoke(md5, null);
            var pwHash = (byte[])hashProp.GetValue(md5)!;

            byte[] randData = new byte[16];
            Random.Shared.NextBytes(randData);
            ConnectionType.GetField("RandData", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(conn, randData);

            byte[] authPayload = new byte[34];
            BitConverter.GetBytes((ushort)Random.Shared.Next()).CopyTo(authPayload, 0);
            pwHash.CopyTo(authPayload, 2);
            randData.CopyTo(authPayload, 18);

            byte[] authFrame = new byte[9 + authPayload.Length];
            authFrame[0] = 1;
            BitConverter.GetBytes(authPayload.Length).CopyTo(authFrame, 1);
            var sendId1 = (int)getSendId.Invoke(conn, null)!;
            BitConverter.GetBytes((ushort)sendId1).CopyTo(authFrame, 5);
            BitConverter.GetBytes((ushort)2).CopyTo(authFrame, 7);
            var encAuth = (byte[])easyCrypt.Invoke(null, new object[] { authPayload })!;
            encAuth.CopyTo(authFrame, 9);

            ((Task)sendMethod.Invoke(conn, new object[] { authFrame })!).GetAwaiter().GetResult();

            // 5. AcceptAuthorized (Type 1 response)
            var hdrBytes1 = ((Task<byte[]>)receiveMethod.Invoke(conn, new object[] { 9 })!).GetAwaiter().GetResult();
            var hdr1 = readStructBytes.MakeGenericMethod(PacketHdrType).Invoke(null, new object[] { hdrBytes1, 0, 9 })!;
            var pktType1 = (byte)PacketHdrType.GetField("Type", AllFlags)!.GetValue(hdr1)!;
            var pktSize1 = (int)PacketHdrType.GetField("PacketSize", AllFlags)!.GetValue(hdr1)!;
            if (pktType1 != 1)
            {
                throw new InvalidOperationException($"AcceptAuthorized expected (got type {pktType1})");
            }

            var rawAuthResp = ((Task<byte[]>)receiveMethod.Invoke(conn, new object[] { pktSize1 })!).GetAwaiter().GetResult();
            var decAuthResp = (byte[])easyDecrypt.Invoke(null, new object[] { rawAuthResp })!;
            var loginRcv = readStructBytes.MakeGenericMethod(LoginRcv1Type).Invoke(null, new object[] { decAuthResp, 0, 44 })!;
            var status1 = (Msg)LoginRcv1Type.GetField("StatusCode", AllFlags)!.GetValue(loginRcv)!;
            if (status1 != 0 && status1 != Msg.DONE && status1 != Msg.ADVANCED_AUTHORIZATION)
            {
                throw new ServerException(status1);
            }

            short tradeBuild = (short)LoginRcv1Type.GetField("TradeBuild", AllFlags)!.GetValue(loginRcv)!;
            short symBuild = (short)LoginRcv1Type.GetField("SymBuild", AllFlags)!.GetValue(loginRcv)!;
            ConnectionType.GetField("TradeBuild", AllFlags)!.SetValue(conn, tradeBuild);
            ConnectionType.GetField("SymBuild", AllFlags)!.SetValue(conn, symBuild);

            var inBuf1 = Activator.CreateInstance(InBufType, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic, null, new object[] { decAuthResp, 44 }, null)!;
            var hasDataProp = InBufType.GetProperty("hasData", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!;
            var byteMethod = InBufType.GetMethod("Byte", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!;
            var strMethod = InBufType.GetMethod("Str", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!;
            var byteArMethod = InBufType.GetMethod("ByteAr", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!;
            var getCryptKey = ConnectionType.GetMethod("GetCryptKey", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)!;
            var getProtectKey = ConnectionType.GetMethod("GetProtectKey", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)!;

            while ((bool)hasDataProp.GetValue(inBuf1)!)
            {
                byte tag = (byte)byteMethod.Invoke(inBuf1, null)!;
                switch (tag)
                {
                    case 0:
                        ConnectionType.GetField("ServerName", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!.SetValue(conn, strMethod.Invoke(inBuf1, null));
                        break;
                    case 1:
                        ConnectionType.GetField("SrvCert", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!.SetValue(conn, byteArMethod.Invoke(inBuf1, null));
                        break;
                    case 7:
                    {
                        var aesKey = (byte[])byteArMethod.Invoke(inBuf1, null)!;
                        ConnectionType.GetField("AesKey", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!.SetValue(conn, aesKey);
                        var cryptKey = (byte[])getCryptKey.Invoke(conn, new object[] { aesKey })!;
                        var encryptor = Activator.CreateInstance(PackEncryptType, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic, null, new object[] { cryptKey }, null);
                        var decryptor = Activator.CreateInstance(PackDecryptType, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic, null, new object[] { cryptKey }, null);
                        ConnectionType.BaseType!.GetField("Encryptor", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)!.SetValue(conn, encryptor);
                        ConnectionType.BaseType!.GetField("Decryptor", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)!.SetValue(conn, decryptor);
                        break;
                    }
                    case 27:
                    {
                        var rawProtect = (byte[])byteArMethod.Invoke(inBuf1, null)!;
                        var protKey = (byte[])getProtectKey.Invoke(conn, new object[] { rawProtect })!;
                        ConnectionType.GetField("ProtectKey", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!.SetValue(conn, protKey);
                        break;
                    }
                    case 28:
                    {
                        var loginHash = (byte[])byteArMethod.Invoke(inBuf1, null)!;
                        ulong decodedId = SafeDecodeLoginId(qc, loginHash, out string idSrc);
                        ulong finalLoginId = decodedId ^ qc.User ^ (ulong)clientBuild ^ BitConverter.ToUInt64(signData, 0) ^ 0x5286AED3286692AuL;
                        ConnectionType.GetField("LoginId", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!.SetValue(conn, finalLoginId);
                        diagInfo += $"L28={loginHash.Length}b({idSrc}:0x{decodedId:X}),";
                        break;
                    }
                    case 35:
                    {
                        var loginHashEx = (byte[])byteArMethod.Invoke(inBuf1, null)!;
                        ulong decodedEx = SafeDecodeLoginIdEx(qc, loginHashEx, out string exSrc);
                        ulong finalLoginIdEx = decodedEx ^ qc.User ^ (ulong)clientBuild ^ BitConverter.ToUInt64(signData, 0) ^ 0x5286AED3286692AuL;
                        ConnectionType.GetField("LoginIdEx", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!.SetValue(conn, finalLoginIdEx);
                        diagInfo += $"L35={loginHashEx.Length}b({exSrc}:0x{decodedEx:X}),";
                        break;
                    }
                    default:
                        byteArMethod.Invoke(inBuf1, null);
                        break;
                }
            }

            // 6. Send RequestTradeInfo (Type 12)
            var reqTradeInfo = ConnectionType.GetMethod("RequestTradeInfo", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!;
            ((Task)reqTradeInfo.Invoke(conn, new object[] { process })!).GetAwaiter().GetResult();

            // 7. Start CmdHandler and wait for Account Info (with Build 5830+ multi-packet completion support)
            var cmdHandler = Activator.CreateInstance(
                CmdHandlerType,
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic,
                null,
                new object[] { qc, conn },
                null
            )!;

            var gotAccField = CmdHandlerType.GetField("GotAccountInfo", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)!;
            var accExField = CmdHandlerType.GetField("AccountLoaderException", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)!;
            var bufAccLoadField = CmdHandlerType.GetField("BufferAccountLoader", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)!;
            var stopCmdMethod = CmdHandlerType.GetMethod("StopCmdHandler", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)!;

            var sw = System.Diagnostics.Stopwatch.StartNew();
            while (!(bool)gotAccField.GetValue(cmdHandler)!)
            {
                var loaderEx = (Exception?)accExField.GetValue(cmdHandler);
                if (loaderEx != null)
                {
                    throw loaderEx;
                }

                // If Account object is already populated by AccountLoader and > 1.5s elapsed, mark LoadFinish = true
                if (qc.Account != null && qc.Account.Login == qc.User && sw.ElapsedMilliseconds > 1200)
                {
                    var bufAcc = bufAccLoadField.GetValue(cmdHandler);
                    if (bufAcc != null)
                    {
                        InBufAccLoadType.GetField("LoadFinish")?.SetValue(bufAcc, true);
                        var ev = (AutoResetEvent?)InBufAccLoadType.GetField("AbbBufEvent", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)?.GetValue(bufAcc);
                        ev?.Set();
                    }
                    gotAccField.SetValue(cmdHandler, true);
                    break;
                }

                var cmdStopNow = (bool)(CmdHandlerType.GetField("Stop", AllFlags)?.GetValue(cmdHandler) ?? false);
                if (cmdStopNow && sw.ElapsedMilliseconds > 300)
                {
                    Thread.Sleep(150);
                    if ((bool)gotAccField.GetValue(cmdHandler)! || (qc.Account != null && qc.Account.Login == qc.User))
                    {
                        break;
                    }
                }

                if (cmdStopNow || sw.ElapsedMilliseconds > connectTimeoutMs)
                {
                    var bufAcc = bufAccLoadField.GetValue(cmdHandler);
                    var curIdx = bufAcc != null ? InBufAccLoadType.GetProperty("CurrentIndex")?.GetValue(bufAcc) : null;
                    var loadFinish = bufAcc != null ? InBufAccLoadType.GetField("LoadFinish")?.GetValue(bufAcc) : null;
                    var ind = bufAcc != null ? InBufType.GetField("Ind", AllFlags)?.GetValue(bufAcc) : null;
                    var bufBytes = bufAcc != null ? (byte[]?)InBufType.GetField("Buf", AllFlags)?.GetValue(bufAcc) : null;
                    var cmdStop = CmdHandlerType.GetField("Stop", AllFlags)?.GetValue(cmdHandler);
                    stopCmdMethod.Invoke(cmdHandler, null);
                    throw new TimeoutException(
                        $"Timeout({sw.ElapsedMilliseconds}ms,b={clientBuild}) on #{qc.User} " +
                        $"(Account={qc.Account != null}, Base={qc.Symbols?.Base != null}, Infos={qc.Symbols?.Infos?.Count ?? -1}, " +
                        $"TradeBuild={tradeBuild}, SymBuild={symBuild}, CmdStop={cmdStop}, LoadFinish={loadFinish}, " +
                        $"Ind={ind}/{bufBytes?.Length ?? -1}, Idx={curIdx}, Diag={diagInfo} DiscEx={disconnectEx?.GetType().Name}:{disconnectEx?.Message})"
                    );
                }

                Thread.Sleep(50);
            }

            // 8. Finalize MT5API connection state
            var addInstance = SymbolsType.GetMethod("AddInstance", BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.Public);
            addInstance?.Invoke(null, new object?[] { qc.ClusterSummary?.ServerName, qc.Symbols });

            var sendPacketMethod = ConnectionType.GetMethod("SendPacket", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)!;
            var pingBuf = Activator.CreateInstance(OutBufType, true)!;
            ((Task)sendPacketMethod.Invoke(conn, new object[] { (byte)10, pingBuf, false })!).GetAwaiter().GetResult();

            var setConnMethod = typeof(MT5API).GetMethod("SetConnection", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)!;
            setConnMethod.Invoke(qc, new object[] { conn, cmdHandler });
            typeof(MT5API).GetField("ConnectTime", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)?.SetValue(qc, DateTime.Now);
        }
        catch
        {
            try
            {
                ConnectionType.GetMethod("Close", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)?.Invoke(conn, null);
            }
            catch { /* ignore */ }
            throw;
        }
        finally
        {
            qc.OnConnectProgress -= hProg;
        }
    }

    private static ulong SafeDecodeLoginId(MT5API qc, byte[] loginHash, out string idSrc)
    {
        var ops = new List<ulong>();
        for (int i = 0; i + 2 < loginHash.Length / 8; i += 3)
        {
            ulong w0 = BitConverter.ToUInt64(loginHash, i * 8);
            ops.Add((w0 >> 21) & 0xFF);
        }
        string opStr = string.Join(".", ops.Take(10)) + ".." + string.Join(".", ops.Skip(Math.Max(0, ops.Count - 4)));

        try
        {
            var ws = Activator.CreateInstance(LoginIdWebServerType, true)!;
            var wsDecode = LoginIdWebServerType.GetMethod("Decode", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!;
            var val = (ulong)wsDecode.Invoke(ws, new object[] { qc.LoginIdPath + "/Decode", qc.ApiKey ?? "", loginHash, qc.LoginIdWebServerTimeout })!;
            idSrc = $"ws({opStr})";
            return val;
        }
        catch (Exception ex2)
        {
            var loc = SafeDecodeLoginIdLocal(loginHash);
            idSrc = $"pad({(ex2.InnerException ?? ex2).Message}|ops:{opStr})";
            return loc;
        }
    }

    private static ulong SafeDecodeLoginIdLocal(byte[] loginHash)
    {
        try
        {
            // Pad with a 24-byte VM stop instruction triplet [(216uL << 21), 0, 0] so mt5api's LoginId.Decode terminates cleanly
            byte[] padded = new byte[loginHash.Length + 24];
            Buffer.BlockCopy(loginHash, 0, padded, 0, loginHash.Length);
            BitConverter.GetBytes(216uL << 21).CopyTo(padded, loginHash.Length);
            var lid = Activator.CreateInstance(LoginIdType, true)!;
            var decodeMethod = LoginIdType.GetMethod("Decode", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic, null, new[] { typeof(byte[]) }, null)!;
            return (ulong)decodeMethod.Invoke(lid, new object[] { padded })!;
        }
        catch
        {
            ulong[] array = new ulong[loginHash.Length / 8];
            for (int i = 0; i < array.Length; i++)
            {
                array[i] = BitConverter.ToUInt64(loginHash, i * 8);
            }
            return DecodeLoginIdVm(array, (uint)array.Length);
        }
    }

    private static ulong DecodeLoginIdVm(ulong[] pData, uint szData)
    {
        if (szData == 0) return 0uL;
        ulong[] t = new ulong[64];
        for (int i = 0; i < 64; i++) t[i] = 1uL << i;

        ulong s0 = 0uL;
        ulong s8 = 0uL;
        ulong s10 = 0uL;
        ulong s18 = 0uL;
        ulong num28 = pData[0];

        while (s8 + 2 < szData)
        {
            ulong num8 = num28;
            ulong num19 = num28;
            ulong num18 = pData[s8];
            ulong num10 = 0uL;
            ulong num12 = 0uL;
            for (int i = 0; i < 64; i++)
            {
                ulong num13 = Convert.ToUInt64((num18 & t[i]) != 0);
                ulong num9 = Convert.ToUInt64((num19 & t[i]) != 0);
                ulong num4 = num13 ^ num9 ^ num12;
                num12 = (((Convert.ToBoolean(num13) & Convert.ToBoolean(num9)) || (Convert.ToBoolean(num13) & Convert.ToBoolean(num12))) ? 1uL : (num9 & num12));
                ulong num7 = (ulong)((num4 != 0L) ? (-1) : 0);
                num10 |= t[i] & num7;
            }
            num19 = num10;
            num18 = ~num8 + 1;
            num10 = 0uL;
            num12 = 0uL;
            for (int j = 0; j < 64; j++)
            {
                ulong num13 = Convert.ToUInt64((num19 & t[j]) != 0);
                ulong num9 = Convert.ToUInt64((num18 & t[j]) != 0);
                ulong num36 = num13 ^ num9 ^ num12;
                num12 = ((Convert.ToBoolean(num13 & num9) || Convert.ToBoolean(num13 & num12)) ? 1uL : (num9 & num12));
                ulong num5 = (ulong)((num36 != 0L) ? (-1) : 0);
                num10 |= t[j] & num5;
            }
            ulong num22 = 28uL;
            long num37 = 21L;
            ulong num27 = (uint)((num10 >> 32) & 0xFFFFFFFFu) | ((ulong)(uint)(num10 & 0xFFFFFFFFu) << 32);
            ulong num24 = (ulong)(~num37 + 1);
            ulong num9_a = 0uL;
            ulong num15 = 0uL;
            for (int k = 0; k < 64; k++)
            {
                ulong num16 = Convert.ToUInt64((num22 & t[k]) != 0);
                ulong num12_a = Convert.ToUInt64((num24 & t[k]) != 0);
                ulong num11 = num16 ^ num12_a ^ num15;
                num15 = ((Convert.ToBoolean(num16 & num12_a) || Convert.ToBoolean(num15 & num16)) ? 1uL : (num12_a & num15));
                ulong num7 = (ulong)((num11 != 0L) ? (-1) : 0);
                num9_a |= t[k] & num7;
            }
            num27 = ((uint)(num27 & 0xFFFFFFFFu) >> 21) | ((ulong)(uint)((int)((uint)(((long)num27 >> 32) & 0xFFFFFFFFu) >> 21) | ((int)(num27 & 0xFFFFFFFFu) << 11)) << 32);
            ulong num = num9_a + 1;
            ulong num2 = (ulong)(-1L << (int)(num & 0xFFFFFFFFu));
            ulong num25 = ((uint)(((long)num27 >> 32) & 0xFFFFFFFFu) | ((ulong)(uint)(num27 & 0xFFFFFFFFu) << 32)) & ~num2;
            if (num25 == 216uL)
            {
                break;
            }

            s10 = pData[(uint)((s8 + 1) & 0xFFFFFFFFu)];
            ulong num6 = s8;
            ulong num7_b = 2uL;
            do
            {
                num7_b = num6 ^ num7_b;
                num6 = (num6 & ~num7_b) << 1;
            }
            while (num6 != 0L);
            if (num7_b >= szData) break;
            s18 = pData[(uint)(num7_b & 0xFFFFFFFFu)];

            num27 = (uint)(((long)s10 >> 32) & 0xFFFFFFFFu) | ((ulong)(uint)(s10 & 0xFFFFFFFFu) << 32);
            num27 = ((uint)(num27 & 0xFFFFFFFFu) >> 21) | ((ulong)(uint)((int)((uint)(((long)num27 >> 32) & 0xFFFFFFFFu) >> 21) | ((int)(num27 & 0xFFFFFFFFu) << 11)) << 32);
            ulong num7_c = ((uint)(((long)num27 >> 32) & 0xFFFFFFFFu) | ((ulong)(uint)(num27 & 0xFFFFFFFFu) << 32)) & ~num2;
            if (~(num7_c ^ 0xFFFFFFFFFFFFFF0AuL) == 0L)
            {
                s10 = s0;
            }
            if (num25 == 84uL)
            {
                s0 = s10 & s18;
            }
            if (num25 == 112uL)
            {
                s0 = s10 | s18;
            }
            if (num25 == 145uL)
            {
                s0 = s10 ^ s18;
            }
            if (num25 == 171uL)
            {
                ulong a = s10;
                ulong b = s18;
                do
                {
                    b = a ^ b;
                    a = (a & ~b) << 1;
                }
                while (a != 0L);
                s0 = b;
            }
            if (num25 == 169uL)
            {
                ulong a = s10;
                ulong b = ~s18 + 1;
                do
                {
                    b = a ^ b;
                    a = (a & ~b) << 1;
                }
                while (a != 0L);
                s0 = b;
            }
            if (num25 == 177uL)
            {
                ulong shift = s18 % 24;
                ulong val = s10;
                for (ulong idx = 0; idx < shift; idx++)
                {
                    val += val;
                }
                s0 = val;
            }
            if ((num25 ^ 0xC8) == 0L)
            {
                ulong num35 = s18 % 24;
                ulong num34 = s10;
                ulong acc = 0uL;
                for (ulong num29 = 0; num29 < 64; num29++)
                {
                    if ((num34 & t[num29]) != 0L && num29 >= num35)
                    {
                        acc ^= t[num29 - num35];
                    }
                }
                s0 = acc;
            }
            s8 += 3uL;
        }
        return s0;
    }

    private static ulong SafeDecodeLoginIdEx(MT5API qc, byte[] loginHashEx, out string exSrc)
    {
        var ops = new List<ulong>();
        for (int i = 0; i + 2 < loginHashEx.Length / 8; i += 3)
        {
            ulong w0 = BitConverter.ToUInt64(loginHashEx, i * 8);
            ops.Add((w0 >> 21) & 0xFF);
        }
        string opStr = string.Join(".", ops.Take(8)) + ".." + string.Join(".", ops.Skip(Math.Max(0, ops.Count - 4)));

        try
        {
            var ws = Activator.CreateInstance(LoginIdWebServerType, true)!;
            var wsDecode = LoginIdWebServerType.GetMethod("Decode", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!;
            var val = (ulong)wsDecode.Invoke(ws, new object[] { qc.LoginIdPath + "/DecodeEx", qc.ApiKey ?? "", loginHashEx, qc.LoginIdWebServerTimeout })!;
            var loc = SafeDecodeLoginIdLocal(loginHashEx);
            exSrc = $"ws(ops:{opStr}|loc:0x{loc:X})";
            return val;
        }
        catch (Exception ex)
        {
            var inner = ex.InnerException ?? ex;
            var vmVal = SafeDecodeLoginIdLocal(loginHashEx);
            exSrc = $"vm({inner.Message}|ops:{opStr})";
            return vmVal;
        }
    }
}
