import numpy as np
import math
import time
from datetime import datetime
import requests


def generate_energy_consumption(hour):
    """
    Simulates energy consumption (kWh) based on time of day.
    """
    if 6 <= hour <= 9 or 18 <= hour <= 22:  # Morning and evening peaks
        return round(np.random.uniform(2.5, 4.5), 2)
    elif 9 < hour < 18:  # Daytime usage
        return round(np.random.uniform(1.5, 3.0), 2)
    else:  # Nighttime usage
        return round(np.random.uniform(0.5, 1.5), 2)

def generate_solar_production(hour):
    """
    Simulates solar power generation based on time of day.
    """
    peak_hour = 12
    max_production = 5.0  # Max kWh generation at noon
    if 6 <= hour <= 18:
        production = max_production * math.sin(math.pi * (hour - 6) / 12)
        return round(np.random.uniform(production * 0.8, production * 1.2), 2)
    return 0.0  # No production at night

def generate_grid_frequency():
    return round(np.random.uniform(49.8, 50.2), 2)

def generate_voltage_level():
    return round(np.random.uniform(228, 232), 1)

def send_data_to_json(data):
    with open("data.js", "w") as js_file:
        js_file.write(f"export const data = {data};\n")
    print("✅ Data written to data.js")

def simulate_smart_meter(meter_id):
    current_hour = datetime.utcnow().hour
    data = {
        "meter_id": meter_id,
        "timestamp": datetime.utcnow().isoformat(),
        "energy_consumed": generate_energy_consumption(current_hour),
        "energy_produced": generate_solar_production(current_hour),
        "grid_frequency": generate_grid_frequency(),
        "voltage_level": generate_voltage_level()
    }
    return (data)  

def simulate_smart_meter_file(meter_id):
    current_hour = datetime.utcnow().hour
    data = {
        "meter_id": meter_id,
        "timestamp": datetime.utcnow().isoformat(),
        "energy_consumed": generate_energy_consumption(current_hour),
        "energy_produced": generate_solar_production(current_hour),
        "grid_frequency": generate_grid_frequency(),
        "voltage_level": generate_voltage_level()
    }
    send_data_to_json(data) 
    
simulate_smart_meter("MTR_001")
simulate_smart_meter_file("MTR_002")

# Example main function to test everything
def main():
    # Import the Buying_Price module here to avoid circular imports
    from Buying_Price import calculate_energy_cost

    buying_price = 0.15  # Example buying price per kWh
    meter_id = "MTR_001"

    # Simulate smart meter data and calculate energy cost
    calculate_energy_cost(meter_id, buying_price)

    # Simulate writing to a file
    simulate_smart_meter_file("MTR_002")

# Run the main function
if __name__ == "__main__":
    main()
