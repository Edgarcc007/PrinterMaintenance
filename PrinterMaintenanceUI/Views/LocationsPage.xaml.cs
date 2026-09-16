using System.Windows;
using System.Windows.Controls;
using PrinterMaintenanceUI.Models;
using PrinterMaintenanceUI.Services;

namespace PrinterMaintenanceUI.Views
{
    public partial class LocationsPage : Page
    {
        private readonly ApiService _api = new();

        public LocationsPage()
        {
            InitializeComponent();
            Loaded += async (_, _) => await Load();
        }

        private async Task Load()
        {
            GridLocations.ItemsSource = await _api.GetLocations();
        }

        private async void Add_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrWhiteSpace(TxtName.Text))
            {
                MessageBox.Show("Name is required.", "Validation", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var result = await _api.CreateLocation(new
            {
                name = TxtName.Text.Trim(),
                description = string.IsNullOrWhiteSpace(TxtDesc.Text) ? null : TxtDesc.Text.Trim()
            });

            if (result != null)
            {
                TxtName.Text = "";
                TxtDesc.Text = "";
                await Load();
            }
        }

        private async void Delete_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is Location loc)
            {
                if (MessageBox.Show($"Delete location '{loc.Name}'?", "Confirm",
                    MessageBoxButton.YesNo, MessageBoxImage.Warning) == MessageBoxResult.Yes)
                {
                    await _api.DeleteLocation(loc.Id);
                    await Load();
                }
            }
        }
    }
}
