package com.example.studentexpense;

import javax.sql.DataSource;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import com.zaxxer.hikari.HikariDataSource;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties dataSourceProperties) {
        String url = dataSourceProperties.getUrl();
        String normalizedUrl = DatabaseUrlNormalizer.normalize(url);
        if (normalizedUrl != null && !normalizedUrl.equals(url)) {
            dataSourceProperties.setUrl(normalizedUrl);
        }

        return dataSourceProperties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }
}
