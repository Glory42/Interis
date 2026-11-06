import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

describe("auth forms", () => {
  it("lets password managers save the email, not the handle, on sign-up", async () => {
    renderWithProviders(<RegisterForm />);

    expect(await screen.findByLabelText("Email")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Username")).toHaveAttribute("autocomplete", "off");
  });

  it("leaves password length checks on sign-in to the server", async () => {
    renderWithProviders(<LoginForm />);

    expect(await screen.findByLabelText("Password")).not.toHaveAttribute("minlength");
  });
});
