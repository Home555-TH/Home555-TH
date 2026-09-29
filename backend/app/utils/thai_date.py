from datetime import datetime

THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
               'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

THAI_MONTHS_SHORT = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                     'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

def to_buddhist_year(year: int) -> int:
    """Convert CE year to Buddhist year"""
    return year + 543

def format_thai_date(date_obj, short=True):
    """Format date in Thai format (e.g., '15 มีนาคม 2568')"""
    if isinstance(date_obj, str):
        date_obj = datetime.fromisoformat(date_obj)

    day = date_obj.day
    month_list = THAI_MONTHS_SHORT if short else THAI_MONTHS
    month = month_list[date_obj.month]
    year = to_buddhist_year(date_obj.year)

    return f"{day} {month} {year}"

def format_month_year_thai(month_year: str):
    """Format 'YYYY-MM' to Thai format (e.g., 'มีนาคม 2568')"""
    if not month_year:
        return ""

    try:
        year, month = month_year.split('-')
        year = int(year)
        month = int(month)

        month_name = THAI_MONTHS[month]
        thai_year = to_buddhist_year(year)

        return f"{month_name} {thai_year}"
    except:
        return month_year
