using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Controls;
using PrinterMaintenanceUI.Services;

namespace PrinterMaintenanceUI.Views
{
    public partial class DashboardPage : Page, INotifyPropertyChanged
    {
        private readonly ApiService _api = new();
        private bool _isLoading;

        public bool IsLoading
        {
            get => _isLoading;
            set { _isLoading = value; OnPropertyChanged(); }
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        private void OnPropertyChanged([CallerMemberName] string? name = null)
            => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

        public DashboardPage()
        {
            InitializeComponent();
            this.Name = "ThisPage";
            this.DataContext = this;
            Loaded += async (_, _) => await LoadData();
        }

        private async Task LoadData()
        {
            IsLoading = true;
            CardError.Visibility = Visibility.Collapsed;

            try
            {
                var stats = await _api.GetDashboardStats();
                if (stats != null)
                {
                    TxtTotalPrinters.Text = stats.TotalPrinters.ToString();
                    TxtActive.Text = stats.ActivePrinters.ToString();
                    TxtInRepair.Text = stats.InRepair.ToString();
                    TxtOverdue.Text = stats.OverdueMaintenance.ToString();
                    TxtUpcoming.Text = stats.Upcoming7Days.ToString();
                    TxtCompleted.Text = stats.CompletedThisMonth.ToString();
                    TxtCorrective.Text = stats.CorrectiveThisMonth.ToString();
                }
                else
                {
                    ShowError("Could not connect to API. Is the backend running on port 8000?");
                }

                var overdue = await _api.GetOverduePrinters();
                if (overdue.Count > 0)
                {
                    GridOverdue.ItemsSource = overdue;
                    GridOverdue.Visibility = Visibility.Visible;
                    TxtNoOverdue.Visibility = Visibility.Collapsed;
                    TxtOverdueCount.Text = $"{overdue.Count} task(s)";
                }
                else
                {
                    GridOverdue.Visibility = Visibility.Collapsed;
                    TxtNoOverdue.Visibility = Visibility.Visible;
                    TxtOverdueCount.Text = "";
                }
            }
            catch (Exception ex)
            {
                ShowError($"Error: {ex.Message}");
            }
            finally
            {
                IsLoading = false;
            }
        }

        private void ShowError(string msg)
        {
            CardError.Visibility = Visibility.Visible;
            TxtError.Text = msg;
        }
    }
}
