using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using PrinterMaintenanceUI.Models;
using PrinterMaintenanceUI.Services;
using PrinterMaintenanceUI.Views.Dialogs;

namespace PrinterMaintenanceUI.Views
{
    public partial class SchedulePage : Page
    {
        private readonly ApiService _api = new();

        public SchedulePage()
        {
            InitializeComponent();
            Loaded += async (_, _) => await Load();
        }

        private async Task Load()
        {
            var schedules = await _api.GetSchedules();
            GridSchedules.ItemsSource = schedules;
            TxtCount.Text = $"{schedules.Count} schedule(s)";
        }

        private async void AddSchedule_Click(object sender, RoutedEventArgs e)
        {
            var printers = await _api.GetPrinters();
            var categories = await _api.GetCategories(type: "Preventive");
            var dialog = new ScheduleDialog(printers, categories);
            dialog.Owner = Window.GetWindow(this);

            if (dialog.ShowDialog() == true)
            {
                var data = dialog.GetScheduleData();
                var result = await _api.CreateSchedule(data);
                if (result != null)
                    await Load();
                else
                    MessageBox.Show("Failed to create schedule.", "Error",
                        MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void PerformMaintenance_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is MaintenanceSchedule schedule)
            {
                await OpenPerformDialog(schedule);
            }
        }

        private async void GridSchedules_MouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            if (GridSchedules.SelectedItem is MaintenanceSchedule schedule)
            {
                await OpenPerformDialog(schedule);
            }
        }

        private async Task OpenPerformDialog(MaintenanceSchedule schedule)
        {
            var printers = await _api.GetPrinters();
            var categories = await _api.GetCategories();

            var prefill = new MaintenanceRecord
            {
                PrinterId = schedule.PrinterId,
                CategoryId = schedule.CategoryId,
                Type = "Preventive",
                Status = "Completed"
            };

            var dialog = new MaintenanceDialog(printers, categories, prefill);
            dialog.Owner = Window.GetWindow(this);

            if (dialog.ShowDialog() == true)
            {
                var data = dialog.GetRecordData();
                var result = await _api.CreateRecord(data);
                if (result != null)
                {
                    MessageBox.Show("Maintenance recorded successfully!",
                        "Success", MessageBoxButton.OK, MessageBoxImage.Information);
                    await Load();
                }
                else
                {
                    MessageBox.Show("Failed to create record.", "Error",
                        MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }
    }
}
