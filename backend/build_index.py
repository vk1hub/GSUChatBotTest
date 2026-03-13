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

def build_index():
    with open("data/handbook_text.txt", "r", encoding="utf-8") as f:
        content = f.read()
    
    pages = content.split("===== PAGE ")
    chunks = []
    metadata = []
    
    print("Generating embeddings... this will take a moment.")
    for page in pages[1:]:
        parts = page.split(" =====", 1)
        if len(parts) == 2:
            page_num, text = parts
            text = text.strip()
            if len(text) > 50:
                chunks.append(text)
                metadata.append({"page": page_num, "text": text})
    
    vectors = [get_embedding(chunk) for chunk in chunks if get_embedding(chunk) is not None]
    vector_array = np.array(vectors).astype("float32")
    
    dimension = vector_array.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(vector_array)
    
    faiss.write_index(index, "data/faiss.index")
    with open("data/meta.json", "w") as f:
        json.dump(metadata, f)
        
    print(f"Success! Built database with {len(vectors)} chunks.")

if __name__ == "__main__":
    build_index()