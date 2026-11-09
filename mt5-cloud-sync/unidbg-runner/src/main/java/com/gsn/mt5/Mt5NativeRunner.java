package com.gsn.mt5;

import com.github.unidbg.AndroidEmulator;
import com.github.unidbg.Module;
import com.github.unidbg.arm.backend.Backend;
import com.github.unidbg.arm.backend.CodeHook;
import com.github.unidbg.arm.backend.UnHook;
import com.github.unidbg.linux.android.AndroidEmulatorBuilder;
import com.github.unidbg.linux.android.AndroidResolver;
import com.github.unidbg.linux.android.dvm.*;
import com.github.unidbg.linux.android.dvm.array.ArrayObject;
import com.github.unidbg.linux.android.dvm.array.ByteArray;
import com.github.unidbg.linux.android.dvm.array.IntArray;
import com.github.unidbg.memory.Memory;
import com.github.unidbg.virtualmodule.android.AndroidModule;
import com.github.unidbg.virtualmodule.android.JniGraphics;
import unicorn.Arm64Const;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Mt5NativeRunner extends AbstractJni {
    private static final String ANDROID_FILES_DIR = "/data/user/0/net.metaquotes.metatrader5/files";

    private final AndroidEmulator emulator;
    private final VM vm;
    private final Module module;
    private final File workDir;

    private final Map<DvmObject<?>, Map<String, Object>> fieldStore = new IdentityHashMap<>();
    private final Map<String, Object> staticFieldStore = new HashMap<>();
    private SocketChannel socketChannel;
    private int lastRecvBytes = 0;
    private int packetsInCurrentReadCall = 0;
    private static final int VIRTUAL_SOCKET_FD = 100;

    private static String readUtf16Le(Backend backend, long addr, int maxChars) {
        if (addr == 0) return "";
        byte[] raw = backend.mem_read(addr, maxChars * 2);
        int end = 0;
        while (end + 1 < raw.length && !(raw[end] == 0 && raw[end + 1] == 0)) {
            end += 2;
        }
        return new String(raw, 0, end, StandardCharsets.UTF_16LE);
    }

    private static String readAscii(Backend backend, long addr, int maxBytes) {
        if (addr == 0) return "";
        try {
            byte[] raw = backend.mem_read(addr, maxBytes);
            int end = 0;
            while (end < raw.length && raw[end] != 0) end++;
            return new String(raw, 0, end, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    private void patchInsn(long offset, int insn) {
        byte[] bytes = ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(insn).array();
        emulator.getBackend().mem_write(module.base + offset, bytes);
    }

    private void fixJniGetStringRegion() {
        // Fix Unidbg 0.9.7 bug in DalvikVM64$217 (GetStringRegion @ JNIEnv offset 0x6e0)
        // which only copies (length + 1) bytes instead of (length * 2) UTF-16LE bytes!
        long jniTable = vm.getJNIEnv().getLong(0);
        long getStringRegionSvcAddr = emulator.getMemory().pointer(jniTable + 0x6e0).getLong(0);
        Backend backend = emulator.getBackend();
        byte[] retBytes = ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(0xd65f03c0).array();
        backend.mem_write(getStringRegionSvcAddr, retBytes);
        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                int jstrHash = b.reg_read(Arm64Const.UC_ARM64_REG_X1).intValue();
                int start = b.reg_read(Arm64Const.UC_ARM64_REG_X2).intValue();
                int len = b.reg_read(Arm64Const.UC_ARM64_REG_X3).intValue();
                long buf = b.reg_read(Arm64Const.UC_ARM64_REG_X4).longValue();
                DvmObject<?> obj = vm.getObject(jstrHash);
                if (obj instanceof StringObject && buf != 0 && len > 0) {
                    String val = ((StringObject) obj).getValue();
                    if (val != null && start >= 0 && start < val.length()) {
                        int end = Math.min(val.length(), start + len);
                        byte[] utf16 = val.substring(start, end).getBytes(StandardCharsets.UTF_16LE);
                        b.mem_write(buf, utf16);
                    }
                }
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, getStringRegionSvcAddr, getStringRegionSvcAddr, null);

        // Fix Unidbg 0.9.7 unimplemented DalvikVM64$180 (NewString @ JNIEnv offset 0x518)
        long newStringSvcAddr = emulator.getMemory().pointer(jniTable + 0x518).getLong(0);
        backend.mem_write(newStringSvcAddr, retBytes);
        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long unicodeCharsAddr = b.reg_read(Arm64Const.UC_ARM64_REG_X1).longValue();
                int len = b.reg_read(Arm64Const.UC_ARM64_REG_X2).intValue();
                if (unicodeCharsAddr == 0 || len < 0) {
                    b.reg_write(Arm64Const.UC_ARM64_REG_X0, 0L);
                    return;
                }
                String str = "";
                if (len > 0) {
                    byte[] raw = b.mem_read(unicodeCharsAddr, len * 2);
                    str = new String(raw, StandardCharsets.UTF_16LE);
                    int nul = str.indexOf('\0');
                    if (nul >= 0) {
                        str = str.substring(0, nul);
                    }
                }
                long hash = vm.addLocalObject(new StringObject(vm, str)) & 0xffffffffL;
                b.reg_write(Arm64Const.UC_ARM64_REG_X0, hash);
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, newStringSvcAddr, newStringSvcAddr, null);
    }

    private void installNetworkHooks() {
        Backend backend = emulator.getBackend();
        final int RET_INSN = 0xd65f03c0;

        // 1. Hook CSocketThread::Start (0x2cc038) -> set [this+0xe0]=1, [this+0xe4]=1, return 1
        patchInsn(0x2cc038, RET_INSN);
        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long thiz = b.reg_read(Arm64Const.UC_ARM64_REG_X0).longValue();
                byte[] one = ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(1).array();
                b.mem_write(thiz + 0xe0, one);
                b.mem_write(thiz + 0xe4, one);
                b.reg_write(Arm64Const.UC_ARM64_REG_X0, 1L);
                System.out.println("[Hook] CSocketThread::Start(0x" + Long.toHexString(thiz) + ") => 1 (synchronous mode)");
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x2cc038, module.base + 0x2cc038, null);

        // 2. Hook pthread_create PLT (0x401e00) -> return 0 (success)
        patchInsn(0x401e00, RET_INSN);
        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long ctx = b.reg_read(Arm64Const.UC_ARM64_REG_X3).longValue();
                String name = "";
                if (ctx != 0) {
                    byte[] raw = b.mem_read(ctx + 0x10, 48);
                    int len = 0;
                    while (len < raw.length && raw[len] != 0) len++;
                    name = new String(raw, 0, len, StandardCharsets.UTF_8);
                }
                System.out.println("[Hook] pthread_create(name=" + name + ") => 0 (synchronous mode)");
                b.reg_write(Arm64Const.UC_ARM64_REG_X0, 0L);
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x401e00, module.base + 0x401e00, null);

        // 3. Hook inside CSocketThread::ConnectSocket at 0x2cc470 -> jump to 0x2cc764 (B +0x2f4 = 0x140000bd)
        patchInsn(0x2cc470, 0x140000bd);
        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long thiz = b.reg_read(Arm64Const.UC_ARM64_REG_X19).longValue();
                long addrPtr = b.reg_read(Arm64Const.UC_ARM64_REG_X20).longValue();
                String addrStr = readUtf16Le(b, addrPtr, 128);
                System.out.println("[Socket] ConnectSocket address=\"" + addrStr + "\"");
                String host = addrStr;
                int port = 443;
                int colon = addrStr.lastIndexOf(':');
                if (colon > 0) {
                    host = addrStr.substring(0, colon);
                    try {
                        port = Integer.parseInt(addrStr.substring(colon + 1).trim());
                    } catch (NumberFormatException ignored) {}
                }
                try {
                    if (socketChannel != null) {
                        try { socketChannel.close(); } catch (Exception ignored) {}
                    }
                    socketChannel = SocketChannel.open();
                    socketChannel.configureBlocking(true);
                    socketChannel.socket().setReceiveBufferSize(4 * 1024 * 1024);
                    socketChannel.socket().setSendBufferSize(1024 * 1024);
                    socketChannel.socket().setTcpNoDelay(true);
                    socketChannel.socket().setSoTimeout(10000);
                    socketChannel.connect(new InetSocketAddress(host, port));
                    socketChannel.configureBlocking(false);
                    byte[] fdBytes = ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(VIRTUAL_SOCKET_FD).array();
                    b.mem_write(thiz + 0x140, fdBytes);
                    System.out.println("[Socket] Connected TCP to " + host + ":" + port + " (fd=" + VIRTUAL_SOCKET_FD + ")");
                } catch (Exception e) {
                    System.out.println("[Socket] Connect failed: " + e);
                }
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x2cc470, module.base + 0x2cc470, null);

        // 4. Hook setsockopt (0x402530), fcntl (0x402540), freeaddrinfo (0x402590), shutdown (0x402510)
        for (long pltOff : new long[]{0x402530, 0x402540, 0x402590, 0x402510}) {
            final long off = pltOff;
            patchInsn(off, RET_INSN);
            backend.hook_add_new(new CodeHook() {
                @Override
                public void hook(Backend b, long address, int size, Object user) {
                    if (off == 0x402510) {
                        int fd = b.reg_read(Arm64Const.UC_ARM64_REG_X0).intValue();
                        System.out.println("[Socket] shutdown(fd=" + fd + ")");
                        if (socketChannel != null) {
                            try { socketChannel.close(); } catch (Exception ignored) {}
                            socketChannel = null;
                        }
                    }
                    b.reg_write(Arm64Const.UC_ARM64_REG_X0, 0L);
                }
                @Override public void onAttach(UnHook unHook) {}
                @Override public void detach() {}
            }, module.base + off, module.base + off, null);
        }

        // 5. Hook sendto (0x4025b0)
        patchInsn(0x4025b0, RET_INSN);
        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                int fd = b.reg_read(Arm64Const.UC_ARM64_REG_X0).intValue();
                long buf = b.reg_read(Arm64Const.UC_ARM64_REG_X1).longValue();
                int len = b.reg_read(Arm64Const.UC_ARM64_REG_X2).intValue();
                if (socketChannel == null || !socketChannel.isOpen()) {
                    emulator.getMemory().setErrno(32); // EPIPE
                    b.reg_write(Arm64Const.UC_ARM64_REG_X0, -1L);
                    return;
                }
                try {
                    byte[] data = b.mem_read(buf, len);
                    ByteBuffer bb = ByteBuffer.wrap(data);
                    int total = 0;
                    while (bb.hasRemaining()) {
                        int w = socketChannel.write(bb);
                        if (w <= 0) break;
                        total += w;
                    }
                    System.out.println("[Socket] sendto(fd=" + fd + ", len=" + len + ") => " + total);
                    b.reg_write(Arm64Const.UC_ARM64_REG_X0, (long) total);
                } catch (Exception e) {
                    System.out.println("[Socket] sendto error: " + e);
                    emulator.getMemory().setErrno(5); // EIO
                    b.reg_write(Arm64Const.UC_ARM64_REG_X0, -1L);
                }
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x4025b0, module.base + 0x4025b0, null);

        // 6. Hook recvfrom (0x4025c0)
        patchInsn(0x4025c0, RET_INSN);
        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                int fd = b.reg_read(Arm64Const.UC_ARM64_REG_X0).intValue();
                long buf = b.reg_read(Arm64Const.UC_ARM64_REG_X1).longValue();
                int len = b.reg_read(Arm64Const.UC_ARM64_REG_X2).intValue();
                if (socketChannel == null || !socketChannel.isOpen()) {
                    b.reg_write(Arm64Const.UC_ARM64_REG_X0, 0L);
                    return;
                }
                try {
                    if (len == 9) {
                        packetsInCurrentReadCall++;
                        if (packetsInCurrentReadCall > 32) {
                            emulator.getMemory().setErrno(11); // EAGAIN
                            b.reg_write(Arm64Const.UC_ARM64_REG_X0, -1L);
                            return;
                        }
                    }
                    ByteBuffer bb = ByteBuffer.allocate(len);
                    int n = socketChannel.read(bb);
                    if (n == 0) {
                        int maxWait = (len > 9) ? 50 : (packetsInCurrentReadCall <= 1 ? 5 : 0);
                        for (int wait = 0; wait < maxWait && n == 0; wait++) {
                            try { Thread.sleep(10); } catch (InterruptedException ignored) {}
                            n = socketChannel.read(bb);
                        }
                    }
                    if (n > 0) {
                        lastRecvBytes += n;
                        byte[] data = Arrays.copyOf(bb.array(), n);
                        b.mem_write(buf, data);
                        b.reg_write(Arm64Const.UC_ARM64_REG_X0, (long) n);
                    } else if (n == 0) {
                        emulator.getMemory().setErrno(11); // EAGAIN
                        b.reg_write(Arm64Const.UC_ARM64_REG_X0, -1L);
                    } else {
                        System.out.println("[Socket] recvfrom EOF");
                        b.reg_write(Arm64Const.UC_ARM64_REG_X0, 0L);
                    }
                } catch (Exception e) {
                    System.out.println("[Socket] recvfrom error: " + e);
                    emulator.getMemory().setErrno(11);
                    b.reg_write(Arm64Const.UC_ARM64_REG_X0, -1L);
                }
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x4025c0, module.base + 0x4025c0, null);

        // 7. Hook pthread_cond_wait (0x401d80) -> exit CTradesBase::HistoryWorkerThread loop cleanly
        patchInsn(0x401d80, RET_INSN);
        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long x19 = b.reg_read(Arm64Const.UC_ARM64_REG_X19).longValue();
                long lr = b.reg_read(Arm64Const.UC_ARM64_REG_LR).longValue() - module.base;
                if (lr == 0x1d4d88) {
                    b.mem_write(x19 + 0x7a18, new byte[]{0});
                }
                b.reg_write(Arm64Const.UC_ARM64_REG_X0, 0L);
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x401d80, module.base + 0x401d80, null);

        // 8. Trace CSocketThread::OnPacketReceived (0x2cd4dc), SetHeader (0x2e3b90), and CTerminal::OnNetworkPacket (0x31deec)
        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long pkt = b.reg_read(Arm64Const.UC_ARM64_REG_X0).longValue();
                int cmd = b.reg_read(Arm64Const.UC_ARM64_REG_X1).intValue() & 0xff;
                int seq = b.reg_read(Arm64Const.UC_ARM64_REG_X2).intValue() & 0xffff;
                int flg = b.reg_read(Arm64Const.UC_ARM64_REG_X3).intValue() & 0xffff;
                int len = pkt != 0 ? emulator.getMemory().pointer(pkt + 0x10).getInt(0) : -1;
                System.out.printf("[PktSend] SetHeader pkt=0x%x cmd=0x%02x len=%d seq=%d flags=0x%04x%n",
                        pkt, cmd, len, seq, flg);
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x2e3b90, module.base + 0x2e3b90, null);

        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long pkt = b.reg_read(Arm64Const.UC_ARM64_REG_X1).longValue();
                if (pkt != 0) {
                    long bufPtr = emulator.getMemory().pointer(pkt + 0x8).getLong(0);
                    int cap = emulator.getMemory().pointer(pkt + 0x10).getInt(0);
                    int len = emulator.getMemory().pointer(pkt + 0x18).getInt(0);
                    int cmd = -1;
                    int seq = -1;
                    int flags = -1;
                    int rawSz = -1;
                    int cmpSz = -1;
                    if (bufPtr != 0 && len >= 9) {
                        byte[] hdr = b.mem_read(bufPtr, Math.min(len, 17));
                        cmd = hdr[0] & 0xff;
                        seq = ((hdr[5] & 0xff) | ((hdr[6] & 0xff) << 8));
                        flags = ((hdr[7] & 0xff) | ((hdr[8] & 0xff) << 8));
                        if (hdr.length >= 17) {
                            ByteBuffer bb = ByteBuffer.wrap(hdr, 9, 8).order(ByteOrder.LITTLE_ENDIAN);
                            rawSz = bb.getInt();
                            cmpSz = bb.getInt();
                        }
                    }
                    if (cmd != 0x32 && cmd != 0x33) {
                        System.out.printf("[PktRecv] OnPacketReceived pkt=0x%x cmd=0x%02x len=%d cap=%d seq=%d flags=0x%04x rawSz=%d cmpSz=%d%n",
                                pkt, cmd, len, cap, seq, flags, rawSz, cmpSz);
                    }
                }
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x2cd4dc, module.base + 0x2cd4dc, null);

        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long sp = b.reg_read(Arm64Const.UC_ARM64_REG_SP).longValue();
                int tag = b.mem_read(sp + 0x10, 1)[0] & 0xff;
                System.out.printf("[OnSyncPacket] section tag=0x%02x (%d)%n", tag, tag);
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x31e2c8, module.base + 0x31e2c8, null);

        // 9. Hook __android_log_print (0x401ff0) and native logger (0x15bcc4)
        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long tagPtr = b.reg_read(Arm64Const.UC_ARM64_REG_X1).longValue();
                long fmtPtr = b.reg_read(Arm64Const.UC_ARM64_REG_X2).longValue();
                System.out.println("[AndroidLog] tag=" + readAscii(b, tagPtr, 64) + " msg=" + readAscii(b, fmtPtr, 128));
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x401ff0, module.base + 0x401ff0, null);

        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long catPtr = b.reg_read(Arm64Const.UC_ARM64_REG_X1).longValue();
                long fmtPtr = b.reg_read(Arm64Const.UC_ARM64_REG_X2).longValue();
                System.out.println("[NativeLog] cat=" + readAscii(b, catPtr, 64) + " fmt=" + readAscii(b, fmtPtr, 128));
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x15bcc4, module.base + 0x15bcc4, null);

        // Hook CJournal::Log (0x2dedd4) directly so wchar_t format strings never crash inside bionic vsnprintf
        patchInsn(0x2dedd4, RET_INSN);
        backend.hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long catPtr = b.reg_read(Arm64Const.UC_ARM64_REG_X1).longValue();
                long fmtPtr = b.reg_read(Arm64Const.UC_ARM64_REG_X2).longValue();
                long x3 = b.reg_read(Arm64Const.UC_ARM64_REG_X3).longValue();
                long lr = b.reg_read(Arm64Const.UC_ARM64_REG_LR).longValue() - module.base;
                System.out.printf("[JournalLog@0x%x] cat=%s fmt=%s x3=0x%x%n",
                        lr, readAscii(b, catPtr, 64), readAscii(b, fmtPtr, 128), x3);
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x2dedd4, module.base + 0x2dedd4, null);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fieldsOf(DvmObject<?> obj) {
        if (obj != null && obj.getValue() instanceof Map) {
            return (Map<String, Object>) obj.getValue();
        }
        return fieldStore.computeIfAbsent(obj, k -> new LinkedHashMap<>());
    }

    public Mt5NativeRunner(File apkFile, File workDir) {
        this.workDir = workDir;
        File androidFilesHost = new File(workDir, "rootfs" + ANDROID_FILES_DIR);
        new File(androidFilesHost, "logs").mkdirs();
        new File(androidFilesHost, "config").mkdirs();
        new File(androidFilesHost, "preferences").mkdirs();
        new File(androidFilesHost, "bases").mkdirs();

        this.emulator = AndroidEmulatorBuilder.for64Bit()
                .setProcessName("net.metaquotes.metatrader5")
                .setRootDir(new File(workDir, "rootfs"))
                .build();
        this.emulator.getSyscallHandler().setVerbose(false);
        this.emulator.getSyscallHandler().setEnableThreadDispatcher(false);

        Memory memory = this.emulator.getMemory();
        memory.setLibraryResolver(new AndroidResolver(23));

        this.vm = this.emulator.createDalvikVM(apkFile);
        this.vm.setJni(this);
        this.vm.setVerbose(false);
        fixJniGetStringRegion();

        new AndroidModule(this.emulator, this.vm).register(memory);
        new JniGraphics(this.emulator, this.vm).register(memory);

        DalvikModule dm = this.vm.loadLibrary("common", true);
        this.module = dm.getModule();
        System.out.println("[Unidbg] Loaded libcommon.so at base=0x" + Long.toHexString(module.base));

        dm.callJNI_OnLoad(this.emulator);
        System.out.println("[Unidbg] Called JNI_OnLoad successfully");
        installNetworkHooks();
    }

    @Override
    public DvmObject<?> getStaticObjectField(BaseVM vm, DvmClass dvmClass, String signature) {
        if (staticFieldStore.containsKey(signature)) {
            return (DvmObject<?>) staticFieldStore.get(signature);
        }
        switch (signature) {
            case "net/metaquotes/tools/Journal->_sLogPath:Ljava/lang/String;":
                return new StringObject(vm, ANDROID_FILES_DIR + "/logs");
            case "net/metaquotes/tools/Journal->_sBanner:Ljava/lang/String;":
                return new StringObject(vm, "MetaTrader 5 Android 5.0.4670");
            case "android/os/Build->MANUFACTURER:Ljava/lang/String;":
                return new StringObject(vm, "Samsung");
            case "android/os/Build->MODEL:Ljava/lang/String;":
                return new StringObject(vm, "SM-S918B");
            case "android/os/Build->BRAND:Ljava/lang/String;":
                return new StringObject(vm, "samsung");
            case "android/os/Build->DEVICE:Ljava/lang/String;":
                return new StringObject(vm, "dm3q");
            case "android/os/Build->PRODUCT:Ljava/lang/String;":
                return new StringObject(vm, "dm3qxxx");
            case "android/os/Build->HARDWARE:Ljava/lang/String;":
                return new StringObject(vm, "qcom");
            case "android/os/Build->ID:Ljava/lang/String;":
                return new StringObject(vm, "UP1A.231005.007");
            case "android/os/Build->FINGERPRINT:Ljava/lang/String;":
                return new StringObject(vm, "samsung/dm3qxxx/dm3q:14/UP1A.231005.007/S918BXXS3BWK5:user/release-keys");
            case "android/os/Build$VERSION->RELEASE:Ljava/lang/String;":
                return new StringObject(vm, "14");
            case "android/provider/Settings$Secure->ANDROID_ID:Ljava/lang/String;":
                return new StringObject(vm, "android_id");
            case "android/content/Context->TELEPHONY_SERVICE:Ljava/lang/String;":
                return new StringObject(vm, "phone");
            case "android/content/Context->WIFI_SERVICE:Ljava/lang/String;":
                return new StringObject(vm, "wifi");
            case "android/content/Context->CONNECTIVITY_SERVICE:Ljava/lang/String;":
                return new StringObject(vm, "connectivity");
        }
        try {
            return super.getStaticObjectField(vm, dvmClass, signature);
        } catch (UnsupportedOperationException e) {
            System.out.println("[JNI] getStaticObjectField: " + signature);
            if (signature.endsWith(":Ljava/lang/String;")) {
                String fieldName = signature.substring(signature.indexOf("->") + 2, signature.indexOf(":"));
                return new StringObject(vm, fieldName.toLowerCase());
            }
            return null;
        }
    }

    @Override
    public int getStaticIntField(BaseVM vm, DvmClass dvmClass, String signature) {
        if (signature.equals("android/os/Build$VERSION->SDK_INT:I")) {
            return 34;
        }
        try {
            return super.getStaticIntField(vm, dvmClass, signature);
        } catch (UnsupportedOperationException e) {
            System.out.println("[JNI] getStaticIntField: " + signature);
            return 0;
        }
    }

    @Override
    public void setObjectField(BaseVM vm, DvmObject<?> dvmObject, String signature, DvmObject<?> value) {
        fieldsOf(dvmObject).put(signature, value);
    }

    @Override
    public DvmObject<?> getObjectField(BaseVM vm, DvmObject<?> dvmObject, String signature) {
        Map<String, Object> m = fieldsOf(dvmObject);
        if (m.containsKey(signature)) {
            return (DvmObject<?>) m.get(signature);
        }
        if (signature.equals("android/content/pm/PackageInfo->applicationInfo:Landroid/content/pm/ApplicationInfo;")) {
            return vm.resolveClass("android/content/pm/ApplicationInfo").newObject(null);
        }
        if (signature.equals("android/content/pm/ApplicationInfo->sourceDir:Ljava/lang/String;") ||
            signature.equals("android/content/pm/ApplicationInfo->publicSourceDir:Ljava/lang/String;")) {
            return new StringObject(vm, "/data/app/net.metaquotes.metatrader5-1/base.apk");
        }
        if (signature.equals("android/content/pm/ApplicationInfo->dataDir:Ljava/lang/String;")) {
            return new StringObject(vm, "/data/user/0/net.metaquotes.metatrader5");
        }
        if (signature.equals("android/content/pm/ApplicationInfo->nativeLibraryDir:Ljava/lang/String;")) {
            return new StringObject(vm, "/data/app/net.metaquotes.metatrader5-1/lib/arm64");
        }
        if (signature.equals("android/content/pm/ApplicationInfo->packageName:Ljava/lang/String;")) {
            return new StringObject(vm, "net.metaquotes.metatrader5");
        }
        try {
            return super.getObjectField(vm, dvmObject, signature);
        } catch (UnsupportedOperationException e) {
            System.out.println("[JNI] getObjectField: " + signature);
            if (signature.endsWith(":Ljava/lang/String;")) {
                return new StringObject(vm, "");
            }
            return null;
        }
    }

    @Override
    public void setIntField(BaseVM vm, DvmObject<?> dvmObject, String signature, int value) {
        fieldsOf(dvmObject).put(signature, value);
    }

    @Override
    public int getIntField(BaseVM vm, DvmObject<?> dvmObject, String signature) {
        Object v = fieldsOf(dvmObject).get(signature);
        if (v instanceof Number) return ((Number) v).intValue();
        try {
            return super.getIntField(vm, dvmObject, signature);
        } catch (UnsupportedOperationException e) {
            return 0;
        }
    }

    @Override
    public void setLongField(BaseVM vm, DvmObject<?> dvmObject, String signature, long value) {
        fieldsOf(dvmObject).put(signature, value);
    }

    @Override
    public long getLongField(BaseVM vm, DvmObject<?> dvmObject, String signature) {
        Object v = fieldsOf(dvmObject).get(signature);
        if (v instanceof Number) return ((Number) v).longValue();
        try {
            return super.getLongField(vm, dvmObject, signature);
        } catch (UnsupportedOperationException e) {
            return 0L;
        }
    }

    @Override
    public void setDoubleField(BaseVM vm, DvmObject<?> dvmObject, String signature, double value) {
        fieldsOf(dvmObject).put(signature, value);
    }

    @Override
    public void setFloatField(BaseVM vm, DvmObject<?> dvmObject, String signature, float value) {
        fieldsOf(dvmObject).put(signature, value);
    }

    public double getDoubleField(BaseVM vm, DvmObject<?> dvmObject, String signature) {
        Object v = fieldsOf(dvmObject).get(signature);
        return v instanceof Number ? ((Number) v).doubleValue() : 0.0;
    }

    @Override
    public void setBooleanField(BaseVM vm, DvmObject<?> dvmObject, String signature, boolean value) {
        fieldsOf(dvmObject).put(signature, value);
    }

    @Override
    public boolean getBooleanField(BaseVM vm, DvmObject<?> dvmObject, String signature) {
        Object v = fieldsOf(dvmObject).get(signature);
        if (v instanceof Boolean) return (Boolean) v;
        try {
            return super.getBooleanField(vm, dvmObject, signature);
        } catch (UnsupportedOperationException e) {
            return false;
        }
    }

    public void setByteField(BaseVM vm, DvmObject<?> dvmObject, String signature, byte value) {
        fieldsOf(dvmObject).put(signature, value);
    }

    public byte getByteField(BaseVM vm, DvmObject<?> dvmObject, String signature) {
        Object v = fieldsOf(dvmObject).get(signature);
        return v instanceof Number ? ((Number) v).byteValue() : 0;
    }

    @Override
    public DvmObject<?> newObjectV(BaseVM vm, DvmClass dvmClass, String signature, VaList vaList) {
        if (signature.equals("java/util/ArrayList-><init>()V")) {
            return dvmClass.newObject(new ArrayList<DvmObject<?>>());
        }
        if (signature.equals("net/metaquotes/dns/DNSEntry-><init>(Ljava/lang/String;Ljava/lang/String;I)V")) {
            String a = String.valueOf(vaList.getObjectArg(0).getValue());
            String b = String.valueOf(vaList.getObjectArg(1).getValue());
            int c = vaList.getIntArg(2);
            System.out.println("[DNSEntry] a=" + a + " b=" + b + " c=" + c);
            return dvmClass.newObject(a + "|" + b + "|" + c);
        }
        if (signature.equals("java/lang/Long-><init>(J)V")) {
            return dvmClass.newObject(vaList.getLongArg(0));
        }
        if (signature.equals("net/metaquotes/metatrader5/types/HistoryPosition-><init>(JLjava/lang/String;IIJJDIJJDDDDDDDIILjava/lang/String;)V")) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", vaList.getLongArg(0));
            DvmObject<?> symObj = vaList.getObjectArg(1);
            m.put("symbol", symObj != null ? String.valueOf(symObj.getValue()) : "");
            m.put("type", vaList.getIntArg(2));
            m.put("openReason", vaList.getIntArg(3));
            m.put("openVolume", vaList.getLongArg(4));
            m.put("openTime", vaList.getLongArg(5));
            m.put("openPrice", vaList.getDoubleArg(6));
            m.put("closeReason", vaList.getIntArg(7));
            m.put("closeVolume", vaList.getLongArg(8));
            m.put("closeTime", vaList.getLongArg(9));
            m.put("closePrice", vaList.getDoubleArg(10));
            m.put("commission", vaList.getDoubleArg(11));
            m.put("commissionFee", vaList.getDoubleArg(12));
            m.put("storage", vaList.getDoubleArg(13));
            m.put("profit", vaList.getDoubleArg(14));
            m.put("sl", vaList.getDoubleArg(15));
            m.put("tp", vaList.getDoubleArg(16));
            m.put("digits", vaList.getIntArg(17));
            m.put("digitsCurrency", vaList.getIntArg(18));
            DvmObject<?> cmtObj = vaList.getObjectArg(19);
            m.put("comment", cmtObj != null ? String.valueOf(cmtObj.getValue()) : "");
            return dvmClass.newObject(m);
        }
        if (signature.equals("net/metaquotes/metatrader5/types/TradeDeal-><init>(Ljava/lang/String;Ljava/lang/String;JBBDDJDIDDJLjava/lang/String;JJDDIZZ)V")) {
            Map<String, Object> m = new LinkedHashMap<>();
            DvmObject<?> symObj = vaList.getObjectArg(0);
            DvmObject<?> extObj = vaList.getObjectArg(1);
            m.put("symbol", symObj != null ? String.valueOf(symObj.getValue()) : "");
            m.put("externalId", extObj != null ? String.valueOf(extObj.getValue()) : "");
            m.put("positionId", vaList.getLongArg(2));
            m.put("digits", vaList.getIntArg(3));
            m.put("digitsCurrency", vaList.getIntArg(4));
            m.put("tradeTickSize", vaList.getDoubleArg(5));
            m.put("point", vaList.getDoubleArg(6));
            m.put("volume", vaList.getLongArg(7));
            m.put("priceOpen", vaList.getDoubleArg(8));
            m.put("action", vaList.getIntArg(9));
            m.put("sl", vaList.getDoubleArg(10));
            m.put("tp", vaList.getDoubleArg(11));
            m.put("date", vaList.getLongArg(12));
            DvmObject<?> cmtObj = vaList.getObjectArg(13);
            m.put("comment", cmtObj != null ? String.valueOf(cmtObj.getValue()) : "");
            m.put("order", vaList.getLongArg(14));
            m.put("deal", vaList.getLongArg(15));
            m.put("commission", vaList.getDoubleArg(16));
            m.put("commissionFee", vaList.getDoubleArg(17));
            m.put("entry", vaList.getIntArg(18));
            m.put("canModify", vaList.getIntArg(19) != 0);
            m.put("canTrade", vaList.getIntArg(20) != 0);
            return dvmClass.newObject(m);
        }
        if (signature.equals("net/metaquotes/metatrader5/types/TradePosition-><init>(Ljava/lang/String;JBBDDJDIDDJLjava/lang/String;ZZLjava/lang/String;)V")) {
            Map<String, Object> m = new LinkedHashMap<>();
            DvmObject<?> symObj = vaList.getObjectArg(0);
            m.put("symbol", symObj != null ? String.valueOf(symObj.getValue()) : "");
            m.put("id", vaList.getLongArg(1));
            m.put("digits", vaList.getIntArg(2));
            m.put("digitsCurrency", vaList.getIntArg(3));
            m.put("tradeTickSize", vaList.getDoubleArg(4));
            m.put("point", vaList.getDoubleArg(5));
            m.put("volume", vaList.getLongArg(6));
            m.put("priceOpen", vaList.getDoubleArg(7));
            m.put("action", vaList.getIntArg(8));
            m.put("sl", vaList.getDoubleArg(9));
            m.put("tp", vaList.getDoubleArg(10));
            m.put("date", vaList.getLongArg(11));
            DvmObject<?> cmtObj = vaList.getObjectArg(12);
            m.put("comment", cmtObj != null ? String.valueOf(cmtObj.getValue()) : "");
            m.put("canModify", vaList.getIntArg(13) != 0);
            m.put("canTrade", vaList.getIntArg(14) != 0);
            DvmObject<?> extObj = vaList.getObjectArg(15);
            m.put("externalId", extObj != null ? String.valueOf(extObj.getValue()) : "");
            return dvmClass.newObject(m);
        }
        try {
            return super.newObjectV(vm, dvmClass, signature, vaList);
        } catch (UnsupportedOperationException e) {
            System.out.println("[JNI] newObjectV: " + signature);
            return dvmClass.newObject(new LinkedHashMap<String, Object>());
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    public boolean callBooleanMethodV(BaseVM vm, DvmObject<?> dvmObject, String signature, VaList vaList) {
        if (signature.equals("java/util/List->add(Ljava/lang/Object;)Z") ||
            signature.equals("java/util/ArrayList->add(Ljava/lang/Object;)Z")) {
            List<DvmObject<?>> list = (List<DvmObject<?>>) dvmObject.getValue();
            list.add(vaList.getObjectArg(0));
            return true;
        }
        try {
            return super.callBooleanMethodV(vm, dvmObject, signature, vaList);
        } catch (UnsupportedOperationException e) {
            System.out.println("[JNI] callBooleanMethodV: " + signature);
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    public int callIntMethodV(BaseVM vm, DvmObject<?> dvmObject, String signature, VaList vaList) {
        if (signature.equals("java/util/List->size()I") ||
            signature.equals("java/util/ArrayList->size()I")) {
            List<DvmObject<?>> list = (List<DvmObject<?>>) dvmObject.getValue();
            return list.size();
        }
        try {
            return super.callIntMethodV(vm, dvmObject, signature, vaList);
        } catch (UnsupportedOperationException e) {
            System.out.println("[JNI] callIntMethodV: " + signature);
            return 0;
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    public DvmObject<?> callObjectMethodV(BaseVM vm, DvmObject<?> dvmObject, String signature, VaList vaList) {
        if (signature.equals("java/util/List->get(I)Ljava/lang/Object;") ||
            signature.equals("java/util/ArrayList->get(I)Ljava/lang/Object;")) {
            List<DvmObject<?>> list = (List<DvmObject<?>>) dvmObject.getValue();
            return list.get(vaList.getIntArg(0));
        }
        if (signature.equals("android/content/Context->getFilesDir()Ljava/io/File;")) {
            return vm.resolveClass("java/io/File").newObject(ANDROID_FILES_DIR);
        }
        if (signature.equals("java/io/File->getAbsolutePath()Ljava/lang/String;") ||
            signature.equals("java/io/File->getPath()Ljava/lang/String;")) {
            return new StringObject(vm, String.valueOf(dvmObject.getValue()));
        }
        if (signature.equals("android/content/Context->getPackageName()Ljava/lang/String;")) {
            return new StringObject(vm, "net.metaquotes.metatrader5");
        }
        if (signature.equals("android/content/Context->getContentResolver()Landroid/content/ContentResolver;")) {
            return vm.resolveClass("android/content/ContentResolver").newObject(null);
        }
        if (signature.equals("android/content/Context->getSystemService(Ljava/lang/String;)Ljava/lang/Object;")) {
            String svc = String.valueOf(vaList.getObjectArg(0).getValue());
            if ("phone".equalsIgnoreCase(svc) || "telephony_service".equalsIgnoreCase(svc)) {
                return vm.resolveClass("android/telephony/TelephonyManager").newObject(null);
            }
            return vm.resolveClass("java/lang/Object").newObject(svc);
        }
        if (signature.equals("android/content/Context->getClassLoader()Ljava/lang/ClassLoader;")) {
            return vm.resolveClass("java/lang/ClassLoader").newObject(null);
        }
        if (signature.equals("java/lang/ClassLoader->loadClass(Ljava/lang/String;)Ljava/lang/Class;") ||
            signature.equals("java/lang/ClassLoader->findClass(Ljava/lang/String;)Ljava/lang/Class;")) {
            String clsName = String.valueOf(vaList.getObjectArg(0).getValue()).replace('.', '/');
            return vm.resolveClass(clsName);
        }
        if (signature.equals("android/telephony/TelephonyManager->getDeviceId()Ljava/lang/String;")) {
            return new StringObject(vm, "358240051111110");
        }
        if (signature.equals("java/security/MessageDigest->digest()[B")) {
            try {
                java.security.MessageDigest md = (java.security.MessageDigest) dvmObject.getValue();
                return new ByteArray(vm, md.digest());
            } catch (Exception e) {
                return new ByteArray(vm, new byte[20]);
            }
        }
        try {
            return super.callObjectMethodV(vm, dvmObject, signature, vaList);
        } catch (UnsupportedOperationException e) {
            long lr = emulator.getBackend().reg_read(Arm64Const.UC_ARM64_REG_LR).longValue() - module.base;
            System.out.printf("[JNI] callObjectMethodV: %s (LR=0x%x)%n", signature, lr);
            if (signature.endsWith(")Ljava/lang/String;")) {
                return new StringObject(vm, "");
            }
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    public void callVoidMethodV(BaseVM vm, DvmObject<?> dvmObject, String signature, VaList vaList) {
        if (signature.equals("java/util/List->clear()V") ||
            signature.equals("java/util/ArrayList->clear()V")) {
            List<DvmObject<?>> list = (List<DvmObject<?>>) dvmObject.getValue();
            list.clear();
            return;
        }
        if (signature.equals("java/util/List->add(ILjava/lang/Object;)V") ||
            signature.equals("java/util/ArrayList->add(ILjava/lang/Object;)V")) {
            List<DvmObject<?>> list = (List<DvmObject<?>>) dvmObject.getValue();
            list.add(vaList.getIntArg(0), vaList.getObjectArg(1));
            return;
        }
        if (signature.equals("java/security/MessageDigest->update([B)V")) {
            try {
                java.security.MessageDigest md = (java.security.MessageDigest) dvmObject.getValue();
                ByteArray arr = vaList.getObjectArg(0);
                md.update(arr.getValue());
            } catch (Exception ignored) {}
            return;
        }
        if (signature.equals("net/metaquotes/metatrader5/types/TradeDeal->update(DDD)V")) {
            Map<String, Object> m = fieldsOf(dvmObject);
            m.put("priceClose", vaList.getDoubleArg(0));
            m.put("profit", vaList.getDoubleArg(1));
            m.put("swap", vaList.getDoubleArg(2));
            return;
        }
        if (signature.equals("net/metaquotes/metatrader5/types/TradePosition->update(DDDJ)V")) {
            Map<String, Object> m = fieldsOf(dvmObject);
            m.put("priceClose", vaList.getDoubleArg(0));
            m.put("profit", vaList.getDoubleArg(1));
            m.put("swap", vaList.getDoubleArg(2));
            m.put("volume", vaList.getLongArg(3));
            return;
        }
        if (signature.equals("net/metaquotes/metatrader5/types/PositionViewInfo->update(DDDDDDDDDI)V")) {
            Map<String, Object> m = fieldsOf(dvmObject);
            m.put("balance", vaList.getDoubleArg(0));
            m.put("profit", vaList.getDoubleArg(1));
            m.put("swap", vaList.getDoubleArg(2));
            m.put("commission", vaList.getDoubleArg(3));
            m.put("commissionFee", vaList.getDoubleArg(4));
            m.put("buysell", vaList.getDoubleArg(5));
            m.put("credit", vaList.getDoubleArg(6));
            m.put("deposit", vaList.getDoubleArg(7));
            m.put("withdrawal", vaList.getDoubleArg(8));
            m.put("digitsCurrency", vaList.getIntArg(9));
            return;
        }
        if (signature.equals("net/metaquotes/metatrader5/types/TradeInfoRecord->update(IDDDDDDDDDDDDDDZ)V")) {
            Map<String, Object> m = fieldsOf(dvmObject);
            m.put("digits", vaList.getIntArg(0));
            m.put("balance", vaList.getDoubleArg(1));
            m.put("credit", vaList.getDoubleArg(2));
            m.put("margin", vaList.getDoubleArg(3));
            m.put("marginFree", vaList.getDoubleArg(4));
            m.put("marginLevel", vaList.getDoubleArg(5));
            m.put("profit", vaList.getDoubleArg(6));
            m.put("equity", vaList.getDoubleArg(7));
            m.put("commission", vaList.getDoubleArg(8));
            m.put("blocked", vaList.getDoubleArg(9));
            m.put("marginMaintenance", vaList.getDoubleArg(10));
            m.put("marginInitial", vaList.getDoubleArg(11));
            m.put("collateral", vaList.getDoubleArg(12));
            m.put("assets", vaList.getDoubleArg(13));
            m.put("liabilities", vaList.getDoubleArg(14));
            m.put("hasMarginCall", vaList.getIntArg(15) != 0);
            return;
        }
        try {
            super.callVoidMethodV(vm, dvmObject, signature, vaList);
        } catch (UnsupportedOperationException e) {
            System.out.println("[JNI] callVoidMethodV: " + signature);
        }
    }

    @Override
    public boolean callStaticBooleanMethodV(BaseVM vm, DvmClass dvmClass, String signature, VaList vaList) {
        if (signature.equals("net/metaquotes/ui/Publisher->pumpMessage(IIILjava/lang/Object;)Z")) {
            return true;
        }
        try {
            return super.callStaticBooleanMethodV(vm, dvmClass, signature, vaList);
        } catch (UnsupportedOperationException e) {
            System.out.println("[JNI] callStaticBooleanMethodV: " + signature);
            return true;
        }
    }

    @Override
    public int callStaticIntMethodV(BaseVM vm, DvmClass dvmClass, String signature, VaList vaList) {
        try {
            return super.callStaticIntMethodV(vm, dvmClass, signature, vaList);
        } catch (UnsupportedOperationException e) {
            System.out.println("[JNI] callStaticIntMethodV: " + signature);
            return 0;
        }
    }

    @Override
    public void callStaticVoidMethodV(BaseVM vm, DvmClass dvmClass, String signature, VaList vaList) {
        try {
            super.callStaticVoidMethodV(vm, dvmClass, signature, vaList);
        } catch (UnsupportedOperationException e) {
            System.out.println("[JNI] callStaticVoidMethodV: " + signature);
        }
    }

    @Override
    public DvmObject<?> callStaticObjectMethodV(BaseVM vm, DvmClass dvmClass, String signature, VaList vaList) {
        if (signature.equals("android/provider/Settings$Secure->getString(Landroid/content/ContentResolver;Ljava/lang/String;)Ljava/lang/String;")) {
            return new StringObject(vm, "9774d56d682e549c");
        }
        if (signature.equals("java/util/UUID->randomUUID()Ljava/util/UUID;")) {
            return vm.resolveClass("java/util/UUID").newObject(UUID.fromString("12345678-1234-5678-1234-567812345678"));
        }
        try {
            return super.callStaticObjectMethodV(vm, dvmClass, signature, vaList);
        } catch (UnsupportedOperationException e) {
            System.out.println("[JNI] callStaticObjectMethodV: " + signature);
            if (signature.endsWith(")Ljava/lang/String;")) {
                return new StringObject(vm, "");
            }
            return null;
        }
    }

    private static String toJson(Object val) {
        if (val == null) return "null";
        if (val instanceof Boolean || val instanceof Long || val instanceof Integer || val instanceof Short || val instanceof Byte) {
            return String.valueOf(val);
        }
        if (val instanceof Number) {
            double d = ((Number) val).doubleValue();
            if (Double.isNaN(d) || Double.isInfinite(d)) return "0";
            return String.valueOf(val);
        }
        if (val instanceof String) {
            String s = (String) val;
            StringBuilder sb = new StringBuilder("\"");
            for (int i = 0; i < s.length(); i++) {
                char c = s.charAt(i);
                switch (c) {
                    case '"': sb.append("\\\""); break;
                    case '\\': sb.append("\\\\"); break;
                    case '\b': sb.append("\\b"); break;
                    case '\f': sb.append("\\f"); break;
                    case '\n': sb.append("\\n"); break;
                    case '\r': sb.append("\\r"); break;
                    case '\t': sb.append("\\t"); break;
                    default:
                        if (c < 0x20) {
                            sb.append(String.format("\\u%04x", (int) c));
                        } else {
                            sb.append(c);
                        }
                }
            }
            sb.append("\"");
            return sb.toString();
        }
        if (val instanceof Map) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> entry : ((Map<?, ?>) val).entrySet()) {
                if (!first) sb.append(",");
                first = false;
                sb.append(toJson(String.valueOf(entry.getKey()))).append(":").append(toJson(entry.getValue()));
            }
            sb.append("}");
            return sb.toString();
        }
        if (val instanceof Collection) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object item : (Collection<?>) val) {
                if (!first) sb.append(",");
                first = false;
                sb.append(toJson(item));
            }
            sb.append("]");
            return sb.toString();
        }
        return toJson(String.valueOf(val));
    }

    public void runSync(
            String serverName,
            String companyName,
            String[] accessPointAddrs,
            long login,
            String password,
            long fromMs,
            long toMs
    ) {
        DvmObject<?> context = vm.resolveClass("android/content/Context").newObject(null);

        DvmClass metaTrader5Class = vm.resolveClass("net/metaquotes/metatrader5/MetaTrader5");
        boolean initNative = metaTrader5Class.callStaticJniMethodBoolean(
                emulator,
                "initializeNative(Landroid/content/Context;)Z",
                context
        );
        byte[] hash1 = emulator.getBackend().mem_read(module.base + 0x42335c, 16);
        byte[] hash2 = emulator.getBackend().mem_read(module.base + 0x42336c, 16);
        int aidLen = emulator.getMemory().pointer(module.base + 0x4233e8).getInt(0);
        int serLen = emulator.getMemory().pointer(module.base + 0x423448).getInt(0);
        System.out.println("[Unidbg] MetaTrader5.initializeNative => " + initNative
                + " aidLen=" + aidLen + " serLen=" + serLen
                + " hash1=" + Arrays.toString(hash1)
                + " hash2=" + Arrays.toString(hash2));
        if (!Arrays.equals(hash1, hash2)) {
            System.out.println("[Unidbg] Syncing hash2 (0x42336c) to match hash1 (0x42335c)!");
            emulator.getBackend().mem_write(module.base + 0x42336c, hash1);
        }

        // Hook 0x30f99c (/proc/<pid>/cmdline reader) so package="net.metaquotes.metatrader5" in Tag 0x7f
        patchInsn(0x30f99c, 0xd65f03c0);
        emulator.getBackend().hook_add_new(new CodeHook() {
            @Override
            public void hook(Backend b, long address, int size, Object user) {
                long outBuf = b.reg_read(Arm64Const.UC_ARM64_REG_X0).longValue();
                if (outBuf != 0) {
                    byte[] pkg = "net.metaquotes.metatrader5\0".getBytes(StandardCharsets.UTF_8);
                    b.mem_write(outBuf, pkg);
                }
            }
            @Override public void onAttach(UnHook unHook) {}
            @Override public void detach() {}
        }, module.base + 0x30f99c, module.base + 0x30f99c, null);

        DvmClass terminalClass = vm.resolveClass("net/metaquotes/metatrader5/terminal/Terminal");
        terminalClass.callStaticJniMethod(
                emulator,
                "initialize(Landroid/content/Context;)V",
                context
        );
        System.out.println("[Unidbg] Terminal.initialize completed!");

        DvmObject<?> prefObj = vm.resolveClass("net/metaquotes/metatrader5/terminal/PreferencesBase").newObject(null);
        int prefLoaded = prefObj.callJniMethodInt(
                emulator,
                "preferencesLoad(Ljava/lang/String;)Z",
                new StringObject(vm, ANDROID_FILES_DIR + "/preferences/preferences.dat")
        );
        System.out.println("[Unidbg] PreferencesBase.preferencesLoad => " + (prefLoaded & 0xff));

        DvmClass listClass = vm.resolveClass("java/util/List");
        vm.resolveClass("java/util/ArrayList", listClass);

        DvmObject<?> brokerApiObj = vm.resolveClass("net/metaquotes/brokers/BrokerInfoAPI").newObject(null);
        StringObject apiPath = brokerApiObj.callJniMethodObject(emulator, "b()Ljava/lang/String;");
        StringObject apiQueryServer = brokerApiObj.callJniMethodObject(emulator, "c(Ljava/lang/String;)Ljava/lang/String;", new StringObject(vm, serverName));
        DvmObject<?> dnsPrefsObj = vm.resolveClass("net/metaquotes/dns/DNSPrefs").newObject(null);
        StringObject dnsHost = dnsPrefsObj.callJniMethodObject(emulator, "a()Ljava/lang/String;");
        System.out.println("[BrokerInfoAPI] dnsHost=" + (dnsHost != null ? dnsHost.getValue() : "null")
                + " path=" + (apiPath != null ? apiPath.getValue() : "null")
                + " queryServer=" + (apiQueryServer != null ? apiQueryServer.getValue() : "null"));

        String resolvedCompany = companyName;
        String resolvedWebsite = "www.metaquotes.net";
        String resolvedLogoHash = "49753489EC9EDED255EC6E72CEC59912";
        String[] resolvedAccess = accessPointAddrs;

        if (apiPath != null && apiQueryServer != null) {
            String[] cdnHosts = new String[]{"https://api1.cdnfx.net", "https://api2.cdnfx.net", "https://api3.cdnfx.net"};
            for (String cdnHost : cdnHosts) {
                try {
                    URL url = new URL(cdnHost + apiPath.getValue());
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setConnectTimeout(5000);
                    conn.setReadTimeout(5000);
                    conn.setDoOutput(true);
                    conn.setRequestProperty("User-Agent", "MetaTrader 5 Android");
                    conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                    byte[] postBytes = apiQueryServer.getValue().getBytes(StandardCharsets.UTF_8);
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(postBytes);
                    }
                    if (conn.getResponseCode() == 200) {
                        byte[] respBytes;
                        try (InputStream is = conn.getInputStream()) {
                            respBytes = is.readAllBytes();
                        }
                        String json = new String(respBytes, StandardCharsets.UTF_8);
                        Matcher mComp = Pattern.compile("\"company\"\\s*:\\s*\"([^\"]+)\"").matcher(json);
                        if (mComp.find()) resolvedCompany = mComp.group(1);
                        Matcher mWeb = Pattern.compile("\"website\"\\s*:\\s*\"([^\"]+)\"").matcher(json);
                        if (mWeb.find()) resolvedWebsite = mWeb.group(1);
                        Matcher mLogo = Pattern.compile("\"logoHash\"\\s*:\\s*\"([^\"]+)\"").matcher(json);
                        if (mLogo.find()) resolvedLogoHash = mLogo.group(1);

                        Matcher mAccessBlock = Pattern.compile("\"access\"\\s*:\\s*\\[(.*?)\\]", Pattern.DOTALL).matcher(json);
                        List<String> publicEndpoints = new ArrayList<>();
                        while (mAccessBlock.find()) {
                            String block = mAccessBlock.group(1);
                            Matcher mIp = Pattern.compile("\"([^\"]+)\"").matcher(block);
                            while (mIp.find()) {
                                String ep = mIp.group(1).trim();
                                if (!ep.startsWith("10.") && !ep.startsWith("127.") && !ep.startsWith("192.168.")) {
                                    publicEndpoints.add(ep);
                                }
                            }
                            if (!publicEndpoints.isEmpty()) break;
                        }
                        if (!publicEndpoints.isEmpty()) {
                            resolvedAccess = publicEndpoints.toArray(new String[0]);
                            System.out.println("[BrokerInfoAPI] Discovered live broker \"" + resolvedCompany + "\" access=" + Arrays.toString(resolvedAccess));
                            break;
                        }
                    }
                } catch (Exception e) {
                    System.out.println("[BrokerInfoAPI] CDN lookup warning (" + cdnHost + "): " + e.getMessage());
                }
            }
        }
        companyName = resolvedCompany;
        accessPointAddrs = resolvedAccess;

        File hostConfigDir = new File(workDir, "rootfs" + ANDROID_FILES_DIR + "/config");
        new File(hostConfigDir, "servers.dat").delete();
        new File(hostConfigDir, "accounts.dat").delete();

        DvmObject<?> dnsMgrObj = vm.resolveClass("net/metaquotes/dns/DNSManager").newObject(null);
        boolean dnsInit = dnsMgrObj.callJniMethodBoolean(emulator, "b(Ljava/lang/String;)Z", new StringObject(vm, ANDROID_FILES_DIR + "/config/"));
        System.out.println("[DNSManager] b(config/) => " + dnsInit);

        DvmClass serversBaseClass = vm.resolveClass("net/metaquotes/metatrader5/terminal/ServersBase");
        DvmObject<?> serversBaseObj = serversBaseClass.newObject(null);
        DvmObject<?> prefList = listClass.newObject(new ArrayList<DvmObject<?>>());
        int srvInit = serversBaseClass.callStaticJniMethodInt(
                emulator,
                "initialize(Ljava/lang/String;Ljava/util/List;)I",
                new StringObject(vm, ANDROID_FILES_DIR + "/config/servers.dat"),
                prefList
        );
        System.out.println("[Unidbg] ServersBase.initialize => " + srvInit);

        StringObject[] apObjs = new StringObject[accessPointAddrs.length];
        int[] prioArr = new int[accessPointAddrs.length];
        for (int i = 0; i < accessPointAddrs.length; i++) {
            apObjs[i] = new StringObject(vm, accessPointAddrs[i]);
            prioArr[i] = i;
        }
        ArrayObject accessPoints = new ArrayObject(apObjs);
        IntArray priorities = new IntArray(vm, prioArr);
        int addSrv = serversBaseClass.callStaticJniMethodInt(
                emulator,
                "addServer(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;IIZ[Ljava/lang/String;[I[Ljava/lang/String;[Ljava/lang/String;)Z",
                context,
                new StringObject(vm, companyName),
                new StringObject(vm, resolvedWebsite),
                new StringObject(vm, resolvedLogoHash),
                new StringObject(vm, serverName),
                0,
                500,
                true,
                accessPoints,
                priorities,
                null,
                null
        );
        System.out.println("[Unidbg] ServersBase.addServer => " + (addSrv & 0xff));

        ByteArray serverHash = serversBaseObj.callJniMethodObject(
                emulator,
                "getServerHash(Ljava/lang/String;)[B",
                new StringObject(vm, serverName)
        );
        System.out.println("[Unidbg] ServersBase.getServerHash => " + (serverHash != null ? Arrays.toString(serverHash.getValue()) : "null"));

        DvmClass accountsBaseClass = vm.resolveClass("net/metaquotes/metatrader5/terminal/AccountsBase");
        DvmObject<?> accountsBaseObj = accountsBaseClass.newObject(null);
        int accInit = accountsBaseClass.callStaticJniMethodInt(
                emulator,
                "initialize(Ljava/lang/String;)Z",
                new StringObject(vm, ANDROID_FILES_DIR + "/config/accounts.dat")
        );
        System.out.println("[Unidbg] AccountsBase.initialize => " + (accInit & 0xff));

        int accAdd = accountsBaseObj.callJniMethodInt(
                emulator,
                "accountsAdd([BLjava/lang/String;JLjava/lang/String;)Z",
                serverHash,
                new StringObject(vm, serverName),
                login,
                new StringObject(vm, String.valueOf(login))
        );
        System.out.println("[Unidbg] AccountsBase.accountsAdd => " + (accAdd & 0xff));

        String cleanServerDir = serverName.replaceAll("[^a-zA-Z0-9._-]", "");
        String serverBaseDir = ANDROID_FILES_DIR + "/bases/" + cleanServerDir;
        File hostServerBaseDir = new File(workDir, "rootfs" + serverBaseDir);
        new File(hostServerBaseDir, "trades/" + login).mkdirs();
        new File(hostServerBaseDir, "history").mkdirs();
        new File(hostServerBaseDir, "spread-" + login).mkdirs();

        DvmObject<?> termSymbolsObj = vm.resolveClass("net/metaquotes/metatrader5/terminal/TerminalSymbols").newObject(null);
        DvmObject<?> termSpreadsObj = vm.resolveClass("net/metaquotes/metatrader5/terminal/TerminalSpreads").newObject(null);
        DvmObject<?> termSelectedObj = vm.resolveClass("net/metaquotes/metatrader5/terminal/TerminalSelected").newObject(null);
        DvmObject<?> termTradeObj = vm.resolveClass("net/metaquotes/metatrader5/terminal/TerminalTrade").newObject(null);
        DvmObject<?> termHistoryObj = vm.resolveClass("net/metaquotes/metatrader5/terminal/TerminalHistory").newObject(null);

        int symLoad = termSymbolsObj.callJniMethodInt(
                emulator,
                "symbolsLoad(Ljava/lang/String;Ljava/lang/String;)Z",
                new StringObject(vm, serverBaseDir + "/symbols-" + login + ".dat"),
                new StringObject(vm, serverBaseDir + "/groups-" + login + ".dat")
        );
        int sprLoad = termSpreadsObj.callJniMethodInt(
                emulator,
                "spreadsLoad(Ljava/lang/String;)Z",
                new StringObject(vm, serverBaseDir + "/spread-" + login)
        );
        int selLoad = termSelectedObj.callJniMethodInt(
                emulator,
                "selectedLoad(Ljava/lang/String;)Z",
                new StringObject(vm, serverBaseDir + "/selected-" + login + ".dat")
        );
        int trdLoad = termTradeObj.callJniMethodInt(
                emulator,
                "tradeLoad(Ljava/lang/String;)Z",
                new StringObject(vm, serverBaseDir + "/trades/" + login)
        );
        int chrLoad = termHistoryObj.callJniMethodInt(
                emulator,
                "chartLoad(Ljava/lang/String;)Z",
                new StringObject(vm, serverBaseDir + "/history/")
        );
        System.out.printf("[Unidbg] Mount DBs => symbols=%d spreads=%d selected=%d trade=%d chart=%d%n",
                symLoad & 0xff, sprLoad & 0xff, selLoad & 0xff, trdLoad & 0xff, chrLoad & 0xff);

        DvmObject<?> netCompanion = vm.resolveClass("net/metaquotes/metatrader5/terminal/NetworkManager$Companion").newObject(null);
        netCompanion.callJniMethod(
                emulator,
                "networkSetAvailable(Z)V",
                true
        );

        DvmObject<?> netMgr = vm.resolveClass("net/metaquotes/metatrader5/terminal/NetworkManager").newObject(null);
        int setAcc = netMgr.callJniMethodInt(
                emulator,
                "networkSetAccount(JLjava/lang/String;Ljava/lang/String;[BZZ)Z",
                login,
                new StringObject(vm, password),
                new StringObject(vm, ""),
                serverHash,
                true,
                false
        );
        System.out.println("[Unidbg] NetworkManager.networkSetAccount => " + (setAcc & 0xff));

        Number connResNum = module.callFunction(
                emulator,
                0x2a2c1c, // Java_net_metaquotes_metatrader5_terminal_NetworkManager_networkConnect__Ljava_lang_String_2Z
                vm.getJNIEnv(),
                netMgr.hashCode(),
                vm.addLocalObject(new StringObject(vm, "")),
                0
        );
        int connRes = connResNum != null ? connResNum.intValue() : 0;
        System.out.println("[Unidbg] NetworkManager.networkConnect => " + (connRes & 0xff));

        long cTerminalPtr = emulator.getMemory().pointer(module.base + 0x415048).getPointer(0).peer;
        long cNetworkPtr = cTerminalPtr + 0xb560;
        long cSocketThreadPtr = cNetworkPtr + 0xe08;
        long cTradesBasePtr = cTerminalPtr + 0x11a50;
        byte[] intOne = ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(1).array();
        emulator.getBackend().mem_write(cTradesBasePtr + 0x7a18, new byte[]{1});
        emulator.getBackend().mem_write(cNetworkPtr + 0x1298, intOne);
        emulator.getBackend().mem_write(cNetworkPtr + 0x129c, intOne);
        System.out.printf("[Unidbg] CTerminal=0x%x CNetwork=0x%x CSocketThread=0x%x CTradesBase=0x%x%n",
                cTerminalPtr, cNetworkPtr, cSocketThreadPtr, cTradesBasePtr);

        boolean historyRequested = false;
        int historyRequestStep = -1;
        int authStep = -1;
        int prevPosCnt = -1;
        int prevDealsCnt = -1;
        boolean completed = false;

        for (int step = 0; step < 50; step++) {
            emulator.getBackend().mem_write(cNetworkPtr + 0x1298, intOne);
            emulator.getBackend().mem_write(cNetworkPtr + 0x129c, intOne);
            int sockFd = emulator.getMemory().pointer(cSocketThreadPtr + 0x140).getInt(0);
            if (sockFd == -1) {
                System.out.println("[Pump] Step " + step + ": calling StepConnect (0x2ce414)...");
                module.callFunction(emulator, 0x2ce414, cSocketThreadPtr);
                sockFd = emulator.getMemory().pointer(cSocketThreadPtr + 0x140).getInt(0);
                if (sockFd == -1) {
                    System.out.println("[Pump] TCP connection failed, stopping pump.");
                    break;
                }
            }
            int totalRecvInStep = 0;
            if (sockFd != -1) {
                module.callFunction(emulator, 0x2cccc0, cSocketThreadPtr);
                if (emulator.getMemory().pointer(cSocketThreadPtr + 0x2e0).getLong(0) != 0) {
                    module.callFunction(emulator, 0x2ccdc0, cSocketThreadPtr);
                }
                try { Thread.sleep(100); } catch (InterruptedException ignored) {}
                for (int r = 0; r < 12; r++) {
                    lastRecvBytes = 0;
                    packetsInCurrentReadCall = 0;
                    emulator.getBackend().mem_write(cNetworkPtr + 0x1298, intOne);
                    module.callFunction(emulator, 0x2ccf50, cSocketThreadPtr, sockFd);
                    totalRecvInStep += lastRecvBytes;
                    module.callFunction(emulator, 0x2cccc0, cSocketThreadPtr);
                    if (emulator.getMemory().pointer(cSocketThreadPtr + 0x2e0).getLong(0) != 0) {
                        module.callFunction(emulator, 0x2ccdc0, cSocketThreadPtr);
                    }
                    long dispHead1 = emulator.getMemory().pointer(cNetworkPtr + 0x1300).getLong(0);
                    long dispHead2 = emulator.getMemory().pointer(cNetworkPtr + 0x1310).getLong(0);
                    if (dispHead1 != 0 || dispHead2 != 0) {
                        module.callFunction(emulator, 0x2e0f38, cNetworkPtr);
                        module.callFunction(emulator, 0x2cccc0, cSocketThreadPtr);
                        if (emulator.getMemory().pointer(cSocketThreadPtr + 0x2e0).getLong(0) != 0) {
                            module.callFunction(emulator, 0x2ccdc0, cSocketThreadPtr);
                        }
                    }
                    int curStateB540 = emulator.getMemory().pointer(cTerminalPtr + 0xb540).getInt(0);
                    if (curStateB540 == 4 && !historyRequested) {
                        break;
                    }
                    if (lastRecvBytes == 0 && dispHead1 == 0 && dispHead2 == 0) {
                        break;
                    }
                }

                long reqGen = emulator.getMemory().pointer(cTradesBasePtr + 0x7a20).getLong(0);
                long doneGen = emulator.getMemory().pointer(cTradesBasePtr + 0x7a28).getLong(0);
                if (reqGen != doneGen) {
                    System.out.printf("[Pump] Running HistoryWorkerThread (reqGen=%d, doneGen=%d)...%n", reqGen, doneGen);
                    emulator.getBackend().mem_write(cTradesBasePtr + 0x7a18, new byte[]{1});
                    module.callFunction(emulator, 0x1d4cc0, cTradesBasePtr);
                    emulator.getBackend().mem_write(cTradesBasePtr + 0x7a18, new byte[]{1});
                    module.callFunction(emulator, 0x2cccc0, cSocketThreadPtr);
                    if (emulator.getMemory().pointer(cSocketThreadPtr + 0x2e0).getLong(0) != 0) {
                        module.callFunction(emulator, 0x2ccdc0, cSocketThreadPtr);
                    }
                }
            }
            int status = netMgr.callJniMethodInt(emulator, "networkConnectionStatus()I");
            int sync6220 = emulator.getMemory().pointer(cTerminalPtr + 0x6220).getInt(0);
            int stateB540 = emulator.getMemory().pointer(cTerminalPtr + 0xb540).getInt(0);
            long fragHead = emulator.getMemory().pointer(cSocketThreadPtr + 0x428).getLong(0);
            if ((status == 3 || status == 4) && authStep == -1) {
                authStep = step;
                System.out.println("[Pump] AUTHORIZED (status=" + status + ") at step " + step + "! fragHead=0x" + Long.toHexString(fragHead));
            }
            if (authStep == -1 && step >= 15) {
                System.out.println("[Pump] Authentication timed out at step " + step + " (status=" + status + ")");
                break;
            }
            if (authStep != -1 && !historyRequested && stateB540 == 4) {
                long nativeToMs = toMs + 12L * 3600_000L;
                int hp0 = termTradeObj.callJniMethodInt(emulator, "tradeHistoryPeriod(IJJ)Z", 0, fromMs, nativeToMs);
                int hp1 = termTradeObj.callJniMethodInt(emulator, "tradeHistoryPeriod(IJJ)Z", 1, fromMs, nativeToMs);
                System.out.printf("[Pump] Step %d: Requested tradeHistoryPeriod(%d..%d) (sync6220=%d, stateB540=%d) => hp0=%d hp1=%d%n",
                        step, fromMs, nativeToMs, sync6220, stateB540, hp0 & 0xff, hp1 & 0xff);
                if ((hp0 & 0xff) != 0 || (hp1 & 0xff) != 0) {
                    historyRequested = true;
                    historyRequestStep = step;
                    long reqGenAfter = emulator.getMemory().pointer(cTradesBasePtr + 0x7a20).getLong(0);
                    long doneGenAfter = emulator.getMemory().pointer(cTradesBasePtr + 0x7a28).getLong(0);
                    if (reqGenAfter != doneGenAfter) {
                        emulator.getBackend().mem_write(cTradesBasePtr + 0x7a18, new byte[]{1});
                        module.callFunction(emulator, 0x1d4cc0, cTradesBasePtr);
                        emulator.getBackend().mem_write(cTradesBasePtr + 0x7a18, new byte[]{1});
                        module.callFunction(emulator, 0x2cccc0, cSocketThreadPtr);
                        if (emulator.getMemory().pointer(cSocketThreadPtr + 0x2e0).getLong(0) != 0) {
                            module.callFunction(emulator, 0x2ccdc0, cSocketThreadPtr);
                        }
                    }
                }
            }
            if (authStep != -1) {
                int isReady = termTradeObj.callJniMethodInt(emulator, "tradeHistoryIsReady()Z") & 0xff;
                int dealsCnt = termTradeObj.callJniMethodInt(emulator, "tradeHistoryDealsCount()I");
                int posCnt = termTradeObj.callJniMethodInt(emulator, "tradeHistoryPositionsCount()I");
                int ordCnt = termTradeObj.callJniMethodInt(emulator, "tradeHistoryOrdersCount()I");
                long reqGen = emulator.getMemory().pointer(cTradesBasePtr + 0x7a20).getLong(0);
                long doneGen = emulator.getMemory().pointer(cTradesBasePtr + 0x7a28).getLong(0);
                System.out.printf("[Pump] Step %d: status=%d sync6220=%d stateB540=%d ready=%d deals=%d positions=%d orders=%d recv=%d%n",
                        step, status, sync6220, stateB540, isReady, dealsCnt, posCnt, ordCnt, totalRecvInStep);
                boolean countsStable = (posCnt == prevPosCnt && dealsCnt == prevDealsCnt);
                prevPosCnt = posCnt;
                prevDealsCnt = dealsCnt;
                if (historyRequested && step >= historyRequestStep + 2 && isReady == 1 && reqGen == doneGen
                        && (countsStable || step >= historyRequestStep + 6)
                        && (dealsCnt > 0 || posCnt > 0 || step >= historyRequestStep + 4)) {
                    DvmObject<?> tradeInfoObj = vm.resolveClass("net/metaquotes/metatrader5/types/TradeInfoRecord").newObject(new LinkedHashMap<String, Object>());
                    termTradeObj.callJniMethodInt(emulator, "tradeGetInfo(Lnet/metaquotes/metatrader5/types/TradeInfoRecord;)Z", tradeInfoObj);
                    DvmObject<?> posSummaryObj = vm.resolveClass("net/metaquotes/metatrader5/types/PositionViewInfo").newObject(new LinkedHashMap<String, Object>());
                    termTradeObj.callJniMethodInt(emulator, "tradeHistoryPositionsSummary(Lnet/metaquotes/metatrader5/types/PositionViewInfo;)Z", posSummaryObj);

                    List<DvmObject<?>> openPosDvmList = new ArrayList<>();
                    DvmObject<?> openPosListObj = listClass.newObject(openPosDvmList);
                    termTradeObj.callJniMethodInt(emulator, "tradePositionsGet(Ljava/util/List;)Z", openPosListObj);

                    List<Map<String, Object>> positionsOut = new ArrayList<>();
                    int olderPosStreak = 0;
                    for (int i = posCnt - 1; i >= 0; i--) {
                        DvmObject<?> posObj = termTradeObj.callJniMethodObject(
                                emulator,
                                "tradeHistoryPositionAt(I)Lnet/metaquotes/metatrader5/types/HistoryPosition;",
                                i
                        );
                        Map<String, Object> m = fieldsOf(posObj);
                        long closeTime = ((Number) m.getOrDefault("closeTime", 0L)).longValue();
                        long closeTimeMs = closeTime > 10000000000L ? closeTime : closeTime * 1000L;
                        if (closeTimeMs >= fromMs && closeTimeMs <= toMs) {
                            positionsOut.add(m);
                            olderPosStreak = 0;
                        } else if (closeTimeMs < fromMs) {
                            olderPosStreak++;
                            if (olderPosStreak >= 100) {
                                break;
                            }
                        }
                    }

                    List<Map<String, Object>> dealsOut = new ArrayList<>();
                    int olderDealStreak = 0;
                    for (int i = dealsCnt - 1; i >= 0 && dealsOut.size() < 200; i--) {
                        DvmObject<?> dealObj = termTradeObj.callJniMethodObject(
                                emulator,
                                "tradeHistoryDealAt(I)Lnet/metaquotes/metatrader5/types/TradeDeal;",
                                i
                        );
                        Map<String, Object> m = fieldsOf(dealObj);
                        long date = ((Number) m.getOrDefault("date", 0L)).longValue();
                        long dateMs = date > 10000000000L ? date : date * 1000L;
                        if (dateMs >= fromMs && dateMs <= toMs) {
                            dealsOut.add(m);
                            olderDealStreak = 0;
                        } else if (dateMs < fromMs) {
                            olderDealStreak++;
                            if (olderDealStreak >= 100) {
                                break;
                            }
                        }
                    }

                    List<Map<String, Object>> openPositionsOut = new ArrayList<>();
                    for (DvmObject<?> openObj : openPosDvmList) {
                        openPositionsOut.add(fieldsOf(openObj));
                    }

                    int trdAllowed = termTradeObj.callJniMethodInt(emulator, "tradeAllowed()Z") & 0xff;

                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("success", true);
                    payload.put("server", serverName);
                    payload.put("company", companyName);
                    payload.put("login", login);
                    payload.put("fromMs", fromMs);
                    payload.put("toMs", toMs);
                    payload.put("tradeAllowed", trdAllowed != 0);
                    payload.put("tradeInfo", fieldsOf(tradeInfoObj));
                    payload.put("positionSummary", fieldsOf(posSummaryObj));
                    payload.put("positions", positionsOut);
                    payload.put("deals", dealsOut);
                    payload.put("openPositions", openPositionsOut);
                    payload.put("ordersCount", ordCnt);

                    System.out.println("__MT5_JSON_START__");
                    System.out.println(toJson(payload));
                    System.out.println("__MT5_JSON_END__");
                    completed = true;
                    break;
                }
            }
        }

        if (!completed) {
            Map<String, Object> errPayload = new LinkedHashMap<>();
            errPayload.put("success", false);
            errPayload.put("error", authStep == -1
                    ? "Failed to authenticate with MT5 server " + serverName + " for account " + login
                    : "Timed out waiting for MT5 trade history response from " + serverName);
            System.out.println("__MT5_JSON_START__");
            System.out.println(toJson(errPayload));
            System.out.println("__MT5_JSON_END__");
        }
    }

    public void runBrokerSearch(String query) {
        String cleanQuery = query == null ? "" : query.trim();
        DvmObject<?> brokerApiObj = vm.resolveClass("net/metaquotes/brokers/BrokerInfoAPI").newObject(null);
        StringObject apiPathObj = brokerApiObj.callJniMethodObject(emulator, "b()Ljava/lang/String;");
        String apiPath = apiPathObj != null ? apiPathObj.getValue() : "/public/mt5/network/mobile";

        StringObject queryCompanyObj = brokerApiObj.callJniMethodObject(
                emulator,
                "a(Ljava/lang/String;)Ljava/lang/String;",
                new StringObject(vm, cleanQuery)
        );
        StringObject queryServerObj = brokerApiObj.callJniMethodObject(
                emulator,
                "c(Ljava/lang/String;)Ljava/lang/String;",
                new StringObject(vm, cleanQuery)
        );

        String queryCompany = queryCompanyObj != null ? queryCompanyObj.getValue() : "";
        String queryServer = queryServerObj != null ? queryServerObj.getValue() : "";

        String[] cdnHosts = new String[]{
            "https://api1.cdnfx.net",
            "https://api2.cdnfx.net",
            "https://api3.cdnfx.net"
        };

        String responseBody = "{\"result\":[]}";
        String responseSig = "";
        String responseGeo = "VN;0:0";
        String usedQuery = queryCompany;

        String[] payloadsToTry = new String[]{queryCompany, queryServer};
        outer:
        for (String payload : payloadsToTry) {
            if (payload == null || payload.isEmpty()) continue;
            for (String cdnHost : cdnHosts) {
                try {
                    URL url = new URL(cdnHost + apiPath);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setConnectTimeout(5000);
                    conn.setReadTimeout(5000);
                    conn.setDoOutput(true);
                    conn.setRequestProperty("User-Agent", "MetaTrader 5 Android");
                    conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                    byte[] postBytes = payload.getBytes(StandardCharsets.UTF_8);
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(postBytes);
                    }
                    if (conn.getResponseCode() == 200) {
                        byte[] respBytes;
                        try (InputStream is = conn.getInputStream()) {
                            respBytes = is.readAllBytes();
                        }
                        String body = new String(respBytes, StandardCharsets.UTF_8);
                        String sig = conn.getHeaderField("Signature");
                        String geo = conn.getHeaderField("X-Geo");
                        responseBody = body;
                        responseSig = sig != null ? sig : "";
                        responseGeo = geo != null ? geo : "VN;0:0";
                        usedQuery = payload;
                        if (body.contains("\"company\"")) {
                            break outer;
                        }
                        break;
                    }
                } catch (Exception ignored) {
                }
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("success", true);
        out.put("query", cleanQuery);
        out.put("apiPath", apiPath);
        out.put("signedFormBody", usedQuery);
        out.put("queryCompanyBody", queryCompany);
        out.put("queryServerBody", queryServer);
        out.put("signature", responseSig);
        out.put("xGeo", responseGeo);
        out.put("rawBody", responseBody);

        System.out.println("__MT5_BROKER_JSON_START__");
        System.out.println(toJson(out));
        System.out.println("__MT5_BROKER_JSON_END__");
    }

    public static void main(String[] args) {
        try {
            java.util.logging.Logger.getLogger("").setLevel(java.util.logging.Level.OFF);
            java.util.logging.Logger.getLogger("com.github.unidbg").setLevel(java.util.logging.Level.OFF);
        } catch (Throwable ignored) {}

        String serverName = "STARTRADERFinancial-Demo";
        String companyName = "Startrader Financial Markets Limited";
        String accessStr = "43.216.248.23:443,18.169.198.62:443,54.208.226.140:443";
        long login = 1610076507L;
        String password = "Fzb*6Xsm";
        long now = System.currentTimeMillis();
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        cal.setTimeInMillis(now);
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        long fromMs = cal.getTimeInMillis();
        cal.set(Calendar.HOUR_OF_DAY, 23);
        cal.set(Calendar.MINUTE, 59);
        cal.set(Calendar.SECOND, 59);
        cal.set(Calendar.MILLISECOND, 999);
        long toMs = cal.getTimeInMillis();
        String apkPath = "bin/metatrader5.apk";
        String workDirPath = "unidbg-workdir";
        String searchBrokerQuery = null;

        for (int i = 0; i < args.length - 1; i++) {
            switch (args[i]) {
                case "--search-broker": searchBrokerQuery = args[++i]; break;
                case "--server": serverName = args[++i]; break;
                case "--company": companyName = args[++i]; break;
                case "--access": accessStr = args[++i]; break;
                case "--login": login = Long.parseLong(args[++i].replaceAll("[^0-9]", "")); break;
                case "--password": password = args[++i]; break;
                case "--from": fromMs = Long.parseLong(args[++i]); break;
                case "--to": toMs = Long.parseLong(args[++i]); break;
                case "--apk": apkPath = args[++i]; break;
                case "--workdir": workDirPath = args[++i]; break;
            }
        }

        File apkFile = new File(apkPath);
        File workDir = new File(workDirPath);
        Mt5NativeRunner runner = new Mt5NativeRunner(apkFile, workDir);
        if (searchBrokerQuery != null) {
            runner.runBrokerSearch(searchBrokerQuery);
            System.exit(0);
        }

        String[] accessPoints = Arrays.stream(accessStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);

        runner.runSync(serverName, companyName, accessPoints, login, password, fromMs, toMs);
        System.exit(0);
    }
}
