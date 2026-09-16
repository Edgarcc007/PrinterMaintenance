using System.Windows;
using System.Windows.Controls;

namespace PrinterMaintenanceUI.Views
{
    public partial class MainWindow : Window
    {
        private readonly Dictionary<string, Button> _navButtons;
        private string _currentPage = "Dashboard";

        public MainWindow()
        {
            InitializeComponent();

            _navButtons = new Dictionary<string, Button>
            {
                { "Dashboard", BtnDashboard },
                { "Printers", BtnPrinters },
                { "Maintenance", BtnMaintenance },
                { "Schedule", BtnSchedule },
                { "Locations", BtnLocations },
                { "Categories", BtnCategories }
            };

            NavigateTo("Dashboard");
        }

        private void Navigate_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is string page)
                NavigateTo(page);
        }

        private void Refresh_Click(object sender, RoutedEventArgs e)
        {
            NavigateTo(_currentPage);
        }

        private void NavigateTo(string page)
        {
            _currentPage = page;
            TxtPageTitle.Text = page;

            // Update sidebar styles
            foreach (var kvp in _navButtons)
            {
                kvp.Value.Style = kvp.Key == page
                    ? (Style)FindResource("SidebarButtonActive")
                    : (Style)FindResource("SidebarButton");
            }

            // Navigate
            Page? target = page switch
            {
                "Dashboard" => new DashboardPage(),
                "Printers" => new PrintersPage(),
                "Maintenance" => new MaintenancePage(),
                "Schedule" => new SchedulePage(),
                "Locations" => new LocationsPage(),
                "Categories" => new CategoriesPage(),
                _ => null
            };

            if (target != null)
                MainFrame.Navigate(target);
        }
    }
}
