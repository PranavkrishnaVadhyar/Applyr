import chromadb
import chromadb.utils.embedding_functions as embedding_functions
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter 
import os 

# Define chunking parameters (best practice to define outside the function)
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

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


def add_resume(pdf, user_id):
    # 1. Load the PDF document
    loader = PyPDFLoader(pdf)
    initial_docs = loader.load()

    if not initial_docs:
        print(f"Warning: No content loaded from {pdf}. Skipping.")
        return

    # 2. Perform Recursive Character Text Splitting
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""]  # Default separators for good measure
    )
    
    # Split the documents into smaller chunks (the core change)
    docs_after_split = text_splitter.split_documents(initial_docs) 
    
    print(f"Original pages: {len(initial_docs)}. Split into {len(docs_after_split)} chunks.")

    # 3. Prepare data for ChromaDB from the *split* documents
    document_texts = []
    metadatas = []
    ids = []
    
    for i, doc in enumerate(docs_after_split):
        document_texts.append(doc.page_content)
        
        # Add the user_id to the existing metadata (source, page)
        meta = doc.metadata.copy()
        meta["user_id"] = user_id 
        metadatas.append(meta)
        
        # Create a unique ID incorporating user ID and chunk index
        base_name = os.path.basename(pdf).replace('.', '_')
        ids.append(f"{user_id}_{base_name}_chunk_{i}")


    # 4. Connect to the ChromaDB collection
    client = chromadb.PersistentClient(path="./vector_db") 
    collection = client.get_collection(
        name="user_resumes",
        embedding_function=huggingface_ef 
    )

    # 5. Add the documents (chunks) to the collection
    collection.add(
        documents=document_texts,
        metadatas=metadatas,
        ids=ids
    )

    print(f"Successfully added {len(docs_after_split)} chunks for User ID: {user_id} to ChromaDB.")


if __name__ == '__main__':
    add_resume('Gayathri_resume.pdf', 'UserGayu')





