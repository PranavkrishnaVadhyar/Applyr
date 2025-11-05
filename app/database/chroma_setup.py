import chromadb
import chromadb.utils.embedding_functions as embedding_functions
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter 
import os


CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

load_dotenv()

try:
    ef = embedding_functions.HuggingFaceEmbeddingFunction(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
except Exception as e:
    print(f"Error initializing Gemini Embedding Function: {e}")
    


def setup_chroma():
    client = chromadb.PersistentClient(path="./vector_db")

    collection = client.create_collection(
        name="user_resumes",
        embedding_function = ef
    )

    print("Collection Created!")
    return collection


def add_resume(pdf, user_id, collection):
    
    loader = PyPDFLoader(pdf)
    initial_docs = loader.load()

    if not initial_docs:
        print(f"Warning: No content loaded from {pdf}. Skipping.")
        return

    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""]  
    )
    
    
    docs_after_split = text_splitter.split_documents(initial_docs) 
    
    print(f"Original pages: {len(initial_docs)}. Split into {len(docs_after_split)} chunks.")

    
    document_texts = []
    metadatas = []
    ids = []
    
    for i, doc in enumerate(docs_after_split):
        document_texts.append(doc.page_content)
        
        
        meta = doc.metadata.copy()
        meta["user_id"] = user_id 
        metadatas.append(meta)
        
        
        base_name = os.path.basename(pdf).replace('.', '_')
        ids.append(f"{user_id}_{base_name}_chunk_{i}")

    
    collection.add(
        documents=document_texts,
        metadatas=metadatas,
        ids=ids
    )

    print(f"Successfully added {len(docs_after_split)} chunks for User ID: {user_id} to ChromaDB.")


if __name__ == '__main__':
    collection = setup_chroma()
    add_resume('Gayathri_resume.pdf', 'UserGayu', collection)





