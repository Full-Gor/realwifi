package com.netscan.network;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.net.wifi.WifiInfo;
import android.text.format.Formatter;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.net.InetAddress;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Socket;
import java.net.InetSocketAddress;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

public class NetworkScannerModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private final ExecutorService executor = Executors.newFixedThreadPool(50);

    public NetworkScannerModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "NetworkScanner";
    }

    @ReactMethod
    public void getWifiInfo(Promise promise) {
        try {
            WifiManager wifiManager = (WifiManager) reactContext.getApplicationContext()
                .getSystemService(Context.WIFI_SERVICE);

            if (wifiManager == null) {
                promise.reject("WIFI_ERROR", "WiFi service not available");
                return;
            }

            WifiInfo wifiInfo = wifiManager.getConnectionInfo();

            if (wifiInfo == null) {
                promise.reject("WIFI_ERROR", "WiFi info not available");
                return;
            }

            WritableMap result = Arguments.createMap();
            String ssid = wifiInfo.getSSID();
            result.putString("ssid", ssid != null ? ssid.replace("\"", "") : "Unknown");
            result.putString("bssid", wifiInfo.getBSSID() != null ? wifiInfo.getBSSID() : "");
            result.putInt("rssi", wifiInfo.getRssi());
            result.putInt("linkSpeed", wifiInfo.getLinkSpeed());

            @SuppressWarnings("deprecation")
            String ip = Formatter.formatIpAddress(wifiInfo.getIpAddress());
            result.putString("ip", ip);

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("WIFI_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void scanNetwork(String baseIp, int timeout, Promise promise) {
        final WritableArray devices = Arguments.createArray();
        final Map<String, WritableMap> deviceMap = new HashMap<>();
        final CountDownLatch latch = new CountDownLatch(254);

        try {
            for (int i = 1; i <= 254; i++) {
                final String ip = baseIp + "." + i;
                executor.submit(() -> {
                    try {
                        InetAddress address = InetAddress.getByName(ip);
                        if (address.isReachable(timeout)) {
                            WritableMap device = Arguments.createMap();
                            device.putString("ip", ip);
                            String hostname = address.getHostName();
                            device.putString("hostname", hostname != null && !hostname.equals(ip) ? hostname : "");

                            synchronized (deviceMap) {
                                deviceMap.put(ip, device);
                            }
                        }
                    } catch (IOException ignored) {
                    } finally {
                        latch.countDown();
                    }
                });
            }

            // Wait for all tasks to complete or timeout
            latch.await(timeout + 5000, TimeUnit.MILLISECONDS);

            // Read ARP table for MAC addresses
            Map<String, String> arpTable = readArpTable();

            // Build final result
            synchronized (deviceMap) {
                for (Map.Entry<String, WritableMap> entry : deviceMap.entrySet()) {
                    WritableMap device = entry.getValue();
                    String mac = arpTable.get(entry.getKey());
                    if (mac != null) {
                        device.putString("mac", mac.toUpperCase());
                    } else {
                        device.putString("mac", "");
                    }
                    devices.pushMap(device);
                }
            }

            promise.resolve(devices);
        } catch (Exception e) {
            promise.reject("SCAN_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void ping(String host, int timeout, Promise promise) {
        try {
            long start = System.currentTimeMillis();
            InetAddress address = InetAddress.getByName(host);
            boolean reachable = address.isReachable(timeout);
            long latency = System.currentTimeMillis() - start;

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", reachable);
            result.putDouble("latency", latency);
            result.putString("ip", address.getHostAddress());

            promise.resolve(result);
        } catch (Exception e) {
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", false);
            result.putDouble("latency", -1);
            result.putString("error", e.getMessage());
            promise.resolve(result);
        }
    }

    @ReactMethod
    public void scanPort(String host, int port, int timeout, Promise promise) {
        try {
            Socket socket = new Socket();
            socket.connect(new InetSocketAddress(host, port), timeout);
            socket.close();

            WritableMap result = Arguments.createMap();
            result.putBoolean("open", true);
            result.putInt("port", port);

            promise.resolve(result);
        } catch (Exception e) {
            WritableMap result = Arguments.createMap();
            result.putBoolean("open", false);
            result.putInt("port", port);
            promise.resolve(result);
        }
    }

    @ReactMethod
    public void scanPorts(String host, int startPort, int endPort, int timeout, Promise promise) {
        final WritableArray openPorts = Arguments.createArray();
        final CountDownLatch latch = new CountDownLatch(endPort - startPort + 1);

        try {
            for (int port = startPort; port <= endPort; port++) {
                final int currentPort = port;
                executor.submit(() -> {
                    try {
                        Socket socket = new Socket();
                        socket.connect(new InetSocketAddress(host, currentPort), timeout);
                        socket.close();

                        WritableMap portInfo = Arguments.createMap();
                        portInfo.putInt("port", currentPort);
                        portInfo.putBoolean("open", true);

                        synchronized (openPorts) {
                            openPorts.pushMap(portInfo);
                        }
                    } catch (Exception ignored) {
                    } finally {
                        latch.countDown();
                    }
                });
            }

            latch.await(timeout * (endPort - startPort + 1) / 50 + 5000, TimeUnit.MILLISECONDS);
            promise.resolve(openPorts);
        } catch (Exception e) {
            promise.reject("PORT_SCAN_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void wakeOnLan(String mac, String broadcastIp, Promise promise) {
        try {
            byte[] macBytes = getMacBytes(mac);
            byte[] packet = new byte[6 + 16 * macBytes.length];

            // Fill first 6 bytes with 0xFF
            for (int i = 0; i < 6; i++) {
                packet[i] = (byte) 0xFF;
            }

            // Fill rest with MAC address repeated 16 times
            for (int i = 6; i < packet.length; i += macBytes.length) {
                System.arraycopy(macBytes, 0, packet, i, macBytes.length);
            }

            InetAddress address = InetAddress.getByName(broadcastIp);
            DatagramPacket dp = new DatagramPacket(packet, packet.length, address, 9);
            DatagramSocket socket = new DatagramSocket();
            socket.setBroadcast(true);
            socket.send(dp);
            socket.close();

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("WOL_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void traceroute(String host, int maxHops, int timeout, Promise promise) {
        WritableArray hops = Arguments.createArray();

        try {
            InetAddress destAddress = InetAddress.getByName(host);
            String destIp = destAddress.getHostAddress();

            for (int ttl = 1; ttl <= maxHops; ttl++) {
                long start = System.currentTimeMillis();

                // Use ping with ttl simulation (limited on Android without root)
                try {
                    Process process = Runtime.getRuntime().exec("ping -c 1 -W " + (timeout / 1000) + " " + host);
                    process.waitFor(timeout, TimeUnit.MILLISECONDS);
                    long latency = System.currentTimeMillis() - start;

                    WritableMap hop = Arguments.createMap();
                    hop.putInt("hop", ttl);
                    hop.putString("ip", destIp);
                    hop.putDouble("latency", latency);
                    hops.pushMap(hop);

                    if (ttl == 1 || ttl == maxHops) {
                        break;
                    }
                } catch (Exception e) {
                    WritableMap hop = Arguments.createMap();
                    hop.putInt("hop", ttl);
                    hop.putString("ip", "*");
                    hop.putDouble("latency", -1);
                    hops.pushMap(hop);
                }
            }

            promise.resolve(hops);
        } catch (Exception e) {
            promise.reject("TRACEROUTE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void dnsLookup(String hostname, Promise promise) {
        try {
            InetAddress[] addresses = InetAddress.getAllByName(hostname);
            WritableArray ips = Arguments.createArray();

            for (InetAddress address : addresses) {
                ips.pushString(address.getHostAddress());
            }

            WritableMap result = Arguments.createMap();
            result.putString("hostname", hostname);
            result.putArray("addresses", ips);

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("DNS_ERROR", e.getMessage());
        }
    }

    private Map<String, String> readArpTable() {
        Map<String, String> arpTable = new HashMap<>();

        try {
            BufferedReader reader = new BufferedReader(new FileReader("/proc/net/arp"));
            String line;
            reader.readLine(); // Skip header

            while ((line = reader.readLine()) != null) {
                String[] parts = line.split("\\s+");
                if (parts.length >= 4) {
                    String ip = parts[0];
                    String mac = parts[3];
                    if (!mac.equals("00:00:00:00:00:00")) {
                        arpTable.put(ip, mac);
                    }
                }
            }
            reader.close();
        } catch (IOException ignored) {
        }

        return arpTable;
    }

    private byte[] getMacBytes(String mac) throws IllegalArgumentException {
        String[] hex = mac.split("[:\\-]");
        if (hex.length != 6) {
            throw new IllegalArgumentException("Invalid MAC address: " + mac);
        }

        byte[] bytes = new byte[6];
        for (int i = 0; i < 6; i++) {
            bytes[i] = (byte) Integer.parseInt(hex[i], 16);
        }
        return bytes;
    }
}
