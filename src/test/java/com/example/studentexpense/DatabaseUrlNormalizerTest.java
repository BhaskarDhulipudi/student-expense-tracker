package com.example.studentexpense;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class DatabaseUrlNormalizerTest {

    @Test
    void normalizesRenderPostgresUrl() {
        assertEquals(
                "jdbc:postgresql://user:pass@host:5432/dbname",
                DatabaseUrlNormalizer.normalize("postgresql://user:pass@host:5432/dbname")
        );
    }

    @Test
    void leavesJdbcUrlUnchanged() {
        assertEquals(
                "jdbc:postgresql://user:pass@host:5432/dbname",
                DatabaseUrlNormalizer.normalize("jdbc:postgresql://user:pass@host:5432/dbname")
        );
    }

    @Test
    void leavesH2UrlUnchanged() {
        assertEquals(
                "jdbc:h2:mem:testdb",
                DatabaseUrlNormalizer.normalize("jdbc:h2:mem:testdb")
        );
    }
}
