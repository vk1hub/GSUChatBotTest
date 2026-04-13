import requests
import json
import faiss
import numpy as np

def get_embedding(text):
    text = text.replace("\n", " ")[:2000] 
    try:
        # Try new Ollama API endpoint
        res = requests.post("http://localhost:11434/api/embed", json={"model": "nomic-embed-text", "input": text})
        if res.status_code == 404:
            # Fallback to old endpoint
            res = requests.post("http://localhost:11434/api/embeddings", json={"model": "nomic-embed-text", "prompt": text})
        
        data = res.json()
        if "embeddings" in data: return data["embeddings"][0]
        if "embedding" in data: return data["embedding"]
    except Exception as e:
        print(f"Ollama Error: Make sure nomic-embed-text is pulled and running. {e}")
        return None

def build_index(text_file, index_file, meta_file, source_name):
    with open(text_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # if markers aren't there, treat the whole thing as one page
    if "===== PAGE " in content:
        pages = content.split("===== PAGE ")
    else:
        pages = ["0 =====" + content] # artificial marker for loop to work
    
    chunks = []
    metadata = []
    
    print(f"Generating embeddings for {source_name}...")
    for page in pages[1:] if "===== PAGE " in content else pages:
        parts = page.split(" =====", 1)
        if len(parts) == 2:
            page_num, text = parts
            
            # strip out the ascii characters 
            text = text.encode("ascii", "ignore").decode("ascii")
            text = text.strip()
            
            if len(text) > 50:
                chunks.append(text)
                metadata.append({"page": page_num, "text": text, "source": source_name})
    
    vectors = [get_embedding(chunk) for chunk in chunks if get_embedding(chunk) is not None]
    
    if not vectors:
        print(f"No embeddings generated for {source_name} - check that Ollama is running and the text file exists.")
        return
    
    vector_array = np.array(vectors).astype("float32")
    
    dimension = vector_array.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(vector_array)
    
    faiss.write_index(index, index_file)
    with open(meta_file, "w") as f:
        json.dump(metadata, f)
        
    print(f"Done. Built {len(vectors)} chunks for {source_name}.")

if __name__ == "__main__":
    build_index("data/faculty_text.txt", "data/faculty.index", "data/faculty_meta.json", "GSU Faculty Handbook")
    build_index("data/student_text.txt", "data/student.index", "data/student_meta.json", "GSU Student Code of Conduct")
    build_index("data/web_text.txt", "data/web.index", "data/web_meta.json", "GSU CS Website")
    print("All indexes built.")