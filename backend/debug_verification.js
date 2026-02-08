const { parseAppleHealth } = require('./parsers/apple_health');
const path = require('path');

// Adjusted path to the user's source file
const XML_PATH = path.join(__dirname, '../../personal-health-dashboard/apple_health_export/export.xml');

async function verify() {
    console.log(`Reading file: ${XML_PATH}`);
    try {
        const data = await parseAppleHealth(XML_PATH);

        console.log("--- DATA VERIFICATION REPORT ---");

        // Helper to mimic App.jsx logic
        const getLatest = (arr) => arr && arr.length > 0 ? arr[arr.length - 1].val : 'N/A';
        const getSum = (arr) => arr ? arr.reduce((acc, cur) => acc + cur.val, 0) : 0;
        const getAvg = (arr) => arr ? Math.round(arr.reduce((acc, cur) => acc + cur.val, 0) / arr.length) : 0;

        // 1. Heart Rate (UI: 64 bpm) - App.jsx uses Average
        if (data.heartRate) {
            console.log(`Heart Rate (Avg): ${getAvg(data.heartRate)} bpm (Count: ${data.heartRate.length})`);
            console.log(`Heart Rate (Latest): ${getLatest(data.heartRate)} bpm`);
        }

        // 2. Resting HR (UI: 52 bpm) - App.jsx uses Latest
        if (data.restingHeartRate) {
            console.log(`Resting HR (Latest): ${getLatest(data.restingHeartRate)} bpm`);
        }

        // 3. HRV (UI: 47.57 ms) - App.jsx uses Latest
        if (data.heartRateVariabilitySDNN) {
            console.log(`HRV (Latest): ${getLatest(data.heartRateVariabilitySDNN)} ms`);
        }

        // 4. Resp Rate (UI: 24.5 br/min) - App.jsx uses Latest
        if (data.respiratoryRate) {
            console.log(`Resp Rate (Latest): ${getLatest(data.respiratoryRate)} br/min`);
        }

        // 5. VO2 Max (UI: 35.4 ml/kg) - App.jsx uses Latest
        if (data.vo2Max) {
            console.log(`VO2 Max (Latest): ${getLatest(data.vo2Max)} ml/kg`);
        }

        // 6. SpO2 (UI: 0.95 %) - App.jsx uses Latest
        if (data.oxygenSaturation) {
            console.log(`SpO2 (Latest): ${getLatest(data.oxygenSaturation)}`);
        }

        // 7. Steps (UI: 55901) - App.jsx uses Sum
        if (data.stepCount) {
            console.log(`Steps (Total Sum in extracted/sliced data): ${getSum(data.stepCount)}`);
            console.log(`  -> Note: Parser slices to last 500 records. If raw file has more, this sum is partial.`);
        }

        // 8. Distance (UI: 7.41 km) - App.jsx uses Sum
        if (data.distanceWalkingRunning) {
            console.log(`Distance (Total Sum): ${getSum(data.distanceWalkingRunning).toFixed(2)} km`);
        }

    } catch (err) {
        console.error("Verification failed:", err);
    }
}

verify();
