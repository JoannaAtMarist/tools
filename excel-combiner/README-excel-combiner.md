# Excel Combiner (as Sheets)

Combines many `.xlsx` files into one workbook by placing each input file into its own sheet.

## Requirements
- Python 3.10+
- `pandas`
- `openpyxl`

Install:
```
pip install -r requirements.txt
```

## Usage

Put the .xlsx files you want to combine into a folder, then run:  
```
python combine-as-sheets.py --input "/path/to/folder" --output "Combined_Book.xlsx"
```

Notes:
- Skips Excel temp files that start with ~$
- Sheet names are truncated to 31 characters (Excel limit)