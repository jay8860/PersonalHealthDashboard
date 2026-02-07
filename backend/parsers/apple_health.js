const xml2js = require('xml2js');
const fs = require('fs');

/**
 * Parses Apple Health export.xml or export_cda.xml and extracts key vitals.
 * Handles both standard HealthData format and CDA (ClinicalDocument) format.
 * @param {string} filePath Path to the XML file.
 * @returns {Promise<Object>} Extracted health data.
 */
async function parseAppleHealth(filePath) {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

    const extractedData = {
        heartRate: [],
        stepCount: [],
        bodyMass: [],
        bloodPressureSystolic: [],
        bloodPressureDiastolic: []
    };

    const processRecord = (type, val, date) => {
        const floatVal = parseFloat(val);
        if (isNaN(floatVal)) return;

        switch (type) {
            case 'HKQuantityTypeIdentifierHeartRate':
                extractedData.heartRate.push({ val: floatVal, date });
                break;
            case 'HKQuantityTypeIdentifierStepCount':
                extractedData.stepCount.push({ val: floatVal, date });
                break;
            case 'HKQuantityTypeIdentifierBodyMass':
                extractedData.bodyMass.push({ val: floatVal, date });
                break;
            case 'HKQuantityTypeIdentifierBloodPressureSystolic':
                extractedData.bloodPressureSystolic.push({ val: floatVal, date });
                break;
            case 'HKQuantityTypeIdentifierBloodPressureDiastolic':
                extractedData.bloodPressureDiastolic.push({ val: floatVal, date });
                break;
        }
    };

    return new Promise((resolve, reject) => {
        // Try parsing as standard XML first (wrapped in case of multiple roots)
        const wrappedXml = xmlData.includes('<HealthData') || xmlData.includes('<ClinicalDocument')
            ? xmlData
            : `<root>${xmlData}</root>`;

        parser.parseString(wrappedXml, (err, result) => {
            // If xml2js fails but we have data, we'll try a fallback regex approach for CDA
            if (err || !result) {
                console.log("xml2js failed, trying fallback loose parsing...");
                return fallbackParsing(xmlData, extractedData, resolve);
            }

            // Standard Apple Health Root
            if (result.HealthData && result.HealthData.Record) {
                const records = Array.isArray(result.HealthData.Record) ? result.HealthData.Record : [result.HealthData.Record];
                records.forEach(r => processRecord(r.type, r.value, r.startDate));
            }
            // CDA Root (ClinicalDocument)
            else if (result.ClinicalDocument || result.root?.ClinicalDocument || result.root?.entry) {
                // Large CDA files can be complex with xml2js, better to use fallback if it's too nested
                // But let's try to find entries
                console.log("CDA structure detected");
                fallbackParsing(xmlData, extractedData, resolve);
                return;
            } else {
                // If structure is unknown, try fallback anyway
                fallbackParsing(xmlData, extractedData, resolve);
                return;
            }

            // Sample data to avoid overwhelming the frontend
            Object.keys(extractedData).forEach(key => {
                extractedData[key] = extractedData[key].slice(-100);
            });
            resolve(extractedData);
        });
    });
}

/**
 * Fallback parser using regex for CDA files and malformed XML.
 * Extracts HK types, values, and dates from <observation> blocks.
 */
function fallbackParsing(xmlData, extractedData, resolve) {
    // Regex for Records (standard)
    const recordRegex = /<Record[^>]*type="([^"]+)"[^>]*value="([^"]+)"[^>]*startDate="([^"]+)"/g;
    let match;
    while ((match = recordRegex.exec(xmlData)) !== null) {
        processRecordInFallback(match[1], match[2], match[3], extractedData);
    }

    // Regex for CDA observations (Clinical Document Architecture)
    // Looking for <text><type>HK...</type><value>...</value></text> AND <low value="..."/>
    const observationRegex = /<observation[\s\S]*?<type>([^<]+)<\/type>[\s\S]*?<value>([^<]+)<\/value>[\s\S]*?<low value="([^"]+)"/g;
    while ((match = observationRegex.exec(xmlData)) !== null) {
        processRecordInFallback(match[1], match[2], match[3], extractedData);
    }

    // Filter/Sample data
    Object.keys(extractedData).forEach(key => {
        extractedData[key] = extractedData[key].slice(-100);
    });
    resolve(extractedData);
}

function processRecordInFallback(type, val, date, extractedData) {
    const floatVal = parseFloat(val);
    if (isNaN(floatVal)) return;

    // Normalize date (Apple CDA date is like 20260207232359+0530, needs conversion or just use string)
    // Standard JS Date can't parse 20260207... easily without formatting
    let formattedDate = date;
    if (date.length >= 8 && /^\d+/.test(date)) {
        // Simple conversion for YYYYMMDDHHMMSS
        formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)} ${date.substring(8, 10)}:${date.substring(10, 12)}`;
    }

    switch (type) {
        case 'HKQuantityTypeIdentifierHeartRate':
            extractedData.heartRate.push({ val: floatVal, date: formattedDate });
            break;
        case 'HKQuantityTypeIdentifierStepCount':
            extractedData.stepCount.push({ val: floatVal, date: formattedDate });
            break;
        case 'HKQuantityTypeIdentifierBodyMass':
            extractedData.bodyMass.push({ val: floatVal, date: formattedDate });
            break;
        case 'HKQuantityTypeIdentifierBloodPressureSystolic':
            extractedData.bloodPressureSystolic.push({ val: floatVal, date: formattedDate });
            break;
        case 'HKQuantityTypeIdentifierBloodPressureDiastolic':
            extractedData.bloodPressureDiastolic.push({ val: floatVal, date: formattedDate });
            break;
    }
}

module.exports = { parseAppleHealth };
