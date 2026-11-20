export function QuestionImage({ url, title }) {
  return (
    <img
      className="question-image"
      src={url}
      alt={title}
      referrerPolicy="no-referrer"
    />
  );
}
