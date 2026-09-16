using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using PrinterMaintenanceUI.Models;
using PrinterMaintenanceUI.Services;
using PrinterMaintenanceUI.Views.Dialogs;

namespace PrinterMaintenanceUI.Views
{
    public partial class PrintersPage : Page
    {
        private readonly ApiService _api = new();

        public PrintersPage()
        {
            InitializeComponent();
            Loaded += async (_, _) => await LoadPrinters();
        }

        private async Task LoadPrinters()
        {
            LoadingBar.Visibility = Visibility.Visible;
            try
            {
                string? status = null;
                if (CmbStatus.SelectedItem is ComboBoxItem item && item.Content.ToString() != "All Status")
                    status = item.Content.ToString();

                string? search = string.IsNullOrWhiteSpace(TxtSearch.Text) ? null : TxtSearch.Text.Trim();

                var printers = await _api.GetPrinters(status: status, search: search);
                GridPrinters.ItemsSource = printers;
                TxtCount.Text = $"{printers.Count} printer(s) found";
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error loading printers: {ex.Message}", "Error",
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                LoadingBar.Visibility = Visibility.Collapsed;
            }
        }

        private async void AddPrinter_Click(object sender, RoutedEventArgs e)
        {
            var locations = await _api.GetLocations();
            var dialog = new PrinterDialog(locations);
            dialog.Owner = Window.GetWindow(this);

            if (dialog.ShowDialog() == true)
            {
                var data = dialog.GetPrinterData();
                var result = await _api.CreatePrinter(data);
                if (result != null)
                    await LoadPrinters();
                else
                    MessageBox.Show("Failed to create printer.", "Error",
                        MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void EditPrinter_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is Printer printer)
                await OpenEditDialog(printer);
        }

        private async void EditPrinter_DoubleClick(object sender, MouseButtonEventArgs e)
        {
            if (GridPrinters.SelectedItem is Printer printer)
                await OpenEditDialog(printer);
        }

        private async Task OpenEditDialog(Printer printer)
        {
            var locations = await _api.GetLocations();
            var dialog = new PrinterDialog(locations, printer);
            dialog.Owner = Window.GetWindow(this);

            if (dialog.ShowDialog() == true)
            {
                var data = dialog.GetPrinterData();
                var result = await _api.UpdatePrinter(printer.Id, data);
                if (result != null)
                    await LoadPrinters();
                else
                    MessageBox.Show("Failed to update printer.", "Error",
                        MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void DeletePrinter_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is Printer printer)
            {
                var result = MessageBox.Show(
                    $"Delete printer {printer.Brand} {printer.Model} ({printer.SerialNumber})?",
                    "Confirm Delete", MessageBoxButton.YesNo, MessageBoxImage.Warning);

                if (result == MessageBoxResult.Yes)
                {
                    await _api.DeletePrinter(printer.Id);
                    await LoadPrinters();
                }
            }
        }

        private async void Filter_Changed(object sender, SelectionChangedEventArgs e)
        {
            if (IsLoaded) await LoadPrinters();
        }

        private async void Search_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter) await LoadPrinters();
        }
    }
}
