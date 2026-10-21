package solutions.onz.muni.learning.service.csv;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import solutions.onz.muni.learning.domain.DelimiterSetting;
import solutions.onz.muni.learning.domain.FileRole;
import solutions.onz.muni.learning.domain.Finding;
import solutions.onz.muni.learning.domain.FindingSeverity;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CsvIngestionService {

    public ParsedCsv parse(byte[] content, FileRole role, DelimiterSetting override) {
        Charset charset = detectEncoding(content);
        String text = new String(content, charset);
        if (!text.isEmpty() && text.charAt(0) == '﻿') {
            text = text.substring(1);
        }

        char delimiter = override == DelimiterSetting.AUTO ? sniffDelimiter(text) : override.toChar();

        CSVFormat format = CSVFormat.Builder.create()
                .setDelimiter(delimiter)
                .setHeader()
                .setSkipHeaderRecord(true)
                .setTrim(false)
                .get();

        try (CSVParser parser = CSVParser.parse(text, format)) {
            List<String> headers = new ArrayList<>(parser.getHeaderNames());
            List<Map<String, String>> rows = new ArrayList<>();
            for (CSVRecord record : parser) {
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.size(); i++) {
                    row.put(headers.get(i), i < record.size() ? record.get(i) : null);
                }
                rows.add(row);
            }

            List<Finding> findings = new ArrayList<>();
            if (override != DelimiterSetting.AUTO && headers.size() == 1) {
                findings.add(new Finding(FindingSeverity.WARNING, role, 0, null,
                        "Configured delimiter '" + delimiter + "' produced only one column — the file may use a different delimiter"));
            }

            return new ParsedCsv(headers, rows, findings);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private Charset detectEncoding(byte[] bytes) {
        var decoder = StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT);
        try {
            decoder.decode(ByteBuffer.wrap(bytes));
            return StandardCharsets.UTF_8;
        } catch (CharacterCodingException e) {
            return Charset.forName("windows-1250");
        }
    }

    private char sniffDelimiter(String text) {
        String headerLine = text.lines().findFirst().orElse("");
        long commaCount = headerLine.chars().filter(c -> c == ',').count();
        long semicolonCount = headerLine.chars().filter(c -> c == ';').count();
        return semicolonCount > commaCount ? ';' : ',';
    }
}
