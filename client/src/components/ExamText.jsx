import katex from "katex";

export function ExamText({ text }) {
  return (
    <span className="exam-text">
      {text.split(/(\$[^$\n]+\$)/g).map((part, index) => {
        if (!(part.startsWith("$") && part.endsWith("$") && part.length > 2))
          return part;
        const math = katex.renderToString(part.slice(1, -1), {
          output: "mathml",
          trust: false,
          throwOnError: false,
        });
        return (
          <span
            key={index}
            className="exam-formula"
            dangerouslySetInnerHTML={{ __html: math }}
          />
        );
      })}
    </span>
  );
}
