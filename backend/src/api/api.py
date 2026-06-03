from logger import get_logger
from fastapi import FastAPI
from pydantic import BaseModel
from .index import index
from .query import query

from db import db

logger = get_logger(__name__)
app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/index")
def index_endpoint():
    i = index()
    return {"status": "ok", "indexed": i}

@app.post("/cleanup")
def cleanup():
    db.clean()
    return {"status": "ok"}

class QueryRequest(BaseModel):
    query: str
    top_k: int = 5
@app.post("/query")
def query_endpoint(body: QueryRequest):
    results = query(body.query, top_k=body.top_k)
    return {"status": "ok", "results": results}