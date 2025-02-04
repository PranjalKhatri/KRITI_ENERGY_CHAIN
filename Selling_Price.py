from IoT_Module import simulate_smart_meter

def calculate_energy_revenue(meter_id, selling_price):
    """ Returns the revenue from sold energy based on selling price (per kWh). """
    data = simulate_smart_meter(meter_id)
    revenue = data["energy_produced"] * selling_price
    print(f"💵 Energy Revenue for {meter_id}: ${revenue:.2f}")
    
    # Write the revenue to a .js file
    write_revenue_to_js(meter_id, revenue)
    return revenue

def write_revenue_to_js(meter_id, revenue):
    # This function will create a .js file and write the revenue data
    data = {
        "meter_id": meter_id,
        "energy_revenue": round(revenue, 2)
    }
    
    # Write to a .js file
    with open("energy_revenue.js", "w") as js_file:
        js_file.write(f"export const revenueData = {data};\n")
    print("✅ Energy revenue data written to energy_revenue.js")
