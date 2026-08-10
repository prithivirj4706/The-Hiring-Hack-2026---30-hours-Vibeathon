"""Seed the database with demo accounts, internships and applications.

Usage:
    python seed.py            # reset + seed base data
    python seed.py --ai       # also run real LLM resume analysis on seeded students

All demo accounts use the password: demo1234
"""

import argparse
import asyncio

from sqlalchemy import delete, select

from app.core.security import hash_password
from app.db.models import Application, Internship, Recommendation, Recruiter, SkillGapReport, Student, User
from app.db.postgres import close_engine, get_session, init_db, ping

PASSWORD = "demo1234"

STUDENTS = [
    {
        "name": "Ananya Mishra",
        "email": "ananya@bput.ac.in",
        "branch": "CSE",
        "year": 3,
        "cgpa": 8.6,
        "skills": ["Python", "Django", "PostgreSQL", "Docker"],
        "projects": ["Campus food delivery API", "Attendance tracker with face recognition"],
        "certifications": ["AWS Cloud Practitioner"],
        "interests": ["Backend Engineering", "Cloud"],
        "resume_text": (
            "Ananya Mishra — B.Tech CSE, BPUT (2027). CGPA 8.6.\n"
            "Skills: Python, Django, REST APIs, PostgreSQL, Docker, Git, Linux.\n"
            "Projects: Campus food delivery API serving 1200 students using Django REST Framework "
            "and PostgreSQL; Attendance tracker using OpenCV face recognition deployed on a Raspberry Pi.\n"
            "Certifications: AWS Certified Cloud Practitioner.\n"
            "Internship: Backend intern at a local startup for 3 months, built payment reconciliation jobs."
        ),
    },
    {
        "name": "Rohit Panda",
        "email": "rohit@bput.ac.in",
        "branch": "CSE",
        "year": 4,
        "cgpa": 7.9,
        "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
        "projects": ["Real-time chat app", "E-commerce storefront"],
        "certifications": ["Meta Front-End Developer"],
        "interests": ["Frontend", "Full Stack"],
        "resume_text": (
            "Rohit Panda — B.Tech CSE, BPUT (2026). CGPA 7.9.\n"
            "Skills: JavaScript, TypeScript, React, Redux, Node.js, Express, MongoDB, Tailwind CSS.\n"
            "Projects: Real-time chat application with Socket.io supporting 500 concurrent users; "
            "E-commerce storefront with Stripe checkout and admin dashboard.\n"
            "Certifications: Meta Front-End Developer Professional Certificate.\n"
            "Freelance: built three small business websites."
        ),
    },
    {
        "name": "Sneha Sahoo",
        "email": "sneha@bput.ac.in",
        "branch": "ECE",
        "year": 3,
        "cgpa": 9.1,
        "skills": ["C", "Embedded C", "VHDL", "MATLAB"],
        "projects": ["IoT air quality monitor", "FPGA based traffic controller"],
        "certifications": ["NPTEL Embedded Systems"],
        "interests": ["Embedded Systems", "IoT"],
        "resume_text": (
            "Sneha Sahoo — B.Tech ECE, BPUT (2027). CGPA 9.1.\n"
            "Skills: C, Embedded C, VHDL, Verilog, MATLAB, ARM Cortex-M, I2C/SPI protocols.\n"
            "Projects: IoT air quality monitor with ESP32 publishing to an MQTT broker and a "
            "Grafana dashboard; FPGA based four-way traffic light controller written in VHDL.\n"
            "Certifications: NPTEL Embedded Systems Design (Elite).\n"
            "Winner, state level electronics hackathon 2025."
        ),
    },
    {
        "name": "Debasish Nayak",
        "email": "debasish@bput.ac.in",
        "branch": "CSE",
        "year": 4,
        "cgpa": 8.2,
        "skills": ["Python", "Pandas", "scikit-learn", "SQL"],
        "projects": ["Crop yield prediction model", "Customer churn dashboard"],
        "certifications": ["Google Data Analytics"],
        "interests": ["Data Science", "Machine Learning"],
        "resume_text": (
            "Debasish Nayak — B.Tech CSE, BPUT (2026). CGPA 8.2.\n"
            "Skills: Python, Pandas, NumPy, scikit-learn, SQL, Power BI, statistics.\n"
            "Projects: Crop yield prediction using gradient boosting on Odisha agriculture data "
            "(R2 0.84); Customer churn dashboard in Power BI over a 50k row telecom dataset.\n"
            "Certifications: Google Data Analytics Professional Certificate.\n"
            "Published a college journal paper on rainfall forecasting."
        ),
    },
    {
        "name": "Priyanka Behera",
        "email": "priyanka@bput.ac.in",
        "branch": "IT",
        "year": 2,
        "cgpa": 7.4,
        "skills": ["HTML", "CSS", "JavaScript"],
        "projects": ["Portfolio website"],
        "certifications": [],
        "interests": ["Web Development", "UI Design"],
        "resume_text": (
            "Priyanka Behera — B.Tech IT, BPUT (2028). CGPA 7.4.\n"
            "Skills: HTML, CSS, basic JavaScript, Figma.\n"
            "Projects: Personal portfolio website built with HTML/CSS; college fest poster designs.\n"
            "Currently learning React through an online course. No internship experience yet."
        ),
    },
    {
        "name": "Manoj Swain",
        "email": "manoj@bput.ac.in",
        "branch": "MECH",
        "year": 4,
        "cgpa": 7.1,
        "skills": ["AutoCAD", "SolidWorks", "ANSYS"],
        "projects": ["Go-kart chassis design", "Heat exchanger simulation"],
        "certifications": ["SolidWorks Associate"],
        "interests": ["Design Engineering", "CAD"],
        "resume_text": (
            "Manoj Swain — B.Tech Mechanical, BPUT (2026). CGPA 7.1.\n"
            "Skills: AutoCAD, SolidWorks, ANSYS, GD&T, thermodynamics, basic Python.\n"
            "Projects: Designed and fabricated a go-kart chassis for SAE India event; "
            "CFD simulation of a shell-and-tube heat exchanger in ANSYS Fluent.\n"
            "Certifications: Certified SolidWorks Associate."
        ),
    },
]

RECRUITERS = [
    {"name": "Kavita Rao", "email": "kavita@technova.com", "company": "TechNova Solutions"},
    {"name": "Arjun Mehta", "email": "arjun@datasphere.io", "company": "DataSphere Analytics"},
]

INTERNSHIPS = [
    {
        "recruiter_email": "kavita@technova.com",
        "title": "Backend Developer Intern",
        "description": (
            "Build and maintain REST APIs for our logistics platform. You will work with Python "
            "and Django, design PostgreSQL schemas, write tests, and help containerize services "
            "with Docker. Mentorship provided; ideal for a pre-final year student."
        ),
        "location": "Bhubaneswar (Hybrid)",
        "stipend": "₹18,000/month",
        "duration": "6 months",
        "required_skills": ["Python", "Django", "PostgreSQL", "Docker", "REST APIs"],
    },
    {
        "recruiter_email": "kavita@technova.com",
        "title": "Frontend Engineer Intern",
        "description": (
            "Ship user-facing features in React and TypeScript for our customer dashboard. "
            "You will translate Figma designs into responsive components with Tailwind CSS and "
            "integrate REST APIs. Strong JavaScript fundamentals required."
        ),
        "location": "Remote",
        "stipend": "₹15,000/month",
        "duration": "3 months",
        "required_skills": ["JavaScript", "React", "Tailwind CSS", "TypeScript", "Git"],
    },
    {
        "recruiter_email": "arjun@datasphere.io",
        "title": "Data Science Intern",
        "description": (
            "Work on predictive models for retail demand forecasting. Responsibilities include "
            "cleaning datasets with Pandas, building models in scikit-learn, running experiments, "
            "and presenting findings. SQL proficiency expected."
        ),
        "location": "Bengaluru (Onsite)",
        "stipend": "₹25,000/month",
        "duration": "6 months",
        "required_skills": ["Python", "Pandas", "scikit-learn", "SQL", "Statistics"],
    },
    {
        "recruiter_email": "arjun@datasphere.io",
        "title": "Embedded Systems Intern",
        "description": (
            "Develop firmware for our industrial IoT sensor line. You will write Embedded C for "
            "ARM Cortex-M microcontrollers, debug I2C/SPI peripherals, and support hardware "
            "bring-up alongside the electronics team."
        ),
        "location": "Pune (Onsite)",
        "stipend": "₹20,000/month",
        "duration": "6 months",
        "required_skills": ["Embedded C", "ARM Cortex-M", "I2C", "SPI", "RTOS"],
    },
]

# (student email, internship title)
APPLICATIONS = [
    ("ananya@bput.ac.in", "Backend Developer Intern"),
    ("rohit@bput.ac.in", "Backend Developer Intern"),
    ("priyanka@bput.ac.in", "Backend Developer Intern"),
    ("rohit@bput.ac.in", "Frontend Engineer Intern"),
    ("priyanka@bput.ac.in", "Frontend Engineer Intern"),
    ("debasish@bput.ac.in", "Data Science Intern"),
    ("ananya@bput.ac.in", "Data Science Intern"),
    ("sneha@bput.ac.in", "Embedded Systems Intern"),
    ("manoj@bput.ac.in", "Embedded Systems Intern"),
]


async def seed(run_ai: bool) -> None:
    if not await ping():
        raise SystemExit("Cannot reach PostgreSQL. Check DATABASE_URL in .env")

    await init_db()

    async with get_session() as session:
        for model in (Application, Recommendation, SkillGapReport, Internship, Student, Recruiter, User):
            await session.execute(delete(model))
        await session.commit()

        async def make_user(name: str, email: str, role: str) -> str:
            # Seeded accounts are pre-trusted (not created via public self-registration),
            # so they skip the email-verification step and can log in immediately.
            user = User(name=name, email=email, password_hash=hash_password(PASSWORD), role=role, is_verified=True)
            session.add(user)
            await session.flush()
            return user.id

        # --- Admin (placement officer) ---
        await make_user("Placement Cell", "admin@bput.ac.in", "admin")

        # --- Students ---
        student_user_ids: dict[str, str] = {}
        for student in STUDENTS:
            user_id = await make_user(student["name"], student["email"], "student")
            session.add(
                Student(
                    user_id=user_id,
                    name=student["name"],
                    email=student["email"],
                    branch=student["branch"],
                    year=student["year"],
                    cgpa=student["cgpa"],
                    skills=student["skills"],
                    projects=student["projects"],
                    certifications=student["certifications"],
                    interests=student["interests"],
                    resume_text=student["resume_text"],
                )
            )
            student_user_ids[student["email"]] = user_id

        # --- Recruiters + internships ---
        recruiter_ids: dict[str, str] = {}
        for recruiter in RECRUITERS:
            user_id = await make_user(recruiter["name"], recruiter["email"], "recruiter")
            session.add(Recruiter(user_id=user_id, name=recruiter["name"], email=recruiter["email"], company=recruiter["company"]))
            recruiter_ids[recruiter["email"]] = user_id

        internship_ids: dict[str, str] = {}
        for internship in INTERNSHIPS:
            company = next(r["company"] for r in RECRUITERS if r["email"] == internship["recruiter_email"])
            row = Internship(
                recruiter_id=recruiter_ids[internship["recruiter_email"]],
                company=company,
                title=internship["title"],
                description=internship["description"],
                location=internship["location"],
                stipend=internship["stipend"],
                duration=internship["duration"],
                required_skills=internship["required_skills"],
                status="open",
            )
            session.add(row)
            await session.flush()
            internship_ids[internship["title"]] = row.id

        # --- Applications ---
        for student_email, title in APPLICATIONS:
            student = next(s for s in STUDENTS if s["email"] == student_email)
            internship = next(i for i in INTERNSHIPS if i["title"] == title)
            session.add(
                Application(
                    internship_id=internship_ids[title],
                    internship_title=title,
                    company=next(r["company"] for r in RECRUITERS if r["email"] == internship["recruiter_email"]),
                    student_name=student["name"],
                    user_id=student_user_ids[student_email],
                    status="applied",
                )
            )

        await session.commit()

        print(
            f"Seeded {len(STUDENTS)} students, {len(RECRUITERS)} recruiters, "
            f"{len(INTERNSHIPS)} internships, {len(APPLICATIONS)} applications."
        )

        if run_ai:
            await _run_ai_analysis(session)

    print("\nDemo logins (password: demo1234)")
    print("  admin@bput.ac.in      — placement officer / analytics dashboard")
    print("  kavita@technova.com   — recruiter (TechNova Solutions)")
    print("  arjun@datasphere.io   — recruiter (DataSphere Analytics)")
    for student in STUDENTS:
        print(f"  {student['email']:<22}— student ({student['branch']})")


async def _run_ai_analysis(session) -> None:
    """Run real Llama resume analysis for each seeded student."""
    from datetime import datetime, timezone

    from app.modules.ai_service import service as ai

    print("\nRunning LLM resume analysis for seeded students (this takes a minute)...")
    for student in STUDENTS:
        try:
            analysis = await ai.analyze_resume(student["resume_text"])
        except Exception as exc:
            print(f"  {student['name']}: analysis failed — {exc}")
            continue

        result = await session.execute(select(Student).where(Student.email == student["email"]))
        row = result.scalar_one_or_none()
        if row is None:
            continue
        row.readiness_score = analysis["readiness_score"]
        row.resume_summary = analysis["summary"]
        row.experience_years = analysis["experience_years"]
        row.skills = list(dict.fromkeys([*student["skills"], *analysis["skills"]]))
        row.last_analyzed_at = datetime.now(timezone.utc)
        print(f"  {student['name']}: readiness {analysis['readiness_score']}/100")

    await session.commit()


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--ai",
        action="store_true",
        help="run real LLM resume analysis on seeded students (requires Ollama)",
    )
    args = parser.parse_args()
    try:
        await seed(args.ai)
    finally:
        await close_engine()


if __name__ == "__main__":
    asyncio.run(main())
