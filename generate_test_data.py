
import datetime
import random

def generate_xml():
    now = datetime.datetime.now()
    records = []
    
    # helper for creating records
    def create_record(type_id, val, unit, offset_mins=0, category=False):
        dt = now - datetime.timedelta(minutes=offset_mins)
        dt_str = dt.strftime("%Y-%m-%dT%H:%M:%S")
        end_dt_str = (dt + datetime.timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M:%S")
        
        tag = "Record"
        val_attr = f'value="{val}"'
        
        if category:
            return f'<{tag} type="{type_id}" sourceName="TestGen" sourceVersion="1.0" creationDate="{dt_str}" startDate="{dt_str}" endDate="{end_dt_str}" {val_attr}/>'
        else:
            return f'<{tag} type="{type_id}" sourceName="TestGen" sourceVersion="1.0" unit="{unit}" creationDate="{dt_str}" startDate="{dt_str}" endDate="{end_dt_str}" {val_attr}/>'

    # --- VITALS ---
    # Heart Rate (Avg ~75)
    for i in range(20):
        records.append(create_record("HKQuantityTypeIdentifierHeartRate", 70 + i%10, "count/min", i*10))
    # Resting HR
    records.append(create_record("HKQuantityTypeIdentifierRestingHeartRate", 62, "count/min", 60))
    # HRV
    records.append(create_record("HKQuantityTypeIdentifierHeartRateVariabilitySDNN", 45, "ms", 120))
    # Resp Rate
    records.append(create_record("HKQuantityTypeIdentifierRespiratoryRate", 14, "count/min", 30))
    # SpO2
    records.append(create_record("HKQuantityTypeIdentifierOxygenSaturation", 0.98, "%", 15)) # 98%
    # Body Temp
    records.append(create_record("HKQuantityTypeIdentifierBodyTemperature", 36.6, "degC", 45))

    # --- ACTIVITY ---
    # Steps (Total ~3000)
    for i in range(10):
        records.append(create_record("HKQuantityTypeIdentifierStepCount", 300, "count", i*60))
    # Distance
    records.append(create_record("HKQuantityTypeIdentifierDistanceWalkingRunning", 2.5, "km", 60))
    # Flights
    records.append(create_record("HKQuantityTypeIdentifierFlightsClimbed", 5, "count", 120))
    # Active Energy
    records.append(create_record("HKQuantityTypeIdentifierActiveEnergyBurned", 450, "kcal", 240))
    # Resting Energy
    records.append(create_record("HKQuantityTypeIdentifierBasalEnergyBurned", 1500, "kcal", 240))
    # Exercise Time
    records.append(create_record("HKQuantityTypeIdentifierAppleExerciseTime", 45, "min", 300))
    # Stand Time
    records.append(create_record("HKQuantityTypeIdentifierAppleStandTime", 600, "min", 300)) # 10 hours?

    # --- BODY ---
    records.append(create_record("HKQuantityTypeIdentifierBodyMass", 72.5, "kg", 1440))
    records.append(create_record("HKQuantityTypeIdentifierBodyMassIndex", 23.5, "count", 1440))
    records.append(create_record("HKQuantityTypeIdentifierHeight", 1.75, "m", 1440)) # 175cm

    # --- BLOOD PRESSURE ---
    records.append(create_record("HKQuantityTypeIdentifierBloodPressureSystolic", 118, "mmHg", 30))
    records.append(create_record("HKQuantityTypeIdentifierBloodPressureDiastolic", 76, "mmHg", 30))

    # --- MOBILITY ---
    records.append(create_record("HKQuantityTypeIdentifierWalkingSpeed", 4.5, "km/h", 60))
    records.append(create_record("HKQuantityTypeIdentifierWalkingStepLength", 72, "cm", 60))
    records.append(create_record("HKQuantityTypeIdentifierWalkingAsymmetryPercentage", 0, "%", 60))
    records.append(create_record("HKQuantityTypeIdentifierWalkingDoubleSupportPercentage", 28, "%", 60))

    # --- ENVIRONMENT ---
    records.append(create_record("HKQuantityTypeIdentifierEnvironmentalAudioExposure", 65, "dBASPL", 10))

    # --- SLEEP ---
    # value="HKCategoryValueSleepAnalysisAsleepUnspecified" or just "1" (Asleep), "0" (InBed), "2" (Awake)
    # Let's create a simplified sleep session: 7 hours total
    # 23:00 - 07:00 (8 hours in bed)
    # 23:30 - 06:30 (7 hours asleep)
    sleep_start = now - datetime.timedelta(hours=10) # 10 hours ago
    
    # In Bed (8 hrs)
    records.append(f'<Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="TestWatch" creationDate="{now}" startDate="{sleep_start.strftime("%Y-%m-%dT%H:%M:%S")}" endDate="{(sleep_start + datetime.timedelta(hours=8)).strftime("%Y-%m-%dT%H:%M:%S")}" value="HKCategoryValueSleepAnalysisInBed"/>')
    
    # Asleep Core (5 hrs)
    asleep_start = sleep_start + datetime.timedelta(minutes=30)
    records.append(f'<Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="TestWatch" creationDate="{now}" startDate="{asleep_start.strftime("%Y-%m-%dT%H:%M:%S")}" endDate="{(asleep_start + datetime.timedelta(hours=5)).strftime("%Y-%m-%dT%H:%M:%S")}" value="HKCategoryValueSleepAnalysisAsleepCore"/>')
    # Asleep Deep (1 hr)
    deep_start = asleep_start + datetime.timedelta(hours=5)
    records.append(f'<Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="TestWatch" creationDate="{now}" startDate="{deep_start.strftime("%Y-%m-%dT%H:%M:%S")}" endDate="{(deep_start + datetime.timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S")}" value="HKCategoryValueSleepAnalysisAsleepDeep"/>')
    # Asleep REM (1 hr)
    rem_start = deep_start + datetime.timedelta(hours=1)
    records.append(f'<Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="TestWatch" creationDate="{now}" startDate="{rem_start.strftime("%Y-%m-%dT%H:%M:%S")}" endDate="{(rem_start + datetime.timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S")}" value="HKCategoryValueSleepAnalysisAsleepREM"/>')


    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE HealthData [
]>
<HealthData locale="en_US">
  <ExportDate value="{now.strftime("%Y-%m-%dT%H:%M:%S")}"/>
  <Me dateOfBirth="1990-01-01" biologicalSex="HKBiologicalSexMale" bloodType="HKBloodTypeAPositive" fitzpatrickSkinType="HKFitzpatrickSkinTypeNotSet"/>
  {''.join(records)}
</HealthData>
"""
    
    filename = "comprehensive_test.xml"
    with open(filename, "w") as f:
        f.write(xml_content)
    print(f"Generated {filename}")

if __name__ == "__main__":
    generate_xml()
