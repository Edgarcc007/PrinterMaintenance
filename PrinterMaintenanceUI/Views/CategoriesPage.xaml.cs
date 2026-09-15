using System.Windows;
using System.Windows.Controls;
using PrinterMaintenanceUI.Services;

namespace PrinterMaintenanceUI.Views
{
    public partial class CategoriesPage : Page
    {
        private readonly ApiService _api = new();

        public CategoriesPage()
        {
            InitializeComponent();
            Loaded += async (_, _) => await Load();
        }

        private async Task Load()
        {
            GridCategories.ItemsSource = await _api.GetCategories();
        }

        private async void Add_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrWhiteSpace(TxtName.Text))
            {
                MessageBox.Show("Name is required.", "Validation", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            string type = (CmbType.SelectedItem as ComboBoxItem)?.Content.ToString() ?? "Preventive";
            int? freq = int.TryParse(TxtFreq.Text, out int f) ? f : null;

            var result = await _api.CreateCategory(new
            {
                name = TxtName.Text.Trim(),
                type = type,
                description = string.IsNullOrWhiteSpace(TxtDesc.Text) ? null : TxtDesc.Text.Trim(),
                frequency_days = freq
            });

            if (result != null)
            {
                TxtName.Text = "";
                TxtDesc.Text = "";
                TxtFreq.Text = "";
                await Load();
            }
        }
    }
}
