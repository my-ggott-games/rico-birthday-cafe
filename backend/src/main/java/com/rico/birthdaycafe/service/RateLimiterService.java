package com.rico.birthdaycafe.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private final Map<String, IpRecord> ipRecords = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS = 3;
    private static final long TIME_WINDOW_HOURS = 24;

    public boolean isAllowed(String ipAddress) {
        cleanUpOldRecords();

        IpRecord record = ipRecords.computeIfAbsent(ipAddress, k -> new IpRecord());

        synchronized (record) {
            if (record.getCount() >= MAX_REQUESTS) {
                return false;
            }
            record.increment();
            return true;
        }
    }

    private void cleanUpOldRecords() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(TIME_WINDOW_HOURS);
        ipRecords.entrySet().removeIf(entry -> entry.getValue().getLastRequest().isBefore(threshold));
    }

    private static class IpRecord {
        private int count = 0;
        private LocalDateTime lastRequest = LocalDateTime.now();

        public int getCount() {
            return count;
        }

        public void increment() {
            this.count++;
            this.lastRequest = LocalDateTime.now();
        }

        public LocalDateTime getLastRequest() {
            return lastRequest;
        }
    }
}
