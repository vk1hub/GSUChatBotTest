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

faculty_index = faiss.read_index("data/faculty.index")
student_index = faiss.read_index("data/student.index")
web_index = faiss.read_index("data/web.index")
with open("data/faculty_meta.json", "r") as f:
    faculty_meta = json.load(f)
with open("data/student_meta.json", "r") as f:
    student_meta = json.load(f)
with open("data/web_meta.json", "r") as f:
    web_meta = json.load(f)

class QueryRequest(BaseModel):
    question: str

def get_embedding(text):
    res = requests.post("http://localhost:11434/api/embeddings", json={"model": "nomic-embed-text", "prompt": text})
    return res.json()["embedding"]

@app.post("/ask")
def ask_question(request: QueryRequest):
    q_vec = np.array([get_embedding(request.question)]).astype("float32")
    q = request.question.lower()

    if "office" in q or "hours" in q or "location" in q or "address" in q or "contact" in q:
        fac_k = 1
        stu_k = 1
        web_k = 8
    else:
        fac_k = 4
        stu_k = 4
        web_k = 5

    _, fac_idx = faculty_index.search(q_vec, k=fac_k)
    _, stu_idx = student_index.search(q_vec, k=stu_k)
    _, web_idx = web_index.search(q_vec, k=web_k)

    context = ""
    citations = []
    seen = set()

    for idx in fac_idx[0]:
        if idx < len(faculty_meta):
            chunk = faculty_meta[idx]
            context += f"--- Faculty Handbook, Page {chunk['page']} ---\n{chunk['text']}\n\n"
            key = ("Faculty Handbook", chunk['page'])
            if key not in seen:
                seen.add(key)
                citations.append({"source": "GSU Faculty Handbook", "page": chunk['page']})

    for idx in stu_idx[0]:
        if idx < len(student_meta):
            chunk = student_meta[idx]
            context += f"--- Student Code of Conduct, Page {chunk['page']} ---\n{chunk['text']}\n\n"
            key = ("Student Code of Conduct", chunk['page'])
            if key not in seen:
                seen.add(key)
                citations.append({"source": "GSU Student Code of Conduct", "page": chunk['page']})
    
    for idx in web_idx[0]:
        if idx < len(web_meta):
            chunk = web_meta[idx]
            context += f"--- GSU CS Website, Page {chunk['page']} ---\n{chunk['text']}\n\n"
            key = ("GSU CS Website", chunk['page'])
            if key not in seen:
                seen.add(key)
                citations.append({"source": "GSU CS Website", "page": chunk['page']})
        
    prompt = f"""You are a professional, helpful administrative assistant for Computer Science students and faculty at Georgia State University.
    Your goal is to provide accurate, clear, and concise answers based strictly on the provided handbook pages.
    If the user asks who you are, what you do, or what you are trained on, tell them you are an AI assistant trained on the GSU Faculty Handbook, GSU Student Code of Conduct, and GSU CS Department website.

    CRITICAL RULES:
    1. Use ONLY the information contained in the Excerpts below.
    2. If the answer is not explicitly in the pages, you must say: "I could not find this specific information in the handbook pages provided." Do NOT guess or use outside knowledge.
    3. Format your answer to be highly readable. Use bullet points, bold text for key terms, and short paragraphs.
    4. Always mention the source page numbers in your response.

    Pages:
    {context}

    Question: {request.question}
    
    Professional Answer:"""
    
    res = requests.post("http://localhost:11434/api/generate", json={
        "model": "llama3.1:8b",
        "prompt": prompt,
        "stream": False
    })
    
    return {"answer": res.json()["response"], "citations": citations}