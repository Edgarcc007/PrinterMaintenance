using System.Windows;
using System.Windows.Controls;
using PrinterMaintenanceUI.Models;

namespace PrinterMaintenanceUI.Views.Dialogs
{
    public partial class PrinterDialog : Window
    {
        private readonly Printer? _existing;

        public PrinterDialog(List<Location> locations, Printer? existing = null)
        {
            InitializeComponent();
            _existing = existing;

            CmbLocation.ItemsSource = locations;

            if (existing != null)
            {
                TxtTitle.Text = "Edit Printer";
                Title = "Edit Printer";
                TxtBrand.Text = existing.Brand;
                TxtModel.Text = existing.Model;
                TxtSerial.Text = existing.SerialNumber;
                TxtAssetTag.Text = existing.AssetTag ?? "";
                TxtIpAddress.Text = existing.IpAddress ?? "";
                TxtNotes.Text = existing.Notes ?? "";

                // Set location
                if (existing.LocationId.HasValue)
                    CmbLocation.SelectedValue = existing.LocationId.Value;

                // Set status
                foreach (ComboBoxItem item in CmbStatus.Items)
                {
                    if (item.Content.ToString() == existing.Status)
                    {
                        item.IsSelected = true;
                        break;
                    }
                }
            }
        }

        private void Save_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrWhiteSpace(TxtBrand.Text) ||
                string.IsNullOrWhiteSpace(TxtModel.Text) ||
                string.IsNullOrWhiteSpace(TxtSerial.Text))
            {
                MessageBox.Show("Brand, Model and Serial Number are required.",
                    "Validation", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            DialogResult = true;
            Close();
        }

        public object GetPrinterData()
        {
            int? locationId = CmbLocation.SelectedValue as int?;
            string status = (CmbStatus.SelectedItem as ComboBoxItem)?.Content.ToString() ?? "Active";

            return new
            {
                brand = TxtBrand.Text.Trim(),
                model = TxtModel.Text.Trim(),
                serial_number = TxtSerial.Text.Trim(),
                asset_tag = string.IsNullOrWhiteSpace(TxtAssetTag.Text) ? null : TxtAssetTag.Text.Trim(),
                ip_address = string.IsNullOrWhiteSpace(TxtIpAddress.Text) ? null : TxtIpAddress.Text.Trim(),
                location_id = locationId,
                status = status,
                notes = string.IsNullOrWhiteSpace(TxtNotes.Text) ? null : TxtNotes.Text.Trim()
            };
        }
    }
}
