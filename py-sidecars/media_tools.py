
import sys
import argparse
import os
from PIL import Image

def convert_image(args):
    """
    Converts an image to a different format.
    """
    input_path = args.input_path
    output_path = args.output_path
    
    try:
        # Open image
        with Image.open(input_path) as img:
            # Convert RGBA to RGB if saving as JPEG (which doesn't support alpha)
            if output_path.lower().endswith('.jpg') or output_path.lower().endswith('.jpeg'):
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new(img.mode[:-1], img.size, (255, 255, 255))
                    background.paste(img, img.split()[-1])
                    img = background
                img = img.convert('RGB')
            
            # Save
            img.save(output_path)
            
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

    args = parser.parse_args()
    if hasattr(args, 'func'):
        args.func(args)
    else:
        parser.print_help()

def compress_image(args):
    """
    Compresses image to target size (approx).
    """
    input_path = args.input_path
    output_path = args.output_path
    target_size = int(args.target_size) # in bytes (handled as kb in frontend, passed as bytes)
    
    try:
        img = Image.open(input_path)
        
        # RGBA to RGB for JPEG
        if output_path.lower().endswith('.jpg') or output_path.lower().endswith('.jpeg'):
            if img.mode in ('RGBA', 'LA'):
                background = Image.new(img.mode[:-1], img.size, (255, 255, 255))
                background.paste(img, img.split()[-1])
                img = background
            img = img.convert('RGB')
            
        # Optimization loop for JPEG/WEBP
        if output_path.lower().endswith(('.jpg', '.jpeg', '.webp')):
            min_quality = 5
            max_quality = 95
            
            # Binary search for quality
            best_quality = max_quality
            
            for _ in range(7): # 7 steps covers 0-100 range reasonably well
                mid_quality = (min_quality + max_quality) // 2
                
                # Save to temp buffer to check size
                import io
                buf = io.BytesIO()
                img.save(buf, format='JPEG' if output_path.lower().endswith(('jpg', 'jpeg')) else 'WEBP', quality=mid_quality)
                size = buf.tell()
                
                if size <= target_size:
                    best_quality = mid_quality
                    min_quality = mid_quality + 1 # Try for better quality
                else:
                    max_quality = mid_quality - 1 # Need lower quality
            
            img.save(output_path, quality=best_quality)
        else:
            # PNG/BMP etc just save (compression not adjustable via quality)
            # PNG can use optimize=True
            img.save(output_path, optimize=True)
            
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

def images_to_pdf(args):
    """
    Combines multiple images into a single PDF.
    """
    input_paths = args.input_paths # List of strings
    output_path = args.output_path
    
    try:
        if not input_paths:
            raise ValueError("No input images provided")

        images = []
        for p in input_paths:
            img = Image.open(p)
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            images.append(img)
            
        if not images:
             raise ValueError("Failed to load images")

        # Save primary image with others appended
        first_image = images[0]
        other_images = images[1:]
        
        first_image.save(output_path, "PDF", resolution=100.0, save_all=True, append_images=other_images)
            
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest='command')

    # Convert Image
    p_img = subparsers.add_parser('convert_image')
    p_img.add_argument('--input_path', required=True)
    p_img.add_argument('--output_path', required=True)
    p_img.set_defaults(func=convert_image)

    # Compress Image
    p_comp = subparsers.add_parser('compress_image')
    p_comp.add_argument('--input_path', required=True)
    p_comp.add_argument('--output_path', required=True)
    p_comp.add_argument('--target_size', required=True) # Bytes
    p_comp.set_defaults(func=compress_image)
    
    # Images to PDF
    p_pdf = subparsers.add_parser('images_to_pdf')
    p_pdf.add_argument('input_paths', nargs='+', help='Input image paths')
    p_pdf.add_argument('--output_path', required=True)
    p_pdf.set_defaults(func=images_to_pdf)

    args = parser.parse_args()

    if hasattr(args, 'func'):
        args.func(args)
    else:
        parser.print_help()
