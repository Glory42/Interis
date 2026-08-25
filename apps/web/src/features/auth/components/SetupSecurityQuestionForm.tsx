import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isApiError } from "@/lib/api-client";
import { useSetSecurityQuestion } from "@/features/auth/hooks/useAuth";

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
      await setSecurityQuestion({ question, answer });
      await navigate({ to: "/" });
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.message);
        return;
      }

      setFormError("Unexpected error. Please try again.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
        Write your own security question and answer — this is the only way to reset your
        password or change your email later, so pick something only you would know.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="security-question-question"
          >
            Your question
          </label>
          <Input
            id="security-question-question"
            name="question"
            type="text"
            placeholder="e.g. What was the first film you watched in a cinema?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            minLength={4}
            maxLength={200}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="security-question-answer"
          >
            Your answer
          </label>
          <Input
            id="security-question-answer"
            name="answer"
            type="text"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            maxLength={200}
            required
          />
        </div>

        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save and continue"}
        </Button>
      </form>
    </div>
  );
};
