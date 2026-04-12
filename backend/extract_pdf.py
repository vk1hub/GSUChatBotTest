import pdfplumber
import os

faculty_pdf = "data/Faculty_Handbook.pdf"
faculty_out = "data/faculty_text.txt"

student_pdf = "data/STUDENT_COC.pdf"
student_out = "data/student_text.txt"

def extract_text(pdf_path, out_path):
    if not os.path.exists(pdf_path):
        print(f"ERROR: Could not find {pdf_path}")
        return
        
    print(f"Extracting {pdf_path}...")
    with pdfplumber.open(pdf_path) as pdf, open(out_path, "w", encoding="utf-8") as f:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                f.write(f"\n===== PAGE {i+1} =====\n{text}")
    print("Extraction complete. Saved to", out_path)

if __name__ == "__main__":
    extract_text(faculty_pdf, faculty_out)
    extract_text(student_pdf, student_out)