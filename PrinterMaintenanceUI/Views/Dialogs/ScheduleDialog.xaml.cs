using System.Windows;
using System.Windows.Controls;
using PrinterMaintenanceUI.Models;

namespace PrinterMaintenanceUI.Views.Dialogs
{
    public partial class ScheduleDialog : Window
    {
        public ScheduleDialog(List<Printer> printers, List<MaintenanceCategory> categories)
        {
            InitializeComponent();
            CmbPrinter.ItemsSource = printers;
            CmbCategory.ItemsSource = categories;
            DpNextDue.SelectedDate = DateTime.Today.AddDays(30);
        }

        private void Save_Click(object sender, RoutedEventArgs e)
        {
            if (CmbPrinter.SelectedValue == null || CmbCategory.SelectedValue == null ||
                !int.TryParse(TxtFrequency.Text, out _) || DpNextDue.SelectedDate == null)
            {
                MessageBox.Show("All fields are required. Frequency must be a number.",
                    "Validation", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }
            DialogResult = true;
            Close();
        }

        public object GetScheduleData()
        {
            return new
            {
                printer_id = (int)CmbPrinter.SelectedValue!,
                category_id = (int)CmbCategory.SelectedValue!,
                frequency_days = int.Parse(TxtFrequency.Text),
                next_due_date = DpNextDue.SelectedDate!.Value.ToString("yyyy-MM-dd")
            };
        }
    }
}
