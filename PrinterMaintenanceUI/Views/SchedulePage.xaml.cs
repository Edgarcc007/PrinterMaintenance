using System.Windows;
using System.Windows.Controls;
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
    }
}
