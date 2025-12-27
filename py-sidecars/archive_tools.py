
import sys
import argparse
import os
import json
import zipfile
import tarfile
import py7zr
import rarfile
import shutil

# Ensure we can handle 'rar' if available
try:
    rarfile.UNRAR_TOOL = "unrar"
except:
    pass

def extract_archive(args):
    """
    Extracts archive to destination.
    Supported: .zip, .tar, .tar.gz, .tgz, .gz, .7z, .rar
    """
    src = args.input_path
    dst = args.output_dir
    
    if not os.path.exists(dst):
        os.makedirs(dst)

    try:
        if zipfile.is_zipfile(src):
            with zipfile.ZipFile(src, 'r') as zf:
                zf.extractall(dst)
        elif tarfile.is_tarfile(src):
            with tarfile.open(src, 'r') as tf:
                tf.extractall(dst)
        elif src.endswith('.7z'):
            with py7zr.SevenZipFile(src, mode='r') as z:
                z.extractall(path=dst)
        elif src.lower().endswith('.rar'):
            with rarfile.RarFile(src) as rf:
                rf.extractall(dst)
        else:
             print("ERROR: Unsupported format")
             sys.exit(1)
             
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

def create_archive(args):
    """
    Creates an archive from a source folder or list of files.
    Format is determined by output extension or argument.
    """
    # args.inputs is a list of file/folder paths
    # args.output_path is the target archive file
    inputs = args.inputs
    output = args.output_path
    
    try:
        if output.endswith('.zip'):
            with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zf:
                for item in inputs:
                    if os.path.isdir(item):
                        for root, _, files in os.walk(item):
                            for file in files:
                                file_path = os.path.join(root, file)
                                arcname = os.path.relpath(file_path, os.path.dirname(item))
                                zf.write(file_path, arcname)
                    else:
                        zf.write(item, os.path.basename(item))
                        
        elif output.endswith('.tar') or output.endswith('.tar.gz') or output.endswith('.tgz'):
            mode = 'w:gz' if (output.endswith('gz') or output.endswith('tgz')) else 'w'
            with tarfile.open(output, mode) as tf:
                 for item in inputs:
                    tf.add(item, arcname=os.path.basename(item))
                    
        elif output.endswith('.7z'):
            with py7zr.SevenZipFile(output, 'w') as z:
                 for item in inputs:
                    z.writeall(item, os.path.basename(item))
        else:
            print("ERROR: Unsupported output format for creation")
            sys.exit(1)

        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

import tempfile

def convert_archive(args):
    """
    Converts archive from one format to another.
    Process: Extract to temp -> Create new archive from temp -> Delete temp
    """
    input_path = args.input_path
    output_path = args.output_path
    
    # 1. Create temp dir
    with tempfile.TemporaryDirectory() as temp_dir:
        # 2. Extract to temp
        try:
             # Reuse extract logic manually or call function? 
             # Manual is safer since arguments object differs
            if zipfile.is_zipfile(input_path):
                with zipfile.ZipFile(input_path, 'r') as zf:
                    zf.extractall(temp_dir)
            elif tarfile.is_tarfile(input_path):
                with tarfile.open(input_path, 'r') as tf:
                    tf.extractall(temp_dir)
            elif input_path.endswith('.7z'):
                with py7zr.SevenZipFile(input_path, mode='r') as z:
                    z.extractall(path=temp_dir)
            elif input_path.lower().endswith('.rar'):
                with rarfile.RarFile(input_path) as rf:
                    rf.extractall(temp_dir)
            else:
                 print("ERROR: Unsupported input format")
                 sys.exit(1)
        except Exception as e:
            print(f"ERROR: Extraction failed - {str(e)}")
            sys.exit(1)
            
        # 3. Create new archive from temp
        try:
            # Gather all files in temp_dir
            files_to_pack = []
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    files_to_pack.append(os.path.join(root, file))
            
            # Reuse creation logic
            if output_path.endswith('.zip'):
                with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                    for item in files_to_pack:
                        arcname = os.path.relpath(item, temp_dir)
                        zf.write(item, arcname)
            elif output_path.endswith('.tar') or output_path.endswith('.tar.gz') or output_path.endswith('.tgz'):
                mode = 'w:gz' if (output_path.endswith('gz') or output_path.endswith('tgz')) else 'w'
                with tarfile.open(output_path, mode) as tf:
                     for item in files_to_pack:
                        arcname = os.path.relpath(item, temp_dir)
                        tf.add(item, arcname=arcname)
            elif output_path.endswith('.7z'):
                with py7zr.SevenZipFile(output_path, 'w') as z:
                     for item in files_to_pack:
                        arcname = os.path.relpath(item, temp_dir)
                        z.write(item, arcname)
            else:
                print("ERROR: Unsupported output format")
                sys.exit(1)
                
            print("SUCCESS")
        except Exception as e:
            print(f"ERROR: Creation failed - {str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest='command')

    # Extract
    p_extract = subparsers.add_parser('extract')
    p_extract.add_argument('--input_path', required=True)
    p_extract.add_argument('--output_dir', required=True)
    p_extract.set_defaults(func=extract_archive)

    # Create
    p_create = subparsers.add_parser('create')
    p_create.add_argument('--inputs', nargs='+', required=True)
    p_create.add_argument('--output_path', required=True)
    p_create.set_defaults(func=create_archive)

    # Convert
    p_convert = subparsers.add_parser('convert')
    p_convert.add_argument('--input_path', required=True)
    p_convert.add_argument('--output_path', required=True)
    p_convert.set_defaults(func=convert_archive)

    args = parser.parse_args()
    if hasattr(args, 'func'):
        args.func(args)
    else:
        parser.print_help()
