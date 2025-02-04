from IoT_Module import simulate_smart_meter

def calculate_energy_cost(meter_id, buying_price):
    """ Returns the cost of consumed energy based on buying price (per kWh). """
    data = simulate_smart_meter(meter_id)
    cost = data["energy_consumed"] * buying_price
    print(f"💰 Energy Cost for {meter_id}: ${cost:.2f}")
    
    # Write the cost data to a .js file
    write_cost_to_js(meter_id, cost)
    return cost

def write_cost_to_js(meter_id, cost):
    data = {
        "meter_id": meter_id,
        "energy_cost": round(cost, 2)
    }
    
    # Write to a .js file
    with open("energy_cost.js", "w") as js_file:
        js_file.write(f"export const costData = {data};\n")
    print("✅ Energy cost data written to energy_cost.js")
