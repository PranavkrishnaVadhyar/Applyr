import chromadb
import chromadb.utils.embedding_functions as embedding_functions
from dotenv import load_dotenv
from langchain.core 

load_dotenv()



# Embedding model
huggingface_ef = embedding_functions.HuggingFaceEmbeddingFunction(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


def setup_chroma():
    client = chromadb.PersistentClient(path="./vector_db")

    collection = client.create_collection(
        name="user_resumes",
        embedding_function = huggingface_ef
    )

    print("Collection Created!")


def add_resume():
    pass

if __name__ == '__main__':
    setup_chroma()





