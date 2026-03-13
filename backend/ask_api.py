from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import faiss
import json
import numpy as np

app = FastAPI()

# Allow Next.js to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

index = faiss.read_index("data/faiss.index")
with open("data/meta.json", "r") as f:
    metadata = json.load(f)

class QueryRequest(BaseModel):
    question: str

def get_embedding(text):
    res = requests.post("http://localhost:11434/api/embeddings", json={"model": "nomic-embed-text", "prompt": text})
    return res.json()["embedding"]

@app.post("/ask")
def ask_question(request: QueryRequest):
    q_vec = np.array([get_embedding(request.question)]).astype("float32")
    distances, indices = index.search(q_vec, k=5)
    
    context = ""
    citations_set = set() # Use a set to avoid duplicate page numbers
    
    for idx in indices[0]:
        if idx < len(metadata): # Safety check
            chunk = metadata[idx]
            context += f"--- Page {chunk['page']} ---\n{chunk['text']}\n\n"
            citations_set.add(chunk['page'])
            
    # Convert back to a sorted list for the frontend
    citations = sorted(list(citations_set), key=lambda x: int(x) if str(x).isdigit() else x)
        
    prompt = f"""You are a professional, helpful administrative assistant for faculty at Georgia State University.
    Your goal is to provide accurate, clear, and concise answers based strictly on the provided handbook excerpts.

    CRITICAL RULES:
    1. Use ONLY the information contained in the Excerpts below.
    2. If the answer is not explicitly in the excerpts, you must say: "I could not find this specific information in the handbook excerpts provided." Do NOT guess or use outside knowledge.
    3. Format your answer to be highly readable. Use bullet points, bold text for key terms, and short paragraphs.
    4. Always mention the source page numbers in your response.

    Excerpts:
    {context}

    Question: {request.question}
    
    Professional Answer:"""
    
    res = requests.post("http://localhost:11434/api/generate", json={
        "model": "llama3.1:8b",
        "prompt": prompt,
        "stream": False
    })
    
    return {"answer": res.json()["response"], "citations": citations}