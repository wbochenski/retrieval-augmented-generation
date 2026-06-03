from db import db
from model import model
from logger import get_logger
logger = get_logger(__name__)

def query(query: str, top_k: int = 5):
    query = "query: " + query
    query_emb = model.encode([query])[0].tolist()
    results = db.query(vector=query_emb, top_k=top_k)
    return results

