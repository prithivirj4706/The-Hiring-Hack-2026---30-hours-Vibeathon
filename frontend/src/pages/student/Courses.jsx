import { useEffect, useState } from 'react'
import { AiChip, Alert, Badge, Button, Card, Icon, ProgressBar, SectionTitle, Spinner } from '../../components/ui'
import { enrollCourse, getCourses, getEnrollments, updateCourseProgress } from '../../services/learningService'

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCourse, setActiveCourse] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = () => {
    Promise.all([getCourses(), getEnrollments()])
      .then(([cList, eList]) => {
        setCourses(cList)
        const map = {}
        eList.forEach((e) => {
          map[e.course_id] = e
        })
        setEnrollments(map)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleEnroll(courseId) {
    setActionLoading(true)
    try {
      await enrollCourse(courseId)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleLessonToggle(courseId, lessonId) {
    setActionLoading(true)
    try {
      await updateCourseProgress(courseId, lessonId)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <Spinner label="Loading skill masterclass courses..." />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Skill Courses & Masterclasses</h1>
          <AiChip>Curated Modules</AiChip>
        </div>
        <p className="text-sm text-on-surface-variant">
          Complete targeted learning tracks to bridge skill gaps identified by BPUT placement recruiters.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {courses.map((course) => {
          const enrollment = enrollments[course.id]
          const isEnrolled = !!enrollment
          const progress = enrollment?.progress_percent || 0
          const completedLessons = new Set(enrollment?.completed_lessons || [])

          return (
            <Card key={course.id} className="flex flex-col justify-between gap-4 border border-outline-variant/60">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Badge tone="primary">{course.skill_category}</Badge>
                  <span className="text-xs font-semibold text-on-surface-variant">{course.duration} • {course.difficulty}</span>
                </div>

                <h3 className="text-lg font-bold text-on-surface">{course.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{course.description}</p>

                {isEnrolled && (
                  <div className="mt-2">
                    <ProgressBar value={progress} label="Course Completion" />
                  </div>
                )}
              </div>

              {/* Lesson Checklist / Actions */}
              <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/40">
                {activeCourse?.id === course.id ? (
                  <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface">Lessons & Modules</span>
                      <button onClick={() => setActiveCourse(null)} className="text-xs text-outline hover:text-on-surface">Close</button>
                    </div>

                    {course.lessons?.map((lesson) => {
                      const isDone = completedLessons.has(lesson.id)
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => handleLessonToggle(course.id, lesson.id)}
                          className={`flex items-center justify-between rounded-md p-2 text-xs cursor-pointer transition-colors ${
                            isDone ? 'bg-emerald-50 text-emerald-900 font-medium' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon name={isDone ? 'check_box' : 'check_box_outline_blank'} className={isDone ? 'text-emerald-600' : 'text-outline'} />
                            <span>{lesson.title}</span>
                          </div>
                          <span className="text-[10px] text-outline">{lesson.duration}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  {isEnrolled ? (
                    <Button
                      variant={activeCourse?.id === course.id ? 'ghost' : 'secondary'}
                      onClick={() => setActiveCourse(activeCourse?.id === course.id ? null : course)}
                      className="w-full justify-center !py-2 text-xs"
                    >
                      <Icon name="play_lesson" className="!text-sm" />
                      {activeCourse?.id === course.id ? 'Hide Lessons' : 'Continue Learning'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => handleEnroll(course.id)}
                      disabled={actionLoading}
                      className="w-full justify-center !py-2 text-xs"
                    >
                      Enroll in Course
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
