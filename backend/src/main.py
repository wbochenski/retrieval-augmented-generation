from logger import get_logger
import uvicorn
logger = get_logger("main")
logger.info("Server starting...")

logger.info("Loading embedding model...")
import model
logger.info("Embedding model loaded!")

logger.info("Connecting to database...")
from db import db
logger.info(f"Database connected! ({db.get_count()} points)")

if __name__ == "__main__":
    logger.info("API is up!")
    uvicorn.run("api.api:app", host="0.0.0.0", port=5000, log_level="warning")