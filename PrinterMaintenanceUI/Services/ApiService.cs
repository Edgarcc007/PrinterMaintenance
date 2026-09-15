using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using PrinterMaintenanceUI.Models;

namespace PrinterMaintenanceUI.Services
{
    public class ApiService
    {
        private readonly HttpClient _client;
        private const string BaseUrl = "http://localhost:8000/api";

        public ApiService()
        {
            _client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        }

        // -- Dashboard --
        public async Task<DashboardStats?> GetDashboardStats()
            => await GetAsync<DashboardStats>("/dashboard/stats");

        public async Task<List<OverduePrinter>> GetOverduePrinters()
            => await GetAsync<List<OverduePrinter>>("/dashboard/overdue") ?? new();

        // -- Printers --
        public async Task<List<Printer>> GetPrinters(string? brand = null, string? status = null, string? search = null)
        {
            var query = new List<string>();
            if (!string.IsNullOrEmpty(brand)) query.Add($"brand={brand}");
            if (!string.IsNullOrEmpty(status)) query.Add($"status={status}");
            if (!string.IsNullOrEmpty(search)) query.Add($"search={search}");
            var qs = query.Count > 0 ? "?" + string.Join("&", query) : "";
            return await GetAsync<List<Printer>>($"/printers{qs}") ?? new();
        }

        public async Task<Printer?> CreatePrinter(object data)
            => await PostAsync<Printer>("/printers", data);

        public async Task<Printer?> UpdatePrinter(int id, object data)
            => await PutAsync<Printer>($"/printers/{id}", data);

        public async Task DeletePrinter(int id)
            => await DeleteAsync($"/printers/{id}");

        // -- Locations --
        public async Task<List<Location>> GetLocations()
            => await GetAsync<List<Location>>("/locations") ?? new();

        public async Task<Location?> CreateLocation(object data)
            => await PostAsync<Location>("/locations", data);

        public async Task DeleteLocation(int id)
            => await DeleteAsync($"/locations/{id}");

        // -- Categories --
        public async Task<List<MaintenanceCategory>> GetCategories(string? type = null)
        {
            var qs = !string.IsNullOrEmpty(type) ? $"?type={type}" : "";
            return await GetAsync<List<MaintenanceCategory>>($"/categories{qs}") ?? new();
        }

        public async Task<MaintenanceCategory?> CreateCategory(object data)
            => await PostAsync<MaintenanceCategory>("/categories", data);

        // -- Maintenance Records --
        public async Task<List<MaintenanceRecord>> GetRecords(int? printerId = null, string? type = null, int limit = 100)
        {
            var query = new List<string>();
            if (printerId.HasValue) query.Add($"printer_id={printerId}");
            if (!string.IsNullOrEmpty(type)) query.Add($"type={type}");
            query.Add($"limit={limit}");
            var qs = "?" + string.Join("&", query);
            return await GetAsync<List<MaintenanceRecord>>($"/maintenance{qs}") ?? new();
        }

        
        public async Task<MaintenanceRecord?> UpdateRecord(int id, object data)
            => await PutAsync<MaintenanceRecord>($"/maintenance/{id}", data);

        public async Task<MaintenanceRecord?> CreateRecord(object data)
            => await PostAsync<MaintenanceRecord>("/maintenance", data);

        // -- Schedules --
        public async Task<List<MaintenanceSchedule>> GetSchedules()
            => await GetAsync<List<MaintenanceSchedule>>("/schedules") ?? new();

        public async Task<MaintenanceSchedule?> CreateSchedule(object data)
            => await PostAsync<MaintenanceSchedule>("/schedules", data);

        // -- Export --
        public async Task<byte[]?> ExportMaintenance()
        {
            try
            {
                var resp = await _client.GetAsync($"{BaseUrl}/export/maintenance");
                if (resp.IsSuccessStatusCode)
                    return await resp.Content.ReadAsByteArrayAsync();
                return null;
            }
            catch { return null; }
        }

        // -- HTTP Helpers --
        private async Task<T?> GetAsync<T>(string endpoint)
        {
            try
            {
                var resp = await _client.GetStringAsync($"{BaseUrl}{endpoint}");
                return JsonConvert.DeserializeObject<T>(resp);
            }
            catch { return default; }
        }

        private async Task<T?> PostAsync<T>(string endpoint, object data)
        {
            try
            {
                var json = JsonConvert.SerializeObject(data);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var resp = await _client.PostAsync($"{BaseUrl}{endpoint}", content);
                var body = await resp.Content.ReadAsStringAsync();
                if (resp.IsSuccessStatusCode)
                    return JsonConvert.DeserializeObject<T>(body);
                return default;
            }
            catch { return default; }
        }

        private async Task<T?> PutAsync<T>(string endpoint, object data)
        {
            try
            {
                var json = JsonConvert.SerializeObject(data);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var resp = await _client.PutAsync($"{BaseUrl}{endpoint}", content);
                var body = await resp.Content.ReadAsStringAsync();
                if (resp.IsSuccessStatusCode)
                    return JsonConvert.DeserializeObject<T>(body);
                return default;
            }
            catch { return default; }
        }

        private async Task DeleteAsync(string endpoint)
        {
            try { await _client.DeleteAsync($"{BaseUrl}{endpoint}"); }
            catch { }
        }
    }
}

