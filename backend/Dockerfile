FROM python:3.12.13-slim

WORKDIR /app

EXPOSE 5000

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
RUN apt-get update && apt-get install curl -y
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

ARG EMBEDDING_MODEL
ARG EMBEDDING_DIMENSION
ARG HF_TOKEN
ENV EMBEDDING_MODEL=${EMBEDDING_MODEL}
ENV EMBEDDING_DIMENSION=${EMBEDDING_DIMENSION}
ENV HF_TOKEN=${HF_TOKEN}

RUN python3 -c "from transformers import AutoTokenizer, AutoModel; \
AutoTokenizer.from_pretrained('${EMBEDDING_MODEL}'); \
AutoModel.from_pretrained('${EMBEDDING_MODEL}');"

COPY . .

CMD ["python3", "src/main.py"]