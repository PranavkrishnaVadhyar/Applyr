from database import Base
from sqlalchemy import Column, Integer, String, TIMESTAMP, Boolean, text


class Users(Base):

    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, nullable=False)
    username = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    job_role = Column(String(255))
    mail = Column(String(255), unique=True, nullable=False)

