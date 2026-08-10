from pydantic import BaseModel, Field


class ProgressUpdateSchema(BaseModel):
    lesson_id: str
    completed: bool = True


class MockTestSubmissionSchema(BaseModel):
    answers: dict[str, int]  # question_index -> selected_option_index
