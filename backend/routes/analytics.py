from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
from datetime import datetime
from collections import defaultdict

from db.database import supabase
from core.security import get_current_user

router = APIRouter()


@router.get("/me")
async def get_user_analytics(current_user: UUID = Depends(get_current_user)):
    user_id = current_user

    # Fetch all applications for user
    response = (
        supabase
        .table("applications")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )

    if not response.data:
        return {
            "total_applications": 0,
            "success_rate": 0,
            "interviews": 0,
            "avg_response_time": 0,
            "applications_over_time": [],
            "status_breakdown": {},
            "top_companies": []
        }

    applications = response.data

    # -----------------------------
    # TOTAL APPLICATIONS
    # -----------------------------
    total_applications = len(applications)

    # -----------------------------
    # STATUS BREAKDOWN
    # -----------------------------
    status_counts = defaultdict(int)

    for app in applications:
        status = app.get("status", "unknown")
        status_counts[status] += 1

    # -----------------------------
    # SUCCESS RATE
    # success = interviews + offers
    # -----------------------------
    interviews = status_counts.get("interviewing", 0)
    offers = status_counts.get("offer", 0)

    success_rate = 0
    if total_applications > 0:
        success_rate = round(((interviews + offers) / total_applications) * 100, 2)

    # -----------------------------
    # APPLICATIONS OVER TIME
    # -----------------------------
    monthly_counts = defaultdict(int)

    for app in applications:
        applied_at = app.get("applied_at")
        if applied_at:
            dt = datetime.fromisoformat(applied_at)
            month = dt.strftime("%b")
            monthly_counts[month] += 1

    applications_over_time = [
        {"month": m, "count": c}
        for m, c in monthly_counts.items()
    ]

    # -----------------------------
    # TOP COMPANIES
    # -----------------------------
    company_counts = defaultdict(int)

    for app in applications:
        company = app.get("company_name")
        if company:
            company_counts[company] += 1

    top_companies = sorted(
        [{"company": k, "applications": v} for k, v in company_counts.items()],
        key=lambda x: x["applications"],
        reverse=True
    )[:5]

    # -----------------------------
    # AVG RESPONSE TIME
    # (applied_at -> updated_at)
    # -----------------------------
    total_days = 0
    response_count = 0

    for app in applications:
        applied = app.get("applied_at")
        updated = app.get("updated_at")

        if applied and updated:
            a = datetime.fromisoformat(applied)
            u = datetime.fromisoformat(updated)

            diff = (u - a).days
            if diff >= 0:
                total_days += diff
                response_count += 1

    avg_response_time = 0
    if response_count > 0:
        avg_response_time = round(total_days / response_count, 2)

    # -----------------------------
    # FINAL RESPONSE
    # -----------------------------
    return {
        "total_applications": total_applications,
        "success_rate": success_rate,
        "interviews": interviews,
        "avg_response_time": avg_response_time,
        "applications_over_time": applications_over_time,
        "status_breakdown": status_counts,
        "top_companies": top_companies
    }