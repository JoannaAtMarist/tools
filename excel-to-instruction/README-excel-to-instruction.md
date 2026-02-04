# Excel -> Instruction Bytes Converter (and back)

This tool converts between:
- **Excel (.xlsx)** with a `Byte` column (one byte per row), and
- **Plain text (.txt)** containing instruction bytes (one byte per line).

It’s designed for workflows where you want a spreadsheet as a readable/editable source of truth, but still need a simple byte stream file for loading/running elsewhere. 

---  
<br>

## Install

From this tool folder:
```
npm install  
```
Dependency: xlsx  

--- 
<br>

## Usage

### Excel -> TXT (single file)
```
node index.js excel-to-txt "files/program.xlsx"
```  
Output:
- output/program.txt (same base filename as the Excel file)

### Excel -> TXT (batch: convert everything in ./files)
```
node index.js --all
```
What it does:
- Scans ./files
- Converts every .xlsx it finds (ignores Excel temp files like ~$something.xlsx)
- Writes one .txt per workbook into ./output

### TXT -> Excel
```
node index.js txt-to-excel "files/program.txt" "output/program.xlsx"
```
Output:
- A new .xlsx file with a Byte column filled (one row per byte)
Accepted .txt formats:
- One byte per line (A9 newline 00 newline FF)
- Space-separated (A9 00 FF)
- Comma-separated (A9,00,FF)
- Optional 0x prefix (0xA9 0x00 0xFF)  

--- 
<br>

## Spreadsheet format

### Required column
Your Excel sheet must include a header named exactly:
- Byte
Values in Byte should be hex bytes like:
- A9, 00, FF
Extra columns are allowed (labels, comments, addresses, etc.). They won’t affect export as long as Byte exists.  

--- 
<br>

## Tips

- Keep one byte per row in the Byte column.
- Prefer two-digit hex (0A instead of A) for consistency.
- If Excel creates temp files like ~$something.xlsx, ignore those (they’re not real inputs).  

--- 
<br>

## Output folder

Exports are written to:

- `./output/`

If it doesn’t exist, the tool will create it.

--- 
<br>
 