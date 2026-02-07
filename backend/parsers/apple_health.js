const xml2js = require('xml2js');
const fs = require('fs');

/**
 * Parses Apple Health export.xml and extracts key vitals.
 * @param {string} filePath Path to the XML file.
 * @returns {Promise<Object>} Extracted health data.
 */
async function parseAppleHealth(filePath) {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

    return new Promise((resolve, reject) => {
        parser.parseString(xmlData, (err, result) => {
            if (err) return reject(err);

            const records = result.HealthData.Record || [];
            const extractedData = {
                heartRate: [],
                stepCount: [],
                bodyMass: [],
                bloodPressureSystolic: [],
                bloodPressureDiastolic: []
            };

            records.forEach(record => {
                const type = record.type;
                const val = parseFloat(record.value);
                const date = record.startDate;

                switch (type) {
                    case 'HKQuantityTypeIdentifierHeartRate':
                        extractedData.heartRate.push({ val, date });
                        break;
                    case 'HKQuantityTypeIdentifierStepCount':
                        extractedData.stepCount.push({ val, date });
                        break;
                    case 'HKQuantityTypeIdentifierBodyMass':
                        extractedData.bodyMass.push({ val, date });
                        break;
                    case 'HKQuantityTypeIdentifierBloodPressureSystolic':
                        extractedData.bloodPressureSystolic.push({ val, date });
                        break;
                    case 'HKQuantityTypeIdentifierBloodPressureDiastolic':
                        extractedData.bloodPressureDiastolic.push({ val, date });
                        break;
                }
            });

            // Filter/Sample data to avoid overwhelming the frontend
            // For now, just return the raw data (limited to last 100 for each)
            Object.keys(extractedData).forEach(key => {
                extractedData[key] = extractedData[key].slice(-100);
            });

            resolve(extractedData);
        });
    });
}

module.exports = { parseAppleHealth };
