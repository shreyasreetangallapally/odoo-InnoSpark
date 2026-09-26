def check_stock_risk(product, current_stock, average_usage, pending_orders=0):
    if average_usage <= 0:
        return f"{product}: No usage data available"

    days_remaining = current_stock / average_usage

    if days_remaining <= 3:
        return (
            f"⚠ STOCK-OUT RISK: {product}\n"
            f"Current stock: {current_stock}\n"
            f"Average daily usage: {average_usage}\n"
            f"Pending orders: {pending_orders}\n"
            f"Estimated days remaining: {days_remaining:.1f}"
        )

    return (
        f"OK: {product}\n"
        f"Estimated days remaining: {days_remaining:.1f}"
    )