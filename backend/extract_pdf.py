import pdfplumber
import os

pdf_path = "data/Faculty_Handbook.pdf"
out_path = "data/handbook_text.txt"

def extract_text():
    if not os.path.exists(pdf_path):
        print("ERROR: Please place Faculty_Handbook.pdf in the backend/data/ folder!")
        return
        
    print("Extracting text...")
    with pdfplumber.open(pdf_path) as pdf, open(out_path, "w", encoding="utf-8") as f:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                f.write(f"\n===== PAGE {i+1} =====\n{text}")
    print("Extraction complete. Saved to", out_path)

if __name__ == "__main__":
    extract_text()