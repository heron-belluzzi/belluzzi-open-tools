# Data Toolkit

The Data Toolkit is the fourth Belluzzi Open Tools release. It formats,
validates, converts and previews structured data entirely in the browser.

## Available operations

- format and minify JSON;
- convert JSON to YAML;
- convert safe YAML to JSON;
- convert arrays of JSON objects to CSV;
- detect comma, semicolon or tab-delimited CSV and convert it to JSON;
- preview up to 20 CSV rows and 12 columns;
- copy or download generated results;
- read local JSON, YAML, CSV and text files without uploading them.

## Safety boundaries

- input is limited to 1 MB, measured as UTF-8 bytes;
- YAML uses the core schema and rejects unresolved custom tags;
- YAML aliases are rejected to prevent expansion attacks;
- CSV rows must have consistent widths and unique headers;
- JSON-to-CSV accepts only non-empty arrays of objects;
- no content is persisted, included in the URL or sent to an API.

The canonical routes are `/pt/data` and `/en/data`. The optional
`data.belluzzi.dev` alias should only be activated after DNS, vhost and TLS are
configured for the existing application.
