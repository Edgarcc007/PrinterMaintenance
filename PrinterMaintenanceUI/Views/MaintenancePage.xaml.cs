using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using PrinterMaintenanceUI.Models;
using PrinterMaintenanceUI.Services;
using PrinterMaintenanceUI.Views.Dialogs;

namespace PrinterMaintenanceUI.Views
{
    public partial class MaintenancePage : Page
    {
        private readonly ApiService _api = new();

        public MaintenancePage()
        {
            InitializeComponent();
            Loaded += async (_, _) => await Load();
        }

        private async Task Load()
        {
            string? type = null;
            if (CmbType.SelectedItem is ComboBoxItem item && item.Content.ToString() != "All Types")
                type = item.Content.ToString();

            var records = await _api.GetRecords(type: type);
            GridRecords.ItemsSource = records;
            TxtCount.Text = $"{records.Count} record(s)";
        }

        private async void AddRecord_Click(object sender, RoutedEventArgs e)
        {
            var printers = await _api.GetPrinters();
            var categories = await _api.GetCategories();
            var dialog = new MaintenanceDialog(printers, categories);
            dialog.Owner = Window.GetWindow(this);

            if (dialog.ShowDialog() == true)
            {
                var data = dialog.GetRecordData();
                var result = await _api.CreateRecord(data);
                if (result != null)
                    await Load();
                else
                    MessageBox.Show("Failed to create record.", "Error",
                        MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void GridRecords_MouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            if (GridRecords.SelectedItem is not MaintenanceRecord record) return;

            var printers = await _api.GetPrinters();
            var categories = await _api.GetCategories();
            var dialog = new MaintenanceDialog(printers, categories, record);
            dialog.Owner = Window.GetWindow(this);

            if (dialog.ShowDialog() == true)
            {
                var data = dialog.GetRecordData();
                var result = await _api.UpdateRecord(record.Id, data);
                if (result != null)
                    await Load();
                else
                    MessageBox.Show("Failed to update record.", "Error",
                        MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void Filter_Changed(object sender, SelectionChangedEventArgs e)
        {
            if (IsLoaded) await Load();
        }

        private async void CompleteRecord_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is int recordId)
            {
                var confirm = MessageBox.Show(
                    "Mark this maintenance record as Completed?",
                    "Confirm", MessageBoxButton.YesNo, MessageBoxImage.Question);

                if (confirm == MessageBoxResult.Yes)
                {
                    var result = await _api.UpdateRecord(recordId, new { status = "Completed" });
                    if (result != null)
                        await Load();
                    else
                        MessageBox.Show("Failed to update record.", "Error",
                            MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }
    }
}
