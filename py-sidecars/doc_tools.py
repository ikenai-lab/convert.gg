
import sys
import argparse
import platform
import subprocess
import os
from pathlib import Path

def convert_to_pdf(args):
    input_path = str(Path(args.input_path).resolve())
    output_path = str(Path(args.output_path).resolve())
    
    system = platform.system()
    
    # Strategy 1: docx2pdf (Best for Windows/Mac with Word installed)
    if system in ['Windows', 'Darwin']:
        try:
            from docx2pdf import convert
            # docx2pdf handles conversion to same folder usually, or specific path
            # It's a bit rigid, so we might need to move file after if names don't match
            # But usually convert(input, output) works
            convert(input_path, output_path)
            print("SUCCESS")
            return
        except Exception as e:
            # Fallthrough to LibreOffice
            pass

    # Strategy 2: LibreOffice (Best for Linux, or Win/Mac without Word)
    # Command: soffice --headless --convert-to pdf --outdir <dir> <input>
    # Note: LibreOffice saves to the outdir with the same basename. 
    # We might need to rename if output_path has different name.
    try:
        if system == 'Darwin':
            soffice_cmd = '/Applications/LibreOffice.app/Contents/MacOS/soffice'
        elif system == 'Windows':
            soffice_cmd = 'soffice' # Assumes in PATH
        else:
            soffice_cmd = 'soffice' # Linux
            
        out_dir = os.path.dirname(output_path)
        
        # Check if command exists (skip on Windows/Mac if path not absolute/known)
        subprocess.run([soffice_cmd, '--version'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            
        subprocess.run([
            soffice_cmd, 
            '--headless', 
            '--convert-to', 'pdf', 
            '--outdir', out_dir, 
            input_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Rename if necessary (LibreOffice saves as input_name.pdf)
        input_name = Path(input_path).stem
        created_pdf = Path(out_dir) / f"{input_name}.pdf"
        
        if str(created_pdf) != output_path and created_pdf.exists():
            if os.path.exists(output_path):
                os.remove(output_path)
            os.rename(created_pdf, output_path)
            
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: Conversion failed. Ensure Microsoft Word or LibreOffice is installed. Details: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest='command')

    # Convert to PDF
    p_conv = subparsers.add_parser('convert_to_pdf')
    p_conv.add_argument('--input_path', required=True)
    p_conv.add_argument('--output_path', required=True)
    p_conv.set_defaults(func=convert_to_pdf)

    args = parser.parse_args()
    if hasattr(args, 'func'):
        args.func(args)
    else:
        parser.print_help()
