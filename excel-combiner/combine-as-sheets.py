import argparse
import pandas as pd
import glob
import os

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Folder containing .xlsx files")
    parser.add_argument("--output", default="Combined_Book.xlsx", help="Output workbook filename/path")
    args = parser.parse_args()

    folder = os.path.abspath(args.input)
    output = os.path.abspath(args.output)

    excel_files = [
        f for f in glob.glob(os.path.join(folder, "*.xlsx"))
        if not os.path.basename(f).startswith("~$")
    ]

    if not excel_files:
        raise SystemExit(f"No .xlsx files found in: {folder}")

    with pd.ExcelWriter(output) as writer:
        for file in excel_files:
            name = os.path.splitext(os.path.basename(file))[0][:31]
            print(f"Adding {name} ...")
            df = pd.read_excel(file)
            df.to_excel(writer, sheet_name=name, index=False)

    print(f"\nDone! Created: {output}")

if __name__ == "__main__":
    main()