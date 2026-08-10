from datetime import datetime, timezone
from sqlalchemy import select
from fastapi import HTTPException

from app.db.models import Course, DailyMockTest, MockTestSubmission, SkillGapReport, Student, StudentCourseEnrollment, StudentSkillProgress
from app.db.postgres import get_session


# Pre-defined curated courses seed if database is fresh
INITIAL_COURSES = [
    {
        "id": "c1",
        "title": "Python & FastAPI Backend Masterclass",
        "description": "Learn to build high-performance async REST APIs with Python 3.12, FastAPI, and SQLAlchemy Postgres.",
        "skill_category": "Python",
        "difficulty": "Intermediate",
        "duration": "5 hours",
        "lessons": [
            {"id": "l1", "title": "1. Python Asyncio & Type Hints Fundamentals", "duration": "45 mins"},
            {"id": "l2", "title": "2. FastAPI Dependency Injection & Pydantic V2", "duration": "60 mins"},
            {"id": "l3", "title": "3. SQLAlchemy 2.0 Async Session Management", "duration": "75 mins"},
            {"id": "l4", "title": "4. JWT Authentication & Role-Based Authorization", "duration": "60 mins"},
            {"id": "l5", "title": "5. Production Deployment on Render & Dockerization", "duration": "60 mins"},
        ],
    },
    {
        "id": "c2",
        "title": "Modern React 19 & Tailwind CSS System Design",
        "description": "Master interactive UI building with React hooks, Vite, Context API, and modern design systems.",
        "skill_category": "React",
        "difficulty": "Beginner",
        "duration": "4 hours",
        "lessons": [
            {"id": "l201", "title": "1. React State Management & Custom Hooks", "duration": "50 mins"},
            {"id": "l202", "title": "2. Tailwind CSS Grid & Glassmorphism Design", "duration": "40 mins"},
            {"id": "l203", "title": "3. Fetching APIs & Global Context Providers", "duration": "60 mins"},
            {"id": "l204", "title": "4. Client-side Routing with React Router 6", "duration": "50 mins"},
        ],
    },
    {
        "id": "c3",
        "title": "PostgreSQL & Database Optimization for Developers",
        "description": "Write fast SQL queries, master indexes, JSONB column querying, and database schema migrations.",
        "skill_category": "PostgreSQL",
        "difficulty": "Intermediate",
        "duration": "6 hours",
        "lessons": [
            {"id": "l301", "title": "1. Relational Schema Design & Normalization", "duration": "60 mins"},
            {"id": "l302", "title": "2. Advanced Indexing (B-Tree, GIN, GiST)", "duration": "90 mins"},
            {"id": "l303", "title": "3. Query Execution Plans & EXPLAIN ANALYZE", "duration": "75 mins"},
            {"id": "l304", "title": "4. Working with JSONB & Semi-Structured Data", "duration": "75 mins"},
        ],
    },
    {
        "id": "c4",
        "title": "Docker, CI/CD & Cloud Infrastructure",
        "description": "Containerize microservices, write GitHub Actions workflows, and deploy resilient web apps to the cloud.",
        "skill_category": "Docker",
        "difficulty": "Advanced",
        "duration": "4.5 hours",
        "lessons": [
            {"id": "l401", "title": "1. Multi-Stage Docker Builds & Image Optimization", "duration": "60 mins"},
            {"id": "l402", "title": "2. Docker Compose for Local Multi-Container Services", "duration": "60 mins"},
            {"id": "l403", "title": "3. Automated Testing & Production Deployment", "duration": "70 mins"},
        ],
    },
]

INITIAL_MOCK_TESTS = [
    {
        "id": "t1",
        "date": "today",
        "skill_category": "Python",
        "title": "Daily Python & Async Programming Challenge",
        "questions": [
            {
                "id": "q1",
                "question": "Which Python module is used to write single-threaded concurrent code using coroutines?",
                "options": ["threading", "multiprocessing", "asyncio", "concurrent.futures"],
                "correct": 2,
                "explanation": "asyncio is Python's standard library for running asynchronous IO-bound code with coroutines.",
            },
            {
                "id": "q2",
                "question": "In FastAPI, what is the recommended way to declare query parameters with default values?",
                "options": ["Using request.query", "Function parameter default values", "Global variables", "URL path string matching"],
                "correct": 1,
                "explanation": "FastAPI automatically infers route parameters as query parameters when assigned default function arguments.",
            },
            {
                "id": "q3",
                "question": "What is the time complexity of looking up a key in a standard Python dictionary?",
                "options": ["O(N)", "O(log N)", "O(1) average case", "O(N log N)"],
                "correct": 2,
                "explanation": "Python dictionaries are implemented using hash tables, providing average O(1) time complexity.",
            },
        ],
    },
    {
        "id": "t2",
        "date": "today",
        "skill_category": "React",
        "title": "Daily Frontend & React State Quiz",
        "questions": [
            {
                "id": "q201",
                "question": "Which hook should be used to memoize expensive computations in React?",
                "options": ["useCallback", "useMemo", "useEffect", "useRef"],
                "correct": 1,
                "explanation": "useMemo caches the result of a calculation between re-renders.",
            },
            {
                "id": "q202",
                "question": "What happens when you update state in React via useState setter function?",
                "options": ["Component re-renders asynchronously", "Page reloads", "DOM is modified directly", "State updates synchronously"],
                "correct": 0,
                "explanation": "React schedules a re-render asynchronously when state changes.",
            },
        ],
    },
]


async def seed_learning_data_if_needed():
    """Ensure baseline courses and mock tests exist in database."""
    async with get_session() as session:
        result = await session.execute(select(Course))
        if not result.scalars().all():
            for c in INITIAL_COURSES:
                session.add(Course(**c))
            for t in INITIAL_MOCK_TESTS:
                session.add(DailyMockTest(**t))
            await session.commit()


async def list_courses() -> list[dict]:
    await seed_learning_data_if_needed()
    async with get_session() as session:
        result = await session.execute(select(Course).order_by(Course.created_at.asc()))
        return [c.to_dict() for c in result.scalars().all()]


async def get_user_enrollments(user_id: str) -> list[dict]:
    async with get_session() as session:
        result = await session.execute(select(StudentCourseEnrollment).where(StudentCourseEnrollment.user_id == user_id))
        return [e.to_dict() for e in result.scalars().all()]


async def enroll_course(user_id: str, course_id: str) -> dict:
    async with get_session() as session:
        course = await session.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        res = await session.execute(
            select(StudentCourseEnrollment).where(
                StudentCourseEnrollment.user_id == user_id,
                StudentCourseEnrollment.course_id == course_id,
            )
        )
        existing = res.scalar_one_or_none()
        if existing:
            return existing.to_dict()

        enrollment = StudentCourseEnrollment(
            user_id=user_id,
            course_id=course_id,
            progress_percent=0,
            completed_lessons=[],
            status="enrolled",
        )
        session.add(enrollment)
        await session.commit()
        await session.refresh(enrollment)
        return enrollment.to_dict()


async def update_course_progress(user_id: str, course_id: str, lesson_id: str) -> dict:
    async with get_session() as session:
        course = await session.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        res = await session.execute(
            select(StudentCourseEnrollment).where(
                StudentCourseEnrollment.user_id == user_id,
                StudentCourseEnrollment.course_id == course_id,
            )
        )
        enrollment = res.scalar_one_or_none()
        if not enrollment:
            enrollment = StudentCourseEnrollment(
                user_id=user_id,
                course_id=course_id,
                progress_percent=0,
                completed_lessons=[],
                status="enrolled",
            )
            session.add(enrollment)
            await session.flush()

        completed = set(enrollment.completed_lessons or [])
        completed.add(lesson_id)
        enrollment.completed_lessons = list(completed)

        total_lessons = len(course.lessons or [])
        if total_lessons > 0:
            enrollment.progress_percent = min(100, round((len(completed) / total_lessons) * 100))
            if enrollment.progress_percent >= 100:
                enrollment.status = "completed"

                # Auto-add course skill category to student profile
                student_res = await session.execute(select(Student).where(Student.user_id == user_id))
                student = student_res.scalar_one_or_none()
                if student:
                    skills = list(student.skills or [])
                    if course.skill_category not in skills:
                        skills.append(course.skill_category)
                        student.skills = skills

        await session.commit()
        await session.refresh(enrollment)
        return enrollment.to_dict()


async def get_daily_mock_tests() -> list[dict]:
    await seed_learning_data_if_needed()
    async with get_session() as session:
        result = await session.execute(select(DailyMockTest).order_by(DailyMockTest.created_at.desc()))
        return [t.to_dict() for t in result.scalars().all()]


async def submit_mock_test(user_id: str, test_id: str, user_answers: dict[str, int]) -> dict:
    async with get_session() as session:
        test = await session.get(DailyMockTest, test_id)
        if not test:
            raise HTTPException(status_code=404, detail="Mock test not found")

        questions = test.questions or []
        correct_count = 0
        for idx, q in enumerate(questions):
            ans = user_answers.get(str(idx))
            if ans is not None and int(ans) == q.get("correct"):
                correct_count += 1

        total = len(questions)
        score_percent = round((correct_count / total) * 100) if total > 0 else 0
        passed = score_percent >= 60

        submission = MockTestSubmission(
            user_id=user_id,
            test_id=test_id,
            score_percent=score_percent,
            answers=user_answers,
            passed=passed,
        )
        session.add(submission)

        # Update XP points in StudentSkillProgress
        progress_res = await session.execute(
            select(StudentSkillProgress).where(
                StudentSkillProgress.user_id == user_id,
                StudentSkillProgress.skill_name == test.skill_category,
            )
        )
        skill_prog = progress_res.scalar_one_or_none()
        if not skill_prog:
            skill_prog = StudentSkillProgress(
                user_id=user_id,
                skill_name=test.skill_category,
                status="in_progress",
                xp_points=0,
            )
            session.add(skill_prog)

        skill_prog.xp_points = (skill_prog.xp_points or 0) + (score_percent * 2)
        if passed:
            skill_prog.status = "mastered"
            skill_prog.mastered_at = datetime.now(timezone.utc)

            # Auto add skill to student profile
            student_res = await session.execute(select(Student).where(Student.user_id == user_id))
            student = student_res.scalar_one_or_none()
            if student:
                skills = list(student.skills or [])
                if test.skill_category not in skills:
                    skills.append(test.skill_category)
                    student.skills = skills

        await session.commit()
        return {
            "score_percent": score_percent,
            "correct_count": correct_count,
            "total_questions": total,
            "passed": passed,
            "xp_earned": score_percent * 2,
            "questions": questions,
        }


async def get_skill_tree(user_id: str) -> dict:
    """Generate dynamic Skill Tree & Roadmap connected to SkillGapReport and student profile."""
    async with get_session() as session:
        student_res = await session.execute(select(Student).where(Student.user_id == user_id))
        student = student_res.scalar_one_or_none()
        student_skills = set(student.skills or []) if student else set()

        gap_res = await session.execute(select(SkillGapReport).order_by(SkillGapReport.created_at.desc()).limit(1))
        latest_gap = gap_res.scalar_one_or_none()
        high_demand_gaps = {g.get("skill", "").strip().title() for g in (latest_gap.skill_gaps if latest_gap else [])}

        prog_res = await session.execute(select(StudentSkillProgress).where(StudentSkillProgress.user_id == user_id))
        user_skill_progs = {p.skill_name.strip().title(): p for p in prog_res.scalars().all()}

        enroll_res = await session.execute(select(StudentCourseEnrollment).where(StudentCourseEnrollment.user_id == user_id))
        user_enrollments = enroll_res.scalars().all()
        enrolled_course_ids = {e.course_id for e in user_enrollments}

        courses_res = await session.execute(select(Course))
        all_courses = courses_res.scalars().all()
        courses_by_skill = {c.skill_category.strip().title(): c for c in all_courses}

    # Define standard CS Skill Tree Hierarchy
    tree_nodes = [
        {"id": "cs_core", "name": "CS & Programming Fundamentals", "branch": "Core", "prereqs": []},
        {"id": "python", "name": "Python", "branch": "Backend & AI", "prereqs": ["cs_core"]},
        {"id": "javascript", "name": "JavaScript", "branch": "Web Tech", "prereqs": ["cs_core"]},
        {"id": "sql", "name": "PostgreSQL & SQL", "branch": "Data", "prereqs": ["cs_core"]},
        {"id": "django", "name": "Django", "branch": "Backend", "prereqs": ["python"]},
        {"id": "fastapi", "name": "FastAPI", "branch": "Backend", "prereqs": ["python"]},
        {"id": "react", "name": "React", "branch": "Frontend", "prereqs": ["javascript"]},
        {"id": "docker", "name": "Docker & Containers", "branch": "DevOps", "prereqs": ["cs_core"]},
        {"id": "scikit-learn", "name": "scikit-learn & Data Science", "branch": "AI & ML", "prereqs": ["python", "sql"]},
        {"id": "embedded_c", "name": "Embedded C & IoT", "branch": "Hardware", "prereqs": ["cs_core"]},
    ]

    processed_nodes = []
    for node in tree_nodes:
        name = node["name"].split("&")[0].strip().title()
        is_mastered = name in student_skills or name.lower() in {s.lower() for s in student_skills}
        is_hot_gap = name in high_demand_gaps or any(gap.lower() in name.lower() for gap in high_demand_gaps)

        linked_course = courses_by_skill.get(name) or courses_by_skill.get("Python")
        is_enrolled = linked_course and linked_course.id in enrolled_course_ids

        if is_mastered:
            status = "mastered"
        elif is_enrolled:
            status = "in_progress"
        elif is_hot_gap:
            status = "recommended"
        else:
            status = "available"

        processed_nodes.append({
            **node,
            "status": status,
            "is_hot_demand_gap": is_hot_gap,
            "linked_course_id": linked_course.id if linked_course else None,
            "linked_course_title": linked_course.title if linked_course else None,
            "xp_earned": user_skill_progs.get(name).xp_points if name in user_skill_progs else (100 if is_mastered else 0),
        })

    return {
        "nodes": processed_nodes,
        "high_demand_gaps": list(high_demand_gaps),
        "total_skills_mastered": sum(1 for n in processed_nodes if n["status"] == "mastered"),
        "total_hot_gaps_addressed": sum(1 for n in processed_nodes if n["is_hot_demand_gap"] and n["status"] == "mastered"),
    }


async def get_program_tracker(user_id: str) -> dict:
    async with get_session() as session:
        student_res = await session.execute(select(Student).where(Student.user_id == user_id))
        student = student_res.scalar_one_or_none()

        enroll_res = await session.execute(select(StudentCourseEnrollment).where(StudentCourseEnrollment.user_id == user_id))
        enrollments = enroll_res.scalars().all()

        submissions_res = await session.execute(select(MockTestSubmission).where(MockTestSubmission.user_id == user_id))
        submissions = submissions_res.scalars().all()

        prog_res = await session.execute(select(StudentSkillProgress).where(StudentSkillProgress.user_id == user_id))
        progresses = prog_res.scalars().all()

    total_xp = sum(p.xp_points or 0 for p in progresses) + sum(s.score_percent * 2 for s in submissions)
    completed_courses = sum(1 for e in enrollments if e.status == "completed")
    passed_tests = sum(1 for s in submissions if s.passed)

    return {
        "student_name": student.name if student else "Student",
        "readiness_score": student.readiness_score if student else 75,
        "total_xp": total_xp,
        "enrolled_courses": len(enrollments),
        "completed_courses": completed_courses,
        "mock_tests_attempted": len(submissions),
        "mock_tests_passed": passed_tests,
        "daily_streak": min(len(submissions) + 1, 7),
        "mastered_skills_count": len(student.skills) if student and student.skills else 0,
    }
