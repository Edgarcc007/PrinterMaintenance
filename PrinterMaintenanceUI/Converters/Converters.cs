using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;

namespace PrinterMaintenanceUI.Converters
{
    public class BoolToVisibilityConverter : IValueConverter
    {
        public object Convert(object value, Type t, object p, CultureInfo c)
            => value is true ? Visibility.Visible : Visibility.Collapsed;
        public object ConvertBack(object value, Type t, object p, CultureInfo c)
            => throw new NotImplementedException();
    }

    public class InverseBoolToVisibilityConverter : IValueConverter
    {
        public object Convert(object value, Type t, object p, CultureInfo c)
            => value is true ? Visibility.Collapsed : Visibility.Visible;
        public object ConvertBack(object value, Type t, object p, CultureInfo c)
            => throw new NotImplementedException();
    }

    public class StatusToColorConverter : IValueConverter
    {
        public object Convert(object value, Type t, object p, CultureInfo c)
        {
            return value?.ToString() switch
            {
                "Active" => new SolidColorBrush(Color.FromRgb(46, 125, 50)),
                "In Repair" => new SolidColorBrush(Color.FromRgb(245, 124, 0)),
                "Decommissioned" => new SolidColorBrush(Color.FromRgb(198, 40, 40)),
                "Completed" => new SolidColorBrush(Color.FromRgb(46, 125, 50)),
                "Pending" => new SolidColorBrush(Color.FromRgb(245, 124, 0)),
                "In Progress" => new SolidColorBrush(Color.FromRgb(21, 101, 192)),
                _ => new SolidColorBrush(Colors.Gray)
            };
        }
        public object ConvertBack(object value, Type t, object p, CultureInfo c)
            => throw new NotImplementedException();
    }

    public class DaysToColorConverter : IValueConverter
    {
        public object Convert(object value, Type t, object p, CultureInfo c)
        {
            if (value is int days)
            {
                if (days < 0) return new SolidColorBrush(Color.FromRgb(198, 40, 40));
                if (days <= 3) return new SolidColorBrush(Color.FromRgb(245, 124, 0));
                if (days <= 7) return new SolidColorBrush(Color.FromRgb(249, 168, 37));
                return new SolidColorBrush(Color.FromRgb(46, 125, 50));
            }
            return new SolidColorBrush(Colors.Gray);
        }
        public object ConvertBack(object value, Type t, object p, CultureInfo c)
            => throw new NotImplementedException();
    }

    public class NullToVisibilityConverter : IValueConverter
    {
        public object Convert(object value, Type t, object p, CultureInfo c)
            => value != null ? Visibility.Visible : Visibility.Collapsed;
        public object ConvertBack(object value, Type t, object p, CultureInfo c)
            => throw new NotImplementedException();
    }


    public class StatusToVisibilityConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
        {
            return value?.ToString() == "In Progress" ? Visibility.Visible : Visibility.Collapsed;
        }

        public object ConvertBack(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
            => throw new NotImplementedException();
    }
}
