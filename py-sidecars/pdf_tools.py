
import sys
import argparse
import fitz  # PyMuPDF
import json
import os

def merge_pdfs(args):
    try:
        inputs = args.inputs
        doc = fitz.open()
        for pdf_file in inputs:
            with fitz.open(pdf_file) as sub_doc:
                doc.insert_pdf(sub_doc)
        doc.save(args.output_path)
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

def rotate_pdf(args):
    try:
        doc = fitz.open(args.input_path)
        # Iterate over all pages and rotate
        for page in doc:
            # set_rotation rotates absolute, so we add to current if we want relative, 
            # but usually apps pass '90', '180' etc relative to current view or absolute. 
            # Requirement was "rotatePdf(path, degrees)". usually implied relative.
            # fitz.Page.set_rotation(angle) sets absolute rotation. 
            # PyMuPDF doesn't make relative rotation super obvious with set_rotation vs rotation property.
            # Let's assume the argument is "add this many degrees".
            page.set_rotation(page.rotation + int(args.degrees))
        doc.save(doc.name, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP) 
        # Incremental save to same file is usually fine for rotation
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

def split_pdf(args):
    try:
        doc = fitz.open(args.input_path)
        if not os.path.exists(args.output_dir):
            os.makedirs(args.output_dir)
        
        base_name = os.path.splitext(os.path.basename(args.input_path))[0]
        created_files = []

        for i in range(len(doc)):
            new_doc = fitz.open()
            new_doc.insert_pdf(doc, from_page=i, to_page=i)
            out_name = f"{base_name}_page_{i+1}.pdf"
            out_path = os.path.join(args.output_dir, out_name)
            new_doc.save(out_path)
            created_files.append(out_path)
            new_doc.close()
        
        # Print JSON list of files for the caller to parse
        print(json.dumps(created_files))
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

def extract_pages(args):
    try:
        doc = fitz.open(args.input_path)
        new_doc = fitz.open()
        
        # pages arg is a comma-separated string of INDICES (0-based) because helper handles parsing?
        # Or ranges? The frontend helper parses to an array of indices.
        # We'll receive a JSON string of indices or comma separated numbers.
        # Let's assume generic "1,2,5" string
        indices = [int(x) for x in args.pages.split(',')]
        
        for idx in indices:
            if 0 <= idx < len(doc):
                new_doc.insert_pdf(doc, from_page=idx, to_page=idx)
        
        new_doc.save(args.output_path)
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

def get_page_count(args):
    try:
        doc = fitz.open(args.input_path)
        print(len(doc)) # Just print the number
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

def compress_pdf(args):
    try:
        doc = fitz.open(args.input_path)
        doc.save(args.output_path, garbage=4, deflate=True)
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

def decrypt_pdf(args):
    try:
        doc = fitz.open(args.input_path)
        if doc.is_encrypted:
             # Just opening and saving decrypts if we have the right access (owner password often not needed for simple reading if user password is empty)
             pass 
        doc.save(args.output_path)
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest='command')

    # Merge
    p_merge = subparsers.add_parser('merge')
    p_merge.add_argument('--inputs', nargs='+', required=True)
    p_merge.add_argument('--output_path', required=True)
    p_merge.set_defaults(func=merge_pdfs)

    # Rotate
    p_rotate = subparsers.add_parser('rotate')
    p_rotate.add_argument('--input_path', required=True)
    p_rotate.add_argument('--degrees', required=True)
    p_rotate.set_defaults(func=rotate_pdf)

    # Split
    p_split = subparsers.add_parser('split')
    p_split.add_argument('--input_path', required=True)
    p_split.add_argument('--output_dir', required=True)
    p_split.set_defaults(func=split_pdf)

    # Extract
    p_extract = subparsers.add_parser('extract')
    p_extract.add_argument('--input_path', required=True)
    p_extract.add_argument('--pages', required=True) # comma separated indices
    p_extract.add_argument('--output_path', required=True)
    p_extract.set_defaults(func=extract_pages)

    # Count
    p_count = subparsers.add_parser('count')
    p_count.add_argument('--input_path', required=True)
    p_count.set_defaults(func=get_page_count)

    # Compress
    p_compress = subparsers.add_parser('compress')
    p_compress.add_argument('--input_path', required=True)
    p_compress.add_argument('--output_path', required=True)
    p_compress.set_defaults(func=compress_pdf)
    
    # Decrypt
    p_decrypt = subparsers.add_parser('decrypt')
    p_decrypt.add_argument('--input_path', required=True)
    p_decrypt.add_argument('--output_path', required=True)
    p_decrypt.set_defaults(func=decrypt_pdf)

    args = parser.parse_args()
    if hasattr(args, 'func'):
        args.func(args)
    else:
        parser.print_help()
