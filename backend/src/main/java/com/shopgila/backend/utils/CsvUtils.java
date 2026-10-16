package com.shopgila.backend.utils;

import lombok.NoArgsConstructor;
import org.apache.commons.csv.CSVRecord;

import static lombok.AccessLevel.PRIVATE;

@NoArgsConstructor(access = PRIVATE)
public class CsvUtils {

    public static String value(CSVRecord record, String column) {
        if (!record.isMapped(column) || !record.isSet(column)) {
            return "";
        }
        String raw = record.get(column);
        return raw == null ? "" : raw.trim();
    }

    public static boolean isBlank(CSVRecord record) {
        for (String field : record) {
            if (field != null && !field.isBlank()) {
                return false;
            }
        }
        return true;
    }
}
