from collections import Counter

from sqlalchemy import func, select

from app.db.models import Application, Internship, Recruiter, SkillGapReport, Student
from app.db.postgres import get_session


async def overview() -> dict:
    """Institution-wide placement metrics for the admin dashboard."""
    async with get_session() as session:
        students = (await session.execute(select(Student))).scalars().all()
        internships = (await session.execute(select(Internship))).scalars().all()
        applications = (await session.execute(select(Application))).scalars().all()
        recruiter_count = (await session.execute(select(func.count()).select_from(Recruiter))).scalar_one()

    scored = [s.readiness_score for s in students if isinstance(s.readiness_score, (int, float))]
    avg_readiness = round(sum(scored) / len(scored), 1) if scored else 0

    status_counts = Counter(a.status or "applied" for a in applications)
    hired = status_counts.get("hired", 0)

    return {
        "totals": {
            "students": len(students),
            "internships": len(internships),
            "applications": len(applications),
            "recruiters": recruiter_count,
            "hired": hired,
        },
        "avg_readiness_score": avg_readiness,
        "profiles_analyzed": len(scored),
        "placement_rate": round(hired / len(students) * 100, 1) if students else 0,
        "application_status": [
            {"status": status, "count": count} for status, count in sorted(status_counts.items())
        ],
    }


async def branch_breakdown() -> list[dict]:
    """Per-branch student counts and average readiness — the department skill-gap view."""
    async with get_session() as session:
        students = (await session.execute(select(Student))).scalars().all()

    buckets: dict[str, list] = {}
    for student in students:
        branch = student.branch or "Unspecified"
        buckets.setdefault(branch, []).append(student)

    rows = []
    for branch, group in buckets.items():
        scores = [s.readiness_score for s in group if isinstance(s.readiness_score, (int, float))]
        rows.append(
            {
                "branch": branch,
                "students": len(group),
                "avg_readiness": round(sum(scores) / len(scores), 1) if scores else 0,
                "analyzed": len(scores),
            }
        )
    return sorted(rows, key=lambda r: r["students"], reverse=True)


async def generate_skill_gap_report(limit: int = 12) -> dict:
    """Compare skills students have against skills employers ask for, and persist the report.

    Each gap entry embeds the actual internships driving that skill's demand (id, title,
    company, location) so the placement cell can trace a gap back to the postings causing it.
    """
    async with get_session() as session:
        students = (await session.execute(select(Student))).scalars().all()
        internships = (await session.execute(select(Internship))).scalars().all()

        supply = Counter(_norm(s) for student in students for s in (student.skills or []))
        demand = Counter(_norm(s) for job in internships for s in (job.required_skills or []))

        # Map each normalised skill to the internships that require it.
        internships_by_skill: dict[str, list[dict]] = {}
        for job in internships:
            job_ref = {
                "internship_id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "status": job.status,
            }
            for skill in job.required_skills or []:
                internships_by_skill.setdefault(_norm(skill), []).append(job_ref)

        gaps = [
            {
                "skill": skill,
                "demand": count,
                "supply": supply.get(skill, 0),
                "gap": count - supply.get(skill, 0),
                "internships": internships_by_skill.get(skill, []),
            }
            for skill, count in demand.items()
        ]
        gaps = sorted(gaps, key=lambda g: g["gap"], reverse=True)[:limit]

        report = SkillGapReport(
            top_student_skills=[{"skill": k, "count": v} for k, v in supply.most_common(limit)],
            top_demanded_skills=[{"skill": k, "count": v} for k, v in demand.most_common(limit)],
            skill_gaps=gaps,
        )
        session.add(report)
        await session.commit()
        await session.refresh(report)
        return report.to_dict()


async def latest_skill_gap_report() -> dict | None:
    async with get_session() as session:
        result = await session.execute(select(SkillGapReport).order_by(SkillGapReport.created_at.desc()).limit(1))
        report = result.scalar_one_or_none()
        return report.to_dict() if report else None


async def list_skill_gap_reports(limit: int = 20) -> list[dict]:
    async with get_session() as session:
        result = await session.execute(
            select(SkillGapReport).order_by(SkillGapReport.created_at.desc()).limit(limit)
        )
        return [r.to_dict() for r in result.scalars().all()]


def _norm(skill: str) -> str:
    return skill.strip().title()
