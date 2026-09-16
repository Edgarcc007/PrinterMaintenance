using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace PrinterMaintenanceUI.Models
{
    public class DashboardStats
    {
        [JsonProperty("total_printers")] public int TotalPrinters { get; set; }
        [JsonProperty("active_printers")] public int ActivePrinters { get; set; }
        [JsonProperty("in_repair")] public int InRepair { get; set; }
        [JsonProperty("overdue_maintenance")] public int OverdueMaintenance { get; set; }
        [JsonProperty("upcoming_7_days")] public int Upcoming7Days { get; set; }
        [JsonProperty("completed_this_month")] public int CompletedThisMonth { get; set; }
        [JsonProperty("corrective_this_month")] public int CorrectiveThisMonth { get; set; }
    }

    public class Location
    {
        [JsonProperty("id")] public int Id { get; set; }
        [JsonProperty("name")] public string Name { get; set; } = "";
        [JsonProperty("description")] public string? Description { get; set; }
    }

    public class Printer
    {
        [JsonProperty("id")] public int Id { get; set; }
        [JsonProperty("brand")] public string Brand { get; set; } = "";
        [JsonProperty("model")] public string Model { get; set; } = "";
        [JsonProperty("serial_number")] public string SerialNumber { get; set; } = "";
        [JsonProperty("asset_tag")] public string? AssetTag { get; set; }
        [JsonProperty("ip_address")] public string? IpAddress { get; set; }
        [JsonProperty("location_id")] public int? LocationId { get; set; }
        [JsonProperty("location")] public Location? Location { get; set; }
        [JsonProperty("status")] public string Status { get; set; } = "Active";
        [JsonProperty("notes")] public string? Notes { get; set; }
        [JsonProperty("created_at")] public DateTime CreatedAt { get; set; }

        public string DisplayName => $"{Brand} {Model}";
        public string LocationName => Location?.Name ?? "—";
    }

    public class MaintenanceCategory
    {
        [JsonProperty("id")] public int Id { get; set; }
        [JsonProperty("name")] public string Name { get; set; } = "";
        [JsonProperty("type")] public string Type { get; set; } = "";
        [JsonProperty("description")] public string? Description { get; set; }
        [JsonProperty("frequency_days")] public int? FrequencyDays { get; set; }
    }

    public class MaintenanceRecord
    {
        [JsonProperty("id")] public int Id { get; set; }
        [JsonProperty("printer_id")] public int PrinterId { get; set; }
        [JsonProperty("printer")] public Printer? Printer { get; set; }
        [JsonProperty("category_id")] public int CategoryId { get; set; }
        [JsonProperty("category")] public MaintenanceCategory? Category { get; set; }
        [JsonProperty("type")] public string Type { get; set; } = "";
        [JsonProperty("performed_by")] public string PerformedBy { get; set; } = "";
        [JsonProperty("performed_at")] public DateTime PerformedAt { get; set; }
        [JsonProperty("duration_minutes")] public int? DurationMinutes { get; set; }
        [JsonProperty("findings")] public string? Findings { get; set; }
        [JsonProperty("actions_taken")] public string? ActionsTaken { get; set; }
        [JsonProperty("parts_replaced")] public string? PartsReplaced { get; set; }
        [JsonProperty("status")] public string Status { get; set; } = "";
        [JsonProperty("next_due_date")] public DateTime? NextDueDate { get; set; }

        public string PrinterDisplay => Printer != null ? $"{Printer.Brand} {Printer.Model}" : "—";
        public string CategoryDisplay => Category?.Name ?? "—";
    }

    public class MaintenanceSchedule
    {
        [JsonProperty("id")] public int Id { get; set; }
        [JsonProperty("printer_id")] public int PrinterId { get; set; }
        [JsonProperty("printer")] public Printer? Printer { get; set; }
        [JsonProperty("category_id")] public int CategoryId { get; set; }
        [JsonProperty("category")] public MaintenanceCategory? Category { get; set; }
        [JsonProperty("frequency_days")] public int FrequencyDays { get; set; }
        [JsonProperty("last_performed")] public DateTime? LastPerformed { get; set; }
        [JsonProperty("next_due_date")] public DateTime NextDueDate { get; set; }
        [JsonProperty("is_active")] public bool IsActive { get; set; }

        public string PrinterDisplay => Printer != null ? $"{Printer.Brand} {Printer.Model}" : "—";
        public string CategoryDisplay => Category?.Name ?? "—";
        public string LocationDisplay => Printer?.Location?.Name ?? "—";
        public int DaysRemaining => (NextDueDate - DateTime.Today).Days;
        public bool IsOverdue => NextDueDate < DateTime.Today;
    }

    public class OverduePrinter
    {
        [JsonProperty("printer_id")] public int PrinterId { get; set; }
        [JsonProperty("brand")] public string Brand { get; set; } = "";
        [JsonProperty("model")] public string Model { get; set; } = "";
        [JsonProperty("serial_number")] public string SerialNumber { get; set; } = "";
        [JsonProperty("location")] public string? Location { get; set; }
        [JsonProperty("maintenance_task")] public string MaintenanceTask { get; set; } = "";
        [JsonProperty("due_date")] public DateTime DueDate { get; set; }
        [JsonProperty("days_overdue")] public int DaysOverdue { get; set; }

        public string PrinterDisplay => $"{Brand} {Model}";
    }
}
