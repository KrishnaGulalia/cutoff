import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
const blank = () => ({
  selectedOptions: [],
  numericalResponse: null,
  markedForReview: false,
  timeSpentSeconds: 0,
});
export function useAttempt(id) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [saveState, setSaveState] = useState("All changes saved");
  const state = useRef({
    answers: {},
    dirty: new Set(),
    revisions: {},
    index: 0,
    data: null,
    lastTime: Date.now(),
    paused: false,
    visible: !document.hidden,
  });
  const queue = useRef(Promise.resolve());
  const debounce = useRef(null);
  const alive = useRef(true);
  function recordTime() {
    const current = state.current;
    const seconds = Math.floor((Date.now() - current.lastTime) / 1000);
    current.lastTime += seconds * 1000;
    if (!seconds || current.paused || !current.data || !current.visible) return;
    const questionId = current.data.questions[current.index].question_id;
    const answer = current.answers[questionId] || blank();
    current.answers[questionId] = {
      ...answer,
      timeSpentSeconds: Math.min(86400, answer.timeSpentSeconds + seconds),
    };
    current.dirty.add(questionId);
    current.revisions[questionId] = (current.revisions[questionId] || 0) + 1;
  }
  function save() {
    recordTime();
    // One request queue prevents older network responses overwriting newer answers.
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        const current = state.current;
        if (!current.dirty.size) return;
        if (alive.current) setSaveState("Saving…");
        try {
          for (const questionId of [...current.dirty]) {
            const revision = current.revisions[questionId];
            await api("/attempts/" + id + "/answers/" + questionId, {
              method: "PUT",
              body: current.answers[questionId],
            });
            if (revision === current.revisions[questionId])
              current.dirty.delete(questionId);
          }
          if (alive.current)
            setSaveState(
              current.dirty.size ? "Unsaved changes" : "All changes saved",
            );
        } catch (error) {
          if (alive.current)
            setSaveState(
              error.status === 409
                ? "Attempt ended — open results"
                : "Not saved — check connection and retry",
            );
          throw error;
        }
      });
    return queue.current;
  }
  function change(patch) {
    const current = state.current;
    if (current.paused) return;
    recordTime();
    const questionId = current.data.questions[current.index].question_id;
    current.answers[questionId] = {
      ...(current.answers[questionId] || blank()),
      ...patch,
    };
    current.dirty.add(questionId);
    current.revisions[questionId] = (current.revisions[questionId] || 0) + 1;
    setAnswers({ ...current.answers });
    setSaveState("Unsaved changes");
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => save().catch(() => {}), 600);
  }
  function navigate(next) {
    recordTime();
    state.current.index = next;
    state.current.lastTime = Date.now();
    setIndex(next);
    setAnswers({ ...state.current.answers });
    save().catch(() => {});
  }
  async function submit() {
    recordTime();
    state.current.paused = true;
    clearTimeout(debounce.current);
    try {
      try {
        await save();
      } catch (error) {
        if (error.status !== 409) throw error;
      }
      return await api("/attempts/" + id + "/submit", { method: "POST" });
    } catch (error) {
      state.current.paused = false;
      state.current.lastTime = Date.now();
      throw error;
    }
  }
  useEffect(() => {
    alive.current = true;
    api("/attempts/" + id)
      .then((result) => {
        if (!alive.current) return;
        const restored = {};
        for (const answer of result.answers)
          restored[answer.question_id] = {
            selectedOptions: answer.selectedOptions,
            numericalResponse:
              answer.numerical_response === null
                ? null
                : Number(answer.numerical_response),
            markedForReview: answer.marked_for_review,
            timeSpentSeconds: answer.time_spent_seconds,
          };
        state.current = {
          answers: restored,
          dirty: new Set(),
          revisions: {},
          index: 0,
          data: result,
          lastTime: Date.now(),
          paused: result.attempt.attempt_status === "SUBMITTED",
          visible: !document.hidden,
        };
        setAnswers(restored);
        setData(result);
      })
      .catch((error) => {
        if (alive.current) setError(error.message);
      });
    const timer = setInterval(() => {
      if (state.current.data && !state.current.paused) save().catch(() => {});
    }, 10000);
    const warn = (event) => {
      if (state.current.dirty.size) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const visibility = () => {
      recordTime();
      state.current.visible = !document.hidden;
      state.current.lastTime = Date.now();
      if (document.hidden && state.current.data && !state.current.paused)
        save().catch(() => {});
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      alive.current = false;
      clearInterval(timer);
      clearTimeout(debounce.current);
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [id]);
  return {
    data,
    error,
    answers,
    index,
    saveState,
    change,
    navigate,
    save,
    submit,
    hasUnsavedChanges: () =>
      state.current.dirty.size > 0 && !state.current.paused,
    currentAnswer: data
      ? answers[data.questions[index].question_id] || blank()
      : blank(),
  };
}
