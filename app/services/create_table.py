# create_resume_db.py
import os
import sqlite3


DB_PATH = "resumes.db"


def initialize_database():
    """Creates resumes.db and inserts demo data if missing."""
    if os.path.exists(DB_PATH):
        print("✔ Database exists, skipping creation.")
        return

    print("⚠ Database not found — creating 'resumes.db'...")

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Create table
    c.execute("""
        CREATE TABLE resumes (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            skills TEXT,
            experience TEXT,
            knowledge TEXT,
            education TEXT,
            projects TEXT,
            certifications TEXT
        );
    """)

    # Insert demo record
    c.execute("""
        INSERT INTO resumes (
            user_id, name, skills, experience, knowledge, education, projects, certifications
        ) VALUES (
            'user_12345',
            'Pranavkrishna',
            'Python, FastAPI, NLP, LangChain, TensorFlow',
            'AI/ML Developer with 3 years experience in NLP and CV.',
            'Deep learning, SQL, cloud, LangChain, agents',
            'B.Tech CSE, Toc H Institute of Science and Technology',
            'Interview360, First Aid Pro, Traffic Optimization System',
            'Supervised ML by Andrew Ng'
        );
    """)

    conn.commit()
    conn.close()
    print("✔ Database created and populated successfully!")


if __name__ == "__main__":
    initialize_database()
