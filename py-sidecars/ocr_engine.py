import argparse
import sys
import os
import fitz  # PyMuPDF
from paddleocr import PPStructure, draw_structure_result, save_structure_res
from paddleocr.ppstructure.recovery.recovery_to_doc import sorted_layout_boxes, convert_info_docx
from PIL import Image
import cv2
import numpy as np

def convert_pdf_to_images(pdf_path):
    doc = fitz.open(pdf_path)
    images = []
    for page in doc:
        pix = page.get_pixmap()
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        images.append(img)
    return images

def main():
    parser = argparse.ArgumentParser(description="OCR Engine using PaddleOCR")
    parser.add_argument("--input_pdf_path", required=True, help="Path to input PDF")
    parser.add_argument("--output_docx_path", required=True, help="Path to output DOCX")
    args = parser.parse_args()

    if not os.path.exists(args.input_pdf_path):
        print(f"Error: Input file {args.input_pdf_path} not found")
        print("ERROR")
        sys.exit(1)

    try:
        # Initialize PaddleOCR PPStructure
        # table=True enables table recognition, ocr=True enables text recognition
        table_engine = PPStructure(show_log=True, table=True, ocr=True)

        images = convert_pdf_to_images(args.input_pdf_path)
        
        all_res = []
        for index, img in enumerate(images):
            result = table_engine(img)
            # save_structure_res(result, './output', f'page_{index}') # Optional: debug output

            h, w, _ = img.shape
            res = sorted_layout_boxes(result, w)
            all_res.append(res)
        
        convert_info_docx(images, all_res, args.output_docx_path)
        
        print("SUCCESS")

    except Exception as e:
        print(f"Exception: {e}")
        # print(traceback.format_exc()) # Uncomment for debugging
        print("ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()
