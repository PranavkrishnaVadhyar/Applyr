from fastapi import APIRouter

user_router = APIRouter(tags=["users"])

@user_router.get('/hello')
def hello():
    return "Hello!"