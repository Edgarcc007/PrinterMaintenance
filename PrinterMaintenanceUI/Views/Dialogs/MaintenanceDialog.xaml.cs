using System.Windows;
using System.Windows.Controls;
using PrinterMaintenanceUI.Models;

namespace PrinterMaintenanceUI.Views.Dialogs
{
    public partial class MaintenanceDialog : Window
    {
        private readonly bool _isEditMode;
        private readonly MaintenanceRecord? _existingRecord;

        public MaintenanceDialog(List<Printer> printers, List<MaintenanceCategory> categories)
        {
            InitializeComponent();
            _isEditMode = false;
            CmbPrinter.ItemsSource = printers;
            CmbCategory.ItemsSource = categories;
        }

        public MaintenanceDialog(List<Printer> printers, List<MaintenanceCategory> categories, MaintenanceRecord record)
        {
            InitializeComponent();
            _existingRecord = record;
            _isEditMode = record.Id > 0;

            CmbPrinter.ItemsSource = printers;
            CmbCategory.ItemsSource = categories;

            if (_isEditMode)
            {
                TxtTitle.Text = $"Edit Record #{record.Id}";
                BtnSave.Content = "Save Changes";
                Title = $"Edit Record #{record.Id}";
                CmbPrinter.IsEnabled = false;
                CmbCategory.IsEnabled = false;
            }
            else
            {
                TxtTitle.Text = "Perform Scheduled Maintenance";
                BtnSave.Content = "Record Maintenance";
                Title = "Perform Scheduled Maintenance";
            }

            CmbPrinter.SelectedValue = record.PrinterId;
            CmbCategory.SelectedValue = record.CategoryId;
            TxtPerformedBy.Text = record.PerformedBy ?? "";
            TxtDuration.Text = record.DurationMinutes?.ToString() ?? "";
            TxtFindings.Text = record.Findings ?? "";
            TxtActions.Text = record.ActionsTaken ?? "";
            TxtParts.Text = record.PartsReplaced ?? "";

            foreach (ComboBoxItem item in CmbType.Items)
            {
                if (item.Content.ToString() == record.Type)
                {
                    CmbType.SelectedItem = item;
                    break;
                }
            }

            foreach (ComboBoxItem item in CmbStatus.Items)
            {
                if (item.Content.ToString() == record.Status)
                {
                    CmbStatus.SelectedItem = item;
                    break;
                }
            }
        }

        private void Save_Click(object sender, RoutedEventArgs e)
        {
            if (CmbPrinter.SelectedValue == null || CmbCategory.SelectedValue == null ||
                string.IsNullOrWhiteSpace(TxtPerformedBy.Text))
            {
                MessageBox.Show("Printer, Category and Performed By are required.",
                    "Validation", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }
            DialogResult = true;
            Close();
        }

        public bool IsEditMode => _isEditMode;
        public int RecordId => _existingRecord?.Id ?? 0;

        public object GetRecordData()
        {
            string type = (CmbType.SelectedItem as ComboBoxItem)?.Content.ToString() ?? "Preventive";
            string status = (CmbStatus.SelectedItem as ComboBoxItem)?.Content.ToString() ?? "Completed";
            int? duration = int.TryParse(TxtDuration.Text, out int d) ? d : null;

            return new
            {
                printer_id = (int)CmbPrinter.SelectedValue!,
                category_id = (int)CmbCategory.SelectedValue!,
                type = type,
                performed_by = TxtPerformedBy.Text.Trim(),
                duration_minutes = duration,
                status = status,
                findings = string.IsNullOrWhiteSpace(TxtFindings.Text) ? null : TxtFindings.Text.Trim(),
                actions_taken = string.IsNullOrWhiteSpace(TxtActions.Text) ? null : TxtActions.Text.Trim(),
                parts_replaced = string.IsNullOrWhiteSpace(TxtParts.Text) ? null : TxtParts.Text.Trim()
            };
        }
    }
}
