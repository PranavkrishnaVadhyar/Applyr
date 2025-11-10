import os
from typing import List, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from sentence_transformers import SentenceTransformer
from qdrant_client.models import Distance, VectorParams, PointStruct, PayloadSchemaType
import uuid
from dotenv import load_dotenv


load_dotenv()


class ResumeVectorStore:
    """Manages resume storage in Qdrant vector database."""
    
    def __init__(self, api_key: str, endpoint: str, collection_name: str = "user_resumes"):
        """
        Initialize the Resume Vector Store.
        
        Args:
            api_key: Qdrant API key
            endpoint: Qdrant cluster endpoint
            collection_name: Name of the collection (default: "user_resumes")
        """
        self.collection_name = collection_name
        self.client = QdrantClient(url=endpoint, api_key=api_key)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.vector_size = 384  # Dimension for all-MiniLM-L6-v2
        
    def create_or_get_collection(self) -> bool:
        """
        Create a Qdrant collection named 'user_resumes' if it doesn't exist,
        or use the existing one.
        
        Returns:
            bool: True if collection exists or was created successfully
        """
        try:
            # Check if collection exists
            collections = self.client.get_collections().collections
            collection_exists = any(col.name == self.collection_name for col in collections)
            
            if collection_exists:
                print(f"Collection '{self.collection_name}' already exists. Using existing collection.")
                # Create index on user_id if it doesn't exist
                try:
                    self.client.create_payload_index(
                        collection_name=self.collection_name,
                        field_name="metadata.user_id",
                        field_schema=PayloadSchemaType.KEYWORD
                    )
                    print("Created index on metadata.user_id")
                except Exception as e:
                    # Index might already exist, which is fine
                    print(f"Index on metadata.user_id: {e}")
                return True
            
            # Create new collection
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=Distance.COSINE
                )
            )
            print(f"Collection '{self.collection_name}' created successfully.")
            
            # Create payload index for user_id filtering
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="metadata.user_id",
                field_schema=PayloadSchemaType.KEYWORD
            )
            print("Created index on metadata.user_id for efficient filtering.")
            
            return True
            
        except Exception as e:
            print(f"Error creating/accessing collection: {e}")
            return False
    
    def process_and_store_resume(
        self, 
        pdf_path: str, 
        user_id: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> bool:
        """
        Process a resume PDF and store it in Qdrant with user_id in metadata.
        
        Args:
            pdf_path: Path to the resume PDF file
            user_id: Unique identifier for the user
            chunk_size: Size of text chunks (default: 1000)
            chunk_overlap: Overlap between chunks (default: 200)
            
        Returns:
            bool: True if processing and storage were successful
        """
        try:
            # Ensure collection exists
            if not self.create_or_get_collection():
                return False
            
            # Load PDF
            print(f"Loading PDF from {pdf_path}...")
            loader = PyPDFLoader(pdf_path)
            documents = loader.load()
            
            # Split documents into chunks
            print("Splitting document into chunks...")
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len,
                separators=["\n\n", "\n", " ", ""]
            )
            splits = text_splitter.split_documents(documents)
            
            # Prepare points for Qdrant
            points = []
            print(f"Processing {len(splits)} chunks...")
            
            for i, split in enumerate(splits):
                # Add user_id to metadata
                metadata = split.metadata.copy()
                metadata["user_id"] = user_id
                metadata["chunk_index"] = i
                metadata["total_chunks"] = len(splits)
                
                # Generate embedding
                embedding = self.embedding_model.encode(split.page_content).tolist()
                
                # Create point
                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "text": split.page_content,
                        "metadata": metadata
                    }
                )
                points.append(point)
            
            # Upload to Qdrant
            print(f"Uploading {len(points)} vectors to Qdrant...")
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            print(f"Successfully stored resume for user_id: {user_id}")
            return True
            
        except Exception as e:
            print(f"Error processing resume: {e}")
            return False
    
    def search_resume(self, query: str, user_id: Optional[str] = None, limit: int = 5):
        """
        Search for resume content using semantic search.
        
        Args:
            query: Search query
            user_id: Optional user_id to filter results
            limit: Number of results to return
            
        Returns:
            List of search results
        """
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            
            query_vector = self.embedding_model.encode(query).tolist()
            
            query_filter = None
            if user_id:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key="metadata.user_id",
                            match=MatchValue(value=user_id)
                        )
                    ]
                )
            
            # Use query_points instead of deprecated search method
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                limit=limit,
                query_filter=query_filter,
                with_payload=True
            )
            
            return results.points
            
        except Exception as e:
            print(f"Error searching: {e}")
            return []


# Example usage
if __name__ == "__main__":
    # Configuration
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY") 
    QDRANT_ENDPOINT = os.getenv("QDRANT_ENDPOINT") 
    
    # Initialize the resume store
    resume_store = ResumeVectorStore(
        api_key=QDRANT_API_KEY,
        endpoint=QDRANT_ENDPOINT,
        collection_name="user_resumes"
    )
    
    # Function 1: Create or use collection
    resume_store.create_or_get_collection()
    
    # Function 2: Process and store a resume
    resume_store.process_and_store_resume(
        pdf_path="Gayathri_resume.pdf",
        user_id="user_12345"
    )
    
    # Optional: Search example
    results = resume_store.search_resume(
        query="Python developer with machine learning experience",
        user_id="user_12345"
    )
    for result in results:
        print(f"Score: {result.score}")
        print(f"Text: {result.payload['text'][:200]}...")
        print(f"Metadata: {result.payload['metadata']}")
        print("---")
