import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSetSecurityQuestion } from "@/features/auth/hooks/useAuth";
import { AccountField } from "@/features/settings/components/account/AccountField";
import { isApiError } from "@/lib/api-client";

const ANSWER_MAX = 200;

// Prompts only fill the field; the person still owns the wording.
const PROMPTS = [
  { chip: "First film in a cinema?", question: "What was the first film you watched in a cinema?" },
  { chip: "Most rewatched film?", question: "Which film have you rewatched the most?" },
  { chip: "Street you grew up on?", question: "What street did you grow up on?" },
];

export const SetupSecurityQuestionForm = () => {
  const navigate = useNavigate();
  const { mutateAsync: setSecurityQuestion, isPending } = useSetSecurityQuestion();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    try {
      await setSecurityQuestion({ question: question.trim(), answer });
      await navigate({ to: "/" });
    } catch (error) {
      setFormError(isApiError(error) ? error.message : "Unexpected error. Please try again.");
    }
  };

  return (
    <div>
      <h1 className="display-2 leading-tight text-foreground">Set a question only you can answer.</h1>
      <p className="body mt-2 text-muted-foreground">
        Interis doesn't send reset emails. If you forget your password, this question is how you get back in.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <p className="kicker mb-1.5 text-muted-foreground">Pick one or write your own</p>
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt.chip}
                type="button"
                aria-pressed={question === prompt.question}
                onClick={() => setQuestion(prompt.question)}
                className="body-s rounded-[2px] border border-[color:var(--line)] px-2.5 py-1 text-muted-foreground hover:text-foreground aria-pressed:border-[color:var(--primary)] aria-pressed:text-foreground"
              >
                {prompt.chip}
              </button>
            ))}
          </div>
        </div>

        <AccountField
          id="security-question-question"
          name="question"
          label="Your question"
          autoComplete="off"
          minLength={4}
          maxLength={200}
          value={question}
          onValueChange={setQuestion}
          required
        />
        <div>
          <AccountField
            id="security-question-answer"
            name="answer"
            label="Your answer"
            autoComplete="off"
            maxLength={ANSWER_MAX}
            value={answer}
            onValueChange={setAnswer}
            required
          />
          <p className="mono-meta mt-1 flex justify-between text-muted-foreground">
            <span>Capitals and spaces at either end don't matter when you answer later.</span>
            <span>{`${answer.length} / ${ANSWER_MAX}`}</span>
          </p>
        </div>

        {formError ? (
          <p role="alert" className="body-s text-[color:var(--danger)]">
            {formError}
          </p>
        ) : null}

        <Button className="w-full" size="md" type="submit" disabled={isPending || question.trim().length < 4 || !answer.trim()}>
          {isPending ? "Saving…" : "Save and open my diary"}
        </Button>
      </form>
    </div>
  );
};
