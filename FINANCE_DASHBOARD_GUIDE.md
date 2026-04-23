# Financial Dashboard - User Guide

## Overview
The Financial Dashboard allows you to track payments, revenue, and financial metrics for all your design orders.

## Features

### 📊 Summary Cards
- **Total Revenue**: Sum of all design prices
- **Received**: Total payments collected
- **Pending**: Outstanding balance
- **Collection Rate**: Percentage of revenue collected

### 👥 Client-wise Breakdown
View financial summary grouped by client:
- Number of orders per client
- Total amount for each client
- Amount received and pending

### 💰 Design-wise Details
Full financial tracking for each design:
- Set price for each design
- Track payment received
- Set payment status (Not Set, Pending, Partial, Paid, Overdue)
- Record payment date
- Add financial notes

## Setup Instructions

### 1. Run Database Migration (One-time)

After deployment, visit this URL once to add financial columns to your database:

```
https://divadaultidashboard-production.up.railway.app/api/migrate-financial
```

You should see:
```json
{
  "success": true,
  "message": "Financial columns migration completed successfully",
  "columns": [...]
}
```

### 2. Access the Dashboard

Visit: `https://divadaultidashboard-production.up.railway.app/finance`

Or click "Finance" in the sidebar (💰 icon)

## How to Use

### Adding Price to a Design

1. Go to Finance Dashboard
2. Find the design in the "Order Details" table
3. Click the **Edit** button (✏️)
4. Enter:
   - **Price**: Total price for the design
   - **Payment Received**: Amount already paid
   - **Status**: Select payment status
   - **Payment Date**: When payment was received (optional)
5. Click **Save** (💾)

### Payment Status Options

- **Not Set**: No price defined yet
- **Pending**: Awaiting full payment
- **Partial**: Some payment received, balance pending
- **Paid**: Fully paid
- **Overdue**: Payment past due

### Quick Tips

- **Leave price as 0** if you don't want to track financials for a design
- Designs with price = 0 will show status as "Not Set"
- **Collection Rate** automatically calculates based on total revenue vs received
- All amounts are in **INR** (₹)

## Integration with Main Dashboard

The financial data is stored per design, so you can:
- Track payments alongside production status
- See which designs are paid vs pending
- Monitor cash flow per client
- Generate financial reports

## Currency Format

All amounts are displayed in Indian Rupees (₹) with the format:
- ₹1,00,000 for one lakh
- ₹10,00,000 for ten lakhs

## Future Enhancements

Potential features to add:
- Invoice generation
- Payment reminders
- Profit margin tracking
- Monthly/yearly revenue reports
- Export to Excel/PDF

---

**Note**: Make sure to run the migration endpoint first, otherwise the Finance page will show errors!
