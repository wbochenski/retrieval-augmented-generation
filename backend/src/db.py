from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os
import redis

EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", 384))

class Database:
    def __init__(self):
        self.redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)
        self.qdrant_client = QdrantClient(
            host="qdrant",
            port=6333
        )
        if not self.qdrant_client.collection_exists("main"):
            self.qdrant_client.create_collection(
                collection_name="main",
                vectors_config=VectorParams(size=EMBEDDING_DIMENSION, distance=Distance.COSINE)
            )
        self.last_id = 0

    def check_hash(self, hash: str, path: str):
        return self.redis_client.get(f"hash:{hash}") == path

    def remove_by_path(self, path: str):
        hash = self.redis_client.get(f"path:{path}")
        if hash:
            self.redis_client.delete(f"path:{path}")
            self.redis_client.delete(f"hash:{hash}")
        # find all points with this path in payload and delete them
        results = self.query(vector=[0.0] * EMBEDDING_DIMENSION, top_k=1000)
        ids_to_delete = [point.id for point in results if point.payload.get("source") == path]
        if ids_to_delete:
            self.qdrant_client.delete_points(
                collection_name="main",
                points_selector={"ids": ids_to_delete}
            )

    def add(self, vector: list[float], payload: dict, hash: str):
        path = payload["source"]
        self.redis_client.set(f"path:{path}", hash)
        self.redis_client.set(f"hash:{hash}", path)
        self.qdrant_client.upsert(
            collection_name="main",
            points=[
                {
                    "id": self.last_id,
                    "vector": vector,
                    "payload": payload
                }
            ]
        )
        self.last_id += 1

    def query(self, vector: list[float], top_k: int = 5):
        results = self.qdrant_client.query_points(
            collection_name="main",
            query=vector,
            limit=top_k
        )
        return results.points 
    
    def get_count(self):
        return self.qdrant_client.get_collection(collection_name="main").points_count
    
    def clean(self):
        self.redis_client.flushall()
        self.last_id = 0
        self.qdrant_client.delete_collection("main")
        self.qdrant_client.create_collection(
            collection_name="main",
            vectors_config=VectorParams(size=EMBEDDING_DIMENSION, distance=Distance.COSINE)
        )

db = Database()