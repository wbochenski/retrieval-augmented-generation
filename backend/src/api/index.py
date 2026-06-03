import os
import unicodedata
import fitz  # PyMuPDF
from model import model
from db import db
from logger import get_logger
import logging
from langchain_experimental.text_splitter import SemanticChunker
from langchain_huggingface import HuggingFaceEmbeddings
import hashlib


logging.getLogger("pypdf").setLevel(logging.ERROR)
logger = get_logger(__name__)
import os

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-small")

embeddings = HuggingFaceEmbeddings(model_name=MODEL_NAME)
chunker = SemanticChunker(
    embeddings,
    breakpoint_threshold_type="percentile",
    breakpoint_threshold_amount=60,
)

def clean_text(text):
    text = unicodedata.normalize("NFC", text)
    text = text.replace("\u200b", "")
    text = text.replace("\xa0", " ")
    return text

def index():
    pdfs = [f for f in os.listdir("data") if f.endswith(".pdf")]
    logger.info(f"Found {len(pdfs)} PDF files to index.")

    for i, pdf in enumerate(pdfs):
        path = os.path.join("data", pdf)
        with open(path, "rb") as f:
            hash = hashlib.sha256(f.read()).hexdigest()

        if db.check_hash(hash, path):
            logger.info(f"[{i + 1}/{len(pdfs)}] Skipping '{pdf}' (already indexed).")
            continue
        db.remove_by_path(path)

        doc = fitz.open(path)
        full_text = ""
        for page in doc:
            full_text += page.get_text()
        doc.close()

        logger.info(f"[{i + 1}/{len(pdfs)}] Chunking '{pdf}'...")
        raw_chunks = chunker.create_documents([full_text])
        logger.info(f"Generated {len(raw_chunks)} chunks for '{pdf}'.")
                
        for i, c in enumerate(raw_chunks):
            chunk_text = clean_text(c)
            vector = model.encode(chunk_text)[0]
            payload = {"source": path, "page_from": 0, "page_to": 0, "text": chunk_text[9:]}

            db.add(vector=vector, payload=payload, hash=hash)
            logger.debug(f"Indexed chunk {i + 1}/{len(raw_chunks)} for '{pdf}'.")
    return len(pdfs)