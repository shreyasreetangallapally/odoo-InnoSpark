def detect_anomaly(product, stock_change, average_change):
    if average_change <= 0:
        return f"{product}: No normal change data available"

    if abs(stock_change) > 2 * average_change:
        return (
            f"⚠ ANOMALY DETECTED: {product}\n"
            f"Stock change: {stock_change}\n"
            f"Normal average change: {average_change}\n"
            f"Reason required before accepting this change."
        )

    return (
        f"OK: {product}\n"
        f"Stock change: {stock_change}"
    )