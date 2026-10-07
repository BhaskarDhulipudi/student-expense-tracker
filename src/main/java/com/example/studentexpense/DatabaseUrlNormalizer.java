package com.example.studentexpense;

import java.util.Locale;

public final class DatabaseUrlNormalizer {

    private DatabaseUrlNormalizer() {
    }

    public static String normalize(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return rawUrl;
        }

        String lowered = rawUrl.toLowerCase(Locale.ROOT);
        if (lowered.startsWith("jdbc:")) {
            return rawUrl;
        }

        if (lowered.startsWith("postgresql://") || lowered.startsWith("postgres://")) {
            return "jdbc:" + rawUrl;
        }

        return rawUrl;
    }
}
