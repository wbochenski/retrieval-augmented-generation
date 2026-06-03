import torch.nn.functional as F
from torch import Tensor
from transformers import AutoTokenizer, AutoModel
from transformers.utils.logging import disable_progress_bar
disable_progress_bar()
import os

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-small")

class EmbeddingModel:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        self.model = AutoModel.from_pretrained(MODEL_NAME)

    def average_pool(self, last_hidden_states: Tensor, attention_mask: Tensor) -> Tensor:
        last_hidden = last_hidden_states.masked_fill(~attention_mask[..., None].bool(), 0.0)
        return last_hidden.sum(dim=1) / attention_mask.sum(dim=1)[..., None]

    def encode(self, input_texts: list[str]) -> Tensor:
        batch_dict = self.tokenizer(input_texts, max_length=512, padding=True, truncation=True, return_tensors='pt')

        outputs = self.model(**batch_dict)
        embeddings = self.average_pool(outputs.last_hidden_state, batch_dict['attention_mask'])
        # embeddings = F.normalize(embeddings, p=2, dim=1)
        return embeddings.detach().cpu()

model = EmbeddingModel()